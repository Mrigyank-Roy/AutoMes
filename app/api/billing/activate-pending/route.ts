import { NextRequest, NextResponse } from 'next/server'
import { createServiceSupabaseClient } from '@/lib/supabase-server'

export async function POST(request: NextRequest) {
  try {
    const { userId, paymentId } = await request.json()

    if (!userId || !paymentId) {
      return NextResponse.json({ error: 'Missing fields' }, { status: 400 })
    }

    const supabase = createServiceSupabaseClient()

    // Get the pending payment
    const { data: payment } = await supabase
      .from('payments')
      .select('*')
      .eq('id', paymentId)
      .eq('user_id', userId)
      .eq('status', 'paid')
      .eq('is_active', false)
      .single()

    if (!payment) {
      return NextResponse.json({ error: 'Pending payment not found' }, { status: 404 })
    }

    // Get plan details
    const { data: plan } = await supabase
      .from('plans')
      .select('*')
      .eq('id', payment.plan_id)
      .single()

    if (!plan) {
      return NextResponse.json({ error: 'Plan not found' }, { status: 404 })
    }

    const now = new Date()
    const newValidUntil = new Date()
    newValidUntil.setDate(newValidUntil.getDate() + 30)

    // Activate the payment
    await supabase
      .from('payments')
      .update({
        is_active: true,
        activated_at: now.toISOString(),
        plan_valid_from: now.toISOString(),
        plan_valid_until: newValidUntil.toISOString(),
      })
      .eq('id', paymentId)

    // Update subscription — reset DMs and start new cycle
    await supabase
      .from('subscriptions')
      .update({
        plan_name: payment.plan_id,
        dm_limit_monthly: plan.dm_limit,
        allows_comment_reply: plan.allows_comment_reply,
        razorpay_subscription_id: payment.razorpay_payment_id,
        renews_at: newValidUntil.toISOString(),
        dms_used_this_month: 0,
      })
      .eq('user_id', userId)

    return NextResponse.json({ success: true })

  } catch (err: any) {
    console.error('Activate pending error:', err)
    return NextResponse.json({ error: 'Something went wrong' }, { status: 500 })
  }
}