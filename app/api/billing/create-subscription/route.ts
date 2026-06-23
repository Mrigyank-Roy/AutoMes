import { NextRequest, NextResponse } from 'next/server'
import { createServiceSupabaseClient } from '@/lib/supabase-server'
import { razorpay, calculateDiscountedPrice } from '@/lib/razorpay'

export async function POST(request: NextRequest) {
  try {
    const { userId, planId, couponId } = await request.json()

    if (!userId || !planId) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 })
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

    let finalPrice = plan.price_inr
    let discountAmount = 0
    let couponCode = null


    // Check if user already has a pending payment
    const { data: existingPending } = await supabase
      .from('payments')
      .select('id, plan_id')
      .eq('user_id', userId)
      .eq('status', 'paid')
      .eq('is_active', false)
      .maybeSingle()

    if (existingPending) {
      return NextResponse.json({
        error: `You already have a pending ${existingPending.plan_id} plan renewal. Cancel it first before purchasing a new one.`
      }, { status: 400 })
    }

    // Apply coupon discount if provided
    if (couponId) {
      const { data: coupon } = await supabase
        .from('coupons')
        .select('*')
        .eq('id', couponId)
        .single()

      if (coupon) {
        finalPrice = calculateDiscountedPrice(
          plan.price_inr,
          coupon.discount_type,
          coupon.discount_value
        )
        discountAmount = plan.price_inr - finalPrice
        couponCode = coupon.code
      }
    }

    // Create Razorpay order
    const receipt = `ord_${userId.slice(-8)}_${Date.now().toString().slice(-8)}`

    const order = await razorpay.orders.create({
      amount: finalPrice * 100,
      currency: 'INR',
      receipt,
      notes: {
        userId,
        planId,
        couponId: couponId ?? '',
        originalPrice: plan.price_inr,
        finalPrice,
      }
    })

    // Log payment attempt in DB
    await supabase.from('payments').insert({
      user_id: userId,
      razorpay_order_id: order.id,
      plan_id: planId,
      amount_paid: finalPrice,
      original_amount: plan.price_inr,
      coupon_id: couponId ?? null,
      coupon_code: couponCode,
      discount_amount: discountAmount,
      status: 'created',
    })

    return NextResponse.json({
      orderId: order.id,
      amount: finalPrice * 100,
      currency: 'INR',
      planName: plan.name,
    })

  } catch (err: any) {
    console.error('Create order error:', err)
    return NextResponse.json({ error: err.message ?? 'Something went wrong' }, { status: 500 })
  }
}