import { createServerClient } from '@/lib/supabase/server'
import { fetchHtml, extractPoliciesFromHtml } from './extractor'
import { SCRAPE_TARGETS, type ScrapeTarget } from './targets'
import { Resend } from 'resend'

export interface ScrapeResult {
  target: ScrapeTarget
  success: boolean
  policiesFound: number
  error?: string
}

// =============================================
// メインパイプライン: 全ターゲットをスクレイピング
// =============================================
export async function runScrapingPipeline(): Promise<ScrapeResult[]> {
  const results: ScrapeResult[] = []

  for (const target of SCRAPE_TARGETS) {
    const result = await scrapeTarget(target)
    results.push(result)

    // API制限・サーバー負荷を考慮して2秒待機
    await sleep(2000)
  }

  // 完了後に管理者へメール通知
  await notifyAdmin(results)

  return results
}

// =============================================
// 単一ターゲットのスクレイピング
// =============================================
async function scrapeTarget(target: ScrapeTarget): Promise<ScrapeResult> {
  const supabase = createServerClient()
  const startedAt = new Date().toISOString()

  // ログ記録（開始）
  const { data: logData } = await supabase
    .from('scrape_logs')
    .insert({
      target_url: target.url,
      target_name: target.name,
      layer: target.layer,
      ward: target.ward ?? null,
      status: 'running',
      policies_found: 0,
      started_at: startedAt,
    })
    .select('id')
    .single()

  const logId = logData?.id

  try {
    // 1. HTMLを取得
    const html = await fetchHtml(target.url)

    // 2. ClaudeでJSONに変換
    const extracted = await extractPoliciesFromHtml({
      html,
      url: target.url,
      pageName: target.name,
      layer: target.layer,
      ward: target.ward,
    })

    // 3. DBにdraftとして保存
    for (const policy of extracted) {
      const { data: policyData, error: policyError } = await supabase
        .from('policies')
        .insert({
          layer: target.layer,
          ward: target.ward ?? null,
          name: policy.name,
          summary: policy.summary,
          description: policy.description,
          amount_monthly: policy.amount_monthly,
          amount_lump: policy.amount_lump,
          amount_note: policy.amount_note,
          apply_method: policy.apply_method,
          apply_url: policy.apply_url,
          source_url: target.url,
          status: 'draft',
          scraped_at: new Date().toISOString(),
        })
        .select('id')
        .single()

      if (policyError || !policyData) {
        console.error(`[pipeline] Failed to insert policy: ${policy.name}`, policyError)
        continue
      }

      // 4. 条件テーブルも保存
      if (policy.conditions) {
        await supabase.from('policy_conditions').insert({
          policy_id: policyData.id,
          ...policy.conditions,
        })
      }
    }

    // ログ更新（成功）
    if (logId) {
      await supabase
        .from('scrape_logs')
        .update({
          status: 'success',
          policies_found: extracted.length,
          finished_at: new Date().toISOString(),
        })
        .eq('id', logId)
    }

    return { target, success: true, policiesFound: extracted.length }

  } catch (error) {
    const message = error instanceof Error ? error.message : String(error)
    console.error(`[pipeline] Failed to scrape ${target.name}:`, message)

    // ログ更新（失敗）
    if (logId) {
      await supabase
        .from('scrape_logs')
        .update({
          status: 'failed',
          error_message: message,
          finished_at: new Date().toISOString(),
        })
        .eq('id', logId)
    }

    return { target, success: false, policiesFound: 0, error: message }
  }
}

// =============================================
// 管理者へメール通知
// =============================================
async function notifyAdmin(results: ScrapeResult[]): Promise<void> {
  if (!process.env.RESEND_API_KEY || !process.env.ADMIN_EMAIL) return

  const resend = new Resend(process.env.RESEND_API_KEY)
  const totalFound = results.reduce((sum, r) => sum + r.policiesFound, 0)
  const failed = results.filter(r => !r.success)

  const body = `
スクレイピングが完了しました。

📊 結果サマリー:
- 実行対象: ${results.length}件
- 成功: ${results.filter(r => r.success).length}件
- 失敗: ${failed.length}件
- 新規ドラフト制度: ${totalFound}件

${failed.length > 0 ? `\n⚠️ 失敗したターゲット:\n${failed.map(r => `- ${r.target.name}: ${r.error}`).join('\n')}` : ''}

📋 レビューはこちら:
${process.env.NEXT_PUBLIC_APP_URL ?? 'http://localhost:3000'}/admin/review

このメールは自動送信されています。
  `.trim()

  await resend.emails.send({
    from: 'noreply@tokyo-kosodate-navi.com',
    to: process.env.ADMIN_EMAIL,
    subject: `[子育て支援ナビ] スクレイピング完了 - ${totalFound}件のドラフトを確認してください`,
    text: body,
  })
}

function sleep(ms: number) {
  return new Promise(resolve => setTimeout(resolve, ms))
}
