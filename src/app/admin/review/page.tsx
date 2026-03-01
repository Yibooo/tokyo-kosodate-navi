'use client'

import { useState, useEffect, useCallback } from 'react'

// =====================
// 型定義
// =====================
interface PolicyCondition { child_age_min_months: number | null; child_age_max_months: number | null; birth_order_min: number | null; birth_order_max: number | null; income_max_man_yen: number | null; other_conditions: string | null }
interface Policy { id: string; layer: string; ward: string | null; name: string; category: string | null; summary: string; description: string | null; amount_monthly: number | null; amount_lump: number | null; amount_note: string | null; apply_method: string | null; apply_url: string | null; source_url: string | null; status: string; scraped_at: string | null; policy_conditions: PolicyCondition[] }
interface ScrapeLog { id: string; target_name: string; target_url: string; layer: string; ward: string | null; status: string; policies_found: number; error_message: string | null; started_at: string; finished_at: string | null }
interface Stats { draft: number; approved: number; rejected: number }

const LAYER_LABELS: Record<string, string> = { national: '国', tokyo: '東京都', ward: '区' }
const STATUS_COLORS: Record<string, string> = { draft: 'bg-yellow-100 text-yellow-800', approved: 'bg-green-100 text-green-800', rejected: 'bg-red-100 text-red-800' }
const LOG_STATUS_COLOR: Record<string, string> = { running: 'bg-blue-100 text-blue-700', success: 'bg-green-100 text-green-700', failed: 'bg-red-100 text-red-700' }

