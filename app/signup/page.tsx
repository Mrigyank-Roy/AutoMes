'use client'
import { useState } from 'react'
import { supabase } from '@/lib/supabase'
import Link from 'next/link'

export default function SignupPage() {
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  async function signInWithGoogle() {
    setLoading(true); setError('')
    const { error } = await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: { redirectTo: `${window.location.origin}/auth/callback` },
    })
    if (error) { setError(error.message); setLoading(false) }
  }

  return (
    <div style={ { minHeight: '100vh', background: 'var(--surface)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 24 } }>
      <div style={ { width: '100%', maxWidth: 420 } }>
        <div style={ { textAlign: 'center', marginBottom: 40 } }>
          <Link href="/" style={ { fontSize: 28, fontWeight: 800, color: 'var(--red)', textDecoration: 'none' } }>AutoMes</Link>
          <p style={ { fontSize: 14, color: 'var(--mute)', marginTop: 8 } }>Create your account — free trial included</p>
        </div>
        <div style={ { background: 'var(--canvas)', borderRadius: 'var(--radius-lg)', border: '1px solid var(--hairline)', padding: 36 } }>
          {error && (
            <div style={ { background: '#fff0f0', border: '1px solid #ffd0d0', borderRadius: 'var(--radius-md)', padding: '12px 16px', marginBottom: 20, fontSize: 13, color: 'var(--red)', fontWeight: 500 } }>
              {error}
            </div>
          )}
          <button onClick={signInWithGoogle} disabled={loading}
            style={ { width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 12, padding: '13px', fontSize: 15, fontWeight: 700, color: 'var(--ink)', background: '#fff', border: '1px solid var(--hairline)', borderRadius: 'var(--radius-md)', cursor: loading ? 'not-allowed' : 'pointer', opacity: loading ? 0.7 : 1 } }>
            <GoogleIcon />
            {loading ? 'Redirecting…' : 'Sign up with Google'}
          </button>
          <p style={ { textAlign: 'center', fontSize: 11, color: 'var(--ash)', marginTop: 20, lineHeight: 1.6 } }>
            By signing up you agree to our{' '}
            <Link href="/terms" style={ { color: 'var(--mute)' } }>Terms</Link> and{' '}
            <Link href="/privacy" style={ { color: 'var(--mute)' } }>Privacy Policy</Link>
          </p>
        </div>
      </div>
    </div>
  )
}

function GoogleIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 18 18" aria-hidden="true">
      <path fill="#4285F4" d="M17.64 9.2c0-.64-.06-1.25-.16-1.84H9v3.48h4.84a4.14 4.14 0 0 1-1.8 2.72v2.26h2.92c1.71-1.57 2.68-3.89 2.68-6.62z" />
      <path fill="#34A853" d="M9 18c2.43 0 4.47-.8 5.96-2.18l-2.92-2.26c-.8.54-1.84.86-3.04.86-2.34 0-4.32-1.58-5.03-3.7H.96v2.33A9 9 0 0 0 9 18z" />
      <path fill="#FBBC05" d="M3.97 10.72a5.4 5.4 0 0 1 0-3.44V4.95H.96a9 9 0 0 0 0 8.1l3.01-2.33z" />
      <path fill="#EA4335" d="M9 3.58c1.32 0 2.5.45 3.44 1.35l2.58-2.58C13.46.89 11.43 0 9 0A9 9 0 0 0 .96 4.95l3.01 2.33C4.68 5.16 6.66 3.58 9 3.58z" />
    </svg>
  )
}