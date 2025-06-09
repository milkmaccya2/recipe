import { uploadImageSchema } from './validations'

describe('uploadImageSchema', () => {
  it('正しいアップロードリクエストをバリデーションする', () => {
    const validData = {
      image: 'data:image/jpeg;base64,/9j/4AAQSkZJRgABAQ...',
      filename: 'test.jpg'
    }
    const result = uploadImageSchema.safeParse(validData)
    expect(result.success).toBe(true)
  })

  it('有効なbase64画像形式を許可する', () => {
    const formats = [
      'data:image/jpeg;base64,/9j/4AAQSkZJRgABAQ...',
      'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAA...',
      'data:image/webp;base64,UklGRpQGAABXRUJQVlA4...'
    ]
    formats.forEach(image => {
      expect(uploadImageSchema.safeParse({ image, filename: 'test.jpg' }).success).toBe(true)
    })
  })

  it('無効な画像データと非画像base64データを拒否する', () => {
    const invalidCases = [
      { image: 'not-a-valid-base64-image', filename: 'test.jpg' },
      { image: 'data:text/plain;base64,dGVzdCBkYXRh', filename: 'test.txt' }
    ]
    invalidCases.forEach(data => {
      expect(uploadImageSchema.safeParse(data).success).toBe(false)
    })
  })

  it('imageフィールドを必須とし、filenameフィールドをオプションとする', () => {
    expect(uploadImageSchema.safeParse({ filename: 'test.jpg' }).success).toBe(false)
    expect(uploadImageSchema.safeParse({ 
      image: 'data:image/jpeg;base64,/9j/4AAQSkZJRgABAQ...' 
    }).success).toBe(true)
  })

  it('空の文字列、null、undefinedの画像を拒否する', () => {
    const invalidCases = [
      { image: '', filename: 'test.jpg' },
      { image: null, filename: 'test.jpg' },
      { image: undefined, filename: 'test.jpg' }
    ]
    invalidCases.forEach(data => {
      expect(uploadImageSchema.safeParse(data).success).toBe(false)
    })
  })

  it('様々なファイル名形式を許可する', () => {
    const validFilenames = [
      'test.jpg', 'image-with-dashes.png', 'image_with_underscores.webp',
      'image with spaces.jpeg', 'IMG_20230101_123456.jpg'
    ]
    validFilenames.forEach(filename => {
      const data = { image: 'data:image/jpeg;base64,/9j/4AAQSkZJRgABAQ...', filename }
      expect(uploadImageSchema.safeParse(data).success).toBe(true)
    })
  })
})