export default function AdminReviewPage() {
  const [secret, setSecret] = useState('')
  const [authed, setAuthed] = useState(false)
  const [activeTab, setActiveTab] = useState<'draft' | 'approved' | 'rejected' | 'logs'>('draft')
  const [policies, setPolicies] = useState<Policy[]>([])
  const [logs, setLogs] = useState<ScrapeLog[]>([])
  const [stats, setStats] = useState<Stats>({ draft: 0, approved: 0, rejected: 0 })
  const [loading, setLoading] = useState(false)
  const [actionLoading, setActionLoading] = useState<string | null>(null)
  const [scrapeLoading, setScrapeLoading] = useState(false)
  const [bulkLoading, setBulkLoading] = useState(false)
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null)

  const headers = { 'x-admin-secret': secret }

  const fetchStats = useCallback(async () => {
    const [d, a, r] = await Promise.all([
      fetch('/api/admin/policies?status=draft', { headers }).then(r => r.json()),
      fetch('/api/admin/policies?status=approved', { headers }).then(r => r.json()),
      fetch('/api/admin/policies?status=rejected', { headers }).then(r => r.json()),
    ])
    setStats({ draft: d.policies?.length ?? 0, approved: a.policies?.length ?? 0, rejected: r.policies?.length ?? 0 })
  }, [secret])

  const fetchPolicies = useCallback(async (status: string) => {
    setLoading(true)
    try {
      const res = await fetch(`/api/admin/policies?status=${status}`, { headers })
      const data = await res.json()
      if (res.ok) setPolicies(data.policies ?? [])
      else setMessage({ type: 'error', text: data.error ?? '取得失敗' })
    } finally { setLoading(false) }
  }, [secret])

  const fetchLogs = useCallback(async () => {
    setLoading(true)
    try {
      const res = await fetch('/api/admin/logs', { headers })
      const data = await res.json()
      if (res.ok) setLogs(data.logs ?? [])
      else setMessage({ type: 'error', text: data.error ?? 'ログ取得失敗' })
    } finally { setLoading(false) }
  }, [secret])

  useEffect(() => {
    if (!authed) return
    fetchStats()
    if (activeTab === 'logs') fetchLogs()
    else fetchPolicies(activeTab)
  }, [authed, activeTab])

  async function handleAction(id: string, action: 'approve' | 'reject') {
    setActionLoading(id)
    try {
      const res = await fetch('/api/admin/policies', { method: 'PATCH', headers: { 'Content-Type': 'application/json', ...headers }, body: JSON.stringify({ id, action }) })
      const data = await res.json()
      if (res.ok) { setMessage({ type: 'success', text: `${action === 'approve' ? '承認' : '却下'}しました` }); setPolicies(prev => prev.filter(p => p.id !== id)); fetchStats() }
      else setMessage({ type: 'error', text: data.error })
    } finally { setActionLoading(null) }
  }

  async function handleBulkApprove() {
    if (!confirm(`${stats.draft}件のドラフトを全て承認しますか？`)) return
    setBulkLoading(true)
    try {
      const res = await fetch('/api/admin/policies', { method: 'PATCH', headers: { 'Content-Type': 'application/json', ...headers }, body: JSON.stringify({ action: 'bulk_approve' }) })
      const data = await res.json()
      if (res.ok) { setMessage({ type: 'success', text: `${data.count}件を一括承認しました` }); setPolicies([]); fetchStats() }
      else setMessage({ type: 'error', text: data.error })
    } finally { setBulkLoading(false) }
  }

  async function handleScrape() {
    setScrapeLoading(true); setMessage(null)
    try {
      const res = await fetch('/api/scrape', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ secret }) })
      const data = await res.json()
      if (res.ok) { setMessage({ type: 'success', text: `スクレイピング完了: 新規${data.summary.policiesFound}件` }); fetchStats(); if (activeTab === 'draft') fetchPolicies('draft') }
      else setMessage({ type: 'error', text: data.error })
    } finally { setScrapeLoading(false) }
  }

  if (!authed) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="bg-white rounded-2xl shadow-lg p-8 w-full max-w-sm">
          <h1 className="text-xl font-bold text-gray-800 mb-2">管理者ログイン</h1>
          <p className="text-sm text-gray-500 mb-6">子育て支援ナビ 管理画面</p>
          <input type="password" placeholder="管理者シークレット" value={secret} onChange={e => setSecret(e.target.value)} className="w-full border rounded-xl px-4 py-3 mb-4 focus:outline-none focus:ring-2 focus:ring-blue-400" onKeyDown={e => e.key === 'Enter' && setAuthed(true)} />
          <button onClick={() => setAuthed(true)} className="w-full bg-blue-600 text-white rounded-xl py-3 font-semibold hover:bg-blue-700 transition">ログイン →</button>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* ヘッダー */}
      <header className="bg-white border-b sticky top-0 z-10 shadow-sm">
        <div className="max-w-6xl mx-auto px-4 py-3 flex items-center justify-between gap-4">
          <div>
            <h1 className="text-lg font-bold text-gray-800">管理者ダッシュボード</h1>
            <p className="text-xs text-gray-400">東京23区 子育て支援ナビ</p>
          </div>
          <div className="flex gap-2">
            {activeTab === 'draft' && stats.draft > 0 && (
              <button onClick={handleBulkApprove} disabled={bulkLoading} className="bg-green-600 text-white px-4 py-2 rounded-lg text-sm font-semibold hover:bg-green-700 disabled:opacity-50 transition">
                {bulkLoading ? '処理中...' : `✅ 全${stats.draft}件を一括承認`}
              </button>
            )}
            <button onClick={handleScrape} disabled={scrapeLoading} className="bg-purple-600 text-white px-4 py-2 rounded-lg text-sm font-semibold hover:bg-purple-700 disabled:opacity-50 transition">
              {scrapeLoading ? '実行中...' : '🤖 スクレイピング実行'}
            </button>
          </div>
        </div>
      </header>

      <div className="max-w-6xl mx-auto px-4 py-6">
        {/* 統計カード */}
        <div className="grid grid-cols-3 gap-4 mb-6">
          {[
            { label: '承認待ち', value: stats.draft, color: 'bg-yellow-50 border-yellow-200 text-yellow-700', icon: '⏳' },
            { label: '承認済み', value: stats.approved, color: 'bg-green-50 border-green-200 text-green-700', icon: '✅' },
            { label: '却下済み', value: stats.rejected, color: 'bg-red-50 border-red-200 text-red-700', icon: '❌' },
          ].map(s => (
            <div key={s.label} className={`rounded-xl border p-4 ${s.color}`}>
              <div className="text-2xl font-extrabold">{s.icon} {s.value}</div>
              <div className="text-sm font-medium mt-1">{s.label}</div>
            </div>
          ))}
        </div>

        {/* メッセージ */}
        {message && (
          <div className={`mb-4 p-4 rounded-xl text-sm font-medium flex items-center justify-between ${message.type === 'success' ? 'bg-green-50 text-green-800 border border-green-200' : 'bg-red-50 text-red-800 border border-red-200'}`}>
            <span>{message.text}</span>
            <button onClick={() => setMessage(null)} className="ml-4 text-xs underline opacity-60">閉じる</button>
          </div>
        )}

        {/* タブ */}
        <div className="flex gap-2 mb-6 overflow-x-auto pb-1">
          {([
            { key: 'draft', label: `⏳ 承認待ち (${stats.draft})` },
            { key: 'approved', label: `✅ 承認済み (${stats.approved})` },
            { key: 'rejected', label: `❌ 却下済み (${stats.rejected})` },
            { key: 'logs', label: '📋 スクレイピングログ' },
          ] as const).map(t => (
            <button key={t.key} onClick={() => setActiveTab(t.key)}
              className={`flex-shrink-0 px-4 py-2 rounded-full text-sm font-semibold border transition ${activeTab === t.key ? 'bg-blue-600 text-white border-blue-600' : 'bg-white text-gray-600 border-gray-200 hover:bg-gray-50'}`}>
              {t.label}
            </button>
          ))}
        </div>

        {/* コンテンツ */}
        {loading ? (
          <div className="text-center py-16 text-gray-500">
            <div className="animate-spin text-4xl mb-3">⏳</div>
            <p>読み込み中...</p>
          </div>
        ) : activeTab === 'logs' ? (
          <LogsView logs={logs} />
        ) : policies.length === 0 ? (
          <div className="text-center py-16 text-gray-400">
            <div className="text-5xl mb-3">{activeTab === 'draft' ? '🎉' : '📭'}</div>
            <p className="text-lg font-medium">{activeTab === 'draft' ? '承認待ちの制度はありません' : '該当する制度がありません'}</p>
            {activeTab === 'draft' && <p className="text-sm mt-2">スクレイピングを実行するとドラフトが生成されます</p>}
          </div>
        ) : (
          <div className="space-y-4">
            {policies.map(policy => (
              <PolicyCard key={policy.id} policy={policy} onApprove={() => handleAction(policy.id, 'approve')} onReject={() => handleAction(policy.id, 'reject')} isLoading={actionLoading === policy.id} showActions={activeTab === 'draft'} />
            ))}
          </div>
        )}
      </div>
    </div>
  )
}

