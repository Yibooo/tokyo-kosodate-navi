'use client'

import { useState, useEffect } from 'react'
import SearchForm from '@/components/SearchForm'
import Link from 'next/link'
import { NurseryCompareView, NurseryRankingView } from '@/components/NurseryViews'
import MansionTab from '@/components/MansionTab'
import {
  SUPPORTED_WARDS,
  DIFFICULTY_CONFIG,
  type NurseryData,
  type TrendRow,
} from '@/lib/childcare'

type NurseryView = 'single' | 'compare' | 'ranking'
type Tab = 'subsidy' | 'nursery' | 'mansion'

// =============================================
// メインコンポーネント：ホームタブ切替
// =============================================

export default function HomeTab() {
  const [tab, setTab] = useState<Tab>('mansion')

  // URLハッシュでタブ状態を保持（リロード耐性）
  useEffect(() => {
    if (window.location.hash === '#nursery') setTab('nursery')
    if (window.location.hash === '#mansion') setTab('mansion')
  }, [])

  const switchTab = (t: Tab) => {
    setTab(t)
    const hash = t === 'nursery' ? '#nursery' : t === 'mansion' ? '#mansion' : '#'
    history.replaceState(null, '', hash)
  }

  return (
    <div className="max-w-2xl mx-auto">
      {/* タブバー */}
      <div className="flex rounded-2xl bg-gray-100 p-1 mb-6 gap-1">
        <TabButton
          active={tab === 'mansion'}
          onClick={() => switchTab('mansion')}
          icon="🏢"
          label="新築マンション"
        />
        <TabButton
          active={tab === 'subsidy'}
          onClick={() => switchTab('subsidy')}
          icon="💴"
          label="補助金"
        />
        <TabButton
          active={tab === 'nursery'}
          onClick={() => switchTab('nursery')}
          icon="🏫"
          label="保育園"
          beta
        />
      </div>

      {/* タブコンテンツ */}
      {tab === 'subsidy' && <SubsidyPanel />}
      {tab === 'nursery' && <NurseryPanel />}
      {tab === 'mansion' && <MansionTab />}
    </div>
  )
}

// =============================================
// タブボタン
// =============================================

function TabButton({
  active, onClick, icon, label, beta,
}: {
  active: boolean
  onClick: () => void
  icon: string
  label: string
  beta?: boolean
}) {
  return (
    <button
      onClick={onClick}
      className={`flex-1 flex items-center justify-center gap-1.5 py-2.5 px-3 rounded-xl text-sm font-semibold transition-all
        ${active
          ? 'bg-white shadow text-gray-900'
          : 'text-gray-500 hover:text-gray-700'
        }`}
    >
      <span>{icon}</span>
      <span>{label}</span>
      {beta && (
        <span className="text-[10px] font-bold bg-amber-100 text-amber-600 px-1.5 py-0.5 rounded-full leading-none">
          β
        </span>
      )}
    </button>
  )
}

// =============================================
// 補助金タブ（既存の SearchForm をそのまま使用）
// =============================================

function SubsidyPanel() {
  return (
    <>
      <div className="bg-white rounded-2xl shadow-xl border border-gray-100 p-6 sm:p-8">
        <SearchForm />
      </div>
      <div className="mt-4 text-center">
        <Link
          href="/compare"
          className="inline-flex items-center gap-2 bg-violet-600 hover:bg-violet-700 text-white font-bold px-6 py-3 rounded-xl text-sm transition shadow-md hover:shadow-lg"
        >
          <span>⚖️</span> 複数エリアを比較する →
        </Link>
        <p className="text-xs text-gray-400 mt-2">2〜3つのエリアの支援制度を並べて比較できます</p>
      </div>
    </>
  )
}

// =============================================
// 保育園情報タブ
// =============================================

