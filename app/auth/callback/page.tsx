'use client'
import { useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabase'

export default function AuthCallbackPage() {
  const router = useRouter()

  useEffect(() => {
    let done = false

    async function route(session: any) {
      if (done || !session) return
      done = true
      const { data: profile } = await supabase
        .from('users').select('onboarded').eq('id', session.user.id).single()
      router.replace(profile?.onboarded ? '/dashboard' : '/onboarding')
    }

    // supabase-js auto-detects the session from the URL (hash or ?code=)
    const { data: sub } = supabase.auth.onAuthStateChange((_e, session) => route(session))
    supabase.auth.getSession().then(({ data: { session } }) => route(session))

    const timeout = setTimeout(() => {
      if (!done) router.replace('/login?error=oauth_failed')
    }, 8000)

    return () => { sub.subscription.unsubscribe(); clearTimeout(timeout) }
  }, [router])

  return (
    <div style={ { minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'var(--surface)' } }>
      <p style={ { color: 'var(--ash)', fontSize: 14 } }>Signing you in…</p>
    </div>
  )
}