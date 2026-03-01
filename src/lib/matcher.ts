import Anthropic from '@anthropic-ai/sdk'
import { createServerClient } from '@/lib/supabase/server'

const anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY! })

export interface UserInput {
  ward: string
  birthdate: string        // YYYY-MM-DD
  birthOrder: number       // 1〜4（4以上）
  incomeManYen: number     // 万円単位
}

export interface MatchedPolicy {
  policy_id: string
  name: string
  layer: 'national' | 'tokyo' | 'ward'
  ward: string | null
  summary: string
  description: string | null
  monthly_amount: number      // 月額換算（0の場合は金額不定）
  lump_amount: number | null  // 一時金
  amount_note: string | null
  apply_method: string | null
  apply_url: string | null
  reason: string              // 該当理由
  eligible: boolean
}

export interface MatchResult {
  matched: MatchedPolicy[]
  annual_total: number
  lump_total: number
  user_summary: string
}

// 月齢を計算（負の値は出産前）
function calcAgeMonths(birthdate: string): number {
  const birth = new Date(birthdate)
  const now = new Date()
  return (now.getFullYear() - birth.getFullYear()) * 12 + (now.getMonth() - birth.getMonth())
}

function ageLabel(ageMonths: number): string {
  if (ageMonths < 0) return `出産予定（${Math.abs(ageMonths)}ヶ月後）`
  if (ageMonths < 12) return `${ageMonths}ヶ月`
  const years = Math.floor(ageMonths / 12)
  const months = ageMonths % 12
  return months > 0 ? `${years}歳${months}ヶ月` : `${years}歳`
}

const MATCHING_PROMPT = (
  ward: string,
  ageMonths: number,
  ageStr: string,
  birthOrder: number,
  income: number,
  policiesJson: string
) => `あなたは日本の子育て支援制度のマッチングエンジンです。
以下のユーザー情報と制度リストを照合し、該当する制度を判定してください。

## ユーザー情報
- 居住区: ${ward}
- 子どもの年齢: ${ageStr}（月齢: ${ageMonths}ヶ月）
- 出生順位: 第${birthOrder}子${birthOrder >= 4 ? '以上' : ''}
- 世帯年収: ${income}万円

## 判定対象の制度一覧
${policiesJson}

## 判定ルール
- national（国）・tokyo（東京都）の制度は居住区に関わらず全員対象
- ward（区）の制度は、wardフィールドが居住区と一致する場合のみ対象
- child_age_max_months を超えた子どもは非対象
- income_max_man_yen がnullの場合は所得制限なし（全員対象）
- 児童手当の月額は子の年齢・出生順で変わる: 0〜35ヶ月=15000円、36〜215ヶ月=10000円、第3子以降=30000円
- 出産育児一時金は月齢0〜3ヶ月の場合のみ対象（出産直後）
- 赤ちゃんファースト・誕生祝品等は月齢0〜12ヶ月など年齢制限に注意
- 医療費助成は月額・一時金ともにnullだが、受給対象として含める（年間節約効果があるため）

## 出力形式（JSON配列のみ。余分なテキスト不可）
[
  {
    "policy_id": "制度のid",
    "eligible": true,
    "monthly_amount": 月額円数（整数、医療費助成などは0）,
    "lump_amount": 一時金円数（整数またはnull）,
    "reason": "該当理由を1文で（日本語）"
  }
]

eligibleがfalseの制度は含めないこと。JSONのみ返すこと。`

export async function matchPolicies(input: UserInput): Promise<MatchResult> {
  const supabase = createServerClient()
  const ageMonths = calcAgeMonths(input.birthdate)

  // 承認済み制度を全件取得（国+都+指定区）
  const { data: policies, error } = await supabase
    .from('policies')
    .select('*, policy_conditions(*)')
    .eq('status', 'approved')
    .or(`layer.in.(national,tokyo),ward.eq.${input.ward}`)
    .order('layer')

  if (error || !policies || policies.length === 0) {
    return { matched: [], annual_total: 0, lump_total: 0, user_summary: '' }
  }

  // Claude APIでマッチング
  const policiesJson = JSON.stringify(
    policies.map(p => ({
      id: p.id,
      layer: p.layer,
      ward: p.ward,
      name: p.name,
      summary: p.summary,
      amount_monthly: p.amount_monthly,
      amount_lump: p.amount_lump,
      amount_note: p.amount_note,
      conditions: p.policy_conditions?.[0] ?? null,
    })),
    null, 2
  )

  const response = await anthropic.messages.create({
    model: 'claude-opus-4-5',
    max_tokens: 2048,
    messages: [{
      role: 'user',
      content: MATCHING_PROMPT(input.ward, ageMonths, ageLabel(ageMonths), input.birthOrder, input.incomeManYen, policiesJson)
    }]
  })

  const text = response.content[0].type === 'text' ? response.content[0].text : '[]'
  const jsonMatch = text.match(/\[[\s\S]*\]/)
  if (!jsonMatch) return { matched: [], annual_total: 0, lump_total: 0, user_summary: '' }

  const llmResults = JSON.parse(jsonMatch[0]) as Array<{
    policy_id: string; eligible: boolean; monthly_amount: number; lump_amount: number | null; reason: string
  }>

  // LLM結果とDBデータを結合
  const matched: MatchedPolicy[] = llmResults
    .filter(r => r.eligible)
    .map(r => {
      const p = policies.find(p => p.id === r.policy_id)
      if (!p) return null
      return {
        policy_id: p.id,
        name: p.name,
        layer: p.layer as 'national' | 'tokyo' | 'ward',
        ward: p.ward,
        summary: p.summary,
        description: p.description,
        monthly_amount: r.monthly_amount,
        lump_amount: r.lump_amount,
        amount_note: p.amount_note,
        apply_method: p.apply_method,
        apply_url: p.apply_url,
        reason: r.reason,
        eligible: true,
      }
    })
    .filter((p): p is MatchedPolicy => p !== null)
    .sort((a, b) => (b.monthly_amount ?? 0) - (a.monthly_amount ?? 0))

  // 合計金額計算
  const annual_total = matched.reduce((sum, p) => sum + (p.monthly_amount ?? 0) * 12, 0)
  const lump_total = matched.reduce((sum, p) => sum + (p.lump_amount ?? 0), 0)

  const user_summary = `${input.ward}・第${input.birthOrder}子・${ageLabel(ageMonths)}・世帯年収${input.incomeManYen}万円`

  return { matched, annual_total, lump_total, user_summary }
}
