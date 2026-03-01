'use client'

import { useState } from 'react'
import type { MatchedPolicy } from '@/lib/matcher'

const LAYER_CONFIG = {
  national: { label: '国', color: 'bg-blue-100 text-blue-700 border-blue-200' },
  tokyo:    { label: '東京都', color: 'bg-purple-100 text-purple-700 border-purple-200' },
  ward:     { label: '区', color: 'bg-emerald-100 text-emerald-700 border-emerald-200' },
}

function formatAmount(n: number) {
  return n.toLocaleString('ja-JP')
}

interface Props {
  policy: MatchedPolicy
  rank: number
}

export default function PolicyCard({ policy, rank }: Props) {
  const [open, setOpen] = useState(false)
  const cfg = LAYER_CONFIG[policy.layer]
  const hasMonthly = policy.monthly_amount > 0
  const hasLump    = policy.lump_amount != null && policy.lump_amount > 0

  return (
    <div className="bg-white rounded-2xl border border-gray-100 shadow-sm hover:shadow-md transition-shadow overflow-hidden">
      <div className="p-5">
        {/* ランク・バッジ行 */}
        <div className="flex items-center gap-2 mb-3 flex-wrap">
          <span className="text-xs font-bold text-gray-300">#{rank}</span>
          <span className={`text-xs font-semibold px-2.5 py-0.5 rounded-full border ${cfg.color}`}>
            {cfg.label}{policy.ward ? `・${policy.ward}` : ''}
          </span>
        </div>

        {/* 制度名 */}
        <h3 className="font-bold text-gray-900 text-base mb-1 leading-snug">{policy.name}</h3>
        <p className="text-sm text-gray-500 mb-4 leading-relaxed">{policy.summary}</p>

        {/* 金額表示 */}
        <div className="flex flex-wrap gap-3 mb-3">
          {hasMonthly && (
            <div className="bg-emerald-50 rounded-xl px-4 py-2 border border-emerald-100">
              <div className="text-xs text-emerald-600 font-medium">月額</div>
              <div className="text-emerald-700 font-extrabold text-lg leading-tight">
                ¥{formatAmount(policy.monthly_amount)}
              </div>
              <div className="text-xs text-emerald-500">年間 ¥{formatAmount(policy.monthly_amount * 12)}</div>
            </div>
          )}
          {hasLump && (
            <div className="bg-blue-50 rounded-xl px-4 py-2 border border-blue-100">
              <div className="text-xs text-blue-600 font-medium">一時金</div>
              <div className="text-blue-700 font-extrabold text-lg leading-tight">
                ¥{formatAmount(policy.lump_amount!)}
              </div>
            </div>
          )}
          {!hasMonthly && !hasLump && (
            <div className="bg-gray-50 rounded-xl px-4 py-2 border border-gray-100">
              <div className="text-xs text-gray-500 font-medium">現物給付・医療費無料</div>
              <div className="text-gray-700 font-bold text-sm">実質的な節約効果あり</div>
            </div>
          )}
        </div>

        {policy.amount_note && (
          <p className="text-xs text-gray-400 mb-3">📌 {policy.amount_note}</p>
        )}

        {/* 該当理由 */}
        <p className="text-xs text-gray-400 bg-gray-50 rounded-lg px-3 py-2 mb-3">
          ✅ {policy.reason}
        </p>

        {/* 展開ボタン */}
        <button
          onClick={() => setOpen(!open)}
          className="text-sm text-blue-600 hover:text-blue-800 font-medium transition flex items-center gap-1"
        >
          {open ? '▲ 閉じる' : '▼ 申請方法・詳細を見る'}
        </button>
      </div>

      {/* 展開コンテンツ */}
      {open && (
        <div className="border-t border-gray-100 bg-slate-50 p-5 space-y-3 text-sm">
          {policy.description && (
            <div>
              <div className="font-semibold text-gray-700 mb-1">📄 詳細</div>
              <p className="text-gray-600 leading-relaxed whitespace-pre-wrap">{policy.description}</p>
            </div>
          )}
          {policy.apply_method && (
            <div>
              <div className="font-semibold text-gray-700 mb-1">📝 申請方法</div>
              <p className="text-gray-600 leading-relaxed">{policy.apply_method}</p>
            </div>
          )}
          {policy.apply_url && (
            <a
              href={policy.apply_url}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1.5 bg-blue-600 text-white text-xs font-semibold px-4 py-2 rounded-lg hover:bg-blue-700 transition"
            >
              公式サイトで確認 →
            </a>
          )}
        </div>
      )}
    </div>
  )
}
