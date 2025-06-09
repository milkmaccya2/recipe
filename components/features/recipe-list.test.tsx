import { render, screen, fireEvent } from '@testing-library/react'
import { RecipeList } from './recipe-list'
import { Recipe } from '@/lib/openai'

jest.mock('./recipe-card', () => {
  return function MockRecipeCard({ recipe, onSelect, isFavorite, onToggleFavorite }: any) {
    return (
      <div data-testid={`recipe-card-${recipe.id}`}>
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
    title: '野菜炒め',
    description: 'ヘルシーな野菜炒め',
    cookingTime: '15分',
    difficulty: 'easy',
    servings: 1,
    calories: 200,
    ingredients: [{ name: 'キャベツ', amount: '100g', unit: 'g' }],
    steps: [{ order: 1, description: '野菜を切る' }],
  }
]

describe('RecipeListコンポーネント', () => {
  const mockProps = {
    recipes: mockRecipes,
    favoriteRecipes: ['recipe-1'],
    onToggleFavorite: jest.fn(),
  }

  beforeEach(() => {
    jest.clearAllMocks()
  })

  it('レシピリストを正常にレンダリングする', () => {
    render(<RecipeList {...mockProps} />)
    
    expect(screen.getByTestId('recipe-card-recipe-1')).toBeInTheDocument()
    expect(screen.getByTestId('recipe-card-recipe-2')).toBeInTheDocument()
    expect(screen.getByText('鶏の唐揚げ')).toBeInTheDocument()
    expect(screen.getByText('野菜炒め')).toBeInTheDocument()
  })

  it('レシピ選択時に詳細表示に切り替わる', () => {
    render(<RecipeList {...mockProps} />)
    
    fireEvent.click(screen.getByText('鶏の唐揚げ'))
    
    expect(screen.getByTestId('recipe-detail')).toBeInTheDocument()
    expect(screen.getByText('鶏の唐揚げ')).toBeInTheDocument()
  })

  it('お気に入り切り替えが正常に動作する', () => {
    render(<RecipeList {...mockProps} />)
    
    fireEvent.click(screen.getByTestId('favorite-recipe-1'))
    expect(mockProps.onToggleFavorite).toHaveBeenCalledWith('recipe-1')
    
    fireEvent.click(screen.getByTestId('favorite-recipe-2'))
    expect(mockProps.onToggleFavorite).toHaveBeenCalledWith('recipe-2')
  })

  it('詳細表示から戻るボタンでリスト表示に戻る', () => {
    render(<RecipeList {...mockProps} />)
    
    fireEvent.click(screen.getByText('鶏の唐揚げ'))
    expect(screen.getByTestId('recipe-detail')).toBeInTheDocument()
    
    fireEvent.click(screen.getByText('Back'))
    expect(screen.getByTestId('recipe-card-recipe-1')).toBeInTheDocument()
    expect(screen.queryByTestId('recipe-detail')).not.toBeInTheDocument()
  })

  it('空のレシピリストを適切に処理する', () => {
    render(<RecipeList {...mockProps} recipes={[]} />)
    
    expect(screen.queryByTestId('recipe-card-recipe-1')).not.toBeInTheDocument()
    expect(screen.queryByTestId('recipe-card-recipe-2')).not.toBeInTheDocument()
  })
})