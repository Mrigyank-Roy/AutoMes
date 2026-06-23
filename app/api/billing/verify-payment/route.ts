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

    // Verify signature
    const body = razorpay_order_id + '|' + razorpay_payment_id
    const expectedSignature = crypto
      .createHmac('sha256', process.env.RAZORPAY_KEY_SECRET!)
      .update(body)
      .digest('hex')

    if (expectedSignature !== razorpay_signature) {
      const supabase = createServiceSupabaseClient()
      await supabase
        .from('payments')
        .update({ status: 'failed' })
        .eq('razorpay_order_id', razorpay_order_id)
      return NextResponse.json({ error: 'Invalid payment signature' }, { status: 400 })
    }

    const supabase = createServiceSupabaseClient()

    // Get plan details
    const { data: plan } = await supabase
      .from('plans')
      .select('*')
      .eq('id', planId)
      .single()

    if (!plan) {
      return NextResponse.json({ error: 'Plan not found' }, { status: 404 })
    }

    // Get current subscription
    const { data: currentSub } = await supabase
      .from('subscriptions')
      .select('renews_at, plan_name, dm_limit_monthly, dms_used_this_month')
      .eq('user_id', userId)
      .single()

    const now = new Date()
    const hasActivePaidPlan =
      currentSub?.plan_name !== 'trial' &&
      currentSub?.renews_at &&
      new Date(currentSub.renews_at) > now

    // Check for mid-cycle upgrade
    const isUpgrade = hasActivePaidPlan && planId !== currentSub?.plan_name

    // Get the new plan's sort order to check if it's actually an upgrade
    const { data: currentPlanData } = await supabase
      .from('plans')
      .select('sort_order, price_inr')
      .eq('id', currentSub?.plan_name ?? 'trial')
      .single()

    const { data: newPlanData } = await supabase
      .from('plans')
      .select('sort_order, price_inr')
      .eq('id', planId)
      .single()

    const isActualUpgrade =
      isUpgrade &&
      (newPlanData?.sort_order ?? 0) > (currentPlanData?.sort_order ?? 0)

    let planValidFrom: Date
    let planValidUntil: Date
    let isPending: boolean

    if (hasActivePaidPlan && !isActualUpgrade) {
      // Same plan renewal OR downgrade — create pending
      planValidFrom = new Date(currentSub!.renews_at)
      planValidUntil = new Date(currentSub!.renews_at)
      planValidUntil.setDate(planValidUntil.getDate() + 30)
      isPending = true
    } else {
      // No active plan, expired, trial, OR upgrade — activate immediately
      planValidFrom = now
      planValidUntil = new Date()
      planValidUntil.setDate(planValidUntil.getDate() + 30)
      isPending = false
    }

    // Update payment record
    await supabase
      .from('payments')
      .update({
        status: 'paid',
        razorpay_payment_id,
        plan_valid_from: planValidFrom.toISOString(),
        plan_valid_until: planValidUntil.toISOString(),
        is_active: !isPending,
        activated_at: isPending ? null : now.toISOString(),
      })
      .eq('razorpay_order_id', razorpay_order_id)

    if (!isPending) {
      // Activate immediately — update subscription now
      await supabase
        .from('subscriptions')
        .update({
          plan_name: planId,
          dm_limit_monthly: plan.dm_limit,
          allows_comment_reply: plan.allows_comment_reply,
          razorpay_subscription_id: razorpay_payment_id,
          renews_at: planValidUntil.toISOString(),
          dms_used_this_month: 0,
        })
        .eq('user_id', userId)
    }

    // Record coupon use
    if (couponId) {
      await supabase.from('coupon_uses').insert({
        coupon_id: couponId,
        user_id: userId,
        plan_purchased: planId,
      })
      await supabase.rpc('increment_coupon_uses', { coupon_id_input: couponId })
    }

    return NextResponse.json({
      success: true,
      isPending,
      planValidFrom: planValidFrom.toISOString(),
      planValidUntil: planValidUntil.toISOString(),
    })

  } catch (err: any) {
    console.error('Payment verification error:', err)
    return NextResponse.json({ error: err.message ?? 'Something went wrong' }, { status: 500 })
  }
}