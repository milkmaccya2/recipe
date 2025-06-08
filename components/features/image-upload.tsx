'use client'

import { useCallback, useState } from 'react'
import { useAtom } from 'jotai'
import { useDropzone } from 'react-dropzone'
import { Camera, Upload, X, Loader2 } from 'lucide-react'
import { validateImageFile, formatFileSize } from '@/lib/utils'
import { fileToBase64 } from '@/lib/utils/image'
import { CameraModal } from './camera-modal'
import {
  uploadStateAtom,
  uploadedImagesAtom,
  startUploadAtom,
  updateUploadProgressAtom,
  completeUploadAtom,
  setUploadErrorAtom,
  clearUploadErrorAtom,
  removeImageAtom
} from '@/stores/upload'

interface ImageUploadProps {
  onImageSelect?: (file: File) => void
}

export function ImageUpload({ onImageSelect }: ImageUploadProps) {
  const [uploadState] = useAtom(uploadStateAtom)
  const [uploadedImages] = useAtom(uploadedImagesAtom)
  const [, startUpload] = useAtom(startUploadAtom)
  const [, updateProgress] = useAtom(updateUploadProgressAtom)
  const [, completeUpload] = useAtom(completeUploadAtom)
  const [, setError] = useAtom(setUploadErrorAtom)
  const [, clearError] = useAtom(clearUploadErrorAtom)
  const [, removeImage] = useAtom(removeImageAtom)
  
  const [isCameraOpen, setIsCameraOpen] = useState(false)

  const onDrop = useCallback((acceptedFiles: File[]) => {
    clearError()
    
    for (const file of acceptedFiles) {
      const validation = validateImageFile(file)
      if (validation.isValid) {
        handleFileUpload(file)
      } else {
        setError(validation.error || 'ファイルが無効です')
        return
      }
    }
  }, [clearError, setError])

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: {
      'image/*': ['.jpeg', '.jpg', '.png', '.webp']
    },
    maxFiles: 5,
    multiple: true
  })

  const openCamera = () => {
    setIsCameraOpen(true)
  }

  const handleFileUpload = async (file: File) => {
    try {
      // アップロード開始
      startUpload(file)
      
      if (onImageSelect) {
        onImageSelect(file)
      }
      
      // ファイルをBase64に変換
      updateProgress(10)
      const base64Data = await fileToBase64(file)
      
      updateProgress(30)
      
      // APIにアップロード
      const response = await fetch('/api/upload', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          image: base64Data,
          filename: file.name,
        }),
      })
      
      updateProgress(70)
      
      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error?.message || 'アップロードに失敗しました')
      }
      
      const result = await response.json()
      updateProgress(100)
      
      // アップロード完了
      completeUpload({
        imageUrl: result.data.imageUrl,
        analysis: result.data.analysis
      })
      
    } catch (error) {
      console.error('Upload error:', error)
      setError(error instanceof Error ? error.message : 'アップロードに失敗しました')
    }
  }

  const handleCameraCapture = (file: File) => {
    const validation = validateImageFile(file)
    if (validation.isValid) {
      handleFileUpload(file)
    } else {
      setError(validation.error || 'ファイルが無効です')
    }
    setIsCameraOpen(false)
  }

  const handleRemoveImage = (imageId: string) => {
    removeImage(imageId)
  }

  return (
    <div className="w-full max-w-2xl mx-auto">
      {/* アップロードエリア */}
      <div
        {...getRootProps()}
        className={`
          border-2 border-dashed rounded-xl p-8 text-center cursor-pointer
          transition-all duration-200 ease-in-out
          ${isDragActive 
            ? 'border-orange-400 bg-orange-50' 
            : 'border-gray-300 hover:border-orange-400 hover:bg-orange-50'
          }
        `}
      >
        <input {...getInputProps()} />
        
        <div className="space-y-4">
          <div className="flex justify-center space-x-4">
            <button
              type="button"
              onClick={openCamera}
              className="flex items-center space-x-2 bg-orange-500 hover:bg-orange-600 text-white px-6 py-3 rounded-lg transition-colors"
            >
              <Camera className="w-5 h-5" />
              <span>カメラで撮影</span>
            </button>
            
            <div className="flex items-center space-x-2 bg-gray-100 hover:bg-gray-200 text-gray-700 px-6 py-3 rounded-lg transition-colors">
              <Upload className="w-5 h-5" />
              <span>ファイルを選択</span>
            </div>
          </div>
          
          <p className="text-gray-500">
            または画像をここにドラッグ&ドロップ
          </p>
          
          <p className="text-sm text-gray-400">
            JPEG, PNG, WebP形式（最大10MB）
          </p>
        </div>
      </div>

      {/* エラー表示 */}
      {uploadState.error && (
        <div className="mt-4 p-4 bg-red-50 border border-red-200 rounded-lg">
          <p className="text-red-600 text-sm">{uploadState.error}</p>
        </div>
      )}

      {/* アップロード進捗表示 */}
      {uploadState.isUploading && (
        <div className="mt-4 p-4 bg-blue-50 border border-blue-200 rounded-lg">
          <div className="flex items-center space-x-3">
            <Loader2 className="w-5 h-5 animate-spin text-blue-600" />
            <div className="flex-1">
              <p className="text-sm text-blue-600 mb-1">画像を解析中...</p>
              <div className="w-full bg-blue-200 rounded-full h-2">
                <div 
                  className="bg-blue-600 h-2 rounded-full transition-all duration-300"
                  style={{ width: `${uploadState.progress}%` }}
                ></div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* アップロード済み画像一覧 */}
      {uploadedImages.length > 0 && (
        <div className="mt-6 space-y-3">
          <h3 className="text-lg font-semibold">解析済み画像</h3>
          
          <div className="space-y-2">
            {uploadedImages.map((image) => (
              <div
                key={image.id}
                className="flex items-center justify-between p-3 bg-gray-50 rounded-lg"
              >
                <div className="flex items-center space-x-3">
                  <div className="w-12 h-12 bg-gray-200 rounded-lg flex items-center justify-center">
                    <img
                      src={image.imageUrl}
                      alt={image.file.name}
                      className="w-full h-full object-cover rounded-lg"
                    />
                  </div>
                  <div className="flex-1">
                    <p className="font-medium text-gray-900">{image.file.name}</p>
                    <p className="text-sm text-gray-500">{formatFileSize(image.file.size)}</p>
                    {image.analysis && (
                      <p className="text-sm text-green-600">
                        {image.analysis.ingredients.length}種類の食材を検出
                      </p>
                    )}
                  </div>
                </div>
                
                <button
                  onClick={() => handleRemoveImage(image.id)}
                  className="text-gray-400 hover:text-red-500 transition-colors"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* カメラモーダル */}
      <CameraModal
        isOpen={isCameraOpen}
        onClose={() => setIsCameraOpen(false)}
        onCapture={handleCameraCapture}
      />
    </div>
  )
}