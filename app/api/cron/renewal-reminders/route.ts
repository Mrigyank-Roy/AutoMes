import { NextRequest, NextResponse } from 'next/server'
import { createServiceSupabaseClient } from '@/lib/supabase-server'

export async function POST(request: NextRequest) {
  const secret = request.nextUrl.searchParams.get('secret')
  if (secret !== process.env.WORKER_SECRET) {
    return new NextResponse('Unauthorized', { status: 401 })
  }

  const supabase = createServiceSupabaseClient()

  // Find all paid subscriptions renewing in exactly 5 days
  const fiveDaysFromNow = new Date()
  fiveDaysFromNow.setDate(fiveDaysFromNow.getDate() + 5)
  const fiveDaysFromNowStr = fiveDaysFromNow.toISOString().split('T')[0]

  const { data: renewingSubscriptions } = await supabase
    .from('subscriptions')
    .select(`
      *,
      users!inner(email)
    `)
    .neq('plan_name', 'trial')
    .gte('renews_at', `${fiveDaysFromNowStr}T00:00:00`)
    .lte('renews_at', `${fiveDaysFromNowStr}T23:59:59`)

  if (!renewingSubscriptions || renewingSubscriptions.length === 0) {
    console.log('No renewals in 5 days')
    return NextResponse.json({ reminded: 0 })
  }

  let reminded = 0

  for (const sub of renewingSubscriptions) {
    const userEmail = (sub.users as any)?.email
    if (!userEmail) continue

    const renewalDate = new Date(sub.renews_at).toLocaleDateString('en-IN', {
      day: 'numeric',
      month: 'long',
      year: 'numeric'
    })

    // Send renewal reminder email
    await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${process.env.RESEND_API_KEY}`
      },
      body: JSON.stringify({
        from: 'AutoMes <noreply@auto-mes.vercel.app>',
        to: userEmail,
        subject: `Your AutoMes ${sub.plan_name} plan renews in 5 days`,
        html: `
          <div style="font-family:sans-serif;max-width:500px;margin:0 auto;padding:20px">
            <h2 style="margin:0 0 16px">Your plan renews soon 📅</h2>
            <p style="color:#666;margin:0 0 16px">
              Hi there! Your AutoMes <strong>${sub.plan_name}</strong> plan 
              renews on <strong>${renewalDate}</strong>.
            </p>
            <p style="color:#666;margin:0 0 24px">
              To continue enjoying uninterrupted DM automations, 
              please complete your renewal payment.
            </p>
            <a href="${process.env.NEXT_PUBLIC_APP_URL}/dashboard/billing/upgrade?plan=${sub.plan_name}" 
               style="background:#000;color:#fff;padding:12px 24px;
                      text-decoration:none;border-radius:8px;
                      display:inline-block;font-weight:500">
              Renew my plan →
            </a>
            <p style="color:#999;font-size:12px;margin:24px 0 0">
              If you don't renew, your account will be downgraded to the 
              free trial (50 DMs/month) after ${renewalDate}.
            </p>
          </div>
        `
      })
    })

    reminded++
    console.log(`📧 Renewal reminder sent to ${userEmail}`)
  }

  return NextResponse.json({ reminded })
}