/**
 * JavaScript レンダリングが必要なサイトの対応方針
 *
 * 以下のサイトは React / SPA 等で動的レンダリングされており、
 * fetch + cheerio では物件一覧を取得できません。
 * Playwright を使ったスクレイピング方法を記載します。
 *
 * 対象サイト:
 *   - 野村不動産 プラウド        https://www.proud-web.jp/
 *   - 三井不動産レジデンシャル   https://www.31sumai.com/
 *   - 東急不動産 ブランズ        https://sumai.tokyu-land.co.jp/
 *   - 東京建物 Brillia           https://brillia.com/
 *   - 住友不動産                 https://www.sumitomo-rd-mansion.jp/
 *
 * ========================================================
 * Playwright を使う場合のセットアップ手順:
 * ========================================================
 *
 *   npm install -D playwright
 *   npx playwright install chromium
 *
 * ========================================================
 * Playwright を使った汎用スクレイパー例:
 * ========================================================
 *
 * import { chromium } from 'playwright'
 *
 * const browser = await chromium.launch({ headless: true })
 * const page    = await browser.newPage()
 * await page.setExtraHTTPHeaders({ 'Accept-Language': 'ja' })
 *
 * // 野村不動産 プラウド
 * await page.goto('https://www.proud-web.jp/search/kanto/', { waitUntil: 'networkidle' })
 * const items = await page.$$eval('.property-item', (els) => els.map(el => ({
 *   name:    el.querySelector('.name')?.textContent?.trim(),
 *   address: el.querySelector('.address')?.textContent?.trim(),
 *   units:   el.querySelector('.units')?.textContent?.trim(),
 *   url:     el.querySelector('a')?.href,
 * })))
 *
 * await browser.close()
 *
 * ========================================================
 * Claude による月次更新フロー（Playwrightなしの場合）:
 * ========================================================
 *
 * 1. ユーザーが「新築マンションデータを更新して」と依頼
 * 2. Claude が各社の物件一覧ページを WebFetch で取得
 * 3. 取得した HTML / JSONから物件情報を抽出
 * 4. `scrape-mansions.ts` の MANUAL_UPDATE_ENTRIES に追記
 * 5. `npx tsx scripts/scrape-mansions.ts --merge-manual` を実行
 * 6. seed-mansions.ts が更新される
 *
 * ========================================================
 * 月次更新で追加すべきチェック項目:
 * ========================================================
 *
 * □ 新規物件の追加（各社一覧ページで確認）
 * □ ステータス変更（建築予定→建築中→分譲中）
 * □ 竣工・引渡日の確定（「予定」が確定日に変わることがある）
 * □ 完売・販売終了物件の削除（seed から手動で削除）
 * □ 座標の精度確認（住所が確定した物件はNominatimで再取得）
 */

/**
 * 手動追加エントリー（Claude が WebFetch で収集したデータを記述する場所）
 * 毎月の更新時にここを更新してから `scrape-mansions.ts --merge-manual` を実行
 */
import type { MansionRecord } from '../../src/lib/seed-mansions'

export const MANUAL_UPDATE_ENTRIES: Partial<MansionRecord>[] = [
  // ここに Claude が WebFetch で収集したデータを追記
  // 例:
  // {
  //   id:          'proud-shinjuku-yotsuya-2027',
  //   name:        'プラウド四谷',
  //   developers:  ['野村不動産'],
  //   ward:        '新宿区',
  //   address:     '新宿区四谷1丁目',
  //   status:      '分譲中',
  //   total_units: 38,
  //   url:         'https://www.proud-web.jp/mansion/...',
  // },
]
