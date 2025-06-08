import { renderHook, act, waitFor } from '@testing-library/react'
import { useFavorites } from './use-favorites'

// Mock next-auth/react
const mockSession = {
  user: {
    id: 'user-1',
    email: 'test@example.com',
    name: 'Test User',
  },
}

const mockUseSession = jest.fn()
jest.mock('next-auth/react', () => ({
  useSession: () => mockUseSession(),
}))

// Mock fetch
const mockFetch = jest.fn()
global.fetch = mockFetch

// Mock recipe data
const mockRecipe = {
  id: 'recipe-1',
  title: 'Test Recipe',
  description: 'Test Description',
  imageUrl: 'test-image.jpg',
  cookingTime: '30分',
  difficulty: 'easy' as const,
  servings: 2,
  calories: 300,
  ingredients: [],
  steps: [],
}

const mockFavoritesResponse = {
  favorites: [mockRecipe],
}

describe('useFavorites hook', () => {
  beforeEach(() => {
    jest.clearAllMocks()
    mockUseSession.mockReturnValue({
      data: mockSession,
      status: 'authenticated',
    })
  })

  it('should initialize with empty state', () => {
    const { result } = renderHook(() => useFavorites())

    expect(result.current.favorites).toEqual([])
    expect(result.current.favoriteIds).toEqual([])
    expect(result.current.isLoading).toBe(false)
    expect(result.current.error).toBeNull()
  })

  it('should fetch favorites on mount when authenticated', async () => {
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: () => Promise.resolve(mockFavoritesResponse),
    })

    const { result } = renderHook(() => useFavorites())

    await waitFor(() => {
      expect(mockFetch).toHaveBeenCalledWith('/api/favorites')
    })

    await waitFor(() => {
      expect(result.current.favorites).toEqual([mockRecipe])
      expect(result.current.favoriteIds).toEqual(['recipe-1'])
    })
  })

  it('should not fetch favorites when not authenticated', () => {
    mockUseSession.mockReturnValue({
      data: null,
      status: 'unauthenticated',
    })

    renderHook(() => useFavorites())

    expect(mockFetch).not.toHaveBeenCalled()
  })

  it('should handle fetch error', async () => {
    mockFetch.mockResolvedValueOnce({
      ok: false,
      status: 500,
    })

    const { result } = renderHook(() => useFavorites())

    await waitFor(() => {
      expect(result.current.error).toBeTruthy()
    })
  })

  it('should add favorite successfully', async () => {
    // Mock initial fetch
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: () => Promise.resolve({ favorites: [] }),
    })

    // Mock add favorite
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: () => Promise.resolve({ message: 'Added to favorites' }),
    })

    const { result } = renderHook(() => useFavorites())

    await act(async () => {
      await result.current.addFavorite(mockRecipe)
    })

    expect(mockFetch).toHaveBeenCalledWith('/api/favorites', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        recipeId: 'recipe-1',
        recipe: {
          title: 'Test Recipe',
          description: 'Test Description',
          imageUrl: 'test-image.jpg',
          cookingTime: '30分',
          difficulty: 'easy',
          servings: 2,
          calories: 300,
        },
      }),
    })

    expect(result.current.favorites).toContain(mockRecipe)
    expect(result.current.favoriteIds).toContain('recipe-1')
  })

  it('should remove favorite successfully', async () => {
    // Mock initial fetch with existing favorite
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: () => Promise.resolve(mockFavoritesResponse),
    })

    // Mock remove favorite
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: () => Promise.resolve({ message: 'Removed from favorites' }),
    })

    const { result } = renderHook(() => useFavorites())

    // Wait for initial fetch
    await waitFor(() => {
      expect(result.current.favorites).toEqual([mockRecipe])
    })

    await act(async () => {
      await result.current.removeFavorite('recipe-1')
    })

    expect(mockFetch).toHaveBeenCalledWith('/api/favorites?recipeId=recipe-1', {
      method: 'DELETE',
    })

    expect(result.current.favorites).not.toContain(mockRecipe)
    expect(result.current.favoriteIds).not.toContain('recipe-1')
  })

  it('should toggle favorite correctly', async () => {
    // Mock initial fetch
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: () => Promise.resolve({ favorites: [] }),
    })

    // Mock add favorite
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: () => Promise.resolve({ message: 'Added to favorites' }),
    })

    const { result } = renderHook(() => useFavorites())

    // Wait for initial fetch
    await waitFor(() => {
      expect(result.current.favorites).toEqual([])
    })

    // Toggle (should add)
    await act(async () => {
      await result.current.toggleFavorite(mockRecipe)
    })

    expect(result.current.isFavorite('recipe-1')).toBe(true)
  })

  it('should check if recipe is favorite', async () => {
    // Mock initial fetch with existing favorite
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: () => Promise.resolve(mockFavoritesResponse),
    })

    const { result } = renderHook(() => useFavorites())

    await waitFor(() => {
      expect(result.current.isFavorite('recipe-1')).toBe(true)
      expect(result.current.isFavorite('recipe-2')).toBe(false)
    })
  })

  it('should handle add favorite error', async () => {
    // Mock initial fetch
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: () => Promise.resolve({ favorites: [] }),
    })

    // Mock add favorite error
    mockFetch.mockResolvedValueOnce({
      ok: false,
      json: () => Promise.resolve({ error: 'Failed to add favorite' }),
    })

    const { result } = renderHook(() => useFavorites())

    await waitFor(() => {
      expect(result.current.favorites).toEqual([])
    })

    await expect(
      act(async () => {
        await result.current.addFavorite(mockRecipe)
      })
    ).rejects.toThrow()
  })

  it('should handle remove favorite error', async () => {
    // Mock initial fetch
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: () => Promise.resolve(mockFavoritesResponse),
    })

    // Mock remove favorite error
    mockFetch.mockResolvedValueOnce({
      ok: false,
      json: () => Promise.resolve({ error: 'Failed to remove favorite' }),
    })

    const { result } = renderHook(() => useFavorites())

    await waitFor(() => {
      expect(result.current.favorites).toEqual([mockRecipe])
    })

    await expect(
      act(async () => {
        await result.current.removeFavorite('recipe-1')
      })
    ).rejects.toThrow()
  })

  it('should throw error when not authenticated for add favorite', async () => {
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

  it('should throw error when not authenticated for remove favorite', async () => {
    mockUseSession.mockReturnValue({
      data: null,
      status: 'unauthenticated',
    })

    const { result } = renderHook(() => useFavorites())

    await expect(
      act(async () => {
        await result.current.removeFavorite('recipe-1')
      })
    ).rejects.toThrow('ログインが必要です')
  })
})