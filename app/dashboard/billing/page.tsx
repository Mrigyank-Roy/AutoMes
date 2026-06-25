'use client'

import { useEffect, useState, Suspense } from 'react'
import { supabase } from '@/lib/supabase'
import { useRouter, useSearchParams } from 'next/navigation'
import Link from 'next/link'

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
  const [showRenewModal, setShowRenewModal] = useState(false)
  const [selectedRenewPlan, setSelectedRenewPlan] = useState('')

  useEffect(() => {
    if (searchParams.get('success') === 'true') {
      setSuccessMessage('🎉 Payment successful! Your plan has been updated.')
    }
  }, [searchParams])

  useEffect(() => { loadData() }, [router])

  async function loadData() {
    const { data: { session } } = await supabase.auth.getSession()
    if (!session) { router.push('/login'); return }
    setUserId(session.user.id)

    const { data: sub } = await supabase.from('subscriptions').select('*').eq('user_id', session.user.id).single()
    setSubscription(sub)

    const { data: plansData } = await supabase.from('plans').select('*').eq('is_active', true).order('sort_order', { ascending: true })
    setPlans(plansData ?? [])

    const { data: pending } = await supabase.from('payments').select('*').eq('user_id', session.user.id).eq('status', 'paid').eq('is_active', false).order('created_at', { ascending: false }).limit(1).maybeSingle()
    setPendingPayment(pending)

    const { data: paymentHistory } = await supabase.from('payments').select('*').eq('user_id', session.user.id).order('created_at', { ascending: false }).limit(10)
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
    if (res.ok) window.location.reload()
    else setActivating(false)
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
    if (res.ok) window.location.reload()
    else setCancelling(false)
  }

  const now = new Date()
  const hasActivePaidPlan = subscription?.plan_name !== 'trial' && subscription?.renews_at && new Date(subscription.renews_at) > now
  const used = subscription?.dms_used_this_month ?? 0
  const limit = subscription?.dm_limit_monthly ?? 50
  const usagePct = Math.round((used / limit) * 100)

  if (loading) return (
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: 300 }}>
      <p style={{ color: 'var(--ash)', fontSize: 14 }}>Loading...</p>
    </div>
  )

  const StatusBadge = ({ payment }: { payment: any }) => {
    const isActive = payment.status === 'paid' && payment.is_active && payment.plan_valid_until && new Date(payment.plan_valid_until) > new Date()
    const isCompleted = payment.status === 'paid' && payment.is_active && payment.plan_valid_until && new Date(payment.plan_valid_until) <= new Date()
    const isScheduled = payment.status === 'paid' && !payment.is_active
    const isCancelled = payment.status === 'cancelled'

    if (isActive) return <span style={{ background: '#e8f8ed', color: '#1a6b3a', borderRadius: 'var(--radius-full)', padding: '3px 10px', fontSize: 11, fontWeight: 700 }}>Active</span>
    if (isCompleted) return <span style={{ background: 'var(--card)', color: 'var(--mute)', borderRadius: 'var(--radius-full)', padding: '3px 10px', fontSize: 11, fontWeight: 700 }}>Completed</span>
    if (isScheduled) return <span style={{ background: '#e8f0fe', color: '#1a4fb5', borderRadius: 'var(--radius-full)', padding: '3px 10px', fontSize: 11, fontWeight: 700 }}>Scheduled</span>
    if (isCancelled) return <span style={{ background: '#fff0f0', color: 'var(--red)', borderRadius: 'var(--radius-full)', padding: '3px 10px', fontSize: 11, fontWeight: 700 }}>Cancelled</span>
    return <span style={{ background: 'var(--card)', color: 'var(--mute)', borderRadius: 'var(--radius-full)', padding: '3px 10px', fontSize: 11, fontWeight: 700 }}>{payment.status}</span>
  }

  return (
    <div style={{ maxWidth: 800 }}>
      {/* Header */}
      <div style={{ marginBottom: 32 }}>
        <h1 style={{ fontSize: 28, fontWeight: 800, color: 'var(--ink)', letterSpacing: -0.5 }}>Billing</h1>
        <p style={{ fontSize: 14, color: 'var(--mute)', marginTop: 4 }}>Manage your plan and usage</p>
      </div>

      {/* Success message */}
      {successMessage && (
        <div style={{ background: '#e8f8ed', border: '1px solid #a3d9b8', borderRadius: 'var(--radius-md)', padding: '12px 16px', marginBottom: 20, fontSize: 13, color: '#1a6b3a', fontWeight: 600 }}>
          {successMessage}
        </div>
      )}

      {/* Current plan card */}
      <div style={{ background: 'var(--canvas)', borderRadius: 'var(--radius-md)', border: '1px solid var(--hairline)', padding: 24, marginBottom: 16 }}>
        <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: 20 }}>
          <div>
            <p style={{ fontSize: 11, fontWeight: 700, color: 'var(--ash)', textTransform: 'uppercase', letterSpacing: 0.5, marginBottom: 4 }}>Current plan</p>
            <p style={{ fontSize: 22, fontWeight: 800, color: 'var(--ink)', textTransform: 'capitalize' }}>{subscription?.plan_name ?? 'trial'}</p>
          </div>
          <div style={{ textAlign: 'right' }}>
            <p style={{ fontSize: 28, fontWeight: 800, color: 'var(--ink)', lineHeight: 1 }}>
              {used}
              <span style={{ fontSize: 16, color: 'var(--stone)', fontWeight: 400 }}> / {limit}</span>
            </p>
            <p style={{ fontSize: 12, color: 'var(--ash)', marginTop: 2 }}>DMs this month</p>
          </div>
        </div>

        {/* Progress bar */}
        <div style={{ height: 8, background: 'var(--card)', borderRadius: 'var(--radius-full)', overflow: 'hidden', marginBottom: 8 }}>
          <div style={{ height: '100%', width: `${Math.min(usagePct, 100)}%`, background: usagePct > 80 ? 'var(--red)' : usagePct > 60 ? '#f59e0b' : 'var(--ink)', borderRadius: 'var(--radius-full)', transition: 'width 0.5s' }} />
        </div>
        <div style={{ display: 'flex', justifyContent: 'space-between' }}>
          <p style={{ fontSize: 12, color: 'var(--ash)' }}>{usagePct}% of monthly limit used</p>
          {subscription?.renews_at && (
            <p style={{ fontSize: 12, color: 'var(--ash)' }}>
              Valid till {new Date(subscription.renews_at).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}
            </p>
          )}
        </div>

        {/* Actions */}
        {hasActivePaidPlan && (
          <div style={{ marginTop: 20, paddingTop: 20, borderTop: '1px solid var(--hairline)', display: 'flex', flexDirection: 'column', gap: 14 }}>
            {!pendingPayment && (
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <div>
                  <p style={{ fontSize: 14, fontWeight: 700, color: 'var(--ink)' }}>Renew plan</p>
                  <p style={{ fontSize: 12, color: 'var(--mute)', marginTop: 2 }}>Schedule renewal before your plan expires</p>
                </div>
                <button className="btn-primary" style={{ padding: '8px 18px', fontSize: 13 }} onClick={() => { setSelectedRenewPlan(subscription.plan_name); setShowRenewModal(true) }}>
                  Renew plan
                </button>
              </div>
            )}

            {plans.some(p => p.id !== 'trial' && p.id !== subscription.plan_name && (plans.find(pl => pl.id === p.id)?.sort_order ?? 0) > (plans.find(pl => pl.id === subscription.plan_name)?.sort_order ?? 0)) && (
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <div>
                  <p style={{ fontSize: 14, fontWeight: 700, color: 'var(--ink)' }}>Upgrade plan</p>
                  <p style={{ fontSize: 12, color: 'var(--mute)', marginTop: 2 }}>Activates immediately, DMs reset to 0</p>
                </div>
                <button className="btn-secondary" style={{ padding: '8px 18px', fontSize: 13 }} onClick={() => { setSelectedRenewPlan(''); setShowRenewModal(true) }}>
                  Upgrade
                </button>
              </div>
            )}

            {hasActivePaidPlan && pendingPayment && (
              <p style={{ fontSize: 12, color: 'var(--ash)', fontStyle: 'italic' }}>You have a renewal scheduled. See below for details.</p>
            )}
          </div>
        )}
      </div>

      {/* Upcoming / pending plan */}
      {pendingPayment && (
        <div style={{ background: 'var(--canvas)', borderRadius: 'var(--radius-md)', border: '2px solid #93c5fd', padding: 24, marginBottom: 16 }}>
          <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 16 }}>
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 10 }}>
                <p style={{ fontSize: 15, fontWeight: 800, color: 'var(--ink)', textTransform: 'capitalize' }}>
                  Upcoming: {pendingPayment.plan_id} plan
                </p>
                <span style={{ background: '#e8f0fe', color: '#1a4fb5', borderRadius: 'var(--radius-full)', padding: '3px 10px', fontSize: 11, fontWeight: 700 }}>Scheduled</span>
              </div>
              <p style={{ fontSize: 13, color: 'var(--mute)', marginBottom: 4 }}>
                Auto-starts: <strong style={{ color: 'var(--ink)' }}>{new Date(pendingPayment.plan_valid_from).toLocaleDateString('en-IN', { day: 'numeric', month: 'long', year: 'numeric' })}</strong>
              </p>
              <p style={{ fontSize: 13, color: 'var(--mute)', marginBottom: 10 }}>
                Valid until: {new Date(pendingPayment.plan_valid_until).toLocaleDateString('en-IN', { day: 'numeric', month: 'long', year: 'numeric' })}
              </p>
              <p style={{ fontSize: 12, color: 'var(--ash)', maxWidth: 380, lineHeight: 1.6 }}>
                This plan activates automatically when your current plan ends. Click "Start now" to activate immediately — your DM counter will reset to 0.
              </p>
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8, flexShrink: 0 }}>
              <button className="btn-primary" style={{ padding: '9px 18px', fontSize: 13 }} onClick={handleStartNow} disabled={activating}>
                {activating ? 'Starting...' : 'Start now'}
              </button>
              <button onClick={handleCancelRenewal} disabled={cancelling}
                style={{ background: 'none', border: 'none', cursor: 'pointer', fontSize: 12, fontWeight: 600, color: 'var(--ash)', padding: '8px', borderRadius: 'var(--radius-sm)', transition: 'color 0.15s' }}
                onMouseEnter={e => e.currentTarget.style.color = 'var(--red)'}
                onMouseLeave={e => e.currentTarget.style.color = 'var(--ash)'}>
                {cancelling ? 'Cancelling...' : 'Cancel renewal'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Plans grid — trial users only */}
      {!hasActivePaidPlan && (
        <div style={{ marginBottom: 24 }}>
          <p style={{ fontSize: 15, fontWeight: 700, color: 'var(--ink)', marginBottom: 16 }}>
            {subscription?.plan_name === 'trial' ? 'Upgrade your plan' : 'Choose a plan'}
          </p>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: 14 }}>
            {plans.filter(p => p.id !== 'trial').map(plan => {
              const isPro = plan.id === 'pro'
              return (
                <div key={plan.id} style={{ background: isPro ? 'var(--ink)' : 'var(--canvas)', borderRadius: 'var(--radius-md)', border: isPro ? 'none' : '1px solid var(--hairline)', padding: 22, position: 'relative', transform: isPro ? 'scale(1.02)' : 'none' }}>
                  {isPro && (
                    <span style={{ position: 'absolute', top: -11, left: '50%', transform: 'translateX(-50%)', background: 'var(--red)', color: '#fff', fontSize: 10, fontWeight: 800, padding: '3px 12px', borderRadius: 'var(--radius-full)', whiteSpace: 'nowrap' }}>
                      Most popular
                    </span>
                  )}
                  <p style={{ fontSize: 14, fontWeight: 700, color: isPro ? '#fff' : 'var(--ink)', marginBottom: 6 }}>{plan.name}</p>
                  <p style={{ fontSize: 26, fontWeight: 800, color: isPro ? '#fff' : 'var(--ink)', marginBottom: 16 }}>
                    ₹{plan.price_inr.toLocaleString()}<span style={{ fontSize: 13, fontWeight: 400, color: isPro ? 'rgba(255,255,255,0.5)' : 'var(--ash)' }}>/mo</span>
                  </p>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 8, marginBottom: 20 }}>
                    {[
                      `${plan.dm_limit.toLocaleString()} DMs/month`,
                      `${plan.account_limit} account${plan.account_limit > 1 ? 's' : ''}`,
                      plan.allows_comment_reply ? 'Public reply ✓' : 'Public reply ✗',
                    ].map((item, i) => (
                      <div key={i} style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
                        <span style={{ color: item.includes('✗') ? 'rgba(255,255,255,0.3)' : isPro ? '#4ade80' : '#22c55e', fontSize: 12, fontWeight: 700 }}>{item.includes('✗') ? '✗' : '✓'}</span>
                        <span style={{ fontSize: 12, color: isPro ? 'rgba(255,255,255,0.8)' : 'var(--body)', opacity: item.includes('✗') ? 0.5 : 1 }}>{item.replace(' ✓', '').replace(' ✗', '')}</span>
                      </div>
                    ))}
                  </div>
                  <button onClick={() => router.push(`/dashboard/billing/upgrade?plan=${plan.id}`)}
                    style={{ width: '100%', padding: '10px', borderRadius: 'var(--radius-md)', border: 'none', cursor: 'pointer', fontSize: 13, fontWeight: 700, background: isPro ? 'var(--red)' : 'var(--secondary-bg)', color: isPro ? '#fff' : 'var(--ink)', transition: 'opacity 0.15s' }}>
                    Get {plan.name} →
                  </button>
                </div>
              )
            })}
          </div>
        </div>
      )}

      {/* Payment history */}
      {payments.filter(p => p.status === 'paid' || p.status === 'cancelled').length > 0 && (
        <div style={{ marginTop: 8 }}>
          <p style={{ fontSize: 15, fontWeight: 700, color: 'var(--ink)', marginBottom: 16 }}>Payment history</p>
          <div style={{ background: 'var(--canvas)', borderRadius: 'var(--radius-md)', border: '1px solid var(--hairline)', overflow: 'hidden' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13 }}>
              <thead>
                <tr style={{ background: 'var(--surface)', borderBottom: '1px solid var(--hairline)' }}>
                  {['Date', 'Plan', 'Amount', 'Valid until', 'Status'].map(h => (
                    <th key={h} style={{ padding: '12px 20px', textAlign: 'left', fontSize: 11, fontWeight: 700, color: 'var(--ash)', textTransform: 'uppercase', letterSpacing: 0.5 }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {payments.filter(p => p.status === 'paid' || p.status === 'cancelled').map((payment, i, arr) => (
                  <tr key={payment.id} style={{ borderBottom: i < arr.length - 1 ? '1px solid var(--hairline)' : 'none' }}
                    onMouseEnter={e => e.currentTarget.style.background = 'var(--surface)'}
                    onMouseLeave={e => e.currentTarget.style.background = 'transparent'}>
                    <td style={{ padding: '14px 20px', color: 'var(--mute)' }}>
                      {new Date(payment.created_at).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}
                    </td>
                    <td style={{ padding: '14px 20px', fontWeight: 700, color: 'var(--ink)', textTransform: 'capitalize' }}>
                      {payment.plan_id}
                      {payment.coupon_code && (
                        <span style={{ marginLeft: 8, fontSize: 11, color: '#1a6b3a', fontWeight: 600, background: '#e8f8ed', padding: '2px 8px', borderRadius: 'var(--radius-full)' }}>{payment.coupon_code}</span>
                      )}
                    </td>
                    <td style={{ padding: '14px 20px', color: 'var(--ink)', fontWeight: 600 }}>
                      ₹{payment.amount_paid.toLocaleString()}
                      {payment.discount_amount > 0 && (
                        <span style={{ marginLeft: 6, fontSize: 11, color: 'var(--stone)', textDecoration: 'line-through' }}>₹{payment.original_amount.toLocaleString()}</span>
                      )}
                    </td>
                    <td style={{ padding: '14px 20px', color: 'var(--mute)' }}>
                      {payment.plan_valid_until ? new Date(payment.plan_valid_until).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' }) : '—'}
                    </td>
                    <td style={{ padding: '14px 20px' }}>
                      <StatusBadge payment={payment} />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      <p style={{ fontSize: 12, textAlign: 'center', color: 'var(--ash)', marginTop: 24 }}>
        Billed monthly. Cancel anytime by contacting support.
      </p>

      {/* Renew / Upgrade Modal */}
      {showRenewModal && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 100, padding: 24 }}>
          <div style={{ background: 'var(--canvas)', borderRadius: 'var(--radius-lg)', maxWidth: 460, width: '100%', padding: 32, boxShadow: '0 24px 60px rgba(0,0,0,0.2)' }}>
            <h2 style={{ fontSize: 20, fontWeight: 800, color: 'var(--ink)', marginBottom: 6 }}>
              {selectedRenewPlan ? 'Renew your plan' : 'Upgrade your plan'}
            </h2>
            <p style={{ fontSize: 13, color: 'var(--mute)', marginBottom: 24, lineHeight: 1.6 }}>
              {selectedRenewPlan
                ? 'Choose which plan to renew with. Starts automatically when your current plan ends.'
                : 'Upgrading activates immediately and resets your DM counter to 0.'}
            </p>

            <div style={{ display: 'flex', flexDirection: 'column', gap: 10, marginBottom: 24 }}>
              {plans.filter(p => {
                if (p.id === 'trial') return false
                const currentOrder = plans.find(pl => pl.id === subscription?.plan_name)?.sort_order ?? 0
                if (!selectedRenewPlan) return (p.sort_order ?? 0) > currentOrder
                return (p.sort_order ?? 0) >= currentOrder
              }).map(plan => (
                <label key={plan.id} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '14px 16px', borderRadius: 'var(--radius-md)', border: `2px solid ${selectedRenewPlan === plan.id ? 'var(--ink)' : 'var(--hairline)'}`, cursor: 'pointer', background: selectedRenewPlan === plan.id ? 'var(--surface)' : 'transparent', transition: 'all 0.15s' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                    <input type="radio" name="renewPlan" value={plan.id} checked={selectedRenewPlan === plan.id} onChange={() => setSelectedRenewPlan(plan.id)} />
                    <div>
                      <p style={{ fontSize: 14, fontWeight: 700, color: 'var(--ink)' }}>{plan.name}</p>
                      <p style={{ fontSize: 12, color: 'var(--ash)', marginTop: 1 }}>{plan.dm_limit.toLocaleString()} DMs/month</p>
                    </div>
                  </div>
                  <span style={{ fontSize: 14, fontWeight: 700, color: 'var(--ink)' }}>₹{plan.price_inr.toLocaleString()}/mo</span>
                </label>
              ))}
            </div>

            <div style={{ display: 'flex', gap: 10 }}>
              <button className="btn-secondary" style={{ flex: 1, justifyContent: 'center', padding: '12px' }} onClick={() => setShowRenewModal(false)}>Cancel</button>
              <button className="btn-primary" style={{ flex: 1, justifyContent: 'center', padding: '12px' }}
                disabled={!selectedRenewPlan}
                onClick={() => { setShowRenewModal(false); router.push(`/dashboard/billing/upgrade?plan=${selectedRenewPlan}`) }}>
                Continue →
              </button>
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
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: 300 }}>
        <p style={{ color: 'var(--ash)', fontSize: 14 }}>Loading...</p>
      </div>
    }>
      <BillingContent />
    </Suspense>
  )
}