import { render, screen, fireEvent } from '@testing-library/react'
import { CameraModal } from './camera-modal'

// カメラフックのモック
const mockUseCamera = {
  videoRef: { current: null },
  canvasRef: { current: null },
  isSupported: true,
  isStreaming: false,
  isCapturing: false,
  startCamera: jest.fn(),
  stopCamera: jest.fn(),
  capturePhoto: jest.fn(),
  switchCamera: jest.fn(),
  error: null,
}

jest.mock('@/hooks/use-camera', () => ({
  useCamera: () => mockUseCamera,
}))

describe('CameraModal', () => {
  const defaultProps = {
    isOpen: true,
    onClose: jest.fn(),
    onCapture: jest.fn(),
  }

  beforeEach(() => {
    jest.clearAllMocks()
    Object.assign(mockUseCamera, {
      isSupported: true,
      isStreaming: false,
      isCapturing: false,
      error: null,
    })
  })

  it('閉じている時は何も表示しない', () => {
    render(<CameraModal {...defaultProps} isOpen={false} />)
    
    expect(screen.queryByText('カメラで撮影')).not.toBeInTheDocument()
  })

  it('開いている時はタイトルを表示', () => {
    render(<CameraModal {...defaultProps} />)
    
    expect(screen.getByText('カメラで撮影')).toBeInTheDocument()
    expect(screen.getByText('食材がフレームに収まるように撮影してください')).toBeInTheDocument()
  })

  it('カメラがサポートされていない時はメッセージを表示', () => {
    Object.assign(mockUseCamera, { isSupported: false })
    
    render(<CameraModal {...defaultProps} />)
    
    expect(screen.getByText('お使いのブラウザはカメラ機能をサポートしていません')).toBeInTheDocument()
  })

  it('エラー時はエラーメッセージと再試行ボタンを表示', () => {
    Object.assign(mockUseCamera, { error: 'カメラエラー' })
    
    render(<CameraModal {...defaultProps} />)
    
    expect(screen.getByText('カメラエラー')).toBeInTheDocument()
    expect(screen.getByText('再試行')).toBeInTheDocument()
  })

  it('再試行ボタンでカメラを再開', () => {
    Object.assign(mockUseCamera, { error: 'カメラエラー' })
    
    render(<CameraModal {...defaultProps} />)
    
    fireEvent.click(screen.getByText('再試行'))
    expect(mockUseCamera.startCamera).toHaveBeenCalled()
  })

  it('カメラ開始時はローディングを表示', () => {
    Object.assign(mockUseCamera, { isStreaming: false })
    
    render(<CameraModal {...defaultProps} />)
    
    expect(screen.getByText('カメラを起動中...')).toBeInTheDocument()
  })

  it('ストリーミング中はコントロールボタンを表示', () => {
    Object.assign(mockUseCamera, { isStreaming: true })
    
    render(<CameraModal {...defaultProps} />)
    
    expect(screen.getByTitle('カメラを切り替え')).toBeInTheDocument()
    expect(screen.getByTitle('撮影')).toBeInTheDocument()
  })

  it('撮影ボタンクリックで写真を撮影', () => {
    Object.assign(mockUseCamera, { isStreaming: true })
    
    render(<CameraModal {...defaultProps} />)
    
    fireEvent.click(screen.getByTitle('撮影'))
    expect(mockUseCamera.capturePhoto).toHaveBeenCalled()
  })

  it('カメラ切り替えボタンでカメラを切り替え', () => {
    Object.assign(mockUseCamera, { isStreaming: true })
    
    render(<CameraModal {...defaultProps} />)
    
    fireEvent.click(screen.getByTitle('カメラを切り替え'))
    expect(mockUseCamera.switchCamera).toHaveBeenCalled()
  })

  it('閉じるボタンで閉じる', () => {
    const mockOnClose = jest.fn()
    render(<CameraModal {...defaultProps} onClose={mockOnClose} />)
    
    // X ボタンをクリック（最初のボタンが閉じるボタン）
    const buttons = screen.getAllByRole('button')
    fireEvent.click(buttons[0])
    
    expect(mockUseCamera.stopCamera).toHaveBeenCalled()
    expect(mockOnClose).toHaveBeenCalled()
  })

  it('撮影中は撮影ボタンが無効化される', () => {
    Object.assign(mockUseCamera, { 
      isStreaming: true,
      isCapturing: true 
    })
    
    render(<CameraModal {...defaultProps} />)
    
    const captureButton = screen.getByTitle('撮影')
    expect(captureButton).toBeDisabled()
  })
})