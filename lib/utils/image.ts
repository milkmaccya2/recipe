/**
 * 画像処理関連のユーティリティ関数
 */

import { IMAGE_OPTIMIZATION } from '@/lib/constants'

/**
 * ファイルをBase64文字列に変換
 */
export function fileToBase64(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.onload = () => {
      if (typeof reader.result === 'string') {
        resolve(reader.result)
      } else {
        reject(new Error('Failed to convert file to base64'))
      }
    }
    reader.onerror = () => reject(new Error('Failed to read file'))
    reader.readAsDataURL(file)
  })
}

/**
 * Base64文字列からBlobを作成
 */
export function base64ToBlob(base64: string, mimeType: string): Blob {
  const base64Data = base64.split(',')[1]
  const byteCharacters = atob(base64Data)
  const byteNumbers = new Array(byteCharacters.length)
  
  for (let i = 0; i < byteCharacters.length; i++) {
    byteNumbers[i] = byteCharacters.charCodeAt(i)
  }
  
  const byteArray = new Uint8Array(byteNumbers)
  return new Blob([byteArray], { type: mimeType })
}

/**
 * 画像のリサイズ
 */
export function resizeImage(
  file: File,
  maxWidth: number = IMAGE_OPTIMIZATION.upload.maxDimensions.width,
  maxHeight: number = IMAGE_OPTIMIZATION.upload.maxDimensions.height,
  quality: number = IMAGE_OPTIMIZATION.upload.quality
): Promise<File> {
  return new Promise((resolve, reject) => {
    const canvas = document.createElement('canvas')
    const ctx = canvas.getContext('2d')
    const img = new Image()
    
    if (!ctx) {
      reject(new Error('Canvas context not available'))
      return
    }
    
    img.onload = () => {
      // アスペクト比を維持しながらリサイズ
      const { width, height } = calculateDimensions(
        img.width,
        img.height,
        maxWidth,
        maxHeight
      )
      
      canvas.width = width
      canvas.height = height
      
      // 画像を描画
      ctx.drawImage(img, 0, 0, width, height)
      
      // Blobに変換
      canvas.toBlob(
        (blob) => {
          if (blob) {
            const resizedFile = new File([blob], file.name, {
              type: file.type,
              lastModified: Date.now()
            })
            resolve(resizedFile)
          } else {
            reject(new Error('Failed to resize image'))
          }
        },
        file.type,
        quality
      )
    }
    
    img.onerror = () => reject(new Error('Failed to load image'))
    img.src = URL.createObjectURL(file)
  })
}

/**
 * 画像の最適な寸法を計算
 */
function calculateDimensions(
  originalWidth: number,
  originalHeight: number,
  maxWidth: number,
  maxHeight: number
): { width: number; height: number } {
  let { width, height } = { width: originalWidth, height: originalHeight }
  
  // 最大サイズを超えている場合のみリサイズ
  if (width > maxWidth || height > maxHeight) {
    const aspectRatio = width / height
    
    if (width > height) {
      width = Math.min(width, maxWidth)
      height = width / aspectRatio
    } else {
      height = Math.min(height, maxHeight)
      width = height * aspectRatio
    }
  }
  
  return { width: Math.round(width), height: Math.round(height) }
}

/**
 * EXIF情報に基づいて画像を回転
 */
export function correctImageOrientation(file: File): Promise<File> {
  return new Promise((resolve) => {
    // 簡易実装：EXIF対応は後で詳細実装
    // 現在はそのまま返す
    resolve(file)
  })
}

/**
 * 画像の前処理（リサイズ + 回転補正）
 */
export async function preprocessImage(file: File): Promise<File> {
  try {
    // 1. 回転補正
    const orientedFile = await correctImageOrientation(file)
    
    // 2. リサイズ（必要な場合のみ）
    const { maxDimensions } = IMAGE_OPTIMIZATION.upload
    if (file.size > IMAGE_OPTIMIZATION.upload.maxSize) {
      return await resizeImage(orientedFile, maxDimensions.width, maxDimensions.height)
    }
    
    return orientedFile
  } catch (error) {
    console.error('Image preprocessing failed:', error)
    return file // エラーの場合は元ファイルを返す
  }
}

/**
 * サムネイル生成
 */
export function generateThumbnail(
  file: File,
  size: number = IMAGE_OPTIMIZATION.thumbnail.sizes[0]
): Promise<File> {
  return resizeImage(
    file,
    size,
    size,
    IMAGE_OPTIMIZATION.thumbnail.quality
  )
}