import { render, screen, fireEvent } from '@testing-library/react'
import { RecipeCard } from './recipe-card'
import { Recipe } from '@/lib/openai'

const testRecipe: Recipe = {
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
  ],
  steps: [
    { order: 1, description: '鶏肉を切る' },
    { order: 2, description: '玉ねぎを炒める' },
  ],
  tips: ['コツ1'],
}

describe('RecipeCard', () => {
  it('基本情報の表示', () => {
    render(<RecipeCard recipe={testRecipe} />)

    expect(screen.getByText('テスト料理')).toBeInTheDocument()
    expect(screen.getByText('テスト説明文')).toBeInTheDocument()
    expect(screen.getByText('30分')).toBeInTheDocument()
    expect(screen.getByText('2人分')).toBeInTheDocument()
    expect(screen.getByText('300kcal')).toBeInTheDocument()
    expect(screen.getByText('簡単')).toBeInTheDocument()
  })

  it('食材リストの表示', () => {
    render(<RecipeCard recipe={testRecipe} />)

    expect(screen.getByText('鶏肉')).toBeInTheDocument()
    expect(screen.getByText('玉ねぎ')).toBeInTheDocument()
  })

  it('画像ありの場合', () => {
    render(<RecipeCard recipe={testRecipe} />)

    const image = screen.getByAltText('テスト料理')
    expect(image).toHaveAttribute('src', 'https://example.com/image.jpg')
  })

  it('画像なしの場合', () => {
    const recipeWithoutImage = { ...testRecipe, imageUrl: undefined }
    render(<RecipeCard recipe={recipeWithoutImage} />)

    expect(document.querySelector('.lucide-chef-hat')).toBeInTheDocument()
  })

  it('カードクリック時の動作', () => {
    const mockOnSelect = jest.fn()
    render(<RecipeCard recipe={testRecipe} onSelect={mockOnSelect} />)

    const card = screen.getByText('テスト料理').closest('div')
    fireEvent.click(card!)

    expect(mockOnSelect).toHaveBeenCalledWith(testRecipe)
  })

  it('お気に入りボタンの表示', () => {
    const mockOnToggleFavorite = jest.fn()
    render(
      <RecipeCard 
        recipe={testRecipe} 
        onToggleFavorite={mockOnToggleFavorite}
      />
    )

    expect(screen.getByRole('button')).toBeInTheDocument()
  })

  it('お気に入りボタンのクリック', () => {
    const mockOnToggleFavorite = jest.fn()
    render(
      <RecipeCard 
        recipe={testRecipe} 
        onToggleFavorite={mockOnToggleFavorite}
      />
    )

    fireEvent.click(screen.getByRole('button'))
    expect(mockOnToggleFavorite).toHaveBeenCalledWith('recipe-1')
  })

  it('難易度レベルの表示', () => {
    const difficulties = [
      { level: 'easy' as const, label: '簡単' },
      { level: 'medium' as const, label: '普通' },
      { level: 'hard' as const, label: '難しい' },
    ]

    difficulties.forEach(({ level, label }) => {
      const { unmount } = render(
        <RecipeCard recipe={{ ...testRecipe, difficulty: level }} />
      )
      expect(screen.getByText(label)).toBeInTheDocument()
      unmount()
    })
  })

  it('コツの表示', () => {
    render(<RecipeCard recipe={testRecipe} />)
    expect(screen.getByText('💡 コツ1')).toBeInTheDocument()
  })
})