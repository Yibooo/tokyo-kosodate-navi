interface Props {
  annualTotal: number
  lumpTotal: number
  userSummary: string
  count: number
}

function fmt(n: number) { return n.toLocaleString('ja-JP') }

export default function SummaryBanner({ annualTotal, lumpTotal, userSummary, count }: Props) {
  // 18歳まで概算（年間給付が続くと仮定した粗い試算）
  const eighteenYearEst = annualTotal * 10 + lumpTotal

  return (
    <div className="bg-gradient-to-r from-blue-600 to-indigo-600 rounded-2xl p-6 text-white shadow-xl mb-6">
      <div className="text-sm font-medium opacity-80 mb-1">検索条件</div>
      <div className="font-semibold text-base mb-5 opacity-90">{userSummary}</div>

      <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
        <div className="bg-white/10 rounded-xl p-4">
          <div className="text-xs opacity-70 mb-1">年間受給見込み</div>
          <div className="text-2xl font-extrabold">¥{fmt(annualTotal)}</div>
          <div className="text-xs opacity-60 mt-0.5">月平均 ¥{fmt(Math.round(annualTotal / 12))}</div>
        </div>
        <div className="bg-white/10 rounded-xl p-4">
          <div className="text-xs opacity-70 mb-1">一時金合計</div>
          <div className="text-2xl font-extrabold">¥{fmt(lumpTotal)}</div>
          <div className="text-xs opacity-60 mt-0.5">出産・誕生時に受取</div>
        </div>
        <div className="bg-white/10 rounded-xl p-4 col-span-2 sm:col-span-1">
          <div className="text-xs opacity-70 mb-1">18歳まで概算累計</div>
          <div className="text-2xl font-extrabold">¥{fmt(eighteenYearEst)}</div>
          <div className="text-xs opacity-60 mt-0.5">※ 現在の条件が継続した場合の試算</div>
        </div>
      </div>

      <div className="mt-4 text-xs opacity-60 text-right">{count}件の制度が該当しました</div>
    </div>
  )
}
