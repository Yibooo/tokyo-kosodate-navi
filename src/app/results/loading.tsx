export default function Loading() {
  return (
    <div className="min-h-screen bg-gradient-to-b from-blue-50 via-white to-slate-50">
      <nav className="border-b border-blue-100 bg-white/80 backdrop-blur-sm sticky top-0 z-10">
        <div className="max-w-5xl mx-auto px-4 py-3 flex items-center gap-2">
          <span className="text-2xl">🍼</span>
          <span className="font-bold text-blue-700 text-lg">子育て支援ナビ</span>
        </div>
      </nav>

      <div className="max-w-3xl mx-auto px-4 py-10">
        {/* 検索中アニメーション */}
        <div className="text-center py-16">
          <div className="inline-flex items-center justify-center w-20 h-20 bg-blue-100 rounded-full mb-6">
            <svg className="animate-spin h-10 w-10 text-blue-600" viewBox="0 0 24 24" fill="none">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/>
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z"/>
            </svg>
          </div>
          <h2 className="text-xl font-bold text-gray-800 mb-2">AIが制度を照合中...</h2>
          <p className="text-gray-500 text-sm">国・東京都・区の制度をまとめて確認しています</p>
        </div>

        {/* スケルトンカード */}
        <div className="space-y-4 animate-pulse">
          {[1, 2, 3].map(i => (
            <div key={i} className="bg-white rounded-2xl border border-gray-100 p-5">
              <div className="flex gap-2 mb-3">
                <div className="h-5 w-12 bg-gray-200 rounded-full"/>
                <div className="h-5 w-20 bg-gray-200 rounded-full"/>
              </div>
              <div className="h-5 w-2/3 bg-gray-200 rounded mb-2"/>
              <div className="h-4 w-full bg-gray-100 rounded mb-1"/>
              <div className="h-4 w-4/5 bg-gray-100 rounded mb-4"/>
              <div className="flex gap-3">
                <div className="h-14 w-28 bg-emerald-100 rounded-xl"/>
                <div className="h-14 w-28 bg-blue-100 rounded-xl"/>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
