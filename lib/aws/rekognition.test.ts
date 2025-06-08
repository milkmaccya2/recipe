import { detectFoodIngredients } from './rekognition'

// Mock AWS SDK
const mockDetectLabels = jest.fn()
const mockRekognition = {
  detectLabels: jest.fn(() => ({
    promise: mockDetectLabels,
  })),
}

jest.mock('aws-sdk', () => ({
  Rekognition: jest.fn(() => mockRekognition),
  config: {
    update: jest.fn(),
  },
}))

describe('Rekognition utilities', () => {
  beforeEach(() => {
    jest.clearAllMocks()
    
    // Mock environment variables
    process.env.AWS_REGION = 'us-east-1'
  })

  afterEach(() => {
    delete process.env.AWS_REGION
  })

  describe('detectFoodIngredients', () => {
    it('should detect food ingredients successfully', async () => {
      mockDetectLabels.mockResolvedValue({
        Labels: [
          { Name: 'Chicken', Confidence: 95.5 },
          { Name: 'Meat', Confidence: 90.2 },
          { Name: 'Onion', Confidence: 85.7 },
          { Name: 'Vegetable', Confidence: 82.1 },
          { Name: 'Food', Confidence: 98.3 },
          { Name: 'Non-food item', Confidence: 70.1 },
        ]
      })

      const result = await detectFoodIngredients('https://example.com/image.jpg')

      expect(result.ingredients).toHaveLength(2) // Only food-related items
      expect(result.ingredients[0]).toEqual({
        name: '鶏肉',
        confidence: 0.955,
      })
      expect(result.ingredients[1]).toEqual({
        name: '玉ねぎ',
        confidence: 0.857,
      })

      expect(mockRekognition.detectLabels).toHaveBeenCalledWith({
        Image: {
          S3Object: {
            Bucket: expect.any(String),
            Name: expect.any(String),
          },
        },
        MaxLabels: 50,
        MinConfidence: 70,
      })
    })

    it('should filter out non-food items', async () => {
      mockDetectLabels.mockResolvedValue({
        Labels: [
          { Name: 'Plate', Confidence: 95.0 },
          { Name: 'Kitchen', Confidence: 90.0 },
          { Name: 'Table', Confidence: 85.0 },
          { Name: 'Food', Confidence: 80.0 },
        ]
      })

      const result = await detectFoodIngredients('https://example.com/image.jpg')

      expect(result.ingredients).toHaveLength(0)
    })

    it('should filter by confidence threshold', async () => {
      mockDetectLabels.mockResolvedValue({
        Labels: [
          { Name: 'Chicken', Confidence: 95.0 },
          { Name: 'Beef', Confidence: 60.0 }, // Below threshold
          { Name: 'Pork', Confidence: 75.0 },
        ]
      })

      const result = await detectFoodIngredients('https://example.com/image.jpg')

      expect(result.ingredients).toHaveLength(2) // Only above 70% confidence
      expect(result.ingredients.some(i => i.confidence < 0.7)).toBe(false)
    })

    it('should map English labels to Japanese correctly', async () => {
      const testMappings = [
        { english: 'Chicken', japanese: '鶏肉' },
        { english: 'Beef', japanese: '牛肉' },
        { english: 'Pork', japanese: '豚肉' },
        { english: 'Fish', japanese: '魚' },
        { english: 'Onion', japanese: '玉ねぎ' },
        { english: 'Tomato', japanese: 'トマト' },
        { english: 'Carrot', japanese: 'にんじん' },
        { english: 'Potato', japanese: 'じゃがいも' },
        { english: 'Rice', japanese: '米' },
        { english: 'Egg', japanese: '卵' },
      ]

      for (const { english, japanese } of testMappings) {
        mockDetectLabels.mockResolvedValue({
          Labels: [{ Name: english, Confidence: 85.0 }]
        })

        const result = await detectFoodIngredients('https://example.com/image.jpg')
        
        expect(result.ingredients).toHaveLength(1)
        expect(result.ingredients[0].name).toBe(japanese)
      }
    })

    it('should handle unknown food items gracefully', async () => {
      mockDetectLabels.mockResolvedValue({
        Labels: [
          { Name: 'UnknownFood', Confidence: 85.0 },
          { Name: 'Chicken', Confidence: 90.0 },
        ]
      })

      const result = await detectFoodIngredients('https://example.com/image.jpg')

      // Should only include mapped items
      expect(result.ingredients).toHaveLength(1)
      expect(result.ingredients[0].name).toBe('鶏肉')
    })

    it('should parse S3 URL correctly', async () => {
      const s3Url = 'https://my-bucket.s3.us-east-1.amazonaws.com/uploads/user/image.jpg'
      
      await detectFoodIngredients(s3Url)

      expect(mockRekognition.detectLabels).toHaveBeenCalledWith({
        Image: {
          S3Object: {
            Bucket: 'my-bucket',
            Name: 'uploads/user/image.jpg',
          },
        },
        MaxLabels: 50,
        MinConfidence: 70,
      })
    })

    it('should handle different S3 URL formats', async () => {
      const testUrls = [
        {
          url: 'https://bucket.s3.region.amazonaws.com/path/to/image.jpg',
          expectedBucket: 'bucket',
          expectedKey: 'path/to/image.jpg',
        },
        {
          url: 'https://bucket.s3.amazonaws.com/image.jpg',
          expectedBucket: 'bucket',
          expectedKey: 'image.jpg',
        },
        {
          url: 'https://s3.region.amazonaws.com/bucket/nested/path/image.jpg',
          expectedBucket: 'bucket',
          expectedKey: 'nested/path/image.jpg',
        },
      ]

      for (const { url, expectedBucket, expectedKey } of testUrls) {
        mockDetectLabels.mockClear()
        
        await detectFoodIngredients(url)

        expect(mockRekognition.detectLabels).toHaveBeenCalledWith({
          Image: {
            S3Object: {
              Bucket: expectedBucket,
              Name: expectedKey,
            },
          },
          MaxLabels: 50,
          MinConfidence: 70,
        })
      }
    })

    it('should handle Rekognition API errors', async () => {
      mockDetectLabels.mockRejectedValue(new Error('Rekognition API error'))

      await expect(detectFoodIngredients('https://example.com/image.jpg'))
        .rejects.toThrow('Rekognition API error')
    })

    it('should handle empty labels response', async () => {
      mockDetectLabels.mockResolvedValue({
        Labels: []
      })

      const result = await detectFoodIngredients('https://example.com/image.jpg')

      expect(result.ingredients).toHaveLength(0)
    })

    it('should handle missing Labels in response', async () => {
      mockDetectLabels.mockResolvedValue({})

      const result = await detectFoodIngredients('https://example.com/image.jpg')

      expect(result.ingredients).toHaveLength(0)
    })

    it('should convert confidence to decimal correctly', async () => {
      mockDetectLabels.mockResolvedValue({
        Labels: [
          { Name: 'Chicken', Confidence: 95.5 },
          { Name: 'Onion', Confidence: 87.3 },
        ]
      })

      const result = await detectFoodIngredients('https://example.com/image.jpg')

      expect(result.ingredients[0].confidence).toBe(0.955)
      expect(result.ingredients[1].confidence).toBe(0.873)
    })

    it('should sort ingredients by confidence descending', async () => {
      mockDetectLabels.mockResolvedValue({
        Labels: [
          { Name: 'Onion', Confidence: 75.0 },
          { Name: 'Chicken', Confidence: 95.0 },
          { Name: 'Tomato', Confidence: 85.0 },
        ]
      })

      const result = await detectFoodIngredients('https://example.com/image.jpg')

      expect(result.ingredients[0].confidence).toBe(0.95) // Highest first
      expect(result.ingredients[1].confidence).toBe(0.85)
      expect(result.ingredients[2].confidence).toBe(0.75) // Lowest last
    })

    it('should handle invalid S3 URL', async () => {
      const invalidUrl = 'https://not-s3-url.com/image.jpg'

      await expect(detectFoodIngredients(invalidUrl))
        .rejects.toThrow()
    })
  })
})