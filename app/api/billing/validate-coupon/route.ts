import { NextRequest, NextResponse } from 'next/server'
import { createServiceSupabaseClient } from '@/lib/supabase-server'
import { calculateDiscountedPrice } from '@/lib/razorpay'

export async function POST(request: NextRequest) {
  try {
    const { code, planId, userId } = await request.json()

    if (!code || !planId || !userId) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 })
    }

    const supabase = createServiceSupabaseClient()

    // Get plan price
    const { data: plan } = await supabase
      .from('plans')
      .select('price_inr, name')
      .eq('id', planId)
      .single()

    if (!plan) {
      return NextResponse.json({ error: 'Plan not found' }, { status: 404 })
    }

    // Find coupon
    const { data: coupon } = await supabase
      .from('coupons')
      .select('*')
      .eq('code', code.toUpperCase().trim())
      .eq('is_active', true)
      .single()

    if (!coupon) {
      return NextResponse.json({ error: 'Invalid coupon code' }, { status: 400 })
    }

    // Check expiry
    if (coupon.valid_until && new Date(coupon.valid_until) < new Date()) {
      return NextResponse.json({ error: 'This coupon has expired' }, { status: 400 })
    }

    // Check total max uses
    if (coupon.max_uses && coupon.uses_count >= coupon.max_uses) {
      return NextResponse.json({ error: 'This coupon has reached its usage limit' }, { status: 400 })
    }

    // Check per-user uses
    const { count } = await supabase
      .from('coupon_uses')
      .select('*', { count: 'exact', head: true })
      .eq('coupon_id', coupon.id)
      .eq('user_id', userId)

    if ((count ?? 0) >= coupon.max_uses_per_user) {
      return NextResponse.json({ error: 'You have already used this coupon' }, { status: 400 })
    }

    // Calculate discounted price
    const discountedPrice = calculateDiscountedPrice(
      plan.price_inr,
      coupon.discount_type,
      coupon.discount_value
    )

    const discountAmount = plan.price_inr - discountedPrice

    return NextResponse.json({
      valid: true,
      couponId: coupon.id,
      couponCode: coupon.code,
      discountType: coupon.discount_type,
      discountValue: coupon.discount_value,
      originalPrice: plan.price_inr,
      discountAmount,
      finalPrice: discountedPrice,
      message: coupon.discount_type === 'percent'
        ? `${coupon.discount_value}% off applied!`
        : `₹${coupon.discount_value} off applied!`
    })

  } catch (err) {
    console.error('Coupon validation error:', err)
    return NextResponse.json({ error: 'Something went wrong' }, { status: 500 })
  }
}