'use client'

import type { CompareRow } from '@/lib/compare'

// ─── 定数 ────────────────────────────────────────────────────────────────────

const LAYER_CONFIG: Record<string, { label: string; badge: string }> = {
  national: { label: '国',       badge: 'bg-blue-100 text-blue-700' },
  tokyo:    { label: '東京都',   badge: 'bg-purple-100 text-purple-700' },
  pref:     { label: '都道府県', badge: 'bg-violet-100 text-violet-700' },
  ward:     { label: '市区町村', badge: 'bg-emerald-100 text-emerald-700' },
}

const AREA_HEADER_COLORS = [
  'bg-blue-600',
  'bg-violet-600',
  'bg-emerald-600',
]

// ─── 金額セル ────────────────────────────────────────────────────────────────

function AmountCell({
  monthly_amount,
  lump_amount,
  amount_note,
  apply_url,
}: {
  monthly_amount: number
  lump_amount: number | null
  amount_note: string | null
  apply_url: string | null
}) {
  const hasMonthly = monthly_amount > 0
  const hasLump    = lump_amount != null && lump_amount > 0
  const isService  = !hasMonthly && !hasLump

  return (
    <div className="space-y-1 text-center">
      {isService ? (
        <span className="text-xs text-gray-400 italic">サービス支援</span>
      ) : (
        <>
          {hasMonthly && (
            <div className="text-emerald-700 font-bold text-sm leading-tight">
              月{monthly_amount.toLocaleString('ja-JP')}円
            </div>
          )}
          {hasLump && (
            <div className="text-blue-700 font-bold text-sm leading-tight">
              一時{lump_amount!.toLocaleString('ja-JP')}円
            </div>
          )}
        </>
      )}
      {amount_note && (
        <div className="text-xs text-gray-400 leading-snug">{amount_note}</div>
      )}
      {apply_url && (
        <a
          href={apply_url}
          target="_blank"
          rel="noopener noreferrer"
          className="inline-block text-xs text-blue-500 hover:text-blue-700 underline mt-0.5"
        >
          詳細 →
        </a>
      )}
    </div>
  )
}

// ─── 合計サマリカード ─────────────────────────────────────────────────────────

function SummaryCard({
  label,
  colorClass,
  rows,
  colIndex,
}: {
  label: string
  colorClass: string
  rows: CompareRow[]
  colIndex: number
}) {
  const cells = rows.flatMap(r => (r.cells[colIndex] ? [r.cells[colIndex]!] : []))
  const annualTotal = cells.reduce((s, c) => s + (c.monthly_amount ?? 0) * 12, 0)
  const lumpTotal   = cells.reduce((s, c) => s + (c.lump_amount ?? 0), 0)
  const count       = cells.length

  return (
    <div className="bg-white border border-gray-200 rounded-2xl overflow-hidden shadow-sm">
      <div className={`${colorClass} text-white text-center text-sm font-bold py-2.5 px-3`}>
        {label}
      </div>
      <div className="p-4 text-center space-y-1">
        <div className="text-xs text-gray-400">年間受給額（月額換算合計）</div>
        <div className="text-emerald-700 font-extrabold text-xl">
          ¥{annualTotal.toLocaleString('ja-JP')}
        </div>
        {lumpTotal > 0 && (
          <>
            <div className="text-xs text-gray-400 pt-1">一時金合計</div>
            <div className="text-blue-700 font-bold text-base">
              ¥{lumpTotal.toLocaleString('ja-JP')}
            </div>
          </>
        )}
        <div className="text-xs text-gray-400 pt-1">対象制度 {count}件</div>
      </div>
    </div>
  )
}

// ─── メインコンポーネント ──────────────────────────────────────────────────────

interface AreaLabel {
  prefecture: string
  ward: string
}

interface Props {
  rows:        CompareRow[]
  areaLabels:  AreaLabel[]
  userSummary: string
}

