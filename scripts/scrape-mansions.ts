#!/usr/bin/env node
/**
 * ========================================================
 * 新築マンション月次更新スクリプト
 * ========================================================
 *
 * 使用方法:
 *   npx tsx scripts/scrape-mansions.ts              # 全スクレイパーを実行
 *   npx tsx scripts/scrape-mansions.ts --dry-run    # 出力せず結果を確認のみ
 *   npx tsx scripts/scrape-mansions.ts --merge-manual # 手動エントリのみマージ
 *
 * 前提:
 *   Node.js 18+ (fetch API)
 *   npm install -D cheerio tsx（初回のみ）
 *
 * 処理フロー:
 *   1. 静的HTML対応サイト → fetch + cheerio でスクレイプ
 *   2. 動的サイト → MANUAL_UPDATE_ENTRIES を使用
 *   3. 新規住所 → Nominatim API でジオコード（1req/sec）
 *   4. 既存 seed とマージ（nullフィールドは既存値を保持）
 *   5. src/lib/seed-mansions.ts を上書き
 * ========================================================
 */

import { readFileSync } from 'fs'
import { resolve }      from 'path'
import { scrapeOber }         from './scrapers/ober'
import { scrapeOpenhouse }    from './scrapers/openhouse'
import { scrapeGenericSites } from './scrapers/generic'
import { MANUAL_UPDATE_ENTRIES } from './scrapers/dynamic-sites'
import { mergeRecords, writeSeedFile } from './lib/seed-writer'
import type { MansionRecord } from '../src/lib/seed-mansions'

// コマンドライン引数
const args       = process.argv.slice(2)
const isDryRun   = args.includes('--dry-run')
const manualOnly = args.includes('--merge-manual')

// 今日の日付
const TODAY = new Date().toISOString().slice(0, 10)

// ========================================================
// 既存 seed を読み込む
// ========================================================
async function loadExistingSeed(): Promise<MansionRecord[]> {
  try {
    // 動的インポートで既存 seed を読み込み
    const mod = await import('../src/lib/seed-mansions')
    return mod.SEED_MANSIONS as MansionRecord[]
  } catch {
    console.warn('⚠️  既存 seed の読み込みに失敗。新規作成します。')
    return []
  }
}

// ========================================================
// メイン処理
// ========================================================
async function main() {
  console.log('========================================')
  console.log('🏢  新築マンション月次更新スクリプト')
  console.log(`📅  実行日: ${TODAY}`)
  if (isDryRun)   console.log('🔍  DRY RUN モード（ファイル書き込みなし）')
  if (manualOnly) console.log('✍️   手動エントリのみモード')
  console.log('========================================\n')

  // 既存 seed 読み込み
  const existing = await loadExistingSeed()
  console.log(`📦  既存データ: ${existing.length} 件\n`)

  // スクレイピング実行
  const scraped: MansionRecord[] = []

  if (!manualOnly) {
    try {
      const oberResults = await scrapeOber()
      scraped.push(...oberResults)
      console.log()
    } catch (e) {
      console.error('オーベル スクレイピングエラー:', e)
    }

    try {
      const ohResults = await scrapeOpenhouse()
      scraped.push(...ohResults)
      console.log()
    } catch (e) {
      console.error('オープンハウス スクレイピングエラー:', e)
    }

    try {
      const genericResults = await scrapeGenericSites()
      scraped.push(...genericResults)
      console.log()
    } catch (e) {
      console.error('汎用スクレイパー エラー:', e)
    }
  }

  // 手動エントリを追加
  const manualRecords: MansionRecord[] = MANUAL_UPDATE_ENTRIES
    .filter(e => e.id && e.name && e.ward && e.url)
    .map(e => ({
      id:              e.id!,
      name:            e.name!,
      developers:      e.developers ?? ['不明'],
      ward:            e.ward!,
      address:         e.address ?? e.ward!,
      lat:             e.lat ?? 35.689,
      lng:             e.lng ?? 139.762,
      status:          e.status ?? '分譲中',
      floors:          e.floors ?? null,
      total_units:     e.total_units ?? null,
      site_area:       e.site_area ?? null,
      area_min:        e.area_min ?? null,
      area_max:        e.area_max ?? null,
      completion:      e.completion ?? null,
      delivery:        e.delivery ?? null,
      constructor:     e.constructor ?? null,
      parking:         e.parking ?? null,
      bicycle_parking: e.bicycle_parking ?? null,
      ceiling_height:  e.ceiling_height ?? null,
      floor_method:    e.floor_method ?? null,
      disposer:        e.disposer ?? null,
      eco_type:        e.eco_type ?? null,
      corridor:        e.corridor ?? null,
      url:             e.url!,
      updated_at:      TODAY,
    } satisfies MansionRecord))

  if (manualRecords.length > 0) {
    console.log(`✍️   手動エントリ: ${manualRecords.length} 件`)
    scraped.push(...manualRecords)
  }

  // マージ
  console.log('\n🔀  既存データとマージ中...')
  const { merged, added, updated } = mergeRecords(existing, scraped)
  console.log(`  追加: ${added} 件 / 更新: ${updated} 件 / 合計: ${merged.length} 件`)

  // サマリー表示
  console.log('\n📊  区別サマリー:')
  const byWard = new Map<string, number>()
  for (const m of merged) {
    byWard.set(m.ward, (byWard.get(m.ward) ?? 0) + 1)
  }
  const WARD_ORDER = [
    '千代田区','中央区','港区','新宿区','文京区','台東区','墨田区','江東区',
    '品川区','目黒区','大田区','世田谷区','渋谷区','中野区','杉並区',
    '豊島区','北区','荒川区','板橋区','練馬区','足立区','葛飾区','江戸川区',
  ]
  for (const ward of WARD_ORDER) {
    const n = byWard.get(ward)
    if (n) console.log(`  ${ward}: ${n} 件`)
  }

  // 出力
  if (isDryRun) {
    console.log('\n🔍  DRY RUN: ファイルへの書き込みをスキップしました')
    console.log('    実際に更新するには --dry-run なしで実行してください')
  } else {
    console.log('\n💾  seed-mansions.ts を更新中...')
    writeSeedFile(merged, TODAY)
  }

  console.log('\n✅  完了！')
  console.log('   次のステップ:')
  console.log('   1. src/lib/seed-mansions.ts の内容を確認')
  console.log('   2. npx tsc --noEmit でTypeScriptエラーがないか確認')
  console.log('   3. git add src/lib/seed-mansions.ts && git commit -m "data: 新築マンションデータ月次更新 YYYY-MM"')
  console.log('   4. git push origin main')
}

main().catch(e => {
  console.error('❌  予期しないエラー:', e)
  process.exit(1)
})
