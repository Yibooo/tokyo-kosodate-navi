import Link from 'next/link'
import { getNurseryData, DIFFICULTY_CONFIG, SUPPORTED_WARDS } from '@/lib/childcare'

interface Props {
  ward: string
}

/**
 * /results ページ下部に表示する保育園情報スニペット。
 * 東京23区のみ対応。データがない区・近郊10市はnullを返し何も表示しない。
 */
export default async function NurserySnippet({ ward }: Props) {
  // 23区のみ対応
  if (!SUPPORTED_WARDS.includes(ward)) return null

  const data = await getNurseryData(ward)
  if (!data) return null

  const { facility, waiting, trend, difficulty, application_ratio } = data
  const diff = DIFFICULTY_CONFIG[difficulty]

  // 5年間の待機児童トレンド（改善 / 悪化 / 横ばい）
  const firstWaiting = trend[0]?.total_waiting ?? 0
  const lastWaiting  = trend[trend.length - 1]?.total_waiting ?? 0
  const trendArrow =
    lastWaiting < firstWaiting ? '↓ 改善傾向' :
    lastWaiting > firstWaiting ? '↑ 増加傾向' : '→ 横ばい'
  const trendColor =
    lastWaiting < firstWaiting ? 'text-green-600' :
    lastWaiting > firstWaiting ? 'text-red-500'   : 'text-gray-500'

  return (
    <div className="mt-8 bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
      {/* ヘッダー */}
      <div className="px-5 py-4 border-b border-gray-50 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <span className="text-lg">🏫</span>
          <h2 className="font-bold text-gray-800">{ward}の保育園情報</h2>
          <span className="text-[10px] font-bold bg-amber-100 text-amber-600 px-1.5 py-0.5 rounded-full">β</span>
        </div>
        <span className="text-xs text-gray-400">{facility.fiscal_year}年度データ</span>
      </div>

      {/* サマリー行 */}
      <div className="grid grid-cols-3 divide-x divide-gray-50">
        {/* 認可定員合計 */}
        <div className="px-4 py-4 text-center">
          <div className="text-xs text-gray-400 mb-1">認可定員合計</div>
          <div className="text-xl font-extrabold text-gray-900">
            {facility.total_capacity.toLocaleString()}
            <span className="text-xs font-normal text-gray-400 ml-0.5">名</span>
          </div>
          <div className="text-[10px] text-gray-400 mt-0.5">
            {facility.total_count}施設
          </div>
        </div>

        {/* 待機児童数 */}
        <div className="px-4 py-4 text-center">
          <div className="text-xs text-gray-400 mb-1">待機児童数</div>
          <div className="text-xl font-extrabold text-gray-900">
            {waiting.total_waiting.toLocaleString()}
            <span className="text-xs font-normal text-gray-400 ml-0.5">名</span>
          </div>
          <div className={`text-[10px] mt-0.5 font-medium ${diff.color}`}>
            {diff.dot} 入園難易度 {diff.label}
          </div>
          <div className={`text-[10px] mt-0.5 ${diff.color}`}>
            認可倍率 {application_ratio.toFixed(2)}×
          </div>
        </div>

        {/* 5年トレンド */}
        <div className="px-4 py-4 text-center">
          <div className="text-xs text-gray-400 mb-1">5年トレンド</div>
          <div className={`text-sm font-bold ${trendColor}`}>
            {trendArrow}
          </div>
          <div className="text-[10px] text-gray-400 mt-0.5">
            {trend[0]?.fiscal_year}→{trend[trend.length - 1]?.fiscal_year}年
          </div>
        </div>
      </div>

      {/* 施設内訳（コンパクト） */}
      <div className="px-5 py-3 bg-gray-50 border-t border-gray-100 flex flex-wrap gap-3">
        {facility.rows.map(row => (
          <div key={row.category} className="flex items-center gap-1.5 text-xs text-gray-600">
            <span className="w-1.5 h-1.5 rounded-full bg-blue-300 shrink-0" />
            <span>{row.category}</span>
            <span className="font-semibold text-gray-800">{row.capacity.toLocaleString()}名</span>
          </div>
        ))}
      </div>

      {/* フッター：詳細リンク */}
      <div className="px-5 py-3 border-t border-gray-100 flex items-center justify-between">
        <p className="text-[11px] text-gray-400">
          待機児童数・出生数の5年推移など詳細データはこちら
        </p>
        <Link
          href="/#nursery"
          className="inline-flex items-center gap-1 text-xs font-semibold text-blue-600 hover:text-blue-800 transition bg-blue-50 hover:bg-blue-100 px-3 py-1.5 rounded-lg"
        >
          詳細を見る →
        </Link>
      </div>
    </div>
  )
}
