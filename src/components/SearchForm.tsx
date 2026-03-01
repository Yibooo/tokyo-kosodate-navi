'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'

const WARDS = ['港区', '品川区', '目黒区', '江東区', '江戸川区']
const BIRTH_ORDERS = [
  { value: '1', label: '第1子' },
  { value: '2', label: '第2子' },
  { value: '3', label: '第3子' },
  { value: '4', label: '第4子以上' },
]
const INCOME_STEPS = Array.from({ length: 16 }, (_, i) => i * 100) // 0〜1500万円

export default function SearchForm() {
  const router = useRouter()
  const [ward, setWard] = useState('')
  const [birthdate, setBirthdate] = useState('')
  const [isExpected, setIsExpected] = useState(false)
  const [birthOrder, setBirthOrder] = useState('')
  const [income, setIncome] = useState(500)
  const [loading, setLoading] = useState(false)
  const [errors, setErrors] = useState<Record<string, string>>({})

  function validate() {
    const e: Record<string, string> = {}
    if (!ward) e.ward = '居住区を選択してください'
    if (!birthdate) e.birthdate = '生年月日（出産予定日）を入力してください'
    if (!birthOrder) e.birthOrder = '第何子かを選択してください'
    setErrors(e)
    return Object.keys(e).length === 0
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!validate()) return
    setLoading(true)
    const params = new URLSearchParams({
      ward,
      birthdate,
      birth_order: birthOrder,
      income: income.toString(),
    })
    router.push(`/results?${params.toString()}`)
  }

  const incomeLabel = income >= 1500 ? '1,500万円以上' : `${income}万円`

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {/* 居住区 */}
      <div>
        <label className="block text-sm font-semibold text-gray-700 mb-2">
          🏠 お住まいの区
        </label>
        <select
          value={ward}
          onChange={e => { setWard(e.target.value); setErrors(prev => ({ ...prev, ward: '' })) }}
          className={`w-full border rounded-xl px-4 py-3 text-base bg-white focus:outline-none focus:ring-2 focus:ring-blue-400 transition ${errors.ward ? 'border-red-400' : 'border-gray-200'}`}
        >
          <option value="">選択してください</option>
          {WARDS.map(w => <option key={w} value={w}>{w}</option>)}
        </select>
        {errors.ward && <p className="text-red-500 text-xs mt-1">{errors.ward}</p>}
      </div>

      {/* 生年月日 */}
      <div>
        <label className="block text-sm font-semibold text-gray-700 mb-2">
          👶 お子様の生年月日
        </label>
        <input
          type="date"
          value={birthdate}
          onChange={e => { setBirthdate(e.target.value); setErrors(prev => ({ ...prev, birthdate: '' })) }}
          max={isExpected ? undefined : new Date().toISOString().split('T')[0]}
          className={`w-full border rounded-xl px-4 py-3 text-base bg-white focus:outline-none focus:ring-2 focus:ring-blue-400 transition ${errors.birthdate ? 'border-red-400' : 'border-gray-200'}`}
        />
        <label className="flex items-center gap-2 mt-2 cursor-pointer">
          <input
            type="checkbox"
            checked={isExpected}
            onChange={e => setIsExpected(e.target.checked)}
            className="w-4 h-4 rounded accent-blue-500"
          />
          <span className="text-sm text-gray-500">出産予定日を入力する</span>
        </label>
        {errors.birthdate && <p className="text-red-500 text-xs mt-1">{errors.birthdate}</p>}
      </div>

      {/* 第何子 */}
      <div>
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
                  ? 'bg-blue-600 text-white border-blue-600 shadow-md'
                  : 'bg-white text-gray-600 border-gray-200 hover:border-blue-300'
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
          <span className="ml-3 text-blue-600 font-bold text-base">{incomeLabel}</span>
        </label>
        <input
          type="range"
          min={0}
          max={1500}
          step={100}
          value={income}
          onChange={e => setIncome(Number(e.target.value))}
          className="w-full accent-blue-600 cursor-pointer"
        />
        <div className="flex justify-between text-xs text-gray-400 mt-1">
          <span>0万円</span>
          <span>750万円</span>
          <span>1,500万円以上</span>
        </div>
        <p className="text-xs text-gray-400 mt-1">所得制限の確認に使用します（概算で大丈夫です）</p>
      </div>

      {/* 送信ボタン */}
      <button
        type="submit"
        disabled={loading}
        className="w-full bg-blue-600 hover:bg-blue-700 text-white font-bold py-4 rounded-xl text-base transition shadow-lg hover:shadow-xl disabled:opacity-60 disabled:cursor-not-allowed"
      >
        {loading ? (
          <span className="flex items-center justify-center gap-2">
            <svg className="animate-spin h-5 w-5" viewBox="0 0 24 24" fill="none">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z" />
            </svg>
            検索中...
          </span>
        ) : '支援制度を検索する →'}
      </button>
    </form>
  )
}
