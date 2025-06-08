import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import { CameraModal } from './camera-modal'

// Mock useCamera hook
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

describe('CameraModal component', () => {
  const mockOnClose = jest.fn()
  const mockOnCapture = jest.fn()

  beforeEach(() => {
    jest.clearAllMocks()
    // Reset mock state
    Object.assign(mockUseCamera, {
      isSupported: true,
      isStreaming: false,
      isCapturing: false,
      error: null,
    })
  })

  it('should not render when isOpen is false', () => {
    render(
      <CameraModal
        isOpen={false}
        onClose={mockOnClose}
        onCapture={mockOnCapture}
      />
    )

    expect(screen.queryByText('カメラで撮影')).not.toBeInTheDocument()
  })

  it('should render modal when isOpen is true', () => {
    render(
      <CameraModal
        isOpen={true}
        onClose={mockOnClose}
        onCapture={mockOnCapture}
      />
    )

    expect(screen.getByText('カメラで撮影')).toBeInTheDocument()
    expect(screen.getByText('食材がフレームに収まるように撮影してください')).toBeInTheDocument()
  })

  it('should call startCamera when modal opens and camera is supported', () => {
    render(
      <CameraModal
        isOpen={true}
        onClose={mockOnClose}
        onCapture={mockOnCapture}
      />
    )

    expect(mockUseCamera.startCamera).toHaveBeenCalled()
  })

  it('should call stopCamera when modal closes', () => {
    const { rerender } = render(
      <CameraModal
        isOpen={true}
        onClose={mockOnClose}
        onCapture={mockOnCapture}
      />
    )

    // Close modal
    rerender(
      <CameraModal
        isOpen={false}
        onClose={mockOnClose}
        onCapture={mockOnCapture}
      />
    )

    expect(mockUseCamera.stopCamera).toHaveBeenCalled()
  })

  it('should show unsupported message when camera is not supported', () => {
    mockUseCamera.isSupported = false

    render(
      <CameraModal
        isOpen={true}
        onClose={mockOnClose}
        onCapture={mockOnCapture}
      />
    )

    expect(screen.getByText('お使いのブラウザはカメラ機能をサポートしていません')).toBeInTheDocument()
  })

  it('should show error message when there is an error', () => {
    mockUseCamera.error = 'カメラアクセスエラー'

    render(
      <CameraModal
        isOpen={true}
        onClose={mockOnClose}
        onCapture={mockOnCapture}
      />
    )

    expect(screen.getByText('カメラアクセスエラー')).toBeInTheDocument()
    expect(screen.getByText('再試行')).toBeInTheDocument()
  })

  it('should retry camera when retry button is clicked', () => {
    mockUseCamera.error = 'カメラアクセスエラー'

    render(
      <CameraModal
        isOpen={true}
        onClose={mockOnClose}
        onCapture={mockOnCapture}
      />
    )

    const retryButton = screen.getByText('再試行')
    fireEvent.click(retryButton)

    expect(mockUseCamera.startCamera).toHaveBeenCalled()
  })

  it('should show loading state when camera is starting', () => {
    mockUseCamera.isStreaming = false

    render(
      <CameraModal
        isOpen={true}
        onClose={mockOnClose}
        onCapture={mockOnCapture}
      />
    )

    expect(screen.getByText('カメラを起動中...')).toBeInTheDocument()
    
    const loadingIcon = document.querySelector('.lucide-loader-2')
    expect(loadingIcon).toBeInTheDocument()
    expect(loadingIcon).toHaveClass('animate-spin')
  })

  it('should show camera controls when streaming', () => {
    mockUseCamera.isStreaming = true

    render(
      <CameraModal
        isOpen={true}
        onClose={mockOnClose}
        onCapture={mockOnCapture}
      />
    )

    expect(screen.getByTitle('カメラを切り替え')).toBeInTheDocument()
    expect(screen.getByTitle('撮影')).toBeInTheDocument()
  })

  it('should hide camera controls when not streaming', () => {
    mockUseCamera.isStreaming = false

    render(
      <CameraModal
        isOpen={true}
        onClose={mockOnClose}
        onCapture={mockOnCapture}
      />
    )

    expect(screen.queryByTitle('カメラを切り替え')).not.toBeInTheDocument()
    expect(screen.queryByTitle('撮影')).not.toBeInTheDocument()
  })

  it('should switch camera when switch button is clicked', () => {
    mockUseCamera.isStreaming = true

    render(
      <CameraModal
        isOpen={true}
        onClose={mockOnClose}
        onCapture={mockOnCapture}
      />
    )

    const switchButton = screen.getByTitle('カメラを切り替え')
    fireEvent.click(switchButton)

    expect(mockUseCamera.switchCamera).toHaveBeenCalled()
  })

  it('should capture photo when capture button is clicked', async () => {
    mockUseCamera.isStreaming = true
    mockUseCamera.capturePhoto.mockResolvedValue(
      new File([''], 'photo.jpg', { type: 'image/jpeg' })
    )

    render(
      <CameraModal
        isOpen={true}
        onClose={mockOnClose}
        onCapture={mockOnCapture}
      />
    )

    const captureButton = screen.getByTitle('撮影')
    fireEvent.click(captureButton)

    await waitFor(() => {
      expect(mockUseCamera.capturePhoto).toHaveBeenCalled()
    })
  })

  it('should close modal after successful capture', async () => {
    mockUseCamera.isStreaming = true
    mockUseCamera.capturePhoto.mockResolvedValue(
      new File([''], 'photo.jpg', { type: 'image/jpeg' })
    )

    render(
      <CameraModal
        isOpen={true}
        onClose={mockOnClose}
        onCapture={mockOnCapture}
      />
    )

    const captureButton = screen.getByTitle('撮影')
    fireEvent.click(captureButton)

    await waitFor(() => {
      expect(mockOnClose).toHaveBeenCalled()
    })
  })

  it('should not close modal if capture returns null', async () => {
    mockUseCamera.isStreaming = true
    mockUseCamera.capturePhoto.mockResolvedValue(null)

    render(
      <CameraModal
        isOpen={true}
        onClose={mockOnClose}
        onCapture={mockOnCapture}
      />
    )

    const captureButton = screen.getByTitle('撮影')
    fireEvent.click(captureButton)

    await waitFor(() => {
      expect(mockUseCamera.capturePhoto).toHaveBeenCalled()
    })

    expect(mockOnClose).not.toHaveBeenCalled()
  })

  it('should show flash effect when capturing', () => {
    mockUseCamera.isStreaming = true
    mockUseCamera.isCapturing = true

    render(
      <CameraModal
        isOpen={true}
        onClose={mockOnClose}
        onCapture={mockOnCapture}
      />
    )

    const flashEffect = document.querySelector('.bg-white.opacity-50.animate-pulse')
    expect(flashEffect).toBeInTheDocument()
  })

  it('should disable capture button when capturing', () => {
    mockUseCamera.isStreaming = true
    mockUseCamera.isCapturing = true

    render(
      <CameraModal
        isOpen={true}
        onClose={mockOnClose}
        onCapture={mockOnCapture}
      />
    )

    const captureButton = screen.getByTitle('撮影')
    expect(captureButton).toBeDisabled()
    expect(captureButton).toHaveClass('disabled:opacity-50', 'disabled:cursor-not-allowed')
  })

  it('should show loading icon in capture button when capturing', () => {
    mockUseCamera.isStreaming = true
    mockUseCamera.isCapturing = true

    render(
      <CameraModal
        isOpen={true}
        onClose={mockOnClose}
        onCapture={mockOnCapture}
      />
    )

    const captureButton = screen.getByTitle('撮影')
    const loadingIcon = captureButton.querySelector('.lucide-loader-2')
    expect(loadingIcon).toBeInTheDocument()
  })

  it('should close modal when close button is clicked', () => {
    render(
      <CameraModal
        isOpen={true}
        onClose={mockOnClose}
        onCapture={mockOnCapture}
      />
    )

    const closeButton = screen.getByRole('button', { name: '' }) // X button has no text
    fireEvent.click(closeButton)

    expect(mockUseCamera.stopCamera).toHaveBeenCalled()
    expect(mockOnClose).toHaveBeenCalled()
  })

  it('should have proper video attributes', () => {
    mockUseCamera.isStreaming = true

    render(
      <CameraModal
        isOpen={true}
        onClose={mockOnClose}
        onCapture={mockOnCapture}
      />
    )

    const video = document.querySelector('video')
    expect(video).toHaveAttribute('autoPlay')
    expect(video).toHaveAttribute('playsInline')
    expect(video).toHaveAttribute('muted')
  })

  it('should hide video when not streaming', () => {
    mockUseCamera.isStreaming = false

    render(
      <CameraModal
        isOpen={true}
        onClose={mockOnClose}
        onCapture={mockOnCapture}
      />
    )

    const video = document.querySelector('video')
    expect(video).toHaveClass('opacity-0')
  })

  it('should show video when streaming', () => {
    mockUseCamera.isStreaming = true

    render(
      <CameraModal
        isOpen={true}
        onClose={mockOnClose}
        onCapture={mockOnCapture}
      />
    )

    const video = document.querySelector('video')
    expect(video).not.toHaveClass('opacity-0')
  })

  it('should have hidden canvas element', () => {
    render(
      <CameraModal
        isOpen={true}
        onClose={mockOnClose}
        onCapture={mockOnCapture}
      />
    )

    const canvas = document.querySelector('canvas')
    expect(canvas).toBeInTheDocument()
    expect(canvas).toHaveClass('hidden')
  })
})