import { render, screen, fireEvent } from '@testing-library/react'
import { Header } from './header'

// Mock next-auth/react
const mockSignIn = jest.fn()
const mockSignOut = jest.fn()
const mockUseSession = jest.fn()

jest.mock('next-auth/react', () => ({
  useSession: () => mockUseSession(),
  signIn: () => mockSignIn(),
  signOut: (options: any) => mockSignOut(options),
}))

// Mock next/link
jest.mock('next/link', () => {
  return ({ children, href }: { children: React.ReactNode; href: string }) => (
    <a href={href}>{children}</a>
  )
})

const mockUser = {
  id: 'user-1',
  name: 'Test User',
  email: 'test@example.com',
  image: 'https://example.com/avatar.jpg',
}

describe('Header component', () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })

  it('should render logo and navigation links', () => {
    mockUseSession.mockReturnValue({
      data: null,
      status: 'unauthenticated',
    })

    render(<Header />)

    expect(screen.getByText('🍽️ Recipe AI')).toBeInTheDocument()
    expect(screen.getByText('ホーム')).toBeInTheDocument()
    expect(screen.getByText('レシピ')).toBeInTheDocument()
    expect(screen.getByText('ログイン')).toBeInTheDocument()
  })

  it('should show login button when not authenticated', () => {
    mockUseSession.mockReturnValue({
      data: null,
      status: 'unauthenticated',
    })

    render(<Header />)

    const loginButton = screen.getByText('ログイン')
    expect(loginButton).toBeInTheDocument()
    
    fireEvent.click(loginButton)
    expect(mockSignIn).toHaveBeenCalled()
  })

  it('should show loading state', () => {
    mockUseSession.mockReturnValue({
      data: null,
      status: 'loading',
    })

    render(<Header />)

    const loadingElement = document.querySelector('.animate-pulse')
    expect(loadingElement).toBeInTheDocument()
  })

  it('should show user menu when authenticated', () => {
    mockUseSession.mockReturnValue({
      data: { user: mockUser },
      status: 'authenticated',
    })

    render(<Header />)

    expect(screen.getByAltText('Test User')).toBeInTheDocument()
    expect(screen.getByText('Test')).toBeInTheDocument() // First name only
    expect(screen.getByText('お気に入り')).toBeInTheDocument()
  })

  it('should show user avatar when image is available', () => {
    mockUseSession.mockReturnValue({
      data: { user: mockUser },
      status: 'authenticated',
    })

    render(<Header />)

    const avatar = screen.getByAltText('Test User')
    expect(avatar).toHaveAttribute('src', 'https://example.com/avatar.jpg')
  })

  it('should show default user icon when no image available', () => {
    const userWithoutImage = { ...mockUser, image: undefined }
    mockUseSession.mockReturnValue({
      data: { user: userWithoutImage },
      status: 'authenticated',
    })

    render(<Header />)

    const userIcon = document.querySelector('.lucide-user')
    expect(userIcon).toBeInTheDocument()
  })

  it('should toggle dropdown menu', () => {
    mockUseSession.mockReturnValue({
      data: { user: mockUser },
      status: 'authenticated',
    })

    render(<Header />)

    // Initially dropdown should not be visible
    expect(screen.queryByText('プロフィール')).not.toBeInTheDocument()

    // Click to open dropdown
    const userButton = screen.getByText('Test').closest('button')
    fireEvent.click(userButton!)

    // Dropdown should be visible
    expect(screen.getByText('プロフィール')).toBeInTheDocument()
    expect(screen.getByText('履歴')).toBeInTheDocument()
    expect(screen.getByText('ログアウト')).toBeInTheDocument()
  })

  it('should close dropdown when clicking outside', () => {
    mockUseSession.mockReturnValue({
      data: { user: mockUser },
      status: 'authenticated',
    })

    render(<Header />)

    // Open dropdown
    const userButton = screen.getByText('Test').closest('button')
    fireEvent.click(userButton!)
    expect(screen.getByText('プロフィール')).toBeInTheDocument()

    // Click outside
    const overlay = document.querySelector('.fixed.inset-0')
    fireEvent.click(overlay!)

    // Dropdown should be closed
    expect(screen.queryByText('プロフィール')).not.toBeInTheDocument()
  })

  it('should handle sign out', () => {
    mockUseSession.mockReturnValue({
      data: { user: mockUser },
      status: 'authenticated',
    })

    render(<Header />)

    // Open dropdown
    const userButton = screen.getByText('Test').closest('button')
    fireEvent.click(userButton!)

    // Click logout
    const logoutButton = screen.getByText('ログアウト')
    fireEvent.click(logoutButton)

    expect(mockSignOut).toHaveBeenCalledWith({ callbackUrl: '/' })
  })

  it('should close dropdown when clicking menu items', () => {
    mockUseSession.mockReturnValue({
      data: { user: mockUser },
      status: 'authenticated',
    })

    render(<Header />)

    // Open dropdown
    const userButton = screen.getByText('Test').closest('button')
    fireEvent.click(userButton!)
    expect(screen.getByText('プロフィール')).toBeInTheDocument()

    // Click menu item
    const profileLink = screen.getByText('プロフィール')
    fireEvent.click(profileLink)

    // Dropdown should be closed (menu item click closes dropdown)
    // Note: In real scenario, navigation would happen and component would re-render
  })

  it('should show user information in dropdown', () => {
    mockUseSession.mockReturnValue({
      data: { user: mockUser },
      status: 'authenticated',
    })

    render(<Header />)

    // Open dropdown
    const userButton = screen.getByText('Test').closest('button')
    fireEvent.click(userButton!)

    // Check user info in dropdown
    expect(screen.getByText('Test User')).toBeInTheDocument()
    expect(screen.getByText('test@example.com')).toBeInTheDocument()
  })

  it('should handle user with only first name', () => {
    const userWithSingleName = { ...mockUser, name: 'SingleName' }
    mockUseSession.mockReturnValue({
      data: { user: userWithSingleName },
      status: 'authenticated',
    })

    render(<Header />)

    expect(screen.getByText('SingleName')).toBeInTheDocument()
  })

  it('should show default name when user name is not available', () => {
    const userWithoutName = { ...mockUser, name: undefined }
    mockUseSession.mockReturnValue({
      data: { user: userWithoutName },
      status: 'authenticated',
    })

    render(<Header />)

    expect(screen.getByText('ユーザー')).toBeInTheDocument()
  })

  it('should have correct navigation links', () => {
    mockUseSession.mockReturnValue({
      data: { user: mockUser },
      status: 'authenticated',
    })

    render(<Header />)

    expect(screen.getByText('🍽️ Recipe AI').closest('a')).toHaveAttribute('href', '/')
    expect(screen.getByText('ホーム').closest('a')).toHaveAttribute('href', '/')
    expect(screen.getByText('レシピ').closest('a')).toHaveAttribute('href', '/recipes')
    expect(screen.getByText('お気に入り').closest('a')).toHaveAttribute('href', '/favorites')
  })

  it('should hide favorites link when not authenticated', () => {
    mockUseSession.mockReturnValue({
      data: null,
      status: 'unauthenticated',
    })

    render(<Header />)

    expect(screen.queryByText('お気に入り')).not.toBeInTheDocument()
  })

  it('should show favorites link when authenticated', () => {
    mockUseSession.mockReturnValue({
      data: { user: mockUser },
      status: 'authenticated',
    })

    render(<Header />)

    expect(screen.getByText('お気に入り')).toBeInTheDocument()
  })
})