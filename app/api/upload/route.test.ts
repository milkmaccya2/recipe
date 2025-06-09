import { NextRequest } from 'next/server'
import { POST } from './route'

const mockUploadImageToS3 = jest.fn()
const mockDetectFoodIngredients = jest.fn()
const mockGetServerSession = jest.fn()

jest.mock('@/lib/aws/s3', () => ({ uploadImageToS3: (...args: any[]) => mockUploadImageToS3(...args) }))
jest.mock('@/lib/aws/rekognition', () => ({ detectFoodIngredients: (...args: any[]) => mockDetectFoodIngredients(...args) }))
jest.mock('next-auth', () => ({ getServerSession: () => mockGetServerSession() }))
jest.mock('@/app/api/auth/[...nextauth]/route', () => ({ authOptions: {} }))
jest.mock('@/lib/validations', () => ({ uploadImageSchema: { parse: jest.fn() } }))

const { uploadImageSchema } = require('@/lib/validations')

describe('/api/upload', () => {
  beforeEach(() => {
    jest.clearAllMocks()
    mockUploadImageToS3.mockResolvedValue({
      imageUrl: 'https://example.com/image.jpg',
      key: 'uploads/test-key.jpg',
    })
    mockDetectFoodIngredients.mockResolvedValue({
      ingredients: [
        { name: '鶏肉', confidence: 0.95 },
        { name: '玉ねぎ', confidence: 0.88 },
      ],
      imageUrl: 'https://example.com/image.jpg'
    })
    mockGetServerSession.mockResolvedValue({ user: { id: 'user-123' } })
    uploadImageSchema.parse.mockReturnValue({
      image: 'data:image/jpeg;base64,fake-data',
      filename: 'test.jpg'
    })
  })

  it('画像アップロードと食材認識を正常に処理する', async () => {
    const request = new NextRequest('http://localhost:3000/api/upload', {
      method: 'POST',
      body: JSON.stringify({
        image: 'data:image/jpeg;base64,fake-data',
        filename: 'test.jpg'
      }),
    })

    const response = await POST(request)
    const data = await response.json()

    expect(response.status).toBe(200)
    expect(data.ingredients).toHaveLength(2)
    expect(data.imageUrl).toBe('https://example.com/image.jpg')
    expect(mockUploadImageToS3).toHaveBeenCalledWith(
      'data:image/jpeg;base64,fake-data',
      'test.jpg',
      'user-123'
    )
  })

  it('未認証ユーザーでも処理を実行する', async () => {
    mockGetServerSession.mockResolvedValue(null)
    
    const request = new NextRequest('http://localhost:3000/api/upload', {
      method: 'POST',
      body: JSON.stringify({
        image: 'data:image/jpeg;base64,fake-data',
        filename: 'test.jpg'
      }),
    })

    const response = await POST(request)
    expect(response.status).toBe(200)
    expect(mockUploadImageToS3).toHaveBeenCalledWith(
      'data:image/jpeg;base64,fake-data',
      'test.jpg',
      undefined
    )
  })

  it('バリデーションエラーを適切に処理する', async () => {
    uploadImageSchema.parse.mockImplementation(() => {
      throw new Error('Invalid image data')
    })

    const request = new NextRequest('http://localhost:3000/api/upload', {
      method: 'POST',
      body: JSON.stringify({ invalid: 'data' }),
    })

    const response = await POST(request)
    expect(response.status).toBe(400)
  })

  it('S3アップロードエラーを処理する', async () => {
    mockUploadImageToS3.mockRejectedValue(new Error('S3 upload failed'))

    const request = new NextRequest('http://localhost:3000/api/upload', {
      method: 'POST',
      body: JSON.stringify({
        image: 'data:image/jpeg;base64,fake-data',
        filename: 'test.jpg'
      }),
    })

    const response = await POST(request)
    expect(response.status).toBe(500)
  })

  it('Rekognition認識エラーを処理する', async () => {
    mockDetectFoodIngredients.mockRejectedValue(new Error('Recognition failed'))

    const request = new NextRequest('http://localhost:3000/api/upload', {
      method: 'POST',
      body: JSON.stringify({
        image: 'data:image/jpeg;base64,fake-data',
        filename: 'test.jpg'
      }),
    })

    const response = await POST(request)
    expect(response.status).toBe(500)
  })
})