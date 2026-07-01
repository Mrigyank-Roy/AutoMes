'use client'
import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase'
import { useRouter, useSearchParams } from 'next/navigation'

export default function OnboardingPage() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const [userId, setUserId] = useState('')
  const [fullName, setFullName] = useState('')
  const [igConnected, setIgConnected] = useState(false)
  const [igUsername, setIgUsername] = useState('')
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')

  const justConnected = searchParams.get('success') === 'instagram_connected'

  useEffect(() => {
    async function load() {
      const { data: { session } } = await supabase.auth.getSession()
      if (!session) { router.replace('/login'); return }
      setUserId(session.user.id)

      const { data: profile } = await supabase
        .from('users').select('full_name, onboarded').eq('id', session.user.id).single()
      if (profile?.onboarded) { router.replace('/dashboard'); return }
      setFullName(profile?.full_name ?? (session.user.user_metadata?.full_name ?? ''))

      const { data: accounts } = await supabase
        .from('instagram_accounts').select('ig_username').eq('user_id', session.user.id)
      if (accounts && accounts.length > 0) {
        setIgConnected(true)
        setIgUsername(accounts[0].ig_username)
      }
      setLoading(false)
    }
    load()
  }, [router])

  async function persistName() {
    await supabase.from('users').update({ full_name: fullName.trim() }).eq('id', userId)
  }

  async function connectInstagram() {
    if (!fullName.trim()) { setError('Please enter your name first'); return }
    setSaving(true); setError('')
    await persistName()
    window.location.href = `/api/auth/instagram?uid=${userId}&from=onboarding`
  }

  async function finish() {
    if (!fullName.trim()) { setError('Please enter your name first'); return }
    setSaving(true); setError('')
    const { error: uErr } = await supabase
      .from('users').update({ full_name: fullName.trim(), onboarded: true }).eq('id', userId)
    if (uErr) { setError(uErr.message); setSaving(false); return }
    router.replace('/dashboard')
  }

  if (loading) return (
    <div style={ { minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'var(--surface)' } }>
      <p style={ { color: 'var(--ash)', fontSize: 14 } }>Loading…</p>
    </div>
  )

  return (
    <div style={ { minHeight: '100vh', background: 'var(--surface)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 24 } }>
      <div style={ { width: '100%', maxWidth: 480 } }>
        <div style={ { textAlign: 'center', marginBottom: 32 } }>
          <p style={ { fontSize: 28, fontWeight: 800, color: 'var(--red)' } }>AutoMes</p>
          <h1 style={ { fontSize: 22, fontWeight: 800, color: 'var(--ink)', marginTop: 12 } }>Welcome! Let's set you up</h1>
          <p style={ { fontSize: 14, color: 'var(--mute)', marginTop: 6 } }>Takes less than a minute.</p>
        </div>

        <div style={ { background: 'var(--canvas)', borderRadius: 'var(--radius-lg)', border: '1px solid var(--hairline)', padding: 32 } }>
          {error && (
            <div style={ { background: '#fff0f0', border: '1px solid #ffd0d0', borderRadius: 'var(--radius-md)', padding: '12px 16px', marginBottom: 20, fontSize: 13, color: 'var(--red)', fontWeight: 500 } }>
              {error}
            </div>
          )}

          {/* Step 1 — Name */}
          <div style={ { marginBottom: 28 } }>
            <label style={ { fontSize: 13, fontWeight: 700, color: 'var(--ink)', display: 'block', marginBottom: 8 } }>Your name</label>
            <input type="text" value={fullName} onChange={e => setFullName(e.target.value)} placeholder="Rahul Sharma" maxLength={60} style={ { width: '100%' } } />
            <p style={ { fontSize: 11, color: 'var(--ash)', marginTop: 6 } }>This is how you'll be shown in the app.</p>
          </div>

          {/* Step 2 — Instagram */}
          <div style={ { marginBottom: 28, paddingTop: 24, borderTop: '1px solid var(--hairline)' } }>
            <label style={ { fontSize: 13, fontWeight: 700, color: 'var(--ink)', display: 'block', marginBottom: 8 } }>Connect Instagram</label>
            {(igConnected || justConnected) ? (
              <div style={ { display: 'flex', alignItems: 'center', gap: 8, padding: '12px 16px', background: '#e8f8ed', border: '1px solid #a3d9b8', borderRadius: 'var(--radius-md)', fontSize: 13, color: '#1a6b3a', fontWeight: 600 } }>
                ✓ Connected{igUsername ? ` — @${igUsername}` : ''}
              </div>
            ) : (
              <>
                <p style={ { fontSize: 12, color: 'var(--mute)', marginBottom: 12 } }>Link your Instagram Business/Creator account to start automating. You can also do this later from Settings.</p>
                <button onClick={connectInstagram} disabled={saving}
                  style={ { width: '100%', padding: '12px', fontSize: 14, fontWeight: 700, color: 'var(--ink)', background: 'var(--secondary-bg)', border: 'none', borderRadius: 'var(--radius-md)', cursor: saving ? 'not-allowed' : 'pointer' } }>
                  Connect Instagram account
                </button>
              </>
            )}
          </div>

          {/* Finish */}
          <button onClick={finish} disabled={saving} className="btn-primary"
            style={ { width: '100%', justifyContent: 'center', padding: '13px', fontSize: 15, borderRadius: 'var(--radius-md)', opacity: saving ? 0.7 : 1 } }>
            {saving ? 'Saving…' : (igConnected || justConnected) ? 'Go to dashboard →' : 'Continue to dashboard →'}
          </button>
          {!(igConnected || justConnected) && (
            <p style={ { textAlign: 'center', fontSize: 12, color: 'var(--ash)', marginTop: 12 } }>You can skip Instagram for now and connect it later.</p>
          )}

          <p style={ { textAlign: 'center', marginTop: 20 } }>
            <button onClick={async () => { await supabase.auth.signOut(); router.replace('/login') }}
              style={ { background: 'none', border: 'none', color: 'var(--mute)', fontSize: 12, cursor: 'pointer' } }>Sign out</button>
          </p>
        </div>
      </div>
    </div>
  )
}