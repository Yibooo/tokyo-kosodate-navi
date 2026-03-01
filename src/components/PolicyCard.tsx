'use client'

import { useState } from 'react'
import type { MatchedPolicy } from '@/lib/matcher'

const LAYER_CONFIG = {
  national: { label: '国', color: 'bg-blue-100 text-blue-700 border-blue-200' },
  tokyo:    { label: '東京都', color: 'bg-purple-100 text-purple-700 border-purple-200' },
  ward:     { label: '区', color: 'bg-emerald-100 text-emerald-700 border-emerald-200' },
}

const CATEGORY_CONFIG: Record<string, { icon: string; color: string }> = {
  '給付金・手当':  { icon: '💴', color: 'bg-yellow-50 text-yellow-700 border-yellow-200' },
  '一時金':        { icon: '🎁', color: 'bg-pink-50 text-pink-700 border-pink-200' },
  '医療費助成':    { icon: '🏥', color: 'bg-red-50 text-red-700 border-red-200' },
  '保育・教育':    { icon: '📚', color: 'bg-indigo-50 text-indigo-700 border-indigo-200' },
  '育児サービス':  { icon: '🤱', color: 'bg-orange-50 text-orange-700 border-orange-200' },
  '雇用・休業':    { icon: '🏢', color: 'bg-cyan-50 text-cyan-700 border-cyan-200' },
  '税制優遇':      { icon: '🏠', color: 'bg-teal-50 text-teal-700 border-teal-200' },
  '物品・生活支援': { icon: '🚲', color: 'bg-lime-50 text-lime-700 border-lime-200' },
}

// カテゴリ別のサービス説明テキスト
const SERVICE_LABEL: Record<string, string> = {
  '医療費助成':    '医療費が実質無料',
  '保育・教育':    '保育料・学費を軽減',
  '育児サービス':  '育児サービスを低負担で利用可',
  '雇用・休業':    '給与の一部が支給',
  '税制優遇':      '税額控除で実質的な節税',
  '物品・生活支援': '購入費用の一部を補助',
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
  const catCfg = policy.category ? CATEGORY_CONFIG[policy.category] : null
  const hasMonthly = policy.monthly_amount > 0
  const hasLump    = policy.lump_amount != null && policy.lump_amount > 0
  const isService  = !hasMonthly && !hasLump

  const serviceLabel = isService
    ? (policy.category ? SERVICE_LABEL[policy.category] ?? '現物給付・サービス支援' : '現物給付・サービス支援')
    : null

  return (
    <div className="bg-white rounded-2xl border border-gray-100 shadow-sm hover:shadow-md transition-shadow overflow-hidden">
      <div className="p-5">
        {/* ランク・バッジ行 */}
        <div className="flex items-center gap-2 mb-3 flex-wrap">
          <span className="text-xs font-bold text-gray-300">#{rank}</span>
          <span className={`text-xs font-semibold px-2.5 py-0.5 rounded-full border ${cfg.color}`}>
            {cfg.label}{policy.ward ? `・${policy.ward}` : ''}
          </span>
          {catCfg && policy.category && (
            <span className={`text-xs font-semibold px-2.5 py-0.5 rounded-full border ${catCfg.color}`}>
              {catCfg.icon} {policy.category}
            </span>
          )}
          {/* 給付条件バッジ */}
          {policy.income_max == null ? (
            <span className="text-xs font-semibold px-2.5 py-0.5 rounded-full border bg-green-50 text-green-700 border-green-200">
              🌟 全世帯給付
            </span>
          ) : (
            <span className="text-xs font-semibold px-2.5 py-0.5 rounded-full border bg-amber-50 text-amber-700 border-amber-200">
              📋 世帯年収{policy.income_max}万円以下
            </span>
          )}
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
          {isService && (
            <div className="bg-slate-50 rounded-xl px-4 py-2 border border-slate-200">
              <div className="text-xs text-slate-500 font-medium">
                {catCfg ? catCfg.icon : '✨'} {serviceLabel}
              </div>
              {policy.amount_note && (
                <div className="text-slate-700 font-semibold text-xs mt-0.5 leading-snug max-w-xs">
                  {policy.amount_note}
                </div>
              )}
            </div>
          )}
        </div>

        {/* 金額補足（現金給付系のみ表示） */}
        {!isService && policy.amount_note && (
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
