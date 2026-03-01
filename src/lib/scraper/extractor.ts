import Anthropic from '@anthropic-ai/sdk'
import type { PolicyLayer } from '@/lib/supabase/types'

const anthropic = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY!,
})

export interface ExtractedPolicy {
  name: string
  category: string | null
  summary: string
  description: string
  amount_monthly: number | null
  amount_lump: number | null
  amount_note: string | null
  apply_method: string | null
  apply_url: string | null
  conditions: {
    child_age_min_months: number | null
    child_age_max_months: number | null
    birth_order_min: number | null
    birth_order_max: number | null
    income_min_man_yen: number | null
    income_max_man_yen: number | null
    other_conditions: string | null
  }
}

const EXTRACTION_PROMPT = `あなたは日本の子育て支援制度の情報を構造化するAIです。
以下のWebページのHTMLコンテンツから、子育て支援制度の情報を抽出してください。

対象ページ: {page_name}
URL: {url}
レイヤー: {layer} （national=国, tokyo=東京都, ward=区）
{ward_info}

---HTMLコンテンツ---
{html_content}
---ここまで---

以下のJSON形式で、このページに含まれる子育て支援制度を全て抽出してください。
複数の制度がある場合は、配列で返してください。
子育てに無関係な情報は無視してください。

categoryは以下から最も適切なものを1つ選んでください:
- "給付金・手当" ... 定期的に現金が支給される制度（児童手当・養育手当等）
- "一時金" ... 出産・入学等の一時的な現金給付（出産育児一時金・出産祝金等）
- "医療費助成" ... 医療費を無料・軽減する制度
- "保育・教育" ... 保育料・学費・幼稚園費用を軽減・無料化する制度
- "育児サービス" ... ベビーシッター・産後ケア・訪問支援等のサービス補助
- "雇用・休業" ... 育児休業給付金・産後パパ育休等の雇用支援
- "税制優遇" ... 住宅ローン控除・扶養控除等の税制上の優遇措置
- "物品・生活支援" ... 自転車・育児用品等の物品購入補助

返すJSONの形式:
[
  {
    "name": "制度名",
    "category": "カテゴリ（上記から1つ）",
    "summary": "1〜2文の概要",
    "description": "詳細説明（申請要件・注意事項含む）",
    "amount_monthly": 月額金額（円、整数）またはnull,
    "amount_lump": 一時金額（円、整数）またはnull,
    "amount_note": "金額の補足（例: 第3子以降は増額など）またはnull",
    "apply_method": "申請方法の説明またはnull",
    "apply_url": "申請ページのURLまたはnull",
    "conditions": {
      "child_age_min_months": 対象子の最低月齢（整数）またはnull,
      "child_age_max_months": 対象子の最高月齢（整数、例: 18歳未満=215）またはnull,
      "birth_order_min": 最小出生順位（整数、例: 第1子以上=1）またはnull,
      "birth_order_max": 最大出生順位（整数）またはnull（上限なし）,
      "income_min_man_yen": 最低世帯年収（万円、整数）またはnull,
      "income_max_man_yen": 最高世帯年収（万円、整数）またはnull（上限なし）,
      "other_conditions": "その他の条件（テキスト）またはnull"
    }
  }
]

注意:
- 金額が「〜万円」の場合は円に変換（例: 10万円 → 100000）
- 年齢が「〜歳未満」の場合は月齢に変換（例: 18歳未満 → 215ヶ月）
- 所得制限なしの場合はincome_max_man_yenをnullに設定
- 抽出できる制度がない場合は空配列 [] を返す
- JSON以外の文字を含めないこと`

export async function extractPoliciesFromHtml(params: {
  html: string
  url: string
  pageName: string
  layer: PolicyLayer
  ward?: string
}): Promise<ExtractedPolicy[]> {
  const { html, url, pageName, layer, ward } = params
  const truncatedHtml = html.slice(0, 50000)

  const prompt = EXTRACTION_PROMPT
    .replace('{page_name}', pageName)
    .replace('{url}', url)
    .replace('{layer}', layer)
    .replace('{ward_info}', ward ? `区名: ${ward}` : '')
    .replace('{html_content}', truncatedHtml)

  const response = await anthropic.messages.create({
    model: 'claude-opus-4-6',
    max_tokens: 4096,
    messages: [{ role: 'user', content: prompt }],
  })

  const text = response.content[0].type === 'text' ? response.content[0].text : ''
  const jsonMatch = text.match(/\[[\s\S]*\]/)
  if (!jsonMatch) {
    console.warn(`[extractor] No JSON found for ${pageName}`)
    return []
  }

  try {
    return JSON.parse(jsonMatch[0]) as ExtractedPolicy[]
  } catch (e) {
    console.error(`[extractor] JSON parse error for ${pageName}:`, e)
    return []
  }
}

export async function fetchHtml(url: string): Promise<string> {
  const response = await fetch(url, {
    headers: {
      'User-Agent': 'Mozilla/5.0 (compatible; TokyoKosodateNavi/1.0; +https://tokyo-kosodate-navi.vercel.app)',
      'Accept-Language': 'ja,en;q=0.9',
    },
    next: { revalidate: 0 },
  })
  if (!response.ok) throw new Error(`HTTP ${response.status} for ${url}`)
  return response.text()
}
