'use client'

import Link from 'next/link'
import { STATUS_CONFIG, type MansionRecord } from '@/lib/mansions'

interface Props {
  mansions: MansionRecord[]
}

// =============================================
// 属性行の定義（行 = 属性、列 = 物件）
// =============================================

type RowDef = {
  label:  string
  render: (m: MansionRecord) => React.ReactNode
}

const ROWS: RowDef[] = [
  {
    label:  'ステータス',
    render: m => <StatusBadge status={m.status} />,
  },
  {
    label:  'デベロッパー',
    render: m => (
      <span className="text-xs leading-relaxed">
        {m.developers.join(' /\n')}
      </span>
    ),
  },
  {
    label:  '住所',
    render: m => <span className="text-xs">{m.address || '—'}</span>,
  },
  {
    label:  '階数',
    render: m => m.floors ? `${m.floors}階建て` : '—',
  },
  {
    label:  '総戸数',
    render: m => m.total_units ? (
      <span className="font-semibold">{m.total_units.toLocaleString()}<span className="font-normal text-gray-400 ml-0.5">戸</span></span>
    ) : '—',
  },
  {
    label:  '敷地面積',
    render: m => m.site_area ? `${m.site_area.toLocaleString()}㎡` : '—',
  },
  {
    label:  '専有面積',
    render: m => {
      if (m.area_min && m.area_max) return `${m.area_min}〜${m.area_max}㎡`
      if (m.area_min) return `${m.area_min}㎡〜`
      return '—'
    },
  },
  {
    label:  '建物竣工',
    render: m => <span className="text-xs">{m.completion || '—'}</span>,
  },
  {
    label:  '引渡',
    render: m => <span className="text-xs">{m.delivery || '—'}</span>,
  },
  {
    label:  '施工会社',
    render: m => m.constructor || '—',
  },
  {
    label:  '駐車場',
    render: m => <span className="text-xs">{m.parking || '—'}</span>,
  },
  {
    label:  '駐輪場',
    render: m => m.bicycle_parking ? `${m.bicycle_parking}台` : '—',
  },
  {
    label:  '天井高',
    render: m => m.ceiling_height || '—',
  },
  {
    label:  '工法',
    render: m => m.floor_method || '—',
  },
  {
    label:  'ディスポーザー',
    render: m => m.disposer === true ? '✅ 有り' : m.disposer === false ? '無し' : '—',
  },
  {
    label:  'ZEH・低炭素',
    render: m => m.eco_type ? (
      <span className="text-[11px] font-semibold bg-green-50 text-green-700 px-2 py-0.5 rounded-full">
        🌿 {m.eco_type}
      </span>
    ) : '—',
  },
  {
    label:  '廊下タイプ',
    render: m => m.corridor || '—',
  },
]

// =============================================
// メインコンポーネント
// =============================================

export default function MansionList({ mansions }: Props) {
  if (mansions.length === 0) {
    return (
      <div className="text-center py-16 text-gray-400 text-sm">
        <div className="text-4xl mb-3">🏢</div>
        <p>条件に合う物件が見つかりませんでした</p>
        <p className="text-xs mt-1">フィルターを変更してお試しください</p>
      </div>
    )
  }

  return (
    <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
      {/* 件数バッジ */}
      <div className="px-5 py-3 border-b border-gray-50 flex items-center justify-between">
        <span className="text-xs text-gray-500">
          <span className="font-bold text-gray-800 text-sm">{mansions.length}</span> 件
        </span>
        <span className="text-[10px] text-gray-300">← 横スクロールで全物件を表示</span>
      </div>

      {/* 横スクロールテーブル */}
      <div className="overflow-x-auto">
        <table className="border-collapse text-sm" style={{ minWidth: `${180 + mansions.length * 168}px` }}>
          {/* ヘッダー行：物件名 */}
          <thead>
            <tr className="bg-gray-50 border-b border-gray-200">
              {/* 左固定ラベル列 */}
              <th
                className="sticky left-0 z-20 bg-gray-50 text-left px-4 py-3 text-xs font-medium text-gray-400 border-r border-gray-200"
                style={{ minWidth: '112px', maxWidth: '112px' }}
              >
                項目
              </th>
              {/* 物件ヘッダー */}
              {mansions.map(m => {
                const sc = STATUS_CONFIG[m.status]
                return (
                  <th
                    key={m.id}
                    className="text-left px-3 py-3 font-semibold text-gray-800 border-r border-gray-100 last:border-r-0 align-top"
                    style={{ minWidth: '168px', maxWidth: '168px' }}
                  >
                    <div className="text-xs font-bold text-gray-800 leading-snug line-clamp-2 mb-1.5">
                      {m.name}
                    </div>
                    <span className={`inline-flex items-center gap-1 text-[11px] font-bold px-2 py-0.5 rounded-full ${sc.bg} ${sc.color}`}>
                      {sc.pin} {sc.label}
                    </span>
                  </th>
                )
              })}
            </tr>
          </thead>

          {/* 属性行 */}
          <tbody>
            {ROWS.map((row, ri) => (
              <tr
                key={row.label}
                className={`border-b border-gray-50 ${ri % 2 === 0 ? 'bg-white' : 'bg-gray-50/40'}`}
              >
                {/* 左固定：属性ラベル */}
                <td
                  className={`sticky left-0 z-10 px-4 py-2.5 text-xs font-semibold text-gray-500 border-r border-gray-200 ${ri % 2 === 0 ? 'bg-white' : 'bg-gray-50'}`}
                  style={{ minWidth: '112px', maxWidth: '112px' }}
                >
                  {row.label}
                </td>
                {/* 各物件の値 */}
                {mansions.map(m => (
                  <td
                    key={m.id}
                    className="px-3 py-2.5 text-gray-700 border-r border-gray-50 last:border-r-0 align-top text-xs"
                    style={{ minWidth: '168px', maxWidth: '168px' }}
                  >
                    {row.render(m)}
                  </td>
                ))}
              </tr>
            ))}

            {/* 公式リンク行 */}
            <tr className="bg-gray-50 border-t border-gray-200">
              <td
                className="sticky left-0 z-10 bg-gray-50 px-4 py-3 text-xs font-semibold text-gray-500 border-r border-gray-200"
                style={{ minWidth: '112px', maxWidth: '112px' }}
              >
                公式ページ
              </td>
              {mansions.map(m => (
                <td
                  key={m.id}
                  className="px-3 py-3 border-r border-gray-100 last:border-r-0"
                  style={{ minWidth: '168px', maxWidth: '168px' }}
                >
                  <Link
                    href={m.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-1 text-[11px] font-semibold text-blue-600 hover:text-blue-800 bg-blue-50 hover:bg-blue-100 px-2.5 py-1 rounded-lg transition"
                  >
                    詳細を見る →
                  </Link>
                  <div className="text-[10px] text-gray-300 mt-1">更新: {m.updated_at}</div>
                </td>
              ))}
            </tr>
          </tbody>
        </table>
      </div>
    </div>
  )
}

// =============================================
// ステータスバッジ
// =============================================

function StatusBadge({ status }: { status: MansionRecord['status'] }) {
  const sc = STATUS_CONFIG[status]
  return (
    <span className={`inline-flex items-center gap-1 text-[11px] font-bold px-2 py-0.5 rounded-full ${sc.bg} ${sc.color}`}>
      {sc.pin} {sc.label}
    </span>
  )
}
