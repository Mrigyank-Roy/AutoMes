import { NextRequest, NextResponse } from 'next/server'
import { createServiceSupabaseClient } from '@/lib/supabase-server'
import { razorpay, getPlanId } from '@/lib/razorpay'

export async function POST(request: NextRequest) {
  try {
    const { userId, planId, couponId } = await request.json()

    if (!userId || !planId) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 })
    }

    const supabase = createServiceSupabaseClient()

    // Get user email
    const { data: user } = await supabase
      .from('users')
      .select('email')
      .eq('id', userId)
      .single()

    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 })
    }

    // Get or create Razorpay customer
    const { data: subscription } = await supabase
      .from('subscriptions')
      .select('razorpay_customer_id')
      .eq('user_id', userId)
      .single()

    let customerId = subscription?.razorpay_customer_id

    if (!customerId) {
      const customer = await razorpay.customers.create({
        email: user.email,
        fail_existing: 0
      })
      customerId = customer.id

      // Save customer ID
      await supabase
        .from('subscriptions')
        .update({ razorpay_customer_id: customerId })
        .eq('user_id', userId)
    }

    // Get Razorpay plan ID
    const razorpayPlanId = getPlanId(planId)

    // Create subscription
    const rzpSubscription = await razorpay.subscriptions.create({
      plan_id: razorpayPlanId,
      customer_notify: 1,
      total_count: 12, // 12 months
      notes: {
        userId,
        planId,
        couponId: couponId ?? '',
      }
    })

    return NextResponse.json({
      subscriptionId: rzpSubscription.id,
      customerId,
    })

  } catch (err: any) {
    console.error('Create subscription error:', err)
    return NextResponse.json({ error: err.message ?? 'Something went wrong' }, { status: 500 })
  }
}