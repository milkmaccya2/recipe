import { render, screen, fireEvent } from '@testing-library/react'
import { RecipeDetail } from './recipe-detail'
import { Recipe } from '@/lib/openai'

const mockAddToHistory = jest.fn()
jest.mock('@/hooks/use-recipe-history', () => ({
  useRecipeHistory: () => ({ addToHistory: mockAddToHistory }),
}))

jest.mock('./seasoning-checker', () => ({
  SeasoningChecker: ({ recipe, onAlternativesRequested }: any) => (
    <div data-testid="seasoning-checker">
      <button 
        onClick={() => onAlternativesRequested([{
          id: 'alt-1',
          title: '代替レシピ1',
          description: '代替レシピの説明',
          cookingTime: '25分',
          servings: 2,
          difficulty: 'easy',
          ingredients: [],
          steps: [],
        }])}
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
    { order: 1, description: '鶏肉を一口大に切る' },
    { order: 2, description: '玉ねぎをスライスする' },
  ],
  tags: ['簡単', '主菜'],
}

describe('RecipeDetailコンポーネント', () => {
  const mockProps = {
    recipe: mockRecipe,
    onBack: jest.fn(),
    isFavorite: false,
    onToggleFavorite: jest.fn(),
  }

  beforeEach(() => {
    jest.clearAllMocks()
  })

  it('レシピ詳細を正常にレンダリングする', () => {
    render(<RecipeDetail {...mockProps} />)
    
    expect(screen.getByText('テスト料理')).toBeInTheDocument()
    expect(screen.getByText('テスト料理の説明')).toBeInTheDocument()
    expect(screen.getByText('30分')).toBeInTheDocument()
    expect(screen.getByText('鶏肉')).toBeInTheDocument()
    expect(screen.getByText('玉ねぎ')).toBeInTheDocument()
  })

  it('戻るボタンが正常に動作する', () => {
    render(<RecipeDetail {...mockProps} />)
    
    fireEvent.click(screen.getByText('戻る'))
    expect(mockProps.onBack).toHaveBeenCalled()
  })

  it('お気に入り切り替えが正常に動作する', () => {
    render(<RecipeDetail {...mockProps} />)
    
    fireEvent.click(screen.getByText('お気に入りに追加'))
    expect(mockProps.onToggleFavorite).toHaveBeenCalledWith('recipe-1')
  })

  it('お気に入り状態が正しく表示される', () => {
    render(<RecipeDetail {...mockProps} isFavorite={true} />)
    
    expect(screen.getByText('お気に入りから削除')).toBeInTheDocument()
  })

  it('調理履歴に追加する', () => {
    render(<RecipeDetail {...mockProps} />)
    
    fireEvent.click(screen.getByText('調理開始'))
    expect(mockAddToHistory).toHaveBeenCalledWith(mockRecipe)
  })

  it('代替レシピ要求が正常に動作する', () => {
    render(<RecipeDetail {...mockProps} />)
    
    expect(screen.getByTestId('seasoning-checker')).toBeInTheDocument()
    fireEvent.click(screen.getByText('Request Alternatives'))
    
    expect(screen.getByText('代替レシピ1')).toBeInTheDocument()
  })

  it('調理手順を段階的に表示する', () => {
    render(<RecipeDetail {...mockProps} />)
    
    expect(screen.getByText('1. 鶏肉を一口大に切る')).toBeInTheDocument()
    expect(screen.getByText('2. 玉ねぎをスライスする')).toBeInTheDocument()
  })
})