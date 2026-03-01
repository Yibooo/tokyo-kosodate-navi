import type { PolicyLayer } from '@/lib/supabase/types'

export interface ScrapeTarget {
  name: string
  url: string
  layer: PolicyLayer
  ward?: string
  description: string
}

// =============================================
// スクレイピング対象URL一覧（23区 + 都 + 国）
// =============================================

export const SCRAPE_TARGETS: ScrapeTarget[] = [
  // ─── 国 ───────────────────────────────────────────
  {
    name: '児童手当（こども家庭庁）',
    url: 'https://www.cfa.go.jp/policies/kokoseido/jidouteate/',
    layer: 'national',
    description: '児童手当の制度概要・金額・申請方法',
  },
  {
    name: '出産育児一時金（厚生労働省）',
    url: 'https://www.mhlw.go.jp/stf/seisakunitsuite/bunya/kenkou_iryou/iryouhoken/shussan/index.html',
    layer: 'national',
    description: '出産育児一時金の制度概要・金額',
  },
  {
    name: '育児休業給付金（厚生労働省）',
    url: 'https://www.mhlw.go.jp/stf/seisakunitsuite/bunya/0000135090.html',
    layer: 'national',
    description: '育児休業給付金の制度概要・金額・申請方法',
  },
  {
    name: '幼児教育・保育の無償化（こども家庭庁）',
    url: 'https://www.cfa.go.jp/policies/kokoseido/mushouka/',
    layer: 'national',
    description: '3〜5歳・住民税非課税世帯の保育料無償化',
  },
  {
    name: '高等学校等就学支援金（文部科学省）',
    url: 'https://www.mext.go.jp/a_menu/shotou/mushouka/index.htm',
    layer: 'national',
    description: '高校授業料無償化の制度概要',
  },

  // ─── 東京都 ─────────────────────────────────────
  {
    name: '018サポート（東京都）',
    url: 'https://018support.metro.tokyo.lg.jp/',
    layer: 'tokyo',
    description: '018サポートの制度概要・申請方法',
  },
  {
    name: '東京都子育て支援（福祉局）',
    url: 'https://www.fukushi.metro.tokyo.lg.jp/kodomo/index.html',
    layer: 'tokyo',
    description: '東京都福祉局の子育て支援制度一覧',
  },

  // ─── 千代田区 ────────────────────────────────────
  { name: '千代田区子育て支援', url: 'https://www.city.chiyoda.lg.jp/kosei/kosodate/index.html', layer: 'ward', ward: '千代田区', description: '千代田区の子育て支援制度一覧' },
  // ─── 中央区 ─────────────────────────────────────
  { name: '中央区子育て支援', url: 'https://www.city.chuo.lg.jp/kosodate/index.html', layer: 'ward', ward: '中央区', description: '中央区の子育て支援制度一覧' },
  // ─── 港区 ───────────────────────────────────────
  { name: '港区子育て支援', url: 'https://www.city.minato.tokyo.jp/kosodate/index.html', layer: 'ward', ward: '港区', description: '港区の子育て支援制度一覧' },
  // ─── 新宿区 ─────────────────────────────────────
  { name: '新宿区子育て支援', url: 'https://www.city.shinjuku.lg.jp/kodomo/index.html', layer: 'ward', ward: '新宿区', description: '新宿区の子育て支援制度一覧' },
  // ─── 文京区 ─────────────────────────────────────
  { name: '文京区子育て支援', url: 'https://www.city.bunkyo.lg.jp/kosodate/index.html', layer: 'ward', ward: '文京区', description: '文京区の子育て支援制度一覧' },
  // ─── 台東区 ─────────────────────────────────────
  { name: '台東区子育て支援', url: 'https://www.city.taito.lg.jp/kosodate/index.html', layer: 'ward', ward: '台東区', description: '台東区の子育て支援制度一覧' },
  // ─── 墨田区 ─────────────────────────────────────
  { name: '墨田区子育て支援', url: 'https://www.city.sumida.lg.jp/kosodate/index.html', layer: 'ward', ward: '墨田区', description: '墨田区の子育て支援制度一覧' },
  // ─── 江東区 ─────────────────────────────────────
  { name: '江東区子育て支援', url: 'https://www.city.koto.lg.jp/390101/kosodate/index.html', layer: 'ward', ward: '江東区', description: '江東区の子育て支援制度一覧' },
  // ─── 品川区 ─────────────────────────────────────
  { name: '品川区子育て支援', url: 'https://www.city.shinagawa.tokyo.jp/PC/kosodate/index.html', layer: 'ward', ward: '品川区', description: '品川区の子育て支援制度一覧' },
  // ─── 目黒区 ─────────────────────────────────────
  { name: '目黒区子育て支援', url: 'https://www.city.meguro.tokyo.jp/kosodate/index.html', layer: 'ward', ward: '目黒区', description: '目黒区の子育て支援制度一覧' },
  // ─── 大田区 ─────────────────────────────────────
  { name: '大田区子育て支援', url: 'https://www.city.ota.tokyo.jp/seikatsu/kodomo/index.html', layer: 'ward', ward: '大田区', description: '大田区の子育て支援制度一覧' },
  // ─── 世田谷区 ───────────────────────────────────
  { name: '世田谷区子育て支援', url: 'https://www.city.setagaya.lg.jp/mokuji/kodomo/index.html', layer: 'ward', ward: '世田谷区', description: '世田谷区の子育て支援制度一覧' },
  // ─── 渋谷区 ─────────────────────────────────────
  { name: '渋谷区子育て支援', url: 'https://www.city.shibuya.tokyo.jp/kodomo/index.html', layer: 'ward', ward: '渋谷区', description: '渋谷区の子育て支援制度（保育料完全無料化など）' },
  // ─── 中野区 ─────────────────────────────────────
  { name: '中野区子育て支援', url: 'https://www.city.tokyo-nakano.lg.jp/dept/400000/index.html', layer: 'ward', ward: '中野区', description: '中野区の子育て支援制度一覧' },
  // ─── 杉並区 ─────────────────────────────────────
  { name: '杉並区子育て支援', url: 'https://www.city.suginami.tokyo.jp/guide/kosodate/index.html', layer: 'ward', ward: '杉並区', description: '杉並区の子育て支援制度一覧' },
  // ─── 豊島区 ─────────────────────────────────────
  { name: '豊島区子育て支援', url: 'https://www.city.toshima.lg.jp/1/kosodate/index.html', layer: 'ward', ward: '豊島区', description: '豊島区の子育て支援制度一覧' },
  // ─── 北区 ───────────────────────────────────────
  { name: '北区子育て支援', url: 'https://www.city.kita.tokyo.jp/k-kosodate/index.html', layer: 'ward', ward: '北区', description: '北区の子育て支援制度一覧' },
  // ─── 荒川区 ─────────────────────────────────────
  { name: '荒川区子育て支援', url: 'https://www.city.arakawa.tokyo.jp/kosodate/index.html', layer: 'ward', ward: '荒川区', description: '荒川区の子育て支援制度一覧' },
  // ─── 板橋区 ─────────────────────────────────────
  { name: '板橋区子育て支援', url: 'https://www.city.itabashi.tokyo.jp/kosodate/index.html', layer: 'ward', ward: '板橋区', description: '板橋区の子育て支援制度一覧' },
  // ─── 練馬区 ─────────────────────────────────────
  { name: '練馬区子育て支援', url: 'https://www.nerima-kodomoegao.jp/', layer: 'ward', ward: '練馬区', description: '練馬区の子育て支援制度一覧' },
  // ─── 足立区 ─────────────────────────────────────
  { name: '足立区子育て支援', url: 'https://www.city.adachi.tokyo.jp/kosodate/index.html', layer: 'ward', ward: '足立区', description: '足立区の子育て支援制度一覧（出産祝金が手厚い）' },
  // ─── 葛飾区 ─────────────────────────────────────
  { name: '葛飾区子育て支援', url: 'https://www.city.katsushika.lg.jp/kosodate/index.html', layer: 'ward', ward: '葛飾区', description: '葛飾区の子育て支援制度一覧' },
  // ─── 江戸川区 ───────────────────────────────────
  { name: '江戸川区子育て支援', url: 'https://www.city.edogawa.tokyo.jp/kosodate/index.html', layer: 'ward', ward: '江戸川区', description: '江戸川区の子育て支援制度一覧（乳児養育手当など）' },
]
