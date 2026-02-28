import type { PolicyLayer } from '@/lib/supabase/types'

export interface ScrapeTarget {
  name: string
  url: string
  layer: PolicyLayer
  ward?: string
  description: string
}

// =============================================
// スクレイピング対象URL一覧（MVP: 5区 + 都 + 国）
// =============================================

export const SCRAPE_TARGETS: ScrapeTarget[] = [
  // ─── 国（こども家庭庁・厚生労働省） ─────────────────
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

  // ─── 東京都 ───────────────────────────────────────
  {
    name: '018サポート（東京都）',
    url: 'https://018support.metro.tokyo.lg.jp/',
    layer: 'tokyo',
    description: '018サポートの制度概要・申請方法',
  },
  {
    name: '赤ちゃんファースト（東京都）',
    url: 'https://akachan-first.metro.tokyo.lg.jp/',
    layer: 'tokyo',
    description: '赤ちゃんファースト（旧はじめての赤ちゃん）の制度概要',
  },
  {
    name: '東京都子育て支援一覧',
    url: 'https://www.fukushi.metro.tokyo.lg.jp/kodomo/index.html',
    layer: 'tokyo',
    description: '東京都福祉局の子育て支援制度一覧',
  },

  // ─── 港区 ─────────────────────────────────────────
  {
    name: '港区子育て支援',
    url: 'https://www.city.minato.tokyo.jp/kosodate/index.html',
    layer: 'ward',
    ward: '港区',
    description: '港区の子育て支援制度一覧',
  },
  {
    name: '港区児童手当・給付金',
    url: 'https://www.city.minato.tokyo.jp/jidouteate/index.html',
    layer: 'ward',
    ward: '港区',
    description: '港区の児童手当・各種給付金',
  },

  // ─── 品川区 ───────────────────────────────────────
  {
    name: '品川区子育て支援',
    url: 'https://www.city.shinagawa.tokyo.jp/PC/kosodate/index.html',
    layer: 'ward',
    ward: '品川区',
    description: '品川区の子育て支援制度一覧',
  },

  // ─── 目黒区 ───────────────────────────────────────
  {
    name: '目黒区子育て支援',
    url: 'https://www.city.meguro.tokyo.jp/kosodate/index.html',
    layer: 'ward',
    ward: '目黒区',
    description: '目黒区の子育て支援制度一覧',
  },

  // ─── 江東区 ───────────────────────────────────────
  {
    name: '江東区子育て支援',
    url: 'https://www.city.koto.lg.jp/390101/kosodate/index.html',
    layer: 'ward',
    ward: '江東区',
    description: '江東区の子育て支援制度一覧',
  },

  // ─── 江戸川区 ─────────────────────────────────────
  {
    name: '江戸川区子育て支援',
    url: 'https://www.city.edogawa.tokyo.jp/kosodate/index.html',
    layer: 'ward',
    ward: '江戸川区',
    description: '江戸川区の子育て支援制度一覧',
  },
]
