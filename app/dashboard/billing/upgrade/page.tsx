'use client'

import { useEffect, useState, Suspense } from 'react'
import { supabase } from '@/lib/supabase'
import { useRouter, useSearchParams } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import Link from 'next/link'

declare global {
  interface Window {
    Razorpay: any
  }
}

function UpgradeContent() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const planId = searchParams.get('plan') ?? 'pro'

  const [userId, setUserId] = useState('')
  const [userEmail, setUserEmail] = useState('')
  const [plan, setPlan] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [couponCode, setCouponCode] = useState('')
  const [couponResult, setCouponResult] = useState<any>(null)
  const [couponLoading, setCouponLoading] = useState(false)
  const [couponError, setCouponError] = useState('')
  const [paymentLoading, setPaymentLoading] = useState(false)
  const [error, setError] = useState('')

  useEffect(() => {
    // Load Razorpay script
    const script = document.createElement('script')
    script.src = 'https://checkout.razorpay.com/v1/checkout.js'
    script.async = true
    document.body.appendChild(script)

    return () => {
      document.body.removeChild(script)
    }
  }, [])

  useEffect(() => {
    async function loadData() {
      const { data: { session } } = await supabase.auth.getSession()
      if (!session) { router.push('/login'); return }

      setUserId(session.user.id)
      setUserEmail(session.user.email ?? '')

      const { data: planData } = await supabase
        .from('plans')
        .select('*')
        .eq('id', planId)
        .single()

      setPlan(planData)
      setLoading(false)
    }
    loadData()
  }, [planId, router])

  async function applyCoupon() {
    if (!couponCode.trim()) return
    setCouponLoading(true)
    setCouponError('')
    setCouponResult(null)

    const res = await fetch('/api/billing/validate-coupon', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        code: couponCode.trim(),
        planId,
        userId,
      })
    })

    const data = await res.json()

    if (!res.ok) {
      setCouponError(data.error)
    } else {
      setCouponResult(data)
    }
    setCouponLoading(false)
  }

  async function handlePayment() {
    setPaymentLoading(true)
    setError('')

    try {
      // Create Razorpay subscription
      const res = await fetch('/api/billing/create-subscription', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId,
          planId,
          couponId: couponResult?.couponId ?? null,
        })
      })

      const data = await res.json()

      if (!res.ok) {
        setError(data.error ?? 'Something went wrong')
        setPaymentLoading(false)
        return
      }

      // Open Razorpay checkout
      const options = {
        key: process.env.NEXT_PUBLIC_RAZORPAY_KEY_ID,
        subscription_id: data.subscriptionId,
        name: 'AutoMes',
        description: `${plan?.name} Plan — Monthly subscription`,
        prefill: {
          email: userEmail,
        },
        theme: {
          color: '#000000'
        },
        handler: function (response: any) {
          // Payment successful
          console.log('Payment successful:', response)
          router.push('/dashboard/billing?success=true')
        },
        modal: {
          ondismiss: function () {
            setPaymentLoading(false)
          }
        }
      }

      const rzp = new window.Razorpay(options)
      rzp.open()
      setPaymentLoading(false)

    } catch (err) {
      console.error('Payment error:', err)
      setError('Something went wrong. Please try again.')
      setPaymentLoading(false)
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <p className="text-sm text-gray-400">Loading...</p>
      </div>
    )
  }

  if (!plan) {
    return (
      <div className="max-w-lg">
        <p className="text-red-500">Plan not found</p>
        <Link href="/dashboard/billing">
          <Button variant="outline" className="mt-4">Back to billing</Button>
        </Link>
      </div>
    )
  }

  const finalPrice = couponResult?.finalPrice ?? plan.price_inr
  const discountAmount = couponResult?.discountAmount ?? 0

  return (
    <div className="max-w-lg">
      {/* Header */}
      <div className="flex items-center gap-4 mb-8">
        <Link href="/dashboard/billing">
          <Button variant="ghost" size="sm">← Back</Button>
        </Link>
        <div>
          <h1 className="text-2xl font-semibold">Upgrade to {plan.name}</h1>
          <p className="text-sm text-gray-500 mt-0.5">
            Review your plan and complete payment
          </p>
        </div>
      </div>

      {/* What you get */}
      <Card className="mb-5">
        <CardContent className="pt-5">
          <h2 className="font-medium mb-4">What you get with {plan.name}</h2>
          <div className="flex flex-col gap-2.5">
            <div className="flex items-center gap-3">
              <span className="w-5 h-5 rounded-full bg-green-100 text-green-600 flex items-center justify-center text-xs flex-shrink-0">✓</span>
              <span className="text-sm">{plan.dm_limit.toLocaleString()} DMs per month</span>
            </div>
            <div className="flex items-center gap-3">
              <span className="w-5 h-5 rounded-full bg-green-100 text-green-600 flex items-center justify-center text-xs flex-shrink-0">✓</span>
              <span className="text-sm">
                {plan.account_limit} Instagram account{plan.account_limit > 1 ? 's' : ''}
              </span>
            </div>
            <div className="flex items-center gap-3">
              <span className={`w-5 h-5 rounded-full flex items-center justify-center text-xs flex-shrink-0 ${
                plan.allows_comment_reply
                  ? 'bg-green-100 text-green-600'
                  : 'bg-gray-100 text-gray-400'
              }`}>
                {plan.allows_comment_reply ? '✓' : '✗'}
              </span>
              <span className={`text-sm ${plan.allows_comment_reply ? '' : 'text-gray-400'}`}>
                Public comment reply (random rotation)
              </span>
            </div>
            <div className="flex items-center gap-3">
              <span className="w-5 h-5 rounded-full bg-green-100 text-green-600 flex items-center justify-center text-xs flex-shrink-0">✓</span>
              <span className="text-sm">Keyword triggers + any comment trigger</span>
            </div>
            <div className="flex items-center gap-3">
              <span className="w-5 h-5 rounded-full bg-green-100 text-green-600 flex items-center justify-center text-xs flex-shrink-0">✓</span>
              <span className="text-sm">Auto token refresh — never breaks</span>
            </div>
            <div className="flex items-center gap-3">
              <span className="w-5 h-5 rounded-full bg-green-100 text-green-600 flex items-center justify-center text-xs flex-shrink-0">✓</span>
              <span className="text-sm">Cancel anytime</span>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Coupon code */}
      <Card className="mb-5">
        <CardContent className="pt-5">
          <h2 className="font-medium mb-3">Have a coupon code?</h2>
          <div className="flex gap-2">
            <input
              type="text"
              value={couponCode}
              onChange={e => {
                setCouponCode(e.target.value.toUpperCase())
                setCouponResult(null)
                setCouponError('')
              }}
              placeholder="Enter coupon code"
              className="flex-1 border rounded-lg px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-black uppercase"
              disabled={!!couponResult}
            />
            {couponResult ? (
              <Button
                variant="outline"
                size="sm"
                onClick={() => {
                  setCouponResult(null)
                  setCouponCode('')
                  setCouponError('')
                }}
              >
                Remove
              </Button>
            ) : (
              <Button
                variant="outline"
                size="sm"
                onClick={applyCoupon}
                disabled={couponLoading || !couponCode.trim()}
              >
                {couponLoading ? 'Checking...' : 'Apply'}
              </Button>
            )}
          </div>

          {couponError && (
            <p className="text-red-500 text-xs mt-2">{couponError}</p>
          )}
          {couponResult && (
            <p className="text-green-600 text-xs mt-2 font-medium">
              ✓ {couponResult.message}
            </p>
          )}
        </CardContent>
      </Card>

      {/* Price summary */}
      <Card className="mb-5">
        <CardContent className="pt-5">
          <h2 className="font-medium mb-4">Order summary</h2>
          <div className="flex flex-col gap-2">
            <div className="flex justify-between text-sm">
              <span className="text-gray-500">{plan.name} plan</span>
              <span>₹{plan.price_inr.toLocaleString()}/mo</span>
            </div>
            {discountAmount > 0 && (
              <div className="flex justify-between text-sm">
                <span className="text-green-600">
                  Discount ({couponResult.couponCode})
                </span>
                <span className="text-green-600">
                  −₹{discountAmount.toLocaleString()}
                </span>
              </div>
            )}
            <div className="border-t pt-2 mt-1 flex justify-between font-medium">
              <span>Total per month</span>
              <span>₹{finalPrice.toLocaleString()}</span>
            </div>
          </div>
          <p className="text-xs text-gray-400 mt-3">
            Billed monthly. Cancel anytime from your billing page.
          </p>
        </CardContent>
      </Card>

      {error && (
        <div className="bg-red-50 text-red-600 text-sm px-4 py-3 rounded-lg mb-4">
          {error}
        </div>
      )}

      {/* Pay button */}
      <Button
        onClick={handlePayment}
        disabled={paymentLoading}
        className="w-full h-12 text-base"
      >
        {paymentLoading
          ? 'Opening payment...'
          : `Pay ₹${finalPrice.toLocaleString()}/mo with Razorpay`
        }
      </Button>

      <p className="text-xs text-center text-gray-400 mt-3">
        🔒 Secured by Razorpay · UPI, cards, netbanking accepted
      </p>
    </div>
  )
}

export default function UpgradePage() {
  return (
    <Suspense fallback={
      <div className="flex items-center justify-center h-64">
        <p className="text-sm text-gray-400">Loading...</p>
      </div>
    }>
      <UpgradeContent />
    </Suspense>
  )
}