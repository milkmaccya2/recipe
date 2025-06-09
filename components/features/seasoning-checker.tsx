'use client'

import { useState } from 'react'
import { useAtom } from 'jotai'
import { Check, X, AlertCircle, ChefHat, Loader2, Settings, Save } from 'lucide-react'
import { seasoningsAtom, updateSeasoningAtom, availableSeasoningsAtom, type Seasoning } from '@/stores/ingredients'
import { Recipe } from '@/lib/openai'
import { useAuth } from '@/hooks/use-auth'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'

interface SeasoningCheckerProps {
  recipe: Recipe
  onAlternativesRequested?: (alternatives: Recipe[]) => void
}

export function SeasoningChecker({ recipe, onAlternativesRequested }: SeasoningCheckerProps) {
  const [seasonings] = useAtom(seasoningsAtom)
  const [availableSeasonings] = useAtom(availableSeasoningsAtom)
  const [, updateSeasoning] = useAtom(updateSeasoningAtom)
  const [isLoadingAlternatives, setIsLoadingAlternatives] = useState(false)
  const [alternativesError, setAlternativesError] = useState<string | null>(null)
  const [isSaving, setIsSaving] = useState(false)
  const [showAllSeasonings, setShowAllSeasonings] = useState(false)
  
  const { user, isAuthenticated } = useAuth()

  // レシピに必要な調味料（簡易的な抽出）
  const requiredSeasonings = extractRequiredSeasonings(recipe)
  
  // 不足している調味料
  const missingSeasonings = requiredSeasonings.filter(required => 
    !availableSeasonings.some(available => available.name === required)
  )

  const handleSeasoningToggle = (seasoningId: string) => {
    const seasoning = seasonings.find(s => s.id === seasoningId)
    if (seasoning) {
      updateSeasoning({
        id: seasoningId,
        isAvailable: !seasoning.isAvailable
      })
    }
  }

  const handleRequestAlternatives = async () => {
    if (missingSeasonings.length === 0) return

    setIsLoadingAlternatives(true)
    setAlternativesError(null)

    try {
      const response = await fetch('/api/recipes/alternatives', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          recipe,
          missingSeasonings
        }),
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || '代替レシピの取得に失敗しました')
      }

      const data = await response.json()
      onAlternativesRequested?.(data.alternatives || [])
    } catch (error) {
      console.error('Error fetching alternatives:', error)
      setAlternativesError(error instanceof Error ? error.message : 'エラーが発生しました')
    } finally {
      setIsLoadingAlternatives(false)
    }
  }

  const handleSaveSeasoningPreferences = async () => {
    if (!isAuthenticated) {
      alert('調味料設定を保存するにはログインが必要です')
      return
    }

    setIsSaving(true)
    try {
      const response = await fetch('/api/user/seasonings', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          seasonings: availableSeasonings.map(s => ({ name: s.name, isAvailable: true }))
        }),
      })

      if (!response.ok) {
        throw new Error('調味料設定の保存に失敗しました')
      }

      alert('調味料設定を保存しました！')
    } catch (error) {
      console.error('Error saving seasonings:', error)
      alert('調味料設定の保存に失敗しました')
    } finally {
      setIsSaving(false)
    }
  }

  return (
    <div className="bg-white rounded-lg shadow-md border border-gray-200 p-6">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center space-x-2">
          <ChefHat className="w-5 h-5 text-orange-600" />
          <h3 className="text-lg font-semibold text-gray-900">調味料チェック</h3>
          {isAuthenticated && user && (
            <span className="text-xs bg-green-100 text-green-700 px-2 py-1 rounded-full">
              {user.name}さんの設定
            </span>
          )}
        </div>
        
        {isAuthenticated && (
          <Button
            onClick={handleSaveSeasoningPreferences}
            disabled={isSaving}
            size="sm"
            variant="outline"
            className="flex items-center space-x-1"
          >
            {isSaving ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              <Save className="w-4 h-4" />
            )}
            <span>保存</span>
          </Button>
        )}
      </div>

      {/* 必要な調味料 */}
      <div className="mb-6">
        <h4 className="text-sm font-medium text-gray-700 mb-3">このレシピに必要な調味料</h4>
        <div className="space-y-2">
          {requiredSeasonings.map((required, index) => {
            const isAvailable = availableSeasonings.some(available => available.name === required)
            return (
              <div
                key={index}
                className={cn(
                  "flex items-center justify-between p-3 rounded-lg",
                  isAvailable ? "bg-green-50 border border-green-200" : "bg-red-50 border border-red-200"
                )}
              >
                <span className={cn(
                  "font-medium",
                  isAvailable ? "text-green-800" : "text-red-800"
                )}>
                  {required}
                </span>
                {isAvailable ? (
                  <Check className="w-5 h-5 text-green-600" />
                ) : (
                  <X className="w-5 h-5 text-red-600" />
                )}
              </div>
            )
          })}
        </div>
      </div>

      {/* 不足調味料の警告 */}
      {missingSeasonings.length > 0 && (
        <div className="mb-6 p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
          <div className="flex items-start space-x-2">
            <AlertCircle className="w-5 h-5 text-yellow-600 mt-0.5" />
            <div className="flex-1">
              <h4 className="text-sm font-medium text-yellow-800 mb-1">
                不足している調味料があります
              </h4>
              <p className="text-sm text-yellow-700 mb-3">
                以下の調味料が不足しています：{missingSeasonings.join('、')}
              </p>
              <button
                onClick={handleRequestAlternatives}
                disabled={isLoadingAlternatives}
                className="flex items-center space-x-2 bg-yellow-600 hover:bg-yellow-700 disabled:bg-yellow-400 text-white px-4 py-2 rounded-lg transition-colors text-sm"
              >
                {isLoadingAlternatives ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    <span>代替レシピを検索中...</span>
                  </>
                ) : (
                  <>
                    <ChefHat className="w-4 h-4" />
                    <span>代替レシピを提案してもらう</span>
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* エラー表示 */}
      {alternativesError && (
        <div className="mb-4 p-4 bg-red-50 border border-red-200 rounded-lg">
          <p className="text-red-600 text-sm">{alternativesError}</p>
        </div>
      )}

      {/* 調味料一覧 */}
      <div>
        <div className="flex items-center justify-between mb-3">
          <h4 className="text-sm font-medium text-gray-700">お持ちの調味料をチェック</h4>
          <Button
            onClick={() => setShowAllSeasonings(!showAllSeasonings)}
            variant="ghost"
            size="sm"
            className="flex items-center space-x-1"
          >
            <Settings className="w-4 h-4" />
            <span>{showAllSeasonings ? '基本のみ' : 'すべて表示'}</span>
          </Button>
        </div>
        
        <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
          {(showAllSeasonings ? seasonings : seasonings.slice(0, 12)).map((seasoning) => (
            <label
              key={seasoning.id}
              className={cn(
                "flex items-center space-x-2 p-3 rounded-lg cursor-pointer transition-all",
                seasoning.isAvailable
                  ? "bg-green-50 border border-green-200 hover:bg-green-100 shadow-sm"
                  : "bg-gray-50 border border-gray-200 hover:bg-gray-100"
              )}
            >
              <input
                type="checkbox"
                checked={seasoning.isAvailable}
                onChange={() => handleSeasoningToggle(seasoning.id)}
                className="w-4 h-4 text-orange-600 border-gray-300 rounded focus:ring-orange-500"
              />
              <span className={cn(
                "text-sm",
                seasoning.isAvailable ? "text-green-800 font-medium" : "text-gray-700"
              )}>
                {seasoning.name}
              </span>
            </label>
          ))}
        </div>
        
        {!showAllSeasonings && seasonings.length > 12 && (
          <div className="mt-3 text-center">
            <span className="text-sm text-gray-500">
              +{seasonings.length - 12}個の調味料
            </span>
          </div>
        )}
        
        {!isAuthenticated && (
          <div className="mt-4 p-3 bg-blue-50 border border-blue-200 rounded-lg">
            <p className="text-blue-700 text-sm">
              💡 ログインすると調味料の設定を保存できます
            </p>
          </div>
        )}
      </div>

      {/* 成功メッセージ */}
      {requiredSeasonings.length > 0 && missingSeasonings.length === 0 && (
        <div className="mt-4 p-4 bg-green-50 border border-green-200 rounded-lg">
          <div className="flex items-center space-x-2">
            <Check className="w-5 h-5 text-green-600" />
            <span className="text-green-800 font-medium">
              必要な調味料がすべて揃っています！
            </span>
          </div>
        </div>
      )}
    </div>
  )
}

// レシピから必要な調味料を抽出する関数（簡易版）
function extractRequiredSeasonings(recipe: Recipe): string[] {
  const commonSeasonings = [
    '塩', '醤油', '味噌', '砂糖', '酢', '料理酒', 'みりん', 'サラダ油', 'ごま油',
    'こしょう', '生姜', 'にんにく', 'ケチャップ', 'マヨネーズ', 'ソース',
    'ポン酢', 'めんつゆ', 'だしの素', 'コンソメ', 'バター'
  ]

  const seasonings: string[] = []
  const text = `${recipe.title} ${recipe.description} ${recipe.steps.map(s => s.instruction).join(' ')}`

  commonSeasonings.forEach(seasoning => {
    if (text.includes(seasoning)) {
      seasonings.push(seasoning)
    }
  })

  return [...new Set(seasonings)] // 重複を除去
}