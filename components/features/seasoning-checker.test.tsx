import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import { SeasoningChecker } from './seasoning-checker'
import { Recipe } from '@/lib/openai'

const mockSeasonings = [
  { id: '1', name: '塩', isAvailable: true },
  { id: '2', name: '醤油', isAvailable: false },
  { id: '3', name: 'バター', isAvailable: false },
]

const mockUpdateSeasoning = jest.fn()

jest.mock('jotai', () => ({
  useAtom: jest.fn((atom) => {
    if (atom.toString().includes('seasonings')) {
      return [mockSeasonings, jest.fn()]
    }
    if (atom.toString().includes('updateSeasoning')) {
      return [null, mockUpdateSeasoning]
    }
    return [null, jest.fn()]
  }),
}))

const mockFetch = jest.fn()
global.fetch = mockFetch

const mockRecipe: Recipe = {
  id: 'recipe-1',
  title: '塩と醤油のチキン',
  description: 'バターで炒めて、塩と醤油で味付けした美味しいチキン',
  cookingTime: '30分',
  difficulty: 'easy',
  servings: 2,
  calories: 300,
  ingredients: [{ name: '鶏肉', amount: '200g', unit: 'g' }],
  steps: [
    { step: 1, instruction: 'フライパンにバターを入れて溶かす' },
    { step: 2, instruction: '鶏肉を焼いて、塩と醤油で味付けする' },
  ],
}

const mockAlternativeRecipes = [
  {
    id: 'alt-1',
    title: '塩チキン',
    description: '塩だけで味付けしたシンプルなチキン',
    cookingTime: '25分',
    difficulty: 'easy',
    servings: 2,
    ingredients: [],
    steps: [],
  }
]

describe('SeasoningCheckerコンポーネント', () => {
  const mockProps = {
    recipe: mockRecipe,
    onAlternativesRequested: jest.fn(),
  }

  beforeEach(() => {
    jest.clearAllMocks()
    mockFetch.mockResolvedValue({
      ok: true,
      json: () => Promise.resolve({ recipes: mockAlternativeRecipes }),
    })
  })

  it('調味料チェッカーを正常にレンダリングする', () => {
    render(<SeasoningChecker {...mockProps} />)
    
    expect(screen.getByText('必要な調味料')).toBeInTheDocument()
    expect(screen.getByText('塩')).toBeInTheDocument()
    expect(screen.getByText('醤油')).toBeInTheDocument()
    expect(screen.getByText('バター')).toBeInTheDocument()
  })

  it('調味料の利用可能性を正しく表示する', () => {
    render(<SeasoningChecker {...mockProps} />)
    
    const saltCheckbox = screen.getByRole('checkbox', { name: /塩/ })
    const soyCheckbox = screen.getByRole('checkbox', { name: /醤油/ })
    
    expect(saltCheckbox).toBeChecked()
    expect(soyCheckbox).not.toBeChecked()
  })

  it('調味料の利用可能性を切り替える', () => {
    render(<SeasoningChecker {...mockProps} />)
    
    const soyCheckbox = screen.getByRole('checkbox', { name: /醤油/ })
    fireEvent.click(soyCheckbox)
    
    expect(mockUpdateSeasoning).toHaveBeenCalledWith('醤油', true)
  })

  it('代替レシピを要求する', async () => {
    render(<SeasoningChecker {...mockProps} />)
    
    fireEvent.click(screen.getByText('代替レシピを探す'))
    
    await waitFor(() => {
      expect(mockFetch).toHaveBeenCalledWith('/api/recipes', expect.objectContaining({
        method: 'POST',
        body: expect.stringContaining('塩'),
      }))
    })
    
    await waitFor(() => {
      expect(mockProps.onAlternativesRequested).toHaveBeenCalledWith(mockAlternativeRecipes)
    })
  })

  it('利用可能な調味料のみでレシピを検索する', async () => {
    render(<SeasoningChecker {...mockProps} />)
    
    fireEvent.click(screen.getByText('代替レシピを探す'))
    
    await waitFor(() => {
      const callArgs = mockFetch.mock.calls[0][1]
      const requestBody = JSON.parse(callArgs.body)
      expect(requestBody.availableSeasonings).toEqual(['塩'])
    })
  })

  it('代替レシピ取得エラーを処理する', async () => {
    mockFetch.mockRejectedValue(new Error('Network error'))
    
    render(<SeasoningChecker {...mockProps} />)
    
    fireEvent.click(screen.getByText('代替レシピを探す'))
    
    await waitFor(() => {
      expect(screen.getByText('代替レシピの取得に失敗しました')).toBeInTheDocument()
    })
  })
})