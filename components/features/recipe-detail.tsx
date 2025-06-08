'use client'

import { useState } from 'react'
import { Clock, Users, ChefHat, Heart, Star, ArrowLeft, CheckCircle } from 'lucide-react'
import { Recipe } from '@/lib/openai'
import { cn } from '@/lib/utils'

interface RecipeDetailProps {
  recipe: Recipe
  onBack?: () => void
  isFavorite?: boolean
  onToggleFavorite?: (recipeId: string) => void
}

export function RecipeDetail({ 
  recipe, 
  onBack, 
  isFavorite = false, 
  onToggleFavorite 
}: RecipeDetailProps) {
  const [completedSteps, setCompletedSteps] = useState<Set<number>>(new Set())

  const toggleStep = (stepNumber: number) => {
    const newCompleted = new Set(completedSteps)
    if (newCompleted.has(stepNumber)) {
      newCompleted.delete(stepNumber)
    } else {
      newCompleted.add(stepNumber)
    }
    setCompletedSteps(newCompleted)
  }

  const handleFavoriteClick = () => {
    onToggleFavorite?.(recipe.id)
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
          {recipe.imageUrl ? (
            <img
              src={recipe.imageUrl}
              alt={recipe.title}
              className="w-full h-full object-cover"
            />
          ) : (
            <div className="w-full h-full flex items-center justify-center">
              <ChefHat className="w-16 h-16 text-gray-400" />
            </div>
          )}
          
          {/* お気に入りボタン */}
          {onToggleFavorite && (
            <button
              onClick={handleFavoriteClick}
              className={cn(
                "absolute top-4 right-4 p-3 rounded-full transition-colors",
                isFavorite 
                  ? "bg-red-500 text-white" 
                  : "bg-white/80 text-gray-600 hover:bg-white"
              )}
            >
              <Heart className={cn("w-5 h-5", isFavorite && "fill-current")} />
            </button>
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
      </div>
    </div>
  )
}