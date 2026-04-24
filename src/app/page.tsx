import HomeTab from '@/components/HomeTab'
import { AREA_PREFECTURES } from '@/lib/areas'

export default function HomePage() {
  return (
    <div className="min-h-screen bg-gradient-to-b from-blue-50 via-white to-slate-50">
      {/* ナビゲーション */}
      <nav className="border-b border-blue-100 bg-white/80 backdrop-blur-sm sticky top-0 z-10">
        <div className="max-w-5xl mx-auto px-4 py-3 flex items-center gap-2">
          <span className="text-2xl">🏢</span>
          <span className="font-bold text-blue-700 text-lg">首都圏新築マンションナビ</span>
        </div>
      </nav>

      <main className="max-w-5xl mx-auto px-4 py-10 sm:py-16">
        {/* ヒーローセクション */}
        <div className="text-center mb-10">
          <div className="inline-flex items-center gap-2 bg-blue-100 text-blue-700 text-sm font-medium px-4 py-1.5 rounded-full mb-5">
            <span>🏙️</span> 東京23区 + 近郊10市 対応
          </div>
          <h1 className="text-3xl sm:text-4xl font-extrabold text-gray-900 leading-tight mb-4">
            国・都道府県・市区町村の<br className="sm:hidden" />
            子育て支援を<span className="text-blue-600">まとめて</span>検索
          </h1>
          <p className="text-gray-500 text-base sm:text-lg max-w-xl mx-auto leading-relaxed">
            居住エリア・子の生年月日・世帯年収を入力するだけ。<br />
            受給できる支援制度と金額を、金額の大きい順にまとめて表示します。
          </p>
        </div>

        {/* メインコンテンツ：タブ切替（補助金 / 保育園情報β） */}
        <HomeTab />

        {/* 対応エリアバッジ（都道府県別グループ表示） */}
        <div className="mt-10 text-center">
          <p className="text-xs text-gray-400 mb-4">現在対応しているエリア</p>
          <div className="space-y-3 max-w-2xl mx-auto">
            {AREA_PREFECTURES.map(pref => (
              <div key={pref.name} className="flex flex-wrap items-center gap-2 justify-center">
                <span className="text-xs font-semibold text-gray-500 bg-gray-100 px-2.5 py-1 rounded-full whitespace-nowrap">
                  {pref.name}
                </span>
                {pref.cities.map(city => (
                  <span
                    key={city}
                    className="text-xs bg-white border border-gray-200 text-gray-600 px-3 py-1 rounded-full shadow-sm"
                  >
                    {city}
                  </span>
                ))}
              </div>
            ))}
          </div>
        </div>

        {/* 特徴カード */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mt-12">
          {[
            { icon: '🔍', title: '3層一括検索', desc: '国・都道府県・市区町村の制度を一度の検索でまとめて確認' },
            { icon: '💰', title: '金額順ソート', desc: '受給額が大きい制度から順に表示。見落としゼロ' },
            { icon: '⚖️', title: 'エリア比較モード', desc: '最大3エリアを並べて比較。引越し先選びにも活躍' },
          ].map(f => (
            <div key={f.title} className="bg-white rounded-xl p-5 border border-gray-100 shadow-sm text-center">
              <div className="text-3xl mb-2">{f.icon}</div>
              <div className="font-semibold text-gray-800 mb-1">{f.title}</div>
              <div className="text-xs text-gray-500 leading-relaxed">{f.desc}</div>
            </div>
          ))}
        </div>
      </main>

      <footer className="text-center text-xs text-gray-400 py-8 border-t border-gray-100 mt-8">
        © 2026 首都圏新築マンションナビ　|　情報は定期的に更新していますが、最新情報は各物件・自治体にご確認ください。
      </footer>
    </div>
  )
}
