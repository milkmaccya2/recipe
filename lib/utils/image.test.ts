import { fileToBase64, base64ToBlob } from './image'

class MockFileReader {
  onload: ((event: any) => void) | null = null
  onerror: ((event: any) => void) | null = null
  result: string | ArrayBuffer | null = null

  readAsDataURL(file: File) {
    setTimeout(() => {
      this.result = `data:${file.type};base64,dGVzdCBkYXRh`
      if (this.onload) { this.onload({ target: this }) }
    }, 0)
  }
}

Object.defineProperty(global, 'FileReader', { writable: true, value: MockFileReader })
Object.defineProperty(global, 'atob', { 
  writable: true, 
  value: (str: string) => Buffer.from(str, 'base64').toString('binary') 
})

describe('fileToBase64関数', () => {
  it('ファイルをbase64に変換する', async () => {
    const textFile = new File(['test content'], 'test.txt', { type: 'text/plain' })
    const imageFile = new File(['image content'], 'test.jpg', { type: 'image/jpeg' })
    
    expect(await fileToBase64(textFile)).toBe('data:text/plain;base64,dGVzdCBkYXRh')
    expect(await fileToBase64(imageFile)).toBe('data:image/jpeg;base64,dGVzdCBkYXRh')
  })

  it('FileReader失敗時にエラーを投げる', async () => {
    const OriginalFileReader = global.FileReader
    class FailingFileReader extends MockFileReader {
      readAsDataURL() {
        setTimeout(() => {
          if (this.onerror) { this.onerror(new Error('Read failed')) }
        }, 0)
      }
    }
    Object.defineProperty(global, 'FileReader', { writable: true, value: FailingFileReader })

    await expect(fileToBase64(new File(['test'], 'test.txt', { type: 'text/plain' }))).rejects.toThrow('Failed to read file')
    
    Object.defineProperty(global, 'FileReader', { writable: true, value: OriginalFileReader })
  })
})

describe('base64ToBlob関数', () => {
  it('base64をblobに変換し異なるMIMEタイプを処理する', () => {
    const testCases = [
      { data: 'data:image/jpeg;base64,dGVzdCBkYXRh', type: 'image/jpeg' },
      { data: 'data:image/png;base64,dGVzdCBkYXRh', type: 'image/png' }
    ]
    
    testCases.forEach(({ data, type }) => {
      const blob = base64ToBlob(data, type)
      expect(blob).toBeInstanceOf(Blob)
      expect(blob.type).toBe(type)
      expect(blob.size).toBeGreaterThan(0)
    })
  })

  it('data URLプレフィックスなしのbase64を処理する', () => {
    const blob = base64ToBlob('dGVzdCBkYXRh', 'image/jpeg')
    expect(blob).toBeInstanceOf(Blob)
    expect(blob.type).toBe('image/jpeg')
  })
})