'use client'
import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase'
import { useRouter } from 'next/navigation'

export default function SettingsPage() {
  const router = useRouter()
  const [email, setEmail] = useState('')
  const [igAccounts, setIgAccounts] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [disconnecting, setDisconnecting] = useState<string | null>(null)
  const [message, setMessage] = useState('')

  useEffect(() => { loadData() }, [])

  async function loadData() {
    const { data: { session } } = await supabase.auth.getSession()
    if (!session) { router.push('/login'); return }
    setEmail(session.user.email ?? '')
    const { data } = await supabase.from('instagram_accounts').select('*').eq('user_id', session.user.id)
    setIgAccounts(data ?? [])
    setLoading(false)
  }

  async function disconnect(id: string, username: string) {
    if (!confirm(`Disconnect @${username}? All automations for this account will be deleted.`)) return
    setDisconnecting(id)
    await supabase.from('instagram_accounts').delete().eq('id', id)
    setIgAccounts(prev => prev.filter(a => a.id !== id))
    setMessage(`@${username} disconnected successfully`)
    setDisconnecting(null)
  }

  function connectInstagram() {
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (session?.user?.id) window.location.href = `/api/auth/instagram?uid=${session.user.id}`
    })
  }

  if (loading) return <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: 300 }}><p style={{ color: 'var(--ash)', fontSize: 14 }}>Loading...</p></div>

  const Section = ({ title, children }: { title: string, children: React.ReactNode }) => (
    <div style={{ background: 'var(--canvas)', borderRadius: 'var(--radius-md)', border: '1px solid var(--hairline)', overflow: 'hidden', marginBottom: 16 }}>
      <div style={{ padding: '16px 24px', borderBottom: '1px solid var(--hairline)', background: 'var(--surface)' }}>
        <p style={{ fontSize: 13, fontWeight: 700, color: 'var(--ink)' }}>{title}</p>
      </div>
      <div style={{ padding: 24 }}>{children}</div>
    </div>
  )

  return (
    <div style={{ maxWidth: 640 }}>
      <div style={{ marginBottom: 32 }}>
        <h1 style={{ fontSize: 28, fontWeight: 800, color: 'var(--ink)', letterSpacing: -0.5 }}>Settings</h1>
        <p style={{ fontSize: 14, color: 'var(--mute)', marginTop: 4 }}>Manage your account and connections</p>
      </div>

      {message && (
        <div style={{ background: '#e8f8ed', border: '1px solid #a3d9b8', borderRadius: 'var(--radius-md)', padding: '12px 16px', marginBottom: 16, fontSize: 13, color: '#1a6b3a', fontWeight: 600 }}>
          ✓ {message}
        </div>
      )}

      <Section title="Account">
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <div>
            <p style={{ fontSize: 15, fontWeight: 700, color: 'var(--ink)' }}>{email}</p>
            <p style={{ fontSize: 12, color: 'var(--ash)', marginTop: 2 }}>Your login email</p>
          </div>
        </div>
      </Section>

      <Section title="Connected Instagram accounts">
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: igAccounts.length > 0 ? 20 : 0 }}>
          <p style={{ fontSize: 13, color: 'var(--mute)' }}>
            {igAccounts.length} account{igAccounts.length !== 1 ? 's' : ''} connected
          </p>
          <button onClick={connectInstagram} className="btn-primary" style={{ padding: '8px 16px', fontSize: 13 }}>+ Connect account</button>
        </div>

        {igAccounts.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '32px 0' }}>
            <p style={{ fontSize: 14, color: 'var(--mute)', marginBottom: 16 }}>No accounts connected yet</p>
            <button onClick={connectInstagram} className="btn-secondary" style={{ padding: '10px 20px', fontSize: 13 }}>Connect Instagram Business account</button>
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            {igAccounts.map(account => (
              <div key={account.id} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '14px 18px', background: 'var(--surface)', borderRadius: 'var(--radius-md)', border: '1px solid var(--hairline)' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                  <div style={{ width: 40, height: 40, borderRadius: '50%', background: 'var(--secondary-bg)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 16, fontWeight: 700, color: 'var(--mute)' }}>@</div>
                  <div>
                    <p style={{ fontSize: 14, fontWeight: 700, color: 'var(--ink)' }}>@{account.ig_username}</p>
                    <p style={{ fontSize: 11, color: 'var(--ash)', marginTop: 1 }}>
                      Connected {new Date(account.created_at).toLocaleDateString()} · Token expires {new Date(account.token_expires_at).toLocaleDateString()}
                    </p>
                  </div>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                  <span style={{ background: '#e8f8ed', color: '#1a6b3a', borderRadius: 'var(--radius-full)', padding: '3px 10px', fontSize: 11, fontWeight: 700 }}>Active</span>
                  <button onClick={() => disconnect(account.id, account.ig_username)} disabled={disconnecting === account.id}
                    style={{ background: 'none', border: 'none', cursor: 'pointer', fontSize: 13, fontWeight: 600, color: 'var(--ash)', padding: '6px 10px', borderRadius: 'var(--radius-sm)', transition: 'all 0.15s' }}
                    onMouseEnter={e => { e.currentTarget.style.background = '#fff0f0'; e.currentTarget.style.color = 'var(--red)' }}
                    onMouseLeave={e => { e.currentTarget.style.background = 'none'; e.currentTarget.style.color = 'var(--ash)' }}>
                    {disconnecting === account.id ? 'Disconnecting...' : 'Disconnect'}
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </Section>

      {/* Danger zone */}
      <div style={{ background: 'var(--canvas)', borderRadius: 'var(--radius-md)', border: '1px solid #ffd0d0', overflow: 'hidden' }}>
        <div style={{ padding: '16px 24px', borderBottom: '1px solid #ffd0d0', background: '#fff8f8' }}>
          <p style={{ fontSize: 13, fontWeight: 700, color: 'var(--red)' }}>Danger zone</p>
        </div>
        <div style={{ padding: 24, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <div>
            <p style={{ fontSize: 14, fontWeight: 600, color: 'var(--ink)' }}>Delete account</p>
            <p style={{ fontSize: 12, color: 'var(--mute)', marginTop: 2 }}>Permanently delete your account and all data</p>
          </div>
          <button onClick={() => alert('Please contact support to delete your account')}
            style={{ background: 'none', border: '1px solid #ffd0d0', borderRadius: 'var(--radius-md)', padding: '8px 16px', fontSize: 13, fontWeight: 600, color: 'var(--red)', cursor: 'pointer' }}>
            Delete account
          </button>
        </div>
      </div>
    </div>
  )
}