'use client'
import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase'
import { useRouter } from 'next/navigation'
import Link from 'next/link'

type AccountCfg = {
  ig_account_id: string
  ig_username: string
  settings: {
    step1_text: string
    step1_button: string
    step2_text: string
    step2_follow_button: string
  }
}

export default function AutomationConfigPage() {
  const router = useRouter()
  const [userId, setUserId] = useState('')
  const [allowed, setAllowed] = useState(false)
  const [accounts, setAccounts] = useState<AccountCfg[]>([])
  const [loading, setLoading] = useState(true)
  const [savingId, setSavingId] = useState('')
  const [savedId, setSavedId] = useState('')
  const [error, setError] = useState('')

  useEffect(() => {
    async function load() {
      const { data: { session } } = await supabase.auth.getSession()
      if (!session) { router.push('/login'); return }
      setUserId(session.user.id)
      const res = await fetch(`/api/follow-gate?userId=${session.user.id}`)
      const data = await res.json()
      setAllowed(!!data.allowed)
      setAccounts(data.accounts ?? [])
      setLoading(false)
    }
    load()
  }, [router])

  function updateField(accId: string, field: keyof AccountCfg['settings'], value: string) {
    setAccounts(prev => prev.map(a =>
      a.ig_account_id === accId ? { ...a, settings: { ...a.settings, [field]: value } } : a
    ))
    setSavedId('')
  }

  async function save(acc: AccountCfg) {
    setError(''); setSavedId(''); setSavingId(acc.ig_account_id)
    const res = await fetch('/api/follow-gate', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ userId, igAccountId: acc.ig_account_id, ...acc.settings }),
    })
    const data = await res.json()
    setSavingId('')
    if (!res.ok) { setError(data.error ?? 'Could not save'); return }
    setSavedId(acc.ig_account_id)
    setTimeout(() => setSavedId(''), 2500)
  }

  if (loading) return (
    <div style={ { display: 'flex', alignItems: 'center', justifyContent: 'center', height: 300 } }>
      <p style={ { color: 'var(--ash)', fontSize: 14 } }>Loading...</p>
    </div>
  )

  return (
    <div style={ { maxWidth: 640 } }>
      <div style={ { marginBottom: 32 } }>
        <h1 style={ { fontSize: 24, fontWeight: 800, color: 'var(--ink)', letterSpacing: -0.5 } }>Automation Config</h1>
        <p style={ { fontSize: 13, color: 'var(--mute)', marginTop: 2 } }>
          Set the follow-gate messages used by your "Followers only" automations. Set once per Instagram account.
        </p>
      </div>

      {!allowed ? (
        <div style={ { background: 'var(--canvas)', borderRadius: 'var(--radius-lg)', border: '1px solid var(--hairline)', padding: 48, textAlign: 'center' } }>
          <div style={ { fontSize: 40, marginBottom: 12 } }>🔒</div>
          <p style={ { fontSize: 16, fontWeight: 700, color: 'var(--ink)', marginBottom: 6 } }>Available on Pro & Agency</p>
          <p style={ { fontSize: 13, color: 'var(--mute)', marginBottom: 24 } }>
            The follow-gate lets you DM only people who follow you. Upgrade to unlock it.
          </p>
          <Link href="/dashboard/billing" className="btn-primary">Upgrade plan</Link>
        </div>
      ) : accounts.length === 0 ? (
        <div style={ { background: 'var(--canvas)', borderRadius: 'var(--radius-lg)', border: '1px solid var(--hairline)', padding: 48, textAlign: 'center' } }>
          <div style={ { fontSize: 40, marginBottom: 12 } }>📱</div>
          <p style={ { fontSize: 16, fontWeight: 700, color: 'var(--ink)', marginBottom: 6 } }>No Instagram account connected</p>
          <Link href="/dashboard/settings" className="btn-primary" style={ { marginTop: 8 } }>Connect Instagram</Link>
        </div>
      ) : (
        <div style={ { display: 'flex', flexDirection: 'column', gap: 16 } }>
          <div style={ { background: '#f5f7ff', border: '1px solid #dde3ff', borderRadius: 'var(--radius-md)', padding: '14px 16px', fontSize: 12.5, color: 'var(--body)', lineHeight: 1.6 } }>
            <strong>How it works:</strong> Step 1 is sent when someone comments. If they don't follow you, they get Step 2 with a "Visit Profile" button (links to your profile automatically) + your follow-confirm button. Once they follow, they get the automation's DM. 💡 The reward DM itself is set on each automation.
          </div>

          {accounts.map(acc => (
            <div key={acc.ig_account_id} style={ { background: 'var(--canvas)', borderRadius: 'var(--radius-md)', border: '1px solid var(--hairline)', padding: 24 } }>
              <div style={ { display: 'flex', alignItems: 'center', gap: 10, marginBottom: 20 } }>
                <div style={ { width: 32, height: 32, borderRadius: '50%', background: 'var(--secondary-bg)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 14 } }>@</div>
                <span style={ { fontSize: 15, fontWeight: 700, color: 'var(--ink)' } }>@{acc.ig_username}</span>
              </div>

              {/* Step 1 */}
              <label style={ { fontSize: 13, fontWeight: 700, color: 'var(--ink)', display: 'block', marginBottom: 8 } }>Step 1 — first message</label>
              <textarea value={acc.settings.step1_text} onChange={e => updateField(acc.ig_account_id, 'step1_text', e.target.value)} rows={3} maxLength={900} placeholder="Thanks for stopping by! Tap below 👇" style={ { resize: 'none', width: '100%' } } />
              <label style={ { fontSize: 12, fontWeight: 600, color: 'var(--mute)', display: 'block', margin: '12px 0 6px' } }>Step 1 button label</label>
              <input type="text" value={acc.settings.step1_button} onChange={e => updateField(acc.ig_account_id, 'step1_button', e.target.value)} maxLength={20} placeholder="Send me the access" />

              <div style={ { height: 1, background: 'var(--hairline)', margin: '20px 0' } } />

              {/* Step 2 */}
              <label style={ { fontSize: 13, fontWeight: 700, color: 'var(--ink)', display: 'block', marginBottom: 8 } }>Step 2 — shown if they don't follow yet</label>
              <textarea value={acc.settings.step2_text} onChange={e => updateField(acc.ig_account_id, 'step2_text', e.target.value)} rows={3} maxLength={900} placeholder="Looks like you're not following yet 😊 Follow me, then tap below 👇" style={ { resize: 'none', width: '100%' } } />
              <label style={ { fontSize: 12, fontWeight: 600, color: 'var(--mute)', display: 'block', margin: '12px 0 6px' } }>Step 2 follow-confirm button label</label>
              <input type="text" value={acc.settings.step2_follow_button} onChange={e => updateField(acc.ig_account_id, 'step2_follow_button', e.target.value)} maxLength={20} placeholder="I'm following ✅" />
              <p style={ { fontSize: 11, color: 'var(--ash)', marginTop: 8 } }>The "Visit Profile" button is added automatically and links to @{acc.ig_username}. Button labels max 20 characters.</p>

              <div style={ { display: 'flex', alignItems: 'center', gap: 12, marginTop: 20 } }>
                <button onClick={() => save(acc)} disabled={savingId === acc.ig_account_id} className="btn-primary" style={ { padding: '10px 20px', fontSize: 14, opacity: savingId === acc.ig_account_id ? 0.7 : 1 } }>
                  {savingId === acc.ig_account_id ? 'Saving...' : 'Save'}
                </button>
                {savedId === acc.ig_account_id && <span style={ { fontSize: 13, color: '#1a6b3a', fontWeight: 600 } }>✓ Saved</span>}
              </div>
            </div>
          ))}

          {error && (
            <div style={ { background: '#fff0f0', border: '1px solid #ffd0d0', borderRadius: 'var(--radius-md)', padding: '12px 16px', fontSize: 13, color: 'var(--red)', fontWeight: 500 } }>{error}</div>
          )}
        </div>
      )}
    </div>
  )
}