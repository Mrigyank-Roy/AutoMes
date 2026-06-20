'use client'

import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase'
import { useRouter, useSearchParams } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Suspense } from 'react'

function DashboardContent() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const [email, setEmail] = useState('')
  const [igAccounts, setIgAccounts] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [message, setMessage] = useState('')

  useEffect(() => {
    // Check for success or error messages from OAuth
    const success = searchParams.get('success')
    const error = searchParams.get('error')
    
    if (success === 'instagram_connected') {
      setMessage('✅ Instagram account connected successfully!')
    } else if (error) {
      setMessage(`❌ Error: ${error.replace(/_/g, ' ')}`)
    }
  }, [searchParams])

  useEffect(() => {
    async function loadData() {
      const { data: { session } } = await supabase.auth.getSession()
      
      if (!session) {
        router.push('/login')
        return
      }

      setEmail(session.user.email ?? '')

      // Load connected Instagram accounts
      const { data: accounts } = await supabase
        .from('instagram_accounts')
        .select('*')

      setIgAccounts(accounts ?? [])
      setLoading(false)
    }

    loadData()
  }, [router, message])

  async function handleLogout() {
    await supabase.auth.signOut()
    router.push('/login')
  }

  function handleConnectInstagram() {
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (session?.user?.id) {
        window.location.href = `/api/auth/instagram?uid=${session.user.id}`
      }
    })
  }

  if (loading) {
    return (
      <main className="flex min-h-screen items-center justify-center">
        <p className="text-gray-400 text-sm">Loading...</p>
      </main>
    )
  }

  return (
    <main className="max-w-2xl mx-auto px-4 py-12">
      <div className="flex justify-between items-center mb-8">
        <div>
          <h1 className="text-2xl font-semibold">Dashboard</h1>
          <p className="text-sm text-gray-500 mt-1">{email}</p>
        </div>
        <Button variant="outline" onClick={handleLogout}>Log out</Button>
      </div>

      {message && (
        <div className={`text-sm px-4 py-3 rounded-lg mb-6 ${
          message.startsWith('✅') 
            ? 'bg-green-50 text-green-700' 
            : 'bg-red-50 text-red-600'
        }`}>
          {message}
        </div>
      )}

      {/* Connected Instagram Accounts */}
      <div className="border rounded-xl p-6 mb-6">
        <div className="flex justify-between items-center mb-4">
          <h2 className="font-medium">Connected Instagram Accounts</h2>
          <Button onClick={handleConnectInstagram} size="sm">
            + Connect Instagram
          </Button>
        </div>

        {igAccounts.length === 0 ? (
          <div className="text-center py-8">
            <p className="text-gray-400 text-sm mb-3">No accounts connected yet</p>
            <Button onClick={handleConnectInstagram} variant="outline" size="sm">
              Connect your Instagram Business account
            </Button>
          </div>
        ) : (
          <div className="flex flex-col gap-3">
            {igAccounts.map((account) => (
              <div 
                key={account.id} 
                className="flex items-center justify-between p-3 bg-gray-50 rounded-lg"
              >
                <div>
                  <p className="font-medium text-sm">@{account.ig_username}</p>
                  <p className="text-xs text-gray-400">
                    Connected {new Date(account.created_at).toLocaleDateString()}
                  </p>
                </div>
                <span className="text-xs bg-green-100 text-green-700 px-2 py-1 rounded-full">
                  Active
                </span>
              </div>
            ))}
          </div>
        )}
      </div>
    </main>
  )
}

export default function DashboardPage() {
  return (
    <Suspense fallback={<div className="flex min-h-screen items-center justify-center">
      <p className="text-gray-400 text-sm">Loading...</p>
    </div>}>
      <DashboardContent />
    </Suspense>
  )
}