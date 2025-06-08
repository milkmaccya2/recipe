import { atom } from 'jotai'
import { atomWithStorage } from 'jotai/utils'

// アップロード状態の管理
export interface UploadState {
  isUploading: boolean
  progress: number
  error: string | null
  uploadId: string | null
}

export interface AnalysisResult {
  ingredients: Array<{
    name: string
    confidence: number
    boundingBox?: {
      x: number
      y: number
      width: number
      height: number
    }
  }>
  confidence: number
  processingTime: number
}

export interface UploadedImage {
  id: string
  file: File
  imageUrl: string
  analysis?: AnalysisResult
  createdAt: Date
}

// 基本的なupload状態
export const uploadStateAtom = atom<UploadState>({
  isUploading: false,
  progress: 0,
  error: null,
  uploadId: null
})

// アップロードされた画像一覧（セッション中のみ保持）
export const uploadedImagesAtom = atom<UploadedImage[]>([])

// 現在選択されている画像
export const selectedImageAtom = atom<UploadedImage | null>(null)

// 識別された食材リスト
export const identifiedIngredientsAtom = atom<string[]>([])

// お気に入り画像（永続化）
export const favoriteImagesAtom = atomWithStorage<string[]>('favorite-images', [])

// 派生atom: アップロード中かどうか
export const isUploadingAtom = atom((get) => get(uploadStateAtom).isUploading)

// 派生atom: エラーがあるかどうか
export const hasUploadErrorAtom = atom((get) => get(uploadStateAtom).error !== null)

// 派生atom: 解析済みの画像があるかどうか
export const hasAnalyzedImagesAtom = atom((get) => {
  const images = get(uploadedImagesAtom)
  return images.some(img => img.analysis)
})

// アクション: 画像のアップロード開始
export const startUploadAtom = atom(
  null,
  (get, set, file: File) => {
    set(uploadStateAtom, {
      isUploading: true,
      progress: 0,
      error: null,
      uploadId: `upload_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
    })
    
    // 新しい画像を追加
    const newImage: UploadedImage = {
      id: `img_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      file,
      imageUrl: URL.createObjectURL(file),
      createdAt: new Date()
    }
    
    set(uploadedImagesAtom, (prev) => [...prev, newImage])
    set(selectedImageAtom, newImage)
  }
)

// アクション: アップロード進捗の更新
export const updateUploadProgressAtom = atom(
  null,
  (get, set, progress: number) => {
    const currentState = get(uploadStateAtom)
    set(uploadStateAtom, {
      ...currentState,
      progress: Math.max(0, Math.min(100, progress))
    })
  }
)

// アクション: アップロード完了
export const completeUploadAtom = atom(
  null,
  (get, set, result: { imageUrl: string; analysis: AnalysisResult }) => {
    const currentState = get(uploadStateAtom)
    const selectedImage = get(selectedImageAtom)
    
    set(uploadStateAtom, {
      ...currentState,
      isUploading: false,
      progress: 100,
      error: null
    })
    
    if (selectedImage) {
      // 選択中の画像を更新
      const updatedImage: UploadedImage = {
        ...selectedImage,
        imageUrl: result.imageUrl,
        analysis: result.analysis
      }
      
      set(uploadedImagesAtom, (prev) =>
        prev.map(img => img.id === selectedImage.id ? updatedImage : img)
      )
      
      set(selectedImageAtom, updatedImage)
      
      // 識別された食材を更新
      const ingredients = result.analysis.ingredients.map(ing => ing.name)
      set(identifiedIngredientsAtom, ingredients)
    }
  }
)

// アクション: アップロードエラー
export const setUploadErrorAtom = atom(
  null,
  (get, set, error: string) => {
    const currentState = get(uploadStateAtom)
    set(uploadStateAtom, {
      ...currentState,
      isUploading: false,
      error
    })
  }
)

// アクション: エラーのクリア
export const clearUploadErrorAtom = atom(
  null,
  (get, set) => {
    const currentState = get(uploadStateAtom)
    set(uploadStateAtom, {
      ...currentState,
      error: null
    })
  }
)

// アクション: 画像の削除
export const removeImageAtom = atom(
  null,
  (get, set, imageId: string) => {
    const selectedImage = get(selectedImageAtom)
    
    set(uploadedImagesAtom, (prev) => prev.filter(img => img.id !== imageId))
    
    // 選択中の画像が削除された場合
    if (selectedImage && selectedImage.id === imageId) {
      const remainingImages = get(uploadedImagesAtom)
      set(selectedImageAtom, remainingImages.length > 0 ? remainingImages[0] : null)
    }
  }
)

// アクション: 全ての画像をクリア
export const clearAllImagesAtom = atom(
  null,
  (get, set) => {
    set(uploadedImagesAtom, [])
    set(selectedImageAtom, null)
    set(identifiedIngredientsAtom, [])
    set(uploadStateAtom, {
      isUploading: false,
      progress: 0,
      error: null,
      uploadId: null
    })
  }
)