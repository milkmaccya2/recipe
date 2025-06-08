/**
 * データベース操作ユーティリティ
 * Prisma + Supabase連携
 */

import { PrismaClient } from '@prisma/client';
import { createClient } from '@supabase/supabase-js';

// Prismaクライアントのシングルトンインスタンス
const globalForPrisma = global as unknown as { prisma: PrismaClient };

export const prisma = globalForPrisma.prisma || new PrismaClient({
  log: process.env.NODE_ENV === 'development' ? ['query', 'error', 'warn'] : ['error'],
});

if (process.env.NODE_ENV !== 'production') globalForPrisma.prisma = prisma;

// Supabaseクライアント
export const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

// Supabase管理者クライアント（サーバーサイドのみ）
export const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!,
  {
    auth: {
      autoRefreshToken: false,
      persistSession: false
    }
  }
);

/**
 * データベース操作のヘルパー関数
 */

// ユーザーの調味料設定を取得
export async function getUserSeasonings(userId: string) {
  return await prisma.seasoningPreference.findMany({
    where: { userId },
    orderBy: { category: 'asc' }
  });
}

// ユーザーの調味料設定を更新
export async function updateUserSeasoning(
  userId: string,
  seasoningId: string,
  isAvailable: boolean,
  name: string,
  category: string
) {
  return await prisma.seasoningPreference.upsert({
    where: {
      userId_seasoningId: {
        userId,
        seasoningId
      }
    },
    update: {
      isAvailable,
      updatedAt: new Date()
    },
    create: {
      userId,
      seasoningId,
      name,
      category,
      isAvailable
    }
  });
}

// 画像分析結果を保存
export async function saveImageAnalysis(
  userId: string,
  imageUrl: string,
  s3Key: string,
  confidence: number,
  ingredients: Array<{
    name: string;
    japaneseName?: string;
    confidence: number;
    category: string;
    boundingBox?: any;
  }>
) {
  return await prisma.imageAnalysis.create({
    data: {
      userId,
      imageUrl,
      s3Key,
      confidence,
      ingredients: {
        create: ingredients
      }
    },
    include: {
      ingredients: true
    }
  });
}

// レシピを保存
export async function saveRecipe(
  recipe: {
    title: string;
    description: string;
    cookingTime: string;
    difficulty: string;
    servings: number;
    calories?: number;
    imageUrl?: string;
    ingredients: Array<{
      name: string;
      amount: string;
      unit: string;
      category?: string;
      isOptional?: boolean;
    }>;
    steps: Array<{
      stepNumber: number;
      instruction: string;
      duration?: string;
      tips?: string;
    }>;
    nutritionInfo?: {
      protein: number;
      carbs: number;
      fat: number;
      fiber: number;
    };
  },
  userId?: string,
  analysisId?: string
) {
  return await prisma.recipe.create({
    data: {
      ...recipe,
      userId,
      analysisId,
      ingredients: {
        create: recipe.ingredients
      },
      steps: {
        create: recipe.steps
      },
      nutritionInfo: recipe.nutritionInfo ? {
        create: recipe.nutritionInfo
      } : undefined
    },
    include: {
      ingredients: true,
      steps: {
        orderBy: { stepNumber: 'asc' }
      },
      nutritionInfo: true
    }
  });
}

// お気に入りレシピを追加
export async function addFavoriteRecipe(userId: string, recipeId: string) {
  return await prisma.favoriteRecipe.create({
    data: {
      userId,
      recipeId
    }
  });
}

// お気に入りレシピを削除
export async function removeFavoriteRecipe(userId: string, recipeId: string) {
  return await prisma.favoriteRecipe.delete({
    where: {
      userId_recipeId: {
        userId,
        recipeId
      }
    }
  });
}

// ユーザーのお気に入りレシピを取得
export async function getUserFavoriteRecipes(userId: string) {
  return await prisma.favoriteRecipe.findMany({
    where: { userId },
    include: {
      recipe: {
        include: {
          ingredients: true,
          nutritionInfo: true
        }
      }
    },
    orderBy: { createdAt: 'desc' }
  });
}

// 調理履歴を追加
export async function addCookingHistory(
  userId: string,
  recipeId: string,
  rating?: number,
  notes?: string
) {
  return await prisma.cookingHistory.create({
    data: {
      userId,
      recipeId,
      rating,
      notes
    }
  });
}

// ユーザーの調理履歴を取得
export async function getUserCookingHistory(userId: string, limit: number = 10) {
  return await prisma.cookingHistory.findMany({
    where: { userId },
    include: {
      recipe: {
        include: {
          ingredients: true
        }
      }
    },
    orderBy: { cookedAt: 'desc' },
    take: limit
  });
}

// 人気レシピを取得
export async function getPopularRecipes(limit: number = 10) {
  const recipes = await prisma.recipe.findMany({
    include: {
      ingredients: true,
      nutritionInfo: true,
      _count: {
        select: {
          favoriteBy: true,
          cookingHistory: true
        }
      }
    },
    take: limit
  });

  // 人気度でソート（お気に入り数 + 調理回数）
  return recipes.sort((a: any, b: any) => {
    const aScore = a._count.favoriteBy + a._count.cookingHistory;
    const bScore = b._count.favoriteBy + b._count.cookingHistory;
    return bScore - aScore;
  });
}

// レシピ検索
export async function searchRecipes(query: string, filters?: {
  difficulty?: string;
  maxCookingTime?: number;
  ingredients?: string[];
}) {
  const where: any = {
    OR: [
      { title: { contains: query, mode: 'insensitive' } },
      { description: { contains: query, mode: 'insensitive' } },
      {
        ingredients: {
          some: {
            name: { contains: query, mode: 'insensitive' }
          }
        }
      }
    ]
  };

  if (filters?.difficulty) {
    where.difficulty = filters.difficulty;
  }

  if (filters?.ingredients && filters.ingredients.length > 0) {
    where.ingredients = {
      some: {
        name: { in: filters.ingredients }
      }
    };
  }

  return await prisma.recipe.findMany({
    where,
    include: {
      ingredients: true,
      nutritionInfo: true
    }
  });
}