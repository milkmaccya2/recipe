/**
 * レシピ提案API
 * POST /api/recipes
 */

import { NextRequest, NextResponse } from 'next/server';
import { suggestRecipes, RecipeSuggestionRequest } from '@/lib/openai';

export async function POST(request: NextRequest) {
  try {
    const body: RecipeSuggestionRequest = await request.json();
    
    // バリデーション
    if (!body.ingredients || body.ingredients.length === 0) {
      return NextResponse.json(
        { error: '食材を少なくとも1つ指定してください' },
        { status: 400 }
      );
    }

    // レシピ提案実行
    const result = await suggestRecipes(body);
    
    return NextResponse.json(result);
  } catch (error) {
    console.error('レシピ提案API エラー:', error);
    
    if (error instanceof Error && error.message.includes('API key')) {
      return NextResponse.json(
        { error: 'OpenAI APIキーが設定されていません' },
        { status: 500 }
      );
    }
    
    return NextResponse.json(
      { error: 'レシピの提案に失敗しました' },
      { status: 500 }
    );
  }
}

export async function GET() {
  return NextResponse.json(
    { message: 'レシピ提案API - POSTリクエストを送信してください' },
    { status: 200 }
  );
}