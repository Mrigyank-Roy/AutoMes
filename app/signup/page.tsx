'use client'
import { useState } from 'react'
import { supabase } from '@/lib/supabase'
import Link from 'next/link'
import { useRouter } from 'next/navigation'

export default function SignupPage() {
  const router = useRouter()
  const [fullName, setFullName] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  async function handleSignup() {
    setLoading(true); setError('')
    const { error } = await supabase.auth.signUp({ email, password, options: { data: { full_name: fullName } } })
    if (error) { setError(error.message); setLoading(false); return }
    router.push('/dashboard')
  }

  return (
    <div style={{ minHeight: '100vh', background: 'var(--surface)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 24 }}>
      <div style={{ width: '100%', maxWidth: 420 }}>
        <div style={{ textAlign: 'center', marginBottom: 40 }}>
          <Link href="/" style={{ fontSize: 28, fontWeight: 800, color: 'var(--red)', textDecoration: 'none' }}>AutoMes</Link>
          <p style={{ fontSize: 14, color: 'var(--mute)', marginTop: 8 }}>Create your account — free trial included</p>
        </div>

        <div style={{ background: 'var(--canvas)', borderRadius: 'var(--radius-lg)', border: '1px solid var(--hairline)', padding: 36 }}>
          {error && (
            <div style={{ background: '#fff0f0', border: '1px solid #ffd0d0', borderRadius: 'var(--radius-md)', padding: '12px 16px', marginBottom: 20, fontSize: 13, color: 'var(--red)', fontWeight: 500 }}>
              {error}
            </div>
          )}

          <div style={{ marginBottom: 16 }}>
            <label>Full name</label>
            <input type="text" value={fullName} onChange={e => setFullName(e.target.value)} placeholder="Rahul Sharma" />
          </div>
          <div style={{ marginBottom: 16 }}>
            <label>Email</label>
            <input type="email" value={email} onChange={e => setEmail(e.target.value)} placeholder="rahul@gmail.com" />
          </div>
          <div style={{ marginBottom: 28 }}>
            <label>Password</label>
            <input type="password" value={password} onChange={e => setPassword(e.target.value)} placeholder="Min 6 characters" />
          </div>

          <button onClick={handleSignup} disabled={loading} className="btn-primary" style={{ width: '100%', justifyContent: 'center', padding: '13px', fontSize: 15, borderRadius: 'var(--radius-md)' }}>
            {loading ? 'Creating account...' : 'Create account →'}
          </button>

          <p style={{ textAlign: 'center', fontSize: 13, color: 'var(--mute)', marginTop: 20 }}>
            Already have an account?{' '}
            <Link href="/login" style={{ color: 'var(--red)', fontWeight: 700, textDecoration: 'none' }}>Log in</Link>
          </p>

          <p style={{ textAlign: 'center', fontSize: 11, color: 'var(--ash)', marginTop: 16, lineHeight: 1.6 }}>
            By signing up you agree to our{' '}
            <Link href="/terms" style={{ color: 'var(--mute)' }}>Terms</Link> and{' '}
            <Link href="/privacy" style={{ color: 'var(--mute)' }}>Privacy Policy</Link>
          </p>
        </div>
      </div>
    </div>
  )
}