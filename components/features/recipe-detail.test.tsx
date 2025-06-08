import { render, screen, fireEvent } from '@testing-library/react'
import { RecipeDetail } from './recipe-detail'
import { Recipe } from '@/lib/openai'

// Mock hooks
const mockAddToHistory = jest.fn()
jest.mock('@/hooks/use-recipe-history', () => ({
  useRecipeHistory: () => ({
    addToHistory: mockAddToHistory,
  }),
}))

// Mock SeasoningChecker component
jest.mock('./seasoning-checker', () => ({
  SeasoningChecker: ({ recipe, onAlternativesRequested }: any) => (
    <div data-testid="seasoning-checker">
      <button 
        onClick={() => onAlternativesRequested([
          {
            id: 'alt-1',
            title: '代替レシピ1',
            description: '代替レシピの説明',
            cookingTime: '25分',
            servings: 2,
            difficulty: 'easy',
            ingredients: [],
            steps: [],
          }
        ])}
      >
        Request Alternatives
      </button>
    </div>
  ),
}))

const mockRecipe: Recipe = {
  id: 'recipe-1',
  title: 'テスト料理',
  description: 'テスト料理の説明',
  imageUrl: 'https://example.com/image.jpg',
  cookingTime: '30分',
  difficulty: 'easy',
  servings: 2,
  calories: 300,
  ingredients: [
    { name: '鶏肉', amount: '200g', unit: 'g', category: '肉類' },
    { name: '玉ねぎ', amount: '1個', unit: '個' },
  ],
  steps: [
    { step: 1, instruction: '鶏肉を一口大に切る', duration: '5分', tips: '皮を残すとジューシーになります' },
    { step: 2, instruction: '玉ねぎをスライスする', duration: '3分' },
    { step: 3, instruction: '炒めて完成', duration: '10分' },
  ],
  tips: ['コツ1: 強火で炒める', 'コツ2: 塩を少し加える'],
  nutritionInfo: {
    protein: 25,
    carbs: 10,
    fat: 15,
    fiber: 3,
  },
}

