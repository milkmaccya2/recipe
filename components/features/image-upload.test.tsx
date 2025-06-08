import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import { act } from 'react-dom/test-utils'
import { ImageUpload } from './image-upload'

// Mock react-dropzone
const mockGetRootProps = jest.fn(() => ({}))
const mockGetInputProps = jest.fn(() => ({}))
const mockUseDropzone = jest.fn()

jest.mock('react-dropzone', () => ({
  useDropzone: (options: any) => {
    mockUseDropzone(options)
    return {
      getRootProps: mockGetRootProps,
      getInputProps: mockGetInputProps,
      isDragActive: false,
    }
  },
}))

// Mock Jotai atoms
const mockUploadState = {
  isUploading: false,
  progress: 0,
  error: null,
}

const mockUploadedImages: any[] = []

const mockStartUpload = jest.fn()
const mockUpdateProgress = jest.fn()
const mockCompleteUpload = jest.fn()
const mockSetError = jest.fn()
const mockClearError = jest.fn()
const mockRemoveImage = jest.fn()

jest.mock('jotai', () => ({
  useAtom: jest.fn((atom) => {
    if (atom.toString().includes('uploadState')) {
      return [mockUploadState, jest.fn()]
    }
    if (atom.toString().includes('uploadedImages')) {
      return [mockUploadedImages, jest.fn()]
    }
    if (atom.toString().includes('startUpload')) {
      return [null, mockStartUpload]
    }
    if (atom.toString().includes('updateUploadProgress')) {
      return [null, mockUpdateProgress]
    }
    if (atom.toString().includes('completeUpload')) {
      return [null, mockCompleteUpload]
    }
    if (atom.toString().includes('setUploadError')) {
      return [null, mockSetError]
    }
    if (atom.toString().includes('clearUploadError')) {
      return [null, mockClearError]
    }
    if (atom.toString().includes('removeImage')) {
      return [null, mockRemoveImage]
    }
    return [null, jest.fn()]
  }),
}))

// Mock camera modal
jest.mock('./camera-modal', () => ({
  CameraModal: ({ isOpen, onClose, onCapture }: any) => 
    isOpen ? (
      <div data-testid="camera-modal">
        <button onClick={() => onCapture(new File([''], 'camera.jpg', { type: 'image/jpeg' }))}>
          Capture
        </button>
        <button onClick={onClose}>Close</button>
      </div>
    ) : null,
}))

// Mock utils
jest.mock('@/lib/utils', () => ({
  validateImageFile: jest.fn().mockReturnValue({ isValid: true, error: null }),
  formatFileSize: jest.fn().mockReturnValue('1 MB'),
}))

jest.mock('@/lib/utils/image', () => ({
  fileToBase64: jest.fn().mockResolvedValue('data:image/jpeg;base64,fake-data'),
}))

// Mock fetch
const mockFetch = jest.fn()
global.fetch = mockFetch