export default function CompareTable({ rows, areaLabels, userSummary }: Props) {
  // 全エリア共通行 / 一部のみの行
  const commonRows  = rows.filter(r => r.cells.every(c => c !== null))
  const partialRows = rows.filter(r => !r.cells.every(c => c !== null))

  const colCount = areaLabels.length

  return (
    <div>
      {/* 比較条件バナー */}
      <div className="bg-violet-50 border border-violet-200 rounded-xl px-4 py-3 mb-5 text-sm text-violet-800 flex gap-2 items-center">
        <span>⚖️</span>
        <span><span className="font-semibold">比較条件：</span>{userSummary}</span>
      </div>

      {/* 合計サマリ */}
      <div
        className="grid gap-3 mb-6"
        style={{ gridTemplateColumns: `repeat(${colCount}, 1fr)` }}
      >
        {areaLabels.map((label, i) => (
          <SummaryCard
            key={i}
            label={`${label.prefecture}\n${label.ward}`}
            colorClass={AREA_HEADER_COLORS[i] ?? 'bg-gray-500'}
            rows={rows}
            colIndex={i}
          />
        ))}
      </div>

      {/* 凡例 */}
      <div className="flex flex-wrap gap-4 mb-3 text-xs text-gray-500">
        <span className="flex items-center gap-1.5">
          <span className="w-3 h-3 rounded bg-green-100 border border-green-300 inline-block" />
          全エリア共通制度 （{commonRows.length}件）
        </span>
        <span className="flex items-center gap-1.5">
          <span className="w-3 h-3 rounded bg-amber-50 border border-amber-200 inline-block" />
          一部エリア固有制度 （{partialRows.length}件）
        </span>
        <span className="text-gray-400">　― = 対象外 / 制度なし</span>
      </div>

      {/* 比較表（横スクロール） */}
      <div className="overflow-x-auto rounded-2xl border border-gray-100 shadow-sm">
        <table className="w-full border-collapse" style={{ minWidth: `${180 + 70 + colCount * 150}px` }}>
          {/* ヘッダー */}
          <thead>
            <tr>
              {/* 制度名列（sticky） */}
              <th className="sticky left-0 z-10 bg-gray-700 text-white text-left px-4 py-3 text-xs font-semibold w-48 border-r border-gray-600">
                制度名
              </th>
              {/* 層列 */}
              <th className="bg-gray-700 text-white text-center px-3 py-3 text-xs font-semibold w-16">
                層
              </th>
              {/* エリア列 */}
              {areaLabels.map((label, i) => (
                <th
                  key={i}
                  className={`${AREA_HEADER_COLORS[i] ?? 'bg-gray-500'} text-white text-center px-4 py-3 text-xs font-semibold border-l border-white/20`}
                >
                  <div>{label.prefecture}</div>
                  <div className="text-sm font-bold mt-0.5">{label.ward}</div>
                </th>
              ))}
            </tr>
          </thead>

          <tbody>
            {rows.length === 0 ? (
              <tr>
                <td colSpan={2 + colCount} className="text-center py-16 text-gray-400">
                  <div className="text-4xl mb-3">🔍</div>
                  <div>該当する制度が見つかりませんでした</div>
                </td>
              </tr>
            ) : (
              rows.map((row, rowIdx) => {
                const isCommon = row.cells.every(c => c !== null)
                const layerCfg = LAYER_CONFIG[row.layer] ?? LAYER_CONFIG.ward
                const rowBg    = isCommon ? 'bg-green-50/50' : 'bg-white'

                return (
                  <tr
                    key={`${row.name}-${rowIdx}`}
                    className={`border-b border-gray-100 hover:brightness-95 transition-all ${rowBg}`}
                  >
                    {/* 制度名（sticky） */}
                    <td
                      className={`sticky left-0 z-10 px-4 py-3 border-r border-gray-200 text-xs ${isCommon ? 'bg-green-50' : 'bg-white'}`}
                    >
                      <div className="font-semibold text-gray-900 leading-snug">{row.name}</div>
                      {row.category && (
                        <div className="text-gray-400 mt-0.5">{row.category}</div>
                      )}
                    </td>

                    {/* 層バッジ */}
                    <td className="px-3 py-3 text-center">
                      <span className={`text-xs font-semibold px-2 py-0.5 rounded-full ${layerCfg.badge}`}>
                        {layerCfg.label}
                      </span>
                    </td>

                    {/* 各エリアのセル */}
                    {row.cells.map((cell, colIdx) => (
                      <td
                        key={colIdx}
                        className="px-4 py-3 border-l border-gray-100 align-middle"
                      >
                        {cell === null ? (
                          <div className="text-center text-gray-300 font-medium text-lg">―</div>
                        ) : (
                          <AmountCell
                            monthly_amount={cell.monthly_amount}
                            lump_amount={cell.lump_amount}
                            amount_note={cell.amount_note}
                            apply_url={cell.apply_url}
                          />
                        )}
                      </td>
                    ))}
                  </tr>
                )
              })
            )}
          </tbody>
        </table>
      </div>

      {/* 注意書き */}
      <p className="text-xs text-gray-400 mt-4 text-center">
        ※ 金額は概算です。実際の受給額・申請要件は各自治体の公式情報をご確認ください。
      </p>
    </div>
  )
}
