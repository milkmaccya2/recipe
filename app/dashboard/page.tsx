/**
 * ダッシュボードページ
 */

'use client'

import { useAuth } from '@/hooks/use-auth'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Camera, History, Heart, ChefHat, User, LogOut } from 'lucide-react'
import Link from 'next/link'
import { useEffect } from 'react'

export default function DashboardPage() {
  const { user, isLoading, isAuthenticated, signOut, requireAuth } = useAuth()

  useEffect(() => {
    requireAuth()
  }, [requireAuth])

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-orange-50 to-red-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-orange-500 mx-auto mb-4"></div>
          <p className="text-gray-600">読み込み中...</p>
        </div>
      </div>
    )
  }

  if (!isAuthenticated || !user) {
    return null // requireAuth will handle redirect
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
            </div>
            
            <div className="flex items-center space-x-4">
              <div className="flex items-center space-x-2">
                <Avatar className="h-8 w-8">
                  <AvatarImage src={user.image || ''} alt={user.name || ''} />
                  <AvatarFallback>
                    {user.name ? user.name[0].toUpperCase() : <User className="h-4 w-4" />}
                  </AvatarFallback>
                </Avatar>
                <span className="text-sm font-medium text-gray-700">
                  {user.name || user.email}
                </span>
              </div>
              
              <Button
                variant="outline"
                size="sm"
                onClick={() => signOut()}
                className="flex items-center space-x-2"
              >
                <LogOut className="h-4 w-4" />
                <span>ログアウト</span>
              </Button>
            </div>
          </div>
        </div>
      </header>

      {/* メインコンテンツ */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* ウェルカムセクション */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">
            おかえりなさい、{user.name || 'ユーザー'}さん！
          </h1>
          <p className="text-gray-600">
            今日はどんなお料理を作りましょうか？
          </p>
        </div>

        {/* アクションカード */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <Card className="hover:shadow-lg transition-shadow cursor-pointer">
            <Link href="/">
              <CardHeader className="pb-3">
                <div className="flex items-center justify-between">
                  <CardTitle className="text-lg">写真から提案</CardTitle>
                  <Camera className="h-6 w-6 text-orange-500" />
                </div>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-gray-600">
                  食材の写真を撮ってレシピを提案してもらいましょう
                </p>
              </CardContent>
            </Link>
          </Card>

          <Card className="hover:shadow-lg transition-shadow cursor-pointer">
            <Link href="/recipes">
              <CardHeader className="pb-3">
                <div className="flex items-center justify-between">
                  <CardTitle className="text-lg">レシピ一覧</CardTitle>
                  <ChefHat className="h-6 w-6 text-green-500" />
                </div>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-gray-600">
                  保存されたレシピを見て、今日の料理を決めましょう
                </p>
              </CardContent>
            </Link>
          </Card>

          <Card className="hover:shadow-lg transition-shadow cursor-pointer">
            <Link href="/favorites">
              <CardHeader className="pb-3">
                <div className="flex items-center justify-between">
                  <CardTitle className="text-lg">お気に入り</CardTitle>
                  <Heart className="h-6 w-6 text-red-500" />
                </div>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-gray-600">
                  気に入ったレシピをもう一度作ってみませんか？
                </p>
              </CardContent>
            </Link>
          </Card>

          <Card className="hover:shadow-lg transition-shadow cursor-pointer">
            <Link href="/history">
              <CardHeader className="pb-3">
                <div className="flex items-center justify-between">
                  <CardTitle className="text-lg">履歴</CardTitle>
                  <History className="h-6 w-6 text-blue-500" />
                </div>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-gray-600">
                  過去に提案されたレシピを確認できます
                </p>
              </CardContent>
            </Link>
          </Card>
        </div>

        {/* 統計セクション */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">今月の料理数</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-orange-600">12</div>
              <p className="text-sm text-gray-600">先月より +3</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-lg">お気に入りレシピ</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-red-600">8</div>
              <p className="text-sm text-gray-600">保存されています</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-lg">節約金額</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-green-600">¥2,400</div>
              <p className="text-sm text-gray-600">今月の推定節約額</p>
            </CardContent>
          </Card>
        </div>
      </main>
    </div>
  )
}