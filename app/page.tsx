'use client'

import { useState, useCallback } from 'react'
import { useAtom } from 'jotai'
import { ImageUpload } from '@/components/features/image-upload'
import { Header } from '@/components/features/header'
import { RecipeList } from '@/components/features/recipe-list'
import { detectedIngredientsAtom, confirmedIngredientsAtom } from '@/stores/ingredients'
import { useFavorites } from '@/hooks/use-favorites'
import { Recipe, RecipeSuggestionRequest } from '@/lib/openai'
import { Loader2, ChefHat, ArrowLeft } from 'lucide-react'

type AppState = 'upload' | 'ingredients' | 'recipes'

export default function HomePage() {
  const [currentState, setCurrentState] = useState<AppState>('upload')
  const [detectedIngredients] = useAtom(detectedIngredientsAtom)
  const [confirmedIngredients] = useAtom(confirmedIngredientsAtom)
  const [recipes, setRecipes] = useState<Recipe[]>([])
  const [isLoadingRecipes, setIsLoadingRecipes] = useState(false)
  const [recipeError, setRecipeError] = useState<string | null>(null)
  const { toggleFavorite, favoriteIds } = useFavorites()

  const handleImageAnalyzed = useCallback((analysis: any) => {
    if (analysis && analysis.ingredients && analysis.ingredients.length > 0) {
      setCurrentState('ingredients')
    }
  }, [])

  const handleGenerateRecipes = useCallback(async () => {
    if (confirmedIngredients.length === 0) {
      setRecipeError('食材を選択してください')
      return
    }

    setIsLoadingRecipes(true)
    setRecipeError(null)

    try {
      const request: RecipeSuggestionRequest = {
        ingredients: confirmedIngredients,
        cookingTime: '60分以内',
        difficulty: 'easy',
        servings: 2
      }

      const response = await fetch('/api/recipes', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(request),
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || 'レシピの生成に失敗しました')
      }

      const result = await response.json()
      setRecipes(result.recipes || [])
      setCurrentState('recipes')
    } catch (error) {
      console.error('Recipe generation error:', error)
      setRecipeError(error instanceof Error ? error.message : 'レシピの生成に失敗しました')
    } finally {
      setIsLoadingRecipes(false)
    }
  }, [confirmedIngredients])

  const handleBackToUpload = () => {
    setCurrentState('upload')
    setRecipes([])
    setRecipeError(null)
  }

  const handleBackToIngredients = () => {
    setCurrentState('ingredients')
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-orange-50 to-red-50">
      <Header />
      <main className="container mx-auto px-4 py-8">
        {currentState === 'upload' && (
          <div className="max-w-4xl mx-auto text-center">
            <h1 className="text-4xl md:text-6xl font-bold text-gray-900 mb-6">
              Recipe Suggester AI
            </h1>
            <p className="text-xl text-gray-600 mb-12">
              食材の写真を撮って、AIが最適な献立を提案します
            </p>
            
            <ImageUpload onImageSelect={handleImageAnalyzed} />
            
            <div className="mt-16 grid grid-cols-1 md:grid-cols-3 gap-8">
              <div className="text-center">
                <div className="w-16 h-16 bg-orange-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  <span className="text-2xl">📷</span>
                </div>
                <h3 className="text-lg font-semibold mb-2">写真を撮影</h3>
                <p className="text-gray-600">カメラで食材を撮影するか、ギャラリーから選択</p>
              </div>
              
              <div className="text-center">
                <div className="w-16 h-16 bg-orange-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  <span className="text-2xl">🤖</span>
                </div>
                <h3 className="text-lg font-semibold mb-2">AI解析</h3>
                <p className="text-gray-600">AIが画像を解析して食材を自動認識</p>
              </div>
              
              <div className="text-center">
                <div className="w-16 h-16 bg-orange-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  <span className="text-2xl">🍽️</span>
                </div>
                <h3 className="text-lg font-semibold mb-2">献立提案</h3>
                <p className="text-gray-600">認識した食材から最適なレシピを提案</p>
              </div>
            </div>
          </div>
        )}

        {currentState === 'ingredients' && (
          <div className="max-w-4xl mx-auto">
            <div className="flex items-center justify-between mb-8">
              <button
                onClick={handleBackToUpload}
                className="flex items-center space-x-2 text-gray-600 hover:text-gray-900 transition-colors"
              >
                <ArrowLeft className="w-5 h-5" />
                <span>戻る</span>
              </button>
              <h1 className="text-2xl font-bold text-gray-900">食材の確認</h1>
              <div></div>
            </div>

            <div className="bg-white rounded-xl shadow-lg p-6 mb-8">
              <h2 className="text-lg font-semibold mb-4">検出された食材</h2>
              <div className="flex flex-wrap gap-2 mb-6">
                {detectedIngredients.map((ingredient, index) => (
                  <span
                    key={index}
                    className="px-3 py-1 bg-orange-100 text-orange-700 rounded-full text-sm"
                  >
                    {ingredient.name} ({Math.round(ingredient.confidence * 100)}%)
                  </span>
                ))}
              </div>

              <h3 className="text-lg font-semibold mb-4">確定済み食材</h3>
              <div className="flex flex-wrap gap-2 mb-6">
                {confirmedIngredients.map((ingredient, index) => (
                  <span
                    key={index}
                    className="px-3 py-1 bg-green-100 text-green-700 rounded-full text-sm"
                  >
                    {ingredient}
                  </span>
                ))}
              </div>

              {recipeError && (
                <div className="mb-4 p-4 bg-red-50 border border-red-200 rounded-lg">
                  <p className="text-red-600 text-sm">{recipeError}</p>
                </div>
              )}

              <button
                onClick={handleGenerateRecipes}
                disabled={isLoadingRecipes || confirmedIngredients.length === 0}
                className="w-full bg-orange-500 hover:bg-orange-600 disabled:bg-gray-300 disabled:cursor-not-allowed text-white px-6 py-3 rounded-lg transition-colors flex items-center justify-center space-x-2"
              >
                {isLoadingRecipes ? (
                  <>
                    <Loader2 className="w-5 h-5 animate-spin" />
                    <span>レシピを生成中...</span>
                  </>
                ) : (
                  <>
                    <ChefHat className="w-5 h-5" />
                    <span>レシピを提案してもらう</span>
                  </>
                )}
              </button>
            </div>
          </div>
        )}

        {currentState === 'recipes' && (
          <div className="max-w-6xl mx-auto">
            <div className="flex items-center justify-between mb-8">
              <button
                onClick={handleBackToIngredients}
                className="flex items-center space-x-2 text-gray-600 hover:text-gray-900 transition-colors"
              >
                <ArrowLeft className="w-5 h-5" />
                <span>食材選択に戻る</span>
              </button>
              <h1 className="text-2xl font-bold text-gray-900">おすすめレシピ</h1>
              <div></div>
            </div>

            <RecipeList
              recipes={recipes}
              isLoading={isLoadingRecipes}
              error={recipeError}
              onFavoriteToggle={toggleFavorite}
              favoriteRecipeIds={favoriteIds}
            />
          </div>
        )}
      </main>
    </div>
  )
}