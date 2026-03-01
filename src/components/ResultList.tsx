'use client'

import { useState } from 'react'
import type { MatchedPolicy } from '@/lib/matcher'
import PolicyCard from './PolicyCard'

const CATEGORY_ICONS: Record<string, string> = {
  '給付金・手当':   '💴',
  '一時金':         '🎁',
  '医療費助成':     '🏥',
  '保育・教育':     '📚',
  '育児サービス':   '🤱',
  '雇用・休業':     '🏢',
  '税制優遇':       '🏠',
  '物品・生活支援': '🚲',
}

interface LayerTab {
  key: string
  label: string
  items: MatchedPolicy[]
}

interface Props {
  tabs: LayerTab[]
}

export default function ResultList({ tabs }: Props) {
  const [activeLayer, setActiveLayer] = useState('all')
  const [activeCategory, setActiveCategory] = useState('all')

  const currentLayerItems = (tabs.find(t => t.key === activeLayer) ?? tabs[0]).items

  // カテゴリ一覧を動的に生成（件数順）
  const categoryCount = currentLayerItems.reduce<Record<string, number>>((acc, p) => {
    const cat = p.category ?? 'その他'
    acc[cat] = (acc[cat] ?? 0) + 1
    return acc
  }, {})

  const categories = Object.entries(categoryCount)
    .sort((a, b) => b[1] - a[1])
    .map(([key]) => key)

  // 全世帯給付 / 条件付き給付 の件数
  const universalCount    = currentLayerItems.filter(p => p.income_max == null).length
  const conditionalCount  = currentLayerItems.filter(p => p.income_max != null).length

  // カテゴリ・給付種別でフィルタ
  const displayItems =
    activeCategory === '__universal__'
      ? currentLayerItems.filter(p => p.income_max == null)
      : activeCategory === '__conditional__'
        ? currentLayerItems.filter(p => p.income_max != null)
        : activeCategory === 'all'
          ? currentLayerItems
          : currentLayerItems.filter(p => (p.category ?? 'その他') === activeCategory)

  // カテゴリタブが変わったらリセット
  const handleLayerChange = (key: string) => {
    setActiveLayer(key)
    setActiveCategory('all')
  }

  return (
    <>
      {/* レイヤータブ（国/東京都/区） */}
      <div className="flex gap-2 mb-3 overflow-x-auto pb-1">
        {tabs.map(tab => (
          <button
            key={tab.key}
            onClick={() => handleLayerChange(tab.key)}
            className={`flex-shrink-0 px-4 py-2 rounded-full text-sm font-semibold border transition ${
              activeLayer === tab.key
                ? 'bg-blue-600 text-white border-blue-600 shadow'
                : 'bg-white text-gray-600 border-gray-200 hover:border-blue-300'
            }`}
          >
            {tab.label}
            <span className="ml-1.5 text-xs opacity-70">({tab.items.length})</span>
          </button>
        ))}
      </div>

      {/* カテゴリ・給付種別フィルター */}
      {categories.length > 0 && (
        <div className="flex gap-2 mb-5 overflow-x-auto pb-1">
          {/* すべて */}
          <button
            onClick={() => setActiveCategory('all')}
            className={`flex-shrink-0 px-3 py-1.5 rounded-full text-xs font-semibold border transition ${
              activeCategory === 'all'
                ? 'bg-gray-700 text-white border-gray-700'
                : 'bg-white text-gray-500 border-gray-200 hover:border-gray-400'
            }`}
          >
            すべて ({currentLayerItems.length})
          </button>

          {/* 給付種別：全世帯給付 */}
          {universalCount > 0 && (
            <button
              onClick={() => setActiveCategory('__universal__')}
              className={`flex-shrink-0 px-3 py-1.5 rounded-full text-xs font-semibold border transition whitespace-nowrap ${
                activeCategory === '__universal__'
                  ? 'bg-green-600 text-white border-green-600'
                  : 'bg-green-50 text-green-700 border-green-200 hover:border-green-400'
              }`}
            >
              🌟 全世帯給付 ({universalCount})
            </button>
          )}

          {/* 給付種別：条件付き給付 */}
          {conditionalCount > 0 && (
            <button
              onClick={() => setActiveCategory('__conditional__')}
              className={`flex-shrink-0 px-3 py-1.5 rounded-full text-xs font-semibold border transition whitespace-nowrap ${
                activeCategory === '__conditional__'
                  ? 'bg-amber-500 text-white border-amber-500'
                  : 'bg-amber-50 text-amber-700 border-amber-200 hover:border-amber-400'
              }`}
            >
              📋 条件付き給付 ({conditionalCount})
            </button>
          )}

          {/* セパレーター */}
          <span className="flex-shrink-0 self-center text-gray-200 select-none">│</span>

          {/* カテゴリ別 */}
          {categories.map(cat => (
            <button
              key={cat}
              onClick={() => setActiveCategory(cat)}
              className={`flex-shrink-0 px-3 py-1.5 rounded-full text-xs font-semibold border transition whitespace-nowrap ${
                activeCategory === cat
                  ? 'bg-gray-700 text-white border-gray-700'
                  : 'bg-white text-gray-500 border-gray-200 hover:border-gray-400'
              }`}
            >
              {CATEGORY_ICONS[cat] ?? '📋'} {cat} ({categoryCount[cat]})
            </button>
          ))}
        </div>
      )}

      {/* 制度カード一覧（件数制限なし） */}
      {displayItems.length === 0 ? (
        <div className="text-center py-10 text-gray-400">
          <div className="text-4xl mb-3">🔍</div>
          <p>該当する制度がありません</p>
        </div>
      ) : (
        <div className="space-y-4">
          {displayItems.map((policy, idx) => (
            <PolicyCard key={policy.policy_id} policy={policy} rank={idx + 1} />
          ))}
        </div>
      )}
    </>
  )
}
