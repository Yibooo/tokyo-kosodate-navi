'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { AREA_PREFECTURES } from '@/lib/areas'

const BIRTH_ORDERS = [
  { value: '1', label: '第1子' },
  { value: '2', label: '第2子' },
  { value: '3', label: '第3子' },
  { value: '4', label: '第4子以上' },
]

interface AreaSlot {
  prefecture: string
  ward: string
}

const AREA_COLORS = [
  'border-blue-300 bg-blue-50',
  'border-violet-300 bg-violet-50',
  'border-emerald-300 bg-emerald-50',
]

const AREA_LABELS = ['エリア①', 'エリア②', 'エリア③']

interface Props {
  initialAreas?: AreaSlot[]
  initialBirthdate?: string
  initialBirthOrder?: string
  initialIncome?: number
}

export default function CompareForm({
  initialAreas,
  initialBirthdate = '',
  initialBirthOrder = '',
  initialIncome = 500,
}: Props) {
  const router = useRouter()
  const [areas, setAreas] = useState<AreaSlot[]>(
    initialAreas ?? [
      { prefecture: '', ward: '' },
      { prefecture: '', ward: '' },
    ]
  )
  const [birthdate, setBirthdate]   = useState(initialBirthdate)
  const [isExpected, setIsExpected] = useState(false)
  const [birthOrder, setBirthOrder] = useState(initialBirthOrder)
  const [income, setIncome]         = useState(initialIncome)
  const [loading, setLoading]       = useState(false)
  const [errors, setErrors]         = useState<Record<string, string>>({})

  function updateArea(index: number, field: keyof AreaSlot, value: string) {
    setAreas(prev => {
      const next = [...prev]
      next[index] = { ...next[index], [field]: value }
      if (field === 'prefecture') next[index].ward = ''
      return next
    })
    setErrors(prev => ({ ...prev, [`area${index}`]: '', areas: '' }))
  }

  function addArea() {
    if (areas.length < 3) setAreas(prev => [...prev, { prefecture: '', ward: '' }])
  }

  function removeArea(index: number) {
    if (areas.length <= 2) return
    setAreas(prev => prev.filter((_, i) => i !== index))
  }

  function validate() {
    const e: Record<string, string> = {}
    const filled = areas.filter(a => a.prefecture && a.ward)
    if (filled.length < 2) e.areas = '比較するエリアを2つ以上選択してください'
    areas.forEach((a, i) => {
      if (a.prefecture && !a.ward) e[`area${i}`] = '区市町村を選択してください'
    })
    if (!birthdate) e.birthdate = '生年月日（出産予定日）を入力してください'
    if (!birthOrder) e.birthOrder = '第何子かを選択してください'
    setErrors(e)
    return Object.keys(e).length === 0
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!validate()) return
    setLoading(true)
    const params = new URLSearchParams()
    areas
      .filter(a => a.prefecture && a.ward)
      .forEach((a, i) => {
        params.set(`pref${i + 1}`, a.prefecture)
        params.set(`ward${i + 1}`, a.ward)
      })
    params.set('birthdate', birthdate)
    params.set('birth_order', birthOrder)
    params.set('income', income.toString())
    router.push(`/compare?${params.toString()}`)
  }

  const incomeLabel = income >= 1500 ? '1,500万円以上' : `${income}万円`

  return (
    <form onSubmit={handleSubmit} className="space-y-6">

      {/* エリア選択 */}
      <div>
        <div className="flex items-center justify-between mb-3">
          <label className="text-sm font-semibold text-gray-700">
            🗺️ 比較するエリア（2〜3つ）
          </label>
          {areas.length < 3 && (
            <button
              type="button"
              onClick={addArea}
              className="text-xs text-violet-600 hover:text-violet-800 font-medium flex items-center gap-1 border border-violet-200 rounded-lg px-2.5 py-1 hover:bg-violet-50 transition"
            >
              ＋ 3つ目を追加
            </button>
          )}
        </div>

        <div className="space-y-3">
          {areas.map((area, i) => (
            <div key={i} className={`flex gap-2 items-center rounded-xl border px-3 py-2.5 ${AREA_COLORS[i] ?? 'border-gray-200 bg-gray-50'}`}>
              {/* ラベル */}
              <span className="text-xs font-bold text-gray-500 w-12 shrink-0">{AREA_LABELS[i]}</span>

              {/* 都道府県 */}
              <select
                value={area.prefecture}
                onChange={e => updateArea(i, 'prefecture', e.target.value)}
                className="flex-1 border border-white/60 rounded-lg px-2.5 py-2 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-violet-400 transition"
              >
                <option value="">都道府県</option>
                {AREA_PREFECTURES.map(p => (
                  <option key={p.name} value={p.name}>{p.name}</option>
                ))}
              </select>

              {/* 区市町村 */}
              <select
                value={area.ward}
                onChange={e => updateArea(i, 'ward', e.target.value)}
                disabled={!area.prefecture}
                className="flex-1 border border-white/60 rounded-lg px-2.5 py-2 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-violet-400 transition disabled:bg-gray-100 disabled:text-gray-400 disabled:cursor-not-allowed"
              >
                <option value="">{area.prefecture ? '区市町村' : '――'}</option>
                {AREA_PREFECTURES.find(p => p.name === area.prefecture)?.cities.map(city => (
                  <option key={city} value={city}>{city}</option>
                ))}
              </select>

              {/* 削除ボタン（2つより多い場合のみ） */}
              {areas.length > 2 ? (
                <button
                  type="button"
                  onClick={() => removeArea(i)}
                  className="text-gray-300 hover:text-red-400 transition text-base leading-none ml-1 shrink-0"
                  aria-label="削除"
                >
                  ✕
                </button>
              ) : (
                <span className="w-4 shrink-0" />
              )}
            </div>
          ))}
        </div>

        {errors.areas && <p className="text-red-500 text-xs mt-2">{errors.areas}</p>}
        {areas.map((_, i) =>
          errors[`area${i}`] ? (
            <p key={i} className="text-red-500 text-xs mt-1">{errors[`area${i}`]}</p>
          ) : null
        )}
      </div>

      <div className="border-t border-gray-100 pt-1">
        <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-4">
          共通条件（全エリアに適用）
        </p>

        {/* 生年月日 */}
        <div className="mb-5">
          <label className="block text-sm font-semibold text-gray-700 mb-2">
            👶 お子様の生年月日
          </label>
          <input
            type="date"
            value={birthdate}
            onChange={e => { setBirthdate(e.target.value); setErrors(prev => ({ ...prev, birthdate: '' })) }}
            max={isExpected ? undefined : new Date().toISOString().split('T')[0]}
            className={`w-full border rounded-xl px-4 py-3 text-base bg-white focus:outline-none focus:ring-2 focus:ring-violet-400 transition ${errors.birthdate ? 'border-red-400' : 'border-gray-200'}`}
          />
          <label className="flex items-center gap-2 mt-2 cursor-pointer">
            <input
              type="checkbox"
              checked={isExpected}
              onChange={e => setIsExpected(e.target.checked)}
              className="w-4 h-4 rounded accent-violet-500"
            />
            <span className="text-sm text-gray-500">出産予定日を入力する</span>
          </label>
          {errors.birthdate && <p className="text-red-500 text-xs mt-1">{errors.birthdate}</p>}
        </div>

        {/* 第何子 */}
        <div className="mb-5">
          <label className="block text-sm font-semibold text-gray-700 mb-2">
            👨‍👩‍👧 第何子ですか？
          </label>
          <div className="grid grid-cols-4 gap-2">
            {BIRTH_ORDERS.map(({ value, label }) => (
              <button
                key={value}
                type="button"
                onClick={() => { setBirthOrder(value); setErrors(prev => ({ ...prev, birthOrder: '' })) }}
                className={`py-3 rounded-xl text-sm font-medium border transition ${
                  birthOrder === value
                    ? 'bg-violet-600 text-white border-violet-600 shadow-md'
                    : 'bg-white text-gray-600 border-gray-200 hover:border-violet-300'
                }`}
              >
                {label}
              </button>
            ))}
          </div>
          {errors.birthOrder && <p className="text-red-500 text-xs mt-1">{errors.birthOrder}</p>}
        </div>

        {/* 世帯年収 */}
        <div>
          <label className="block text-sm font-semibold text-gray-700 mb-2">
            💰 世帯年収（目安）
            <span className="ml-3 text-violet-600 font-bold text-base">{incomeLabel}</span>
          </label>
          <input
            type="range"
            min={0}
            max={1500}
            step={100}
            value={income}
            onChange={e => setIncome(Number(e.target.value))}
            className="w-full accent-violet-600 cursor-pointer"
          />
          <div className="flex justify-between text-xs text-gray-400 mt-1">
            <span>0万円</span>
            <span>750万円</span>
            <span>1,500万円以上</span>
          </div>
        </div>
      </div>

      {/* 送信ボタン */}
      <button
        type="submit"
        disabled={loading}
        className="w-full bg-violet-600 hover:bg-violet-700 text-white font-bold py-4 rounded-xl text-base transition shadow-lg hover:shadow-xl disabled:opacity-60 disabled:cursor-not-allowed"
      >
        {loading ? (
          <span className="flex items-center justify-center gap-2">
            <svg className="animate-spin h-5 w-5" viewBox="0 0 24 24" fill="none">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z" />
            </svg>
            比較中...
          </span>
        ) : '⚖️ エリアを比較する →'}
      </button>
    </form>
  )
}
