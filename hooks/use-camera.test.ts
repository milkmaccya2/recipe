import { renderHook, act } from '@testing-library/react'
import { useCamera } from './use-camera'

// Mock navigator.mediaDevices
const mockGetUserMedia = jest.fn()
Object.defineProperty(global.navigator, 'mediaDevices', {
  writable: true,
  value: {
    getUserMedia: mockGetUserMedia,
  },
})

// Mock HTMLVideoElement
const mockVideoElement = {
  srcObject: null,
  onloadedmetadata: null,
  play: jest.fn().mockResolvedValue(undefined),
}

// Mock HTMLCanvasElement
const mockCanvasElement = {
  getContext: jest.fn().mockReturnValue({
    drawImage: jest.fn(),
  }),
  toBlob: jest.fn(),
  width: 0,
  height: 0,
}

jest.mock('react', () => ({
  ...jest.requireActual('react'),
  useRef: jest.fn(() => ({ current: null })),
  useCallback: jest.fn(fn => fn),
  useState: jest.fn(initial => [initial, jest.fn()]),
}))

// Mock useRef
const mockVideoRef = { current: mockVideoElement }
const mockCanvasRef = { current: mockCanvasElement }

describe('useCamera hook', () => {
  beforeEach(() => {
    jest.clearAllMocks()
    
    // Reset video element mock
    Object.assign(mockVideoElement, {
      srcObject: null,
      onloadedmetadata: null,
      videoWidth: 1280,
      videoHeight: 720,
    })

    // Reset canvas context mock
    mockCanvasElement.getContext.mockReturnValue({
      drawImage: jest.fn(),
    })
  })

  it('should initialize with correct default values', () => {
    const { result } = renderHook(() => useCamera())

    expect(result.current.isSupported).toBe(true)
    expect(result.current.isStreaming).toBe(false)
    expect(result.current.isCapturing).toBe(false)
    expect(result.current.error).toBeNull()
  })

  it('should detect unsupported environment', () => {
    // Mock unsupported environment
    Object.defineProperty(global.navigator, 'mediaDevices', {
      writable: true,
      value: undefined,
    })

    const { result } = renderHook(() => useCamera())

    expect(result.current.isSupported).toBe(false)

    // Restore
    Object.defineProperty(global.navigator, 'mediaDevices', {
      writable: true,
      value: { getUserMedia: mockGetUserMedia },
    })
  })

  it('should start camera successfully', async () => {
    const mockStream = {
      getTracks: jest.fn().mockReturnValue([]),
    }
    mockGetUserMedia.mockResolvedValue(mockStream)

    const { result } = renderHook(() => useCamera())

    await act(async () => {
      await result.current.startCamera()
    })

    expect(mockGetUserMedia).toHaveBeenCalledWith({
      video: {
        width: { ideal: 1280 },
        height: { ideal: 720 },
        facingMode: { ideal: 'environment' },
      },
      audio: false,
    })
  })

  it('should handle camera start error', async () => {
    const mockError = new Error('Camera access denied')
    mockGetUserMedia.mockRejectedValue(mockError)

    const onError = jest.fn()
    const { result } = renderHook(() => useCamera({ onError }))

    await act(async () => {
      await result.current.startCamera()
    })

    expect(onError).toHaveBeenCalledWith('カメラにアクセスできませんでした: Camera access denied')
  })

  it('should stop camera and clean up', async () => {
    const mockTrack = { stop: jest.fn() }
    const mockStream = {
      getTracks: jest.fn().mockReturnValue([mockTrack]),
    }

    // Start camera first
    mockGetUserMedia.mockResolvedValue(mockStream)
    const { result } = renderHook(() => useCamera())

    await act(async () => {
      await result.current.startCamera()
    })

    // Stop camera
    act(() => {
      result.current.stopCamera()
    })

    expect(mockTrack.stop).toHaveBeenCalled()
    expect(mockVideoElement.srcObject).toBeNull()
  })

  it('should capture photo successfully', async () => {
    const mockBlob = new Blob(['fake image data'], { type: 'image/jpeg' })
    mockCanvasElement.toBlob.mockImplementation((callback) => {
      callback(mockBlob)
    })

    const onCapture = jest.fn()
    const { result } = renderHook(() => useCamera({ onCapture }))

    // Mock streaming state
    const mockSetState = jest.fn()
    jest.spyOn(require('react'), 'useState')
      .mockImplementationOnce(() => [false, mockSetState]) // isStreaming
      .mockImplementationOnce(() => [true, mockSetState])  // isStreaming = true for capture
      .mockImplementationOnce(() => [false, mockSetState]) // isCapturing
      .mockImplementationOnce(() => ['environment', mockSetState]) // currentFacingMode
      .mockImplementationOnce(() => [null, mockSetState])  // error

    await act(async () => {
      const file = await result.current.capturePhoto()
      expect(file).toBeInstanceOf(File)
      expect(onCapture).toHaveBeenCalledWith(expect.any(File))
    })
  })

  it('should handle photo capture failure', async () => {
    // Mock canvas toBlob to return null
    mockCanvasElement.toBlob.mockImplementation((callback) => {
      callback(null)
    })

    const { result } = renderHook(() => useCamera())

    // Mock streaming state to true
    const mockSetState = jest.fn()
    jest.spyOn(require('react'), 'useState')
      .mockImplementationOnce(() => [false, mockSetState]) // isStreaming
      .mockImplementationOnce(() => [true, mockSetState])  // isStreaming = true for capture

    await act(async () => {
      const file = await result.current.capturePhoto()
      expect(file).toBeNull()
    })
  })

  it('should switch camera facing mode', async () => {
    const mockStream = {
      getTracks: jest.fn().mockReturnValue([{ stop: jest.fn() }]),
    }
    mockGetUserMedia.mockResolvedValue(mockStream)

    const { result } = renderHook(() => useCamera())

    // Start camera first
    await act(async () => {
      await result.current.startCamera()
    })

    // Switch camera
    await act(async () => {
      await result.current.switchCamera()
    })

    // Should have called getUserMedia twice (initial + switch)
    expect(mockGetUserMedia).toHaveBeenCalledTimes(2)
  })

  it('should use custom dimensions', () => {
    const customOptions = {
      width: 1920,
      height: 1080,
      facingMode: 'user' as const,
    }

    renderHook(() => useCamera(customOptions))

    // Test would verify that custom dimensions are used in getUserMedia call
    // This is primarily testing the hook's parameter handling
  })
})