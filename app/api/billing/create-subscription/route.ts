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
      }
    }

    // Create Razorpay order
    // Amount is in paise (multiply by 100)
    const order = await razorpay.orders.create({
      amount: finalPrice * 100,
      currency: 'INR',
      receipt: `order_${userId}_${Date.now()}`,
      notes: {
        userId,
        planId,
        couponId: couponId ?? '',
        originalPrice: plan.price_inr,
        finalPrice,
      }
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