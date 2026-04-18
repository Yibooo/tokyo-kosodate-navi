/**
 * 大成有楽不動産 オーベル スクレイパー
 * 対象: https://www.ober.jp/
 * 方式: fetch + cheerio（静的HTML）
 * robots.txt: /robots.txt — 物件ページへの制限なし ✅
 */
import * as cheerio from 'cheerio'
import type { MansionRecord } from '../../src/lib/seed-mansions'
import { geocode, sleep } from '../lib/geocode'

const BASE_URL   = 'https://www.ober.jp'
const LIST_URL   = 'https://www.ober.jp/lineup/'
const TODAY      = new Date().toISOString().slice(0, 10)
const USER_AGENT = 'tokyo-kosodate-navi/1.0 (https://github.com/Yibooo/tokyo-kosodate-navi)'

const WARD_NAMES = [
  '千代田区','中央区','港区','新宿区','文京区','台東区','墨田区','江東区',
  '品川区','目黒区','大田区','世田谷区','渋谷区','中野区','杉並区',
  '豊島区','北区','荒川区','板橋区','練馬区','足立区','葛飾区','江戸川区',
]

function extractWard(text: string): string | null {
  for (const w of WARD_NAMES) {
    if (text.includes(w)) return w
  }
  return null
}

function slug(name: string): string {
  return 'ober-' + name
    .replace(/[^\w\u3040-\u9FFF]/g, '-')
    .replace(/-+/g, '-')
    .replace(/^-|-$/g, '')
    .toLowerCase()
    .slice(0, 50)
}

function parseUnits(text: string): number | null {
  const m = text.match(/(\d+)戸/)
  return m ? parseInt(m[1]) : null
}

function parseArea(text: string): { min: number | null; max: number | null } {
  const range = text.match(/([\d.]+)m².*?[〜～]([\d.]+)m²/)
  if (range) return { min: parseFloat(range[1]), max: parseFloat(range[2]) }
  const single = text.match(/([\d.]+)m²/)
  return single ? { min: parseFloat(single[1]), max: null } : { min: null, max: null }
}

function parseFloors(text: string): number | null {
  const m = text.match(/(\d+)階/)
  return m ? parseInt(m[1]) : null
}

function parseStatus(text: string): MansionRecord['status'] {
  if (text.includes('分譲中') || text.includes('販売中')) return '分譲中'
  if (text.includes('建築中') || text.includes('工事中')) return '建築中'
  return '建築予定'
}

export async function scrapeOber(): Promise<MansionRecord[]> {
  console.log('🏗️  オーベル スクレイピング開始...')

  let html: string
  try {
    const res = await fetch(LIST_URL, { headers: { 'User-Agent': USER_AGENT } })
    if (!res.ok) throw new Error(`HTTP ${res.status}`)
    html = await res.text()
  } catch (e) {
    console.error('  ❌ 一覧ページ取得失敗:', e)
    return []
  }

  const $ = cheerio.load(html)
  const records: MansionRecord[] = []
  // オーベルサイトの物件リンクを収集
  const links: string[] = []

  $('a[href]').each((_, el) => {
    const href = $(el).attr('href') ?? ''
    const full = href.startsWith('http') ? href : BASE_URL + href
    if (
      full.includes('ober.jp') &&
      !links.includes(full) &&
      /\/(urvanz|rokucho|tobu|akihabara|lineup|bukken)/.test(full)
    ) {
      links.push(full)
    }
  })

  console.log(`  📄 物件ページ候補: ${links.length}件`)

  for (const url of links.slice(0, 20)) {
    try {
      await sleep(1200)
      const res = await fetch(url, { headers: { 'User-Agent': USER_AGENT } })
      if (!res.ok) continue
      const pageHtml = await res.text()
      const p$ = cheerio.load(pageHtml)

      const name    = p$('h1').first().text().trim() || p$('title').text().split('|')[0].trim()
      const bodyText = p$('body').text()

      const ward = extractWard(bodyText)
      if (!ward) continue  // 23区外はスキップ

      // 住所を抽出（「所在地」の後の文字列）
      let address = ''
      p$('th, dt, .label').each((_, el) => {
        const label = p$(el).text().trim()
        if (label.includes('所在地') || label.includes('住所')) {
          address = p$(el).next('td, dd, .value').text().trim()
        }
      })
      if (!address) address = ward

      // 各種スペック抽出
      const totalUnits  = parseUnits(bodyText)
      const { min, max} = parseArea(bodyText)
      const floors      = parseFloors(bodyText)
      const status      = parseStatus(bodyText)

      // 竣工・引渡
      let completion: string | null = null
      let delivery:   string | null = null
      p$('th, dt, .label').each((_, el) => {
        const label = p$(el).text().trim()
        if (label.includes('竣工') || label.includes('完成')) {
          completion = p$(el).next('td, dd, .value').text().trim() || null
        }
        if (label.includes('引渡') || label.includes('入居')) {
          delivery = p$(el).next('td, dd, .value').text().trim() || null
        }
      })

      // 施工会社
      let constructor_: string | null = null
      p$('th, dt').each((_, el) => {
        if (p$(el).text().includes('施工')) {
          constructor_ = p$(el).next('td, dd').text().trim() || null
        }
      })

      // 駐車場・駐輪場
      let parking:         string | null = null
      let bicycleParking:  number | null = null
      p$('th, dt').each((_, el) => {
        const t = p$(el).text()
        if (t.includes('駐車場')) parking = p$(el).next('td, dd').text().trim() || null
        if (t.includes('駐輪')) {
          const n = p$(el).next('td, dd').text().match(/(\d+)台/)
          if (n) bicycleParking = parseInt(n[1])
        }
      })

      // 敷地面積
      let siteArea: number | null = null
      p$('th, dt').each((_, el) => {
        if (p$(el).text().includes('敷地')) {
          const m2 = p$(el).next('td, dd').text().match(/([\d,]+\.?\d*)m/)
          if (m2) siteArea = parseFloat(m2[1].replace(',', ''))
        }
      })

      // 座標取得
      const coords = await geocode(address)
      await sleep(1100)

      const record: MansionRecord = {
        id:              slug(name),
        name,
        developers:      ['大成有楽不動産'],
        ward,
        address,
        lat:             coords?.lat ?? 35.689,
        lng:             coords?.lng ?? 139.762,
        status,
        floors,
        total_units:     totalUnits,
        site_area:       siteArea,
        area_min:        min,
        area_max:        max,
        completion,
        delivery,
        constructor:     constructor_,
        parking,
        bicycle_parking: bicycleParking,
        ceiling_height:  null,
        floor_method:    null,
        disposer:        null,
        eco_type:        null,
        corridor:        null,
        url,
        updated_at:      TODAY,
      }

      records.push(record)
      console.log(`  ✅ ${name}（${ward}）`)
    } catch (e) {
      console.error(`  ⚠️  スキップ: ${url}`, e)
    }
  }

  return records
}
