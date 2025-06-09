/**
 * 認証フックテスト
 */

import { renderHook, act, waitFor } from '@testing-library/react'
import { useSession, signIn, signOut } from 'next-auth/react'
import { useRouter } from 'next/navigation'
import { useAuth } from './use-auth'

// モック設定
const mockUseSession = useSession as jest.MockedFunction<typeof useSession>
const mockSignIn = signIn as jest.MockedFunction<typeof signIn>
const mockSignOut = signOut as jest.MockedFunction<typeof signOut>
const mockUseRouter = useRouter as jest.Mock

describe('useAuth', () => {
  const mockPush = jest.fn()
  const mockRouter = {
    push: mockPush,
    replace: jest.fn(),
    back: jest.fn(),
    forward: jest.fn(),
    refresh: jest.fn(),
    prefetch: jest.fn()
  }

  beforeEach(() => {
    jest.clearAllMocks()
    mockUseRouter.mockReturnValue(mockRouter)
    
    // グローバルオブジェクトのモック
    Object.defineProperty(window, 'location', {
      value: { pathname: '/test' },
      writable: true,
    })
  })

  describe('認証状態', () => {
    it('ローディング状態を正しく返す', () => {
      mockUseSession.mockReturnValue({
        data: null,
        status: 'loading',
        update: jest.fn(),
      })

      const { result } = renderHook(() => useAuth())

      expect(result.current.isLoading).toBe(true)
      expect(result.current.isAuthenticated).toBe(false)
      expect(result.current.user).toBe(null)
    })

    it('認証済み状態を正しく返す', () => {
      const mockSession = {
        user: {
          id: 'test-user-id',
          name: 'Test User',
          email: 'test@example.com',
          image: 'https://example.com/avatar.jpg',
        },
        expires: '2024-12-31T23:59:59.999Z',
      }

      mockUseSession.mockReturnValue({
        data: mockSession,
        status: 'authenticated',
        update: jest.fn(),
      })

      const { result } = renderHook(() => useAuth())

      expect(result.current.isLoading).toBe(false)
      expect(result.current.isAuthenticated).toBe(true)
      expect(result.current.user).toEqual({
        id: 'test-user-id',
        name: 'Test User',
        email: 'test@example.com',
        image: 'https://example.com/avatar.jpg',
      })
    })

    it('未認証状態を正しく返す', () => {
      mockUseSession.mockReturnValue({
        data: null,
        status: 'unauthenticated',
        update: jest.fn(),
      })

      const { result } = renderHook(() => useAuth())

      expect(result.current.isLoading).toBe(false)
      expect(result.current.isAuthenticated).toBe(false)
      expect(result.current.user).toBe(null)
    })
  })

  describe('認証アクション', () => {
    beforeEach(() => {
      mockUseSession.mockReturnValue({
        data: null,
        status: 'unauthenticated',
        update: jest.fn(),
      })
    })

    it('signInが正しく呼ばれる', async () => {
      mockSignIn.mockResolvedValue(undefined)

      const { result } = renderHook(() => useAuth())

      await act(async () => {
        await result.current.signIn('github', { callbackUrl: '/profile' })
      })

      expect(mockSignIn).toHaveBeenCalledWith('github', { callbackUrl: '/profile' })
    })

    it('デフォルトのプロバイダーとコールバックURLを使用する', async () => {
      mockSignIn.mockResolvedValue(undefined)

      const { result } = renderHook(() => useAuth())

      await act(async () => {
        await result.current.signIn()
      })

      expect(mockSignIn).toHaveBeenCalledWith('google', { callbackUrl: '/dashboard' })
    })

    it('signOutが正しく呼ばれる', async () => {
      mockSignOut.mockResolvedValue({ url: '/' })

      const { result } = renderHook(() => useAuth())

      await act(async () => {
        await result.current.signOut({ callbackUrl: '/goodbye' })
      })

      expect(mockSignOut).toHaveBeenCalledWith({ callbackUrl: '/goodbye' })
    })

    it('デフォルトのsignOutコールバックURLを使用する', async () => {
      mockSignOut.mockResolvedValue({ url: '/' })

      const { result } = renderHook(() => useAuth())

      await act(async () => {
        await result.current.signOut()
      })

      expect(mockSignOut).toHaveBeenCalledWith({ callbackUrl: '/' })
    })
  })

  describe('requireAuth', () => {
    it('未認証時にサインインページにリダイレクトする', () => {
      mockUseSession.mockReturnValue({
        data: null,
        status: 'unauthenticated',
        update: jest.fn(),
      })

      const { result } = renderHook(() => useAuth())

      act(() => {
        result.current.requireAuth()
      })

      expect(mockPush).toHaveBeenCalledWith('/auth/signin?callbackUrl=%2Ftest')
    })

    it('認証済み時はリダイレクトしない', () => {
      const mockSession = {
        user: { id: 'test-user-id', email: 'test@example.com' },
        expires: '2024-12-31T23:59:59.999Z',
      }

      mockUseSession.mockReturnValue({
        data: mockSession,
        status: 'authenticated',
        update: jest.fn(),
      })

      const { result } = renderHook(() => useAuth())

      act(() => {
        result.current.requireAuth()
      })

      expect(mockPush).not.toHaveBeenCalled()
    })

    it('ローディング時はリダイレクトしない', () => {
      mockUseSession.mockReturnValue({
        data: null,
        status: 'loading',
        update: jest.fn(),
      })

      const { result } = renderHook(() => useAuth())

      act(() => {
        result.current.requireAuth()
      })

      expect(mockPush).not.toHaveBeenCalled()
    })
  })
})