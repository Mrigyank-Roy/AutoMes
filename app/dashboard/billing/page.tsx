'use client'

import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase'
import { useRouter } from 'next/navigation'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Progress } from '@/components/ui/progress'
import { Badge } from '@/components/ui/badge'

export default function BillingPage() {
  const router = useRouter()
  const [subscription, setSubscription] = useState<any>(null)
  const [plans, setPlans] = useState<any[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function loadData() {
      const { data: { session } } = await supabase.auth.getSession()
      if (!session) { router.push('/login'); return }

      // Load subscription
      const { data: sub } = await supabase
        .from('subscriptions')
        .select('*')
        .eq('user_id', session.user.id)
        .single()
      setSubscription(sub)

      // Load plans from DB — change prices/limits in Supabase, UI updates automatically
      const { data: plansData } = await supabase
        .from('plans')
        .select('*')
        .eq('is_active', true)
        .order('sort_order', { ascending: true })
      setPlans(plansData ?? [])

      setLoading(false)
    }
    loadData()
  }, [router])

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <p className="text-sm text-gray-400">Loading...</p>
      </div>
    )
  }

  const usagePercent = subscription
    ? Math.round((subscription.dms_used_this_month / subscription.dm_limit_monthly) * 100)
    : 0

  return (
    <div className="max-w-3xl">
      <div className="mb-8">
        <h1 className="text-2xl font-semibold">Billing</h1>
        <p className="text-sm text-gray-500 mt-1">Manage your plan and usage</p>
      </div>

      {/* Current usage */}
      <Card className="mb-8">
        <CardHeader className="pb-3">
          <CardTitle className="text-sm font-medium">Current usage</CardTitle>
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
            <span className="text-sm text-gray-400 capitalize">
              {subscription?.plan_name ?? 'trial'} plan
            </span>
          </div>
          <Progress value={usagePercent} className="h-2" />
          <p className="text-xs text-gray-400 mt-2">
            {usagePercent}% of monthly limit used
          </p>
        </CardContent>
      </Card>

      {/* Plans from DB */}
      <div className="grid grid-cols-2 gap-4 mb-6">
        {plans.map(plan => {
          const isCurrentPlan = subscription?.plan_name === plan.id
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
                      {plan.price_inr === 0 ? '₹0' : `₹${plan.price_inr.toLocaleString()}`}
                    </span>
                    <span className="text-sm text-gray-400">
                      {plan.id === 'trial' ? '14 days' : '/mo'}
                    </span>
                  </div>
                </div>

                <div className="flex flex-col gap-2 mb-5 text-sm text-gray-600">
                  <div className="flex items-center gap-2">
                    <span className="text-green-500">✓</span>
                    <span>{plan.dm_limit.toLocaleString()} DMs/month</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-green-500">✓</span>
                    <span>
                      {plan.account_limit} Instagram account{plan.account_limit > 1 ? 's' : ''}
                    </span>
                  </div>
                  <div className="flex items-center gap-2">
                    {plan.allows_comment_reply
                      ? <span className="text-green-500">✓</span>
                      : <span className="text-gray-300">✗</span>
                    }
                    <span className={plan.allows_comment_reply ? '' : 'text-gray-400'}>
                      Public comment reply
                    </span>
                  </div>
                </div>

                {isCurrentPlan ? (
                  <Button variant="outline" className="w-full" disabled>
                    Current plan
                  </Button>
                ) : (
                  <Button
                    className="w-full"
                    variant={isPopular ? 'default' : 'outline'}
                    onClick={() => alert('Stripe billing coming soon!')}
                  >
                    {plan.price_inr === 0 ? 'Downgrade' : 'Upgrade'}
                  </Button>
                )}
              </CardContent>
            </Card>
          )
        })}
      </div>

      <p className="text-xs text-center text-gray-400">
        All plans include a 14-day free trial. Cancel anytime.
        Stripe billing integration coming soon.
      </p>
    </div>
  )
}