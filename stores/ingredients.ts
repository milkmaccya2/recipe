/**
 * 食材管理Store（Jotai）
 * 識別された食材と調味料の状態管理
 */

import { atom } from 'jotai';
import { DetectedIngredient } from '@/lib/aws-rekognition';

// 識別された食材
export const detectedIngredientsAtom = atom<DetectedIngredient[]>([]);

// ユーザーが手動で追加した食材
export const manualIngredientsAtom = atom<string[]>([]);

// 確定した食材リスト（識別 + 手動）
export const confirmedIngredientsAtom = atom<string[]>((get) => {
  const detected = get(detectedIngredientsAtom);
  const manual = get(manualIngredientsAtom);
  
  const detectedNames = detected.map(d => d.japaneseName || d.name);
  return [...new Set([...detectedNames, ...manual])];
});

// 調味料チェックリスト
export interface Seasoning {
  id: string;
  name: string;
  category: '基本調味料' | '香辛料' | 'ソース・たれ' | 'その他';
  isAvailable: boolean;
}

export const commonSeasonings: Seasoning[] = [
  // 基本調味料
  { id: 'salt', name: '塩', category: '基本調味料', isAvailable: false },
  { id: 'sugar', name: '砂糖', category: '基本調味料', isAvailable: false },
  { id: 'soy-sauce', name: '醤油', category: '基本調味料', isAvailable: false },
  { id: 'miso', name: '味噌', category: '基本調味料', isAvailable: false },
  { id: 'vinegar', name: '酢', category: '基本調味料', isAvailable: false },
  { id: 'sake', name: '料理酒', category: '基本調味料', isAvailable: false },
  { id: 'mirin', name: 'みりん', category: '基本調味料', isAvailable: false },
  { id: 'oil', name: 'サラダ油', category: '基本調味料', isAvailable: false },
  { id: 'sesame-oil', name: 'ごま油', category: '基本調味料', isAvailable: false },
  
  // 香辛料
  { id: 'pepper', name: 'こしょう', category: '香辛料', isAvailable: false },
  { id: 'chili', name: '唐辛子', category: '香辛料', isAvailable: false },
  { id: 'ginger', name: '生姜', category: '香辛料', isAvailable: false },
  { id: 'garlic', name: 'にんにく', category: '香辛料', isAvailable: false },
  { id: 'wasabi', name: 'わさび', category: '香辛料', isAvailable: false },
  
  // ソース・たれ
  { id: 'ketchup', name: 'ケチャップ', category: 'ソース・たれ', isAvailable: false },
  { id: 'mayo', name: 'マヨネーズ', category: 'ソース・たれ', isAvailable: false },
  { id: 'sauce', name: 'ソース', category: 'ソース・たれ', isAvailable: false },
  { id: 'ponzu', name: 'ポン酢', category: 'ソース・たれ', isAvailable: false },
  { id: 'mentsuyu', name: 'めんつゆ', category: 'ソース・たれ', isAvailable: false },
  
  // その他
  { id: 'dashi', name: 'だしの素', category: 'その他', isAvailable: false },
  { id: 'consomme', name: 'コンソメ', category: 'その他', isAvailable: false },
  { id: 'butter', name: 'バター', category: 'その他', isAvailable: false },
  { id: 'cheese', name: 'チーズ', category: 'その他', isAvailable: false },
];

// 調味料の状態
export const seasoningsAtom = atom<Seasoning[]>(commonSeasonings);

// 利用可能な調味料のみ
export const availableSeasoningsAtom = atom<Seasoning[]>((get) => {
  const seasonings = get(seasoningsAtom);
  return seasonings.filter(s => s.isAvailable);
});

// 調味料の更新
export const updateSeasoningAtom = atom(
  null,
  (get, set, update: { id: string; isAvailable: boolean }) => {
    const seasonings = get(seasoningsAtom);
    const updated = seasonings.map(s => 
      s.id === update.id ? { ...s, isAvailable: update.isAvailable } : s
    );
    set(seasoningsAtom, updated);
  }
);

// 分析状態
export const analysisStateAtom = atom<{
  isAnalyzing: boolean;
  error: string | null;
  lastAnalyzedAt: Date | null;
}>({
  isAnalyzing: false,
  error: null,
  lastAnalyzedAt: null,
});

// レシピ提案状態
export const recipeSuggestionStateAtom = atom<{
  isLoading: boolean;
  error: string | null;
  recipes: any[];
  missingIngredients: string[];
}>({
  isLoading: false,
  error: null,
  recipes: [],
  missingIngredients: [],
});