function NurseryPanel() {
  const [view, setView] = useState<NurseryView>('single')

  const VIEW_BTNS: { key: NurseryView; icon: string; label: string }[] = [
    { key: 'single',  icon: '🏠', label: '単区詳細' },
    { key: 'compare', icon: '⚖️', label: 'エリア比較' },
    { key: 'ranking', icon: '🏆', label: '全区ランキング' },
  ]

  return (
    <div className="space-y-4">
      {/* 免責事項 */}
      <div className="bg-amber-50 border border-amber-200 rounded-xl px-4 py-3 text-xs text-amber-800 flex gap-2">
        <span className="shrink-0">⚠️</span>
        <span>
          2024年度データ（こども家庭庁・東京都統計局）をもとに表示。
          2020〜2023年の定員は推計値を含みます。最新情報は各区の保育課にご確認ください。
        </span>
      </div>

      {/* ビュートグル */}
      <div className="flex rounded-xl bg-gray-100 p-1 gap-1">
        {VIEW_BTNS.map(btn => (
          <button
            key={btn.key}
            onClick={() => setView(btn.key)}
            className={`flex-1 flex items-center justify-center gap-1 py-2 px-2 rounded-lg text-xs font-semibold transition-all
              ${view === btn.key
                ? 'bg-white shadow text-gray-900'
                : 'text-gray-500 hover:text-gray-700'
              }`}
          >
            <span>{btn.icon}</span>
            <span className="hidden sm:inline">{btn.label}</span>
            <span className="sm:hidden">{btn.label.slice(0, 4)}</span>
          </button>
        ))}
      </div>

      {/* ビュー切替 */}
      {view === 'single'  && <SingleWardView />}
      {view === 'compare' && <NurseryCompareView />}
      {view === 'ranking' && <NurseryRankingView />}
    </div>
  )
}

// =============================================
// 単区詳細ビュー（旧 NurseryPanel のコンテンツ）
// =============================================

function SingleWardView() {
  const [ward, setWard]       = useState(SUPPORTED_WARDS[0])
  const [data, setData]       = useState<NurseryData | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError]     = useState<string | null>(null)

  useEffect(() => {
    let cancelled = false
    setLoading(true)
    setError(null)

    import('@/lib/childcare').then(({ getNurseryData }) =>
      getNurseryData(ward)
    ).then(result => {
      if (cancelled) return
      setData(result)
      setLoading(false)
    }).catch(() => {
      if (cancelled) return
      setError('データの取得に失敗しました')
      setLoading(false)
    })

    return () => { cancelled = true }
  }, [ward])

  return (
    <div className="space-y-4">
      {/* 区セレクト */}
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-4">
        <label className="block text-xs font-semibold text-gray-600 mb-2">
          🏠 お住まいの区を選択
        </label>
        <select
          value={ward}
          onChange={e => setWard(e.target.value)}
          className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-blue-300"
        >
          {SUPPORTED_WARDS.map(w => (
            <option key={w} value={w}>{w}</option>
          ))}
        </select>
      </div>

      {loading && (
        <div className="text-center py-12 text-gray-400 text-sm">
          <div className="text-3xl mb-3 animate-pulse">🏫</div>
          データを読み込み中...
        </div>
      )}

      {error && (
        <div className="text-center py-8 text-red-500 text-sm">{error}</div>
      )}

      {data && !loading && (
        <>
          <FacilitySection data={data} />
          <WaitingSection data={data} />
          <TrendSection data={data} />
        </>
      )}
    </div>
  )
}

// =============================================
// セクション① 施設数・定員
// =============================================

