/**
 * MansionRecord[] を seed-mansions.ts 形式の TypeScript ファイルに変換する
 */
import { writeFileSync } from 'fs'
import { resolve } from 'path'
import type { MansionRecord } from '../../src/lib/seed-mansions'

const SEED_PATH = resolve(__dirname, '../../src/lib/seed-mansions.ts')

/** null / boolean / string を TypeScript リテラルとして整形 */
function val(v: unknown): string {
  if (v === null || v === undefined) return 'null'
  if (typeof v === 'boolean')        return v ? 'true' : 'false'
  if (typeof v === 'number')         return String(v)
  return JSON.stringify(v)  // string → "..."
}

/** MansionRecord 1件を TypeScript オブジェクトリテラルに変換 */
function recordToTs(m: MansionRecord): string {
  return `  {
    id:              ${val(m.id)},
    name:            ${val(m.name)},
    developers:      [${m.developers.map(d => JSON.stringify(d)).join(', ')}],
    ward:            ${val(m.ward)},
    address:         ${val(m.address)},
    lat:             ${m.lat},
    lng:             ${m.lng},
    status:          ${val(m.status)},
    floors:          ${val(m.floors)},
    total_units:     ${val(m.total_units)},
    site_area:       ${val(m.site_area)},
    area_min:        ${val(m.area_min)},
    area_max:        ${val(m.area_max)},
    completion:      ${val(m.completion)},
    delivery:        ${val(m.delivery)},
    constructor:     ${val(m.constructor)},
    parking:         ${val(m.parking)},
    bicycle_parking: ${val(m.bicycle_parking)},
    ceiling_height:  ${val(m.ceiling_height)},
    floor_method:    ${val(m.floor_method)},
    disposer:        ${val(m.disposer)},
    eco_type:        ${val(m.eco_type)},
    corridor:        ${val(m.corridor)},
    url:             ${val(m.url)},
    updated_at:      ${val(m.updated_at)},
  }`
}

/** 既存 seed と新規スクレイプ結果をマージ
 *  - 既存 id が一致する場合: 新規データで上書き（ただし既存に値があるフィールドは保持）
 *  - 新規 id の場合: 末尾に追加
 *  - 販売終了（status が存在しない）: 既存 seed から削除せず保持（手動で削除）
 */
export function mergeRecords(
  existing: MansionRecord[],
  scraped:  MansionRecord[],
): { merged: MansionRecord[]; added: number; updated: number } {
  const existingMap = new Map(existing.map(m => [m.id, m]))
  let added = 0
  let updated = 0

  for (const s of scraped) {
    const ex = existingMap.get(s.id)
    if (!ex) {
      // 新規物件
      existingMap.set(s.id, s)
      added++
    } else {
      // 既存物件: スクレイプで取れた項目は更新、null の項目は既存値を保持
      const merged: MansionRecord = { ...ex }
      for (const key of Object.keys(s) as (keyof MansionRecord)[]) {
        const newVal = s[key]
        if (newVal !== null && newVal !== undefined) {
          // @ts-expect-error dynamic assign
          merged[key] = newVal
        }
      }
      existingMap.set(s.id, merged)
      updated++
    }
  }

  return {
    merged:  [...existingMap.values()],
    added,
    updated,
  }
}

/** MansionRecord[] を seed-mansions.ts ファイルとして書き出す */
export function writeSeedFile(
  records: MansionRecord[],
  updatedAt: string,
): void {
  // デベロッパー別にコメント挿入してグループ化
  const groupMap = new Map<string, MansionRecord[]>()
  for (const m of records) {
    const dev = m.developers[0] ?? 'その他'
    if (!groupMap.has(dev)) groupMap.set(dev, [])
    groupMap.get(dev)!.push(m)
  }

  const sections: string[] = []
  for (const [dev, recs] of groupMap) {
    sections.push(
      `  // ===== ${dev} =====\n` +
      recs.map(recordToTs).join(',\n'),
    )
  }

  const header = `// =============================================
// 新築マンション seed データ（Phase M）
// 月次更新: Claude に依頼してスクレイピング → このファイルを更新
// 最終更新: ${updatedAt}
// =============================================

export type MansionStatus = '建築予定' | '建築中' | '分譲中'

export interface MansionRecord {
  id:              string
  name:            string
  developers:      string[]
  ward:            string
  address:         string
  lat:             number
  lng:             number
  status:          MansionStatus
  floors:          number | null
  total_units:     number | null
  site_area:       number | null
  area_min:        number | null
  area_max:        number | null
  completion:      string | null
  delivery:        string | null
  constructor:     string | null
  parking:         string | null
  bicycle_parking: number | null
  ceiling_height:  string | null
  floor_method:    string | null
  disposer:        boolean | null
  eco_type:        string | null
  corridor:        '内廊下' | '外廊下' | null
  url:             string
  updated_at:      string
}

export const SEED_MANSIONS: MansionRecord[] = [
`

  const content = header + sections.join(',\n\n') + ',\n]\n'
  writeFileSync(SEED_PATH, content, 'utf8')
  console.log(`✅ ${SEED_PATH} を更新しました（${records.length} 件）`)
}
