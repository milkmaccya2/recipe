'use client'

import { useSession } from 'next-auth/react'
import { useFavorites } from '@/hooks/use-favorites'
import { Header } from '@/components/features/header'
import { RecipeList } from '@/components/features/recipe-list'
import { Heart, ArrowRight } from 'lucide-react'
import Link from 'next/link'

export default function FavoritesPage() {
  const { data: session, status } = useSession()
  const { favorites, isLoading, error, toggleFavorite, favoriteIds } = useFavorites()

  if (status === 'loading') {
    return (
      <div className="min-h-screen bg-gradient-to-br from-orange-50 to-red-50">
        <Header />
        <main className="container mx-auto px-4 py-8">
          <div className="max-w-6xl mx-auto">
            <div className="animate-pulse">
              <div className="h-8 bg-gray-200 rounded w-48 mb-8"></div>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {[...Array(6)].map((_, index) => (
                  <div key={index} className="bg-gray-200 rounded-xl h-64"></div>
                ))}
              </div>
            </div>
          </div>
        </main>
      </div>
    )
  }

  if (!session) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-orange-50 to-red-50">
        <Header />
        <main className="container mx-auto px-4 py-8">
          <div className="max-w-4xl mx-auto text-center">
            <div className="bg-white rounded-2xl shadow-lg p-12">
              <div className="w-24 h-24 bg-orange-100 rounded-full flex items-center justify-center mx-auto mb-6">
                <Heart className="w-12 h-12 text-orange-500" />
              </div>
              <h1 className="text-3xl font-bold text-gray-900 mb-4">
                お気に入り機能を使うには
              </h1>
              <p className="text-gray-600 mb-8 text-lg">
                お気に入りのレシピを保存・管理するにはログインが必要です
              </p>
              <div className="space-y-4">
                <Link
                  href="/auth/signin"
                  className="inline-flex items-center space-x-2 bg-orange-500 hover:bg-orange-600 text-white px-8 py-3 rounded-lg transition-colors text-lg font-medium"
                >
                  <span>ログインする</span>
                  <ArrowRight className="w-5 h-5" />
                </Link>
                <div>
                  <Link
                    href="/"
                    className="text-gray-600 hover:text-gray-900 underline"
                  >
                    ログインせずに利用する
                  </Link>
                </div>
              </div>
            </div>
          </div>
        </main>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-orange-50 to-red-50">
      <Header />
      <main className="container mx-auto px-4 py-8">
        <div className="max-w-6xl mx-auto">
          {/* ヘッダー */}
          <div className="flex items-center justify-between mb-8">
            <div className="flex items-center space-x-3">
              <div className="w-10 h-10 bg-orange-100 rounded-full flex items-center justify-center">
                <Heart className="w-6 h-6 text-orange-600" />
              </div>
              <div>
                <h1 className="text-3xl font-bold text-gray-900">お気に入り</h1>
                <p className="text-gray-600">
                  保存したレシピ ({favorites.length}件)
                </p>
              </div>
            </div>
          </div>

          {/* エラー表示 */}
          {error && (
            <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg">
              <p className="text-red-600">{error}</p>
            </div>
          )}

          {/* お気に入りが空の場合 */}
          {!isLoading && favorites.length === 0 && !error && (
            <div className="text-center py-16">
              <div className="w-24 h-24 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-6">
                <Heart className="w-12 h-12 text-gray-400" />
              </div>
              <h2 className="text-2xl font-bold text-gray-900 mb-4">
                お気に入りレシピがありません
              </h2>
              <p className="text-gray-600 mb-8 max-w-md mx-auto">
                気に入ったレシピを見つけたら、ハートマークをクリックしてお気に入りに追加しましょう
              </p>
              <Link
                href="/"
                className="inline-flex items-center space-x-2 bg-orange-500 hover:bg-orange-600 text-white px-6 py-3 rounded-lg transition-colors"
              >
                <span>レシピを探す</span>
                <ArrowRight className="w-4 h-4" />
              </Link>
            </div>
          )}

          {/* お気に入りレシピ一覧 */}
          {favorites.length > 0 && (
            <RecipeList
              recipes={favorites}
              isLoading={isLoading}
              error={error}
              onFavoriteToggle={toggleFavorite}
              favoriteRecipeIds={favoriteIds}
              showSearch={true}
              showFilters={true}
            />
          )}
        </div>
      </main>
    </div>
  )
}