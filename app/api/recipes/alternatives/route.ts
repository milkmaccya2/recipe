/**
 * 代替レシピ提案API
 * 調味料不足時の代替案を提案
 */

import { NextRequest, NextResponse } from 'next/server'
import { suggestAlternativeRecipes } from '@/lib/openai'

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    
    // バリデーション
    if (!body.recipe || !body.missingSeasonings) {
      return NextResponse.json(
        { error: '元のレシピと不足調味料の指定が必要です' },
        { status: 400 }
      )
    }

    const { recipe, missingSeasonings } = body

    // 代替レシピ提案実行
    const alternatives = await suggestAlternativeRecipes(recipe, missingSeasonings)
    
    return NextResponse.json({
      alternatives,
      original_recipe: recipe,
      missing_seasonings: missingSeasonings
    })
  } catch (error) {
    console.error('代替レシピ提案API エラー:', error)
    
    if (error instanceof Error && error.message.includes('API key')) {
      return NextResponse.json(
        { error: 'OpenAI APIキーが設定されていません' },
        { status: 500 }
      )
    }
    
    return NextResponse.json(
      { error: '代替レシピの提案に失敗しました' },
      { status: 500 }
    )
  }
}

export async function GET() {
  return NextResponse.json(
    { message: '代替レシピ提案API - POSTリクエストを送信してください' },
    { status: 200 }
  )
}