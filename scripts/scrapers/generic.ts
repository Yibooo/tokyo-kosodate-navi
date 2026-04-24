/**
 * 汎用スクレイパー（fetch + cheerio）
 * JavaScript レンダリングが不要なサイト向け
 * 対象:
 *   - 三菱地所レジデンス ザ・パークハウス (mecsumai.com)
 *   - 伊藤忠都市開発 クレヴィア (itochu-sumai.com)
 *   - 大京 ライオンズ (lions-mansion.jp)
 *   - 長谷工 バウス (baus-web.jp)
 *   - 小田急不動産 リーフィア (odakyu-leafia.jp)
 */
import * as cheerio from 'cheerio'
import type { MansionRecord } from '../../src/lib/seed-mansions'
import { geocode, sleep } from '../lib/geocode'

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

function parseStatus(text: string): MansionRecord['status'] {
  if (text.includes('分譲中') || text.includes('販売中') || text.includes('好評販売')) return '分譲中'
  if (text.includes('建築中') || text.includes('工事中') || text.includes('建設中')) return '建築中'
  return '建築予定'
}

function parseNumber(text: string, pattern: RegExp): number | null {
  const m = text.match(pattern)
  return m ? parseFloat(m[1].replace(',', '')) : null
}

/** サイト定義 */
interface SiteConfig {
  developer: string
  listUrls:  string[]
  linkFilter: (href: string) => boolean
  prefix:    string
}

const SITES: SiteConfig[] = [
  {
    developer:  '三菱地所レジデンス',
    listUrls:   ['https://www.mecsumai.com/search/list/?area_category=01'],
    linkFilter: (href) => href.includes('mecsumai.com') && /\/tph-|\/tr-/.test(href),
    prefix:     'tph',
  },
  {
    developer:  '伊藤忠都市開発',
    listUrls:   ['https://www.itochu-sumai.com/lineup/?area=tokyo'],
    linkFilter: (href) => href.includes('itochu-sumai.com') && !/\?|#/.test(href.split('.com')[1] ?? ''),
    prefix:     'crevia',
  },
  {
    developer:  '大京',
    listUrls:   ['https://lions-mansion.jp/area/'],
    linkFilter: (href) => href.includes('lions-mansion.jp/MN'),
    prefix:     'lions',
  },
  {
    developer:  '中央日本土地建物・長谷工コーポレーション',
    listUrls:   ['https://www.baus-web.jp/'],
    linkFilter: (href) => href.includes('baus-web.jp/baus/'),
    prefix:     'baus',
  },
]

async function scrapeSite(
  site: SiteConfig,
): Promise<MansionRecord[]> {
  console.log(`🏗️  ${site.developer} スクレイピング開始...`)

  const links: string[] = []
  for (const listUrl of site.listUrls) {
    try {
      const res  = await fetch(listUrl, { headers: { 'User-Agent': USER_AGENT } })
      const html = await res.text()
      const $    = cheerio.load(html)
      $('a[href]').each((_, el) => {
        const href = $( el).attr('href') ?? ''
        const full = href.startsWith('http') ? href : new URL(href, listUrl).toString()
        if (site.linkFilter(full) && !links.includes(full)) links.push(full)
      })
    } catch (e) {
      console.error(`  ❌ 一覧取得失敗: ${listUrl}`, e)
    }
    await sleep(1200)
  }

  console.log(`  📄 物件ページ候補: ${links.length}件`)
  const records: MansionRecord[] = []

  for (const url of links.slice(0, 12)) {
    try {
      await sleep(1200)
      const res = await fetch(url, { headers: { 'User-Agent': USER_AGENT } })
      if (!res.ok) continue

      const html  = await res.text()
      const p$    = cheerio.load(html)
      const body  = p$('body').text()

      const ward = extractWard(body)
      if (!ward) continue

      const name = p$('h1').first().text().trim() ||
                   p$('title').text().split('|')[0].split('【')[0].trim()
      if (!name) continue

      // 住所
      let address = ward
      p$('th, dt, .label, [class*="address"], [class*="location"]').each((_, el) => {
        const t = p$(el).text()
        if (t.includes('所在地') || t.includes('住所')) {
          address = p$(el).next('td, dd, .value').text().trim() || ward
        }
      })

      const totalUnits  = parseNumber(body, /総戸数[^\d]*(\d+)/)
      const areaMin     = parseNumber(body, /専有面積[^\d]*([\d.]+)/)
      const areaMax     = parseNumber(body, /[〜～]([\d.]+)㎡/)
      const floors      = parseNumber(body, /(\d+)階建/)
      const status      = parseStatus(body)

      let completion: string | null = null
      let delivery:   string | null = null
      p$('th, dt').each((_, el) => {
        const t = p$(el).text()
        if (t.includes('竣工') && !completion)
          completion = p$(el).next('td, dd').text().trim() || null
        if ((t.includes('引渡') || t.includes('入居')) && !delivery)
          delivery   = p$(el).next('td, dd').text().trim() || null
      })

      const coords = await geocode(address)
      await sleep(1100)

      const id = `${site.prefix}-${ward.replace('区', '')}-${Date.now()}`
        .replace(/[^\w-]/g, '-').toLowerCase().slice(0, 60)

      records.push({
        id,
        name,
        developers:      site.developer.includes('・')
          ? site.developer.split('・')
          : [site.developer],
        ward,
        address,
        lat:             coords?.lat ?? 35.689,
        lng:             coords?.lng ?? 139.762,
        status,
        floors,
        total_units:     totalUnits,
        site_area:       null,
        area_min:        areaMin,
        area_max:        areaMax,
        completion,
        delivery,
        constructor:     null,
        parking:         null,
        bicycle_parking: null,
        ceiling_height:  null,
        floor_method:    null,
        disposer:        null,
        eco_type:        null,
        corridor:        null,
        station_line:    null,
        nearest_station: null,
        walk_minutes:    null,
        url,
        updated_at:      TODAY,
      })

      console.log(`  ✅ ${name}（${ward}）`)
    } catch (e) {
      console.error(`  ⚠️  スキップ: ${url}`, e)
    }
  }

  return records
}

/** 汎用スクレイパー: 全対象サイトを順番に処理 */
export async function scrapeGenericSites(): Promise<MansionRecord[]> {
  const all: MansionRecord[] = []
  for (const site of SITES) {
    const recs = await scrapeSite(site)
    all.push(...recs)
    await sleep(2000)
  }
  return all
}
