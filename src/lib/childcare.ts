// =============================================
// 保育施設データ取得ロジック（Phase B）
// Supabase 接続時は DB から取得、未接続時は seed fallback
// =============================================
import {
  SEED_FACILITIES,
  SEED_WAITING,
  SEED_BIRTHS,
  type SeedFacility,
  type SeedWaiting,
  type SeedBirth,
  type FacilityCategory,
} from '@/lib/seed-childcare'

export type { FacilityCategory }

// =============================================
// 公開型定義
// =============================================

export interface FacilityRow {
  category:  FacilityCategory
  count:     number   // 施設数（推計値）
  capacity:  number   // 定員数
  estimated: boolean  // true = 推計値
}

export interface FacilitySummary {
  ward:        string
  fiscal_year: number
  rows:        FacilityRow[]
  total_count:         number
  total_capacity:      number
  recognized_capacity: number  // 認可系（保育所・こども園・小規模）の定員合計（待機比率の分母）
}

export interface WaitingSummary {
  ward:                 string
  fiscal_year:          number
  total_waiting:        number
  total_hidden_waiting: number | null
}

export interface BirthRecord {
  ward:        string
  fiscal_year: number
  birth_count: number
}

export interface TrendRow {
  fiscal_year:          number
  birth_count:          number
  total_capacity:       number
  total_waiting:        number
  capacity_estimated:   boolean  // true = 推計値
  yoy_waiting:          number | null  // 前年比（待機児童数の差分）
  application_ratio:    number   // 認可倍率 = 出生数 / (認可定員 / 6)
  difficulty:           'high' | 'mid' | 'low'
  comment_key:          string  // コメントテンプレートのキー
}

export interface NurseryData {
  ward:              string
  latest_year:       number
  facility:          FacilitySummary
  waiting:           WaitingSummary
  trend:             TrendRow[]
  trend_comment:     string
  application_ratio: number               // 最新年度の認可倍率 = 出生数 / (認可定員 / 6)
  difficulty:        'high' | 'mid' | 'low'  // 認可倍率ベースの難易度
}

// =============================================
// 内部ユーティリティ
// =============================================

const LATEST_YEAR = 2024
const TREND_YEARS = [2020, 2021, 2022, 2023, 2024]

/**
 * 認可倍率 = 出生数 / (認可定員 ÷ 6)
 * 1学年あたり定員に対して何人の出生数があるかを示す倍率。
 * 1.0 = 需給均衡、> 1.0 = 需要超過（競争激化）
 */
function calcApplicationRatio(birthCount: number, recognizedCapacity: number): number {
  if (recognizedCapacity === 0) return 9.99
  return birthCount / (recognizedCapacity / 6)
}

/**
 * 認可倍率から入園難易度を判定
 * ≥ 1.8 → high（🔴）: 需要が定員の1.8倍以上
 * ≥ 1.3 → mid（🟡）: 需要が定員の1.3倍以上
 * < 1.3 → low（🟢）: 比較的入りやすい
 */
function calcDifficulty(ratio: number): 'high' | 'mid' | 'low' {
  if (ratio >= 1.8) return 'high'
  if (ratio >= 1.3) return 'mid'
  return 'low'
}

function buildTrendComment(trend: TrendRow[]): string {
  const latest = trend[trend.length - 1]
  const oldest = trend[0]
  if (!latest || !oldest) return ''

  const waitingDown = latest.total_waiting < oldest.total_waiting
  const waitingZero = latest.total_waiting === 0
  const birthDown   = latest.birth_count < oldest.birth_count
  const capUp       = latest.total_capacity > oldest.total_capacity

  if (waitingZero) {
    const zeroStreak = trend.filter(t => t.total_waiting === 0).length
    if (zeroStreak >= 3) {
      return `直近${zeroStreak}年間、待機児童ゼロを維持しています。比較的入園しやすいエリアです。`
    }
    return `${latest.fiscal_year}年度は待機児童ゼロを達成。認可定員の拡充が需要に追いついています。`
  }

  if (waitingDown && capUp) {
    return `認可定員の拡充が進んでおり、待機児童数は${oldest.fiscal_year}年度比で減少傾向にあります。引き続き早めの申し込みを推奨します。`
  }

  if (!waitingDown && !birthDown) {
    return `転入等による需要増加に施設整備が追いついておらず、待機児童数が増加傾向にあります。複数園への申し込みを検討してください。`
  }

  if (!waitingDown && birthDown) {
    return `出生数は減少傾向ですが定員不足が続いています。早めの申し込みと複数園の検討を推奨します。`
  }

  return `待機児童数は改善傾向にあります。最新の空き状況は各区の保育課にご確認ください。`
}

