'use client'

import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase'
import { useRouter } from 'next/navigation'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'

export default function LogsPage() {
  const router = useRouter()
  const [logs, setLogs] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [filter, setFilter] = useState<'all' | 'sent' | 'failed' | 'limit_reached'>('all')

  useEffect(() => {
    loadLogs()
  }, [])

  async function loadLogs() {
    const { data: { session } } = await supabase.auth.getSession()
    if (!session) { router.push('/login'); return }

    const { data } = await supabase
      .from('dm_logs')
      .select(`
        *,
        automations(
          dm_message,
          post_id,
          keywords,
          trigger_type,
          instagram_accounts(ig_username)
        )
      `)
      .eq('user_id', session.user.id)
      .order('sent_at', { ascending: false })
      .limit(100)

    setLogs(data ?? [])
    setLoading(false)
  }

  const filteredLogs = filter === 'all'
    ? logs
    : logs.filter(l => l.status === filter)

  function statusBadge(status: string) {
    switch (status) {
      case 'sent':
        return <Badge className="bg-green-100 text-green-700 hover:bg-green-100">✓ Sent</Badge>
      case 'failed':
        return <Badge className="bg-red-100 text-red-700 hover:bg-red-100">✗ Failed</Badge>
      case 'limit_reached':
        return <Badge className="bg-yellow-100 text-yellow-700 hover:bg-yellow-100">⚠ Limit reached</Badge>
      default:
        return <Badge variant="secondary">{status}</Badge>
    }
  }

  function timeAgo(dateStr: string) {
    const date = new Date(dateStr)
    const now = new Date()
    const diff = Math.floor((now.getTime() - date.getTime()) / 1000)

    if (diff < 60) return `${diff}s ago`
    if (diff < 3600) return `${Math.floor(diff / 60)}m ago`
    if (diff < 86400) return `${Math.floor(diff / 3600)}h ago`
    return `${Math.floor(diff / 86400)}d ago`
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <p className="text-sm text-gray-400">Loading...</p>
      </div>
    )
  }

  return (
    <div className="max-w-4xl">
      {/* Header */}
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-2xl font-semibold">DM Logs</h1>
          <p className="text-sm text-gray-500 mt-1">
            Every DM your automations have sent or attempted
          </p>
        </div>
        <button
          onClick={loadLogs}
          className="text-sm text-gray-400 hover:text-gray-600"
        >
          ↻ Refresh
        </button>
      </div>

      {/* Filter tabs */}
      <div className="flex gap-2 mb-5">
        {(['all', 'sent', 'failed', 'limit_reached'] as const).map(f => (
          <button
            key={f}
            onClick={() => setFilter(f)}
            className={`px-3 py-1.5 rounded-lg text-sm transition-colors ${
              filter === f
                ? 'bg-black text-white'
                : 'bg-gray-100 text-gray-500 hover:bg-gray-200'
            }`}
          >
            {f === 'all' ? 'All' :
             f === 'sent' ? '✓ Sent' :
             f === 'failed' ? '✗ Failed' :
             '⚠ Limit reached'}
            <span className="ml-1.5 text-xs opacity-70">
              {f === 'all' ? logs.length : logs.filter(l => l.status === f).length}
            </span>
          </button>
        ))}
      </div>

      {/* Logs table */}
      {filteredLogs.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-16">
            <p className="text-2xl mb-3">📋</p>
            <p className="font-medium text-gray-700 mb-1">No logs yet</p>
            <p className="text-sm text-gray-400">
              {filter === 'all'
                ? 'DM activity will appear here once your automations start running'
                : `No ${filter} DMs found`}
            </p>
          </CardContent>
        </Card>
      ) : (
        <Card>
          <CardContent className="p-0">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b">
                  <th className="text-left px-5 py-3 text-xs font-medium text-gray-400 uppercase tracking-wide">Time</th>
                  <th className="text-left px-5 py-3 text-xs font-medium text-gray-400 uppercase tracking-wide">Commenter</th>
                  <th className="text-left px-5 py-3 text-xs font-medium text-gray-400 uppercase tracking-wide">Account</th>
                  <th className="text-left px-5 py-3 text-xs font-medium text-gray-400 uppercase tracking-wide">Status</th>
                  <th className="text-left px-5 py-3 text-xs font-medium text-gray-400 uppercase tracking-wide">Error</th>
                </tr>
              </thead>
              <tbody>
                {filteredLogs.map((log, i) => (
                  <tr
                    key={log.id}
                    className={`border-b last:border-0 hover:bg-gray-50 transition-colors ${
                      i % 2 === 0 ? '' : 'bg-gray-50/50'
                    }`}
                  >
                    <td className="px-5 py-3.5 text-gray-400 whitespace-nowrap">
                      {timeAgo(log.sent_at)}
                    </td>
                    <td className="px-5 py-3.5">
                      <span className="font-medium">
                        {log.commenter_username
                          ? `@${log.commenter_username}`
                          : log.commenter_ig_id}
                      </span>
                    </td>
                    <td className="px-5 py-3.5 text-gray-500">
                      @{log.automations?.instagram_accounts?.ig_username ?? '—'}
                    </td>
                    <td className="px-5 py-3.5">
                      {statusBadge(log.status)}
                    </td>
                    <td className="px-5 py-3.5 text-red-400 text-xs max-w-xs truncate">
                      {log.error_message ?? '—'}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </CardContent>
        </Card>
      )}
    </div>
  )
}