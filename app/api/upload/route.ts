import { NextRequest, NextResponse } from 'next/server'
import { uploadImageSchema } from '@/lib/validations'
import { ERROR_CODES, ERROR_MESSAGES, DEV_CONFIG } from '@/lib/constants'
import { generateRequestId } from '@/lib/utils'
import { uploadImageToS3 } from '@/lib/aws/s3'
import { detectIngredients } from '@/lib/aws/rekognition'
import { auth } from '@/lib/auth'
import { createServerSupabaseClient } from '@/lib/supabase/server'

// モック用の画像解析結果
const MOCK_ANALYSIS_RESULTS = [
  {
    name: "トマト",
    confidence: 0.95,
    boundingBox: { x: 100, y: 50, width: 200, height: 150 }
  },
  {
    name: "玉ねぎ",
    confidence: 0.87,
    boundingBox: { x: 300, y: 80, width: 180, height: 140 }
  },
  {
    name: "にんじん",
    confidence: 0.82,
    boundingBox: { x: 150, y: 250, width: 160, height: 200 }
  }
]

export async function POST(request: NextRequest) {
  const requestId = generateRequestId()
  
  try {
    // リクエストボディの解析
    const body = await request.json()
    
    // バリデーション
    const validationResult = uploadImageSchema.safeParse(body)
    if (!validationResult.success) {
      return NextResponse.json(
        {
          error: {
            code: ERROR_CODES.VALIDATION_FAILED,
            message: ERROR_MESSAGES[ERROR_CODES.VALIDATION_FAILED],
            details: validationResult.error.errors,
            timestamp: new Date().toISOString(),
            requestId
          }
        },
        { status: 400 }
      )
    }

    const { image, filename } = validationResult.data

    // ユーザー情報を取得（ログイン状態に関係なく実行）
    const session = await auth()
    const userId = session?.user?.id

    // 開発モードではモックレスポンスを返す
    if (DEV_CONFIG.useAiMock) {
      
      // モック用の遅延を追加
      await new Promise(resolve => setTimeout(resolve, 2000))
      
      const mockResult = {
        uploadId: `upload_${Date.now()}`,
        imageUrl: image, // 開発用：Base64データをそのまま返す
        analysis: {
          ingredients: MOCK_ANALYSIS_RESULTS,
          confidence: 0.88,
          processingTime: 1.5
        },
        requestId
      }

      // ログインしている場合は履歴に保存
      if (userId) {
        await saveUploadHistory(userId, mockResult, filename)
      }
      
      return NextResponse.json({
        data: mockResult
      })
    }

    // 本番環境での実装
    try {
      // 1. 画像をS3にアップロード
      const { imageUrl, key } = await uploadImageToS3(image, filename || 'unknown.jpg')
      
      // 2. Amazon Rekognitionで画像解析
      // Base64文字列からBufferに変換
      const base64Data = image.replace(/^data:image\/\w+;base64,/, '')
      const imageBuffer = Buffer.from(base64Data, 'base64')
      const analysisResult = await detectIngredients(imageBuffer)
      
      // 3. 結果を作成
      const result = {
        uploadId: `upload_${Date.now()}`,
        imageUrl,
        analysis: {
          ingredients: analysisResult,
          confidence: analysisResult.length > 0 ? 
            analysisResult.reduce((acc, item) => acc + item.confidence, 0) / analysisResult.length / 100 : 0,
          processingTime: 1.0
        },
        requestId
      }

      // 4. ログインしている場合は履歴に保存
      if (userId) {
        await saveUploadHistory(userId, result, filename)
      }

      // 5. 結果を返す
      return NextResponse.json({
        data: result
      })
      
    } catch (error) {
      
      if (error instanceof Error) {
        if (error.message.includes('rate limit')) {
          return NextResponse.json(
            {
              error: {
                code: ERROR_CODES.AI_RATE_LIMIT,
                message: ERROR_MESSAGES[ERROR_CODES.AI_RATE_LIMIT],
                timestamp: new Date().toISOString(),
                requestId
              }
            },
            { status: 429 }
          )
        }
        
        if (error.message.includes('recognition')) {
          return NextResponse.json(
            {
              error: {
                code: ERROR_CODES.AI_RECOGNITION_FAILED,
                message: ERROR_MESSAGES[ERROR_CODES.AI_RECOGNITION_FAILED],
                timestamp: new Date().toISOString(),
                requestId
              }
            },
            { status: 422 }
          )
        }
      }
      
      throw error // 予期しないエラーは上位でキャッチ
    }
    
  } catch (error) {
    
    return NextResponse.json(
      {
        error: {
          code: ERROR_CODES.INTERNAL_SERVER_ERROR,
          message: ERROR_MESSAGES[ERROR_CODES.INTERNAL_SERVER_ERROR],
          timestamp: new Date().toISOString(),
          requestId
        }
      },
      { status: 500 }
    )
  }
}


// アップロード履歴を保存
async function saveUploadHistory(userId: string, result: any, filename: string | undefined) {
  try {
    const supabase = createServerSupabaseClient()
    
    const { error } = await supabase
      .from('upload_history')
      .insert({
        user_id: userId,
        upload_id: result.uploadId,
        image_url: result.imageUrl,
        s3_key: result.s3Key || null,
        detected_ingredients: result.analysis?.ingredients || [],
        analysis_confidence: result.analysis?.confidence || 0,
        processing_time: result.analysis?.processingTime || 0
      })

    if (error) {
      console.error('Error saving upload history:', error)
    } else {
      console.log(`Upload history saved for user ${userId}`)
    }
  } catch (error) {
    console.error('Error in saveUploadHistory:', error)
  }
}

export async function GET() {
  return NextResponse.json(
    {
      error: {
        code: ERROR_CODES.METHOD_NOT_ALLOWED,
        message: 'GET method not allowed for this endpoint',
        timestamp: new Date().toISOString(),
        requestId: generateRequestId()
      }
    },
    { status: 405 }
  )
}