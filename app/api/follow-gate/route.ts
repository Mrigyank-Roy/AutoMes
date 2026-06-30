import { NextRequest, NextResponse } from 'next/server'
import { createServiceSupabaseClient } from '@/lib/supabase-server'
import { FOLLOW_GATE_DEFAULTS } from '@/lib/follow-gate'

const PRO_PLANS = ['pro', 'agency']

// GET /api/follow-gate?userId=...  → { allowed, accounts: [{ ig_account_id, ig_username, settings }] }
export async function GET(request: NextRequest) {
  const userId = request.nextUrl.searchParams.get('userId')
  if (!userId) return NextResponse.json({ error: 'Missing userId' }, { status: 400 })

  const supabase = createServiceSupabaseClient()

  const { data: sub } = await supabase
    .from('subscriptions').select('plan_name').eq('user_id', userId).single()
  const allowed = !!sub && PRO_PLANS.includes(sub.plan_name)

  const { data: accounts } = await supabase
    .from('instagram_accounts').select('id, ig_username').eq('user_id', userId)

  const ids = (accounts ?? []).map((a) => a.id)
  const { data: rows } = ids.length
    ? await supabase.from('follow_gate_settings').select('*').in('ig_account_id', ids)
    : { data: [] as any[] }

  const byId: Record<string, any> = {}
  for (const r of rows ?? []) byId[r.ig_account_id] = r

  const result = (accounts ?? []).map((a) => ({
    ig_account_id: a.id,
    ig_username: a.ig_username,
    settings: byId[a.id]
      ? {
          step1_text: byId[a.id].step1_text,
          step1_button: byId[a.id].step1_button,
          step2_text: byId[a.id].step2_text,
          step2_follow_button: byId[a.id].step2_follow_button,
        }
      : { ...FOLLOW_GATE_DEFAULTS },
  }))

  return NextResponse.json({ allowed, accounts: result })
}

// POST → upsert one account's gate copy
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { userId, igAccountId, step1_text, step1_button, step2_text, step2_follow_button } = body
    if (!userId || !igAccountId) return NextResponse.json({ error: 'Missing fields' }, { status: 400 })

    const supabase = createServiceSupabaseClient()

    // Plan gate (server-side)
    const { data: sub } = await supabase
      .from('subscriptions').select('plan_name').eq('user_id', userId).single()
    if (!sub || !PRO_PLANS.includes(sub.plan_name)) {
      return NextResponse.json({ error: 'Follow-gate is available on the Pro and Agency plans.' }, { status: 403 })
    }

    // Verify the account belongs to this user
    const { data: account } = await supabase
      .from('instagram_accounts').select('id').eq('id', igAccountId).eq('user_id', userId).single()
    if (!account) return NextResponse.json({ error: 'Instagram account not found' }, { status: 404 })

    const clean = {
      step1_text: String(step1_text ?? '').trim().slice(0, 900),
      step1_button: String(step1_button ?? '').trim().slice(0, 20),
      step2_text: String(step2_text ?? '').trim().slice(0, 900),
      step2_follow_button: String(step2_follow_button ?? '').trim().slice(0, 20),
    }
    if (!clean.step1_text || !clean.step1_button || !clean.step2_text || !clean.step2_follow_button) {
      return NextResponse.json({ error: 'All message and button fields are required' }, { status: 400 })
    }

    const { error } = await supabase.from('follow_gate_settings').upsert(
      { ig_account_id: igAccountId, user_id: userId, ...clean, updated_at: new Date().toISOString() },
      { onConflict: 'ig_account_id' }
    )
    if (error) return NextResponse.json({ error: error.message }, { status: 500 })

    return NextResponse.json({ success: true })
  } catch (err: any) {
    console.error('Follow-gate settings error:', err)
    return NextResponse.json({ error: 'Something went wrong' }, { status: 500 })
  }
}