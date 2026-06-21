import Razorpay from 'razorpay'

export const razorpay = new Razorpay({
  key_id: process.env.RAZORPAY_KEY_ID!,
  key_secret: process.env.RAZORPAY_KEY_SECRET!,
})

export function getPlanId(planName: string): string {
  switch (planName) {
    case 'starter': return process.env.RAZORPAY_PLAN_ID_STARTER!
    case 'pro': return process.env.RAZORPAY_PLAN_ID_PRO!
    case 'agency': return process.env.RAZORPAY_PLAN_ID_AGENCY!
    default: throw new Error(`Unknown plan: ${planName}`)
  }
}

export function calculateDiscountedPrice(
  originalPrice: number,
  discountType: string,
  discountValue: number
): number {
  if (discountType === 'percent') {
    return Math.round(originalPrice * (1 - discountValue / 100))
  } else if (discountType === 'fixed') {
    return Math.max(0, originalPrice - discountValue)
  }
  return originalPrice
}