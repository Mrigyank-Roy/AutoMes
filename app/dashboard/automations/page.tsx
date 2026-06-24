'use client'
import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase'
import { useRouter } from 'next/navigation'
import Link from 'next/link'

export default function AutomationsPage() {
  const router = useRouter()
  const [automations, setAutomations] = useState<any[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => { loadAutomations() }, [])

  async function loadAutomations() {
    const { data: { session } } = await supabase.auth.getSession()
    if (!session) { router.push('/login'); return }
    const { data } = await supabase
      .from('automations')
      .select('*, instagram_accounts(ig_username)')
      .eq('user_id', session.user.id)
      .order('created_at', { ascending: false })
    setAutomations(data ?? [])
    setLoading(false)
  }

  async function toggleAutomation(id: string, current: boolean) {
    await supabase.from('automations').update({ is_active: !current }).eq('id', id)
    setAutomations(prev => prev.map(a => a.id === id ? { ...a, is_active: !current } : a))
  }

  async function deleteAutomation(id: string) {
    if (!confirm('Delete this automation? This cannot be undone.')) return
    await supabase.from('automations').delete().eq('id', id)
    setAutomations(prev => prev.filter(a => a.id !== id))
  }

  if (loading) return (
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: 300 }}>
      <p style={{ color: 'var(--ash)', fontSize: 14 }}>Loading...</p>
    </div>
  )

  return (
    <div style={{ maxWidth: 900 }}>
      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: 32 }}>
        <div>
          <h1 style={{ fontSize: 28, fontWeight: 800, color: 'var(--ink)', letterSpacing: -0.5 }}>Automations</h1>
          <p style={{ fontSize: 14, color: 'var(--mute)', marginTop: 4 }}>Manage your comment-to-DM automations</p>
        </div>
        <Link href="/dashboard/automations/new" className="btn-primary">+ Create automation</Link>
      </div>

      {automations.length === 0 ? (
        <div style={{ background: 'var(--canvas)', borderRadius: 'var(--radius-lg)', border: '1px solid var(--hairline)', padding: 64, textAlign: 'center' }}>
          <div style={{ fontSize: 48, marginBottom: 16 }}>⚡</div>
          <p style={{ fontSize: 18, fontWeight: 700, color: 'var(--ink)', marginBottom: 8 }}>No automations yet</p>
          <p style={{ fontSize: 14, color: 'var(--mute)', marginBottom: 28, maxWidth: 320, margin: '0 auto 28px' }}>
            Create your first automation to start sending DMs automatically when people comment
          </p>
          <Link href="/dashboard/automations/new" className="btn-primary">Create your first automation</Link>
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          {automations.map(automation => (
            <div key={automation.id} style={{ background: 'var(--canvas)', borderRadius: 'var(--radius-md)', border: '1px solid var(--hairline)', padding: '20px 24px', display: 'flex', alignItems: 'center', gap: 16, transition: 'border-color 0.15s' }}
              onMouseEnter={e => e.currentTarget.style.borderColor = 'var(--stone)'}
              onMouseLeave={e => e.currentTarget.style.borderColor = 'var(--hairline)'}>

              {/* Thumbnail */}
              {automation.post_thumbnail_url && !automation.post_thumbnail_url.includes('placeholder') ? (
                <img src={automation.post_thumbnail_url} alt="Post" style={{ width: 52, height: 52, borderRadius: 'var(--radius-sm)', objectFit: 'cover', flexShrink: 0, border: '1px solid var(--hairline)' }} />
              ) : (
                <div style={{ width: 52, height: 52, borderRadius: 'var(--radius-sm)', background: 'var(--card)', border: '1px solid var(--hairline)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, fontSize: 20 }}>
                  📷
                </div>
              )}

              {/* Details */}
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 6, flexWrap: 'wrap' }}>
                  <span style={{ fontSize: 14, fontWeight: 700, color: 'var(--ink)' }}>
                    @{automation.instagram_accounts?.ig_username}
                  </span>
                  {automation.post_caption && (
                    <span style={{ fontSize: 12, color: 'var(--ash)' }}>"{automation.post_caption}"</span>
                  )}
                  <span style={{ background: 'var(--card)', borderRadius: 'var(--radius-full)', padding: '2px 10px', fontSize: 11, fontWeight: 700, color: 'var(--mute)' }}>
                    {automation.trigger_type === 'any' ? 'Any comment' : 'Keyword'}
                  </span>
                  {automation.reply_enabled && (
                    <span style={{ background: '#e8f8ed', borderRadius: 'var(--radius-full)', padding: '2px 10px', fontSize: 11, fontWeight: 700, color: '#1a6b3a' }}>
                      Public reply on
                    </span>
                  )}
                </div>

                {automation.trigger_type === 'keyword' && automation.keywords && (
                  <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', marginBottom: 6 }}>
                    {automation.keywords.map((kw: string) => (
                      <span key={kw} style={{ background: 'var(--ink)', color: '#fff', borderRadius: 'var(--radius-full)', padding: '2px 10px', fontSize: 11, fontWeight: 700 }}>
                        {kw}
                      </span>
                    ))}
                  </div>
                )}

                <p style={{ fontSize: 12, color: 'var(--ash)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', maxWidth: 400 }}>
                  DM: {automation.dm_message}
                </p>
              </div>

              {/* Actions */}
              <div style={{ display: 'flex', alignItems: 'center', gap: 12, flexShrink: 0 }}>
                {/* Toggle */}
                <button onClick={() => toggleAutomation(automation.id, automation.is_active)}
                  style={{ width: 44, height: 24, borderRadius: 'var(--radius-full)', background: automation.is_active ? 'var(--ink)' : 'var(--stone)', border: 'none', cursor: 'pointer', position: 'relative', transition: 'background 0.2s' }}>
                  <span style={{ position: 'absolute', top: 3, left: automation.is_active ? 22 : 3, width: 18, height: 18, borderRadius: '50%', background: '#fff', transition: 'left 0.2s' }} />
                </button>
                <span style={{ fontSize: 12, color: 'var(--ash)', width: 44 }}>{automation.is_active ? 'Active' : 'Paused'}</span>
                <button onClick={() => deleteAutomation(automation.id)}
                  style={{ background: 'none', border: 'none', cursor: 'pointer', fontSize: 13, color: 'var(--ash)', fontWeight: 600, padding: '6px 10px', borderRadius: 'var(--radius-sm)', transition: 'all 0.15s' }}
                  onMouseEnter={e => { e.currentTarget.style.background = '#fff0f0'; e.currentTarget.style.color = 'var(--red)' }}
                  onMouseLeave={e => { e.currentTarget.style.background = 'none'; e.currentTarget.style.color = 'var(--ash)' }}>
                  Delete
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}