'use client'

import { useCallback, useRef, useState } from 'react'

interface UseCameraOptions {
  width?: number
  height?: number
  facingMode?: 'user' | 'environment'
  onCapture?: (file: File) => void
  onError?: (error: string) => void
}

interface UseCameraReturn {
  videoRef: React.RefObject<HTMLVideoElement>
  canvasRef: React.RefObject<HTMLCanvasElement>
  isSupported: boolean
  isStreaming: boolean
  isCapturing: boolean
  startCamera: () => Promise<void>
  stopCamera: () => void
  capturePhoto: () => Promise<File | null>
  switchCamera: () => Promise<void>
  error: string | null
}

export function useCamera({
  width = 1280,
  height = 720,
  facingMode = 'environment',
  onCapture,
  onError
}: UseCameraOptions = {}): UseCameraReturn {
  const videoRef = useRef<HTMLVideoElement>(null)
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const streamRef = useRef<MediaStream | null>(null)
  
  const [isStreaming, setIsStreaming] = useState(false)
  const [isCapturing, setIsCapturing] = useState(false)
  const [currentFacingMode, setCurrentFacingMode] = useState(facingMode)
  const [error, setError] = useState<string | null>(null)

  // カメラサポート確認
  const isSupported = typeof navigator !== 'undefined' && 
    !!navigator.mediaDevices && 
    !!navigator.mediaDevices.getUserMedia

  const startCamera = useCallback(async () => {
    if (!isSupported) {
      const errorMsg = 'カメラ機能がサポートされていません'
      setError(errorMsg)
      onError?.(errorMsg)
      return
    }

    try {
      setError(null)
      
      const constraints: MediaStreamConstraints = {
        video: {
          width: { ideal: width },
          height: { ideal: height },
          facingMode: { ideal: currentFacingMode }
        },
        audio: false
      }

      const stream = await navigator.mediaDevices.getUserMedia(constraints)
      streamRef.current = stream

      if (videoRef.current) {
        videoRef.current.srcObject = stream
        videoRef.current.onloadedmetadata = () => {
          videoRef.current?.play()
          setIsStreaming(true)
        }
      }
    } catch (err) {
      const errorMsg = err instanceof Error 
        ? `カメラにアクセスできませんでした: ${err.message}`
        : 'カメラにアクセスできませんでした'
      setError(errorMsg)
      onError?.(errorMsg)
      console.error('Camera access error:', err)
    }
  }, [isSupported, width, height, currentFacingMode, onError])

  const stopCamera = useCallback(() => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(track => track.stop())
      streamRef.current = null
    }
    
    if (videoRef.current) {
      videoRef.current.srcObject = null
    }
    
    setIsStreaming(false)
    setError(null)
  }, [])

  const capturePhoto = useCallback(async (): Promise<File | null> => {
    if (!videoRef.current || !canvasRef.current || !isStreaming) {
      return null
    }

    try {
      setIsCapturing(true)
      
      const video = videoRef.current
      const canvas = canvasRef.current
      const context = canvas.getContext('2d')
      
      if (!context) {
        throw new Error('Canvas context not available')
      }

      // キャンバスサイズをビデオサイズに合わせる
      canvas.width = video.videoWidth
      canvas.height = video.videoHeight

      // ビデオフレームをキャンバスに描画
      context.drawImage(video, 0, 0, canvas.width, canvas.height)

      // キャンバスからBlobを生成
      return new Promise((resolve) => {
        canvas.toBlob((blob) => {
          if (blob) {
            const timestamp = Date.now()
            const file = new File(
              [blob], 
              `camera-capture-${timestamp}.jpg`, 
              { type: 'image/jpeg' }
            )
            onCapture?.(file)
            resolve(file)
          } else {
            resolve(null)
          }
          setIsCapturing(false)
        }, 'image/jpeg', 0.9)
      })
    } catch (err) {
      const errorMsg = '写真の撮影に失敗しました'
      setError(errorMsg)
      onError?.(errorMsg)
      setIsCapturing(false)
      return null
    }
  }, [isStreaming, onCapture, onError])

  const switchCamera = useCallback(async () => {
    if (!isSupported || !isStreaming) return

    const newFacingMode = currentFacingMode === 'user' ? 'environment' : 'user'
    setCurrentFacingMode(newFacingMode)
    
    // カメラを停止して再開
    stopCamera()
    setTimeout(() => {
      startCamera()
    }, 100)
  }, [isSupported, isStreaming, currentFacingMode, stopCamera, startCamera])

  return {
    videoRef,
    canvasRef,
    isSupported,
    isStreaming,
    isCapturing,
    startCamera,
    stopCamera,
    capturePhoto,
    switchCamera,
    error
  }
}