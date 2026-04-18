'use client'

import { useState, useMemo } from 'react'
import MansionList from '@/components/MansionList'
import MansionMap  from '@/components/MansionMap'
import {
  getMansionsByWard,
  getMansionWards,
  WARD_ORDER,
  type MansionFilter,
  type MansionStatus,
} from '@/lib/mansions'

type View = 'list' | 'map'

const ALL_STATUSES: MansionStatus[] = ['建築予定', '建築中', '分譲中']

const STATUS_CHIP: Record<MansionStatus, { color: string; active: string }> = {
  '建築予定': { color: 'border-blue-300 text-blue-700',   active: 'bg-blue-600 border-blue-600 text-white' },
  '建築中':   { color: 'border-orange-300 text-orange-600', active: 'bg-orange-500 border-orange-500 text-white' },
  '分譲中':   { color: 'border-green-300 text-green-700',  active: 'bg-green-600 border-green-600 text-white' },
}

// seedにデータがある区（mansionWardsと全23区の両方をセレクターに表示）
const ALL_WARDS = WARD_ORDER

export default function MansionTab() {
  // 区選択（デフォルト: seedにデータがある最初の区）
  const availableWards  = useMemo(() => getMansionWards(), [])
  const [ward, setWard] = useState<string>(availableWards[0] ?? ALL_WARDS[0])
  const [view, setView] = useState<View>('list')

  // フィルター状態
  const [selectedStatuses, setSelectedStatuses] = useState<MansionStatus[]>([...ALL_STATUSES])
  const [delivery, setDelivery] = useState<MansionFilter['delivery']>(null)
  const [units, setUnits]       = useState<MansionFilter['units']>(null)
  const [corridorOnly, setCorridorOnly] = useState(false)

  // フィルター適用後の物件一覧
  const filter: MansionFilter = {
    status:   selectedStatuses,
    delivery: delivery ?? undefined,
    units:    units ?? undefined,
    corridor: corridorOnly ? '内廊下' : null,
  }
  const mansions = useMemo(
    () => getMansionsByWard(ward, filter),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [ward, selectedStatuses, delivery, units, corridorOnly],
  )

  // ステータストグル
  const toggleStatus = (s: MansionStatus) => {
    setSelectedStatuses(prev =>
      prev.includes(s)
        ? prev.length > 1 ? prev.filter(x => x !== s) : prev  // 最低1つは選択
        : [...prev, s],
    )
  }

  const hasData = availableWards.includes(ward)

  return (
    <div className="space-y-4">
      {/* 免責事項 */}
      <div className="bg-amber-50 border border-amber-200 rounded-xl px-4 py-3 text-xs text-amber-800 flex gap-2">
        <span className="shrink-0">⚠️</span>
        <span>
          各デベロッパー公式サイトをもとに表示（月次更新）。
          価格・仕様は変更になる場合があります。最新情報は各物件の公式ページをご確認ください。
        </span>
      </div>

      {/* 区セレクター */}
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-4">
        <label className="block text-xs font-semibold text-gray-600 mb-2">
          🏙️ エリアを選択
        </label>
        <select
          value={ward}
          onChange={e => setWard(e.target.value)}
          className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-indigo-300"
        >
          {ALL_WARDS.map(w => (
            <option key={w} value={w}>
              {w}{!availableWards.includes(w) ? '（準備中）' : ''}
            </option>
          ))}
        </select>
      </div>

      {/* フィルターバー */}
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm px-4 py-3 space-y-3">
        <p className="text-xs font-semibold text-gray-500">絞り込み</p>

        {/* ステータス */}
        <div className="flex flex-wrap gap-2">
          {ALL_STATUSES.map(s => {
            const isActive = selectedStatuses.includes(s)
            const c = STATUS_CHIP[s]
            return (
              <button
                key={s}
                onClick={() => toggleStatus(s)}
                className={`text-xs font-semibold px-3 py-1 rounded-full border transition-all ${
                  isActive ? c.active : `bg-white ${c.color} hover:opacity-70`
                }`}
              >
                {s}
              </button>
            )
          })}
        </div>

        {/* 引渡時期 / 総戸数 / 内廊下 */}
        <div className="flex flex-wrap gap-2 items-center">
          <select
            value={delivery ?? ''}
            onChange={e => setDelivery((e.target.value as MansionFilter['delivery']) || null)}
            className="text-xs border border-gray-200 rounded-lg px-2.5 py-1.5 bg-white focus:outline-none focus:ring-1 focus:ring-indigo-300"
          >
            <option value="">引渡時期：全て</option>
            <option value="before2026">〜2025年</option>
            <option value="2026">2026年</option>
            <option value="2027">2027年</option>
            <option value="2028plus">2028年以降</option>
          </select>

          <select
            value={units ?? ''}
            onChange={e => setUnits((e.target.value as MansionFilter['units']) || null)}
            className="text-xs border border-gray-200 rounded-lg px-2.5 py-1.5 bg-white focus:outline-none focus:ring-1 focus:ring-indigo-300"
          >
            <option value="">総戸数：全て</option>
            <option value="small">〜30戸</option>
            <option value="mid">31〜80戸</option>
            <option value="large">81戸以上</option>
          </select>

          <button
            onClick={() => setCorridorOnly(v => !v)}
            className={`text-xs font-semibold px-3 py-1.5 rounded-lg border transition-all ${
              corridorOnly
                ? 'bg-indigo-600 border-indigo-600 text-white'
                : 'bg-white border-gray-200 text-gray-600 hover:border-indigo-300'
            }`}
          >
            内廊下のみ
          </button>

          {/* リセット */}
          {(delivery || units || corridorOnly || selectedStatuses.length < 3) && (
            <button
              onClick={() => {
                setSelectedStatuses([...ALL_STATUSES])
                setDelivery(null)
                setUnits(null)
                setCorridorOnly(false)
              }}
              className="text-xs text-gray-400 hover:text-gray-600 underline"
            >
              リセット
            </button>
          )}
        </div>
      </div>

      {/* ビュートグル */}
      <div className="flex rounded-xl bg-gray-100 p-1 gap-1">
        {([
          { key: 'list', icon: '📋', label: '一覧表' },
          { key: 'map',  icon: '🗺️', label: 'マップ' },
        ] as { key: View; icon: string; label: string }[]).map(btn => (
          <button
            key={btn.key}
            onClick={() => setView(btn.key)}
            className={`flex-1 flex items-center justify-center gap-1.5 py-2 px-3 rounded-lg text-xs font-semibold transition-all ${
              view === btn.key
                ? 'bg-white shadow text-gray-900'
                : 'text-gray-500 hover:text-gray-700'
            }`}
          >
            <span>{btn.icon}</span>
            <span>{btn.label}</span>
          </button>
        ))}
      </div>

      {/* コンテンツ */}
      {!hasData ? (
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm py-16 text-center text-gray-400">
          <div className="text-4xl mb-3">🏗️</div>
          <p className="text-sm font-medium">{ward}のデータは現在準備中です</p>
          <p className="text-xs mt-1">月次更新でデータを追加予定</p>
        </div>
      ) : view === 'list' ? (
        <MansionList mansions={mansions} />
      ) : (
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
          {/* マップヘッダー */}
          <div className="px-5 py-3 border-b border-gray-50 flex items-center justify-between">
            <span className="text-xs text-gray-500">
              <span className="font-bold text-gray-800 text-sm">{mansions.length}</span> 件を地図表示
            </span>
            <span className="text-[10px] text-gray-300">OpenStreetMap</span>
          </div>
          <MansionMap mansions={mansions} />
        </div>
      )}

      <p className="text-[10px] text-gray-300 text-center px-4">
        ※ 各デベロッパー公式サイトから収集。価格・間取りは掲載していません。データは月次更新。
      </p>
    </div>
  )
}
