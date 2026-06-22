import { NextRequest, NextResponse } from 'next/server'
import { createServiceSupabaseClient } from '@/lib/supabase-server'

export async function POST(request: NextRequest) {
  const secret = request.nextUrl.searchParams.get('secret')
  if (secret !== process.env.WORKER_SECRET) {
    return new NextResponse('Unauthorized', { status: 401 })
  }

  const supabase = createServiceSupabaseClient()

  // Find expired paid subscriptions
  const now = new Date().toISOString()

  const { data: expiredSubs } = await supabase
    .from('subscriptions')
    .select(`
      *,
      users!inner(email)
    `)
    .neq('plan_name', 'trial')
    .lt('renews_at', now)

  if (!expiredSubs || expiredSubs.length === 0) {
    console.log('No expired subscriptions')
    return NextResponse.json({ downgraded: 0 })
  }

  // Get trial plan limits
  const { data: trialPlan } = await supabase
    .from('plans')
    .select('*')
    .eq('id', 'trial')
    .single()

  let downgraded = 0

  for (const sub of expiredSubs) {
    const userEmail = (sub.users as any)?.email

    // Downgrade to trial
    await supabase
      .from('subscriptions')
      .update({
        plan_name: 'trial',
        dm_limit_monthly: trialPlan?.dm_limit ?? 50,
        allows_comment_reply: false,
        razorpay_subscription_id: null,
        renews_at: null,
      })
      .eq('user_id', sub.user_id)

    // Send downgrade notification
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
              <h2 style="margin:0 0 16px">Your plan has expired</h2>
              <p style="color:#666;margin:0 0 16px">
                Your AutoMes <strong>${sub.plan_name}</strong> plan has expired 
                and your account has been downgraded to the free trial.
              </p>
              <p style="color:#666;margin:0 0 24px">
                Your automations are now limited to ${trialPlan?.dm_limit ?? 50} DMs/month. 
                Renew to restore full access.
              </p>
              <a href="${process.env.NEXT_PUBLIC_APP_URL}/dashboard/billing/upgrade?plan=${sub.plan_name}" 
                 style="background:#000;color:#fff;padding:12px 24px;
                        text-decoration:none;border-radius:8px;
                        display:inline-block;font-weight:500">
                Renew now →
              </a>
            </div>
          `
        })
      })
    }

    downgraded++
    console.log(`Downgraded user ${sub.user_id} to trial`)
  }

  return NextResponse.json({ downgraded })
}