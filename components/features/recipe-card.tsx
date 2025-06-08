'use client'

import { Clock, Users, ChefHat, Heart, Star } from 'lucide-react'
import { Recipe } from '@/lib/openai'
import { cn } from '@/lib/utils'

interface RecipeCardProps {
  recipe: Recipe
  onSelect?: (recipe: Recipe) => void
  isFavorite?: boolean
  onToggleFavorite?: (recipeId: string) => void
  className?: string
}

export function RecipeCard({ 
  recipe, 
  onSelect, 
  isFavorite = false, 
  onToggleFavorite, 
  className 
}: RecipeCardProps) {
  const handleClick = () => {
    onSelect?.(recipe)
  }

  const handleFavoriteClick = (e: React.MouseEvent) => {
    e.stopPropagation()
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
    <div
      onClick={handleClick}
      className={cn(
        "bg-white rounded-xl shadow-md hover:shadow-lg transition-all duration-200 cursor-pointer",
        "border border-gray-200 hover:border-orange-300 overflow-hidden",
        className
      )}
    >
      {/* 画像エリア */}
      <div className="relative h-48 bg-gray-100">
        {recipe.imageUrl ? (
          <img
            src={recipe.imageUrl}
            alt={recipe.title}
            className="w-full h-full object-cover"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center">
            <ChefHat className="w-12 h-12 text-gray-400" />
          </div>
        )}
        
        {/* お気に入りボタン */}
        {onToggleFavorite && (
          <button
            onClick={handleFavoriteClick}
            className={cn(
              "absolute top-3 right-3 p-2 rounded-full transition-colors",
              isFavorite 
                ? "bg-red-500 text-white" 
                : "bg-white/80 text-gray-600 hover:bg-white"
            )}
          >
            <Heart className={cn("w-4 h-4", isFavorite && "fill-current")} />
          </button>
        )}

        {/* 難易度バッジ */}
        <div className="absolute top-3 left-3">
          <span className={cn(
            "px-2 py-1 rounded-full text-xs font-medium",
            getDifficultyColor(recipe.difficulty)
          )}>
            {getDifficultyLabel(recipe.difficulty)}
          </span>
        </div>
      </div>

      {/* コンテンツエリア */}
      <div className="p-4 space-y-3">
        {/* タイトル */}
        <h3 className="font-semibold text-gray-900 text-lg">
          {recipe.title}
        </h3>

        {/* 説明 */}
        {recipe.description && (
          <p className="text-gray-600 text-sm">
            {recipe.description}
          </p>
        )}

        {/* メタ情報 */}
        <div className="flex items-center justify-between text-sm text-gray-500">
          <div className="flex items-center space-x-4">
            <div className="flex items-center space-x-1">
              <Clock className="w-4 h-4" />
              <span>{recipe.cookingTime}</span>
            </div>
            
            <div className="flex items-center space-x-1">
              <Users className="w-4 h-4" />
              <span>{recipe.servings}人分</span>
            </div>
            
            {recipe.calories && (
              <div className="text-xs">
                <span>{recipe.calories}kcal</span>
              </div>
            )}
          </div>
        </div>

        {/* 食材プレビュー */}
        <div className="space-y-2">
          <p className="text-xs font-medium text-gray-700">主な食材:</p>
          <div className="flex flex-wrap gap-1">
            {recipe.ingredients.slice(0, 4).map((ingredient, index) => (
              <span
                key={index}
                className="px-2 py-1 bg-orange-50 text-orange-700 text-xs rounded-full"
              >
                {ingredient.name}
              </span>
            ))}
            {recipe.ingredients.length > 4 && (
              <span className="px-2 py-1 bg-gray-100 text-gray-500 text-xs rounded-full">
                +{recipe.ingredients.length - 4}
              </span>
            )}
          </div>
        </div>

        {/* 調理のコツ */}
        {recipe.tips && recipe.tips.length > 0 && (
          <div className="pt-2 border-t border-gray-100">
            <p className="text-xs text-gray-600">
              💡 {recipe.tips[0]}
            </p>
          </div>
        )}
      </div>
    </div>
  )
}

export default RecipeCard