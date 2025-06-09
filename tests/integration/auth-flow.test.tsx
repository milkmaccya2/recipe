/**
 * 認証フロー統合テスト
 */

import { render, screen, waitFor, fireEvent } from '@testing-library/react'
import { SessionProvider } from 'next-auth/react'
import { useRouter } from 'next/navigation'
import DashboardPage from '@/app/dashboard/page'
import SignInPage from '@/app/auth/signin/page'
import { useAuth } from '@/hooks/use-auth'

// モック設定
jest.mock('next/navigation')
jest.mock('next-auth/react')
jest.mock('@/hooks/use-auth')

const mockUseRouter = useRouter as jest.MockedFunction<typeof useRouter>
const mockUseAuth = useAuth as jest.MockedFunction<typeof useAuth>

describe('認証フロー統合テスト', () => {
  const mockPush = jest.fn()
  const mockSignIn = jest.fn()
  const mockSignOut = jest.fn()
  const mockRequireAuth = jest.fn()

  beforeEach(() => {
    jest.clearAllMocks()
    mockUseRouter.mockReturnValue({
      push: mockPush,
      replace: jest.fn(),
      back: jest.fn(),
      forward: jest.fn(),
      refresh: jest.fn(),
      prefetch: jest.fn(),
    } as any)
  })

  describe('未認証ユーザー', () => {
    beforeEach(() => {
      mockUseAuth.mockReturnValue({
        user: null,
        isLoading: false,
        isAuthenticated: false,
        signIn: mockSignIn,
        signOut: mockSignOut,
        requireAuth: mockRequireAuth,
      })
    })

    it('サインインページが正しく表示される', () => {
      render(
        <SessionProvider session={null}>
          <SignInPage />
        </SessionProvider>
      )

      expect(screen.getByText('Recipe Suggester AI')).toBeInTheDocument()
      expect(screen.getByText('ログインしてレシピを保存・管理しよう')).toBeInTheDocument()
    })

    it('ダッシュボードアクセス時にrequireAuthが呼ばれる', () => {
      render(
        <SessionProvider session={null}>
          <DashboardPage />
        </SessionProvider>
      )

      expect(mockRequireAuth).toHaveBeenCalled()
    })
  })

  describe('認証済みユーザー', () => {
    const mockUser = {
      id: 'test-user-id',
      name: 'Test User',
      email: 'test@example.com',
      image: 'https://example.com/avatar.jpg',
    }

    beforeEach(() => {
      mockUseAuth.mockReturnValue({
        user: mockUser,
        isLoading: false,
        isAuthenticated: true,
        signIn: mockSignIn,
        signOut: mockSignOut,
        requireAuth: mockRequireAuth,
      })
    })

    it('ダッシュボードが正しく表示される', () => {
      render(
        <SessionProvider session={{
          user: mockUser,
          expires: '2024-12-31T23:59:59.999Z',
        }}>
          <DashboardPage />
        </SessionProvider>
      )

      expect(screen.getByText(`おかえりなさい、${mockUser.name}さん！`)).toBeInTheDocument()
      expect(screen.getByText('今日はどんなお料理を作りましょうか？')).toBeInTheDocument()
      expect(screen.getByText('写真から提案')).toBeInTheDocument()
      expect(screen.getByText('レシピ一覧')).toBeInTheDocument()
      expect(screen.getByText('お気に入り')).toBeInTheDocument()
      expect(screen.getByText('履歴')).toBeInTheDocument()
    })

    it('ログアウトボタンが機能する', async () => {
      render(
        <SessionProvider session={{
          user: mockUser,
          expires: '2024-12-31T23:59:59.999Z',
        }}>
          <DashboardPage />
        </SessionProvider>
      )

      const logoutButton = screen.getByText('ログアウト')
      fireEvent.click(logoutButton)

      await waitFor(() => {
        expect(mockSignOut).toHaveBeenCalled()
      })
    })
  })

  describe('ローディング状態', () => {
    beforeEach(() => {
      mockUseAuth.mockReturnValue({
        user: null,
        isLoading: true,
        isAuthenticated: false,
        signIn: mockSignIn,
        signOut: mockSignOut,
        requireAuth: mockRequireAuth,
      })
    })

    it('ローディングスピナーが表示される', () => {
      render(
        <SessionProvider session={null}>
          <DashboardPage />
        </SessionProvider>
      )

      expect(screen.getByText('読み込み中...')).toBeInTheDocument()
    })
  })
})