import { z } from 'zod'
import { IMAGE_OPTIMIZATION } from './constants'

// 画像アップロードのバリデーション
export const uploadImageSchema = z.object({
  image: z.string()
    .refine(
      (data) => data.startsWith('data:image/'),
      'Invalid image data format'
    )
    .refine(
      (data) => {
        // Base64データのサイズをチェック（おおよそのファイルサイズ）
        const base64Data = data.split(',')[1]
        if (!base64Data) return false
        const sizeInBytes = (base64Data.length * 3) / 4
        return sizeInBytes <= IMAGE_OPTIMIZATION.upload.maxSize
      },
      `File size must be less than ${IMAGE_OPTIMIZATION.upload.maxSize / (1024 * 1024)}MB`
    ),
  filename: z.string().min(1, 'Filename is required').optional(),
  userId: z.string().uuid().optional() // 認証実装後に必須にする
})

// レシピリクエストのバリデーション
export const recipeRequestSchema = z.object({
  ingredients: z.array(z.string())
    .min(1, 'At least one ingredient is required')
    .max(20, 'Too many ingredients'),
  preferences: z.object({
    maxCookingTime: z.number()
      .min(5, 'Cooking time must be at least 5 minutes')
      .max(180, 'Cooking time must be less than 180 minutes')
      .optional(),
    difficulty: z.enum(['easy', 'medium', 'hard']).optional(),
    excludedSeasonings: z.array(z.string()).optional(),
    mealType: z.enum(['breakfast', 'lunch', 'dinner', 'snack', 'dessert']).optional(),
    cuisine: z.enum(['japanese', 'western', 'chinese', 'korean', 'italian', 'other']).optional()
  }).optional()
})

// 食材認識結果のバリデーション
export const ingredientDetectionSchema = z.object({
  name: z.string(),
  confidence: z.number().min(0).max(1),
  boundingBox: z.object({
    x: z.number(),
    y: z.number(),
    width: z.number(),
    height: z.number()
  }).optional()
})

// レシピデータのバリデーション
export const recipeSchema = z.object({
  id: z.string(),
  title: z.string(),
  description: z.string(),
  imageUrl: z.string().url().optional(),
  thumbnailUrl: z.string().url().optional(),
  cookingTime: z.number().positive(),
  difficulty: z.enum(['easy', 'medium', 'hard']),
  servings: z.number().positive(),
  calories: z.number().positive().optional(),
  ingredients: z.array(z.object({
    id: z.string(),
    name: z.string(),
    amount: z.string(),
    unit: z.string(),
    isOptional: z.boolean().default(false)
  })),
  seasonings: z.array(z.object({
    id: z.string(),
    name: z.string(),
    amount: z.string(),
    unit: z.string(),
    isEssential: z.boolean().default(false),
    alternatives: z.array(z.string()).optional()
  })),
  steps: z.array(z.object({
    order: z.number().positive(),
    description: z.string(),
    duration: z.number().positive().optional(),
    tips: z.string().optional()
  })),
  tags: z.array(z.string()),
  createdAt: z.date(),
  updatedAt: z.date()
})

// API レスポンスの共通バリデーション
export const successResponseSchema = <T extends z.ZodType>(dataSchema: T) =>
  z.object({
    data: dataSchema,
    meta: z.object({
      page: z.number().optional(),
      totalPages: z.number().optional(),
      totalCount: z.number().optional()
    }).optional()
  })

export const errorResponseSchema = z.object({
  error: z.object({
    code: z.string(),
    message: z.string(),
    details: z.any().optional(),
    timestamp: z.string(),
    requestId: z.string()
  })
})

// 型の定義
export type UploadImageRequest = z.infer<typeof uploadImageSchema>
export type RecipeRequest = z.infer<typeof recipeRequestSchema>
export type IngredientDetection = z.infer<typeof ingredientDetectionSchema>
export type Recipe = z.infer<typeof recipeSchema>
export type SuccessResponse<T> = z.infer<ReturnType<typeof successResponseSchema<z.ZodType<T>>>>
export type ErrorResponse = z.infer<typeof errorResponseSchema>