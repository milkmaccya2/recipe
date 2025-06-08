import { NextRequest, NextResponse } from 'next/server'
import { uploadImageSchema } from '@/lib/validations'
import { ERROR_CODES, ERROR_MESSAGES, DEV_CONFIG } from '@/lib/constants'
import { generateRequestId } from '@/lib/utils'
import { base64ToBlob } from '@/lib/utils/image'

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

    // 開発モードではモックレスポンスを返す
    if (DEV_CONFIG.useAiMock) {
      console.log(`[${requestId}] Using mock AI analysis for development`)
      
      // モック用の遅延を追加
      await new Promise(resolve => setTimeout(resolve, 2000))
      
      return NextResponse.json({
        data: {
          uploadId: `upload_${Date.now()}`,
          imageUrl: image, // 開発用：Base64データをそのまま返す
          analysis: {
            ingredients: MOCK_ANALYSIS_RESULTS,
            confidence: 0.88,
            processingTime: 1.5
          },
          requestId
        }
      })
    }

    // 本番環境での実装
    try {
      // 1. 画像をS3にアップロード
      const imageUrl = await uploadToS3(image, filename, requestId)
      
      // 2. Amazon Rekognitionで画像解析
      const analysisResult = await analyzeImageWithRekognition(imageUrl, requestId)
      
      // 3. 結果を返す
      return NextResponse.json({
        data: {
          uploadId: `upload_${Date.now()}`,
          imageUrl,
          analysis: analysisResult,
          requestId
        }
      })
      
    } catch (error) {
      console.error(`[${requestId}] Processing error:`, error)
      
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
    console.error(`[${requestId}] Unexpected error:`, error)
    
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

// S3アップロード関数（スタブ）
async function uploadToS3(base64Data: string, filename: string, requestId: string): Promise<string> {
  // TODO: AWS S3へのアップロード実装
  console.log(`[${requestId}] Uploading ${filename} to S3...`)
  
  // 暫定的にBase64データを返す
  return base64Data
}

// Amazon Rekognition解析関数（スタブ）
async function analyzeImageWithRekognition(imageUrl: string, requestId: string) {
  // TODO: Amazon Rekognition API呼び出し実装
  console.log(`[${requestId}] Analyzing image with Rekognition...`)
  
  // 暫定的にモックデータを返す
  return {
    ingredients: MOCK_ANALYSIS_RESULTS,
    confidence: 0.88,
    processingTime: 2.1
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