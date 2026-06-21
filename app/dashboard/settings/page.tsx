'use client'

import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase'
import { useRouter } from 'next/navigation'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'

export default function SettingsPage() {
  const router = useRouter()
  const [email, setEmail] = useState('')
  const [igAccounts, setIgAccounts] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [disconnecting, setDisconnecting] = useState<string | null>(null)
  const [message, setMessage] = useState('')

  useEffect(() => {
    loadData()
  }, [])

  async function loadData() {
    const { data: { session } } = await supabase.auth.getSession()
    if (!session) { router.push('/login'); return }

    setEmail(session.user.email ?? '')

    const { data: accounts } = await supabase
      .from('instagram_accounts')
      .select('*')
      .eq('user_id', session.user.id)

    setIgAccounts(accounts ?? [])
    setLoading(false)
  }

  async function disconnectAccount(accountId: string, username: string) {
    if (!confirm(`Disconnect @${username}? All automations for this account will be deleted.`)) return

    setDisconnecting(accountId)

    await supabase
      .from('instagram_accounts')
      .delete()
      .eq('id', accountId)

    setIgAccounts(prev => prev.filter(a => a.id !== accountId))
    setMessage(`@${username} disconnected successfully`)
    setDisconnecting(null)
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
      <div className="flex items-center justify-center h-64">
        <p className="text-sm text-gray-400">Loading...</p>
      </div>
    )
  }

  return (
    <div className="max-w-2xl">
      <div className="mb-8">
        <h1 className="text-2xl font-semibold">Settings</h1>
        <p className="text-sm text-gray-500 mt-1">Manage your account and connections</p>
      </div>

      {message && (
        <div className="bg-green-50 text-green-700 text-sm px-4 py-3 rounded-lg mb-5">
          {message}
        </div>
      )}

      {/* Account info */}
      <Card className="mb-5">
        <CardHeader className="pb-3">
          <CardTitle className="text-sm font-medium">Account</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium">{email}</p>
              <p className="text-xs text-gray-400 mt-0.5">Your login email</p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Connected Instagram accounts */}
      <Card className="mb-5">
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <CardTitle className="text-sm font-medium">
              Connected Instagram accounts
            </CardTitle>
            <Button size="sm" onClick={handleConnectInstagram}>
              + Connect account
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          {igAccounts.length === 0 ? (
            <div className="text-center py-6">
              <p className="text-sm text-gray-400 mb-3">No accounts connected</p>
              <Button variant="outline" size="sm" onClick={handleConnectInstagram}>
                Connect Instagram Business account
              </Button>
            </div>
          ) : (
            <div className="flex flex-col gap-3">
              {igAccounts.map(account => (
                <div
                  key={account.id}
                  className="flex items-center justify-between p-3 bg-gray-50 rounded-lg"
                >
                  <div>
                    <p className="text-sm font-medium">@{account.ig_username}</p>
                    <p className="text-xs text-gray-400 mt-0.5">
                      Connected {new Date(account.created_at).toLocaleDateString()} · 
                      Token expires {new Date(account.token_expires_at).toLocaleDateString()}
                    </p>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-xs bg-green-100 text-green-700 px-2 py-1 rounded-full">
                      Active
                    </span>
                    <Button
                      variant="ghost"
                      size="sm"
                      className="text-red-400 hover:text-red-600 hover:bg-red-50"
                      disabled={disconnecting === account.id}
                      onClick={() => disconnectAccount(account.id, account.ig_username)}
                    >
                      {disconnecting === account.id ? 'Disconnecting...' : 'Disconnect'}
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Danger zone */}
      <Card className="border-red-100">
        <CardHeader className="pb-3">
          <CardTitle className="text-sm font-medium text-red-600">Danger zone</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium">Delete account</p>
              <p className="text-xs text-gray-400 mt-0.5">
                Permanently delete your account and all data
              </p>
            </div>
            <Button
              variant="outline"
              size="sm"
              className="border-red-200 text-red-500 hover:bg-red-50 hover:border-red-300"
              onClick={() => alert('Please contact support to delete your account')}
            >
              Delete account
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}