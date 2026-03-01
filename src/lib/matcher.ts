import { createServerClient } from '@/lib/supabase/server'

export interface UserInput {
  ward: string
  birthdate: string     // YYYY-MM-DD
  birthOrder: number    // 1〜4（4以上）
  incomeManYen: number  // 万円単位
}

export interface MatchedPolicy {
  policy_id: string
  name: string
  layer: 'national' | 'tokyo' | 'ward'
  ward: string | null
  category: string | null
  summary: string
  description: string | null
  monthly_amount: number
  lump_amount: number | null
  amount_note: string | null
  apply_method: string | null
  apply_url: string | null
  reason: string
  eligible: boolean
}

export interface MatchResult {
  matched: MatchedPolicy[]
  annual_total: number
  lump_total: number
  user_summary: string
}

// =============================================
// ユーティリティ
// =============================================
function calcAgeMonths(birthdate: string): number {
  const birth = new Date(birthdate)
  const now   = new Date()
  return (now.getFullYear() - birth.getFullYear()) * 12
       + (now.getMonth()    - birth.getMonth())
}

export function ageLabel(ageMonths: number): string {
  if (ageMonths < 0) return `出産予定（${Math.abs(ageMonths)}ヶ月後）`
  if (ageMonths < 12) return `${ageMonths}ヶ月`
  const y = Math.floor(ageMonths / 12)
  const m = ageMonths % 12
  return m > 0 ? `${y}歳${m}ヶ月` : `${y}歳`
}

// =============================================
// 制度別 金額計算ロジック
// =============================================
function calcMonthlyAmount(policy: Record<string, unknown>, ageMonths: number, birthOrder: number): number {
  const name = policy.name as string

  // 児童手当：年齢・出生順で金額が変動
  if (name.includes('児童手当')) {
    if (birthOrder >= 3) return 30000   // 第3子以上
    if (ageMonths <= 35) return 15000   // 0〜2歳
    return 10000                        // 3歳〜高校生
  }

  return (policy.amount_monthly as number | null) ?? 0
}

function calcLumpAmount(policy: Record<string, unknown>, birthOrder: number): number | null {
  const name = policy.name as string

  // 品川区出産祝金：出生順で変動
  if (name.includes('出産祝金')) {
    if (birthOrder === 1) return 10000
    if (birthOrder === 2) return 20000
    return 100000  // 第3子以降
  }

  return (policy.amount_lump as number | null) ?? null
}

// =============================================
// 対象条件チェック
// =============================================
function buildReason(ageMonths: number, birthOrder: number, income: number, cond: Record<string, unknown> | null): string {
  const parts: string[] = []
  const ageStr = ageLabel(ageMonths)

  if (cond?.child_age_min_months != null && cond?.child_age_max_months != null) {
    const minY = Math.floor((cond.child_age_min_months as number) / 12)
    const maxY = Math.floor((cond.child_age_max_months as number) / 12)
    const maxM = (cond.child_age_max_months as number) % 12
    const maxLabel = maxM > 0 ? `${maxY}歳${maxM}ヶ月` : `${maxY}歳`
    parts.push(`お子様（${ageStr}）が対象年齢（${minY}歳〜${maxLabel}）内`)
  } else if (cond?.child_age_max_months != null) {
    const maxYears = Math.floor((cond.child_age_max_months as number) / 12)
    parts.push(`お子様が${ageStr}で${maxYears}歳未満の対象年齢内`)
  } else {
    parts.push(`お子様（${ageStr}）が対象年齢内`)
  }

  if (birthOrder >= 3) parts.push('第3子以上')

  if (cond?.income_max_man_yen == null) {
    parts.push('所得制限なし')
  } else {
    parts.push(`世帯年収${income}万円が所得制限（${cond.income_max_man_yen}万円以下）内`)
  }

  return parts.join('・')
}

function isEligible(
  policy: Record<string, unknown>,
  cond: Record<string, unknown> | null,
  ageMonths: number,
  birthOrder: number,
  income: number,
): boolean {
  // 年齢チェック
  if (cond?.child_age_min_months != null && ageMonths < (cond.child_age_min_months as number)) return false
  if (cond?.child_age_max_months != null && ageMonths > (cond.child_age_max_months as number)) return false

  // 所得チェック
  if (cond?.income_max_man_yen != null && income > (cond.income_max_man_yen as number)) return false

  // 出生順チェック
  if (cond?.birth_order_min != null && birthOrder < (cond.birth_order_min as number)) return false
  if (cond?.birth_order_max != null && birthOrder > (cond.birth_order_max as number)) return false

  return true
}

// =============================================
// メインマッチング（ルールベース・DB参照型）
// =============================================
export async function matchPolicies(input: UserInput): Promise<MatchResult> {
  const supabase = createServerClient()
  const ageMonths = calcAgeMonths(input.birthdate)

  // 国・都・指定区の承認済み制度を全件取得（件数制限なし）
  const { data: policies, error } = await supabase
    .from('policies')
    .select('*, policy_conditions(*)')
    .eq('status', 'approved')
    .or(`layer.in.(national,tokyo),ward.eq.${input.ward}`)
    .order('layer')

  if (error) {
    console.error('[matcher] Supabase error:', error)
    throw new Error('制度データの取得に失敗しました')
  }

  if (!policies || policies.length === 0) {
    return { matched: [], annual_total: 0, lump_total: 0, user_summary: '' }
  }

  // ルールベースマッチング（全件対象、制限なし）
  const matched: MatchedPolicy[] = []

  for (const p of policies) {
    const cond = (p.policy_conditions as Record<string, unknown>[])?.[0] ?? null

    if (!isEligible(p as Record<string, unknown>, cond, ageMonths, input.birthOrder, input.incomeManYen)) continue

    const monthly = calcMonthlyAmount(p as Record<string, unknown>, ageMonths, input.birthOrder)
    const lump    = calcLumpAmount(p as Record<string, unknown>, input.birthOrder)
    const reason  = buildReason(ageMonths, input.birthOrder, input.incomeManYen, cond)

    matched.push({
      policy_id:      p.id,
      name:           p.name,
      layer:          p.layer as 'national' | 'tokyo' | 'ward',
      ward:           p.ward,
      category:       (p.category as string | null) ?? null,
      summary:        p.summary,
      description:    p.description,
      monthly_amount: monthly,
      lump_amount:    lump,
      amount_note:    p.amount_note,
      apply_method:   p.apply_method,
      apply_url:      p.apply_url,
      reason,
      eligible: true,
    })
  }

  // 月額換算スコアの大きい順にソート
  // サービス系（月額0・一時金なし）は下部に、給付金系は上部に表示
  matched.sort((a, b) => {
    const aScore = (a.monthly_amount ?? 0) * 12 + (a.lump_amount ?? 0) * 0.5
    const bScore = (b.monthly_amount ?? 0) * 12 + (b.lump_amount ?? 0) * 0.5
    return bScore - aScore
  })

  // 現金給付の合計のみ計算（サービス系は除く）
  const annual_total = matched.reduce((s, p) => s + (p.monthly_amount ?? 0) * 12, 0)
  const lump_total   = matched.reduce((s, p) => s + (p.lump_amount ?? 0), 0)
  const user_summary = `${input.ward}・第${input.birthOrder}子・${ageLabel(ageMonths)}・世帯年収${input.incomeManYen}万円`

  return { matched, annual_total, lump_total, user_summary }
}
