import { render, screen, fireEvent } from '@testing-library/react'
import { Header } from './header'

// シンプルなモック設定
const mockAuth = {
  signIn: jest.fn(),
  signOut: jest.fn(),
  useSession: jest.fn(),
}

jest.mock('next-auth/react', () => ({
  useSession: () => mockAuth.useSession(),
  signIn: () => mockAuth.signIn(),
  signOut: (options: any) => mockAuth.signOut(options),
}))

jest.mock('next/link', () => {
  return ({ children, href }: { children: React.ReactNode; href: string }) => (
    <a href={href}>{children}</a>
  )
})

const testUser = {
  id: 'user-1',
  name: 'テストユーザー',
  email: 'test@example.com',
  image: 'https://example.com/avatar.jpg',
}

describe('Header', () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })

  it('ログインしていない時の表示', () => {
    mockAuth.useSession.mockReturnValue({
      data: null,
      status: 'unauthenticated',
    })

    render(<Header />)

    expect(screen.getByText('🍽️ Recipe AI')).toBeInTheDocument()
    expect(screen.getByText('ホーム')).toBeInTheDocument()
    expect(screen.getByText('レシピ')).toBeInTheDocument()
    expect(screen.getByText('ログイン')).toBeInTheDocument()
  })

  it('ログインボタンの動作', () => {
    mockAuth.useSession.mockReturnValue({
      data: null,
      status: 'unauthenticated',
    })

    render(<Header />)

    fireEvent.click(screen.getByText('ログイン'))
    expect(mockAuth.signIn).toHaveBeenCalled()
  })

  it('ローディング状態の表示', () => {
    mockAuth.useSession.mockReturnValue({
      data: null,
      status: 'loading',
    })

    render(<Header />)

    expect(document.querySelector('.animate-pulse')).toBeInTheDocument()
  })

  it('ログイン済みの表示', () => {
    mockAuth.useSession.mockReturnValue({
      data: { user: testUser },
      status: 'authenticated',
    })

    render(<Header />)

    expect(screen.getByText('お気に入り')).toBeInTheDocument()
    expect(screen.getByAltText('テストユーザー')).toBeInTheDocument()
  })

  it('ユーザーメニューの開閉', () => {
    mockAuth.useSession.mockReturnValue({
      data: { user: testUser },
      status: 'authenticated',
    })

    render(<Header />)

    // メニューを開く
    const userButton = screen.getByText('テストユーザー').closest('button')
    fireEvent.click(userButton!)

    expect(screen.getByText('プロフィール')).toBeInTheDocument()
    expect(screen.getByText('ログアウト')).toBeInTheDocument()
  })

  it('ログアウトの動作', () => {
    mockAuth.useSession.mockReturnValue({
      data: { user: testUser },
      status: 'authenticated',
    })

    render(<Header />)

    // メニューを開いてログアウト
    const userButton = screen.getByText('テストユーザー').closest('button')
    fireEvent.click(userButton!)
    fireEvent.click(screen.getByText('ログアウト'))

    expect(mockAuth.signOut).toHaveBeenCalledWith({ callbackUrl: '/' })
  })

  it('ナビゲーションリンクの確認', () => {
    mockAuth.useSession.mockReturnValue({
      data: { user: testUser },
      status: 'authenticated',
    })

    render(<Header />)

    expect(screen.getByText('ホーム').closest('a')).toHaveAttribute('href', '/')
    expect(screen.getByText('レシピ').closest('a')).toHaveAttribute('href', '/recipes')
    expect(screen.getByText('お気に入り').closest('a')).toHaveAttribute('href', '/favorites')
  })
})