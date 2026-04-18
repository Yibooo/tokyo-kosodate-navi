/**
 * オープンハウス・ディベロップメント スクレイパー
 * 対象: https://ms.ohd.openhouse-group.com/search/kanto/
 * 方式: fetch + cheerio（物件一覧 JSON API を利用）
 * robots.txt: 制限なし ✅
 */
import * as cheerio from 'cheerio'
import type { MansionRecord } from '../../src/lib/seed-mansions'
import { geocode, sleep } from '../lib/geocode'

const BASE_URL   = 'https://ms.ohd.openhouse-group.com'
const LIST_URL   = 'https://ms.ohd.openhouse-group.com/search/kanto/'
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
  if (text.includes('分譲中') || text.includes('販売中')) return '分譲中'
  if (text.includes('建築中') || text.includes('工事中')) return '建築中'
  return '建築予定'
}

function slug(name: string, ward: string): string {
  return ('openhouse-' + ward.replace('区', '') + '-' + name)
    .replace(/[^\w\u3040-\u9FFF]/g, '-')
    .replace(/-+/g, '-')
    .toLowerCase()
    .slice(0, 60)
}

export async function scrapeOpenhouse(): Promise<MansionRecord[]> {
  console.log('🏗️  オープンハウス スクレイピング開始...')

  let html: string
  try {
    const res = await fetch(LIST_URL, {
      headers: {
        'User-Agent': USER_AGENT,
        'Accept-Language': 'ja',
      },
    })
    if (!res.ok) throw new Error(`HTTP ${res.status}`)
    html = await res.text()
  } catch (e) {
    console.error('  ❌ 一覧ページ取得失敗:', e)
    return []
  }

  const $ = cheerio.load(html)
  const links: string[] = []

  // 物件詳細ページへのリンクを収集
  $('a[href]').each((_, el) => {
    const href = $(el).attr('href') ?? ''
    const full = href.startsWith('http') ? href : BASE_URL + href
    if (
      full.includes('ohd.openhouse-group.com/bukken') &&
      !links.includes(full)
    ) {
      links.push(full)
    }
  })

  console.log(`  📄 物件ページ候補: ${links.length}件`)

  const records: MansionRecord[] = []

  for (const url of links.slice(0, 15)) {
    try {
      await sleep(1200)
      const res = await fetch(url, { headers: { 'User-Agent': USER_AGENT } })
      if (!res.ok) continue

      const pageHtml = await res.text()
      const p$ = cheerio.load(pageHtml)
      const bodyText = p$('body').text()

      const ward = extractWard(bodyText)
      if (!ward) continue  // 23区外はスキップ

      const name = p$('h1').first().text().trim() ||
                   p$('title').text().split('|')[0].trim()

      // 住所
      let address = ward
      p$('th, dt, .spec-label').each((_, el) => {
        const label = p$(el).text()
        if (label.includes('所在地') || label.includes('住所')) {
          address = p$(el).next('td, dd, .spec-value').text().trim() || ward
        }
      })

      // スペック
      let totalUnits: number | null = null
      let areaMin:    number | null = null
      let areaMax:    number | null = null
      let floors:     number | null = null
      let completion: string | null = null
      let delivery:   string | null = null

      p$('th, dt, .spec-label').each((_, el) => {
        const label  = p$(el).text()
        const value  = p$(el).next('td, dd, .spec-value').text().trim()

        if (label.includes('総戸数') || label.includes('戸数')) {
          const m = value.match(/(\d+)/)
          if (m) totalUnits = parseInt(m[1])
        }
        if (label.includes('専有面積')) {
          const range = value.match(/([\d.]+)[〜～]([\d.]+)/)
          const single = value.match(/([\d.]+)/)
          if (range) { areaMin = parseFloat(range[1]); areaMax = parseFloat(range[2]) }
          else if (single) { areaMin = parseFloat(single[1]) }
        }
        if (label.includes('階建')) {
          const m = value.match(/(\d+)/)
          if (m) floors = parseInt(m[1])
        }
        if (label.includes('竣工') || label.includes('完成予定')) {
          completion = value || null
        }
        if (label.includes('引渡') || label.includes('入居予定')) {
          delivery = value || null
        }
      })

      const status = parseStatus(bodyText)
      const coords = await geocode(address)
      await sleep(1100)

      records.push({
        id:              slug(name, ward),
        name,
        developers:      ['オープンハウス・ディベロップメント'],
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
