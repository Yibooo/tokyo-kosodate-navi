import { NextRequest, NextResponse } from 'next/server'
import { createServerClient } from '@/lib/supabase/server'

function isAdmin(request: NextRequest) {
  return request.headers.get('x-admin-secret') === process.env.ADMIN_SECRET
}

// GET /api/admin/policies?status=draft
export async function GET(request: NextRequest) {
  if (!isAdmin(request)) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { searchParams } = new URL(request.url)
  const status = searchParams.get('status') ?? 'draft'

  const supabase = createServerClient()
  const { data, error } = await supabase
    .from('policies')
    .select('*, policy_conditions(*)')
    .eq('status', status)
    .order('scraped_at', { ascending: false })

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ policies: data })
}

// GET /api/admin/policies/stats - ステータス別件数
export async function HEAD(request: NextRequest) {
  if (!isAdmin(request)) return new NextResponse(null, { status: 401 })
  return new NextResponse(null, { status: 200 })
}

// PATCH /api/admin/policies - 承認・却下・一括承認
export async function PATCH(request: NextRequest) {
  if (!isAdmin(request)) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const body = await request.json()
  const { id, action, updates } = body as {
    id?: string
    action: 'approve' | 'reject' | 'update' | 'bulk_approve'
    updates?: Record<string, unknown>
  }

  const supabase = createServerClient()

  // 一括承認（全ドラフトを承認）
  if (action === 'bulk_approve') {
    const { data: drafts } = await supabase.from('policies').select('id').eq('status', 'draft')
    if (!drafts || drafts.length === 0) return NextResponse.json({ ok: true, count: 0 })

    const { error } = await supabase
      .from('policies')
      .update({ status: 'approved', approved_at: new Date().toISOString(), approved_by: 'admin (bulk)' })
      .eq('status', 'draft')

    if (error) return NextResponse.json({ error: error.message }, { status: 500 })
    return NextResponse.json({ ok: true, action: 'bulk_approved', count: drafts.length })
  }

  if (!id) return NextResponse.json({ error: 'id is required' }, { status: 400 })

  if (action === 'approve') {
    const { error } = await supabase.from('policies').update({ status: 'approved', approved_at: new Date().toISOString(), approved_by: process.env.ADMIN_EMAIL ?? 'admin' }).eq('id', id)
    if (error) return NextResponse.json({ error: error.message }, { status: 500 })
    return NextResponse.json({ ok: true, action: 'approved' })
  }

  if (action === 'reject') {
    const { error } = await supabase.from('policies').update({ status: 'rejected' }).eq('id', id)
    if (error) return NextResponse.json({ error: error.message }, { status: 500 })
    return NextResponse.json({ ok: true, action: 'rejected' })
  }

  if (action === 'update' && updates) {
    const { error } = await supabase.from('policies').update(updates).eq('id', id)
    if (error) return NextResponse.json({ error: error.message }, { status: 500 })
    return NextResponse.json({ ok: true, action: 'updated' })
  }

  return NextResponse.json({ error: 'Invalid action' }, { status: 400 })
}
