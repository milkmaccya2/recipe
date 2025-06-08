import { render, screen, fireEvent } from '@testing-library/react'
import { RecipeList } from './recipe-list'
import { Recipe } from '@/lib/openai'

// Mock RecipeCard component
jest.mock('./recipe-card', () => {
  return function MockRecipeCard({ recipe, onSelect, isFavorite, onToggleFavorite, className }: any) {
    return (
      <div data-testid={`recipe-card-${recipe.id}`} className={className}>
        <button onClick={() => onSelect(recipe)}>{recipe.title}</button>
        {onToggleFavorite && (
          <button 
            data-testid={`favorite-${recipe.id}`}
            onClick={() => onToggleFavorite(recipe.id)}
          >
            {isFavorite ? 'Remove Favorite' : 'Add Favorite'}
          </button>
        )}
      </div>
    )
  }
})

// Mock RecipeDetail component
jest.mock('./recipe-detail', () => ({
  RecipeDetail: ({ recipe, onBack, isFavorite, onToggleFavorite }: any) => (
    <div data-testid="recipe-detail">
      <button onClick={onBack}>Back</button>
      <h1>{recipe.title}</h1>
      {onToggleFavorite && (
        <button onClick={() => onToggleFavorite(recipe.id)}>
          {isFavorite ? 'Remove Favorite' : 'Add Favorite'}
        </button>
      )}
    </div>
  ),
}))

const mockRecipes: Recipe[] = [
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
    title: '肉じゃが',
    description: '家庭的な味の肉じゃが',
    cookingTime: '45分',
    difficulty: 'medium',
    servings: 4,
    calories: 250,
    ingredients: [{ name: '牛肉', amount: '200g', unit: 'g' }],
    steps: [{ order: 1, description: '材料を準備する' }],
  },
  {
    id: 'recipe-3',
    title: 'ビーフステーキ',
    description: '本格的なビーフステーキ',
    cookingTime: '20分',
    difficulty: 'hard',
    servings: 1,
    calories: 600,
    ingredients: [{ name: 'ステーキ肉', amount: '200g', unit: 'g' }],
    steps: [{ order: 1, description: '肉を焼く' }],
  },
]

