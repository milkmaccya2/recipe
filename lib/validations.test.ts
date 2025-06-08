import { uploadImageSchema } from './validations'

describe('uploadImageSchema', () => {
  it('should validate a correct upload request', () => {
    const validData = {
      image: 'data:image/jpeg;base64,/9j/4AAQSkZJRgABAQ...',
      filename: 'test.jpg'
    }

    const result = uploadImageSchema.safeParse(validData)
    
    expect(result.success).toBe(true)
    if (result.success) {
      expect(result.data.image).toBe(validData.image)
      expect(result.data.filename).toBe(validData.filename)
    }
  })

  it('should accept valid base64 image formats', () => {
    const formats = [
      'data:image/jpeg;base64,/9j/4AAQSkZJRgABAQ...',
      'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAA...',
      'data:image/webp;base64,UklGRpQGAABXRUJQVlA4...'
    ]

    formats.forEach(image => {
      const data = { image, filename: 'test.jpg' }
      const result = uploadImageSchema.safeParse(data)
      
      expect(result.success).toBe(true)
    })
  })

  it('should reject invalid image data', () => {
    const invalidData = {
      image: 'not-a-valid-base64-image',
      filename: 'test.jpg'
    }

    const result = uploadImageSchema.safeParse(invalidData)
    
    expect(result.success).toBe(false)
  })

  it('should reject non-image base64 data', () => {
    const invalidData = {
      image: 'data:text/plain;base64,dGVzdCBkYXRh',
      filename: 'test.txt'
    }

    const result = uploadImageSchema.safeParse(invalidData)
    
    expect(result.success).toBe(false)
  })

  it('should require image field', () => {
    const invalidData = {
      filename: 'test.jpg'
    }

    const result = uploadImageSchema.safeParse(invalidData)
    
    expect(result.success).toBe(false)
  })

  it('should make filename optional', () => {
    const validData = {
      image: 'data:image/jpeg;base64,/9j/4AAQSkZJRgABAQ...'
    }

    const result = uploadImageSchema.safeParse(validData)
    
    expect(result.success).toBe(true)
    if (result.success) {
      expect(result.data.filename).toBeUndefined()
    }
  })

  it('should reject empty image string', () => {
    const invalidData = {
      image: '',
      filename: 'test.jpg'
    }

    const result = uploadImageSchema.safeParse(invalidData)
    
    expect(result.success).toBe(false)
  })

  it('should reject null or undefined image', () => {
    const invalidDataNull = {
      image: null,
      filename: 'test.jpg'
    }

    const invalidDataUndefined = {
      image: undefined,
      filename: 'test.jpg'
    }

    expect(uploadImageSchema.safeParse(invalidDataNull).success).toBe(false)
    expect(uploadImageSchema.safeParse(invalidDataUndefined).success).toBe(false)
  })

  it('should accept various filename formats', () => {
    const validFilenames = [
      'test.jpg',
      'image-with-dashes.png',
      'image_with_underscores.webp',
      'image with spaces.jpeg',
      'IMG_20230101_123456.jpg',
      'very-long-filename-that-should-still-be-valid.png'
    ]

    validFilenames.forEach(filename => {
      const data = {
        image: 'data:image/jpeg;base64,/9j/4AAQSkZJRgABAQ...',
        filename
      }
      
      const result = uploadImageSchema.safeParse(data)
      expect(result.success).toBe(true)
    })
  })
})