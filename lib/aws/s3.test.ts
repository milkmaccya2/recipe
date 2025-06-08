import { uploadImageToS3 } from './s3'

// Mock AWS SDK
const mockUpload = jest.fn()
const mockS3 = {
  upload: jest.fn(() => ({
    promise: mockUpload,
  })),
}

jest.mock('aws-sdk', () => ({
  S3: jest.fn(() => mockS3),
  config: {
    update: jest.fn(),
  },
}))

// Mock base64ToBlob
const mockBase64ToBlob = jest.fn()
jest.mock('@/lib/utils/image', () => ({
  base64ToBlob: (...args: any[]) => mockBase64ToBlob(...args),
}))

// Mock nanoid
jest.mock('nanoid', () => ({
  nanoid: () => 'mock-id-123',
}))

describe('S3 utilities', () => {
  const mockBlob = new Blob(['test data'], { type: 'image/jpeg' })

  beforeEach(() => {
    jest.clearAllMocks()
    
    mockBase64ToBlob.mockReturnValue(mockBlob)
    mockUpload.mockResolvedValue({
      Location: 'https://bucket.s3.region.amazonaws.com/uploads/test/mock-id-123.jpg',
      Key: 'uploads/test/mock-id-123.jpg',
    })
    
    // Mock environment variables
    process.env.AWS_S3_BUCKET_NAME = 'test-bucket'
    process.env.AWS_REGION = 'us-east-1'
  })

  afterEach(() => {
    delete process.env.AWS_S3_BUCKET_NAME
    delete process.env.AWS_REGION
  })

  describe('uploadImageToS3', () => {
    it('should upload image successfully', async () => {
      const base64Data = 'data:image/jpeg;base64,fake-data'
      const filename = 'test.jpg'
      const userId = 'user-123'

      const result = await uploadImageToS3(base64Data, filename, userId)

      expect(result.imageUrl).toBe('https://bucket.s3.region.amazonaws.com/uploads/test/mock-id-123.jpg')
      expect(result.key).toBe('uploads/test/mock-id-123.jpg')
      
      expect(mockBase64ToBlob).toHaveBeenCalledWith(base64Data, 'image/jpeg')
      expect(mockS3.upload).toHaveBeenCalledWith({
        Bucket: 'test-bucket',
        Key: 'uploads/user-123/mock-id-123.jpg',
        Body: expect.any(Buffer),
        ContentType: 'image/jpeg',
        ACL: 'public-read',
      })
    })

    it('should handle anonymous user', async () => {
      const base64Data = 'data:image/jpeg;base64,fake-data'
      const filename = 'test.jpg'

      await uploadImageToS3(base64Data, filename)

      expect(mockS3.upload).toHaveBeenCalledWith(
        expect.objectContaining({
          Key: 'uploads/anonymous/mock-id-123.jpg',
        })
      )
    })

    it('should extract correct mime type from base64', async () => {
      const base64Data = 'data:image/png;base64,fake-data'
      const filename = 'test.png'

      await uploadImageToS3(base64Data, filename)

      expect(mockBase64ToBlob).toHaveBeenCalledWith(base64Data, 'image/png')
      expect(mockS3.upload).toHaveBeenCalledWith(
        expect.objectContaining({
          ContentType: 'image/png',
        })
      )
    })

    it('should handle WebP images', async () => {
      const base64Data = 'data:image/webp;base64,fake-data'
      const filename = 'test.webp'

      await uploadImageToS3(base64Data, filename)

      expect(mockBase64ToBlob).toHaveBeenCalledWith(base64Data, 'image/webp')
      expect(mockS3.upload).toHaveBeenCalledWith(
        expect.objectContaining({
          ContentType: 'image/webp',
        })
      )
    })

    it('should throw error when S3 upload fails', async () => {
      mockUpload.mockRejectedValue(new Error('S3 upload failed'))

      const base64Data = 'data:image/jpeg;base64,fake-data'
      const filename = 'test.jpg'

      await expect(uploadImageToS3(base64Data, filename)).rejects.toThrow('S3 upload failed')
    })

    it('should throw error when missing environment variables', async () => {
      delete process.env.AWS_S3_BUCKET_NAME

      const base64Data = 'data:image/jpeg;base64,fake-data'
      const filename = 'test.jpg'

      await expect(uploadImageToS3(base64Data, filename)).rejects.toThrow()
    })

    it('should handle base64 without data URL prefix', async () => {
      const base64Data = 'fake-base64-data'
      const filename = 'test.jpg'

      // Should default to jpeg
      await uploadImageToS3(base64Data, filename)

      expect(mockBase64ToBlob).toHaveBeenCalledWith(base64Data, 'image/jpeg')
    })

    it('should generate unique file keys', async () => {
      const base64Data = 'data:image/jpeg;base64,fake-data'
      const filename = 'test.jpg'
      const userId = 'user-123'

      const result1 = await uploadImageToS3(base64Data, filename, userId)
      
      // Reset mock to simulate new nanoid
      jest.mocked(require('nanoid').nanoid).mockReturnValue('different-id-456')
      
      const result2 = await uploadImageToS3(base64Data, filename, userId)

      expect(result1.key).not.toBe(result2.key)
    })

    it('should handle blob conversion errors', async () => {
      mockBase64ToBlob.mockImplementation(() => {
        throw new Error('Invalid base64 data')
      })

      const base64Data = 'invalid-base64'
      const filename = 'test.jpg'

      await expect(uploadImageToS3(base64Data, filename)).rejects.toThrow('Invalid base64 data')
    })

    it('should preserve file extension in key', async () => {
      const testCases = [
        { filename: 'test.jpg', expected: 'jpg' },
        { filename: 'test.png', expected: 'png' },
        { filename: 'test.webp', expected: 'webp' },
        { filename: 'no-extension', expected: 'jpg' }, // default
      ]

      for (const { filename, expected } of testCases) {
        await uploadImageToS3('data:image/jpeg;base64,fake-data', filename)
        
        const uploadCall = mockS3.upload.mock.calls[mockS3.upload.mock.calls.length - 1]
        const key = uploadCall[0].Key
        expect(key).toMatch(new RegExp(`\\.${expected}$`))
      }
    })
  })
})