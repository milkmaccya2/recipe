import { NextRequest } from 'next/server'
import { POST } from './route'

const mockGenerateRecipes = jest.fn()
const mockGetServerSession = jest.fn()
const mockSupabaseInsert = jest.fn()

jest.mock('@/lib/openai', () => ({ generateRecipes: (...args: any[]) => mockGenerateRecipes(...args) }))
jest.mock('next-auth', () => ({ getServerSession: () => mockGetServerSession() }))
jest.mock('@/app/api/auth/[...nextauth]/route', () => ({ authOptions: {} }))
jest.mock('@/lib/supabase/database', () => ({ saveRecipeToHistory: (...args: any[]) => mockSupabaseInsert(...args) }))
jest.mock('@/lib/validations', () => ({ recipeRequestSchema: { parse: jest.fn() } }))

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
    }
  ]

  beforeEach(() => {
    jest.clearAllMocks()
    mockGenerateRecipes.mockResolvedValue(mockRecipes)
    mockGetServerSession.mockResolvedValue({ user: { id: 'user-123' } })
    mockSupabaseInsert.mockResolvedValue({ success: true })
    recipeRequestSchema.parse.mockReturnValue({
      ingredients: ['鶏肉', '玉ねぎ'],
      preferences: { maxCookingTime: 60, difficulty: 'easy' }
    })
  })

  it('レシピを正常に生成する', async () => {
    const request = new NextRequest('http://localhost:3000/api/recipes', {
      method: 'POST',
      body: JSON.stringify({
        ingredients: ['鶏肉', '玉ねぎ'],
        preferences: { maxCookingTime: 60, difficulty: 'easy' }
      }),
    })

    const response = await POST(request)
    const data = await response.json()

    expect(response.status).toBe(200)
    expect(data.recipes).toHaveLength(1)
    expect(data.recipes[0].title).toBe('鶏の唐揚げ')
    expect(mockGenerateRecipes).toHaveBeenCalledWith(['鶏肉', '玉ねぎ'], { maxCookingTime: 60, difficulty: 'easy' })
  })

  it('未認証ユーザーでもレシピ生成を実行する', async () => {
    mockGetServerSession.mockResolvedValue(null)
    
    const request = new NextRequest('http://localhost:3000/api/recipes', {
      method: 'POST',
      body: JSON.stringify({ ingredients: ['鶏肉'] }),
    })

    const response = await POST(request)
    expect(response.status).toBe(200)
    expect(mockSupabaseInsert).not.toHaveBeenCalled()
  })

  it('バリデーションエラーを適切に処理する', async () => {
    recipeRequestSchema.parse.mockImplementation(() => {
      throw new Error('Invalid request data')
    })

    const request = new NextRequest('http://localhost:3000/api/recipes', {
      method: 'POST',
      body: JSON.stringify({ invalid: 'data' }),
    })

    const response = await POST(request)
    expect(response.status).toBe(400)
  })

  it('OpenAIエラーを処理する', async () => {
    mockGenerateRecipes.mockRejectedValue(new Error('OpenAI API failed'))

    const request = new NextRequest('http://localhost:3000/api/recipes', {
      method: 'POST',
      body: JSON.stringify({ ingredients: ['鶏肉'] }),
    })

    const response = await POST(request)
    expect(response.status).toBe(500)
  })

  it('データベース保存エラーを処理する', async () => {
    mockSupabaseInsert.mockRejectedValue(new Error('Database error'))

    const request = new NextRequest('http://localhost:3000/api/recipes', {
      method: 'POST',
      body: JSON.stringify({ ingredients: ['鶏肉'] }),
    })

    const response = await POST(request)
    expect(response.status).toBe(200) // レシピ生成は成功、履歴保存のみ失敗
  })
})