import { NextRequest, NextResponse } from 'next/server'
import { createServiceSupabaseClient } from '@/lib/supabase-server'

export async function POST(request: NextRequest) {
  const secret = request.nextUrl.searchParams.get('secret')
  if (secret !== process.env.WORKER_SECRET) {
    return new NextResponse('Unauthorized', { status: 401 })
  }

  const supabase = createServiceSupabaseClient()
  const now = new Date().toISOString()

  // ── Part 1: Auto-activate pending payments whose start date has arrived ──
  const { data: pendingPayments } = await supabase
    .from('payments')
    .select('*')
    .eq('status', 'paid')
    .eq('is_active', false)
    .lte('plan_valid_from', now)

  let activated = 0

  if (pendingPayments && pendingPayments.length > 0) {
    for (const payment of pendingPayments) {
      const { data: plan } = await supabase
        .from('plans')
        .select('*')
        .eq('id', payment.plan_id)
        .single()

      if (!plan) continue

      // Activate the payment
      await supabase
        .from('payments')
        .update({
          is_active: true,
          activated_at: now,
        })
        .eq('id', payment.id)

      // Update subscription and reset DM counter
      await supabase
        .from('subscriptions')
        .update({
          plan_name: payment.plan_id,
          dm_limit_monthly: plan.dm_limit,
          allows_comment_reply: plan.allows_comment_reply,
          razorpay_subscription_id: payment.razorpay_payment_id,
          renews_at: payment.plan_valid_until,
          dms_used_this_month: 0,
        })
        .eq('user_id', payment.user_id)

      activated++
      console.log(`✅ Auto-activated pending payment for user ${payment.user_id}`)
    }
  }

  // ── Part 2: Downgrade expired subscriptions with no pending renewal ──
  const { data: expiredSubs } = await supabase
    .from('subscriptions')
    .select(`*, users!inner(email)`)
    .neq('plan_name', 'trial')
    .lt('renews_at', now)

  const { data: trialPlan } = await supabase
    .from('plans')
    .select('*')
    .eq('id', 'trial')
    .single()

  let downgraded = 0

  if (expiredSubs) {
    for (const sub of expiredSubs) {
      // Check if user has a pending payment — if so don't downgrade
      const { data: pendingPayment } = await supabase
        .from('payments')
        .select('id')
        .eq('user_id', sub.user_id)
        .eq('status', 'paid')
        .eq('is_active', false)
        .maybeSingle()

      if (pendingPayment) {
        console.log(`User ${sub.user_id} has pending payment — skipping downgrade`)
        continue
      }

      // No pending payment — downgrade to trial
      await supabase
        .from('subscriptions')
        .update({
          plan_name: 'trial',
          dm_limit_monthly: trialPlan?.dm_limit ?? 50,
          allows_comment_reply: false,
          razorpay_subscription_id: null,
          renews_at: null,
          dms_used_this_month: 0,
        })
        .eq('user_id', sub.user_id)

      const userEmail = (sub.users as any)?.email
      if (userEmail) {
        await fetch('https://api.resend.com/emails', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${process.env.RESEND_API_KEY}`
          },
          body: JSON.stringify({
            from: 'AutoMes <noreply@auto-mes.vercel.app>',
            to: userEmail,
            subject: 'Your AutoMes plan has expired',
            html: `
              <div style="font-family:sans-serif;max-width:500px;margin:0 auto;padding:20px">
                <h2>Your plan has expired</h2>
                <p style="color:#666">Your AutoMes <strong>${sub.plan_name}</strong> plan 
                has expired and your account has been moved to the free trial.</p>
                <p style="color:#666">Your automations are now limited to 
                ${trialPlan?.dm_limit ?? 50} DMs/month.</p>
                <a href="${process.env.NEXT_PUBLIC_APP_URL}/dashboard/billing/upgrade?plan=${sub.plan_name}"
                   style="background:#000;color:#fff;padding:12px 24px;
                          text-decoration:none;border-radius:8px;display:inline-block">
                  Renew now →
                </a>
              </div>
            `
          })
        })
      }

      downgraded++
    }
  }

  return NextResponse.json({ activated, downgraded })
}