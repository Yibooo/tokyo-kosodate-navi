import { NextRequest, NextResponse } from 'next/server'
import { createServerClient } from '@/lib/supabase/server'

function isAdmin(request: NextRequest) {
  const secret = request.headers.get('x-admin-secret')
  return secret === process.env.ADMIN_SECRET
}

// GET /api/admin/policies?status=draft
export async function GET(request: NextRequest) {
  if (!isAdmin(request)) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const { searchParams } = new URL(request.url)
  const status = searchParams.get('status') ?? 'draft'

  const supabase = createServerClient()
  const { data, error } = await supabase
    .from('policies')
    .select('*, policy_conditions(*)')
    .eq('status', status)
    .order('scraped_at', { ascending: false })

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  return NextResponse.json({ policies: data })
}

// PATCH /api/admin/policies/:id - 承認・却下・修正
export async function PATCH(request: NextRequest) {
  if (!isAdmin(request)) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const body = await request.json()
  const { id, action, updates } = body as {
    id: string
    action: 'approve' | 'reject' | 'update'
    updates?: Record<string, unknown>
  }

  const supabase = createServerClient()

  if (action === 'approve') {
    const { error } = await supabase
      .from('policies')
      .update({
        status: 'approved',
        approved_at: new Date().toISOString(),
        approved_by: process.env.ADMIN_EMAIL ?? 'admin',
      })
      .eq('id', id)

    if (error) return NextResponse.json({ error: error.message }, { status: 500 })
    return NextResponse.json({ ok: true, action: 'approved' })
  }

  if (action === 'reject') {
    const { error } = await supabase
      .from('policies')
      .update({ status: 'rejected' })
      .eq('id', id)

    if (error) return NextResponse.json({ error: error.message }, { status: 500 })
    return NextResponse.json({ ok: true, action: 'rejected' })
  }

  if (action === 'update' && updates) {
    const { error } = await supabase
      .from('policies')
      .update(updates)
      .eq('id', id)

    if (error) return NextResponse.json({ error: error.message }, { status: 500 })
    return NextResponse.json({ ok: true, action: 'updated' })
  }

  return NextResponse.json({ error: 'Invalid action' }, { status: 400 })
}
