import { render, screen, fireEvent } from '@testing-library/react'
import { ImageUpload } from './image-upload'

// シンプルなモック設定
const mockUseDropzone = jest.fn()
jest.mock('react-dropzone', () => ({
  useDropzone: (options: any) => {
    mockUseDropzone(options)
    return {
      getRootProps: () => ({ 'data-testid': 'dropzone' }),
      getInputProps: () => ({ 'data-testid': 'file-input' }),
      isDragActive: false,
    }
  },
}))

const mockUploadState = { isUploading: false, progress: 0, error: null }
const mockAtomActions = { startUpload: jest.fn() }

jest.mock('jotai', () => ({
  atom: jest.fn((value) => ({ init: value })),
  useAtom: jest.fn(() => [mockUploadState, mockAtomActions.startUpload]),
}))

jest.mock('./camera-modal', () => ({
  CameraModal: ({ isOpen, onClose, onCapture }: any) => 
    isOpen ? (
      <div data-testid="camera-modal">
        <button onClick={() => onCapture(new File([''], 'camera.jpg', { type: 'image/jpeg' }))}>
          撮影
        </button>
        <button onClick={onClose}>閉じる</button>
      </div>
    ) : null,
}))

jest.mock('@/lib/utils', () => ({
  validateImageFile: jest.fn(() => ({ isValid: true, error: null })),
  formatFileSize: jest.fn(() => '1 MB'),
}))

jest.mock('@/lib/utils/image', () => ({
  fileToBase64: jest.fn(() => Promise.resolve('data:image/jpeg;base64,fake-data')),
}))

describe('ImageUpload', () => {
  beforeEach(() => {
    jest.clearAllMocks()
    global.fetch = jest.fn(() =>
      Promise.resolve({
        ok: true,
        json: () => Promise.resolve({
          data: {
            imageUrl: 'https://example.com/image.jpg',
            analysis: { ingredients: ['鶏肉', '玉ねぎ'] }
          }
        })
      })
    ) as jest.Mock
  })

  it('基本のアップロードエリアを表示', () => {
    render(<ImageUpload />)

    expect(screen.getByText('カメラで撮影')).toBeInTheDocument()
    expect(screen.getByText('ファイルを選択')).toBeInTheDocument()
    expect(screen.getByText('または画像をここにドラッグ&ドロップ')).toBeInTheDocument()
  })

  it('カメラボタンでモーダルを開く', () => {
    render(<ImageUpload />)

    fireEvent.click(screen.getByText('カメラで撮影'))
    expect(screen.getByTestId('camera-modal')).toBeInTheDocument()
  })

  it('エラー時はエラーメッセージを表示', () => {
    Object.assign(mockUploadState, { error: 'アップロードエラー' })
    
    render(<ImageUpload />)

    expect(screen.getByText('アップロードエラー')).toBeInTheDocument()
  })

  it('アップロード中は進捗を表示', () => {
    Object.assign(mockUploadState, { 
      isUploading: true, 
      progress: 50 
    })
    
    render(<ImageUpload />)

    expect(screen.getByText('画像を解析中...')).toBeInTheDocument()
  })
})