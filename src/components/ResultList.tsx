'use client'

import { useState } from 'react'
import type { MatchedPolicy } from '@/lib/matcher'
import PolicyCard from './PolicyCard'

interface Tab {
  key: string
  label: string
  items: MatchedPolicy[]
}

export default function ResultList({ tabs }: { tabs: Tab[] }) {
  const [activeTab, setActiveTab] = useState('all')
  const current = tabs.find(t => t.key === activeTab) ?? tabs[0]

  return (
    <>
      {/* タブ */}
      <div className="flex gap-2 mb-5 overflow-x-auto pb-1">
        {tabs.map(tab => (
          <button
            key={tab.key}
            onClick={() => setActiveTab(tab.key)}
            className={`flex-shrink-0 px-4 py-2 rounded-full text-sm font-semibold border transition ${
              activeTab === tab.key
                ? 'bg-blue-600 text-white border-blue-600 shadow'
                : 'bg-white text-gray-600 border-gray-200 hover:border-blue-300'
            }`}
          >
            {tab.label}
            <span className="ml-1.5 text-xs opacity-70">({tab.items.length})</span>
          </button>
        ))}
      </div>

      {/* 制度カード一覧 */}
      <div className="space-y-4">
        {current.items.map((policy, idx) => (
          <PolicyCard key={policy.policy_id} policy={policy} rank={idx + 1} />
        ))}
      </div>
    </>
  )
}
