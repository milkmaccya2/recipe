'use client'

import { useState, useEffect, useCallback } from 'react'
import { useSession } from 'next-auth/react'
import { Recipe } from '@/lib/openai'

interface FavoritesState {
  favorites: Recipe[]
  favoriteIds: string[]
  isLoading: boolean
  error: string | null
}

export function useFavorites() {
  const { data: session } = useSession()
  const [state, setState] = useState<FavoritesState>({
    favorites: [],
    favoriteIds: [],
    isLoading: false,
    error: null
  })

  // お気に入り一覧を取得
  const fetchFavorites = useCallback(async () => {
    if (!session?.user) {
      setState(prev => ({ ...prev, favorites: [], favoriteIds: [] }))
      return
    }

    setState(prev => ({ ...prev, isLoading: true, error: null }))

    try {
      const response = await fetch('/api/favorites')
      if (!response.ok) {
        if (response.status === 401) {
          setState(prev => ({ ...prev, favorites: [], favoriteIds: [], isLoading: false }))
          return
        }
        throw new Error('お気に入りの取得に失敗しました')
      }

      const data = await response.json()
      const favorites = data.favorites || []
      const favoriteIds = favorites.map((fav: Recipe) => fav.id)

      setState(prev => ({
        ...prev,
        favorites,
        favoriteIds,
        isLoading: false
      }))
    } catch (error) {
      console.error('Error fetching favorites:', error)
      setState(prev => ({
        ...prev,
        error: error instanceof Error ? error.message : 'エラーが発生しました',
        isLoading: false
      }))
    }
  }, [session])

  // お気に入りに追加
  const addFavorite = useCallback(async (recipe: Recipe) => {
    if (!session?.user) {
      throw new Error('ログインが必要です')
    }

    try {
      const response = await fetch('/api/favorites', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          recipeId: recipe.id,
          recipe: {
            title: recipe.title,
            description: recipe.description,
            imageUrl: recipe.imageUrl,
            cookingTime: recipe.cookingTime,
            difficulty: recipe.difficulty,
            servings: recipe.servings,
            calories: recipe.calories
          }
        }),
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || 'お気に入りの追加に失敗しました')
      }

      // 状態を更新
      setState(prev => ({
        ...prev,
        favorites: [recipe, ...prev.favorites],
        favoriteIds: [recipe.id, ...prev.favoriteIds]
      }))

      return true
    } catch (error) {
      console.error('Error adding favorite:', error)
      throw error
    }
  }, [session])

  // お気に入りから削除
  const removeFavorite = useCallback(async (recipeId: string) => {
    if (!session?.user) {
      throw new Error('ログインが必要です')
    }

    try {
      const response = await fetch(`/api/favorites?recipeId=${recipeId}`, {
        method: 'DELETE',
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || 'お気に入りの削除に失敗しました')
      }

      // 状態を更新
      setState(prev => ({
        ...prev,
        favorites: prev.favorites.filter(fav => fav.id !== recipeId),
        favoriteIds: prev.favoriteIds.filter(id => id !== recipeId)
      }))

      return true
    } catch (error) {
      console.error('Error removing favorite:', error)
      throw error
    }
  }, [session])

  // お気に入り状態をトグル
  const toggleFavorite = useCallback(async (recipe: Recipe) => {
    const isFavorited = state.favoriteIds.includes(recipe.id)
    
    if (isFavorited) {
      await removeFavorite(recipe.id)
    } else {
      await addFavorite(recipe)
    }
  }, [state.favoriteIds, addFavorite, removeFavorite])

  // お気に入りかどうかをチェック
  const isFavorite = useCallback((recipeId: string) => {
    return state.favoriteIds.includes(recipeId)
  }, [state.favoriteIds])

  // セッション変更時にお気に入りを再取得
  useEffect(() => {
    fetchFavorites()
  }, [fetchFavorites])

  return {
    favorites: state.favorites,
    favoriteIds: state.favoriteIds,
    isLoading: state.isLoading,
    error: state.error,
    addFavorite,
    removeFavorite,
    toggleFavorite,
    isFavorite,
    refreshFavorites: fetchFavorites
  }
}