import { NextRequest, NextResponse } from 'next/server'
import { runScrapingPipeline } from '@/lib/scraper/pipeline'

// Vercel Cron または手動トリガー用エンドポイント
// GET /api/scrape （Cronから）
// POST /api/scrape with { "secret": "..." } （手動実行）
export async function GET(request: NextRequest) {
  // Vercel Cron認証
  const authHeader = request.headers.get('authorization')
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  return runPipeline()
}

export async function POST(request: NextRequest) {
  // 管理者手動トリガー
  const body = await request.json().catch(() => ({}))
  if (body.secret !== process.env.ADMIN_SECRET) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  return runPipeline()
}

async function runPipeline() {
  try {
    const results = await runScrapingPipeline()
    const summary = {
      total: results.length,
      success: results.filter(r => r.success).length,
      failed: results.filter(r => !r.success).length,
      policiesFound: results.reduce((sum, r) => sum + r.policiesFound, 0),
      details: results.map(r => ({
        name: r.target.name,
        success: r.success,
        policiesFound: r.policiesFound,
        error: r.error,
      })),
    }

    return NextResponse.json({ ok: true, summary })
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error)
    return NextResponse.json({ ok: false, error: message }, { status: 500 })
  }
}
