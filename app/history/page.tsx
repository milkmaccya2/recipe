'use client'

import { useState, useEffect, useCallback } from 'react'
import { useSession } from 'next-auth/react'
import { Header } from '@/components/features/header'
import { RecipeList } from '@/components/features/recipe-list'
import { useFavorites } from '@/hooks/use-favorites'
import { Recipe } from '@/lib/openai'
import { Clock, Trash2, ArrowRight } from 'lucide-react'
import Link from 'next/link'

interface HistoryItem {
  id: string
  recipe: Recipe
  viewed_at: string
}

export default function HistoryPage() {
  const { data: session, status } = useSession()
  const { toggleFavorite, favoriteIds } = useFavorites()
  const [history, setHistory] = useState<HistoryItem[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const fetchHistory = useCallback(async () => {
    if (!session?.user) {
      setHistory([])
      return
    }

    setIsLoading(true)
    setError(null)

    try {
      const response = await fetch('/api/history')
      if (!response.ok) {
        if (response.status === 401) {
          setHistory([])
          setIsLoading(false)
          return
        }
        throw new Error('履歴の取得に失敗しました')
      }

      const data = await response.json()
      setHistory(data.history || [])
    } catch (error) {
      console.error('Error fetching history:', error)
      setError(error instanceof Error ? error.message : 'エラーが発生しました')
    } finally {
      setIsLoading(false)
    }
  }, [session])

  const clearHistory = useCallback(async () => {
    if (!session?.user) return

    if (!confirm('履歴をすべてクリアしますか？この操作は元に戻せません。')) {
      return
    }

    try {
      const response = await fetch('/api/history', {
        method: 'DELETE',
      })

      if (!response.ok) {
        throw new Error('履歴のクリアに失敗しました')
      }

      setHistory([])
    } catch (error) {
      console.error('Error clearing history:', error)
      setError(error instanceof Error ? error.message : 'エラーが発生しました')
    }
  }, [session])

  useEffect(() => {
    fetchHistory()
  }, [fetchHistory])

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
                <Clock className="w-12 h-12 text-orange-500" />
              </div>
              <h1 className="text-3xl font-bold text-gray-900 mb-4">
                履歴機能を使うには
              </h1>
              <p className="text-gray-600 mb-8 text-lg">
                閲覧履歴を確認するにはログインが必要です
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

  const recipes = history.map(item => item.recipe)

  return (
    <div className="min-h-screen bg-gradient-to-br from-orange-50 to-red-50">
      <Header />
      <main className="container mx-auto px-4 py-8">
        <div className="max-w-6xl mx-auto">
          {/* ヘッダー */}
          <div className="flex items-center justify-between mb-8">
            <div className="flex items-center space-x-3">
              <div className="w-10 h-10 bg-orange-100 rounded-full flex items-center justify-center">
                <Clock className="w-6 h-6 text-orange-600" />
              </div>
              <div>
                <h1 className="text-3xl font-bold text-gray-900">閲覧履歴</h1>
                <p className="text-gray-600">
                  最近見たレシピ ({history.length}件)
                </p>
              </div>
            </div>

            {history.length > 0 && (
              <button
                onClick={clearHistory}
                className="flex items-center space-x-2 text-red-600 hover:text-red-700 transition-colors"
              >
                <Trash2 className="w-4 h-4" />
                <span>履歴をクリア</span>
              </button>
            )}
          </div>

          {/* エラー表示 */}
          {error && (
            <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg">
              <p className="text-red-600">{error}</p>
            </div>
          )}

          {/* 履歴が空の場合 */}
          {!isLoading && history.length === 0 && !error && (
            <div className="text-center py-16">
              <div className="w-24 h-24 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-6">
                <Clock className="w-12 h-12 text-gray-400" />
              </div>
              <h2 className="text-2xl font-bold text-gray-900 mb-4">
                閲覧履歴がありません
              </h2>
              <p className="text-gray-600 mb-8 max-w-md mx-auto">
                レシピを見ると自動的に履歴に記録されます
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

          {/* 履歴レシピ一覧 */}
          {recipes.length > 0 && (
            <RecipeList
              recipes={recipes}
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