// =============================================
// seed データから NurseryData を組み立てる
// =============================================

// 施設種別ごとに「最新年度」が異なるため個別に取得する
const LATEST_YEAR_BY_CATEGORY: Record<string, number> = {
  '認可保育所':   2024,
  '認定こども園': 2024,
  '小規模保育等': 2024,
  '認可外保育施設': 2023,  // 厚労省データ最新
  '幼稚園':       2024,  // 文科省データ最新
}

// 施設テーブルの表示順（種別ラベルの並び順）
const CATEGORY_ORDER: FacilityCategory[] = [
  '認可保育所', '認定こども園', '小規模保育等', '認可外保育施設', '幼稚園',
]

function buildFromSeed(ward: string): NurseryData | null {
  // --- 施設データ（種別ごとに最新年度を取得）---
  const facRows: SeedFacility[] = []
  for (const cat of CATEGORY_ORDER) {
    const year = LATEST_YEAR_BY_CATEGORY[cat] ?? LATEST_YEAR
    const row  = SEED_FACILITIES.find(
      (f: SeedFacility) => f.ward === ward && f.fiscal_year === year && f.category === cat
    )
    if (row) facRows.push(row)
  }
  if (facRows.length === 0) return null

  const facilityRows: FacilityRow[] = facRows.map((f: SeedFacility) => ({
    category:  f.category,
    count:     f.count,
    capacity:  f.capacity,
    estimated: f.estimated,
  }))
  // 認可系（認可保育所・こども園・小規模）の定員合計（待機児童比率の分母として使用）
  const recognizedCapacity = facilityRows
    .filter(r => r.category !== '認可外保育施設' && r.category !== '幼稚園')
    .reduce((s, r) => s + r.capacity, 0)

  const totalCount    = facilityRows.reduce((s, r) => s + r.count, 0)
  const totalCapacity = facilityRows.reduce((s, r) => s + r.capacity, 0)

  const facility: FacilitySummary = {
    ward,
    fiscal_year:     LATEST_YEAR,
    rows:            facilityRows,
    total_count:     totalCount,
    total_capacity:  totalCapacity,
    recognized_capacity: recognizedCapacity,
  }

  // --- 待機児童データ（最新年度）---
  const waitRec = SEED_WAITING.find(
    (w: SeedWaiting) => w.ward === ward && w.fiscal_year === LATEST_YEAR
  )
  const waiting: WaitingSummary = {
    ward,
    fiscal_year:          LATEST_YEAR,
    total_waiting:        waitRec?.total_waiting        ?? 0,
    total_hidden_waiting: waitRec?.total_hidden_waiting ?? null,
  }

  // --- トレンド（5年分）---
  const trend: TrendRow[] = []
  let prevWaiting: number | null = null

  for (const year of TREND_YEARS) {
    const birthRec   = SEED_BIRTHS.find(
      (b: SeedBirth) => b.ward === ward && b.fiscal_year === year
    )
    const waitTrend  = SEED_WAITING.find(
      (w: SeedWaiting) => w.ward === ward && w.fiscal_year === year
    )
    // トレンドでは認可系（保育所・こども園・小規模）の定員のみを使用
    // 認可外・幼稚園はデータ年度が異なるため除外
    const RECOGNIZED_CATS = new Set(['認可保育所', '認定こども園', '小規模保育等'])
    const facTrend = SEED_FACILITIES.filter(
      (f: SeedFacility) => f.ward === ward && f.fiscal_year === year && RECOGNIZED_CATS.has(f.category)
    )

    const totalCap    = facTrend.reduce((s, f) => s + f.capacity, 0)
    const totalWait   = waitTrend?.total_waiting ?? 0
    const births      = birthRec?.birth_count ?? 0
    const isEstimated = facTrend.some(f => f.estimated)

    const yoy      = prevWaiting !== null ? totalWait - prevWaiting : null
    prevWaiting    = totalWait
    const appRatio = calcApplicationRatio(births, totalCap)

    trend.push({
      fiscal_year:        year,
      birth_count:        births,
      total_capacity:     totalCap,
      total_waiting:      totalWait,
      capacity_estimated: isEstimated,
      yoy_waiting:        yoy,
      application_ratio:  appRatio,
      difficulty:         calcDifficulty(appRatio),
      comment_key:        '',
    })
  }

  const trendComment = buildTrendComment(trend)
  const latestTrend  = trend[trend.length - 1]
  const appRatio     = latestTrend?.application_ratio ?? 0

  return {
    ward,
    latest_year:       LATEST_YEAR,
    facility,
    waiting,
    trend,
    trend_comment:     trendComment,
    application_ratio: appRatio,
    difficulty:        calcDifficulty(appRatio),
  }
}

