import { NextRequest, NextResponse } from 'next/server'
import { createServiceSupabaseClient } from '@/lib/supabase-server'
import crypto from 'crypto'

export async function POST(request: NextRequest) {
  try {
    const {
      razorpay_order_id,
      razorpay_payment_id,
      razorpay_signature,
      userId,
      planId,
      couponId,
    } = await request.json()

    // Step 1 — Verify payment signature
    // This proves the payment actually came from Razorpay
    const body = razorpay_order_id + '|' + razorpay_payment_id
    const expectedSignature = crypto
      .createHmac('sha256', process.env.RAZORPAY_KEY_SECRET!)
      .update(body)
      .digest('hex')

    if (expectedSignature !== razorpay_signature) {
      console.error('Invalid payment signature')
      return NextResponse.json({ error: 'Invalid payment signature' }, { status: 400 })
    }

    const supabase = createServiceSupabaseClient()

    // Step 2 — Get plan details from DB
    const { data: plan } = await supabase
      .from('plans')
      .select('*')
      .eq('id', planId)
      .single()

    if (!plan) {
      return NextResponse.json({ error: 'Plan not found' }, { status: 404 })
    }

    // Step 3 — Calculate renewal date (30 days from now)
    const renewsAt = new Date()
    renewsAt.setDate(renewsAt.getDate() + 30)

    // Step 4 — Update subscription in DB
    const { error: updateError } = await supabase
      .from('subscriptions')
      .update({
        plan_name: planId,
        dm_limit_monthly: plan.dm_limit,
        allows_comment_reply: plan.allows_comment_reply,
        razorpay_subscription_id: razorpay_payment_id,
        renews_at: renewsAt.toISOString(),
      })
      .eq('user_id', userId)

    if (updateError) {
      console.error('DB update error:', updateError)
      return NextResponse.json({ error: 'Failed to update subscription' }, { status: 500 })
    }

    // Step 5 — Record coupon use if applicable
    if (couponId) {
      await supabase.from('coupon_uses').insert({
        coupon_id: couponId,
        user_id: userId,
        plan_purchased: planId,
      })

      // Increment coupon uses count
      await supabase.rpc('increment_coupon_uses', {
        coupon_id_input: couponId
      })
    }

    console.log(`✅ Payment verified for user ${userId} — upgraded to ${planId}`)

    return NextResponse.json({ success: true })

  } catch (err: any) {
    console.error('Payment verification error:', err)
    return NextResponse.json({ error: err.message ?? 'Something went wrong' }, { status: 500 })
  }
}