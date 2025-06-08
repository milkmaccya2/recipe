import { fileToBase64, base64ToBlob } from './image'

// Mock FileReader
class MockFileReader {
  onload: ((event: any) => void) | null = null
  onerror: ((event: any) => void) | null = null
  result: string | ArrayBuffer | null = null

  readAsDataURL(file: File) {
    setTimeout(() => {
      this.result = `data:${file.type};base64,dGVzdCBkYXRh` // "test data" in base64
      if (this.onload) {
        this.onload({ target: this })
      }
    }, 0)
  }
}

// Mock global FileReader
Object.defineProperty(global, 'FileReader', {
  writable: true,
  value: MockFileReader,
})

// Mock atob for base64ToBlob tests
Object.defineProperty(global, 'atob', {
  writable: true,
  value: (str: string) => {
    return Buffer.from(str, 'base64').toString('binary')
  },
})

describe('fileToBase64 function', () => {
  it('should convert file to base64', async () => {
    const file = new File(['test content'], 'test.txt', { type: 'text/plain' })
    
    const result = await fileToBase64(file)
    
    expect(result).toBe('data:text/plain;base64,dGVzdCBkYXRh')
  })

  it('should handle image files', async () => {
    const file = new File(['image content'], 'test.jpg', { type: 'image/jpeg' })
    
    const result = await fileToBase64(file)
    
    expect(result).toBe('data:image/jpeg;base64,dGVzdCBkYXRh')
  })

  it('should reject when FileReader fails', async () => {
    // Mock FileReader to fail
    const OriginalFileReader = global.FileReader
    
    class FailingFileReader extends MockFileReader {
      readAsDataURL() {
        setTimeout(() => {
          if (this.onerror) {
            this.onerror(new Error('Read failed'))
          }
        }, 0)
      }
    }
    
    Object.defineProperty(global, 'FileReader', {
      writable: true,
      value: FailingFileReader,
    })

    const file = new File(['test'], 'test.txt', { type: 'text/plain' })
    
    await expect(fileToBase64(file)).rejects.toThrow('Failed to read file')
    
    // Restore original FileReader
    Object.defineProperty(global, 'FileReader', {
      writable: true,
      value: OriginalFileReader,
    })
  })
})

describe('base64ToBlob function', () => {
  it('should convert base64 to blob', () => {
    const base64 = 'data:image/jpeg;base64,dGVzdCBkYXRh'
    const mimeType = 'image/jpeg'
    
    const blob = base64ToBlob(base64, mimeType)
    
    expect(blob).toBeInstanceOf(Blob)
    expect(blob.type).toBe(mimeType)
  })

  it('should handle different mime types', () => {
    const base64 = 'data:image/png;base64,dGVzdCBkYXRh'
    const mimeType = 'image/png'
    
    const blob = base64ToBlob(base64, mimeType)
    
    expect(blob.type).toBe(mimeType)
  })

  it('should extract base64 data correctly', () => {
    const base64 = 'data:image/jpeg;base64,dGVzdCBkYXRh'
    const mimeType = 'image/jpeg'
    
    const blob = base64ToBlob(base64, mimeType)
    
    expect(blob.size).toBeGreaterThan(0)
  })

  it('should handle base64 without data URL prefix', () => {
    const base64 = 'dGVzdCBkYXRh'
    const mimeType = 'image/jpeg'
    
    // Mock atob to handle plain base64
    Object.defineProperty(global, 'atob', {
      writable: true,
      value: (str: string) => {
        if (str) {
          return Buffer.from(str, 'base64').toString('binary')
        }
        return ''
      },
    })
    
    const blob = base64ToBlob(base64, mimeType)
    
    expect(blob).toBeInstanceOf(Blob)
    expect(blob.type).toBe(mimeType)
  })
})