'use client'

import { useEffect, useState, Suspense } from 'react'
import { supabase } from '@/lib/supabase'
import { useRouter, useSearchParams } from 'next/navigation'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Progress } from '@/components/ui/progress'
import { Badge } from '@/components/ui/badge'

function BillingContent() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const [subscription, setSubscription] = useState<any>(null)
  const [plans, setPlans] = useState<any[]>([])
  const [pendingPayment, setPendingPayment] = useState<any>(null)
  const [payments, setPayments] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [successMessage, setSuccessMessage] = useState('')
  const [activating, setActivating] = useState(false)
  const [cancelling, setCancelling] = useState(false)
  const [userId, setUserId] = useState('')

  // Renew modal state
  const [showRenewModal, setShowRenewModal] = useState(false)
  const [selectedRenewPlan, setSelectedRenewPlan] = useState('')

  useEffect(() => {
    if (searchParams.get('success') === 'true') {
      setSuccessMessage('🎉 Payment successful! Your plan has been updated.')
    }
  }, [searchParams])

  useEffect(() => {
    loadData()
  }, [router])

  async function loadData() {
    const { data: { session } } = await supabase.auth.getSession()
    if (!session) { router.push('/login'); return }

    setUserId(session.user.id)

    const { data: sub } = await supabase
      .from('subscriptions')
      .select('*')
      .eq('user_id', session.user.id)
      .single()
    setSubscription(sub)

    const { data: plansData } = await supabase
      .from('plans')
      .select('*')
      .eq('is_active', true)
      .order('sort_order', { ascending: true })
    setPlans(plansData ?? [])

    const { data: pending } = await supabase
      .from('payments')
      .select('*')
      .eq('user_id', session.user.id)
      .eq('status', 'paid')
      .eq('is_active', false)
      .order('created_at', { ascending: false })
      .limit(1)
      .maybeSingle()
    setPendingPayment(pending)

    const { data: paymentHistory } = await supabase
      .from('payments')
      .select('*')
      .eq('user_id', session.user.id)
      .order('created_at', { ascending: false })
      .limit(10)
    setPayments(paymentHistory ?? [])

    setLoading(false)
  }

  async function handleStartNow() {
    if (!pendingPayment) return
    setActivating(true)

    const res = await fetch('/api/billing/activate-pending', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ userId, paymentId: pendingPayment.id })
    })

    if (res.ok) {
      window.location.reload()
    } else {
      setActivating(false)
    }
  }

  async function handleCancelRenewal() {
    if (!pendingPayment) return
    if (!confirm('Cancel your upcoming renewal? You will not be refunded.')) return
    setCancelling(true)

    const res = await fetch('/api/billing/cancel-pending', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ userId, paymentId: pendingPayment.id })
    })

    if (res.ok) {
      window.location.reload()
    } else {
      setCancelling(false)
    }
  }

  // Is user on an active paid plan?
  const now = new Date()
  const hasActivePaidPlan =
    subscription?.plan_name !== 'trial' &&
    subscription?.renews_at &&
    new Date(subscription.renews_at) > now

  const usagePercent = subscription
    ? Math.round((subscription.dms_used_this_month / subscription.dm_limit_monthly) * 100)
    : 0

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <p className="text-sm text-gray-400">Loading...</p>
      </div>
    )
  }

  return (
    <div className="max-w-3xl">
      <div className="mb-8">
        <h1 className="text-2xl font-semibold">Billing</h1>
        <p className="text-sm text-gray-500 mt-1">Manage your plan and usage</p>
      </div>

      {successMessage && (
        <div className="bg-green-50 text-green-700 text-sm px-4 py-3 rounded-lg mb-5">
          {successMessage}
        </div>
      )}

      {/* Current usage */}
      <Card className="mb-5">
        <CardHeader className="pb-3">
          <CardTitle className="text-sm font-medium">Current plan</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-end justify-between mb-2">
            <div>
              <span className="text-2xl font-semibold">
                {subscription?.dms_used_this_month ?? 0}
              </span>
              <span className="text-gray-400 ml-1">
                / {subscription?.dm_limit_monthly ?? 50} DMs
              </span>
            </div>
            <span className="text-sm font-medium capitalize">
              {subscription?.plan_name ?? 'trial'} plan
            </span>
          </div>
          <Progress value={usagePercent} className="h-2" />
          <div className="flex items-center justify-between mt-2">
            <p className="text-xs text-gray-400">{usagePercent}% of monthly limit used</p>
            {subscription?.renews_at && (
              <p className="text-xs text-gray-400">
                Valid till {new Date(subscription.renews_at).toLocaleDateString('en-IN', {
                  day: 'numeric', month: 'short', year: 'numeric'
                })}
              </p>
            )}
          </div>

          {/* Actions for active paid plan */}
          {hasActivePaidPlan && (
            <div className="mt-4 pt-4 border-t space-y-3">
              {/* Renew — only if no pending payment */}
              {!pendingPayment && (
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium">Renew plan</p>
                    <p className="text-xs text-gray-400 mt-0.5">
                      Schedule renewal before your plan expires
                    </p>
                  </div>
                  <Button size="sm" onClick={() => {
                    setSelectedRenewPlan(subscription.plan_name)
                    setShowRenewModal(true)
                  }}>
                    Renew plan
                  </Button>
                </div>
              )}
              {/* Upgrade — always show if higher plans exist */}
              {plans.some(p =>
                p.id !== 'trial' &&
                p.id !== subscription.plan_name &&
                (plans.find(pl => pl.id === p.id)?.sort_order ?? 0) >
                (plans.find(pl => pl.id === subscription.plan_name)?.sort_order ?? 0)
              ) && (
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium">Upgrade plan</p>
                    <p className="text-xs text-gray-400 mt-0.5">
                      Upgrade now — activates immediately, DMs reset to 0
                    </p>
                  </div>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => {
                      setSelectedRenewPlan('')
                      setShowRenewModal(true)
                    }}
                  >
                    Upgrade
                  </Button>
                </div>
              )}
            </div>
          )}

          {/* Already has pending — show message instead of renew button */}
          {hasActivePaidPlan && pendingPayment && (
            <div className="mt-4 pt-4 border-t">
              <p className="text-xs text-gray-400">
                You have a renewal scheduled. See below for details.
              </p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Upcoming / pending plan */}
      {pendingPayment && (
        <Card className="mb-5 border-blue-200">
          <CardContent className="pt-5">
            <div className="flex items-start justify-between gap-4">
              <div>
                <div className="flex items-center gap-2 mb-2">
                  <p className="font-medium capitalize">
                    Upcoming: {pendingPayment.plan_id} plan
                  </p>
                  <span className="text-xs bg-blue-100 text-blue-700 px-2 py-0.5 rounded-full font-medium">
                    Scheduled
                  </span>
                </div>
                <p className="text-sm text-gray-500">
                  Auto-starts:{' '}
                  <strong>
                    {new Date(pendingPayment.plan_valid_from).toLocaleDateString('en-IN', {
                      day: 'numeric', month: 'long', year: 'numeric'
                    })}
                  </strong>
                </p>
                <p className="text-sm text-gray-500 mt-0.5">
                  Valid until:{' '}
                  {new Date(pendingPayment.plan_valid_until).toLocaleDateString('en-IN', {
                    day: 'numeric', month: 'long', year: 'numeric'
                  })}
                </p>
                <p className="text-xs text-gray-400 mt-2 max-w-sm">
                  This plan activates automatically when your current plan ends.
                  Click "Start now" to activate immediately — your DM counter will reset to 0.
                </p>
              </div>
              <div className="flex flex-col gap-2 flex-shrink-0">
                <Button size="sm" onClick={handleStartNow} disabled={activating}>
                  {activating ? 'Starting...' : 'Start now'}
                </Button>
                <Button
                  size="sm"
                  variant="ghost"
                  className="text-red-400 hover:text-red-600 hover:bg-red-50 text-xs"
                  onClick={handleCancelRenewal}
                  disabled={cancelling}
                >
                  {cancelling ? 'Cancelling...' : 'Cancel renewal'}
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Plans grid — only show if user is on trial OR has no active plan */}
      {!hasActivePaidPlan && (
        <>
          <h2 className="text-base font-medium mb-4">
            {subscription?.plan_name === 'trial' ? 'Upgrade your plan' : 'Choose a plan'}
          </h2>
          <div className="grid grid-cols-2 gap-4 mb-6">
            {plans.filter(p => p.id !== 'trial').map(plan => {
              const isPopular = plan.id === 'pro'
              return (
                <Card
                  key={plan.id}
                  className={`relative ${isPopular ? 'border-black border-2 overflow-visible' : ''}`}
                >
                  {isPopular && (
                    <div className="absolute -top-3 left-1/2 -translate-x-1/2">
                      <Badge className="bg-black text-white text-xs">Most popular</Badge>
                    </div>
                  )}
                  <CardContent className="pt-5 pb-5">
                    <div className="mb-4">
                      <p className="font-medium">{plan.name}</p>
                      <div className="flex items-baseline gap-1 mt-1">
                        <span className="text-2xl font-semibold">
                          ₹{plan.price_inr.toLocaleString()}
                        </span>
                        <span className="text-sm text-gray-400">/mo</span>
                      </div>
                    </div>
                    <div className="flex flex-col gap-2 mb-5 text-sm text-gray-600">
                      <div className="flex items-center gap-2">
                        <span className="text-green-500">✓</span>
                        <span>{plan.dm_limit.toLocaleString()} DMs/month</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="text-green-500">✓</span>
                        <span>{plan.account_limit} Instagram account{plan.account_limit > 1 ? 's' : ''}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        {plan.allows_comment_reply
                          ? <span className="text-green-500">✓</span>
                          : <span className="text-gray-300">✗</span>}
                        <span className={plan.allows_comment_reply ? '' : 'text-gray-400'}>
                          Public comment reply
                        </span>
                      </div>
                    </div>
                    <Button
                      className="w-full"
                      variant={isPopular ? 'default' : 'outline'}
                      onClick={() => router.push(`/dashboard/billing/upgrade?plan=${plan.id}`)}
                    >
                      Get {plan.name}
                    </Button>
                  </CardContent>
                </Card>
              )
            })}
          </div>
        </>
      )}

      {/* Payment history */}
      {payments.filter(p => p.status === 'paid').length > 0 && (
        <div className="mt-6">
          <h2 className="text-base font-medium mb-4">Payment history</h2>
          <Card>
            <CardContent className="p-0">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b">
                    <th className="text-left px-5 py-3 text-xs font-medium text-gray-400 uppercase tracking-wide">Date</th>
                    <th className="text-left px-5 py-3 text-xs font-medium text-gray-400 uppercase tracking-wide">Plan</th>
                    <th className="text-left px-5 py-3 text-xs font-medium text-gray-400 uppercase tracking-wide">Amount</th>
                    <th className="text-left px-5 py-3 text-xs font-medium text-gray-400 uppercase tracking-wide">Valid until</th>
                    <th className="text-left px-5 py-3 text-xs font-medium text-gray-400 uppercase tracking-wide">Status</th>
                  </tr>
                </thead>
                <tbody>
                  {payments.filter(p => p.status === 'paid' || p.status === 'cancelled').map(payment => (
                    <tr key={payment.id} className="border-b last:border-0 hover:bg-gray-50">
                      <td className="px-5 py-3.5 text-gray-500">
                        {new Date(payment.created_at).toLocaleDateString('en-IN', {
                          day: 'numeric', month: 'short', year: 'numeric'
                        })}
                      </td>
                      <td className="px-5 py-3.5 capitalize font-medium">
                        {payment.plan_id}
                        {payment.coupon_code && (
                          <span className="ml-2 text-xs text-green-600 font-normal">
                            {payment.coupon_code}
                          </span>
                        )}
                      </td>
                      <td className="px-5 py-3.5">
                        <span>₹{payment.amount_paid.toLocaleString()}</span>
                        {payment.discount_amount > 0 && (
                          <span className="ml-1 text-xs text-gray-400 line-through">
                            ₹{payment.original_amount.toLocaleString()}
                          </span>
                        )}
                      </td>
                      <td className="px-5 py-3.5 text-gray-500">
                        {payment.plan_valid_until
                          ? new Date(payment.plan_valid_until).toLocaleDateString('en-IN', {
                              day: 'numeric', month: 'short', year: 'numeric'
                            })
                          : '—'}
                      </td>
                      <td className="px-5 py-3.5">
                        {(() => {
                          const isCurrentlyActive =
                            payment.status === 'paid' &&
                            payment.is_active === true &&
                            payment.plan_valid_until &&
                            new Date(payment.plan_valid_until) > new Date()

                          const isPastCompleted =
                            payment.status === 'paid' &&
                            payment.is_active === true &&
                            payment.plan_valid_until &&
                            new Date(payment.plan_valid_until) <= new Date()

                          const isScheduled =
                            payment.status === 'paid' &&
                            payment.is_active === false

                          const isCancelled = payment.status === 'cancelled'

                          if (isCurrentlyActive) return (
                            <span className="text-xs bg-green-100 text-green-700 px-2 py-1 rounded-full font-medium">
                              Active
                            </span>
                          )
                          if (isPastCompleted) return (
                            <span className="text-xs bg-gray-100 text-gray-500 px-2 py-1 rounded-full">
                              Completed
                            </span>
                          )
                          if (isScheduled) return (
                            <span className="text-xs bg-blue-100 text-blue-700 px-2 py-1 rounded-full">
                              Scheduled
                            </span>
                          )
                          if (isCancelled) return (
                            <span className="text-xs bg-red-50 text-red-400 px-2 py-1 rounded-full">
                              Cancelled
                            </span>
                          )
                          return (
                            <span className="text-xs bg-gray-100 text-gray-400 px-2 py-1 rounded-full">
                              {payment.status}
                            </span>
                          )
                        })()}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </CardContent>
          </Card>
        </div>
      )}

      <p className="text-xs text-center text-gray-400 mt-6">
        Billed monthly. Cancel anytime by contacting support.
      </p>

      {/* Renew plan modal */}
      {showRenewModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl max-w-md w-full p-6">
            <h2 className="text-lg font-semibold mb-1">
              {selectedRenewPlan ? 'Renew your plan' : 'Upgrade your plan'}
            </h2>
            <p className="text-sm text-gray-500 mb-5">
              {selectedRenewPlan
                ? 'Choose which plan to renew with. Starts automatically when current plan ends.'
                : 'Upgrading activates immediately and resets your DM counter to 0.'}
            </p>

            <div className="flex flex-col gap-3 mb-6">
              {plans.filter(p => {
                if (p.id === 'trial') return false
                if (!selectedRenewPlan) {
                  // Upgrade mode — only show higher plans
                  const currentSortOrder = plans.find(
                    pl => pl.id === subscription?.plan_name
                  )?.sort_order ?? 0
                  return (p.sort_order ?? 0) > currentSortOrder
                }
                // Renew mode — show same plan and higher only (no downgrade)
                const currentSortOrder = plans.find(
                  pl => pl.id === subscription?.plan_name
                )?.sort_order ?? 0
                return (p.sort_order ?? 0) >= currentSortOrder
              }).map(plan => (
                <label
                  key={plan.id}
                  className={`flex items-center justify-between p-3 rounded-lg border cursor-pointer transition-colors ${
                    selectedRenewPlan === plan.id
                      ? 'border-black bg-gray-50'
                      : 'border-gray-200 hover:border-gray-300'
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <input
                      type="radio"
                      name="renewPlan"
                      value={plan.id}
                      checked={selectedRenewPlan === plan.id}
                      onChange={() => setSelectedRenewPlan(plan.id)}
                    />
                    <div>
                      <p className="text-sm font-medium">{plan.name}</p>
                      <p className="text-xs text-gray-400">
                        {plan.dm_limit.toLocaleString()} DMs/month
                      </p>
                    </div>
                  </div>
                  <span className="text-sm font-medium">
                    ₹{plan.price_inr.toLocaleString()}/mo
                  </span>
                </label>
              ))}
            </div>

            <div className="flex gap-3">
              <Button
                variant="outline"
                className="flex-1"
                onClick={() => setShowRenewModal(false)}
              >
                Cancel
              </Button>
              <Button
                className="flex-1"
                disabled={!selectedRenewPlan && showRenewModal}
                onClick={() => {
                  setShowRenewModal(false)
                  router.push(`/dashboard/billing/upgrade?plan=${selectedRenewPlan}`)
                }}
              >
                Continue →
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

export default function BillingPage() {
  return (
    <Suspense fallback={
      <div className="flex items-center justify-center h-64">
        <p className="text-sm text-gray-400">Loading...</p>
      </div>
    }>
      <BillingContent />
    </Suspense>
  )
}