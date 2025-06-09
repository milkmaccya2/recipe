import { detectFoodIngredients } from './rekognition'

const mockDetectLabels = jest.fn()
const mockRekognition = { detectLabels: jest.fn(() => ({ promise: mockDetectLabels })) }

jest.mock('aws-sdk', () => ({
  Rekognition: jest.fn(() => mockRekognition),
  config: { update: jest.fn() },
}))

describe('Rekognitionユーティリティ', () => {
  beforeEach(() => {
    jest.clearAllMocks()
    process.env.AWS_REGION = 'us-east-1'
  })

  afterEach(() => {
    delete process.env.AWS_REGION
  })

  describe('detectFoodIngredients', () => {
    it('食材を正常に検出する', async () => {
      mockDetectLabels.mockResolvedValue({
        Labels: [
          { Name: 'Chicken', Confidence: 95.5 },
          { Name: 'Meat', Confidence: 90.2 },
          { Name: 'Onion', Confidence: 85.7 },
          { Name: 'Food', Confidence: 98.3 },
          { Name: 'Non-food item', Confidence: 70.1 },
        ]
      })

      const result = await detectFoodIngredients('https://example.com/image.jpg')

      expect(result.ingredients).toHaveLength(2)
      expect(result.ingredients[0]).toEqual({ name: '鶏肉', confidence: 0.955 })
      expect(result.ingredients[1]).toEqual({ name: '玉ねぎ', confidence: 0.857 })
      expect(result.imageUrl).toBe('https://example.com/image.jpg')
    })

    it('検出対象なしの場合を処理する', async () => {
      mockDetectLabels.mockResolvedValue({ Labels: [] })
      const result = await detectFoodIngredients('https://example.com/image.jpg')
      expect(result.ingredients).toHaveLength(0)
    })

    it('Rekognitionエラーを適切に処理する', async () => {
      mockDetectLabels.mockRejectedValue(new Error('Recognition failed'))
      await expect(detectFoodIngredients('https://example.com/image.jpg')).rejects.toThrow('Recognition failed')
    })

    it('無効な画像URLを処理する', async () => {
      await expect(detectFoodIngredients('')).rejects.toThrow()
    })

    it('環境変数不足のエラーを処理する', async () => {
      delete process.env.AWS_REGION
      await expect(detectFoodIngredients('https://example.com/image.jpg')).rejects.toThrow()
    })
  })
})