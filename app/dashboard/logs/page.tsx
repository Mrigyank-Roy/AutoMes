'use client'
import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase'
import { useRouter } from 'next/navigation'

type Filter = 'all' | 'sent' | 'failed' | 'limit_reached'

export default function LogsPage() {
  const router = useRouter()
  const [logs, setLogs] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [filter, setFilter] = useState<Filter>('all')

  useEffect(() => { loadLogs() }, [])

  async function loadLogs() {
    const { data: { session } } = await supabase.auth.getSession()
    if (!session) { router.push('/login'); return }
    const { data } = await supabase
      .from('dm_logs')
      .select('*, automations(dm_message, keywords, trigger_type, instagram_accounts(ig_username))')
      .eq('user_id', session.user.id)
      .order('sent_at', { ascending: false })
      .limit(100)
    setLogs(data ?? [])
    setLoading(false)
  }

  const filtered = filter === 'all' ? logs : logs.filter(l => l.status === filter)

  function timeAgo(d: string) {
    const diff = Math.floor((Date.now() - new Date(d).getTime()) / 1000)
    if (diff < 60) return `${diff}s ago`
    if (diff < 3600) return `${Math.floor(diff / 60)}m ago`
    if (diff < 86400) return `${Math.floor(diff / 3600)}h ago`
    return `${Math.floor(diff / 86400)}d ago`
  }

  const StatusBadge = ({ status }: { status: string }) => {
    const styles: Record<string, any> = {
      sent: { background: '#e8f8ed', color: '#1a6b3a', label: '✓ Sent' },
      failed: { background: '#fff0f0', color: 'var(--red)', label: '✗ Failed' },
      limit_reached: { background: '#fff8e0', color: '#92610a', label: '⚠ Limit' },
    }
    const s = styles[status] ?? { background: 'var(--card)', color: 'var(--mute)', label: status }
    return <span style={{ ...s, borderRadius: 'var(--radius-full)', padding: '3px 10px', fontSize: 11, fontWeight: 700 }}>{s.label}</span>
  }

  if (loading) return <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: 300 }}><p style={{ color: 'var(--ash)', fontSize: 14 }}>Loading...</p></div>

  return (
    <div style={{ maxWidth: 900 }}>
      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: 32 }}>
        <div>
          <h1 style={{ fontSize: 28, fontWeight: 800, color: 'var(--ink)', letterSpacing: -0.5 }}>DM Logs</h1>
          <p style={{ fontSize: 14, color: 'var(--mute)', marginTop: 4 }}>Every DM your automations have sent or attempted</p>
        </div>
        <button onClick={loadLogs} style={{ background: 'var(--card)', border: '1px solid var(--hairline)', borderRadius: 'var(--radius-md)', padding: '8px 16px', fontSize: 13, fontWeight: 600, color: 'var(--mute)', cursor: 'pointer' }}>↻ Refresh</button>
      </div>

      {/* Filters */}
      <div style={{ display: 'flex', gap: 8, marginBottom: 24 }}>
        {(['all', 'sent', 'failed', 'limit_reached'] as Filter[]).map(f => (
          <button key={f} onClick={() => setFilter(f)} style={{
            padding: '8px 16px', borderRadius: 'var(--radius-full)', border: 'none', cursor: 'pointer', fontSize: 13, fontWeight: 700,
            background: filter === f ? 'var(--ink)' : 'var(--card)',
            color: filter === f ? '#fff' : 'var(--mute)',
            transition: 'all 0.15s',
          }}>
            {f === 'all' ? 'All' : f === 'sent' ? '✓ Sent' : f === 'failed' ? '✗ Failed' : '⚠ Limit reached'}
            <span style={{ marginLeft: 6, opacity: 0.7, fontSize: 11 }}>
              {f === 'all' ? logs.length : logs.filter(l => l.status === f).length}
            </span>
          </button>
        ))}
      </div>

      {filtered.length === 0 ? (
        <div style={{ background: 'var(--canvas)', borderRadius: 'var(--radius-lg)', border: '1px solid var(--hairline)', padding: 64, textAlign: 'center' }}>
          <div style={{ fontSize: 48, marginBottom: 16 }}>📋</div>
          <p style={{ fontSize: 16, fontWeight: 700, color: 'var(--ink)', marginBottom: 8 }}>No logs yet</p>
          <p style={{ fontSize: 14, color: 'var(--mute)' }}>{filter === 'all' ? 'DM activity will appear here once your automations start running' : `No ${filter} DMs found`}</p>
        </div>
      ) : (
        <div style={{ background: 'var(--canvas)', borderRadius: 'var(--radius-md)', border: '1px solid var(--hairline)', overflow: 'hidden' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13 }}>
            <thead>
              <tr style={{ borderBottom: '1px solid var(--hairline)', background: 'var(--surface)' }}>
                {['Time', 'Commenter', 'Account', 'Status', 'Error'].map(h => (
                  <th key={h} style={{ padding: '12px 20px', textAlign: 'left', fontSize: 11, fontWeight: 700, color: 'var(--ash)', textTransform: 'uppercase', letterSpacing: 0.5 }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {filtered.map((log, i) => (
                <tr key={log.id} style={{ borderBottom: i < filtered.length - 1 ? '1px solid var(--hairline)' : 'none' }}
                  onMouseEnter={e => e.currentTarget.style.background = 'var(--surface)'}
                  onMouseLeave={e => e.currentTarget.style.background = 'transparent'}>
                  <td style={{ padding: '14px 20px', color: 'var(--ash)', whiteSpace: 'nowrap' }}>{timeAgo(log.sent_at)}</td>
                  <td style={{ padding: '14px 20px', fontWeight: 600, color: 'var(--ink)' }}>{log.commenter_username ? `@${log.commenter_username}` : log.commenter_ig_id}</td>
                  <td style={{ padding: '14px 20px', color: 'var(--mute)' }}>@{log.automations?.instagram_accounts?.ig_username ?? '—'}</td>
                  <td style={{ padding: '14px 20px' }}><StatusBadge status={log.status} /></td>
                  <td style={{ padding: '14px 20px', color: 'var(--red)', fontSize: 12, maxWidth: 200, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{log.error_message ?? '—'}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  )
}