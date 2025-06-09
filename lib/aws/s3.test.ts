import { uploadImageToS3 } from './s3'

const mockUpload = jest.fn()
const mockS3 = { upload: jest.fn(() => ({ promise: mockUpload })) }
const mockBase64ToBlob = jest.fn()

jest.mock('aws-sdk', () => ({ S3: jest.fn(() => mockS3), config: { update: jest.fn() } }))
jest.mock('@/lib/utils/image', () => ({ base64ToBlob: (...args: any[]) => mockBase64ToBlob(...args) }))
jest.mock('nanoid', () => ({ nanoid: () => 'mock-id-123' }))

describe('S3ユーティリティ', () => {
  const mockBlob = new Blob(['test data'], { type: 'image/jpeg' })

  beforeEach(() => {
    jest.clearAllMocks()
    mockBase64ToBlob.mockReturnValue(mockBlob)
    mockUpload.mockResolvedValue({
      Location: 'https://bucket.s3.region.amazonaws.com/uploads/test/mock-id-123.jpg',
      Key: 'uploads/test/mock-id-123.jpg',
    })
    process.env.AWS_S3_BUCKET_NAME = 'test-bucket'
    process.env.AWS_REGION = 'us-east-1'
  })

  afterEach(() => {
    delete process.env.AWS_S3_BUCKET_NAME
    delete process.env.AWS_REGION
  })

  describe('uploadImageToS3', () => {
    it('画像を正常にアップロードする', async () => {
      const result = await uploadImageToS3('data:image/jpeg;base64,fake-data', 'test.jpg', 'user-123')
      expect(result.imageUrl).toBe('https://bucket.s3.region.amazonaws.com/uploads/test/mock-id-123.jpg')
      expect(mockS3.upload).toHaveBeenCalledWith(expect.objectContaining({
        Bucket: 'test-bucket',
        Key: 'uploads/user-123/mock-id-123.jpg',
        ContentType: 'image/jpeg'
      }))
    })

    it('匿名ユーザーを処理する', async () => {
      await uploadImageToS3('data:image/jpeg;base64,fake-data', 'test.jpg')
      expect(mockS3.upload).toHaveBeenCalledWith(
        expect.objectContaining({ Key: 'uploads/anonymous/mock-id-123.jpg' })
      )
    })

    it('base64から正しいMIMEタイプを抽出し様々な画像形式を処理する', async () => {
      const formats = [
        { data: 'data:image/png;base64,fake-data', type: 'image/png' },
        { data: 'data:image/webp;base64,fake-data', type: 'image/webp' }
      ]
      for (const { data, type } of formats) {
        await uploadImageToS3(data, 'test.jpg')
        expect(mockS3.upload).toHaveBeenCalledWith(expect.objectContaining({ ContentType: type }))
      }
    })

    it('S3アップロード失敗と環境変数不足のエラーを処理する', async () => {
      mockUpload.mockRejectedValue(new Error('S3 upload failed'))
      await expect(uploadImageToS3('data:image/jpeg;base64,fake-data', 'test.jpg')).rejects.toThrow('S3 upload failed')
      
      delete process.env.AWS_S3_BUCKET_NAME
      await expect(uploadImageToS3('data:image/jpeg;base64,fake-data', 'test.jpg')).rejects.toThrow()
    })

    it('data URLプレフィックスなしのbase64をデフォルトJPEGとして処理する', async () => {
      await uploadImageToS3('fake-base64-data', 'test.jpg')
      expect(mockBase64ToBlob).toHaveBeenCalledWith('fake-base64-data', 'image/jpeg')
    })

    it('blob変換エラーを適切に処理する', async () => {
      mockBase64ToBlob.mockImplementation(() => { throw new Error('Invalid base64 data') })
      await expect(uploadImageToS3('invalid-base64', 'test.jpg')).rejects.toThrow('Invalid base64 data')
    })
  })
})