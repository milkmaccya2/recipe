/**
 * レシピ一覧ページ
 */

'use client'

import { useState, useEffect } from 'react'
import { useAuth } from '@/hooks/use-auth'
import { useFavorites } from '@/hooks/use-favorites'
import { Recipe } from '@/lib/openai'
import { RecipeCard } from '@/components/features/recipe-card'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { 
  Search, 
  Filter, 
  Clock, 
  Users, 
  ChefHat, 
  Star,
  Heart,
  Plus,
  Camera
} from 'lucide-react'
import Link from 'next/link'

export default function RecipesPage() {
  const [recipes, setRecipes] = useState<Recipe[]>([])
  const [loading, setLoading] = useState(true)
  const [searchQuery, setSearchQuery] = useState('')
  const [selectedDifficulty, setSelectedDifficulty] = useState<string>('all')
  const [selectedCookingTime, setSelectedCookingTime] = useState<string>('all')
  const [viewMode, setViewMode] = useState<'all' | 'favorites'>('all')

  const { user, isAuthenticated } = useAuth()
  const { favorites, addToFavorites, removeFromFavorites } = useFavorites()

  useEffect(() => {
    loadRecipes()
  }, [])

  const loadRecipes = async () => {
    try {
      setLoading(true)
      // TODO: 実際のAPIエンドポイントに置き換え
      const response = await fetch('/api/recipes')
      if (response.ok) {
        const data = await response.json()
        setRecipes(data.recipes || [])
      }
    } catch (error) {
      console.error('レシピの読み込みに失敗しました:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleToggleFavorite = async (recipeId: string) => {
    if (!isAuthenticated) {
      alert('お気に入り機能を使用するにはログインが必要です')
      return
    }

    const recipe = recipes.find(r => r.id === recipeId)
    if (!recipe) return

    try {
      const isFavorite = favorites.some(fav => fav.id === recipeId)
      if (isFavorite) {
        await removeFromFavorites(recipeId)
      } else {
        await addToFavorites(recipe)
      }
    } catch (error) {
      console.error('お気に入り操作に失敗しました:', error)
      alert('お気に入り操作に失敗しました')
    }
  }

  const filteredRecipes = recipes.filter(recipe => {
    // 検索クエリフィルター
    if (searchQuery && !recipe.title.toLowerCase().includes(searchQuery.toLowerCase())) {
      return false
    }

    // 難易度フィルター
    if (selectedDifficulty !== 'all' && recipe.difficulty !== selectedDifficulty) {
      return false
    }

    // 調理時間フィルター
    if (selectedCookingTime !== 'all') {
      const cookingMinutes = parseInt(recipe.cookingTime.replace(/\D/g, ''))
      switch (selectedCookingTime) {
        case 'quick':
          return cookingMinutes <= 15
        case 'medium':
          return cookingMinutes > 15 && cookingMinutes <= 30
        case 'long':
          return cookingMinutes > 30
      }
    }

    // お気に入りフィルター
    if (viewMode === 'favorites') {
      return favorites.some(fav => fav.id === recipe.id)
    }

    return true
  })

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-orange-50 to-red-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-orange-500 mx-auto mb-4"></div>
          <p className="text-gray-600">レシピを読み込み中...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-orange-50 to-red-50">
      {/* ヘッダー */}
      <header className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center space-x-4">
              <Link href="/" className="text-xl font-bold text-orange-600">
                Recipe Suggester AI
              </Link>
              <span className="text-gray-400">|</span>
              <h1 className="text-lg font-semibold text-gray-900">レシピ一覧</h1>
            </div>
            
            <div className="flex items-center space-x-3">
              <Link href="/">
                <Button variant="outline" size="sm">
                  <Camera className="w-4 h-4 mr-2" />
                  写真から提案
                </Button>
              </Link>
              
              {isAuthenticated ? (
                <Link href="/dashboard">
                  <Button size="sm">
                    ダッシュボード
                  </Button>
                </Link>
              ) : (
                <Link href="/auth/signin">
                  <Button size="sm">
                    ログイン
                  </Button>
                </Link>
              )}
            </div>
          </div>
        </div>
      </header>

      {/* メインコンテンツ */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* 統計カード */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">総レシピ数</p>
                  <p className="text-2xl font-bold text-gray-900">{recipes.length}</p>
                </div>
                <ChefHat className="w-8 h-8 text-orange-500" />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">お気に入り</p>
                  <p className="text-2xl font-bold text-gray-900">{favorites.length}</p>
                </div>
                <Heart className="w-8 h-8 text-red-500" />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">簡単レシピ</p>
                  <p className="text-2xl font-bold text-gray-900">
                    {recipes.filter(r => r.difficulty === 'easy').length}
                  </p>
                </div>
                <Star className="w-8 h-8 text-yellow-500" />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">15分以内</p>
                  <p className="text-2xl font-bold text-gray-900">
                    {recipes.filter(r => parseInt(r.cookingTime.replace(/\D/g, '')) <= 15).length}
                  </p>
                </div>
                <Clock className="w-8 h-8 text-green-500" />
              </div>
            </CardContent>
          </Card>
        </div>

        {/* フィルター */}
        <Card className="mb-6">
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <Filter className="w-5 h-5" />
              <span>フィルター</span>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              {/* 検索 */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  レシピ検索
                </label>
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                  <input
                    type="text"
                    placeholder="レシピ名で検索"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                  />
                </div>
              </div>

              {/* 表示モード */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  表示モード
                </label>
                <select
                  value={viewMode}
                  onChange={(e) => setViewMode(e.target.value as 'all' | 'favorites')}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                >
                  <option value="all">すべてのレシピ</option>
                  <option value="favorites">お気に入りのみ</option>
                </select>
              </div>

              {/* 難易度 */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  難易度
                </label>
                <select
                  value={selectedDifficulty}
                  onChange={(e) => setSelectedDifficulty(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                >
                  <option value="all">すべて</option>
                  <option value="easy">簡単</option>
                  <option value="medium">普通</option>
                  <option value="hard">難しい</option>
                </select>
              </div>

              {/* 調理時間 */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  調理時間
                </label>
                <select
                  value={selectedCookingTime}
                  onChange={(e) => setSelectedCookingTime(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                >
                  <option value="all">すべて</option>
                  <option value="quick">15分以内</option>
                  <option value="medium">16-30分</option>
                  <option value="long">30分以上</option>
                </select>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* レシピ一覧 */}
        <div>
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-xl font-bold text-gray-900">
              {viewMode === 'favorites' ? 'お気に入りレシピ' : 'レシピ一覧'}
              <span className="ml-2 text-sm font-normal text-gray-600">
                ({filteredRecipes.length}件)
              </span>
            </h2>
          </div>

          {filteredRecipes.length === 0 ? (
            <Card>
              <CardContent className="p-12 text-center">
                <ChefHat className="w-16 h-16 text-gray-400 mx-auto mb-4" />
                <h3 className="text-lg font-semibold text-gray-900 mb-2">
                  {viewMode === 'favorites' ? 'お気に入りレシピがありません' : 'レシピが見つかりません'}
                </h3>
                <p className="text-gray-600 mb-6">
                  {viewMode === 'favorites' 
                    ? '気に入ったレシピをお気に入りに追加してみましょう'
                    : '検索条件を変更するか、新しいレシピを提案してもらいましょう'
                  }
                </p>
                <div className="flex justify-center space-x-3">
                  {viewMode === 'favorites' && (
                    <Button onClick={() => setViewMode('all')} variant="outline">
                      すべてのレシピを見る
                    </Button>
                  )}
                  <Link href="/">
                    <Button>
                      <Camera className="w-4 h-4 mr-2" />
                      写真から提案
                    </Button>
                  </Link>
                </div>
              </CardContent>
            </Card>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {filteredRecipes.map((recipe) => (
                <RecipeCard
                  key={recipe.id}
                  recipe={recipe}
                  isFavorite={favorites.some(fav => fav.id === recipe.id)}
                  onToggleFavorite={handleToggleFavorite}
                />
              ))}
            </div>
          )}
        </div>
      </main>
    </div>
  )
}