describe('RecipeDetail component', () => {
  const mockOnBack = jest.fn()
  const mockOnToggleFavorite = jest.fn()

  beforeEach(() => {
    jest.clearAllMocks()
  })

  it('should render recipe information correctly', () => {
    render(
      <RecipeDetail 
        recipe={mockRecipe}
        onBack={mockOnBack}
        onToggleFavorite={mockOnToggleFavorite}
      />
    )

    expect(screen.getByText('テスト料理')).toBeInTheDocument()
    expect(screen.getByText('テスト料理の説明')).toBeInTheDocument()
    expect(screen.getByText('30分')).toBeInTheDocument()
    expect(screen.getByText('2人分')).toBeInTheDocument()
    expect(screen.getByText('300kcal')).toBeInTheDocument()
    expect(screen.getByText('簡単')).toBeInTheDocument()
  })

  it('should add recipe to history on mount', () => {
    render(<RecipeDetail recipe={mockRecipe} />)

    expect(mockAddToHistory).toHaveBeenCalledWith(mockRecipe)
  })

  it('should render ingredients list', () => {
    render(<RecipeDetail recipe={mockRecipe} />)

    expect(screen.getByText('材料')).toBeInTheDocument()
    expect(screen.getByText('鶏肉')).toBeInTheDocument()
    expect(screen.getByText('(肉類)')).toBeInTheDocument()
    expect(screen.getByText('200gg')).toBeInTheDocument()
    expect(screen.getByText('玉ねぎ')).toBeInTheDocument()
    expect(screen.getByText('1個個')).toBeInTheDocument()
  })

  it('should render cooking steps', () => {
    render(<RecipeDetail recipe={mockRecipe} />)

    expect(screen.getByText('作り方')).toBeInTheDocument()
    expect(screen.getByText('鶏肉を一口大に切る')).toBeInTheDocument()
    expect(screen.getByText('⏱️ 目安時間: 5分')).toBeInTheDocument()
    expect(screen.getByText('💡 皮を残すとジューシーになります')).toBeInTheDocument()
    expect(screen.getByText('玉ねぎをスライスする')).toBeInTheDocument()
    expect(screen.getByText('炒めて完成')).toBeInTheDocument()
  })

  it('should toggle step completion when step is clicked', () => {
    render(<RecipeDetail recipe={mockRecipe} />)

    const firstStep = screen.getByText('鶏肉を一口大に切る').closest('div')
    expect(firstStep).not.toHaveClass('bg-green-50')

    fireEvent.click(firstStep!)

    expect(firstStep).toHaveClass('bg-green-50', 'border-green-200')
    
    // Check if step text is struck through
    const stepText = screen.getByText('鶏肉を一口大に切る')
    expect(stepText).toHaveClass('line-through', 'text-gray-500')
  })

  it('should show nutrition information when available', () => {
    render(<RecipeDetail recipe={mockRecipe} />)

    expect(screen.getByText('栄養成分（1人分）')).toBeInTheDocument()
    expect(screen.getByText('25g')).toBeInTheDocument() // protein
    expect(screen.getByText('10g')).toBeInTheDocument() // carbs
    expect(screen.getByText('15g')).toBeInTheDocument() // fat
    expect(screen.getByText('3g')).toBeInTheDocument() // fiber
    expect(screen.getByText('たんぱく質')).toBeInTheDocument()
    expect(screen.getByText('炭水化物')).toBeInTheDocument()
    expect(screen.getByText('脂質')).toBeInTheDocument()
    expect(screen.getByText('食物繊維')).toBeInTheDocument()
  })

  it('should not show nutrition section when not available', () => {
    const recipeWithoutNutrition = { ...mockRecipe, nutritionInfo: undefined }
    render(<RecipeDetail recipe={recipeWithoutNutrition} />)

    expect(screen.queryByText('栄養成分（1人分）')).not.toBeInTheDocument()
  })

  it('should render cooking tips', () => {
    render(<RecipeDetail recipe={mockRecipe} />)

    expect(screen.getByText('調理のコツ')).toBeInTheDocument()
    expect(screen.getByText('コツ1: 強火で炒める')).toBeInTheDocument()
    expect(screen.getByText('コツ2: 塩を少し加える')).toBeInTheDocument()
  })

  it('should not show tips section when no tips available', () => {
    const recipeWithoutTips = { ...mockRecipe, tips: [] }
    render(<RecipeDetail recipe={recipeWithoutTips} />)

    expect(screen.queryByText('調理のコツ')).not.toBeInTheDocument()
  })

  it('should call onBack when back button is clicked', () => {
    render(
      <RecipeDetail 
        recipe={mockRecipe}
        onBack={mockOnBack}
      />
    )

    const backButton = screen.getByRole('button', { name: '' }) // ArrowLeft icon
    fireEvent.click(backButton)

    expect(mockOnBack).toHaveBeenCalled()
  })

  it('should not show back button when onBack is not provided', () => {
    render(<RecipeDetail recipe={mockRecipe} />)

    const backButton = screen.queryByRole('button', { name: '' })
    expect(backButton).not.toBeInTheDocument()
  })

  it('should handle favorite toggle', () => {
    render(
      <RecipeDetail 
        recipe={mockRecipe}
        onToggleFavorite={mockOnToggleFavorite}
        isFavorite={false}
      />
    )

    const favoriteButton = screen.getByRole('button', { name: '' })
    const buttons = screen.getAllByRole('button')
    const heartButton = buttons.find(btn => btn.querySelector('.lucide-heart'))
    
    fireEvent.click(heartButton!)

    expect(mockOnToggleFavorite).toHaveBeenCalledWith('recipe-1')
  })

  it('should show correct favorite button styles', () => {
    const { rerender } = render(
      <RecipeDetail 
        recipe={mockRecipe}
        onToggleFavorite={mockOnToggleFavorite}
        isFavorite={false}
      />
    )

    const buttons = screen.getAllByRole('button')
    const favoriteButton = buttons.find(btn => btn.querySelector('.lucide-heart'))
    expect(favoriteButton).toHaveClass('bg-white/80', 'text-gray-600')

    rerender(
      <RecipeDetail 
        recipe={mockRecipe}
        onToggleFavorite={mockOnToggleFavorite}
        isFavorite={true}
      />
    )

    const updatedButtons = screen.getAllByRole('button')
    const updatedFavoriteButton = updatedButtons.find(btn => btn.querySelector('.lucide-heart'))
    expect(updatedFavoriteButton).toHaveClass('bg-red-500', 'text-white')
  })

  it('should not show favorite button when onToggleFavorite is not provided', () => {
    render(<RecipeDetail recipe={mockRecipe} />)

    const buttons = screen.getAllByRole('button')
    const favoriteButton = buttons.find(btn => btn.querySelector('.lucide-heart'))
    expect(favoriteButton).toBeUndefined()
  })

  it('should show default chef hat when no image provided', () => {
    const recipeWithoutImage = { ...mockRecipe, imageUrl: undefined }
    render(<RecipeDetail recipe={recipeWithoutImage} />)

    const chefHatIcon = document.querySelector('.lucide-chef-hat')
    expect(chefHatIcon).toBeInTheDocument()
  })

  it('should show image when imageUrl is provided', () => {
    render(<RecipeDetail recipe={mockRecipe} />)

    const image = screen.getByAltText('テスト料理')
    expect(image).toBeInTheDocument()
    expect(image).toHaveAttribute('src', 'https://example.com/image.jpg')
  })

  it('should render seasoning checker', () => {
    render(<RecipeDetail recipe={mockRecipe} />)

    expect(screen.getByText('調味料チェック')).toBeInTheDocument()
    expect(screen.getByTestId('seasoning-checker')).toBeInTheDocument()
  })

  it('should handle alternative recipes request', () => {
    render(<RecipeDetail recipe={mockRecipe} />)

    expect(screen.queryByText('代替レシピ')).not.toBeInTheDocument()

    const requestButton = screen.getByText('Request Alternatives')
    fireEvent.click(requestButton)

    expect(screen.getByText('代替レシピ')).toBeInTheDocument()
    expect(screen.getByText('代替レシピ1')).toBeInTheDocument()
    expect(screen.getByText('代替レシピの説明')).toBeInTheDocument()
    expect(screen.getByText('25分')).toBeInTheDocument()
  })

  it('should display difficulty levels correctly', () => {
    const difficulties: Array<{ level: Recipe['difficulty'], label: string, color: string }> = [
      { level: 'easy', label: '簡単', color: 'text-green-600' },
      { level: 'medium', label: '普通', color: 'text-yellow-600' },
      { level: 'hard', label: '難しい', color: 'text-red-600' },
    ]

    difficulties.forEach(({ level, label, color }) => {
      const testRecipe = { ...mockRecipe, difficulty: level }
      const { unmount } = render(<RecipeDetail recipe={testRecipe} />)
      
      expect(screen.getByText(label)).toBeInTheDocument()
      expect(screen.getByText(label)).toHaveClass(color)
      
      unmount()
    })
  })

  it('should not show description when not provided', () => {
    const recipeWithoutDescription = { ...mockRecipe, description: undefined }
    render(<RecipeDetail recipe={recipeWithoutDescription} />)

    expect(screen.getByText('テスト料理')).toBeInTheDocument()
    expect(screen.queryByText('テスト料理の説明')).not.toBeInTheDocument()
  })

  it('should not show calories when not provided', () => {
    const recipeWithoutCalories = { ...mockRecipe, calories: undefined }
    render(<RecipeDetail recipe={recipeWithoutCalories} />)

    expect(screen.queryByText(/kcal/)).not.toBeInTheDocument()
  })

  it('should show step numbers and check icons correctly', () => {
    render(<RecipeDetail recipe={mockRecipe} />)

    // Initially should show step numbers
    expect(screen.getByText('1')).toBeInTheDocument()
    expect(screen.getByText('2')).toBeInTheDocument()
    expect(screen.getByText('3')).toBeInTheDocument()

    // Click first step to complete it
    const firstStep = screen.getByText('鶏肉を一口大に切る').closest('div')
    fireEvent.click(firstStep!)

    // Should show check icon for completed step
    const checkIcon = document.querySelector('.lucide-check-circle')
    expect(checkIcon).toBeInTheDocument()
  })

  it('should handle ingredients without category', () => {
    render(<RecipeDetail recipe={mockRecipe} />)

    expect(screen.getByText('玉ねぎ')).toBeInTheDocument()
    // Should not show category for ingredient without category
    const onionElement = screen.getByText('玉ねぎ').closest('div')
    expect(onionElement).not.toHaveTextContent('(')
  })

  it('should handle steps without duration or tips', () => {
    const stepWithoutExtras = { step: 1, instruction: '簡単なステップ' }
    const recipeWithSimpleSteps = { 
      ...mockRecipe, 
      steps: [stepWithoutExtras] 
    }
    
    render(<RecipeDetail recipe={recipeWithSimpleSteps} />)

    expect(screen.getByText('簡単なステップ')).toBeInTheDocument()
    expect(screen.queryByText(/⏱️ 目安時間/)).not.toBeInTheDocument()
    expect(screen.queryByText(/💡/)).not.toBeInTheDocument()
  })
})