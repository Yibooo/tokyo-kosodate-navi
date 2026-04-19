/**
 * SUUMO 新築マンション スクレイパー
 * =====================================================
 * 対象: https://suumo.jp/ms/shinchiku/tokyo/sc_{区コード}/
 * 方式: fetch + cheerio（静的HTML、JSレンダリング不要）
 * 特徴: 全23区・全デベロッパー網羅
 *
 * 処理フロー:
 *   1. 各区の一覧ページをページネーション付きで取得
 *   2. 物件名で重複除去（同一マンションが複数ユニットで掲載されるため）
 *   3. 各物件詳細ページを取得して dl/dt/dd をパース
 *   4. Nominatim API でジオコード
 */

import * as cheerio from 'cheerio'
import type { MansionRecord, MansionStatus } from '../../src/lib/seed-mansions'
import { geocode, sleep } from '../lib/geocode'

const BASE_URL   = 'https://suumo.jp'
const TODAY      = new Date().toISOString().slice(0, 10)
const USER_AGENT = 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36'
const FETCH_DELAY = 800    // ms between requests
const GEO_DELAY   = 1100   // ms between Nominatim requests (最小1req/sec)

// =============================================
// 23区 → SUUMOのscコード マッピング
// =============================================
export const WARD_CODES: Record<string, string> = {
  '千代田区': 'chiyoda',
  '中央区':   'chuo',
  '港区':     'minato',
  '新宿区':   'shinjuku',
  '文京区':   'bunkyo',
  '台東区':   'taito',
  '墨田区':   'sumida',
  '江東区':   'koto',
  '品川区':   'shinagawa',
  '目黒区':   'meguro',
  '大田区':   'ota',
  '世田谷区': 'setagaya',
  '渋谷区':   'shibuya',
  '中野区':   'nakano',
  '杉並区':   'suginami',
  '豊島区':   'toshima',
  '北区':     'kita',
  '荒川区':   'arakawa',
  '板橋区':   'itabashi',
  '練馬区':   'nerima',
  '足立区':   'adachi',
  '葛飾区':   'katsushika',
  '江戸川区': 'edogawa',
}

// =============================================
// HTML フェッチ ユーティリティ
// =============================================
async function fetchHtml(url: string): Promise<string | null> {
  try {
    const res = await fetch(url, {
      headers: {
        'User-Agent': USER_AGENT,
        'Accept-Language': 'ja,en;q=0.9',
      },
    })
    if (!res.ok) return null
    return await res.text()
  } catch {
    return null
  }
}

// =============================================
// 一覧ページから物件URL収集（重複除去）
// =============================================

/**
 * リンクテキストが有効な物件名かどうか判定
 * 価格行・間取り行・UIボタンなどのゴミを除外する
 */
function isValidPropertyName(name: string): boolean {
  if (!name || name.trim().length < 4)                       return false
  if (/\n/.test(name))                                        return false   // 改行あり = 価格/間取りテキスト
  if (/万円|㎡|LDK|SLDK|先着|価格未定/.test(name))          return false   // 価格・間取り文字列
  if (/間取り|詳細表示|タイプ別|階建/.test(name))             return false   // UIテキスト
  if (/物件TOP|フロアプラン|モデルルーム/.test(name))          return false   // タブナビゲーション
  if (/^\d/.test(name.trim()))                               return false   // 数字始まり = 価格
  if (/^[A-Z0-9F\s]+$/.test(name.trim()))                   return false   // 英数フロア番号のみ
  return true
}

/** 物件名からタブナビゲーション残滓を除去 */
function cleanPropertyName(name: string): string {
  return name
    .replace(/（物件TOP）|（フロアプラン）|（モデルルーム）|（周辺環境）|（会社情報）/g, '')
    .replace(/\(物件TOP\)|\(フロアプラン\)|\(モデルルーム\)/g, '')
    .replace(/\s+/g, ' ')
    .trim()
}

/**
 * 1区分の全ページを巡回し、ユニークな物件URL（nc_XXXXX）を返す
 * 同一マンションが複数ユニット掲載されることがあるため、物件名で重複除去
 */
