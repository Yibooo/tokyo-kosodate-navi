// 都道府県→市区町村マスタ
// layer: ward のデータに対応するエリア定義

export interface AreaCity {
  name: string       // 市区町村名
  prefecture: string // 都道府県名
}

export interface AreaPrefecture {
  name: string       // 都道府県名
  cities: string[]   // 対応する市区町村名一覧
}

// 対応エリア一覧（都道府県グループ）
export const AREA_PREFECTURES: AreaPrefecture[] = [
  {
    name: '東京都',
    cities: [
      '千代田区', '中央区', '港区', '新宿区', '文京区',
      '台東区', '墨田区', '江東区', '葛飾区', '江戸川区',
      '品川区', '目黒区', '大田区',
      '世田谷区', '渋谷区', '中野区', '杉並区',
      '豊島区', '北区', '荒川区', '板橋区', '練馬区', '足立区',
    ],
  },
  {
    name: '埼玉県',
    cities: ['和光市', '川口市', '所沢市'],
  },
  {
    name: '神奈川県',
    cities: ['川崎市', '横浜市'],
  },
  {
    name: '千葉県',
    cities: ['船橋市', '市川市', '松戸市', '流山市'],
  },
  {
    name: '茨城県',
    cities: ['つくば市'],
  },
]

// 市区町村名 → 都道府県名 の逆引きマップ
export const CITY_TO_PREFECTURE: Record<string, string> = Object.fromEntries(
  AREA_PREFECTURES.flatMap(pref =>
    pref.cities.map(city => [city, pref.name])
  )
)

// 全市区町村リスト（フラット）
export const ALL_CITIES: AreaCity[] = AREA_PREFECTURES.flatMap(pref =>
  pref.cities.map(city => ({ name: city, prefecture: pref.name }))
)

// 都道府県名一覧
export const ALL_PREFECTURES: string[] = AREA_PREFECTURES.map(p => p.name)