// =====================
// ログビュー
// =====================
function LogsView({ logs }: { logs: ScrapeLog[] }) {
  if (logs.length === 0) return (
    <div className="text-center py-16 text-gray-400">
      <div className="text-4xl mb-3">📋</div>
      <p>スクレイピングログがありません</p>
      <p className="text-sm mt-1">スクレイピングを実行するとログが記録されます</p>
    </div>
  )
  return (
    <div className="space-y-2">
      {logs.map(log => (
        <div key={log.id} className="bg-white rounded-xl border border-gray-100 p-4 flex items-center gap-4">
          <span className={`text-xs font-semibold px-2 py-1 rounded-full ${LOG_STATUS_COLOR[log.status] ?? 'bg-gray-100 text-gray-600'}`}>{log.status}</span>
          <div className="flex-1 min-w-0">
            <p className="font-medium text-gray-800 text-sm truncate">{log.target_name}</p>
            <p className="text-xs text-gray-400 truncate">{log.target_url}</p>
          </div>
          <div className="text-right shrink-0">
            {log.status === 'success' && <p className="text-sm font-semibold text-green-700">+{log.policies_found}件</p>}
            {log.status === 'failed' && <p className="text-xs text-red-600 max-w-32 truncate">{log.error_message}</p>}
            <p className="text-xs text-gray-400">{new Date(log.started_at).toLocaleString('ja-JP')}</p>
          </div>
        </div>
      ))}
    </div>
  )
}

