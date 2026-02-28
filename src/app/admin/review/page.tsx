'use client'

import { useState, useEffect, useCallback } from 'react'
import type { Policy, PolicyCondition } from '@/lib/supabase/types'

type PolicyWithConditions = Policy & { policy_conditions: PolicyCondition[] }

const LAYER_LABELS: Record<string, string> = {
  national: '国',
  tokyo: '東京都',
  ward: '区',
}

const STATUS_COLORS: Record<string, string> = {
  draft: 'bg-yellow-100 text-yellow-800',
  approved: 'bg-green-100 text-green-800',
  rejected: 'bg-red-100 text-red-800',
  archived: 'bg-gray-100 text-gray-800',
}

export default function AdminReviewPage() {
  const [secret, setSecret] = useState('')
  const [authed, setAuthed] = useState(false)
  const [policies, setPolicies] = useState<PolicyWithConditions[]>([])
  const [statusFilter, setStatusFilter] = useState<'draft' | 'approved' | 'rejected'>('draft')
  const [loading, setLoading] = useState(false)
  const [actionLoading, setActionLoading] = useState<string | null>(null)
  const [scrapeLoading, setScrapeLoading] = useState(false)
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null)

  const fetchPolicies = useCallback(async () => {
    setLoading(true)
    try {
      const res = await fetch(`/api/admin/policies?status=${statusFilter}`, {
        headers: { 'x-admin-secret': secret },
      })
      const data = await res.json()
      if (res.ok) {
        setPolicies(data.policies ?? [])
      } else {
        setMessage({ type: 'error', text: data.error ?? '取得失敗' })
      }
    } finally {
      setLoading(false)
    }
  }, [secret, statusFilter])

  useEffect(() => {
    if (authed) fetchPolicies()
  }, [authed, fetchPolicies])

  async function handleAction(id: string, action: 'approve' | 'reject') {
    setActionLoading(id)
    try {
      const res = await fetch('/api/admin/policies', {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          'x-admin-secret': secret,
        },
        body: JSON.stringify({ id, action }),
      })
      const data = await res.json()
      if (res.ok) {
        setMessage({ type: 'success', text: `${action === 'approve' ? '承認' : '却下'}しました` })
        setPolicies(prev => prev.filter(p => p.id !== id))
      } else {
        setMessage({ type: 'error', text: data.error })
      }
    } finally {
      setActionLoading(null)
    }
  }

  async function handleScrape() {
    setScrapeLoading(true)
    setMessage(null)
    try {
      const res = await fetch('/api/scrape', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ secret }),
      })
      const data = await res.json()
      if (res.ok) {
        setMessage({
          type: 'success',
          text: `スクレイピング完了: ${data.summary.policiesFound}件のドラフトを生成しました`,
        })
        if (statusFilter === 'draft') fetchPolicies()
      } else {
        setMessage({ type: 'error', text: data.error })
      }
    } finally {
      setScrapeLoading(false)
    }
  }

  if (!authed) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="bg-white rounded-xl shadow p-8 w-full max-w-sm">
          <h1 className="text-xl font-bold text-gray-800 mb-6">管理者ログイン</h1>
          <input
            type="password"
            placeholder="管理者シークレット"
            value={secret}
            onChange={e => setSecret(e.target.value)}
            className="w-full border rounded-lg px-4 py-2 mb-4 focus:outline-none focus:ring-2 focus:ring-blue-400"
            onKeyDown={e => e.key === 'Enter' && setAuthed(true)}
          />
          <button
            onClick={() => setAuthed(true)}
            className="w-full bg-blue-600 text-white rounded-lg py-2 font-medium hover:bg-blue-700 transition"
          >
            ログイン
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* ヘッダー */}
      <header className="bg-white border-b sticky top-0 z-10">
        <div className="max-w-6xl mx-auto px-4 py-4 flex items-center justify-between">
          <div>
            <h1 className="text-lg font-bold text-gray-800">管理者レビュー画面</h1>
            <p className="text-sm text-gray-500">子育て支援ナビゲーター</p>
          </div>
          <button
            onClick={handleScrape}
            disabled={scrapeLoading}
            className="bg-purple-600 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-purple-700 disabled:opacity-50 transition"
          >
            {scrapeLoading ? '実行中...' : '今すぐスクレイピング実行'}
          </button>
        </div>
      </header>

      <div className="max-w-6xl mx-auto px-4 py-6">
        {/* メッセージ */}
        {message && (
          <div className={`mb-4 p-4 rounded-lg text-sm font-medium ${message.type === 'success' ? 'bg-green-50 text-green-800 border border-green-200' : 'bg-red-50 text-red-800 border border-red-200'}`}>
            {message.text}
            <button onClick={() => setMessage(null)} className="ml-4 underline">閉じる</button>
          </div>
        )}

        {/* フィルタータブ */}
        <div className="flex gap-2 mb-6">
          {(['draft', 'approved', 'rejected'] as const).map(s => (
            <button
              key={s}
              onClick={() => setStatusFilter(s)}
              className={`px-4 py-2 rounded-full text-sm font-medium transition ${statusFilter === s ? 'bg-blue-600 text-white' : 'bg-white text-gray-600 border hover:bg-gray-50'}`}
            >
              {s === 'draft' ? 'ドラフト' : s === 'approved' ? '承認済み' : '却下済み'}
              {statusFilter === s && ` (${policies.length})`}
            </button>
          ))}
        </div>

        {/* ポリシー一覧 */}
        {loading ? (
          <div className="text-center py-16 text-gray-500">読み込み中...</div>
        ) : policies.length === 0 ? (
          <div className="text-center py-16 text-gray-400">
            <p className="text-lg">該当する制度がありません</p>
            {statusFilter === 'draft' && (
              <p className="text-sm mt-2">スクレイピングを実行するとドラフトが生成されます</p>
            )}
          </div>
        ) : (
          <div className="space-y-4">
            {policies.map(policy => (
              <PolicyCard
                key={policy.id}
                policy={policy}
                onApprove={() => handleAction(policy.id, 'approve')}
                onReject={() => handleAction(policy.id, 'reject')}
                isLoading={actionLoading === policy.id}
                showActions={statusFilter === 'draft'}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  )
}

function PolicyCard({
  policy,
  onApprove,
  onReject,
  isLoading,
  showActions,
}: {
  policy: PolicyWithConditions
  onApprove: () => void
  onReject: () => void
  isLoading: boolean
  showActions: boolean
}) {
  const [expanded, setExpanded] = useState(false)
  const condition = policy.policy_conditions?.[0]

  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
      <div className="p-5">
        <div className="flex items-start justify-between gap-4">
          <div className="flex-1">
            {/* バッジ行 */}
            <div className="flex items-center gap-2 mb-2 flex-wrap">
              <span className="text-xs font-semibold px-2 py-0.5 rounded-full bg-blue-100 text-blue-700">
                {LAYER_LABELS[policy.layer]}
              </span>
              {policy.ward && (
                <span className="text-xs px-2 py-0.5 rounded-full bg-gray-100 text-gray-600">
                  {policy.ward}
                </span>
              )}
              <span className={`text-xs px-2 py-0.5 rounded-full ${STATUS_COLORS[policy.status]}`}>
                {policy.status}
              </span>
            </div>

            {/* 制度名 */}
            <h3 className="font-semibold text-gray-900 text-base mb-1">{policy.name}</h3>
            <p className="text-sm text-gray-600 mb-3">{policy.summary}</p>

            {/* 金額 */}
            <div className="flex gap-4 text-sm">
              {policy.amount_monthly != null && (
                <span className="text-green-700 font-medium">
                  月額: {policy.amount_monthly.toLocaleString()}円
                </span>
              )}
              {policy.amount_lump != null && (
                <span className="text-blue-700 font-medium">
                  一時金: {policy.amount_lump.toLocaleString()}円
                </span>
              )}
              {policy.amount_note && (
                <span className="text-gray-500">{policy.amount_note}</span>
              )}
            </div>
          </div>

          {/* アクションボタン */}
          {showActions && (
            <div className="flex flex-col gap-2 shrink-0">
              <button
                onClick={onApprove}
                disabled={isLoading}
                className="bg-green-600 text-white px-4 py-1.5 rounded-lg text-sm font-medium hover:bg-green-700 disabled:opacity-50 transition"
              >
                承認
              </button>
              <button
                onClick={onReject}
                disabled={isLoading}
                className="bg-red-100 text-red-700 px-4 py-1.5 rounded-lg text-sm font-medium hover:bg-red-200 disabled:opacity-50 transition"
              >
                却下
              </button>
            </div>
          )}
        </div>

        {/* 展開ボタン */}
        <button
          onClick={() => setExpanded(!expanded)}
          className="mt-3 text-sm text-blue-600 hover:underline"
        >
          {expanded ? '▲ 詳細を閉じる' : '▼ 詳細を表示'}
        </button>
      </div>

      {/* 展開コンテンツ */}
      {expanded && (
        <div className="border-t border-gray-100 p-5 bg-gray-50 text-sm space-y-3">
          {policy.description && (
            <div>
              <span className="font-medium text-gray-700">詳細説明:</span>
              <p className="mt-1 text-gray-600 whitespace-pre-wrap">{policy.description}</p>
            </div>
          )}
          {condition && (
            <div>
              <span className="font-medium text-gray-700">対象条件:</span>
              <ul className="mt-1 text-gray-600 space-y-1">
                {condition.child_age_max_months != null && (
                  <li>・子の年齢: {Math.floor((condition.child_age_min_months ?? 0) / 12)}歳〜
                    {Math.floor(condition.child_age_max_months / 12)}歳未満</li>
                )}
                {condition.birth_order_min != null && (
                  <li>・出生順位: 第{condition.birth_order_min}子以上
                    {condition.birth_order_max ? `〜第${condition.birth_order_max}子` : ''}</li>
                )}
                {condition.income_max_man_yen != null && (
                  <li>・所得制限: {condition.income_max_man_yen}万円以下</li>
                )}
                {condition.other_conditions && (
                  <li>・その他: {condition.other_conditions}</li>
                )}
              </ul>
            </div>
          )}
          {policy.apply_method && (
            <div>
              <span className="font-medium text-gray-700">申請方法:</span>
              <p className="mt-1 text-gray-600">{policy.apply_method}</p>
            </div>
          )}
          {policy.apply_url && (
            <div>
              <span className="font-medium text-gray-700">申請先:</span>
              <a href={policy.apply_url} target="_blank" rel="noopener noreferrer"
                className="ml-2 text-blue-600 hover:underline break-all">
                {policy.apply_url}
              </a>
            </div>
          )}
          {policy.source_url && (
            <div>
              <span className="font-medium text-gray-700">情報元:</span>
              <a href={policy.source_url} target="_blank" rel="noopener noreferrer"
                className="ml-2 text-gray-400 hover:underline text-xs break-all">
                {policy.source_url}
              </a>
            </div>
          )}
          {policy.scraped_at && (
            <div className="text-xs text-gray-400">
              スクレイピング日時: {new Date(policy.scraped_at).toLocaleString('ja-JP')}
            </div>
          )}
        </div>
      )}
    </div>
  )
}
