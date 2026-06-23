import { NextRequest, NextResponse } from 'next/server'
import { createServiceSupabaseClient } from '@/lib/supabase-server'

export async function POST(request: NextRequest) {
  const secret = request.nextUrl.searchParams.get('secret')
  if (secret !== process.env.WORKER_SECRET) {
    return new NextResponse('Unauthorized', { status: 401 })
  }

  const supabase = createServiceSupabaseClient()
  const now = new Date()

  // Find all active paid subscriptions where renews_at has passed
  // These need their DM counter reset and renews_at extended
  const { data: dueForReset } = await supabase
    .from('subscriptions')
    .select('*, users!inner(email)')
    .neq('plan_name', 'trial')
    .lt('renews_at', now.toISOString())

  if (!dueForReset || dueForReset.length === 0) {
    console.log('No DM counters to reset')
    return NextResponse.json({ reset: 0 })
  }

  let reset = 0

  for (const sub of dueForReset) {
    // Check if they have a pending payment — if so the check-expired cron handles it
    const { data: pendingPayment } = await supabase
      .from('payments')
      .select('id')
      .eq('user_id', sub.user_id)
      .eq('status', 'paid')
      .eq('is_active', false)
      .maybeSingle()

    if (pendingPayment) continue // Let check-expired handle this

    // No pending payment and subscription expired — skip (check-expired downgrades these)
    // This cron only handles the case where a user has renewed and needs counter reset
  }

  return NextResponse.json({ reset })
}