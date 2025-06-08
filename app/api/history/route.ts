/**
 * レシピ履歴API
 */

import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { createServerSupabaseClient } from '@/lib/supabase/server'

// 履歴一覧取得
export async function GET(request: NextRequest) {
  try {
    const session = await auth()
    if (!session?.user?.id) {
      return NextResponse.json(
        { error: 'ログインが必要です' },
        { status: 401 }
      )
    }

    const url = new URL(request.url)
    const limit = parseInt(url.searchParams.get('limit') || '20')
    const offset = parseInt(url.searchParams.get('offset') || '0')

    const supabase = createServerSupabaseClient()
    
    const { data: history, error } = await supabase
      .from('recipe_history')
      .select(`
        id,
        viewed_at,
        recipes (
          id,
          title,
          description,
          image_url,
          cooking_time,
          difficulty,
          servings,
          calories,
          created_at
        )
      `)
      .eq('user_id', session.user.id)
      .order('viewed_at', { ascending: false })
      .range(offset, offset + limit - 1)

    if (error) {
      console.error('Error fetching history:', error)
      return NextResponse.json(
        { error: '履歴の取得に失敗しました' },
        { status: 500 }
      )
    }

    return NextResponse.json({
      history: history?.map(item => ({
        id: item.id,
        recipe: item.recipes,
        viewed_at: item.viewed_at
      })) || [],
      hasMore: history?.length === limit
    })
  } catch (error) {
    console.error('History API error:', error)
    return NextResponse.json(
      { error: 'サーバーエラーが発生しました' },
      { status: 500 }
    )
  }
}

// 履歴追加
export async function POST(request: NextRequest) {
  try {
    const session = await auth()
    if (!session?.user?.id) {
      return NextResponse.json(
        { error: 'ログインが必要です' },
        { status: 401 }
      )
    }

    const { recipeId, recipe } = await request.json()
    
    if (!recipeId) {
      return NextResponse.json(
        { error: 'レシピIDが必要です' },
        { status: 400 }
      )
    }

    const supabase = createServerSupabaseClient()

    // まずレシピをrecipesテーブルに保存（存在しない場合）
    if (recipe) {
      const { error: recipeError } = await supabase
        .from('recipes')
        .upsert({
          id: recipeId,
          title: recipe.title,
          description: recipe.description,
          image_url: recipe.imageUrl,
          cooking_time: parseInt(recipe.cookingTime?.match(/\d+/)?.[0] || '0'),
          difficulty: recipe.difficulty,
          servings: recipe.servings,
          calories: recipe.calories,
          is_public: false
        })

      if (recipeError && recipeError.code !== '23505') { // 重複エラー以外
        console.error('Error saving recipe:', recipeError)
        return NextResponse.json(
          { error: 'レシピの保存に失敗しました' },
          { status: 500 }
        )
      }
    }

    // 履歴に追加（既存の履歴がある場合は更新）
    const { error } = await supabase
      .from('recipe_history')
      .upsert({
        user_id: session.user.id,
        recipe_id: recipeId,
        viewed_at: new Date().toISOString()
      }, {
        onConflict: 'user_id,recipe_id'
      })

    if (error) {
      console.error('Error adding to history:', error)
      return NextResponse.json(
        { error: '履歴の追加に失敗しました' },
        { status: 500 }
      )
    }

    return NextResponse.json({
      message: '履歴に追加しました',
      recipe_id: recipeId
    })
  } catch (error) {
    console.error('Add history API error:', error)
    return NextResponse.json(
      { error: 'サーバーエラーが発生しました' },
      { status: 500 }
    )
  }
}

// 履歴クリア
export async function DELETE(request: NextRequest) {
  try {
    const session = await auth()
    if (!session?.user?.id) {
      return NextResponse.json(
        { error: 'ログインが必要です' },
        { status: 401 }
      )
    }

    const url = new URL(request.url)
    const recipeId = url.searchParams.get('recipeId')
    
    const supabase = createServerSupabaseClient()
    
    if (recipeId) {
      // 特定のレシピの履歴を削除
      const { error } = await supabase
        .from('recipe_history')
        .delete()
        .eq('user_id', session.user.id)
        .eq('recipe_id', recipeId)

      if (error) {
        console.error('Error removing history item:', error)
        return NextResponse.json(
          { error: '履歴の削除に失敗しました' },
          { status: 500 }
        )
      }

      return NextResponse.json({
        message: '履歴から削除しました',
        recipe_id: recipeId
      })
    } else {
      // 全履歴を削除
      const { error } = await supabase
        .from('recipe_history')
        .delete()
        .eq('user_id', session.user.id)

      if (error) {
        console.error('Error clearing history:', error)
        return NextResponse.json(
          { error: '履歴のクリアに失敗しました' },
          { status: 500 }
        )
      }

      return NextResponse.json({
        message: '履歴をクリアしました'
      })
    }
  } catch (error) {
    console.error('Delete history API error:', error)
    return NextResponse.json(
      { error: 'サーバーエラーが発生しました' },
      { status: 500 }
    )
  }
}