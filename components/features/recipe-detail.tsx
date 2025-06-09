'use client'

import { useState, useEffect } from 'react'
import { Clock, Users, ChefHat, Heart, Star, ArrowLeft, CheckCircle, Bookmark, Share2 } from 'lucide-react'
import { Recipe } from '@/lib/openai'
import { useRecipeHistory } from '@/hooks/use-recipe-history'
import { useAuth } from '@/hooks/use-auth'
import { useFavorites } from '@/hooks/use-favorites'
import { SeasoningChecker } from './seasoning-checker'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'

interface RecipeDetailProps {
  recipe: Recipe
  onBack?: () => void
}

export function RecipeDetail({ 
  recipe, 
  onBack
}: RecipeDetailProps) {
  const [completedSteps, setCompletedSteps] = useState<Set<number>>(new Set())
  const [alternativeRecipes, setAlternativeRecipes] = useState<Recipe[]>([])
  const [showShareModal, setShowShareModal] = useState(false)
  
  const { user, isAuthenticated } = useAuth()
  const { addToHistory } = useRecipeHistory()
  const { favorites, addToFavorites, removeFromFavorites } = useFavorites()
  
  const isFavorite = favorites.some(fav => fav.id === recipe.id)

  // レシピが表示されたら履歴に追加
  useEffect(() => {
    if (recipe) {
      addToHistory(recipe)
    }
  }, [recipe, addToHistory])

  const handleAlternativesRequested = (alternatives: Recipe[]) => {
    setAlternativeRecipes(alternatives)
  }

  const toggleStep = (stepNumber: number) => {
    const newCompleted = new Set(completedSteps)
    if (newCompleted.has(stepNumber)) {
      newCompleted.delete(stepNumber)
    } else {
      newCompleted.add(stepNumber)
    }
    setCompletedSteps(newCompleted)
  }

  const handleFavoriteClick = async () => {
    if (!isAuthenticated) {
      // 未認証の場合はサインインを促す
      alert('お気に入りに追加するにはログインが必要です')
      return
    }

    try {
      if (isFavorite) {
        await removeFromFavorites(recipe.id)
      } else {
        await addToFavorites(recipe)
      }
    } catch (error) {
      console.error('お気に入り操作に失敗しました:', error)
      alert('お気に入り操作に失敗しました')
    }
  }

  const handleShare = async () => {
    if (navigator.share) {
      try {
        await navigator.share({
          title: recipe.title,
          text: recipe.description,
          url: window.location.href,
        })
      } catch (error) {
        console.log('シェアがキャンセルされました')
      }
    } else {
      setShowShareModal(true)
    }
  }

  const handleSaveRecipe = async () => {
    if (!isAuthenticated) {
      alert('レシピを保存するにはログインが必要です')
      return
    }
    
    try {
      await addToFavorites(recipe)
      alert('レシピを保存しました！')
    } catch (error) {
      console.error('レシピ保存に失敗しました:', error)
      alert('レシピ保存に失敗しました')
    }
  }

  const getDifficultyColor = (difficulty: Recipe['difficulty']) => {
    switch (difficulty) {
      case 'easy': return 'text-green-600 bg-green-100'
      case 'medium': return 'text-yellow-600 bg-yellow-100'
      case 'hard': return 'text-red-600 bg-red-100'
      default: return 'text-gray-600 bg-gray-100'
    }
  }

  const getDifficultyLabel = (difficulty: Recipe['difficulty']) => {
    switch (difficulty) {
      case 'easy': return '簡単'
      case 'medium': return '普通'
      case 'hard': return '難しい'
      default: return '-'
    }
  }

  return (
    <div className="max-w-4xl mx-auto bg-white">
      {/* ヘッダー */}
      <div className="relative">
        {/* 戻るボタン */}
        {onBack && (
          <button
            onClick={onBack}
            className="absolute top-4 left-4 z-10 p-2 bg-white/80 hover:bg-white rounded-full transition-colors"
          >
            <ArrowLeft className="w-5 h-5" />
          </button>
        )}

        {/* メイン画像 */}
        <div className="relative h-64 md:h-80 bg-gray-100">
          <img
            src={recipe.image || '/placeholder-recipe.jpg'}
            alt={recipe.title}
            className="w-full h-full object-cover"
            onError={(e) => {
              const target = e.target as HTMLImageElement
              target.style.display = 'none'
              target.nextElementSibling?.classList.remove('hidden')
            }}
          />
          <div className="hidden w-full h-full flex items-center justify-center absolute inset-0 bg-gray-100">
            <ChefHat className="w-16 h-16 text-gray-400" />
          </div>
          
          {/* アクションボタン */}
          <div className="absolute top-4 right-4 flex space-x-2">
            {/* シェアボタン */}
            <button
              onClick={handleShare}
              className="p-3 bg-white/80 hover:bg-white rounded-full transition-colors"
            >
              <Share2 className="w-5 h-5 text-gray-600" />
            </button>
            
            {/* お気に入りボタン */}
            <button
              onClick={handleFavoriteClick}
              className={cn(
                "p-3 rounded-full transition-colors",
                isFavorite 
                  ? "bg-red-500 text-white" 
                  : "bg-white/80 text-gray-600 hover:bg-white"
              )}
            >
              <Heart className={cn("w-5 h-5", isFavorite && "fill-current")} />
            </button>
          </div>
          
          {/* ユーザー情報表示 */}
          {isAuthenticated && user && (
            <div className="absolute bottom-4 left-4 bg-white/90 rounded-lg px-3 py-2">
              <p className="text-sm text-gray-600">
                {user.name}さんがお料理中
              </p>
            </div>
          )}
        </div>
      </div>

      {/* コンテンツ */}
      <div className="p-6 space-y-6">
        {/* タイトルとメタ情報 */}
        <div className="space-y-4">
          <div className="flex items-start justify-between">
            <div className="flex-1">
              <h1 className="text-2xl md:text-3xl font-bold text-gray-900 mb-2">
                {recipe.title}
              </h1>
              {recipe.description && (
                <p className="text-gray-600 text-lg">
                  {recipe.description}
                </p>
              )}
            </div>
          </div>

          {/* メタ情報バッジ */}
          <div className="flex flex-wrap items-center gap-3">
            <span className={cn(
              "px-3 py-1 rounded-full text-sm font-medium",
              getDifficultyColor(recipe.difficulty)
            )}>
              {getDifficultyLabel(recipe.difficulty)}
            </span>
            
            <div className="flex items-center space-x-1 text-gray-600">
              <Clock className="w-4 h-4" />
              <span className="text-sm">{recipe.cookingTime}</span>
            </div>
            
            <div className="flex items-center space-x-1 text-gray-600">
              <Users className="w-4 h-4" />
              <span className="text-sm">{recipe.servings}人分</span>
            </div>
            
            {recipe.calories && (
              <span className="px-2 py-1 bg-blue-100 text-blue-700 text-sm rounded-full">
                {recipe.calories}kcal
              </span>
            )}
          </div>
        </div>

        {/* 栄養情報 */}
        {recipe.nutritionInfo && (
          <div className="bg-gray-50 rounded-lg p-4">
            <h3 className="font-semibold text-gray-900 mb-3">栄養成分（1人分）</h3>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div className="text-center">
                <div className="text-lg font-bold text-red-600">{recipe.nutritionInfo.protein}g</div>
                <div className="text-sm text-gray-600">たんぱく質</div>
              </div>
              <div className="text-center">
                <div className="text-lg font-bold text-orange-600">{recipe.nutritionInfo.carbs}g</div>
                <div className="text-sm text-gray-600">炭水化物</div>
              </div>
              <div className="text-center">
                <div className="text-lg font-bold text-yellow-600">{recipe.nutritionInfo.fat}g</div>
                <div className="text-sm text-gray-600">脂質</div>
              </div>
              <div className="text-center">
                <div className="text-lg font-bold text-green-600">{recipe.nutritionInfo.fiber}g</div>
                <div className="text-sm text-gray-600">食物繊維</div>
              </div>
            </div>
          </div>
        )}

        {/* 材料 */}
        <div className="space-y-4">
          <h2 className="text-xl font-bold text-gray-900">材料</h2>
          <div className="bg-orange-50 rounded-lg p-4">
            <div className="grid gap-2">
              {recipe.ingredients.map((ingredient, index) => (
                <div
                  key={index}
                  className="flex justify-between items-center py-2 px-3 bg-white rounded-lg"
                >
                  <span className="font-medium text-gray-900">
                    {ingredient.name}
                    {ingredient.category && (
                      <span className="ml-2 text-xs text-gray-500">
                        ({ingredient.category})
                      </span>
                    )}
                  </span>
                  <span className="text-gray-600">
                    {ingredient.amount}{ingredient.unit}
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* 作り方 */}
        <div className="space-y-4">
          <h2 className="text-xl font-bold text-gray-900">作り方</h2>
          <div className="space-y-3">
            {recipe.steps.map((step, index) => (
              <div
                key={index}
                className={cn(
                  "border rounded-lg p-4 transition-all cursor-pointer",
                  completedSteps.has(step.step)
                    ? "bg-green-50 border-green-200"
                    : "bg-white border-gray-200 hover:border-orange-300"
                )}
                onClick={() => toggleStep(step.step)}
              >
                <div className="flex items-start space-x-3">
                  <div className={cn(
                    "flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold",
                    completedSteps.has(step.step)
                      ? "bg-green-500 text-white"
                      : "bg-orange-500 text-white"
                  )}>
                    {completedSteps.has(step.step) ? (
                      <CheckCircle className="w-4 h-4" />
                    ) : (
                      step.step
                    )}
                  </div>
                  
                  <div className="flex-1 space-y-2">
                    <p className={cn(
                      "text-gray-900",
                      completedSteps.has(step.step) && "line-through text-gray-500"
                    )}>
                      {step.instruction}
                    </p>
                    
                    {step.duration && (
                      <p className="text-sm text-gray-500">
                        ⏱️ 目安時間: {step.duration}
                      </p>
                    )}
                    
                    {step.tips && (
                      <p className="text-sm text-orange-600 bg-orange-50 p-2 rounded">
                        💡 {step.tips}
                      </p>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* 調味料チェック */}
        <div className="space-y-4">
          <h2 className="text-xl font-bold text-gray-900">調味料チェック</h2>
          <SeasoningChecker 
            recipe={recipe} 
            onAlternativesRequested={handleAlternativesRequested}
          />
        </div>

        {/* 代替レシピ */}
        {alternativeRecipes.length > 0 && (
          <div className="space-y-4">
            <h2 className="text-xl font-bold text-gray-900">代替レシピ</h2>
            <div className="grid gap-4">
              {alternativeRecipes.map((altRecipe, index) => (
                <div key={index} className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
                  <h3 className="font-semibold text-gray-900 mb-2">{altRecipe.title}</h3>
                  <p className="text-gray-600 text-sm mb-3">{altRecipe.description}</p>
                  <div className="flex items-center space-x-4 text-sm text-gray-500">
                    <div className="flex items-center space-x-1">
                      <Clock className="w-4 h-4" />
                      <span>{altRecipe.cookingTime}</span>
                    </div>
                    <div className="flex items-center space-x-1">
                      <Users className="w-4 h-4" />
                      <span>{altRecipe.servings}人分</span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* 調理のコツ */}
        {recipe.tips && recipe.tips.length > 0 && (
          <div className="space-y-4">
            <h2 className="text-xl font-bold text-gray-900">調理のコツ</h2>
            <div className="bg-blue-50 rounded-lg p-4">
              <ul className="space-y-2">
                {recipe.tips.map((tip, index) => (
                  <li key={index} className="flex items-start space-x-2">
                    <span className="text-blue-500 mt-1">💡</span>
                    <span className="text-gray-700">{tip}</span>
                  </li>
                ))}
              </ul>
            </div>
          </div>
        )}

        {/* アクションボタン */}
        <div className="border-t pt-6">
          <div className="flex flex-col sm:flex-row gap-3">
            {!isFavorite && (
              <Button
                onClick={handleSaveRecipe}
                className="flex-1 bg-orange-500 hover:bg-orange-600 text-white"
                disabled={!isAuthenticated}
              >
                <Bookmark className="w-4 h-4 mr-2" />
                レシピを保存
              </Button>
            )}
            
            <Button
              onClick={handleShare}
              variant="outline"
              className="flex-1"
            >
              <Share2 className="w-4 h-4 mr-2" />
              シェア
            </Button>
            
            {onBack && (
              <Button
                onClick={onBack}
                variant="outline"
                className="sm:w-auto"
              >
                <ArrowLeft className="w-4 h-4 mr-2" />
                戻る
              </Button>
            )}
          </div>
          
          {!isAuthenticated && (
            <p className="text-sm text-gray-500 mt-3 text-center">
              ログインするとレシピの保存やお気に入り機能が使えます
            </p>
          )}
        </div>
      </div>

      {/* シェアモーダル */}
      {showShareModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg max-w-md w-full p-6">
            <h3 className="text-lg font-semibold mb-4">レシピをシェア</h3>
            <div className="space-y-3">
              <Button
                onClick={() => {
                  navigator.clipboard.writeText(window.location.href)
                  alert('URLをコピーしました！')
                  setShowShareModal(false)
                }}
                variant="outline"
                className="w-full"
              >
                URLをコピー
              </Button>
              <Button
                onClick={() => setShowShareModal(false)}
                className="w-full"
              >
                閉じる
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}