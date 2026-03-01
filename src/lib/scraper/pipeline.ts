import { createServerClient } from '@/lib/supabase/server'
import { fetchHtml, extractPoliciesFromHtml } from './extractor'
import { SCRAPE_TARGETS, type ScrapeTarget } from './targets'
import { Resend } from 'resend'

export interface ScrapeResult {
  target: ScrapeTarget
  success: boolean
  policiesFound: number
  policiesSkipped: number
  error?: string
}

export async function runScrapingPipeline(): Promise<ScrapeResult[]> {
  const results: ScrapeResult[] = []
  for (const target of SCRAPE_TARGETS) {
    const result = await scrapeTarget(target)
    results.push(result)
    await sleep(2000)
  }
  await notifyAdmin(results)
  return results
}

async function scrapeTarget(target: ScrapeTarget): Promise<ScrapeResult> {
  const supabase = createServerClient()
  const startedAt = new Date().toISOString()

  const { data: logData } = await supabase
    .from('scrape_logs')
    .insert({ target_url: target.url, target_name: target.name, layer: target.layer, ward: target.ward ?? null, status: 'running', policies_found: 0, started_at: startedAt })
    .select('id').single()
  const logId = logData?.id

  try {
    const html = await fetchHtml(target.url)
    const extracted = await extractPoliciesFromHtml({ html, url: target.url, pageName: target.name, layer: target.layer, ward: target.ward })

    // 重複防止: 承認済みの同名制度はスキップ
    const { data: existingApproved } = await supabase.from('policies').select('name').eq('status', 'approved').eq('layer', target.layer).eq('ward', target.ward ?? null)
    const approvedNames = new Set(existingApproved?.map(p => p.name) ?? [])

    // 直近30日以内のドラフトも重複チェック
    const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString()
    const { data: recentDrafts } = await supabase.from('policies').select('name').eq('status', 'draft').eq('layer', target.layer).eq('ward', target.ward ?? null).gte('scraped_at', thirtyDaysAgo)
    const recentDraftNames = new Set(recentDrafts?.map(p => p.name) ?? [])

    let inserted = 0, skipped = 0
    for (const policy of extracted) {
      if (approvedNames.has(policy.name) || recentDraftNames.has(policy.name)) { skipped++; continue }

      const { data: policyData, error: policyError } = await supabase.from('policies').insert({
        layer: target.layer, ward: target.ward ?? null, name: policy.name, category: policy.category ?? null,
        summary: policy.summary, description: policy.description, amount_monthly: policy.amount_monthly,
        amount_lump: policy.amount_lump, amount_note: policy.amount_note, apply_method: policy.apply_method,
        apply_url: policy.apply_url, source_url: target.url, status: 'draft', scraped_at: new Date().toISOString(),
      }).select('id').single()

      if (policyError || !policyData) { console.error(`[pipeline] Insert failed: ${policy.name}`, policyError); continue }
      if (policy.conditions) await supabase.from('policy_conditions').insert({ policy_id: policyData.id, ...policy.conditions })
      inserted++
      recentDraftNames.add(policy.name)
    }

    if (logId) await supabase.from('scrape_logs').update({ status: 'success', policies_found: inserted, finished_at: new Date().toISOString() }).eq('id', logId)
    return { target, success: true, policiesFound: inserted, policiesSkipped: skipped }

  } catch (error) {
    const message = error instanceof Error ? error.message : String(error)
    console.error(`[pipeline] Failed: ${target.name}`, message)
    if (logId) await supabase.from('scrape_logs').update({ status: 'failed', error_message: message, finished_at: new Date().toISOString() }).eq('id', logId)
    return { target, success: false, policiesFound: 0, policiesSkipped: 0, error: message }
  }
}

async function notifyAdmin(results: ScrapeResult[]): Promise<void> {
  if (!process.env.RESEND_API_KEY || !process.env.ADMIN_EMAIL) return
  const resend = new Resend(process.env.RESEND_API_KEY)
  const totalFound = results.reduce((s, r) => s + r.policiesFound, 0)
  const totalSkipped = results.reduce((s, r) => s + r.policiesSkipped, 0)
  const failed = results.filter(r => !r.success)

  try {
    await resend.emails.send({
      from: 'noreply@tokyo-kosodate-navi.com',
      to: process.env.ADMIN_EMAIL,
      subject: `[子育て支援ナビ] スクレイピング完了 - 新規${totalFound}件のドラフト`,
      text: `スクレイピング完了。\n新規ドラフト: ${totalFound}件\nスキップ（重複）: ${totalSkipped}件\n失敗: ${failed.length}件\n\nレビュー: ${process.env.NEXT_PUBLIC_APP_URL}/admin/review\n\n${failed.length > 0 ? '失敗:\n' + failed.map(r => `- ${r.target.name}: ${r.error}`).join('\n') : ''}`,
    })
  } catch (e) { console.error('[pipeline] Email failed:', e) }
}

function sleep(ms: number) { return new Promise(resolve => setTimeout(resolve, ms)) }
