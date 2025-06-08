/**
 * お気に入りレシピAPI
 */

import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { createServerSupabaseClient } from '@/lib/supabase/server'

// お気に入り一覧取得
export async function GET(request: NextRequest) {
  try {
    const session = await auth()
    if (!session?.user?.id) {
      return NextResponse.json(
        { error: 'ログインが必要です' },
        { status: 401 }
      )
    }

    const supabase = createServerSupabaseClient()
    
    const { data: favorites, error } = await supabase
      .from('favorite_recipes')
      .select(`
        recipe_id,
        created_at,
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
      .order('created_at', { ascending: false })

    if (error) {
      console.error('Error fetching favorites:', error)
      return NextResponse.json(
        { error: 'お気に入りの取得に失敗しました' },
        { status: 500 }
      )
    }

    return NextResponse.json({
      favorites: favorites?.map(fav => ({
        id: fav.recipe_id,
        ...fav.recipes,
        favorited_at: fav.created_at
      })) || []
    })
  } catch (error) {
    console.error('Favorites API error:', error)
    return NextResponse.json(
      { error: 'サーバーエラーが発生しました' },
      { status: 500 }
    )
  }
}

// お気に入り追加
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

    // お気に入りに追加
    const { error } = await supabase
      .from('favorite_recipes')
      .insert({
        user_id: session.user.id,
        recipe_id: recipeId
      })

    if (error) {
      if (error.code === '23505') { // 重複エラー
        return NextResponse.json(
          { error: '既にお気に入りに追加されています' },
          { status: 409 }
        )
      }
      console.error('Error adding favorite:', error)
      return NextResponse.json(
        { error: 'お気に入りの追加に失敗しました' },
        { status: 500 }
      )
    }

    return NextResponse.json({
      message: 'お気に入りに追加しました',
      recipe_id: recipeId
    })
  } catch (error) {
    console.error('Add favorite API error:', error)
    return NextResponse.json(
      { error: 'サーバーエラーが発生しました' },
      { status: 500 }
    )
  }
}

// お気に入り削除
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
    
    if (!recipeId) {
      return NextResponse.json(
        { error: 'レシピIDが必要です' },
        { status: 400 }
      )
    }

    const supabase = createServerSupabaseClient()
    
    const { error } = await supabase
      .from('favorite_recipes')
      .delete()
      .eq('user_id', session.user.id)
      .eq('recipe_id', recipeId)

    if (error) {
      console.error('Error removing favorite:', error)
      return NextResponse.json(
        { error: 'お気に入りの削除に失敗しました' },
        { status: 500 }
      )
    }

    return NextResponse.json({
      message: 'お気に入りから削除しました',
      recipe_id: recipeId
    })
  } catch (error) {
    console.error('Remove favorite API error:', error)
    return NextResponse.json(
      { error: 'サーバーエラーが発生しました' },
      { status: 500 }
    )
  }
}