describe('ImageUpload component', () => {
  beforeEach(() => {
    jest.clearAllMocks()
    mockFetch.mockResolvedValue({
      ok: true,
      json: () => Promise.resolve({
        data: {
          imageUrl: 'https://example.com/image.jpg',
          analysis: { ingredients: ['鶏肉', '玉ねぎ'] }
        }
      })
    })
  })

  it('should render upload area correctly', () => {
    render(<ImageUpload />)

    expect(screen.getByText('カメラで撮影')).toBeInTheDocument()
    expect(screen.getByText('ファイルを選択')).toBeInTheDocument()
    expect(screen.getByText('または画像をここにドラッグ&ドロップ')).toBeInTheDocument()
    expect(screen.getByText('JPEG, PNG, WebP形式（最大10MB）')).toBeInTheDocument()
  })

  it('should configure dropzone correctly', () => {
    render(<ImageUpload />)

    expect(mockUseDropzone).toHaveBeenCalledWith({
      onDrop: expect.any(Function),
      accept: {
        'image/*': ['.jpeg', '.jpg', '.png', '.webp']
      },
      maxFiles: 5,
      multiple: true
    })
  })

  it('should open camera modal when camera button is clicked', () => {
    render(<ImageUpload />)

    expect(screen.queryByTestId('camera-modal')).not.toBeInTheDocument()

    const cameraButton = screen.getByText('カメラで撮影')
    fireEvent.click(cameraButton)

    expect(screen.getByTestId('camera-modal')).toBeInTheDocument()
  })

  it('should close camera modal when close button is clicked', () => {
    render(<ImageUpload />)

    const cameraButton = screen.getByText('カメラで撮影')
    fireEvent.click(cameraButton)
    expect(screen.getByTestId('camera-modal')).toBeInTheDocument()

    const closeButton = screen.getByText('Close')
    fireEvent.click(closeButton)

    expect(screen.queryByTestId('camera-modal')).not.toBeInTheDocument()
  })

  it('should handle camera capture', async () => {
    const mockOnImageSelect = jest.fn()
    render(<ImageUpload onImageSelect={mockOnImageSelect} />)

    const cameraButton = screen.getByText('カメラで撮影')
    fireEvent.click(cameraButton)

    const captureButton = screen.getByText('Capture')
    
    await act(async () => {
      fireEvent.click(captureButton)
    })

    expect(mockStartUpload).toHaveBeenCalled()
    expect(mockOnImageSelect).toHaveBeenCalled()
  })

  it('should show error when upload state has error', () => {
    const mockUploadStateWithError = {
      ...mockUploadState,
      error: 'テストエラー'
    }

    jest.mocked(require('jotai').useAtom).mockImplementation((atom) => {
      if (atom.toString().includes('uploadState')) {
        return [mockUploadStateWithError, jest.fn()]
      }
      return [null, jest.fn()]
    })

    render(<ImageUpload />)

    expect(screen.getByText('テストエラー')).toBeInTheDocument()
  })

  it('should show upload progress when uploading', () => {
    const mockUploadStateUploading = {
      ...mockUploadState,
      isUploading: true,
      progress: 50
    }

    jest.mocked(require('jotai').useAtom).mockImplementation((atom) => {
      if (atom.toString().includes('uploadState')) {
        return [mockUploadStateUploading, jest.fn()]
      }
      return [null, jest.fn()]
    })

    render(<ImageUpload />)

    expect(screen.getByText('画像を解析中...')).toBeInTheDocument()
    
    const progressBar = document.querySelector('.bg-blue-600')
    expect(progressBar).toHaveStyle({ width: '50%' })
  })

  it('should show uploaded images list', () => {
    const mockUploadedImagesWithData = [
      {
        id: 'image-1',
        file: new File([''], 'test.jpg', { type: 'image/jpeg' }),
        imageUrl: 'https://example.com/test.jpg',
        analysis: { ingredients: ['鶏肉', '玉ねぎ'] }
      }
    ]

    jest.mocked(require('jotai').useAtom).mockImplementation((atom) => {
      if (atom.toString().includes('uploadedImages')) {
        return [mockUploadedImagesWithData, jest.fn()]
      }
      return [null, jest.fn()]
    })

    render(<ImageUpload />)

    expect(screen.getByText('解析済み画像')).toBeInTheDocument()
    expect(screen.getByText('test.jpg')).toBeInTheDocument()
    expect(screen.getByText('2種類の食材を検出')).toBeInTheDocument()
  })

  it('should handle image removal', () => {
    const mockUploadedImagesWithData = [
      {
        id: 'image-1',
        file: new File([''], 'test.jpg', { type: 'image/jpeg' }),
        imageUrl: 'https://example.com/test.jpg',
        analysis: { ingredients: ['鶏肉'] }
      }
    ]

    jest.mocked(require('jotai').useAtom).mockImplementation((atom) => {
      if (atom.toString().includes('uploadedImages')) {
        return [mockUploadedImagesWithData, jest.fn()]
      }
      if (atom.toString().includes('removeImage')) {
        return [null, mockRemoveImage]
      }
      return [null, jest.fn()]
    })

    render(<ImageUpload />)

    const removeButton = screen.getByRole('button', { name: '' })
    fireEvent.click(removeButton)

    expect(mockRemoveImage).toHaveBeenCalledWith('image-1')
  })

  it('should handle file validation error', async () => {
    const { validateImageFile } = require('@/lib/utils')
    validateImageFile.mockReturnValue({
      isValid: false,
      error: 'ファイルが大きすぎます'
    })

    render(<ImageUpload />)

    // Simulate dropzone onDrop
    const onDropFunction = mockUseDropzone.mock.calls[0][0].onDrop
    const mockFile = new File([''], 'test.jpg', { type: 'image/jpeg' })

    await act(async () => {
      onDropFunction([mockFile])
    })

    expect(mockSetError).toHaveBeenCalledWith('ファイルが大きすぎます')
  })

  it('should handle API upload error', async () => {
    mockFetch.mockResolvedValueOnce({
      ok: false,
      json: () => Promise.resolve({
        error: { message: 'サーバーエラー' }
      })
    })

    render(<ImageUpload />)

    // Simulate dropzone onDrop
    const onDropFunction = mockUseDropzone.mock.calls[0][0].onDrop
    const mockFile = new File([''], 'test.jpg', { type: 'image/jpeg' })

    await act(async () => {
      onDropFunction([mockFile])
    })

    await waitFor(() => {
      expect(mockSetError).toHaveBeenCalledWith('サーバーエラー')
    })
  })

  it('should call onImageSelect when file is selected', async () => {
    const mockOnImageSelect = jest.fn()
    render(<ImageUpload onImageSelect={mockOnImageSelect} />)

    const onDropFunction = mockUseDropzone.mock.calls[0][0].onDrop
    const mockFile = new File([''], 'test.jpg', { type: 'image/jpeg' })

    await act(async () => {
      onDropFunction([mockFile])
    })

    expect(mockOnImageSelect).toHaveBeenCalledWith(mockFile)
  })

  it('should update progress during upload', async () => {
    render(<ImageUpload />)

    const onDropFunction = mockUseDropzone.mock.calls[0][0].onDrop
    const mockFile = new File([''], 'test.jpg', { type: 'image/jpeg' })

    await act(async () => {
      onDropFunction([mockFile])
    })

    await waitFor(() => {
      expect(mockUpdateProgress).toHaveBeenCalledWith(10)
      expect(mockUpdateProgress).toHaveBeenCalledWith(30)
      expect(mockUpdateProgress).toHaveBeenCalledWith(70)
      expect(mockUpdateProgress).toHaveBeenCalledWith(100)
    })
  })

  it('should complete upload with result', async () => {
    render(<ImageUpload />)

    const onDropFunction = mockUseDropzone.mock.calls[0][0].onDrop
    const mockFile = new File([''], 'test.jpg', { type: 'image/jpeg' })

    await act(async () => {
      onDropFunction([mockFile])
    })

    await waitFor(() => {
      expect(mockCompleteUpload).toHaveBeenCalledWith({
        imageUrl: 'https://example.com/image.jpg',
        analysis: { ingredients: ['鶏肉', '玉ねぎ'] }
      })
    })
  })

  it('should handle network error during upload', async () => {
    mockFetch.mockRejectedValueOnce(new Error('Network error'))

    render(<ImageUpload />)

    const onDropFunction = mockUseDropzone.mock.calls[0][0].onDrop
    const mockFile = new File([''], 'test.jpg', { type: 'image/jpeg' })

    await act(async () => {
      onDropFunction([mockFile])
    })

    await waitFor(() => {
      expect(mockSetError).toHaveBeenCalledWith('Network error')
    })
  })
})