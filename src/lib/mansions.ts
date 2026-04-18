// =============================================
// 新築マンションデータ取得ロジック（Phase M）
// =============================================
import {
  SEED_MANSIONS,
  type MansionRecord,
  type MansionStatus,
} from '@/lib/seed-mansions'

export type { MansionRecord, MansionStatus }

// =============================================
// フィルター型定義
// =============================================

export interface MansionFilter {
  status?:   MansionStatus[]                               // 複数選択可
  delivery?: 'before2026' | '2026' | '2027' | '2028plus' | null
  units?:    'small' | 'mid' | 'large' | null              // ≤30 / 31-80 / 81+
  corridor?: '内廊下' | null                               // 内廊下のみ or 全て
}

// =============================================
// 公開API
// =============================================

/**
 * 指定した区の新築マンション一覧を返す。
 * フィルターを渡すとその条件で絞り込む。
 */
export function getMansionsByWard(
  ward: string,
  filter?: MansionFilter,
): MansionRecord[] {
  let results = SEED_MANSIONS.filter(m => m.ward === ward)
  return applyFilter(results, filter)
}

/**
 * 全物件を返す（マップ全体表示用）
 */
export function getAllMansions(filter?: MansionFilter): MansionRecord[] {
  return applyFilter([...SEED_MANSIONS], filter)
}

/**
 * 対応している区の一覧（seedに存在する区のみ、23区順）
 */
export function getMansionWards(): string[] {
  const wardSet = new Set(SEED_MANSIONS.map(m => m.ward))
  return WARD_ORDER.filter(w => wardSet.has(w))
}

// =============================================
// 内部ユーティリティ
// =============================================

function applyFilter(
  results: MansionRecord[],
  filter?: MansionFilter,
): MansionRecord[] {
  if (!filter) return results

  if (filter.status && filter.status.length > 0) {
    results = results.filter(m => filter.status!.includes(m.status))
  }

  if (filter.delivery) {
    results = results.filter(m => {
      const year = extractYear(m.delivery ?? m.completion)
      if (year === null) return true  // 未定は除外しない
      if (filter.delivery === 'before2026') return year <= 2025
      if (filter.delivery === '2026')       return year === 2026
      if (filter.delivery === '2027')       return year === 2027
      if (filter.delivery === '2028plus')   return year >= 2028
      return true
    })
  }

  if (filter.units) {
    results = results.filter(m => {
      if (m.total_units === null) return true
      if (filter.units === 'small')  return m.total_units <= 30
      if (filter.units === 'mid')    return m.total_units >= 31 && m.total_units <= 80
      if (filter.units === 'large')  return m.total_units >= 81
      return true
    })
  }

  if (filter.corridor === '内廊下') {
    results = results.filter(m => m.corridor === '内廊下')
  }

  return results
}

function extractYear(dateStr: string | null): number | null {
  if (!dateStr) return null
  const match = dateStr.match(/(\d{4})年/)
  return match ? Number(match[1]) : null
}

// =============================================
// 定数
// =============================================

/** ステータスの表示設定 */
export const STATUS_CONFIG: Record<MansionStatus, {
  label: string
  color: string
  bg:    string
  pin:   string
}> = {
  '建築予定': { label: '建築予定', color: 'text-blue-700',   bg: 'bg-blue-50',   pin: '🔵' },
  '建築中':   { label: '建築中',   color: 'text-orange-600', bg: 'bg-orange-50', pin: '🟠' },
  '分譲中':   { label: '分譲中',   color: 'text-green-700',  bg: 'bg-green-50',  pin: '🟢' },
}

/** 23区の表示順 */
export const WARD_ORDER = [
  '千代田区', '中央区', '港区', '新宿区', '文京区',
  '台東区', '墨田区', '江東区', '品川区', '目黒区',
  '大田区', '世田谷区', '渋谷区', '中野区', '杉並区',
  '豊島区', '北区', '荒川区', '板橋区', '練馬区',
  '足立区', '葛飾区', '江戸川区',
]
