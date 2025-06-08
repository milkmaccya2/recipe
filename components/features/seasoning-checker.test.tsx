import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import { SeasoningChecker } from './seasoning-checker'
import { Recipe } from '@/lib/openai'

// Mock Jotai atoms
const mockSeasonings = [
  { id: '1', name: '塩', isAvailable: true },
  { id: '2', name: '醤油', isAvailable: false },
  { id: '3', name: '砂糖', isAvailable: true },
  { id: '4', name: 'バター', isAvailable: false },
]

const mockAvailableSeasonings = [
  { name: '塩' },
  { name: '砂糖' },
]

const mockUpdateSeasoning = jest.fn()

jest.mock('jotai', () => ({
  useAtom: jest.fn((atom) => {
    if (atom.toString().includes('seasonings') && !atom.toString().includes('available')) {
      return [mockSeasonings, jest.fn()]
    }
    if (atom.toString().includes('availableSeasonings')) {
      return [mockAvailableSeasonings, jest.fn()]
    }
    if (atom.toString().includes('updateSeasoning')) {
      return [null, mockUpdateSeasoning]
    }
    return [null, jest.fn()]
  }),
}))

// Mock fetch
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

describe('SeasoningChecker component', () => {
  const mockOnAlternativesRequested = jest.fn()

  beforeEach(() => {
    jest.clearAllMocks()
    mockFetch.mockResolvedValue({
      ok: true,
      json: () => Promise.resolve({
        alternatives: [
          {
            id: 'alt-1',
            title: '代替レシピ',
            description: '代替レシピの説明',
            cookingTime: '25分',
            servings: 2,
          }
        ]
      })
    })
  })

  it('should render seasoning checker with title', () => {
    render(
      <SeasoningChecker 
        recipe={mockRecipe}
        onAlternativesRequested={mockOnAlternativesRequested}
      />
    )

    expect(screen.getByText('調味料チェック')).toBeInTheDocument()
    expect(screen.getByText('このレシピに必要な調味料')).toBeInTheDocument()
    expect(screen.getByText('お持ちの調味料をチェック')).toBeInTheDocument()
  })

  it('should extract and display required seasonings from recipe', () => {
    render(
      <SeasoningChecker 
        recipe={mockRecipe}
        onAlternativesRequested={mockOnAlternativesRequested}
      />
    )

    // Recipe contains: 塩, 醤油, バター
    expect(screen.getByText('塩')).toBeInTheDocument()
    expect(screen.getByText('醤油')).toBeInTheDocument()
    expect(screen.getByText('バター')).toBeInTheDocument()
  })

  it('should show available and missing seasonings correctly', () => {
    render(
      <SeasoningChecker 
        recipe={mockRecipe}
        onAlternativesRequested={mockOnAlternativesRequested}
      />
    )

    // Check icons for available/missing seasonings
    const checkIcons = document.querySelectorAll('.lucide-check')
    const xIcons = document.querySelectorAll('.lucide-x')

    expect(checkIcons.length).toBeGreaterThan(0) // 塩 is available
    expect(xIcons.length).toBeGreaterThan(0) // 醤油, バター are missing
  })

  it('should show missing seasonings warning', () => {
    render(
      <SeasoningChecker 
        recipe={mockRecipe}
        onAlternativesRequested={mockOnAlternativesRequested}
      />
    )

    expect(screen.getByText('不足している調味料があります')).toBeInTheDocument()
    expect(screen.getByText('以下の調味料が不足しています：醤油、バター')).toBeInTheDocument()
    expect(screen.getByText('代替レシピを提案してもらう')).toBeInTheDocument()
  })

  it('should render all seasonings with checkboxes', () => {
    render(
      <SeasoningChecker 
        recipe={mockRecipe}
        onAlternativesRequested={mockOnAlternativesRequested}
      />
    )

    mockSeasonings.forEach(seasoning => {
      expect(screen.getByLabelText(seasoning.name)).toBeInTheDocument()
    })
  })

  it('should handle seasoning toggle', () => {
    render(
      <SeasoningChecker 
        recipe={mockRecipe}
        onAlternativesRequested={mockOnAlternativesRequested}
      />
    )

    const saltCheckbox = screen.getByLabelText('塩')
    fireEvent.click(saltCheckbox)

    expect(mockUpdateSeasoning).toHaveBeenCalledWith({
      id: '1',
      isAvailable: false // toggle from true to false
    })
  })

  it('should show correct checkbox states', () => {
    render(
      <SeasoningChecker 
        recipe={mockRecipe}
        onAlternativesRequested={mockOnAlternativesRequested}
      />
    )

    const saltCheckbox = screen.getByLabelText('塩') as HTMLInputElement
    const soyCheckbox = screen.getByLabelText('醤油') as HTMLInputElement

    expect(saltCheckbox.checked).toBe(true)
    expect(soyCheckbox.checked).toBe(false)
  })

  it('should request alternatives when button is clicked', async () => {
    render(
      <SeasoningChecker 
        recipe={mockRecipe}
        onAlternativesRequested={mockOnAlternativesRequested}
      />
    )

    const alternativeButton = screen.getByText('代替レシピを提案してもらう')
    fireEvent.click(alternativeButton)

    expect(mockFetch).toHaveBeenCalledWith('/api/recipes/alternatives', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        recipe: mockRecipe,
        missingSeasonings: ['醤油', 'バター']
      }),
    })

    await waitFor(() => {
      expect(mockOnAlternativesRequested).toHaveBeenCalledWith([
        {
          id: 'alt-1',
          title: '代替レシピ',
          description: '代替レシピの説明',
          cookingTime: '25分',
          servings: 2,
        }
      ])
    })
  })

  it('should show loading state when requesting alternatives', async () => {
    render(
      <SeasoningChecker 
        recipe={mockRecipe}
        onAlternativesRequested={mockOnAlternativesRequested}
      />
    )

    const alternativeButton = screen.getByText('代替レシピを提案してもらう')
    fireEvent.click(alternativeButton)

    expect(screen.getByText('代替レシピを検索中...')).toBeInTheDocument()
    
    const loadingIcon = document.querySelector('.lucide-loader-2')
    expect(loadingIcon).toBeInTheDocument()
    expect(loadingIcon).toHaveClass('animate-spin')
  })

  it('should handle API error when requesting alternatives', async () => {
    mockFetch.mockResolvedValueOnce({
      ok: false,
      json: () => Promise.resolve({
        error: 'API エラー'
      })
    })

    render(
      <SeasoningChecker 
        recipe={mockRecipe}
        onAlternativesRequested={mockOnAlternativesRequested}
      />
    )

    const alternativeButton = screen.getByText('代替レシピを提案してもらう')
    fireEvent.click(alternativeButton)

    await waitFor(() => {
      expect(screen.getByText('API エラー')).toBeInTheDocument()
    })
  })

  it('should handle network error when requesting alternatives', async () => {
    mockFetch.mockRejectedValueOnce(new Error('Network error'))

    render(
      <SeasoningChecker 
        recipe={mockRecipe}
        onAlternativesRequested={mockOnAlternativesRequested}
      />
    )

    const alternativeButton = screen.getByText('代替レシピを提案してもらう')
    fireEvent.click(alternativeButton)

    await waitFor(() => {
      expect(screen.getByText('Network error')).toBeInTheDocument()
    })
  })

  it('should show success message when all seasonings are available', () => {
    // Mock scenario where all required seasonings are available
    const allAvailableSeasonings = [
      { name: '塩' },
      { name: '醤油' },
      { name: 'バター' },
    ]

    jest.mocked(require('jotai').useAtom).mockImplementation((atom) => {
      if (atom.toString().includes('seasonings') && !atom.toString().includes('available')) {
        return [mockSeasonings, jest.fn()]
      }
      if (atom.toString().includes('availableSeasonings')) {
        return [allAvailableSeasonings, jest.fn()]
      }
      if (atom.toString().includes('updateSeasoning')) {
        return [null, mockUpdateSeasoning]
      }
      return [null, jest.fn()]
    })

    render(
      <SeasoningChecker 
        recipe={mockRecipe}
        onAlternativesRequested={mockOnAlternativesRequested}
      />
    )

    expect(screen.getByText('必要な調味料がすべて揃っています！')).toBeInTheDocument()
    expect(screen.queryByText('不足している調味料があります')).not.toBeInTheDocument()
  })

  it('should not show missing seasonings warning when no seasonings are missing', () => {
    // Mock scenario where all required seasonings are available
    const allAvailableSeasonings = [
      { name: '塩' },
      { name: '醤油' },
      { name: 'バター' },
    ]

    jest.mocked(require('jotai').useAtom).mockImplementation((atom) => {
      if (atom.toString().includes('seasonings') && !atom.toString().includes('available')) {
        return [mockSeasonings, jest.fn()]
      }
      if (atom.toString().includes('availableSeasonings')) {
        return [allAvailableSeasonings, jest.fn()]
      }
      if (atom.toString().includes('updateSeasoning')) {
        return [null, mockUpdateSeasoning]
      }
      return [null, jest.fn()]
    })

    render(
      <SeasoningChecker 
        recipe={mockRecipe}
        onAlternativesRequested={mockOnAlternativesRequested}
      />
    )

    expect(screen.queryByText('代替レシピを提案してもらう')).not.toBeInTheDocument()
  })

  it('should extract seasonings correctly from recipe text', () => {
    const recipeWithMultipleSeasonings: Recipe = {
      id: 'recipe-2',
      title: '味噌炒め',
      description: '砂糖と醤油で甘辛く',
      cookingTime: '20分',
      difficulty: 'easy',
      servings: 2,
      ingredients: [{ name: '野菜', amount: '200g', unit: 'g' }],
      steps: [
        { step: 1, instruction: 'ごま油で炒める' },
        { step: 2, instruction: '味噌と砂糖で味付け' },
      ],
    }

    render(
      <SeasoningChecker 
        recipe={recipeWithMultipleSeasonings}
        onAlternativesRequested={mockOnAlternativesRequested}
      />
    )

    // Should extract: 味噌, 砂糖, 醤油, ごま油
    expect(screen.getByText('味噌')).toBeInTheDocument()
    expect(screen.getByText('砂糖')).toBeInTheDocument()
    expect(screen.getByText('醤油')).toBeInTheDocument()
    expect(screen.getByText('ごま油')).toBeInTheDocument()
  })

  it('should handle recipe with no seasonings', () => {
    const recipeWithoutSeasonings: Recipe = {
      id: 'recipe-3',
      title: 'シンプルサラダ',
      description: '野菜だけの簡単サラダ',
      cookingTime: '5分',
      difficulty: 'easy',
      servings: 1,
      ingredients: [{ name: 'レタス', amount: '100g', unit: 'g' }],
      steps: [{ step: 1, instruction: 'レタスを洗って切る' }],
    }

    render(
      <SeasoningChecker 
        recipe={recipeWithoutSeasonings}
        onAlternativesRequested={mockOnAlternativesRequested}
      />
    )

    expect(screen.queryByText('不足している調味料があります')).not.toBeInTheDocument()
    expect(screen.queryByText('必要な調味料がすべて揃っています！')).not.toBeInTheDocument()
  })

  it('should disable alternatives button during loading', () => {
    render(
      <SeasoningChecker 
        recipe={mockRecipe}
        onAlternativesRequested={mockOnAlternativesRequested}
      />
    )

    const alternativeButton = screen.getByText('代替レシピを提案してもらう')
    fireEvent.click(alternativeButton)

    const loadingButton = screen.getByText('代替レシピを検索中...')
    expect(loadingButton.closest('button')).toBeDisabled()
  })

  it('should show correct styling for available and unavailable seasonings', () => {
    render(
      <SeasoningChecker 
        recipe={mockRecipe}
        onAlternativesRequested={mockOnAlternativesRequested}
      />
    )

    const saltLabel = screen.getByLabelText('塩').closest('label')
    const soyLabel = screen.getByLabelText('醤油').closest('label')

    expect(saltLabel).toHaveClass('bg-green-50', 'border-green-200')
    expect(soyLabel).toHaveClass('bg-gray-50', 'border-gray-200')
  })

  it('should call onAlternativesRequested with empty array when no alternatives returned', async () => {
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: () => Promise.resolve({
        alternatives: null
      })
    })

    render(
      <SeasoningChecker 
        recipe={mockRecipe}
        onAlternativesRequested={mockOnAlternativesRequested}
      />
    )

    const alternativeButton = screen.getByText('代替レシピを提案してもらう')
    fireEvent.click(alternativeButton)

    await waitFor(() => {
      expect(mockOnAlternativesRequested).toHaveBeenCalledWith([])
    })
  })
})