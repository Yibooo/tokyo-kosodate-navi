import Link from 'next/link'
import { matchPolicies } from '@/lib/matcher'
import { buildCompareRows, type CompareAreaResult } from '@/lib/compare'
import CompareTable from '@/components/CompareTable'
import CompareForm from '@/components/CompareForm'

interface Props {
  searchParams: Promise<Record<string, string | undefined>>
}

export default async function ComparePage({ searchParams }: Props) {
  const params = await searchParams

  // URL パラメータからエリア情報を収集（pref1/ward1, pref2/ward2, pref3/ward3）
  const rawAreas: { prefecture: string; ward: string }[] = []
  for (let i = 1; i <= 3; i++) {
    const pref = params[`pref${i}`]
    const ward = params[`ward${i}`]
    if (pref && ward) rawAreas.push({ prefecture: pref, ward })
  }

  // エリアが2つ未満の場合はフォームを表示
  if (rawAreas.length < 2) {
    return <CompareFormPage initialAreas={rawAreas.length > 0 ? rawAreas : undefined} />
  }

  const birthdate   = params.birthdate   ?? ''
  const birth_order = params.birth_order ?? '1'
  const income      = params.income      ?? '500'

  if (!birthdate) {
    return <CompareFormPage initialAreas={rawAreas} />
  }

  // 各エリアの制度を取得
  let results: CompareAreaResult[]
  try {
    results = await Promise.all(
      rawAreas.map(async area => {
        const result = await matchPolicies({
          prefecture:   area.prefecture,
          ward:         area.ward,
          birthdate,
          birthOrder:   Number(birth_order),
          incomeManYen: Number(income),
        })
        return {
          prefecture: area.prefecture,
          ward:       area.ward,
          policies:   result.matched,
        }
      })
    )
  } catch (e) {
    const msg = e instanceof Error ? e.message : '不明なエラーが発生しました'
    return <ErrorView message={msg} />
  }

  const rows       = buildCompareRows(results)
  const areaLabels = results.map(r => ({ prefecture: r.prefecture, ward: r.ward }))

  // user_summary 文字列を生成（最初のエリアを基準に構築）
  const firstResult = await matchPolicies({
    prefecture:   rawAreas[0].prefecture,
    ward:         rawAreas[0].ward,
    birthdate,
    birthOrder:   Number(birth_order),
    incomeManYen: Number(income),
  })
  const userSummary = firstResult.user_summary

  // 再検索用パラメータ（フォームの初期値として使用）
  const initialAreas = rawAreas
  const initialBirthdate  = birthdate
  const initialBirthOrder = birth_order
  const initialIncome     = Number(income)

  return (
    <div className="min-h-screen bg-gradient-to-b from-violet-50 via-white to-slate-50">
      {/* ナビゲーション */}
      <nav className="border-b border-violet-100 bg-white/80 backdrop-blur-sm sticky top-0 z-10">
        <div className="max-w-5xl mx-auto px-4 py-3 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="text-2xl">🍼</span>
            <Link href="/" className="font-bold text-blue-700 text-lg hover:text-blue-900 transition">子育て支援ナビ</Link>
            <span className="text-gray-300 mx-1">›</span>
            <span className="text-violet-700 font-semibold text-sm">エリア比較</span>
          </div>
          <Link href="/" className="text-sm text-blue-600 hover:text-blue-800 font-medium">
            ← トップへ
          </Link>
        </div>
      </nav>

      <main className="max-w-5xl mx-auto px-4 py-8">
        {/* 条件変更フォーム（折りたたみ） */}
        <details className="bg-white rounded-2xl border border-gray-100 shadow-sm mb-6">
          <summary className="px-5 py-4 cursor-pointer text-sm font-semibold text-gray-700 flex items-center gap-2 select-none hover:bg-gray-50 rounded-2xl transition">
            <span>⚙️</span> 比較条件を変更する
          </summary>
          <div className="px-5 pb-5 pt-1 border-t border-gray-100">
            <CompareForm
              initialAreas={initialAreas}
              initialBirthdate={initialBirthdate}
              initialBirthOrder={initialBirthOrder}
              initialIncome={initialIncome}
            />
          </div>
        </details>

        {/* 比較テーブル */}
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5 sm:p-6">
          <h1 className="text-lg font-bold text-gray-900 mb-5 flex items-center gap-2">
            <span>⚖️</span> エリア別支援制度 比較表
          </h1>
          <CompareTable
            rows={rows}
            areaLabels={areaLabels}
            userSummary={userSummary}
          />
        </div>
      </main>

      <footer className="text-center text-xs text-gray-400 py-8 border-t border-gray-100 mt-8">
        © 2026 子育て支援ナビ　|　最新情報は各自治体にご確認ください。
      </footer>
    </div>
  )
}

// ─── エリア未指定時のフォームページ ────────────────────────────────────────────

function CompareFormPage({ initialAreas }: { initialAreas?: { prefecture: string; ward: string }[] }) {
  return (
    <div className="min-h-screen bg-gradient-to-b from-violet-50 via-white to-slate-50">
      <nav className="border-b border-violet-100 bg-white/80 backdrop-blur-sm sticky top-0 z-10">
        <div className="max-w-5xl mx-auto px-4 py-3 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="text-2xl">🍼</span>
            <Link href="/" className="font-bold text-blue-700 text-lg hover:text-blue-900 transition">子育て支援ナビ</Link>
            <span className="text-gray-300 mx-1">›</span>
            <span className="text-violet-700 font-semibold text-sm">エリア比較</span>
          </div>
          <Link href="/" className="text-sm text-blue-600 hover:text-blue-800 font-medium">
            ← トップへ
          </Link>
        </div>
      </nav>

      <main className="max-w-2xl mx-auto px-4 py-10">
        <div className="text-center mb-8">
          <div className="inline-flex items-center gap-2 bg-violet-100 text-violet-700 text-sm font-medium px-4 py-1.5 rounded-full mb-4">
            <span>⚖️</span> エリア比較モード
          </div>
          <h1 className="text-2xl font-extrabold text-gray-900 mb-2">
            複数エリアを並べて比較
          </h1>
          <p className="text-gray-500 text-sm leading-relaxed">
            2〜3つのエリアを選んで比較条件を入力。<br />
            共通制度・エリア固有制度を一覧で確認できます。
          </p>
        </div>

        <div className="bg-white rounded-2xl shadow-xl border border-gray-100 p-6 sm:p-8">
          <CompareForm initialAreas={initialAreas} />
        </div>
      </main>

      <footer className="text-center text-xs text-gray-400 py-8 border-t border-gray-100 mt-8">
        © 2026 子育て支援ナビ　|　最新情報は各自治体にご確認ください。
      </footer>
    </div>
  )
}

// ─── エラービュー ────────────────────────────────────────────────────────────

function ErrorView({ message }: { message: string }) {
  return (
    <div className="min-h-screen bg-gradient-to-b from-violet-50 via-white to-slate-50 flex items-center justify-center px-4">
      <div className="bg-white rounded-2xl shadow-md border border-gray-100 p-8 max-w-md w-full text-center">
        <div className="text-4xl mb-4">⚠️</div>
        <h2 className="font-bold text-gray-800 text-lg mb-2">エラーが発生しました</h2>
        <p className="text-gray-500 text-sm mb-6">{message}</p>
        <Link href="/compare" className="bg-violet-600 text-white px-6 py-2.5 rounded-xl text-sm font-medium hover:bg-violet-700 transition inline-block">
          比較ページに戻る
        </Link>
      </div>
    </div>
  )
}