function FacilitySection({ data }: { data: NurseryData }) {
  const { facility } = data

  return (
    <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
      <div className="px-5 py-4 border-b border-gray-50 flex items-center justify-between">
        <h2 className="font-bold text-gray-800 flex items-center gap-2">
          <span>📊</span> 施設数・収容定員
        </h2>
        <span className="text-xs text-gray-400">{facility.fiscal_year}年度</span>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="bg-gray-50 text-xs text-gray-500">
              <th className="text-left px-5 py-2.5 font-medium">施設種別</th>
              <th className="text-right px-4 py-2.5 font-medium">施設数</th>
              <th className="text-right px-5 py-2.5 font-medium">定員</th>
            </tr>
          </thead>
          <tbody>
            {facility.rows.map(row => (
              <tr key={row.category} className="border-t border-gray-50">
                <td className="px-5 py-3 text-gray-700 font-medium">{row.category}</td>
                <td className="px-4 py-3 text-right text-gray-600">
                  {row.count.toLocaleString()}
                  <span className="text-xs text-gray-400 ml-0.5">施設</span>
                  {row.estimated && (
                    <span className="text-[10px] text-gray-300 ml-1">推計</span>
                  )}
                </td>
                <td className="px-5 py-3 text-right text-gray-800 font-semibold">
                  {row.capacity.toLocaleString()}
                  <span className="text-xs text-gray-400 font-normal ml-0.5">名</span>
                </td>
              </tr>
            ))}
          </tbody>
          <tfoot>
            <tr className="border-t-2 border-gray-200 bg-gray-50">
              <td className="px-5 py-3 font-bold text-gray-800">合計</td>
              <td className="px-4 py-3 text-right font-semibold text-gray-700">
                {facility.total_count.toLocaleString()}
                <span className="text-xs text-gray-400 font-normal ml-0.5">施設</span>
              </td>
              <td className="px-5 py-3 text-right font-bold text-blue-700 text-base">
                {facility.total_capacity.toLocaleString()}
                <span className="text-xs text-gray-400 font-normal ml-0.5">名</span>
              </td>
            </tr>
          </tfoot>
        </table>
      </div>
      <p className="px-5 pb-3 text-[10px] text-gray-300">
        ※ 施設数は定員÷平均規模からの推計値。定員は{facility.fiscal_year}年度実データ（こども家庭庁）。
      </p>
    </div>
  )
}

// =============================================
// セクション② 待機児童
// =============================================

function WaitingSection({ data }: { data: NurseryData }) {
  const { waiting, application_ratio, difficulty } = data
  const diff = DIFFICULTY_CONFIG[difficulty]

  return (
    <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
      <div className="px-5 py-4 border-b border-gray-50 flex items-center justify-between">
        <h2 className="font-bold text-gray-800 flex items-center gap-2">
          <span>📋</span> 待機児童・入園難易度
        </h2>
        <span className="text-xs text-gray-400">{waiting.fiscal_year}年4月1日時点</span>
      </div>

      <div className="px-5 py-4">
        <div className="flex items-center justify-between gap-4">
          {/* 待機児童数 */}
          <div>
            <div className="text-xs text-gray-400 mb-0.5">待機児童数（国定義）</div>
            <div className="text-3xl font-extrabold text-gray-900">
              {waiting.total_waiting.toLocaleString()}
              <span className="text-base font-normal text-gray-400 ml-1">名</span>
            </div>
          </div>
          {/* 認可倍率バッジ */}
          <div className={`text-center px-5 py-3 rounded-xl ${diff.bg} shrink-0`}>
            <div className="text-2xl">{diff.dot}</div>
            <div className={`text-xs font-bold mt-0.5 ${diff.color}`}>
              入園難易度 {diff.label}
            </div>
            <div className={`text-[11px] font-semibold mt-0.5 ${diff.color}`}>
              認可倍率 {application_ratio.toFixed(2)}×
            </div>
          </div>
        </div>

        {/* 認可倍率の説明 */}
        <div className="mt-3 pt-3 border-t border-gray-50 text-xs text-gray-500 flex items-start gap-2 bg-blue-50 rounded-lg px-3 py-2">
          <span className="shrink-0">📐</span>
          <span>
            <span className="font-semibold">認可倍率</span>＝出生数 ÷（認可定員 ÷ 6）。
            1学年あたり定員に対する出生数の倍率。1.0超 = 競争あり、1.8以上 = 激戦。
          </span>
        </div>

        {waiting.total_hidden_waiting !== null && (
          <div className="mt-3 pt-3 border-t border-gray-50 text-sm text-gray-600 flex justify-between">
            <span>利用保留（隠れ待機）</span>
            <span className="font-semibold">
              {waiting.total_hidden_waiting.toLocaleString()}名
            </span>
          </div>
        )}

        <div className="mt-3 text-[11px] text-gray-400 bg-gray-50 rounded-lg px-3 py-2">
          💡 「待機児童」は特定の保育所のみ希望・育休延長希望等を除いた国定義の数値です。
          実態の入園難易度は利用保留を含めてご確認ください。
        </div>
      </div>
    </div>
  )
}

