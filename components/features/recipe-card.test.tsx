import { render, screen, fireEvent } from '@testing-library/react'
import { RecipeCard } from './recipe-card'
import { Recipe } from '@/lib/openai'

const mockRecipe: Recipe = {
  id: 'recipe-1',
  title: 'テスト料理',
  description: 'テスト説明文',
  imageUrl: 'https://example.com/image.jpg',
  cookingTime: '30分',
  difficulty: 'easy',
  servings: 2,
  calories: 300,
  ingredients: [
    { name: '鶏肉', amount: '200g', unit: 'g' },
    { name: '玉ねぎ', amount: '1個', unit: '個' },
    { name: 'トマト', amount: '2個', unit: '個' },
  ],
  steps: [
    { order: 1, description: '鶏肉を切る' },
    { order: 2, description: '玉ねぎを炒める' },
  ],
  tips: ['コツ1', 'コツ2'],
}

describe('RecipeCard component', () => {
  it('should render recipe information correctly', () => {
    render(<RecipeCard recipe={mockRecipe} />)

    expect(screen.getByText('テスト料理')).toBeInTheDocument()
    expect(screen.getByText('テスト説明文')).toBeInTheDocument()
    expect(screen.getByText('30分')).toBeInTheDocument()
    expect(screen.getByText('2人分')).toBeInTheDocument()
    expect(screen.getByText('300kcal')).toBeInTheDocument()
    expect(screen.getByText('簡単')).toBeInTheDocument()
  })

  it('should render ingredients correctly', () => {
    render(<RecipeCard recipe={mockRecipe} />)

    expect(screen.getByText('鶏肉')).toBeInTheDocument()
    expect(screen.getByText('玉ねぎ')).toBeInTheDocument()
    expect(screen.getByText('トマト')).toBeInTheDocument()
  })

  it('should display default chef hat when no image provided', () => {
    const recipeWithoutImage = { ...mockRecipe, imageUrl: undefined }
    render(<RecipeCard recipe={recipeWithoutImage} />)

    const chefHatIcon = document.querySelector('.lucide-chef-hat')
    expect(chefHatIcon).toBeInTheDocument()
  })

  it('should show image when imageUrl is provided', () => {
    render(<RecipeCard recipe={mockRecipe} />)

    const image = screen.getByAltText('テスト料理')
    expect(image).toBeInTheDocument()
    expect(image).toHaveAttribute('src', 'https://example.com/image.jpg')
  })

  it('should call onSelect when card is clicked', () => {
    const mockOnSelect = jest.fn()
    render(<RecipeCard recipe={mockRecipe} onSelect={mockOnSelect} />)

    const card = screen.getByText('テスト料理').closest('div')
    fireEvent.click(card!)

    expect(mockOnSelect).toHaveBeenCalledWith(mockRecipe)
  })

  it('should show favorite button when onToggleFavorite is provided', () => {
    const mockOnToggleFavorite = jest.fn()
    render(
      <RecipeCard 
        recipe={mockRecipe} 
        onToggleFavorite={mockOnToggleFavorite}
      />
    )

    const favoriteButton = screen.getByRole('button')
    expect(favoriteButton).toBeInTheDocument()
  })

  it('should not show favorite button when onToggleFavorite is not provided', () => {
    render(<RecipeCard recipe={mockRecipe} />)

    const favoriteButton = screen.queryByRole('button')
    expect(favoriteButton).not.toBeInTheDocument()
  })

  it('should toggle favorite correctly', () => {
    const mockOnToggleFavorite = jest.fn()
    render(
      <RecipeCard 
        recipe={mockRecipe} 
        onToggleFavorite={mockOnToggleFavorite}
        isFavorite={false}
      />
    )

    const favoriteButton = screen.getByRole('button')
    fireEvent.click(favoriteButton)

    expect(mockOnToggleFavorite).toHaveBeenCalledWith('recipe-1')
  })

  it('should prevent event bubbling when favorite button is clicked', () => {
    const mockOnSelect = jest.fn()
    const mockOnToggleFavorite = jest.fn()
    
    render(
      <RecipeCard 
        recipe={mockRecipe} 
        onSelect={mockOnSelect}
        onToggleFavorite={mockOnToggleFavorite}
      />
    )

    const favoriteButton = screen.getByRole('button')
    fireEvent.click(favoriteButton)

    expect(mockOnToggleFavorite).toHaveBeenCalledWith('recipe-1')
    expect(mockOnSelect).not.toHaveBeenCalled()
  })

  it('should show correct favorite button styles', () => {
    const { rerender } = render(
      <RecipeCard 
        recipe={mockRecipe} 
        onToggleFavorite={() => {}}
        isFavorite={false}
      />
    )

    let favoriteButton = screen.getByRole('button')
    expect(favoriteButton).toHaveClass('bg-white/80', 'text-gray-600')

    rerender(
      <RecipeCard 
        recipe={mockRecipe} 
        onToggleFavorite={() => {}}
        isFavorite={true}
      />
    )

    favoriteButton = screen.getByRole('button')
    expect(favoriteButton).toHaveClass('bg-red-500', 'text-white')
  })

  it('should display difficulty levels correctly', () => {
    const difficulties: Array<{ level: Recipe['difficulty'], label: string, color: string }> = [
      { level: 'easy', label: '簡単', color: 'text-green-600' },
      { level: 'medium', label: '普通', color: 'text-yellow-600' },
      { level: 'hard', label: '難しい', color: 'text-red-600' },
    ]

    difficulties.forEach(({ level, label, color }) => {
      const testRecipe = { ...mockRecipe, difficulty: level }
      const { unmount } = render(<RecipeCard recipe={testRecipe} />)
      
      expect(screen.getByText(label)).toBeInTheDocument()
      expect(screen.getByText(label)).toHaveClass(color)
      
      unmount()
    })
  })

  it('should show cooking tips when available', () => {
    render(<RecipeCard recipe={mockRecipe} />)

    expect(screen.getByText('💡 コツ1')).toBeInTheDocument()
  })

  it('should not show tips section when no tips available', () => {
    const recipeWithoutTips = { ...mockRecipe, tips: [] }
    render(<RecipeCard recipe={recipeWithoutTips} />)

    expect(screen.queryByText(/💡/)).not.toBeInTheDocument()
  })

  it('should show only first 4 ingredients and count remaining', () => {
    const recipeWithManyIngredients = {
      ...mockRecipe,
      ingredients: [
        { name: '食材1', amount: '100g', unit: 'g' },
        { name: '食材2', amount: '200g', unit: 'g' },
        { name: '食材3', amount: '300g', unit: 'g' },
        { name: '食材4', amount: '400g', unit: 'g' },
        { name: '食材5', amount: '500g', unit: 'g' },
        { name: '食材6', amount: '600g', unit: 'g' },
      ]
    }

    render(<RecipeCard recipe={recipeWithManyIngredients} />)

    expect(screen.getByText('食材1')).toBeInTheDocument()
    expect(screen.getByText('食材2')).toBeInTheDocument()
    expect(screen.getByText('食材3')).toBeInTheDocument()
    expect(screen.getByText('食材4')).toBeInTheDocument()
    expect(screen.queryByText('食材5')).not.toBeInTheDocument()
    expect(screen.getByText('+2')).toBeInTheDocument()
  })

  it('should apply custom className when provided', () => {
    const { container } = render(
      <RecipeCard recipe={mockRecipe} className="custom-class" />
    )

    const card = container.firstChild as Element
    expect(card).toHaveClass('custom-class')
  })

  it('should not show calories when not provided', () => {
    const recipeWithoutCalories = { ...mockRecipe, calories: undefined }
    render(<RecipeCard recipe={recipeWithoutCalories} />)

    expect(screen.queryByText(/kcal/)).not.toBeInTheDocument()
  })

  it('should not show description when not provided', () => {
    const recipeWithoutDescription = { ...mockRecipe, description: undefined }
    render(<RecipeCard recipe={recipeWithoutDescription} />)

    // Title should still be there
    expect(screen.getByText('テスト料理')).toBeInTheDocument()
    // But description should not
    expect(screen.queryByText('テスト説明文')).not.toBeInTheDocument()
  })
})