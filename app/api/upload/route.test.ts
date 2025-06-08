import { NextRequest } from 'next/server'
import { POST } from './route'

// Mock AWS services
const mockUploadImageToS3 = jest.fn()
const mockDetectFoodIngredients = jest.fn()

jest.mock('@/lib/aws/s3', () => ({
  uploadImageToS3: (...args: any[]) => mockUploadImageToS3(...args),
}))

jest.mock('@/lib/aws/rekognition', () => ({
  detectFoodIngredients: (...args: any[]) => mockDetectFoodIngredients(...args),
}))

// Mock next-auth
const mockGetServerSession = jest.fn()
jest.mock('next-auth', () => ({
  getServerSession: () => mockGetServerSession(),
}))

// Mock authOptions
jest.mock('@/app/api/auth/[...nextauth]/route', () => ({
  authOptions: {},
}))

// Mock validation
jest.mock('@/lib/validations', () => ({
  uploadImageSchema: {
    parse: jest.fn(),
  },
}))

const { uploadImageSchema } = require('@/lib/validations')

describe('/api/upload', () => {
  beforeEach(() => {
    jest.clearAllMocks()
    
    // Default mocks
    mockUploadImageToS3.mockResolvedValue({
      imageUrl: 'https://example.com/image.jpg',
      key: 'uploads/test-key.jpg',
    })
    
    mockDetectFoodIngredients.mockResolvedValue({
      ingredients: [
        { name: '鶏肉', confidence: 0.95 },
        { name: '玉ねぎ', confidence: 0.88 },
      ],
    })
    
    uploadImageSchema.parse.mockReturnValue({
      image: 'data:image/jpeg;base64,fake-data',
      filename: 'test.jpg',
    })
  })

  it('should upload image and detect ingredients successfully', async () => {
    const request = new NextRequest('http://localhost:3000/api/upload', {
      method: 'POST',
      body: JSON.stringify({
        image: 'data:image/jpeg;base64,fake-data',
        filename: 'test.jpg',
      }),
    })

    const response = await POST(request)
    const data = await response.json()

    expect(response.status).toBe(200)
    expect(data.data.imageUrl).toBe('https://example.com/image.jpg')
    expect(data.data.analysis.ingredients).toHaveLength(2)
    expect(data.data.analysis.ingredients[0].name).toBe('鶏肉')
    expect(mockUploadImageToS3).toHaveBeenCalledWith(
      'data:image/jpeg;base64,fake-data',
      'test.jpg',
      'anonymous'
    )
    expect(mockDetectFoodIngredients).toHaveBeenCalledWith('https://example.com/image.jpg')
  })

  it('should use authenticated user ID when logged in', async () => {
    mockGetServerSession.mockResolvedValue({
      user: { id: 'user-123' },
    })

    const request = new NextRequest('http://localhost:3000/api/upload', {
      method: 'POST',
      body: JSON.stringify({
        image: 'data:image/jpeg;base64,fake-data',
        filename: 'test.jpg',
      }),
    })

    await POST(request)

    expect(mockUploadImageToS3).toHaveBeenCalledWith(
      'data:image/jpeg;base64,fake-data',
      'test.jpg',
      'user-123'
    )
  })

  it('should handle validation errors', async () => {
    uploadImageSchema.parse.mockImplementation(() => {
      throw new Error('Invalid image format')
    })

    const request = new NextRequest('http://localhost:3000/api/upload', {
      method: 'POST',
      body: JSON.stringify({
        image: 'invalid-data',
        filename: 'test.jpg',
      }),
    })

    const response = await POST(request)
    const data = await response.json()

    expect(response.status).toBe(400)
    expect(data.error).toContain('Invalid image format')
  })

  it('should handle S3 upload errors', async () => {
    mockUploadImageToS3.mockRejectedValue(new Error('S3 upload failed'))

    const request = new NextRequest('http://localhost:3000/api/upload', {
      method: 'POST',
      body: JSON.stringify({
        image: 'data:image/jpeg;base64,fake-data',
        filename: 'test.jpg',
      }),
    })

    const response = await POST(request)
    const data = await response.json()

    expect(response.status).toBe(500)
    expect(data.error).toContain('S3 upload failed')
  })

  it('should handle Rekognition detection errors', async () => {
    mockDetectFoodIngredients.mockRejectedValue(new Error('Recognition failed'))

    const request = new NextRequest('http://localhost:3000/api/upload', {
      method: 'POST',
      body: JSON.stringify({
        image: 'data:image/jpeg;base64,fake-data',
        filename: 'test.jpg',
      }),
    })

    const response = await POST(request)
    const data = await response.json()

    expect(response.status).toBe(500)
    expect(data.error).toContain('Recognition failed')
  })

  it('should handle missing request body', async () => {
    const request = new NextRequest('http://localhost:3000/api/upload', {
      method: 'POST',
    })

    const response = await POST(request)
    const data = await response.json()

    expect(response.status).toBe(400)
    expect(data.error).toBeDefined()
  })

  it('should handle invalid JSON in request body', async () => {
    const request = new NextRequest('http://localhost:3000/api/upload', {
      method: 'POST',
      body: 'invalid-json',
    })

    const response = await POST(request)
    const data = await response.json()

    expect(response.status).toBe(400)
    expect(data.error).toBeDefined()
  })

  it('should work in mock mode when USE_AI_MOCK is true', async () => {
    // Mock environment variable
    process.env.USE_AI_MOCK = 'true'

    const request = new NextRequest('http://localhost:3000/api/upload', {
      method: 'POST',
      body: JSON.stringify({
        image: 'data:image/jpeg;base64,fake-data',
        filename: 'test.jpg',
      }),
    })

    const response = await POST(request)
    const data = await response.json()

    expect(response.status).toBe(200)
    expect(data.data.analysis.ingredients).toBeDefined()
    
    // Clean up
    delete process.env.USE_AI_MOCK
  })

  it('should handle empty ingredients detection', async () => {
    mockDetectFoodIngredients.mockResolvedValue({
      ingredients: [],
    })

    const request = new NextRequest('http://localhost:3000/api/upload', {
      method: 'POST',
      body: JSON.stringify({
        image: 'data:image/jpeg;base64,fake-data',
        filename: 'test.jpg',
      }),
    })

    const response = await POST(request)
    const data = await response.json()

    expect(response.status).toBe(200)
    expect(data.data.analysis.ingredients).toEqual([])
  })
})