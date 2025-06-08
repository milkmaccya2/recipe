'use client'

import { useCallback, useState } from 'react'
import { useDropzone } from 'react-dropzone'
import { Camera, Upload, X, Loader2 } from 'lucide-react'
import { validateImageFile, formatFileSize } from '@/lib/utils'

interface ImageUploadProps {
  onImageSelect?: (file: File) => void
}

export function ImageUpload({ onImageSelect }: ImageUploadProps) {
  const [selectedFiles, setSelectedFiles] = useState<File[]>([])
  const [error, setError] = useState<string>('')
  const [uploading, setUploading] = useState(false)

  const onDrop = useCallback((acceptedFiles: File[]) => {
    setError('')
    const validFiles: File[] = []
    
    for (const file of acceptedFiles) {
      const validation = validateImageFile(file)
      if (validation.isValid) {
        validFiles.push(file)
      } else {
        setError(validation.error || 'ファイルが無効です')
        return
      }
    }
    
    setSelectedFiles(prev => [...prev, ...validFiles])
    if (validFiles.length > 0 && onImageSelect) {
      onImageSelect(validFiles[0])
    }
  }, [onImageSelect])

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: {
      'image/*': ['.jpeg', '.jpg', '.png', '.webp']
    },
    maxFiles: 5,
    multiple: true
  })

  const openCamera = async () => {
    try {
      if (typeof navigator !== 'undefined' && navigator.mediaDevices) {
        // カメラアクセスの実装（後ほど詳細実装）
        console.log('Camera access requested')
      } else {
        setError('カメラ機能がサポートされていません')
      }
    } catch (err) {
      setError('カメラにアクセスできませんでした')
    }
  }

  const removeFile = (index: number) => {
    setSelectedFiles(prev => prev.filter((_, i) => i !== index))
  }

  const handleUpload = async () => {
    if (selectedFiles.length === 0) return
    
    setUploading(true)
    try {
      // アップロード処理の実装（後ほど詳細実装）
      console.log('Uploading files:', selectedFiles)
      await new Promise(resolve => setTimeout(resolve, 2000)) // デモ用の遅延
    } catch (err) {
      setError('アップロードに失敗しました')
    } finally {
      setUploading(false)
    }
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
      {error && (
        <div className="mt-4 p-4 bg-red-50 border border-red-200 rounded-lg">
          <p className="text-red-600 text-sm">{error}</p>
        </div>
      )}

      {/* 選択されたファイル一覧 */}
      {selectedFiles.length > 0 && (
        <div className="mt-6 space-y-3">
          <h3 className="text-lg font-semibold">選択された画像</h3>
          
          <div className="space-y-2">
            {selectedFiles.map((file, index) => (
              <div
                key={index}
                className="flex items-center justify-between p-3 bg-gray-50 rounded-lg"
              >
                <div className="flex items-center space-x-3">
                  <div className="w-12 h-12 bg-gray-200 rounded-lg flex items-center justify-center">
                    <img
                      src={URL.createObjectURL(file)}
                      alt={file.name}
                      className="w-full h-full object-cover rounded-lg"
                    />
                  </div>
                  <div>
                    <p className="font-medium text-gray-900">{file.name}</p>
                    <p className="text-sm text-gray-500">{formatFileSize(file.size)}</p>
                  </div>
                </div>
                
                <button
                  onClick={() => removeFile(index)}
                  className="text-gray-400 hover:text-red-500 transition-colors"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
            ))}
          </div>
          
          <button
            onClick={handleUpload}
            disabled={uploading}
            className="w-full bg-orange-500 hover:bg-orange-600 disabled:opacity-50 text-white py-3 rounded-lg transition-colors flex items-center justify-center space-x-2"
          >
            {uploading ? (
              <>
                <Loader2 className="w-5 h-5 animate-spin" />
                <span>解析中...</span>
              </>
            ) : (
              <span>画像を解析する</span>
            )}
          </button>
        </div>
      )}
    </div>
  )
}