describe('RecipeList component', () => {
  const mockOnFavoriteToggle = jest.fn()
  const favoriteRecipeIds = ['recipe-1']

  beforeEach(() => {
    jest.clearAllMocks()
  })

  it('should render recipes in grid mode by default', () => {
    render(
      <RecipeList 
        recipes={mockRecipes} 
        onFavoriteToggle={mockOnFavoriteToggle}
        favoriteRecipeIds={favoriteRecipeIds}
      />
    )

    expect(screen.getByText('鶏の唐揚げ')).toBeInTheDocument()
    expect(screen.getByText('肉じゃが')).toBeInTheDocument()
    expect(screen.getByText('ビーフステーキ')).toBeInTheDocument()
    expect(screen.getByText('3件のレシピが見つかりました')).toBeInTheDocument()
  })

  it('should show loading state', () => {
    render(<RecipeList recipes={[]} isLoading={true} />)

    const loadingCards = document.querySelectorAll('.animate-pulse')
    expect(loadingCards.length).toBeGreaterThan(0)
  })

  it('should show error state', () => {
    const error = 'テストエラー'
    render(<RecipeList recipes={[]} error={error} />)

    expect(screen.getByText('エラーが発生しました')).toBeInTheDocument()
    expect(screen.getByText(error)).toBeInTheDocument()
  })

  it('should filter recipes by search query', () => {
    render(<RecipeList recipes={mockRecipes} />)

    const searchInput = screen.getByPlaceholderText('レシピを検索...')
    fireEvent.change(searchInput, { target: { value: '唐揚げ' } })

    expect(screen.getByText('鶏の唐揚げ')).toBeInTheDocument()
    expect(screen.queryByText('肉じゃが')).not.toBeInTheDocument()
    expect(screen.getByText('1件のレシピが見つかりました')).toBeInTheDocument()
  })

  it('should filter recipes by difficulty', () => {
    render(<RecipeList recipes={mockRecipes} />)

    const difficultySelect = screen.getByDisplayValue('全ての難易度')
    fireEvent.change(difficultySelect, { target: { value: 'easy' } })

    expect(screen.getByText('鶏の唐揚げ')).toBeInTheDocument()
    expect(screen.queryByText('肉じゃが')).not.toBeInTheDocument()
    expect(screen.queryByText('ビーフステーキ')).not.toBeInTheDocument()
    expect(screen.getByText('1件のレシピが見つかりました')).toBeInTheDocument()
  })

  it('should filter recipes by cooking time', () => {
    render(<RecipeList recipes={mockRecipes} />)

    const timeSelect = screen.getByDisplayValue('全ての時間')
    fireEvent.change(timeSelect, { target: { value: '30' } })

    expect(screen.getByText('鶏の唐揚げ')).toBeInTheDocument()
    expect(screen.getByText('ビーフステーキ')).toBeInTheDocument()
    expect(screen.queryByText('肉じゃが')).not.toBeInTheDocument() // 45分なので除外
    expect(screen.getByText('2件のレシピが見つかりました')).toBeInTheDocument()
  })

  it('should sort recipes by cooking time', () => {
    render(<RecipeList recipes={mockRecipes} />)

    const sortSelect = screen.getByDisplayValue('関連度順')
    fireEvent.change(sortSelect, { target: { value: 'time' } })

    // 時間順でソートされることを確認（20分 -> 30分 -> 45分）
    const recipeCards = screen.getAllByText(/鶏の唐揚げ|肉じゃが|ビーフステーキ/)
    expect(recipeCards[0]).toHaveTextContent('ビーフステーキ') // 20分
    expect(recipeCards[1]).toHaveTextContent('鶏の唐揚げ') // 30分
    expect(recipeCards[2]).toHaveTextContent('肉じゃが') // 45分
  })

  it('should sort recipes by difficulty', () => {
    render(<RecipeList recipes={mockRecipes} />)

    const sortSelect = screen.getByDisplayValue('関連度順')
    fireEvent.change(sortSelect, { target: { value: 'difficulty' } })

    // 難易度順でソートされることを確認（easy -> medium -> hard）
    const recipeCards = screen.getAllByText(/鶏の唐揚げ|肉じゃが|ビーフステーキ/)
    expect(recipeCards[0]).toHaveTextContent('鶏の唐揚げ') // easy
    expect(recipeCards[1]).toHaveTextContent('肉じゃが') // medium
    expect(recipeCards[2]).toHaveTextContent('ビーフステーキ') // hard
  })

  it('should sort recipes by calories', () => {
    render(<RecipeList recipes={mockRecipes} />)

    const sortSelect = screen.getByDisplayValue('関連度順')
    fireEvent.change(sortSelect, { target: { value: 'calories' } })

    // カロリー順でソートされることを確認（250 -> 400 -> 600）
    const recipeCards = screen.getAllByText(/鶏の唐揚げ|肉じゃが|ビーフステーキ/)
    expect(recipeCards[0]).toHaveTextContent('肉じゃが') // 250kcal
    expect(recipeCards[1]).toHaveTextContent('鶏の唐揚げ') // 400kcal
    expect(recipeCards[2]).toHaveTextContent('ビーフステーキ') // 600kcal
  })

  it('should switch between grid and list view modes', () => {
    render(<RecipeList recipes={mockRecipes} />)

    // Initially in grid mode
    const gridContainer = document.querySelector('.grid')
    expect(gridContainer).toBeInTheDocument()

    // Switch to list mode
    const buttons = screen.getAllByRole('button')
    const listButton = buttons.find(btn => btn.querySelector('.lucide-list'))
    expect(listButton).toBeInTheDocument()
    fireEvent.click(listButton!)

    // Check that layout changed to list mode
    const listContainer = document.querySelector('.space-y-4')
    expect(listContainer).toBeInTheDocument()
  })

  it('should show recipe detail when recipe is selected', () => {
    render(<RecipeList recipes={mockRecipes} />)

    const recipeButton = screen.getByText('鶏の唐揚げ')
    fireEvent.click(recipeButton)

    expect(screen.getByTestId('recipe-detail')).toBeInTheDocument()
    expect(screen.getByText('Back')).toBeInTheDocument()
  })

  it('should return to list when back button is clicked in detail view', () => {
    render(<RecipeList recipes={mockRecipes} />)

    // Go to detail view
    const recipeButton = screen.getByText('鶏の唐揚げ')
    fireEvent.click(recipeButton)
    expect(screen.getByTestId('recipe-detail')).toBeInTheDocument()

    // Go back to list
    const backButton = screen.getByText('Back')
    fireEvent.click(backButton)

    expect(screen.queryByTestId('recipe-detail')).not.toBeInTheDocument()
    expect(screen.getByText('3件のレシピが見つかりました')).toBeInTheDocument()
  })

  it('should handle favorite toggle', () => {
    render(
      <RecipeList 
        recipes={mockRecipes} 
        onFavoriteToggle={mockOnFavoriteToggle}
        favoriteRecipeIds={favoriteRecipeIds}
      />
    )

    const favoriteButton = screen.getByTestId('favorite-recipe-1')
    fireEvent.click(favoriteButton)

    expect(mockOnFavoriteToggle).toHaveBeenCalledWith('recipe-1')
  })

  it('should show no results message when no recipes match filters', () => {
    render(<RecipeList recipes={mockRecipes} />)

    const searchInput = screen.getByPlaceholderText('レシピを検索...')
    fireEvent.change(searchInput, { target: { value: 'そんなレシピはない' } })

    expect(screen.getByText('レシピが見つかりませんでした')).toBeInTheDocument()
    expect(screen.getByText('検索条件を変更してお試しください')).toBeInTheDocument()
    expect(screen.getByText('0件のレシピが見つかりました')).toBeInTheDocument()
  })

  it('should hide search and filters when props are false', () => {
    render(
      <RecipeList 
        recipes={mockRecipes} 
        showSearch={false}
        showFilters={false}
      />
    )

    expect(screen.queryByPlaceholderText('レシピを検索...')).not.toBeInTheDocument()
    expect(screen.queryByDisplayValue('関連度順')).not.toBeInTheDocument()
  })

  it('should handle multiple filters simultaneously', () => {
    render(<RecipeList recipes={mockRecipes} />)

    // Search for "鶏" and filter by easy difficulty
    const searchInput = screen.getByPlaceholderText('レシピを検索...')
    fireEvent.change(searchInput, { target: { value: '鶏' } })

    const difficultySelect = screen.getByDisplayValue('全ての難易度')
    fireEvent.change(difficultySelect, { target: { value: 'easy' } })

    expect(screen.getByText('鶏の唐揚げ')).toBeInTheDocument()
    expect(screen.queryByText('肉じゃが')).not.toBeInTheDocument()
    expect(screen.queryByText('ビーフステーキ')).not.toBeInTheDocument()
    expect(screen.getByText('1件のレシピが見つかりました')).toBeInTheDocument()
  })

  it('should pass favorite status correctly to recipe detail', () => {
    render(
      <RecipeList 
        recipes={mockRecipes} 
        onFavoriteToggle={mockOnFavoriteToggle}
        favoriteRecipeIds={favoriteRecipeIds}
      />
    )

    // Click on favorite recipe
    const recipeButton = screen.getByText('鶏の唐揚げ')
    fireEvent.click(recipeButton)

    expect(screen.getByTestId('recipe-detail')).toBeInTheDocument()
    expect(screen.getByText('Remove Favorite')).toBeInTheDocument() // Should show as favorite
  })

  it('should handle empty recipes array', () => {
    render(<RecipeList recipes={[]} />)

    expect(screen.getByText('レシピが見つかりませんでした')).toBeInTheDocument()
    expect(screen.getByText('0件のレシピが見つかりました')).toBeInTheDocument()
  })
})