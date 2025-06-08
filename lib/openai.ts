/**
 * OpenAI API連携
 * レシピ提案AI機能の実装
 */

import OpenAI from 'openai';

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

export interface RecipeIngredient {
  name: string;
  amount: string;
  unit: string;
  category?: 'meat' | 'vegetable' | 'seasoning' | 'grain' | 'dairy' | 'other';
}

export interface RecipeStep {
  step: number;
  instruction: string;
  duration?: string;
  tips?: string;
}

export interface Recipe {
  id: string;
  title: string;
  description: string;
  cookingTime: string;
  difficulty: 'easy' | 'medium' | 'hard';
  servings: number;
  calories?: number;
  ingredients: RecipeIngredient[];
  steps: RecipeStep[];
  tips?: string[];
  nutritionInfo?: {
    protein: number;
    carbs: number;
    fat: number;
    fiber: number;
  };
}

export interface RecipeSuggestionRequest {
  ingredients: string[];
  dietaryRestrictions?: string[];
  cookingTime?: string;
  difficulty?: 'easy' | 'medium' | 'hard';
  servings?: number;
  cuisine?: string;
}

export interface RecipeSuggestionResponse {
  recipes: Recipe[];
  missingIngredients: string[];
  alternatives: string[];
}

/**
 * レシピ提案メイン機能
 */
export async function suggestRecipes(
  request: RecipeSuggestionRequest
): Promise<RecipeSuggestionResponse> {
  try {
    const prompt = buildRecipePrompt(request);
    
    const completion = await openai.chat.completions.create({
      model: "gpt-4",
      messages: [
        {
          role: "system",
          content: `あなたは優秀な料理研究家です。与えられた食材から美味しいレシピを3つ提案してください。
          
回答は以下のJSON形式で返してください：
{
  "recipes": [
    {
      "id": "unique_id",
      "title": "料理名",
      "description": "料理の説明",
      "cookingTime": "30分",
      "difficulty": "easy|medium|hard",
      "servings": 2,
      "calories": 450,
      "ingredients": [
        {
          "name": "食材名",
          "amount": "100",
          "unit": "g",
          "category": "meat|vegetable|seasoning|grain|dairy|other"
        }
      ],
      "steps": [
        {
          "step": 1,
          "instruction": "手順の説明",
          "duration": "5分",
          "tips": "コツ・ポイント"
        }
      ],
      "tips": ["調理のコツ"],
      "nutritionInfo": {
        "protein": 25,
        "carbs": 45,
        "fat": 15,
        "fiber": 5
      }
    }
  ],
  "missingIngredients": ["追加で必要な食材"],
  "alternatives": ["代替食材の提案"]
}`
        },
        {
          role: "user",
          content: prompt
        }
      ],
      temperature: 0.7,
      max_tokens: 2000,
    });

    const content = completion.choices[0]?.message?.content;
    if (!content) {
      throw new Error('OpenAI APIからのレスポンスが空です');
    }

    // JSONパース
    const result = JSON.parse(content) as RecipeSuggestionResponse;
    
    // IDの生成（OpenAIが生成しない場合）
    result.recipes.forEach((recipe, index) => {
      if (!recipe.id) {
        recipe.id = `recipe_${Date.now()}_${index}`;
      }
    });

    return result;
  } catch (error) {
    console.error('レシピ提案エラー:', error);
    throw new Error(`レシピ提案に失敗しました: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
}

/**
 * 調味料不足時の代替レシピ提案
 */
export async function suggestAlternativeRecipes(
  originalRecipe: Recipe,
  missingSeasonings: string[]
): Promise<Recipe[]> {
  try {
    const prompt = `
元のレシピ: ${originalRecipe.title}
不足している調味料: ${missingSeasonings.join(', ')}

この調味料を使わずに作れる代替レシピを2つ提案してください。
元のレシピの食材をベースに、異なる味付けや調理法を提案してください。
`;

    const completion = await openai.chat.completions.create({
      model: "gpt-4",
      messages: [
        {
          role: "system",
          content: "調味料が不足している場合の代替レシピを提案する料理研究家です。与えられた食材で、不足調味料を使わない美味しいレシピを提案してください。"
        },
        {
          role: "user",
          content: prompt
        }
      ],
      temperature: 0.8,
      max_tokens: 1500,
    });

    const content = completion.choices[0]?.message?.content;
    if (!content) {
      throw new Error('代替レシピの提案に失敗しました');
    }

    const result = JSON.parse(content);
    return result.recipes || [];
  } catch (error) {
    console.error('代替レシピ提案エラー:', error);
    throw new Error(`代替レシピ提案に失敗しました: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
}

/**
 * プロンプト構築
 */
function buildRecipePrompt(request: RecipeSuggestionRequest): string {
  let prompt = `利用可能な食材: ${request.ingredients.join(', ')}\n`;
  
  if (request.cookingTime) {
    prompt += `調理時間: ${request.cookingTime}以内\n`;
  }
  
  if (request.difficulty) {
    prompt += `難易度: ${request.difficulty}\n`;
  }
  
  if (request.servings) {
    prompt += `人数: ${request.servings}人分\n`;
  }
  
  if (request.cuisine) {
    prompt += `料理のジャンル: ${request.cuisine}\n`;
  }
  
  if (request.dietaryRestrictions && request.dietaryRestrictions.length > 0) {
    prompt += `食事制限: ${request.dietaryRestrictions.join(', ')}\n`;
  }
  
  prompt += '\n日本人の家庭料理として親しみやすく、実際に作りやすいレシピを提案してください。';
  
  return prompt;
}

/**
 * レシピの栄養情報を推定
 */
export async function estimateNutrition(recipe: Recipe): Promise<Recipe['nutritionInfo']> {
  try {
    const ingredientsList = recipe.ingredients
      .map(ing => `${ing.name} ${ing.amount}${ing.unit}`)
      .join(', ');

    const prompt = `
以下の料理の栄養成分を推定してください：
料理名: ${recipe.title}
材料: ${ingredientsList}
人数: ${recipe.servings}人分

1人分あたりの栄養成分を以下のJSON形式で返してください：
{
  "protein": 25,
  "carbs": 45,
  "fat": 15,
  "fiber": 5
}
単位はグラム(g)です。
`;

    const completion = await openai.chat.completions.create({
      model: "gpt-3.5-turbo",
      messages: [
        {
          role: "system",
          content: "栄養士として、料理の栄養成分を正確に推定してください。"
        },
        {
          role: "user",
          content: prompt
        }
      ],
      temperature: 0.3,
      max_tokens: 200,
    });

    const content = completion.choices[0]?.message?.content;
    if (!content) return undefined;

    return JSON.parse(content);
  } catch (error) {
    console.error('栄養情報推定エラー:', error);
    return undefined;
  }
}