'use client'
import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts'

export default function DashboardPage() {
  const router = useRouter()
  const [loading, setLoading] = useState(true)
  const [subscription, setSubscription] = useState<any>(null)
  const [activeAutomations, setActiveAutomations] = useState(0)
  const [dmsToday, setDmsToday] = useState(0)
  const [weeklyData, setWeeklyData] = useState<any[]>([])

  useEffect(() => {
    async function load() {
      const { data: { session } } = await supabase.auth.getSession()
      if (!session) { router.push('/login'); return }
      const uid = session.user.id

      const { data: sub } = await supabase.from('subscriptions').select('*').eq('user_id', uid).single()
      setSubscription(sub)

      const { count } = await supabase.from('automations').select('*', { count: 'exact', head: true }).eq('user_id', uid).eq('is_active', true)
      setActiveAutomations(count ?? 0)

      const today = new Date(); today.setHours(0, 0, 0, 0)
      const { count: tc } = await supabase.from('dm_logs').select('*', { count: 'exact', head: true }).eq('user_id', uid).eq('status', 'sent').gte('sent_at', today.toISOString())
      setDmsToday(tc ?? 0)

      const seven = new Date(); seven.setDate(seven.getDate() - 6); seven.setHours(0, 0, 0, 0)
      const { data: logs } = await supabase.from('dm_logs').select('sent_at').eq('user_id', uid).eq('status', 'sent').gte('sent_at', seven.toISOString())
      const days = []
      for (let i = 6; i >= 0; i--) {
        const d = new Date(); d.setDate(d.getDate() - i)
        const str = d.toISOString().split('T')[0]
        days.push({ day: d.toLocaleDateString('en-US', { weekday: 'short' }), count: logs?.filter(l => l.sent_at.startsWith(str)).length ?? 0 })
      }
      setWeeklyData(days)
      setLoading(false)
    }
    load()
  }, [router])

  if (loading) return <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: 300 }}><p style={{ color: 'var(--ash)', fontSize: 14 }}>Loading...</p></div>

  const used = subscription?.dms_used_this_month ?? 0
  const limit = subscription?.dm_limit_monthly ?? 50
  const pct = Math.round((used / limit) * 100)

  return (
    <div style={{ maxWidth: 900 }}>
      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: 32 }}>
        <div>
          <h1 style={{ fontSize: 28, fontWeight: 800, color: 'var(--ink)', letterSpacing: -0.5 }}>Dashboard</h1>
          <p style={{ fontSize: 14, color: 'var(--mute)', marginTop: 4 }}>Here's how your automations are performing</p>
        </div>
        <Link href="/dashboard/automations/new" className="btn-primary">+ Create automation</Link>
      </div>

      {/* Stats */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: 16, marginBottom: 24 }}>
        {/* DMs this month */}
        <div style={{ background: 'var(--canvas)', borderRadius: 'var(--radius-md)', border: '1px solid var(--hairline)', padding: 24 }}>
          <p style={{ fontSize: 12, fontWeight: 600, color: 'var(--ash)', marginBottom: 10, textTransform: 'uppercase', letterSpacing: 0.5 }}>DMs this month</p>
          <p style={{ fontSize: 32, fontWeight: 800, color: 'var(--ink)', lineHeight: 1 }}>
            {used}<span style={{ fontSize: 16, color: 'var(--stone)', fontWeight: 400 }}> / {limit}</span>
          </p>
          <div style={{ height: 6, background: 'var(--card)', borderRadius: 'var(--radius-full)', marginTop: 14, overflow: 'hidden' }}>
            <div style={{ height: '100%', width: `${pct}%`, background: pct > 80 ? 'var(--red)' : 'var(--ink)', borderRadius: 'var(--radius-full)', transition: 'width 0.5s' }} />
          </div>
          <p style={{ fontSize: 11, color: 'var(--ash)', marginTop: 6 }}>{pct}% of plan used</p>
        </div>

        <div style={{ background: 'var(--canvas)', borderRadius: 'var(--radius-md)', border: '1px solid var(--hairline)', padding: 24 }}>
          <p style={{ fontSize: 12, fontWeight: 600, color: 'var(--ash)', marginBottom: 10, textTransform: 'uppercase', letterSpacing: 0.5 }}>DMs today</p>
          <p style={{ fontSize: 32, fontWeight: 800, color: 'var(--ink)', lineHeight: 1 }}>{dmsToday}</p>
          <p style={{ fontSize: 12, color: 'var(--ash)', marginTop: 14 }}>since midnight</p>
        </div>

        <div style={{ background: 'var(--canvas)', borderRadius: 'var(--radius-md)', border: '1px solid var(--hairline)', padding: 24 }}>
          <p style={{ fontSize: 12, fontWeight: 600, color: 'var(--ash)', marginBottom: 10, textTransform: 'uppercase', letterSpacing: 0.5 }}>Active automations</p>
          <p style={{ fontSize: 32, fontWeight: 800, color: 'var(--ink)', lineHeight: 1 }}>{activeAutomations}</p>
          <p style={{ fontSize: 12, color: 'var(--ash)', marginTop: 14 }}>running right now</p>
        </div>
      </div>

      {/* Chart */}
      <div style={{ background: 'var(--canvas)', borderRadius: 'var(--radius-md)', border: '1px solid var(--hairline)', padding: 28 }}>
        <p style={{ fontSize: 14, fontWeight: 700, color: 'var(--ink)', marginBottom: 20 }}>DMs sent this week</p>
        {weeklyData.every(d => d.count === 0) ? (
          <div style={{ height: 180, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center' }}>
            <p style={{ color: 'var(--ash)', fontSize: 14 }}>No DMs sent this week yet</p>
            <Link href="/dashboard/automations/new" style={{ color: 'var(--red)', fontSize: 13, fontWeight: 600, marginTop: 8, textDecoration: 'none' }}>Create your first automation →</Link>
          </div>
        ) : (
          <ResponsiveContainer width="100%" height={180}>
            <BarChart data={weeklyData} margin={{ top: 0, right: 0, left: -20, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="var(--hairline)" />
              <XAxis dataKey="day" tick={{ fontSize: 11, fill: 'var(--ash)' }} axisLine={false} tickLine={false} />
              <YAxis tick={{ fontSize: 11, fill: 'var(--ash)' }} axisLine={false} tickLine={false} allowDecimals={false} />
              <Tooltip contentStyle={{ border: '1px solid var(--hairline)', borderRadius: 12, fontSize: 12 }} formatter={(v) => [`${v} DMs`, 'Sent']} />
              <Bar dataKey="count" fill="var(--ink)" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        )}
      </div>

      {/* Plan bar */}
      {subscription && (
        <div style={{ marginTop: 16, padding: '16px 20px', background: 'var(--canvas)', borderRadius: 'var(--radius-md)', border: '1px solid var(--hairline)', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <div>
            <p style={{ fontSize: 13, fontWeight: 700, color: 'var(--ink)', textTransform: 'capitalize' }}>{subscription.plan_name} plan</p>
            <p style={{ fontSize: 11, color: 'var(--ash)', marginTop: 2 }}>
              {subscription.renews_at ? `Renews ${new Date(subscription.renews_at).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' })}` : 'Free trial'}
            </p>
          </div>
          <Link href="/dashboard/billing" className="btn-secondary" style={{ padding: '8px 16px', fontSize: 13 }}>Upgrade plan</Link>
        </div>
      )}
    </div>
  )
}