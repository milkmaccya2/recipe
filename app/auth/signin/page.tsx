'use client'

import { signIn, getProviders } from 'next-auth/react'
import { useEffect, useState } from 'react'
import { useSearchParams } from 'next/navigation'
import { Github, Mail, ArrowLeft } from 'lucide-react'
import Link from 'next/link'

export default function SignInPage() {
  const [providers, setProviders] = useState<any>(null)
  const searchParams = useSearchParams()
  const error = searchParams.get('error')
  const callbackUrl = searchParams.get('callbackUrl') || '/'

  useEffect(() => {
    const fetchProviders = async () => {
      const res = await getProviders()
      setProviders(res)
    }
    fetchProviders()
  }, [])

  const getProviderIcon = (providerId: string) => {
    switch (providerId) {
      case 'github':
        return <Github className="w-5 h-5" />
      case 'google':
        return <Mail className="w-5 h-5" />
      default:
        return <Mail className="w-5 h-5" />
    }
  }

  const getProviderColor = (providerId: string) => {
    switch (providerId) {
      case 'github':
        return 'bg-gray-900 hover:bg-gray-800 text-white'
      case 'google':
        return 'bg-red-500 hover:bg-red-600 text-white'
      default:
        return 'bg-blue-500 hover:bg-blue-600 text-white'
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-orange-50 to-red-50 flex items-center justify-center px-4">
      <div className="max-w-md w-full">
        {/* 戻るボタン */}
        <Link
          href="/"
          className="inline-flex items-center space-x-2 text-gray-600 hover:text-gray-900 mb-8 transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>ホームに戻る</span>
        </Link>

        <div className="bg-white rounded-2xl shadow-xl p-8">
          {/* ヘッダー */}
          <div className="text-center mb-8">
            <div className="w-16 h-16 bg-orange-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <span className="text-2xl">🍽️</span>
            </div>
            <h1 className="text-2xl font-bold text-gray-900 mb-2">
              Recipe Suggester AI
            </h1>
            <p className="text-gray-600">
              ログインしてレシピを保存・管理しよう
            </p>
          </div>

          {/* エラー表示 */}
          {error && (
            <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg">
              <p className="text-red-600 text-sm">
                {error === 'OAuthSignin' && 'OAuth認証に失敗しました'}
                {error === 'OAuthCallback' && 'OAuth認証が中断されました'}
                {error === 'OAuthCreateAccount' && 'アカウントの作成に失敗しました'}
                {error === 'EmailCreateAccount' && 'メール認証に失敗しました'}
                {error === 'Callback' && '認証に失敗しました'}
                {error === 'OAuthAccountNotLinked' && 'このメールアドレスは既に別のアカウントで使用されています'}
                {error === 'EmailSignin' && 'メールの送信に失敗しました'}
                {error === 'CredentialsSignin' && 'ログイン情報が正しくありません'}
                {error === 'SessionRequired' && 'ログインが必要です'}
                {!['OAuthSignin', 'OAuthCallback', 'OAuthCreateAccount', 'EmailCreateAccount', 'Callback', 'OAuthAccountNotLinked', 'EmailSignin', 'CredentialsSignin', 'SessionRequired'].includes(error) && 'ログインエラーが発生しました'}
              </p>
            </div>
          )}

          {/* プロバイダーボタン */}
          <div className="space-y-3">
            {providers && Object.values(providers).map((provider: any) => (
              <button
                key={provider.name}
                onClick={() => signIn(provider.id, { callbackUrl })}
                className={`w-full flex items-center justify-center space-x-3 py-3 px-4 rounded-lg font-medium transition-colors ${getProviderColor(provider.id)}`}
              >
                {getProviderIcon(provider.id)}
                <span>{provider.name}でログイン</span>
              </button>
            ))}
          </div>

          {/* 利用規約 */}
          <div className="mt-6 text-center">
            <p className="text-xs text-gray-500">
              ログインすることで、
              <Link href="/terms" className="text-orange-600 hover:underline">利用規約</Link>
              および
              <Link href="/privacy" className="text-orange-600 hover:underline">プライバシーポリシー</Link>
              に同意したものとみなされます
            </p>
          </div>
        </div>

        {/* ゲスト利用 */}
        <div className="mt-6 text-center">
          <Link
            href="/"
            className="text-gray-600 hover:text-gray-900 text-sm underline"
          >
            ログインせずに利用する
          </Link>
        </div>
      </div>
    </div>
  )
}