// =============================================
// セクション③ 5年トレンド
// =============================================

function TrendSection({ data }: { data: NurseryData }) {
  const { trend, trend_comment, ward } = data

  // 出生数の最大値（棒グラフの比率計算用）
  const maxBirth = Math.max(...trend.map(t => t.birth_count))

  return (
    <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
      <div className="px-5 py-4 border-b border-gray-50">
        <h2 className="font-bold text-gray-800 flex items-center gap-2">
          <span>📈</span> 5年間トレンド（2020〜2024年度）
        </h2>
      </div>

      {/* トレンドテーブル */}
      <div className="overflow-x-auto">
        <table className="w-full text-sm" style={{ minWidth: '540px' }}>
          <thead>
            <tr className="bg-gray-50 text-xs text-gray-500">
              <th className="text-left px-5 py-2.5 font-medium">年度</th>
              <th className="text-right px-4 py-2.5 font-medium">出生数</th>
              <th className="text-right px-4 py-2.5 font-medium">認可定員</th>
              <th className="text-right px-4 py-2.5 font-medium">認可倍率</th>
              <th className="text-right px-4 py-2.5 font-medium">待機児童</th>
              <th className="text-center px-4 py-2.5 font-medium">難易度</th>
            </tr>
          </thead>
          <tbody>
            {trend.map((row: TrendRow) => {
              const diff = DIFFICULTY_CONFIG[row.difficulty]
              const ratioColor = row.application_ratio >= 1.8 ? 'text-red-600'
                : row.application_ratio >= 1.3 ? 'text-yellow-600'
                : 'text-green-600'

              return (
                <tr key={row.fiscal_year} className="border-t border-gray-50 hover:bg-gray-50 transition">
                  <td className="px-5 py-3 font-semibold text-gray-700">
                    {row.fiscal_year}年
                  </td>
                  <td className="px-4 py-3 text-right">
                    {/* ミニ棒グラフ */}
                    <div className="flex items-center justify-end gap-2">
                      <div className="w-16 h-2 bg-gray-100 rounded-full overflow-hidden">
                        <div
                          className="h-full bg-blue-300 rounded-full"
                          style={{ width: `${(row.birth_count / maxBirth) * 100}%` }}
                        />
                      </div>
                      <span className="text-gray-600 tabular-nums w-14 text-right">
                        {row.birth_count.toLocaleString()}
                      </span>
                    </div>
                  </td>
                  <td className="px-4 py-3 text-right text-gray-600 tabular-nums">
                    {row.total_capacity.toLocaleString()}
                    {row.capacity_estimated && (
                      <span className="text-[10px] text-gray-300 ml-1">推</span>
                    )}
                  </td>
                  <td className={`px-4 py-3 text-right tabular-nums font-semibold text-sm ${ratioColor}`}>
                    {row.application_ratio.toFixed(2)}×
                  </td>
                  <td className="px-4 py-3 text-right font-semibold text-gray-800 tabular-nums">
                    {row.total_waiting}
                  </td>
                  <td className="px-4 py-3 text-center">
                    <span className={`inline-flex items-center gap-1 text-xs font-semibold px-2 py-0.5 rounded-full ${diff.bg} ${diff.color}`}>
                      {diff.dot} {diff.label}
                    </span>
                  </td>
                </tr>
              )
            })}
          </tbody>
        </table>
      </div>

      {/* 自動コメント */}
      <div className="mx-5 mb-5 mt-3 bg-blue-50 border border-blue-100 rounded-xl px-4 py-3 text-sm text-blue-800">
        <span className="font-semibold">📝 {ward}</span>：{trend_comment}
      </div>

      <p className="px-5 pb-4 text-[10px] text-gray-300">
        ※ 出生数は暦年（東京都統計局）。定員・待機児童はこども家庭庁4月1日時点データ。
        「推」マークは成長率からの推計値。
      </p>
    </div>
  )
}
