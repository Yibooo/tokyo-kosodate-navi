/**
 * Nominatim API を使った住所→座標変換ユーティリティ
 * 利用規約: https://operations.osmfoundation.org/policies/nominatim/
 * - Rate limit: 1 req/sec
 * - User-Agent 必須
 */

const NOMINATIM_URL = 'https://nominatim.openstreetmap.org/search'
const USER_AGENT    = 'tokyo-kosodate-navi/1.0 (https://github.com/Yibooo/tokyo-kosodate-navi)'

export interface Coords {
  lat: number
  lng: number
}

/** 住所 → { lat, lng }。取得できない場合は null を返す */
export async function geocode(address: string): Promise<Coords | null> {
  const url = new URL(NOMINATIM_URL)
  url.searchParams.set('q', `${address}, 東京都`)
  url.searchParams.set('format', 'json')
  url.searchParams.set('limit', '1')
  url.searchParams.set('accept-language', 'ja')
  url.searchParams.set('countrycodes', 'jp')

  try {
    const res = await fetch(url.toString(), {
      headers: { 'User-Agent': USER_AGENT },
    })
    if (!res.ok) return null
    const data = await res.json() as Array<{ lat: string; lon: string }>
    if (!data.length) return null
    return {
      lat: parseFloat(data[0].lat),
      lng: parseFloat(data[0].lon),
    }
  } catch {
    return null
  }
}

/** Rate limit 対応: n ミリ秒待機 */
export function sleep(ms: number): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, ms))
}

/** 住所リストを順番にジオコード（1件/秒） */
export async function batchGeocode(
  addresses: string[],
  onProgress?: (address: string, result: Coords | null, i: number, total: number) => void,
): Promise<Map<string, Coords | null>> {
  const results = new Map<string, Coords | null>()
  for (let i = 0; i < addresses.length; i++) {
    const address = addresses[i]
    const coords = await geocode(address)
    results.set(address, coords)
    onProgress?.(address, coords, i + 1, addresses.length)
    if (i < addresses.length - 1) await sleep(1100)  // 1.1秒間隔
  }
  return results
}
