import type { MatchedPolicy } from '@/lib/matcher'

export interface CompareAreaInput {
  prefecture: string
  ward: string
}

export interface CompareAreaResult extends CompareAreaInput {
  policies: MatchedPolicy[]
}

export interface CompareCell {
  monthly_amount: number
  lump_amount: number | null
  amount_note: string | null
  apply_url: string | null
  summary: string
  reason: string
}

export interface CompareRow {
  name: string
  layer: 'national' | 'tokyo' | 'pref' | 'ward'
  category: string | null
  summary: string
  // null = そのエリアでは対象外 or 制度なし
  cells: (CompareCell | null)[]
}

const LAYER_ORDER: Record<string, number> = {
  national: 0,
  tokyo:    1,
  pref:     2,
  ward:     3,
}

/**
 * 複数エリアの結果を受け取り、同一制度名でマージした比較行を構築する
 * - national / tokyo / pref / ward 問わず同一名の制度は同じ行に並べる
 * - 一方のエリアにしかない制度は他エリアのセルが null になる
 */
export function buildCompareRows(results: CompareAreaResult[]): CompareRow[] {
  // 全エリアの全制度名を収集（初出のメタデータを優先）
  const nameMap = new Map<string, { layer: string; category: string | null; summary: string }>()

  for (const result of results) {
    for (const policy of result.policies) {
      if (!nameMap.has(policy.name)) {
        nameMap.set(policy.name, {
          layer:    policy.layer,
          category: policy.category,
          summary:  policy.summary,
        })
      }
    }
  }

  // 各制度名ごとに CompareRow を構築
  const rows: CompareRow[] = []

  for (const [name, info] of nameMap) {
    const cells: (CompareCell | null)[] = results.map(result => {
      const policy = result.policies.find(p => p.name === name)
      if (!policy) return null
      return {
        monthly_amount: policy.monthly_amount,
        lump_amount:    policy.lump_amount,
        amount_note:    policy.amount_note,
        apply_url:      policy.apply_url,
        summary:        policy.summary,
        reason:         policy.reason,
      }
    })

    rows.push({
      name,
      layer:    info.layer as 'national' | 'tokyo' | 'pref' | 'ward',
      category: info.category,
      summary:  info.summary,
      cells,
    })
  }

  // ソート: 層（国→都→県→市区町村）→ 金額スコア降順
  rows.sort((a, b) => {
    const layerDiff = (LAYER_ORDER[a.layer] ?? 4) - (LAYER_ORDER[b.layer] ?? 4)
    if (layerDiff !== 0) return layerDiff
    const score = (cells: (CompareCell | null)[]) =>
      Math.max(...cells.map(c => c ? (c.monthly_amount ?? 0) * 12 + (c.lump_amount ?? 0) * 0.5 : 0))
    return score(b.cells) - score(a.cells)
  })

  return rows
}
