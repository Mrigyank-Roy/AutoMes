import { NextRequest, NextResponse } from 'next/server'
import { createServiceSupabaseClient } from '@/lib/supabase-server'
import crypto from 'crypto'

export async function POST(request: NextRequest) {
  const body = await request.text()
  const signature = request.headers.get('x-razorpay-signature')

  // Verify webhook signature
  const expectedSignature = crypto
    .createHmac('sha256', process.env.RAZORPAY_WEBHOOK_SECRET!)
    .update(body)
    .digest('hex')

  if (signature !== expectedSignature) {
    console.error('Invalid Razorpay webhook signature')
    return new NextResponse('Unauthorized', { status: 401 })
  }

  const event = JSON.parse(body)
  console.log('Razorpay webhook event:', event.event)

  const supabase = createServiceSupabaseClient()

  try {
    switch (event.event) {

      case 'subscription.activated': {
        const sub = event.payload.subscription.entity
        const userId = sub.notes?.userId
        const planId = sub.notes?.planId
        const couponId = sub.notes?.couponId

        if (!userId || !planId) break

        // Get plan details from DB
        const { data: plan } = await supabase
          .from('plans')
          .select('*')
          .eq('id', planId)
          .single()

        if (!plan) break

        // Calculate renewal date
        const renewsAt = new Date()
        renewsAt.setMonth(renewsAt.getMonth() + 1)

        // Update subscription
        await supabase
          .from('subscriptions')
          .update({
            plan_name: planId,
            dm_limit_monthly: plan.dm_limit,
            allows_comment_reply: plan.allows_comment_reply,
            razorpay_subscription_id: sub.id,
            renews_at: renewsAt.toISOString(),
          })
          .eq('user_id', userId)

        // Record coupon use if applicable
        if (couponId) {
          await supabase.from('coupon_uses').insert({
            coupon_id: couponId,
            user_id: userId,
            plan_purchased: planId,
          })

          // Increment coupon uses count
          await supabase.rpc('increment_coupon_uses', { coupon_id_input: couponId })
        }

        console.log(`✅ User ${userId} upgraded to ${planId}`)
        break
      }

      case 'subscription.cancelled': {
        const sub = event.payload.subscription.entity
        const userId = sub.notes?.userId

        if (!userId) break

        // Get trial plan limits
        const { data: trialPlan } = await supabase
          .from('plans')
          .select('*')
          .eq('id', 'trial')
          .single()

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
          .eq('user_id', userId)

        console.log(`User ${userId} downgraded to trial`)
        break
      }

      case 'invoice.payment_failed': {
        const sub = event.payload.subscription?.entity
        const userId = sub?.notes?.userId

        if (!userId) break

        // Get user email and send alert
        const { data: user } = await supabase
          .from('users')
          .select('email')
          .eq('id', userId)
          .single()

        if (user?.email) {
          const { sendTokenExpiredEmail } = await import('@/lib/send-email')
          // Reuse email function with different message
          await fetch('https://api.resend.com/emails', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              'Authorization': `Bearer ${process.env.RESEND_API_KEY}`
            },
            body: JSON.stringify({
              from: 'AutoMes <noreply@auto-mes.vercel.app>',
              to: user.email,
              subject: 'Payment failed — update your payment method',
              html: `
                <div style="font-family:sans-serif;max-width:500px;margin:0 auto">
                  <h2>Payment failed</h2>
                  <p>We couldn't process your payment for AutoMes.</p>
                  <p>Please update your payment method to keep your automations running.</p>
                  <a href="${process.env.NEXT_PUBLIC_APP_URL}/dashboard/billing"
                     style="background:black;color:white;padding:12px 24px;
                            text-decoration:none;border-radius:6px;display:inline-block">
                    Update payment method
                  </a>
                </div>
              `
            })
          })
        }

        console.log(`Payment failed for user ${userId}`)
        break
      }
    }
  } catch (err) {
    console.error('Webhook processing error:', err)
  }

  return new NextResponse('OK', { status: 200 })
}