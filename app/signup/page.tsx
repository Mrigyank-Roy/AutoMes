'use client'

import { useState } from 'react'
import { supabase } from '@/lib/supabase'
import { Button } from '@/components/ui/button'
import Link from 'next/link'
import { useRouter } from 'next/navigation'

export default function SignupPage() {
  const router = useRouter()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [fullName, setFullName] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  async function handleSignup() {
    setLoading(true)
    setError('')

    const { error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: { full_name: fullName }
      }
    })

    if (error) {
      setError(error.message)
      setLoading(false)
      return
    }

    router.push('/dashboard')
  }

  return (
    <main className="flex min-h-screen items-center justify-center bg-gray-50">
      <div className="w-full max-w-md bg-white rounded-xl shadow-sm border p-8">
        <h1 className="text-2xl font-semibold mb-1">Create your account</h1>
        <p className="text-sm text-gray-500 mb-6">Start your 14-day free trial</p>

        {error && (
          <div className="bg-red-50 text-red-600 text-sm px-4 py-3 rounded-lg mb-4">
            {error}
          </div>
        )}

        <div className="flex flex-col gap-4">
          <div>
            <label className="text-sm font-medium text-gray-700 block mb-1">Full name</label>
            <input
              type="text"
              value={fullName}
              onChange={e => setFullName(e.target.value)}
              placeholder="Rahul Sharma"
              className="w-full border rounded-lg px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-black"
            />
          </div>
          <div>
            <label className="text-sm font-medium text-gray-700 block mb-1">Email</label>
            <input
              type="email"
              value={email}
              onChange={e => setEmail(e.target.value)}
              placeholder="rahul@gmail.com"
              className="w-full border rounded-lg px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-black"
            />
          </div>
          <div>
            <label className="text-sm font-medium text-gray-700 block mb-1">Password</label>
            <input
              type="password"
              value={password}
              onChange={e => setPassword(e.target.value)}
              placeholder="Min 6 characters"
              className="w-full border rounded-lg px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-black"
            />
          </div>

          <Button onClick={handleSignup} disabled={loading} className="w-full">
            {loading ? 'Creating account...' : 'Create account'}
          </Button>
        </div>

        <p className="text-sm text-gray-500 text-center mt-4">
          Already have an account?{' '}
          <Link href="/login" className="text-black font-medium hover:underline">
            Log in
          </Link>
        </p>
      </div>
    </main>
  )
}