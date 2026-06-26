'use client'
import { useEffect, useState } from 'react'
import { useRouter, usePathname } from 'next/navigation'
import Link from 'next/link'
import { supabase } from '@/lib/supabase'

const nav = [
  { label: 'Dashboard', href: '/dashboard', icon: '▦' },
  { label: 'Automations', href: '/dashboard/automations', icon: '⚡' },
  { label: 'DM Logs', href: '/dashboard/logs', icon: '📋' },
  { label: 'Settings', href: '/dashboard/settings', icon: '⚙️' },
  { label: 'Billing', href: '/dashboard/billing', icon: '💳' },
  { label: 'App Review', href: '/dashboard/review-checklist', icon: '✅' },
]

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  const router = useRouter()
  const pathname = usePathname()
  const [email, setEmail] = useState('')
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (!session) { router.push('/login'); return }
      setEmail(session.user.email ?? '')
      setLoading(false)
    })
  }, [router])

  if (loading) return (
    <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'var(--surface)' }}>
      <p style={{ color: 'var(--ash)', fontSize: 14 }}>Loading...</p>
    </div>
  )

  return (
    <div style={{ display: 'flex', minHeight: '100vh', background: 'var(--surface)' }}>
      {/* Sidebar */}
      <aside style={{ width: 220, background: 'var(--canvas)', borderRight: '1px solid var(--hairline)', position: 'fixed', height: '100%', display: 'flex', flexDirection: 'column' }}>
        <div style={{ padding: '20px 20px 16px', borderBottom: '1px solid var(--hairline)' }}>
          <Link href="/" style={{ fontSize: 20, fontWeight: 800, color: 'var(--red)', textDecoration: 'none', display: 'block' }}>AutoMes</Link>
          <p style={{ fontSize: 11, color: 'var(--ash)', marginTop: 4, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{email}</p>
        </div>

        <nav style={{ flex: 1, padding: '12px 10px', display: 'flex', flexDirection: 'column', gap: 2 }}>
          {nav.map(item => {
            const active = pathname === item.href
            return (
              <Link key={item.href} href={item.href} style={{
                display: 'flex', alignItems: 'center', gap: 10, padding: '10px 12px',
                borderRadius: 'var(--radius-md)', fontSize: 13, fontWeight: active ? 700 : 500,
                color: active ? 'var(--ink)' : 'var(--mute)',
                background: active ? 'var(--card)' : 'transparent',
                textDecoration: 'none', transition: 'all 0.15s',
              }}
                onMouseEnter={e => { if (!active) e.currentTarget.style.background = 'var(--surface)' }}
                onMouseLeave={e => { if (!active) e.currentTarget.style.background = 'transparent' }}>
                <span>{item.icon}</span>
                {item.label}
                {active && <span style={{ marginLeft: 'auto', width: 4, height: 4, borderRadius: '50%', background: 'var(--red)' }} />}
              </Link>
            )
          })}
        </nav>

        <div style={{ padding: '12px 10px', borderTop: '1px solid var(--hairline)' }}>
          <button onClick={async () => { await supabase.auth.signOut(); router.push('/login') }}
            style={{ width: '100%', padding: '10px 12px', borderRadius: 'var(--radius-md)', background: 'none', border: 'none', cursor: 'pointer', fontSize: 13, color: 'var(--mute)', textAlign: 'left', fontWeight: 500 }}>
            Sign out
          </button>
        </div>
      </aside>

      <main style={{ marginLeft: 220, flex: 1, padding: 32 }}>
        {children}
      </main>
    </div>
  )
}