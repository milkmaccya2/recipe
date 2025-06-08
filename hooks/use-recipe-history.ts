'use client'

import { useCallback } from 'react'
import { useSession } from 'next-auth/react'
import { Recipe } from '@/lib/openai'

export function useRecipeHistory() {
  const { data: session } = useSession()

  const addToHistory = useCallback(async (recipe: Recipe) => {
    if (!session?.user) {
      return // ログインしていない場合は何もしない
    }

    try {
      const response = await fetch('/api/history', {
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
        console.error('Failed to add to history:', await response.text())
      }
    } catch (error) {
      console.error('Error adding to history:', error)
    }
  }, [session])

  return { addToHistory }
}