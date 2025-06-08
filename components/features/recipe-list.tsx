'use client'

import { useState } from 'react'
import { Recipe } from '@/lib/openai'
import RecipeCard from './recipe-card'
import { RecipeDetail } from './recipe-detail'
import { Search, Filter, Grid, List } from 'lucide-react'
import { cn } from '@/lib/utils'

interface RecipeListProps {
  recipes: Recipe[]
  isLoading?: boolean
  error?: string | null
  onFavoriteToggle?: (recipeId: string) => void
  favoriteRecipeIds?: string[]
  showSearch?: boolean
  showFilters?: boolean
}

type ViewMode = 'grid' | 'list'
type SortOption = 'relevance' | 'time' | 'difficulty' | 'calories'

export function RecipeList({ 
  recipes, 
  isLoading = false, 
  error = null,
  onFavoriteToggle,
  favoriteRecipeIds = [],
  showSearch = true,
  showFilters = true
}: RecipeListProps) {
  const [selectedRecipe, setSelectedRecipe] = useState<Recipe | null>(null)
  const [viewMode, setViewMode] = useState<ViewMode>('grid')
  const [searchQuery, setSearchQuery] = useState('')
  const [sortBy, setSortBy] = useState<SortOption>('relevance')
  const [difficultyFilter, setDifficultyFilter] = useState<Recipe['difficulty'] | 'all'>('all')
  const [maxTimeFilter, setMaxTimeFilter] = useState<number | null>(null)

  // フィルタリングとソート
  const filteredAndSortedRecipes = recipes
    .filter(recipe => {
      // 検索フィルター
      if (searchQuery && !recipe.title.toLowerCase().includes(searchQuery.toLowerCase()) &&
          !recipe.description?.toLowerCase().includes(searchQuery.toLowerCase())) {
        return false
      }
      
      // 難易度フィルター
      if (difficultyFilter !== 'all' && recipe.difficulty !== difficultyFilter) {
        return false
      }
      
      // 調理時間フィルター
      if (maxTimeFilter) {
        const timeMatch = recipe.cookingTime.match(/\d+/)
        const time = timeMatch ? parseInt(timeMatch[0]) : 0
        if (time > maxTimeFilter) {
          return false
        }
      }
      
      return true
    })
    .sort((a, b) => {
      switch (sortBy) {
        case 'time':
          const timeA = parseInt(a.cookingTime.match(/\d+/)?.[0] || '0')
          const timeB = parseInt(b.cookingTime.match(/\d+/)?.[0] || '0')
          return timeA - timeB
        case 'difficulty':
          const difficultyOrder = { easy: 1, medium: 2, hard: 3 }
          return difficultyOrder[a.difficulty] - difficultyOrder[b.difficulty]
        case 'calories':
          return (a.calories || 0) - (b.calories || 0)
        default:
          return 0 // relevance (元の順序を保持)
      }
    })

  const handleRecipeSelect = (recipe: Recipe) => {
    setSelectedRecipe(recipe)
  }

  const handleBackToList = () => {
    setSelectedRecipe(null)
  }

  // 詳細表示中の場合
  if (selectedRecipe) {
    return (
      <RecipeDetail
        recipe={selectedRecipe}
        onBack={handleBackToList}
        isFavorite={favoriteRecipeIds.includes(selectedRecipe.id)}
        onToggleFavorite={onFavoriteToggle}
      />
    )
  }

  // エラー表示
  if (error) {
    return (
      <div className="text-center py-12">
        <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
          <span className="text-red-500 text-2xl">⚠️</span>
        </div>
        <h3 className="text-lg font-semibold text-gray-900 mb-2">エラーが発生しました</h3>
        <p className="text-gray-600">{error}</p>
      </div>
    )
  }

  // ローディング表示
  if (isLoading) {
    return (
      <div className="space-y-6">
        {showSearch && (
          <div className="animate-pulse">
            <div className="h-12 bg-gray-200 rounded-lg"></div>
          </div>
        )}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {[...Array(6)].map((_, index) => (
            <div key={index} className="animate-pulse">
              <div className="bg-gray-200 rounded-xl h-64"></div>
            </div>
          ))}
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* 検索・フィルター */}
      {(showSearch || showFilters) && (
        <div className="space-y-4">
          {/* 検索バー */}
          {showSearch && (
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
              <input
                type="text"
                placeholder="レシピを検索..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent"
              />
            </div>
          )}

          {/* フィルターとビューモード */}
          {showFilters && (
            <div className="flex flex-wrap items-center justify-between gap-4">
              <div className="flex flex-wrap items-center gap-4">
                {/* ソート */}
                <select
                  value={sortBy}
                  onChange={(e) => setSortBy(e.target.value as SortOption)}
                  className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                >
                  <option value="relevance">関連度順</option>
                  <option value="time">調理時間順</option>
                  <option value="difficulty">難易度順</option>
                  <option value="calories">カロリー順</option>
                </select>

                {/* 難易度フィルター */}
                <select
                  value={difficultyFilter}
                  onChange={(e) => setDifficultyFilter(e.target.value as Recipe['difficulty'] | 'all')}
                  className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                >
                  <option value="all">全ての難易度</option>
                  <option value="easy">簡単</option>
                  <option value="medium">普通</option>
                  <option value="hard">難しい</option>
                </select>

                {/* 調理時間フィルター */}
                <select
                  value={maxTimeFilter || ''}
                  onChange={(e) => setMaxTimeFilter(e.target.value ? parseInt(e.target.value) : null)}
                  className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                >
                  <option value="">全ての時間</option>
                  <option value="15">15分以内</option>
                  <option value="30">30分以内</option>
                  <option value="60">1時間以内</option>
                </select>
              </div>

              {/* ビューモード切り替え */}
              <div className="flex items-center space-x-2">
                <button
                  onClick={() => setViewMode('grid')}
                  className={cn(
                    "p-2 rounded-lg transition-colors",
                    viewMode === 'grid' 
                      ? "bg-orange-500 text-white" 
                      : "bg-gray-100 text-gray-600 hover:bg-gray-200"
                  )}
                >
                  <Grid className="w-4 h-4" />
                </button>
                <button
                  onClick={() => setViewMode('list')}
                  className={cn(
                    "p-2 rounded-lg transition-colors",
                    viewMode === 'list' 
                      ? "bg-orange-500 text-white" 
                      : "bg-gray-100 text-gray-600 hover:bg-gray-200"
                  )}
                >
                  <List className="w-4 h-4" />
                </button>
              </div>
            </div>
          )}
        </div>
      )}

      {/* 結果数表示 */}
      <div className="flex items-center justify-between">
        <p className="text-sm text-gray-600">
          {filteredAndSortedRecipes.length}件のレシピが見つかりました
        </p>
      </div>

      {/* レシピ一覧 */}
      {filteredAndSortedRecipes.length === 0 ? (
        <div className="text-center py-12">
          <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <Search className="w-8 h-8 text-gray-400" />
          </div>
          <h3 className="text-lg font-semibold text-gray-900 mb-2">レシピが見つかりませんでした</h3>
          <p className="text-gray-600">検索条件を変更してお試しください</p>
        </div>
      ) : (
        <div className={cn(
          viewMode === 'grid' 
            ? "grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6"
            : "space-y-4"
        )}>
          {filteredAndSortedRecipes.map((recipe) => (
            <RecipeCard
              key={recipe.id}
              recipe={recipe}
              onSelect={handleRecipeSelect}
              isFavorite={favoriteRecipeIds.includes(recipe.id)}
              onToggleFavorite={onFavoriteToggle}
              className={viewMode === 'list' ? "flex-row" : ""}
            />
          ))}
        </div>
      )}
    </div>
  )
}