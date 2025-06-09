import { cn, validateImageFile, formatFileSize, generateRequestId } from './utils'

describe('cn関数', () => {
  it('クラス名を正しく結合する', () => {
    expect(cn('class1', 'class2')).toBe('class1 class2')
    expect(cn('base', true && 'conditional', false && 'not-included')).toBe('base conditional')
    expect(cn('base', undefined, null, 'valid')).toBe('base valid')
  })
})

describe('validateImageFile関数', () => {
  const createMockFile = (name: string, size: number, type: string): File => {
    const file = new File([''], name, { type }) as File & { size: number }
    Object.defineProperty(file, 'size', { value: size })
    return file
  }

  it('有効な画像ファイルをバリデーションする', () => {
    const file = createMockFile('test.jpg', 5 * 1024 * 1024, 'image/jpeg')
    const result = validateImageFile(file)
    expect(result.isValid).toBe(true)
    expect(result.error).toBeNull()
  })

  it('ファイルサイズが大きすぎる場合を拒否する', () => {
    const file = createMockFile('large.jpg', 15 * 1024 * 1024, 'image/jpeg')
    const result = validateImageFile(file)
    expect(result.isValid).toBe(false)
    expect(result.error).toContain('ファイルサイズが大きすぎます')
  })

  it('無効なファイル形式を拒否し、有効な形式を許可する', () => {
    const invalidFile = createMockFile('document.pdf', 1024, 'application/pdf')
    expect(validateImageFile(invalidFile).isValid).toBe(false)
    
    const validFormats = ['image/jpeg', 'image/png', 'image/webp']
    validFormats.forEach(type => {
      const file = createMockFile('test.jpg', 1024, type)
      expect(validateImageFile(file).isValid).toBe(true)
    })
  })
})

describe('formatFileSize関数', () => {
  it('ファイルサイズを正しくフォーマットする', () => {
    expect(formatFileSize(512)).toBe('512 bytes')
    expect(formatFileSize(1024)).toBe('1 KB')
    expect(formatFileSize(1536)).toBe('1.5 KB')
    expect(formatFileSize(1024 * 1024)).toBe('1 MB')
    expect(formatFileSize(1024 * 1024 * 1024)).toBe('1 GB')
  })
})

describe('generateRequestId関数', () => {
  it('ユニークなIDを生成する', () => {
    const id1 = generateRequestId()
    const id2 = generateRequestId()
    
    expect(id1).not.toBe(id2)
    expect(typeof id1).toBe('string')
    expect(id1).toMatch(/^[a-zA-Z0-9\-_]+$/)
  })
})