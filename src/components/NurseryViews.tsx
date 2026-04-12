'use client'

import { useState, useEffect } from 'react'
import {
  SUPPORTED_WARDS,
  DIFFICULTY_CONFIG,
  type WardCompareItem,
  type NurseryData,
} from '@/lib/childcare'

// =============================================
// ① エリア比較ビュー
// =============================================

export function NurseryCompareView() {
  const [wards,   setWards]   = useState<string[]>([SUPPORTED_WARDS[11], SUPPORTED_WARDS[12]]) // 世田谷区・渋谷区
  const [dataMap, setDataMap] = useState<Record<string, NurseryData>>({})
  const [loading, setLoading] = useState(false)

  // 選択中の区のデータをまとめて取得
  useEffect(() => {
    let cancelled = false
    setLoading(true)
    import('@/lib/childcare').then(({ getNurseryData }) =>
      Promise.all(wards.map(w => getNurseryData(w).then(d => [w, d] as const)))
    ).then(pairs => {
      if (cancelled) return
      const map: Record<string, NurseryData> = {}
      pairs.forEach(([w, d]) => { if (d) map[w] = d })
      setDataMap(map)
      setLoading(false)
    })
    return () => { cancelled = true }
  }, [wards])

  const addWard    = () => setWards(prev => [...prev, SUPPORTED_WARDS.find(w => !prev.includes(w)) ?? SUPPORTED_WARDS[0]])
  const removeWard = (i: number) => setWards(prev => prev.filter((_, idx) => idx !== i))
  const changeWard = (i: number, val: string) =>
    setWards(prev => prev.map((w, idx) => idx === i ? val : w))

  const SLOT_COLORS = ['bg-blue-50 border-blue-200', 'bg-violet-50 border-violet-200', 'bg-emerald-50 border-emerald-200']
  const HEADER_COLORS = ['text-blue-700 bg-blue-50', 'text-violet-700 bg-violet-50', 'text-emerald-700 bg-emerald-50']

  // 比較する指標
  const METRICS = [
    {
      key:    '認可定員合計',
      render: (d: NurseryData) => (
        <span className="font-bold text-gray-900">{d.facility.total_capacity.toLocaleString()}<span className="text-xs text-gray-400 ml-0.5">名</span></span>
      ),
    },
    {
      key:    '施設数',
      render: (d: NurseryData) => (
        <span className="text-gray-700">{d.facility.total_count}<span className="text-xs text-gray-400 ml-0.5">施設</span></span>
      ),
    },
    {
      key:    '待機児童数',
      render: (d: NurseryData) => {
        const diff = DIFFICULTY_CONFIG[d.waiting.total_waiting === 0 ? 'low' : d.waiting.total_waiting < 10 ? 'mid' : 'high']
        return (
          <span className="font-bold text-gray-900">
            {d.waiting.total_waiting}<span className="text-xs text-gray-400 ml-0.5">名</span>
            <span className={`ml-2 text-[11px] font-semibold ${diff.color}`}>{diff.dot} {diff.label}</span>
          </span>
        )
      },
    },
    {
      key:    '入園難易度',
      render: (d: NurseryData) => {
        const diff = DIFFICULTY_CONFIG[d.waiting.total_waiting === 0 ? 'low' : d.waiting.total_waiting < 10 ? 'mid' : 'high']
        return (
          <span className={`inline-flex items-center gap-1 text-xs font-bold px-2.5 py-1 rounded-full ${diff.bg} ${diff.color}`}>
            {diff.dot} 難易度 {diff.label}
          </span>
        )
      },
    },
    {
      key:    '出生数（最新）',
      render: (d: NurseryData) => {
        const latest = d.trend[d.trend.length - 1]
        return <span className="text-gray-700">{latest?.birth_count.toLocaleString() ?? '—'}<span className="text-xs text-gray-400 ml-0.5">人</span></span>
      },
    },
    {
      key:    '5年待機変化',
      render: (d: NurseryData) => {
        const first = d.trend[0]?.total_waiting ?? 0
        const last  = d.trend[d.trend.length - 1]?.total_waiting ?? 0
        const diff  = last - first
        const color = diff < 0 ? 'text-green-600' : diff > 0 ? 'text-red-500' : 'text-gray-400'
        const label = diff === 0 ? '±0（横ばい）' : diff > 0 ? `↑ +${diff}（悪化）` : `↓ ${diff}（改善）`
        return <span className={`text-sm font-semibold ${color}`}>{label}</span>
      },
    },
    {
      key:    '総評',
      render: (d: NurseryData) => (
        <span className="text-xs text-gray-600 leading-relaxed">{d.trend_comment}</span>
      ),
    },
  ]

  return (
    <div className="space-y-4">
      {/* 区セレクター */}
      <div className="flex flex-wrap gap-3 items-end">
        {wards.map((w, i) => (
          <div key={i} className={`flex items-center gap-2 border rounded-xl px-3 py-2 ${SLOT_COLORS[i]}`}>
            <span className="text-xs font-bold text-gray-500">#{i + 1}</span>
            <select
              value={w}
              onChange={e => changeWard(i, e.target.value)}
              className="text-sm bg-transparent focus:outline-none font-semibold text-gray-800 cursor-pointer"
            >
              {SUPPORTED_WARDS.map(ward => (
                <option key={ward} value={ward}>{ward}</option>
              ))}
            </select>
            {wards.length > 2 && (
              <button
                onClick={() => removeWard(i)}
                className="text-gray-400 hover:text-red-400 text-xs leading-none transition"
              >✕</button>
            )}
          </div>
        ))}
        {wards.length < 3 && (
          <button
            onClick={addWard}
            className="text-sm text-gray-500 hover:text-blue-600 border border-dashed border-gray-300 hover:border-blue-400 rounded-xl px-4 py-2 transition"
          >
            ＋ 3つ目を追加
          </button>
        )}
      </div>

      {/* 比較テーブル */}
      {loading ? (
        <div className="text-center py-8 text-gray-400 text-sm animate-pulse">比較データを読み込み中...</div>
      ) : (
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm" style={{ minWidth: `${280 + wards.length * 160}px` }}>
              <thead>
                <tr className="border-b border-gray-100">
                  <th className="text-left px-5 py-3 text-xs text-gray-400 font-medium w-32 bg-gray-50">指標</th>
                  {wards.map((w, i) => (
                    <th key={w} className={`px-5 py-3 text-sm font-bold text-center ${HEADER_COLORS[i]}`}>
                      {w}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {METRICS.map((metric, mi) => (
                  <tr key={metric.key} className={`border-t border-gray-50 ${mi % 2 === 0 ? '' : 'bg-gray-50/50'}`}>
                    <td className="px-5 py-3 text-xs text-gray-500 font-medium bg-gray-50/80">{metric.key}</td>
                    {wards.map(w => {
                      const d = dataMap[w]
                      return (
                        <td key={w} className="px-5 py-3 text-center">
                          {d ? metric.render(d) : <span className="text-gray-300">—</span>}
                        </td>
                      )
                    })}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <p className="px-5 pb-3 pt-2 text-[10px] text-gray-300">
            ※ 定員・待機児童は2024年度データ。施設数は推計値。5年変化は2020→2024年の待機児童数の差。
          </p>
        </div>
      )}
    </div>
  )
}

// =============================================
// ② 全区ランキングビュー
// =============================================

type SortKey = 'waiting' | 'capacity' | 'birth'

export function NurseryRankingView() {
  const [items,   setItems]   = useState<WardCompareItem[]>([])
  const [loading, setLoading] = useState(false)
  const [sortKey, setSortKey] = useState<SortKey>('waiting')

  useEffect(() => {
    let cancelled = false
    setLoading(true)
    import('@/lib/childcare').then(({ getAllWardsCompare }) => getAllWardsCompare())
      .then(data => {
        if (cancelled) return
        setItems(data)
        setLoading(false)
      })
    return () => { cancelled = true }
  }, [])

  const sorted = [...items].sort((a, b) => {
    if (sortKey === 'waiting')  return b.total_waiting  - a.total_waiting
    if (sortKey === 'capacity') return b.total_capacity - a.total_capacity
    return b.birth_latest - a.birth_latest
  })

  const SORT_BTNS: { key: SortKey; label: string }[] = [
    { key: 'waiting',  label: '待機児童数順' },
    { key: 'capacity', label: '定員規模順' },
    { key: 'birth',    label: '出生数順' },
  ]

  const maxWaiting  = Math.max(...items.map(i => i.total_waiting),  1)
  const maxCapacity = Math.max(...items.map(i => i.total_capacity), 1)
  const maxBirth    = Math.max(...items.map(i => i.birth_latest),   1)

  return (
    <div className="space-y-3">
      {/* ソートボタン */}
      <div className="flex gap-2 flex-wrap">
        {SORT_BTNS.map(btn => (
          <button
            key={btn.key}
            onClick={() => setSortKey(btn.key)}
            className={`text-xs font-semibold px-3 py-1.5 rounded-lg transition
              ${sortKey === btn.key
                ? 'bg-blue-600 text-white shadow-sm'
                : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
              }`}
          >
            {btn.label}
          </button>
        ))}
      </div>

      {loading ? (
        <div className="text-center py-10 text-gray-400 text-sm animate-pulse">ランキングデータを読み込み中...</div>
      ) : (
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-gray-50 text-xs text-gray-500 border-b border-gray-100">
                <th className="text-center px-4 py-2.5 font-medium w-10">順位</th>
                <th className="text-left px-4 py-2.5 font-medium">区名</th>
                <th className="text-right px-4 py-2.5 font-medium">待機児童</th>
                <th className="text-right px-3 py-2.5 font-medium hidden sm:table-cell">認可定員</th>
                <th className="text-right px-4 py-2.5 font-medium hidden sm:table-cell">出生数</th>
                <th className="text-center px-4 py-2.5 font-medium">難易度</th>
                <th className="text-left px-4 py-2.5 font-medium hidden md:table-cell w-40">5年変化</th>
              </tr>
            </thead>
            <tbody>
              {sorted.map((item, idx) => {
                const diff        = DIFFICULTY_CONFIG[item.difficulty]
                const barVal      = sortKey === 'waiting'  ? item.total_waiting  / maxWaiting
                                  : sortKey === 'capacity' ? item.total_capacity / maxCapacity
                                  : item.birth_latest / maxBirth
                const changeColor = item.waiting_change_5y < 0 ? 'text-green-600'
                                  : item.waiting_change_5y > 0 ? 'text-red-500' : 'text-gray-400'
                const changeLabel = item.waiting_change_5y === 0 ? '±0'
                                  : item.waiting_change_5y > 0  ? `↑ +${item.waiting_change_5y}`
                                  : `↓ ${item.waiting_change_5y}`

                return (
                  <tr key={item.ward} className="border-t border-gray-50 hover:bg-gray-50 transition">
                    {/* 順位 */}
                    <td className="text-center px-4 py-3">
                      <span className={`text-xs font-bold ${idx < 3 && item.total_waiting > 0 ? 'text-red-500' : 'text-gray-400'}`}>
                        {idx + 1}
                      </span>
                    </td>
                    {/* 区名 */}
                    <td className="px-4 py-3 font-semibold text-gray-800">{item.ward}</td>
                    {/* 待機 + ミニバー */}
                    <td className="px-4 py-3 text-right">
                      <div className="flex items-center justify-end gap-2">
                        <div className="w-12 h-1.5 bg-gray-100 rounded-full overflow-hidden">
                          <div
                            className={`h-full rounded-full ${
                              item.difficulty === 'high' ? 'bg-red-400'
                              : item.difficulty === 'mid'  ? 'bg-yellow-400'
                              : 'bg-green-400'
                            }`}
                            style={{ width: `${barVal * 100}%` }}
                          />
                        </div>
                        <span className="tabular-nums font-semibold text-gray-900 w-8 text-right">
                          {item.total_waiting}
                        </span>
                        <span className="text-xs text-gray-400">名</span>
                      </div>
                    </td>
                    {/* 認可定員 */}
                    <td className="px-3 py-3 text-right text-gray-600 tabular-nums hidden sm:table-cell">
                      {item.total_capacity.toLocaleString()}
                      <span className="text-xs text-gray-400 ml-0.5">名</span>
                    </td>
                    {/* 出生数 */}
                    <td className="px-4 py-3 text-right text-gray-600 tabular-nums hidden sm:table-cell">
                      {item.birth_latest.toLocaleString()}
                      <span className="text-xs text-gray-400 ml-0.5">人</span>
                    </td>
                    {/* 難易度 */}
                    <td className="px-4 py-3 text-center">
                      <span className={`inline-flex items-center gap-1 text-xs font-bold px-2 py-0.5 rounded-full ${diff.bg} ${diff.color}`}>
                        {diff.dot} {diff.label}
                      </span>
                    </td>
                    {/* 5年変化 */}
                    <td className={`px-4 py-3 text-xs font-semibold hidden md:table-cell ${changeColor}`}>
                      {changeLabel}
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
          <p className="px-5 pb-3 pt-2 text-[10px] text-gray-300">
            ※ 2024年度4月1日時点データ（こども家庭庁・東京都統計局）。5年変化は2020→2024年の待機児童数の差。
          </p>
        </div>
      )}
    </div>
  )
}