// =====================
// 制度カード
// =====================
function PolicyCard({ policy, onApprove, onReject, isLoading, showActions }: { policy: Policy; onApprove: () => void; onReject: () => void; isLoading: boolean; showActions: boolean }) {
  const [expanded, setExpanded] = useState(false)
  const condition = policy.policy_conditions?.[0]

  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
      <div className="p-5">
        <div className="flex items-start justify-between gap-4">
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 mb-2 flex-wrap">
              <span className="text-xs font-semibold px-2 py-0.5 rounded-full bg-blue-100 text-blue-700">{LAYER_LABELS[policy.layer]}</span>
              {policy.ward && <span className="text-xs px-2 py-0.5 rounded-full bg-gray-100 text-gray-600">{policy.ward}</span>}
              {policy.category && <span className="text-xs px-2 py-0.5 rounded-full bg-indigo-50 text-indigo-700">{policy.category}</span>}
              <span className={`text-xs px-2 py-0.5 rounded-full ${STATUS_COLORS[policy.status] ?? 'bg-gray-100 text-gray-600'}`}>{policy.status}</span>
            </div>
            <h3 className="font-semibold text-gray-900 text-sm mb-1 truncate">{policy.name}</h3>
            <p className="text-xs text-gray-500 mb-2 line-clamp-2">{policy.summary}</p>
            <div className="flex gap-3 text-xs flex-wrap">
              {policy.amount_monthly != null && <span className="text-green-700 font-medium">月額: {policy.amount_monthly.toLocaleString()}円</span>}
              {policy.amount_lump != null && <span className="text-blue-700 font-medium">一時金: {policy.amount_lump.toLocaleString()}円</span>}
              {policy.amount_note && <span className="text-gray-400">{policy.amount_note}</span>}
            </div>
          </div>
          {showActions && (
            <div className="flex flex-col gap-2 shrink-0">
              <button onClick={onApprove} disabled={isLoading} className="bg-green-600 text-white px-4 py-1.5 rounded-lg text-xs font-semibold hover:bg-green-700 disabled:opacity-50 transition">承認</button>
              <button onClick={onReject} disabled={isLoading} className="bg-red-100 text-red-700 px-4 py-1.5 rounded-lg text-xs font-semibold hover:bg-red-200 disabled:opacity-50 transition">却下</button>
            </div>
          )}
        </div>
        <button onClick={() => setExpanded(!expanded)} className="mt-3 text-xs text-blue-600 hover:underline">{expanded ? '▲ 詳細を閉じる' : '▼ 詳細を表示'}</button>
      </div>
      {expanded && (
        <div className="border-t border-gray-100 p-4 bg-gray-50 text-xs space-y-2">
          {policy.description && <div><span className="font-medium text-gray-700">詳細: </span><span className="text-gray-600">{policy.description}</span></div>}
          {condition && condition.child_age_max_months != null && <div><span className="font-medium text-gray-700">対象年齢: </span><span className="text-gray-600">{Math.floor((condition.child_age_min_months ?? 0) / 12)}歳〜{Math.floor(condition.child_age_max_months / 12)}歳</span></div>}
          {condition?.income_max_man_yen != null && <div><span className="font-medium text-gray-700">所得制限: </span><span className="text-gray-600">{condition.income_max_man_yen}万円以下</span></div>}
          {policy.apply_method && <div><span className="font-medium text-gray-700">申請方法: </span><span className="text-gray-600">{policy.apply_method}</span></div>}
          {policy.source_url && <div><span className="font-medium text-gray-700">情報元: </span><a href={policy.source_url} target="_blank" rel="noopener noreferrer" className="text-blue-500 hover:underline break-all">{policy.source_url}</a></div>}
          {policy.scraped_at && <div className="text-gray-400">スクレイピング: {new Date(policy.scraped_at).toLocaleString('ja-JP')}</div>}
        </div>
      )}
    </div>
  )
}
