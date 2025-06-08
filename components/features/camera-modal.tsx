'use client'

import { useEffect } from 'react'
import { X, Camera, RotateCcw, Loader2 } from 'lucide-react'
import { useCamera } from '@/hooks/use-camera'
import { cn } from '@/lib/utils'

interface CameraModalProps {
  isOpen: boolean
  onClose: () => void
  onCapture: (file: File) => void
}

export function CameraModal({ isOpen, onClose, onCapture }: CameraModalProps) {
  const {
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
  } = useCamera({
    onCapture,
    onError: (error) => console.error('Camera error:', error)
  })

  useEffect(() => {
    if (isOpen && isSupported) {
      startCamera()
    }
    
    return () => {
      if (isOpen) {
        stopCamera()
      }
    }
  }, [isOpen, isSupported, startCamera, stopCamera])

  const handleCapture = async () => {
    const file = await capturePhoto()
    if (file) {
      onClose()
    }
  }

  const handleClose = () => {
    stopCamera()
    onClose()
  }

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 z-50 bg-black bg-opacity-75 flex items-center justify-center p-4">
      <div className="bg-white rounded-lg max-w-2xl w-full max-h-[90vh] overflow-hidden">
        {/* ヘッダー */}
        <div className="flex items-center justify-between p-4 border-b">
          <h2 className="text-lg font-semibold">カメラで撮影</h2>
          <button
            onClick={handleClose}
            className="p-2 hover:bg-gray-100 rounded-full transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* コンテンツ */}
        <div className="p-4">
          {!isSupported ? (
            <div className="text-center py-8">
              <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <Camera className="w-8 h-8 text-gray-400" />
              </div>
              <p className="text-gray-600">お使いのブラウザはカメラ機能をサポートしていません</p>
            </div>
          ) : error ? (
            <div className="text-center py-8">
              <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <Camera className="w-8 h-8 text-red-400" />
              </div>
              <p className="text-red-600 mb-4">{error}</p>
              <button
                onClick={startCamera}
                className="bg-orange-500 hover:bg-orange-600 text-white px-4 py-2 rounded-lg transition-colors"
              >
                再試行
              </button>
            </div>
          ) : (
            <div className="space-y-4">
              {/* カメラプレビュー */}
              <div className="relative bg-gray-900 rounded-lg overflow-hidden aspect-video">
                <video
                  ref={videoRef}
                  autoPlay
                  playsInline
                  muted
                  className={cn(
                    "w-full h-full object-cover",
                    !isStreaming && "opacity-0"
                  )}
                />
                
                {!isStreaming && (
                  <div className="absolute inset-0 flex items-center justify-center">
                    <div className="text-center">
                      <Loader2 className="w-8 h-8 text-white animate-spin mx-auto mb-2" />
                      <p className="text-white text-sm">カメラを起動中...</p>
                    </div>
                  </div>
                )}

                {/* 撮影時のフラッシュエフェクト */}
                {isCapturing && (
                  <div className="absolute inset-0 bg-white opacity-50 animate-pulse" />
                )}
              </div>

              {/* 隠しキャンバス（撮影用） */}
              <canvas
                ref={canvasRef}
                className="hidden"
              />

              {/* コントロールボタン */}
              {isStreaming && (
                <div className="flex items-center justify-center space-x-4">
                  <button
                    onClick={switchCamera}
                    className="p-3 bg-gray-100 hover:bg-gray-200 rounded-full transition-colors"
                    title="カメラを切り替え"
                  >
                    <RotateCcw className="w-5 h-5" />
                  </button>
                  
                  <button
                    onClick={handleCapture}
                    disabled={isCapturing}
                    className={cn(
                      "p-4 bg-orange-500 hover:bg-orange-600 text-white rounded-full transition-colors",
                      "disabled:opacity-50 disabled:cursor-not-allowed"
                    )}
                    title="撮影"
                  >
                    {isCapturing ? (
                      <Loader2 className="w-6 h-6 animate-spin" />
                    ) : (
                      <Camera className="w-6 h-6" />
                    )}
                  </button>
                </div>
              )}

              {/* 使い方ガイド */}
              <div className="text-center text-sm text-gray-500">
                <p>食材がフレームに収まるように撮影してください</p>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}