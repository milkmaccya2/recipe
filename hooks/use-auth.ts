/**
 * 認証状態管理フック
 */

import { useSession, signIn, signOut } from 'next-auth/react'
import { useRouter } from 'next/navigation'
import { useCallback } from 'react'

export interface UseAuthReturn {
  // 認証状態
  user: {
    id: string
    name?: string | null
    email?: string | null
    image?: string | null
  } | null
  isLoading: boolean
  isAuthenticated: boolean
  
  // 認証アクション
  signIn: (provider?: string, options?: { callbackUrl?: string }) => Promise<void>
  signOut: (options?: { callbackUrl?: string }) => Promise<void>
  
  // ユーティリティ
  requireAuth: () => void
}

export function useAuth(): UseAuthReturn {
  const { data: session, status } = useSession()
  const router = useRouter()

  const isLoading = status === 'loading'
  const isAuthenticated = !!session?.user
  const user = session?.user ? {
    id: session.user.id || '',
    name: session.user.name,
    email: session.user.email,
    image: session.user.image,
  } : null

  const handleSignIn = useCallback(async (
    provider = 'google',
    options: { callbackUrl?: string } = {}
  ) => {
    const callbackUrl = options.callbackUrl || '/dashboard'
    await signIn(provider, { callbackUrl })
  }, [])

  const handleSignOut = useCallback(async (
    options: { callbackUrl?: string } = {}
  ) => {
    const callbackUrl = options.callbackUrl || '/'
    await signOut({ callbackUrl })
  }, [])

  const requireAuth = useCallback(() => {
    if (!isLoading && !isAuthenticated) {
      const currentPath = window.location.pathname
      const callbackUrl = encodeURIComponent(currentPath)
      router.push(`/auth/signin?callbackUrl=${callbackUrl}`)
    }
  }, [isLoading, isAuthenticated, router])

  return {
    user,
    isLoading,
    isAuthenticated,
    signIn: handleSignIn,
    signOut: handleSignOut,
    requireAuth,
  }
}