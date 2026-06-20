'use client'

import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'

export default function DashboardPage() {
  const router = useRouter()
  const [email, setEmail] = useState('')

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (!session) {
        router.push('/login')
        return
      }
      setEmail(session.user.email ?? '')
    })
  }, [router])

  async function handleLogout() {
    await supabase.auth.signOut()
    router.push('/login')
  }

  return (
    <main className="flex min-h-screen flex-col items-center justify-center gap-4">
      <h1 className="text-2xl font-semibold">Dashboard</h1>
      <p className="text-gray-500 text-sm">Logged in as: {email}</p>
      <Button variant="outline" onClick={handleLogout}>Log out</Button>
    </main>
  )
}