async function collectPropertyUrls(
  ward: string,
  wardCode: string,
): Promise<Map<string, string>> {  // name → url
  const nameToUrl = new Map<string, string>()
  let page = 1

  while (true) {
    const url  = `${BASE_URL}/ms/shinchiku/tokyo/sc_${wardCode}/?page=${page}`
    const html = await fetchHtml(url)
    if (!html) break

    const $ = cheerio.load(html)

    // 物件リンクを収集: /ms/shinchiku/tokyo/sc_{ward}/nc_{id}/ 形式
    let foundOnPage = 0
    $(`a[href*="/ms/shinchiku/tokyo/sc_${wardCode}/nc_"]`).each((_, el) => {
      const href = $(el).attr('href') ?? ''
      const rawName = $(el).text().trim()
      const name = cleanPropertyName(rawName)
      if (isValidPropertyName(name) && href && !nameToUrl.has(name)) {
        // https への統一・クエリパラメータの除去
        let fullUrl = href.startsWith('http') ? href : `${BASE_URL}${href}`
        fullUrl = fullUrl.replace(/^http:\/\//, 'https://')  // http → https
        fullUrl = fullUrl.replace(/\?.*$/, '')               // クエリパラム除去
        if (!fullUrl.endsWith('/')) fullUrl += '/'
        nameToUrl.set(name, fullUrl)
      }
      foundOnPage++
    })

    // 次ページの有無を確認
    const hasNext = $(`a[href*="sc_${wardCode}/?page=${page + 1}"]`).length > 0
    if (!hasNext || foundOnPage === 0) break

    page++
    await sleep(FETCH_DELAY)
  }

  return nameToUrl
}

// =============================================
// 詳細ページのパース
// =============================================

/**
 * SUUMO の <th> ラベルに対応する <td> の値を返す
 * 各 <tr> に th+td ペアが2組並ぶため、$(el).next('td') で直後の td を取得
 */
function getThText($: cheerio.CheerioAPI, label: string): string | null {
  let result: string | null = null
  $('th').each((_, el) => {
    if ($(el).text().trim().includes(label)) {
      const text = $(el).next('td').text().replace(/\s+/g, ' ').trim()
      if (text) {
        result = text
        return false  // break
      }
    }
  })
  return result
}

/**
 * kaishainfo ページから売主（デベロッパー）を抽出
 * 構造: <dl class="detailtable_summary-info">
 *         <dt>＜売主＞</dt><dd>免許番号</dd><dd>...会員</dd><dd>会社名</dd><dd>〒住所</dd>
 *       </dl>
 * または .pipelink_area_list-company が使える
 */
function extractDevelopersFromPage($: cheerio.CheerioAPI): string[] {
  // 方法1: .pipelink_area_list-company（直接社名）
  const companyEls = $('.pipelink_area_list-company')
  if (companyEls.length > 0) {
    const names = companyEls.map((_, el) => $(el).text().trim()).get()
      .filter(s => s.length > 0)
      .slice(0, 3)
    if (names.length > 0) return names
  }

  // 方法2: <dt>＜売主＞</dt> → 直後の <dd> から会社名を探す
  let found: string[] = []
  $('dt').each((_, el) => {
    if ($(el).text().includes('売主')) {
      $(el).nextAll('dd').each((_, dd) => {
        const text = $(dd).text().trim()
        // 免許番号・会員情報・住所はスキップ
        if (text.match(/^〒|大臣|都知事|協会|加盟|^\d{2,}|^[（(]/)) return
        if (text.length > 2 && text.length < 50) {
          found.push(text.replace(/株式会社|有限会社|合同会社|（株）|㈱/g, '').trim())
        }
      })
      return false  // break
    }
  })
  if (found.length > 0) return found.slice(0, 3)

  return ['不明']
}

/** "54.62m²～72.01m²" → { min: 54.62, max: 72.01 } */
function parseArea(text: string): { min: number | null; max: number | null } {
  const nums = [...text.matchAll(/[\d.]+(?=\s*m[²2])/g)].map(m => parseFloat(m[0]))
  if (nums.length === 0) return { min: null, max: null }
  if (nums.length === 1) return { min: nums[0], max: null }
  return { min: Math.min(...nums), max: Math.max(...nums) }
}

/** "SRC24階地下2階建" → 24 */
function parseFloors(text: string): number | null {
  const m = text.match(/(\d+)階(?:地下\d+階)?建/)
  return m ? parseInt(m[1]) : null
}

/** "27戸（他管理員室1戸）" → 27 */
function parseUnits(text: string): number | null {
  const m = text.match(/^(\d+)/)
  return m ? parseInt(m[1]) : null
}

/** "56台収容（料金未定）" → 56 */
function parseBicycleParking(text: string): number | null {
  const m = text.match(/^(\d+)\s*台/)
  return m ? parseInt(m[1]) : null
}

/** "12345.67m²" → 12345.67 */
function parseSiteArea(text: string): number | null {
  const m = text.match(/([\d,]+(?:\.\d+)?)\s*m[²2]/)
  if (!m) return null
  return parseFloat(m[1].replace(/,/g, ''))
}

/** 売主テキストから法人格を除去してデベロッパー名を抽出 */
function parseDevelopers(text: string): string[] {
  return text
    .split(/[・、,，\n]/)
    .map(s => s
      .replace(/株式会社|有限会社|合同会社|（株）|㈱/g, '')
      .replace(/\s+/g, '')
      .trim()
    )
    .filter(s => s.length > 0)
    .slice(0, 3)  // 最大3社
}

/** ページ全文からステータスを判定 */
function parseStatus(bodyText: string): MansionStatus {
  if (/分譲中|好評分譲|販売中|好評販売/.test(bodyText)) return '分譲中'
  if (/建築中|工事中|建設中/.test(bodyText))            return '建築中'
  return '建築予定'
}

const KNOWN_WARDS = [
  '千代田区','中央区','港区','新宿区','文京区','台東区','墨田区','江東区',
  '品川区','目黒区','大田区','世田谷区','渋谷区','中野区','杉並区',
  '豊島区','北区','荒川区','板橋区','練馬区','足立区','葛飾区','江戸川区',
]

/** 住所から区名を抽出（23区ホワイトリスト方式）*/
function extractWard(address: string): string | null {
  return KNOWN_WARDS.find(w => address.includes(w)) ?? null
}

/**
 * 詳細ページ1件を MansionRecord にパース
 * 3ページ取得:
 *   nc_XXXXX/          → 物件名・基本情報
 *   nc_XXXXX/property/ → 建物概要（構造・階建て, 完成時期, 敷地面積, 駐車場 etc.）
 *   nc_XXXXX/kaishainfo/ → 売主（デベロッパー）・施工会社
 */
async function parseDetailPage(
  url:      string,
  fallbackWard: string,
): Promise<Omit<MansionRecord, 'lat' | 'lng'> | null> {
  // 正規化: URLを nc_XXXXX/ の形式に統一
  const baseUrl = url
    .replace(/^http:\/\//, 'https://')    // http → https
    .replace(/\?.*$/, '')                  // クエリパラム除去
    .replace(/\/$/, '')
    .replace(/\/(property|kaishainfo|rooms|images|map|modelroom|report).*$/, '')

  // トップページ: 物件名・基本情報
  const topHtml = await fetchHtml(baseUrl + '/')
  if (!topHtml) return null
  const $top  = cheerio.load(topHtml)
  const body  = $top('body').text()

  // 物件名 (h1から取得。価格・タブナビ残滓を除去)
  const rawH1 = $top('h1').first().text()
    .replace(/\s+/g, ' ')
    .replace(/\s+[\d０-９]+[億万][円\d０-９万億]*.*$/, '')  // 価格除去: "1億5800万円..." "3980万円..."
    .replace(/\d+万円.*$/, '')                              // 念のため補完
    .trim()
  const name = cleanPropertyName(rawH1)
  if (!name) return null

  // 住所（トップページから取得）
  const rawAddress = getThText($top, '所在地') ?? ''
  const address    = rawAddress
    .replace(/（地番）.*$/, '').replace(/\(地番\).*$/, '')
    .replace(/地図を見る.*$/, '')
    .replace(/^東京都/, '')
    .trim() || fallbackWard

  const ward = extractWard(address) ?? fallbackWard

  // 基本フィールド（トップページ）
  const unitsRaw  = getThText($top, '総戸数')  ?? ''
  const areaRaw   = getThText($top, '専有面積') ?? ''
  const deliveryRaw = getThText($top, '引渡可能時期') ?? getThText($top, '入居可能時期') ?? null
  const total_units = parseUnits(unitsRaw)
  const { min: area_min, max: area_max } = parseArea(areaRaw)
  const delivery = deliveryRaw?.replace(/（.*?）/g, '').trim() || null

  await sleep(FETCH_DELAY)

  // 物件概要ページ: 建物詳細
  const propHtml = await fetchHtml(baseUrl + '/property/')
  let floors: number | null         = null
  let site_area: number | null      = null
  let parking: string | null        = null
  let bicycle_parking: number | null = null
  let completion: string | null     = null

  if (propHtml) {
    const $p      = cheerio.load(propHtml)
    const floorsRaw   = getThText($p, '構造・階建て') ?? getThText($p, '構造/階建て') ?? ''
    const siteAreaRaw = getThText($p, '敷地面積')     ?? ''
    const parkingRaw  = getThText($p, '駐車場')       ?? ''
    const bicycleRaw  = getThText($p, '駐輪場')       ?? ''
    const completionRaw = getThText($p, '完成時期')   ?? getThText($p, '竣工') ?? null

    floors      = parseFloors(floorsRaw)
    site_area   = parseSiteArea(siteAreaRaw)
    parking     = parkingRaw || null
    bicycle_parking = parseBicycleParking(bicycleRaw)
    completion  = completionRaw?.replace(/（.*?）/g, '').replace(/下旬予定|上旬予定|中旬予定/g, s => s).trim() || null
  }

  await sleep(FETCH_DELAY)

  // 会社情報ページ: 売主・施工
  const kaishHtml = await fetchHtml(baseUrl + '/kaishainfo/')
  let developers: string[]      = ['不明']
  let constructor: string | null = null

  if (kaishHtml) {
    const $k = cheerio.load(kaishHtml)
    developers  = extractDevelopersFromPage($k)
    const constrRaw = getThText($k, '施工')
    constructor = constrRaw
      ? constrRaw.replace(/株式会社|有限会社|合同会社|（株）|㈱/g, '').trim() || null
      : null
  }

  // ステータス（トップページ全体テキストで判定）
  const status = parseStatus(body)

  // ID
  const ncMatch = baseUrl.match(/\/nc_(\d+)/)
  const id      = ncMatch ? `suumo-nc${ncMatch[1]}` : `suumo-${Date.now()}`

  return {
    id,
    name,
    developers,
    ward,
    address: address || ward,
    status,
    floors,
    total_units,
    site_area,
    area_min,
    area_max,
    completion,
    delivery,
    constructor,
    parking,
    bicycle_parking,
    ceiling_height:  null,
    floor_method:    null,
    disposer:        null,
    eco_type:        null,
    corridor:        null,
    url: baseUrl + '/',
    updated_at:      TODAY,
  }
}

// =============================================
// メイン: 指定区のスクレイピング
// =============================================

export async function scrapeWard(
  ward:     string,
  wardCode: string,
): Promise<MansionRecord[]> {
  console.log(`\n🏙️  ${ward} スクレイピング開始...`)

  // Step1: 一覧ページから物件URL収集
  const nameToUrl = await collectPropertyUrls(ward, wardCode)
  console.log(`  📋 ユニーク物件数: ${nameToUrl.size} 件`)
  if (nameToUrl.size === 0) return []

  await sleep(FETCH_DELAY)

  const records: MansionRecord[] = []
  let i = 0

  for (const [name, url] of nameToUrl) {
    i++
    process.stdout.write(`  [${String(i).padStart(2)}/${nameToUrl.size}] ${name.slice(0, 28).padEnd(28)} `)

    // Step2: 詳細ページパース
    const partial = await parseDetailPage(url, ward)
    await sleep(FETCH_DELAY)

    if (!partial) {
      process.stdout.write('⚠️  スキップ\n')
      continue
    }

    // Step3: ジオコード（番地・号を除去して丁目レベルで検索）
    const rawGeoAddr = partial.address.startsWith('東京都')
      ? partial.address
      : `東京都${partial.address}`
    // Nominatim は番地レベルを認識しないため、丁目/町レベルに丸める
    // 例: "西小岩１丁目2170" → "西小岩1丁目"
    //     "平井６-1745（地番）、（ブリーズ…）" → "平井6丁目"
    //     "一之江７-89-5" → "一之江7丁目"
    const geoAddr = rawGeoAddr
      .replace(/、.*$/, '')               // 複数住所: 最初の住所のみ使用
      .replace(/（.*?）/g, '')            // 括弧内テキスト除去（地番・建物名等）
      .replace(/\(.*?\)/g, '')
      // 全角数字→半角（Nominatim は半角のみ認識）
      .replace(/[０-９]/g, (c: string) => String.fromCharCode(c.charCodeAt(0) - 0xFEE0))
      .replace(/(\d+丁目)\d+.*$/, '$1')  // "1丁目2170" → "1丁目"
      .replace(/\d+番地?\d*号?.*$/, '')  // "21番地" "21番9号" → 除去
      .replace(/-\d+(?:-\d+)*$/, '')     // "7-89-5" → "7"
      // 末尾が数字のみ（丁目なし）の場合は "丁目" を補完
      // 例: "一之江7" → "一之江7丁目" でNominatim認識率アップ
      .replace(/([^丁目\d])(\d+)$/, '$1$2丁目')
      .trim()
    const coords = await geocode(geoAddr)
    await sleep(GEO_DELAY)

    // 東京都外の座標（区中心座標フォールバック）
    const WARD_FALLBACK: Record<string, [number, number]> = {
      '千代田区': [35.6938, 139.7536], '中央区':   [35.6709, 139.7728],
      '港区':     [35.6581, 139.7514], '新宿区':   [35.6938, 139.7034],
      '文京区':   [35.7081, 139.7522], '台東区':   [35.7126, 139.7799],
      '墨田区':   [35.7101, 139.8014], '江東区':   [35.6690, 139.8171],
      '品川区':   [35.6090, 139.7300], '目黒区':   [35.6333, 139.6979],
      '大田区':   [35.5618, 139.7160], '世田谷区': [35.6464, 139.6530],
      '渋谷区':   [35.6640, 139.6982], '中野区':   [35.7073, 139.6640],
      '杉並区':   [35.6995, 139.6365], '豊島区':   [35.7214, 139.7139],
      '北区':     [35.7528, 139.7336], '荒川区':   [35.7358, 139.7824],
      '板橋区':   [35.7507, 139.7098], '練馬区':   [35.7357, 139.6522],
      '足立区':   [35.7752, 139.8044], '葛飾区':   [35.7344, 139.8472],
      '江戸川区': [35.7069, 139.8688],
    }

    const fb  = WARD_FALLBACK[partial.ward] ?? [35.689, 139.762]
    let   lat = coords?.lat ?? fb[0]
    let   lng = coords?.lng ?? fb[1]

    // 東京都外座標の検出（緯度35.4未満 or 経度139.4未満）
    if (lat < 35.4 || lng < 139.4) {
      lat = fb[0]
      lng = fb[1]
    }

    const record: MansionRecord = { ...partial, lat, lng }
    records.push(record)

    const coordSrc = coords && lat !== fb[0] ? '✅' : '📍区中心'
    process.stdout.write(`→ ${lat.toFixed(4)},${lng.toFixed(4)} ${coordSrc}\n`)
  }

  // 詳細ページで判明した物件名でさらに重複除去
  // 全角/半角・空白・記号を正規化してから比較
  function normalizeKey(name: string): string {
    return name
      .replace(/[\s\u3000　]+/g, '')                                        // 空白除去
      .replace(/[Ａ-Ｚａ-ｚ０-９]/g, c =>
        String.fromCharCode(c.charCodeAt(0) - 0xFEE0))                    // 全角英数→半角
      .replace(/[・．【】〇◇「」（）()]/g, '')                               // 記号除去
      .replace(/[^\w\u3040-\u9FFF]/g, '')                                  // 残余記号除去
      .toUpperCase()
  }
  const dedupedByName = new Map<string, MansionRecord>()
  for (const r of records) {
    const key = normalizeKey(r.name)
    if (!dedupedByName.has(key)) {
      dedupedByName.set(key, r)
    }
  }
  const deduped = [...dedupedByName.values()]
  if (deduped.length < records.length) {
    console.log(`  🔧 詳細名重複除去: ${records.length} → ${deduped.length} 件`)
  }

  console.log(`  ✅ ${ward}: ${deduped.length} 件取得完了`)
  return deduped
}

// =============================================
// エクスポート: 全区 or 指定区リスト
// =============================================

export async function scrapeSuumo(
  targetWards?: string[],
): Promise<MansionRecord[]> {
  const wards = targetWards ?? Object.keys(WARD_CODES)
  const all: MansionRecord[] = []

  for (const ward of wards) {
    const code = WARD_CODES[ward]
    if (!code) {
      console.warn(`⚠️  不明な区名: ${ward}`)
      continue
    }
    const records = await scrapeWard(ward, code)
    all.push(...records)
    await sleep(2000)  // 区切りの待機
  }

  return all
}
