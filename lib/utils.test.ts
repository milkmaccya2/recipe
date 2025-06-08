import { cn, validateImageFile, formatFileSize, generateRequestId } from './utils'

describe('cn function', () => {
  it('should merge class names correctly', () => {
    expect(cn('class1', 'class2')).toBe('class1 class2')
  })

  it('should handle conditional classes', () => {
    expect(cn('base', true && 'conditional', false && 'not-included')).toBe('base conditional')
  })

  it('should handle undefined and null values', () => {
    expect(cn('base', undefined, null, 'valid')).toBe('base valid')
  })
})

describe('validateImageFile function', () => {
  const createMockFile = (name: string, size: number, type: string): File => {
    return new File([''], name, { type }) as File & { size: number }
  }

  it('should validate a valid image file', () => {
    const file = createMockFile('test.jpg', 5 * 1024 * 1024, 'image/jpeg') // 5MB
    Object.defineProperty(file, 'size', { value: 5 * 1024 * 1024 })
    
    const result = validateImageFile(file)
    expect(result.isValid).toBe(true)
    expect(result.error).toBeNull()
  })

  it('should reject file that is too large', () => {
    const file = createMockFile('large.jpg', 15 * 1024 * 1024, 'image/jpeg') // 15MB
    Object.defineProperty(file, 'size', { value: 15 * 1024 * 1024 })
    
    const result = validateImageFile(file)
    expect(result.isValid).toBe(false)
    expect(result.error).toContain('ファイルサイズが大きすぎます')
  })

  it('should reject invalid file type', () => {
    const file = createMockFile('document.pdf', 1024, 'application/pdf')
    
    const result = validateImageFile(file)
    expect(result.isValid).toBe(false)
    expect(result.error).toContain('対応していないファイル形式です')
  })

  it('should accept various image formats', () => {
    const formats = [
      { type: 'image/jpeg', name: 'test.jpg' },
      { type: 'image/png', name: 'test.png' },
      { type: 'image/webp', name: 'test.webp' },
    ]

    formats.forEach(({ type, name }) => {
      const file = createMockFile(name, 1024, type)
      Object.defineProperty(file, 'size', { value: 1024 })
      
      const result = validateImageFile(file)
      expect(result.isValid).toBe(true)
    })
  })
})

describe('formatFileSize function', () => {
  it('should format bytes correctly', () => {
    expect(formatFileSize(1024)).toBe('1 KB')
    expect(formatFileSize(1024 * 1024)).toBe('1 MB')
    expect(formatFileSize(1024 * 1024 * 1024)).toBe('1 GB')
  })

  it('should handle decimal places', () => {
    expect(formatFileSize(1536)).toBe('1.5 KB') // 1.5 KB
    expect(formatFileSize(2.5 * 1024 * 1024)).toBe('2.5 MB')
  })

  it('should handle small files', () => {
    expect(formatFileSize(512)).toBe('512 bytes')
    expect(formatFileSize(0)).toBe('0 bytes')
  })

  it('should handle large files', () => {
    expect(formatFileSize(1024 * 1024 * 1024 * 1024)).toBe('1 TB')
  })
})

describe('generateRequestId function', () => {
  it('should generate a unique ID', () => {
    const id1 = generateRequestId()
    const id2 = generateRequestId()
    
    expect(id1).not.toBe(id2)
    expect(typeof id1).toBe('string')
    expect(id1.length).toBeGreaterThan(0)
  })

  it('should generate IDs with expected format', () => {
    const id = generateRequestId()
    
    // Should be a string with alphanumeric characters and possibly hyphens
    expect(id).toMatch(/^[a-zA-Z0-9\-_]+$/)
  })
})