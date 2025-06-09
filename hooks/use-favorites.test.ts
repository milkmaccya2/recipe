import { renderHook, act, waitFor } from '@testing-library/react'
import { useFavorites } from './use-favorites'

// モックの設定
const mockSession = {
  user: { id: 'user-1', email: 'test@example.com', name: 'Test User' }
}

const mockUseSession = jest.fn()
jest.mock('next-auth/react', () => ({
  useSession: () => mockUseSession(),
}))

// 簡単なレシピモック
const mockRecipe = {
  id: 'recipe-1',
  title: 'Test Recipe',
  description: 'Test Description',
  cookingTime: '30分',
  difficulty: 'easy' as const,
  servings: 2,
  calories: 300,
  ingredients: [],
  steps: [],
}

// fetchのモック設定
const mockFetch = jest.fn()
global.fetch = mockFetch

describe('useFavorites hook', () => {
  beforeEach(() => {
    jest.clearAllMocks()
    
    // デフォルトで認証済み状態
    mockUseSession.mockReturnValue({
      data: mockSession,
      status: 'authenticated',
    })
    
    // デフォルトのfetchレスポンス（空のお気に入りリスト）
    mockFetch.mockResolvedValue({
      ok: true,
      json: () => Promise.resolve({ favorites: [] }),
    })
  })

  it('初期状態は空のお気に入りリスト', async () => {
    const { result } = renderHook(() => useFavorites())

    await waitFor(() => {
      expect(result.current.favorites).toEqual([])
      expect(result.current.favoriteIds).toEqual([])
      expect(result.current.isLoading).toBe(false)
      expect(result.current.error).toBeNull()
    })
  })

  it('認証済みの場合、お気に入りを取得する', async () => {
    // モックレスポンスにお気に入りを設定
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: () => Promise.resolve({ favorites: [mockRecipe] }),
    })

    const { result } = renderHook(() => useFavorites())

    await waitFor(() => {
      expect(result.current.favorites).toHaveLength(1)
      expect(result.current.favoriteIds).toContain('recipe-1')
    })
  })

  it('未認証の場合、お気に入りを取得しない', () => {
    mockUseSession.mockReturnValue({
      data: null,
      status: 'unauthenticated',
    })

    renderHook(() => useFavorites())

    expect(mockFetch).not.toHaveBeenCalled()
  })

  it('レシピがお気に入りかどうか判定できる', async () => {
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: () => Promise.resolve({ favorites: [mockRecipe] }),
    })

    const { result } = renderHook(() => useFavorites())

    await waitFor(() => {
      expect(result.current.isFavorite('recipe-1')).toBe(true)
      expect(result.current.isFavorite('recipe-2')).toBe(false)
    })
  })

  it('お気に入りの追加ができる', async () => {
    const { result } = renderHook(() => useFavorites())

    // 追加成功のモック
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: () => Promise.resolve({ message: 'Added to favorites' }),
    })

    await act(async () => {
      await result.current.addFavorite(mockRecipe)
    })

    expect(mockFetch).toHaveBeenCalledWith('/api/favorites', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: expect.stringContaining('recipe-1'),
    })
  })

  it('お気に入りの削除ができる', async () => {
    const { result } = renderHook(() => useFavorites())

    // 削除成功のモック
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: () => Promise.resolve({ message: 'Removed from favorites' }),
    })

    await act(async () => {
      await result.current.removeFavorite('recipe-1')
    })

    expect(mockFetch).toHaveBeenCalledWith('/api/favorites?recipeId=recipe-1', {
      method: 'DELETE',
    })
  })

  it('未認証時は追加でエラーになる', async () => {
    mockUseSession.mockReturnValue({
      data: null,
      status: 'unauthenticated',
    })

    const { result } = renderHook(() => useFavorites())

    await expect(
      act(async () => {
        await result.current.addFavorite(mockRecipe)
      })
    ).rejects.toThrow('ログインが必要です')
  })

  it('APIエラー時はエラー状態になる', async () => {
    mockFetch.mockResolvedValueOnce({
      ok: false,
      status: 500,
    })

    const { result } = renderHook(() => useFavorites())

    await waitFor(() => {
      expect(result.current.error).toBeTruthy()
    })
  })
})