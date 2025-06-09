import { renderHook, act } from '@testing-library/react'
import { useCamera } from './use-camera'

// シンプルなモック設定
const mockGetUserMedia = jest.fn()
const mockStream = {
  getTracks: jest.fn().mockReturnValue([{ stop: jest.fn() }]),
}

Object.defineProperty(global.navigator, 'mediaDevices', {
  writable: true,
  value: { getUserMedia: mockGetUserMedia },
})

describe('useCamera', () => {
  beforeEach(() => {
    jest.clearAllMocks()
    mockGetUserMedia.mockResolvedValue(mockStream)
  })

  it('初期状態の確認', () => {
    const { result } = renderHook(() => useCamera())

    expect(result.current.isSupported).toBe(true)
    expect(result.current.isStreaming).toBe(false)
    expect(result.current.isCapturing).toBe(false)
    expect(result.current.error).toBeNull()
  })

  it('カメラサポートなしの環境', () => {
    Object.defineProperty(global.navigator, 'mediaDevices', {
      writable: true,
      value: undefined,
    })

    const { result } = renderHook(() => useCamera())
    expect(result.current.isSupported).toBe(false)

    // 復元
    Object.defineProperty(global.navigator, 'mediaDevices', {
      writable: true,
      value: { getUserMedia: mockGetUserMedia },
    })
  })

  it('カメラ開始の成功', async () => {
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

  it('カメラエラー時の処理', async () => {
    mockGetUserMedia.mockRejectedValue(new Error('カメラアクセス拒否'))

    const onError = jest.fn()
    const { result } = renderHook(() => useCamera({ onError }))

    await act(async () => {
      await result.current.startCamera()
    })

    expect(onError).toHaveBeenCalled()
  })

  it('カメラ停止の動作', async () => {
    const mockTrack = { stop: jest.fn() }
    mockStream.getTracks.mockReturnValue([mockTrack])

    const { result } = renderHook(() => useCamera())

    await act(async () => {
      await result.current.startCamera()
    })

    act(() => {
      result.current.stopCamera()
    })

    expect(mockTrack.stop).toHaveBeenCalled()
  })

  it('カメラ切り替えの動作', async () => {
    const { result } = renderHook(() => useCamera())

    await act(async () => {
      await result.current.startCamera()
    })

    act(() => {
      result.current.switchCamera()
    })

    expect(mockGetUserMedia).toHaveBeenCalledTimes(1)
  })
})