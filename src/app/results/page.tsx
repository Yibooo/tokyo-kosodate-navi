import Link from 'next/link'
import { matchPolicies } from '@/lib/matcher'
import SummaryBanner from '@/components/SummaryBanner'
import ResultList from '@/components/ResultList'

interface Props {
  searchParams: Promise<{ ward?: string; birthdate?: string; birth_order?: string; income?: string }>
}

export default async function ResultsPage({ searchParams }: Props) {
  const params = await searchParams
  const { ward = '', birthdate = '', birth_order = '1', income = '500' } = params

  if (!ward || !birthdate) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <p className="text-gray-500 mb-4">検索条件が不足しています</p>
          <Link href="/" className="text-blue-600 underline">トップに戻る</Link>
        </div>
      </div>
    )
  }

  const result = await matchPolicies({
    ward,
    birthdate,
    birthOrder: Number(birth_order),
    incomeManYen: Number(income),
  })

  const { matched, annual_total, lump_total, user_summary } = result

  const tabs = [
    { key: 'all',      label: '全て',   items: matched },
    { key: 'national', label: '国',     items: matched.filter(p => p.layer === 'national') },
    { key: 'tokyo',    label: '東京都', items: matched.filter(p => p.layer === 'tokyo') },
    { key: 'ward',     label: ward,     items: matched.filter(p => p.layer === 'ward') },
  ].filter(t => t.key === 'all' || t.items.length > 0)

  return (
    <div className="min-h-screen bg-gradient-to-b from-blue-50 via-white to-slate-50">
      <nav className="border-b border-blue-100 bg-white/80 backdrop-blur-sm sticky top-0 z-10">
        <div className="max-w-5xl mx-auto px-4 py-3 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="text-2xl">🍼</span>
            <span className="font-bold text-blue-700 text-lg">子育て支援ナビ</span>
          </div>
          <Link href="/" className="text-sm text-blue-600 hover:text-blue-800 font-medium">
            ← 条件を変更
          </Link>
        </div>
      </nav>

      <main className="max-w-3xl mx-auto px-4 py-8">
        {matched.length > 0 && (
          <SummaryBanner
            annualTotal={annual_total}
            lumpTotal={lump_total}
            userSummary={user_summary}
            count={matched.length}
          />
        )}

        <div className="bg-amber-50 border border-amber-200 rounded-xl px-4 py-3 mb-6 text-xs text-amber-800 flex gap-2">
          <span className="shrink-0">⚠️</span>
          <span>情報は定期的に更新していますが、制度の詳細・申請条件は変更される場合があります。必ず各自治体の公式情報をご確認ください。</span>
        </div>

        {matched.length === 0 ? (
          <div className="text-center py-16 bg-white rounded-2xl border border-gray-100 shadow-sm">
            <div className="text-4xl mb-4">🔍</div>
            <h2 className="font-bold text-gray-700 mb-2">該当する制度が見つかりませんでした</h2>
            <p className="text-gray-400 text-sm mb-6">検索条件を変えてお試しください</p>
            <Link href="/" className="bg-blue-600 text-white px-6 py-2 rounded-xl text-sm font-medium hover:bg-blue-700 transition">
              条件を変えて検索
            </Link>
          </div>
        ) : (
          <ResultList tabs={tabs} />
        )}
      </main>

      <footer className="text-center text-xs text-gray-400 py-8 border-t border-gray-100 mt-8">
        © 2026 子育て支援ナビ　|　最新情報は各自治体にご確認ください。
      </footer>
    </div>
  )
}
