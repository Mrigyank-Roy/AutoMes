'use client'

import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase'
import { useRouter } from 'next/navigation'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Progress } from '@/components/ui/progress'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import Link from 'next/link'
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer
} from 'recharts'

interface DayData {
  day: string
  count: number
}

export default function DashboardPage() {
  const router = useRouter()
  const [loading, setLoading] = useState(true)
  const [subscription, setSubscription] = useState<any>(null)
  const [activeAutomations, setActiveAutomations] = useState(0)
  const [dmsToday, setDmsToday] = useState(0)
  const [weeklyData, setWeeklyData] = useState<DayData[]>([])

  useEffect(() => {
    async function loadData() {
      const { data: { session } } = await supabase.auth.getSession()
      if (!session) {
        router.push('/login')
        return
      }

      const userId = session.user.id

      // Get subscription
      const { data: sub } = await supabase
        .from('subscriptions')
        .select('*')
        .eq('user_id', userId)
        .single()
      setSubscription(sub)

      // Get active automations count
      const { count } = await supabase
        .from('automations')
        .select('*', { count: 'exact', head: true })
        .eq('user_id', userId)
        .eq('is_active', true)
      setActiveAutomations(count ?? 0)

      // Get DMs sent today
      const todayStart = new Date()
      todayStart.setHours(0, 0, 0, 0)

      const { count: todayCount } = await supabase
        .from('dm_logs')
        .select('*', { count: 'exact', head: true })
        .eq('user_id', userId)
        .eq('status', 'sent')
        .gte('sent_at', todayStart.toISOString())
      setDmsToday(todayCount ?? 0)

      // Get DMs per day for last 7 days
      const sevenDaysAgo = new Date()
      sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 6)
      sevenDaysAgo.setHours(0, 0, 0, 0)

      const { data: logs } = await supabase
        .from('dm_logs')
        .select('sent_at')
        .eq('user_id', userId)
        .eq('status', 'sent')
        .gte('sent_at', sevenDaysAgo.toISOString())

      // Build 7-day chart data
      const days: DayData[] = []
      for (let i = 6; i >= 0; i--) {
        const date = new Date()
        date.setDate(date.getDate() - i)
        const dayStr = date.toLocaleDateString('en-US', { weekday: 'short' })
        const dateStr = date.toISOString().split('T')[0]
        const count = logs?.filter(l =>
          l.sent_at.startsWith(dateStr)
        ).length ?? 0
        days.push({ day: dayStr, count })
      }
      setWeeklyData(days)
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
    <div className="max-w-4xl">
      {/* Header */}
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-2xl font-semibold">Dashboard</h1>
          <p className="text-sm text-gray-500 mt-1">
            Welcome back — here's how your automations are performing
          </p>
        </div>
        <Link href="/dashboard/automations/new">
          <Button>+ Create automation</Button>
        </Link>
      </div>

      {/* Stats cards */}
      <div className="grid grid-cols-3 gap-4 mb-8">
        {/* DMs this month */}
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-gray-500">
              DMs this month
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-semibold mb-2">
              {subscription?.dms_used_this_month ?? 0}
              <span className="text-gray-400 text-lg font-normal">
                {' '}/ {subscription?.dm_limit_monthly ?? 50}
              </span>
            </div>
            <Progress value={usagePercent} className="h-1.5" />
            <p className="text-xs text-gray-400 mt-1.5">{usagePercent}% of plan used</p>
          </CardContent>
        </Card>

        {/* DMs today */}
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-gray-500">
              DMs sent today
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-semibold">{dmsToday}</div>
            <p className="text-xs text-gray-400 mt-1">since midnight</p>
          </CardContent>
        </Card>

        {/* Active automations */}
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-gray-500">
              Active automations
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-semibold">{activeAutomations}</div>
            <p className="text-xs text-gray-400 mt-1">running right now</p>
          </CardContent>
        </Card>
      </div>

      {/* Weekly chart */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base font-medium">DMs sent this week</CardTitle>
        </CardHeader>
        <CardContent>
          {weeklyData.every(d => d.count === 0) ? (
            <div className="h-48 flex items-center justify-center">
              <div className="text-center">
                <p className="text-gray-400 text-sm">No DMs sent this week yet</p>
                <p className="text-gray-300 text-xs mt-1">
                  Create an automation to get started
                </p>
              </div>
            </div>
          ) : (
            <ResponsiveContainer width="100%" height={200}>
              <BarChart data={weeklyData} margin={{ top: 0, right: 0, left: -20, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                <XAxis
                  dataKey="day"
                  tick={{ fontSize: 12, fill: '#9ca3af' }}
                  axisLine={false}
                  tickLine={false}
                />
                <YAxis
                  tick={{ fontSize: 12, fill: '#9ca3af' }}
                  axisLine={false}
                  tickLine={false}
                  allowDecimals={false}
                />
                <Tooltip
                  contentStyle={{
                    border: '1px solid #e5e7eb',
                    borderRadius: '8px',
                    fontSize: '12px'
                  }}
                  formatter={(value) => [`${value} DMs`, 'Sent']}
                />
                <Bar dataKey="count" fill="#000000" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          )}
        </CardContent>
      </Card>

      {/* Plan info */}
      {subscription && (
        <div className="mt-4 p-4 bg-gray-50 rounded-xl border flex items-center justify-between">
          <div>
            <p className="text-sm font-medium capitalize">{subscription.plan_name} plan</p>
            <p className="text-xs text-gray-400 mt-0.5">
              Resets on {subscription.renews_at
                ? new Date(subscription.renews_at).toLocaleDateString()
                : 'next billing date'}
            </p>
          </div>
          <Link href="/dashboard/billing">
            <Button variant="outline" size="sm">Upgrade plan</Button>
          </Link>
        </div>
      )}
    </div>
  )
}