// =============================================
// 公開 API
// =============================================

/**
 * 指定した区の保育施設データを取得する。
 * Supabase が利用可能な場合は DB から取得（将来実装）。
 * 現時点では常に seed データを使用。
 */
export async function getNurseryData(ward: string): Promise<NurseryData | null> {
  // TODO: Supabase 接続時は DB クエリに切り替える
  return buildFromSeed(ward)
}

/**
 * 対応している全23区のリスト
 */
export const SUPPORTED_WARDS: string[] = [
  '千代田区', '中央区', '港区', '新宿区', '文京区',
  '台東区', '墨田区', '江東区', '品川区', '目黒区',
  '大田区', '世田谷区', '渋谷区', '中野区', '杉並区',
  '豊島区', '北区', '荒川区', '板橋区', '練馬区',
  '足立区', '葛飾区', '江戸川区',
]

/**
 * 難易度ラベル・色設定
 */
export const DIFFICULTY_CONFIG = {
  high: { label: '高', color: 'text-red-600',    bg: 'bg-red-50',    dot: '🔴' },
  mid:  { label: '中', color: 'text-yellow-600', bg: 'bg-yellow-50', dot: '🟡' },
  low:  { label: '低', color: 'text-green-600',  bg: 'bg-green-50',  dot: '🟢' },
} as const

// =============================================
// 比較・ランキング用 API
// =============================================

/** 比較表の1区分データ */
export interface WardCompareItem {
  ward:                string
  total_capacity:      number   // 最新年度 認可定員合計
  total_count:         number   // 最新年度 施設数合計
  total_waiting:       number   // 最新年度 待機児童数
  application_ratio:   number   // 最新年度 認可倍率 = 出生数 / (認可定員 / 6)
  difficulty:          'high' | 'mid' | 'low'
  birth_latest:        number   // 最新年度 出生数
  waiting_change_5y:   number   // 5年間待機変化（最新 - 最古）
  trend_comment:       string
}

/**
 * 全23区の比較用サマリーデータを一括取得。
 * ランキング・比較表に使用。
 */
export async function getAllWardsCompare(): Promise<WardCompareItem[]> {
  const results = await Promise.all(
    SUPPORTED_WARDS.map(ward => getNurseryData(ward))
  )

  return results
    .filter((d): d is NurseryData => d !== null)
    .map(d => {
      const firstTrend = d.trend[0]
      const lastTrend  = d.trend[d.trend.length - 1]
      return {
        ward:              d.ward,
        total_capacity:    d.facility.total_capacity,
        total_count:       d.facility.total_count,
        total_waiting:     d.waiting.total_waiting,
        application_ratio: d.application_ratio,
        difficulty:        d.difficulty,
        birth_latest:      lastTrend?.birth_count        ?? 0,
        waiting_change_5y: (lastTrend?.total_waiting ?? 0) - (firstTrend?.total_waiting ?? 0),
        trend_comment:     d.trend_comment,
      }
    })
}

/**
 * 待機児童数でランキングソートしたリストを返す（多い順）
 */
export function sortByDifficulty(items: WardCompareItem[]): WardCompareItem[] {
  const order = { high: 0, mid: 1, low: 2 }
  return [...items].sort((a, b) => {
    const dDiff = order[a.difficulty] - order[b.difficulty]
    if (dDiff !== 0) return dDiff
    return b.total_waiting - a.total_waiting
  })
}
