import { NextRequest } from 'next/server'
import { POST } from './route'

// Mock OpenAI
const mockGenerateRecipes = jest.fn()
jest.mock('@/lib/openai', () => ({
  generateRecipes: (...args: any[]) => mockGenerateRecipes(...args),
}))

// Mock next-auth
const mockGetServerSession = jest.fn()
jest.mock('next-auth', () => ({
  getServerSession: () => mockGetServerSession(),
}))

// Mock authOptions
jest.mock('@/app/api/auth/[...nextauth]/route', () => ({
  authOptions: {},
}))

// Mock Supabase
const mockSupabaseInsert = jest.fn()
jest.mock('@/lib/supabase/database', () => ({
  saveRecipeToHistory: (...args: any[]) => mockSupabaseInsert(...args),
}))

// Mock validation
jest.mock('@/lib/validations', () => ({
  recipeRequestSchema: {
    parse: jest.fn(),
  },
}))

const { recipeRequestSchema } = require('@/lib/validations')

describe('/api/recipes', () => {
  const mockRecipes = [
    {
      id: 'recipe-1',
      title: '鶏の唐揚げ',
      description: 'ジューシーな鶏の唐揚げ',
      cookingTime: '30分',
      difficulty: 'easy',
      servings: 2,
      calories: 400,
      ingredients: [{ name: '鶏肉', amount: '300g', unit: 'g' }],
      steps: [{ order: 1, description: '鶏肉を切る' }],
    },
    {
      id: 'recipe-2',
      title: '野菜炒め',
      description: 'シンプルな野菜炒め',
      cookingTime: '15分',
      difficulty: 'easy',
      servings: 2,
      calories: 200,
      ingredients: [{ name: '野菜', amount: '200g', unit: 'g' }],
      steps: [{ order: 1, description: '野菜を炒める' }],
    },
  ]

  beforeEach(() => {
    jest.clearAllMocks()
    
    mockGenerateRecipes.mockResolvedValue(mockRecipes)
    
    recipeRequestSchema.parse.mockReturnValue({
      ingredients: ['鶏肉', '玉ねぎ'],
      preferences: {
        maxCookingTime: 30,
        difficulty: 'easy',
      },
    })
  })

  it('should generate recipes successfully', async () => {
    const request = new NextRequest('http://localhost:3000/api/recipes', {
      method: 'POST',
      body: JSON.stringify({
        ingredients: ['鶏肉', '玉ねぎ'],
        preferences: {
          maxCookingTime: 30,
          difficulty: 'easy',
        },
      }),
    })

    const response = await POST(request)
    const data = await response.json()

    expect(response.status).toBe(200)
    expect(data.data.recipes).toHaveLength(2)
    expect(data.data.recipes[0].title).toBe('鶏の唐揚げ')
    expect(mockGenerateRecipes).toHaveBeenCalledWith(['鶏肉', '玉ねぎ'], {
      maxCookingTime: 30,
      difficulty: 'easy',
    })
  })

  it('should save recipes to history when user is authenticated', async () => {
    mockGetServerSession.mockResolvedValue({
      user: { id: 'user-123' },
    })

    const request = new NextRequest('http://localhost:3000/api/recipes', {
      method: 'POST',
      body: JSON.stringify({
        ingredients: ['鶏肉', '玉ねぎ'],
      }),
    })

    await POST(request)

    expect(mockSupabaseInsert).toHaveBeenCalledWith('user-123', mockRecipes)
  })

  it('should not save to history when user is not authenticated', async () => {
    mockGetServerSession.mockResolvedValue(null)

    const request = new NextRequest('http://localhost:3000/api/recipes', {
      method: 'POST',
      body: JSON.stringify({
        ingredients: ['鶏肉', '玉ねぎ'],
      }),
    })

    await POST(request)

    expect(mockSupabaseInsert).not.toHaveBeenCalled()
  })

  it('should handle validation errors', async () => {
    recipeRequestSchema.parse.mockImplementation(() => {
      throw new Error('Ingredients are required')
    })

    const request = new NextRequest('http://localhost:3000/api/recipes', {
      method: 'POST',
      body: JSON.stringify({
        ingredients: [],
      }),
    })

    const response = await POST(request)
    const data = await response.json()

    expect(response.status).toBe(400)
    expect(data.error).toContain('Ingredients are required')
  })

  it('should handle OpenAI generation errors', async () => {
    mockGenerateRecipes.mockRejectedValue(new Error('OpenAI API error'))

    const request = new NextRequest('http://localhost:3000/api/recipes', {
      method: 'POST',
      body: JSON.stringify({
        ingredients: ['鶏肉', '玉ねぎ'],
      }),
    })

    const response = await POST(request)
    const data = await response.json()

    expect(response.status).toBe(500)
    expect(data.error).toContain('OpenAI API error')
  })

  it('should handle missing request body', async () => {
    const request = new NextRequest('http://localhost:3000/api/recipes', {
      method: 'POST',
    })

    const response = await POST(request)
    const data = await response.json()

    expect(response.status).toBe(400)
    expect(data.error).toBeDefined()
  })

  it('should work in mock mode when USE_AI_MOCK is true', async () => {
    process.env.USE_AI_MOCK = 'true'

    const request = new NextRequest('http://localhost:3000/api/recipes', {
      method: 'POST',
      body: JSON.stringify({
        ingredients: ['鶏肉', '玉ねぎ'],
      }),
    })

    const response = await POST(request)
    const data = await response.json()

    expect(response.status).toBe(200)
    expect(data.data.recipes).toBeDefined()
    expect(Array.isArray(data.data.recipes)).toBe(true)
    
    delete process.env.USE_AI_MOCK
  })

  it('should handle empty ingredients array', async () => {
    recipeRequestSchema.parse.mockReturnValue({
      ingredients: [],
    })

    const request = new NextRequest('http://localhost:3000/api/recipes', {
      method: 'POST',
      body: JSON.stringify({
        ingredients: [],
      }),
    })

    const response = await POST(request)
    const data = await response.json()

    expect(response.status).toBe(200)
    // Should still generate recipes even with empty ingredients
    expect(mockGenerateRecipes).toHaveBeenCalledWith([], undefined)
  })

  it('should handle database save errors gracefully', async () => {
    mockGetServerSession.mockResolvedValue({
      user: { id: 'user-123' },
    })
    
    mockSupabaseInsert.mockRejectedValue(new Error('Database error'))

    const request = new NextRequest('http://localhost:3000/api/recipes', {
      method: 'POST',
      body: JSON.stringify({
        ingredients: ['鶏肉', '玉ねぎ'],
      }),
    })

    const response = await POST(request)
    const data = await response.json()

    // Should still return recipes even if database save fails
    expect(response.status).toBe(200)
    expect(data.data.recipes).toHaveLength(2)
  })

  it('should pass preferences correctly to OpenAI', async () => {
    const preferences = {
      maxCookingTime: 45,
      difficulty: 'medium',
      excludedSeasonings: ['味噌'],
      mealType: 'dinner',
      cuisine: 'japanese',
    }

    recipeRequestSchema.parse.mockReturnValue({
      ingredients: ['鶏肉'],
      preferences,
    })

    const request = new NextRequest('http://localhost:3000/api/recipes', {
      method: 'POST',
      body: JSON.stringify({
        ingredients: ['鶏肉'],
        preferences,
      }),
    })

    await POST(request)

    expect(mockGenerateRecipes).toHaveBeenCalledWith(['鶏肉'], preferences)
  })
})