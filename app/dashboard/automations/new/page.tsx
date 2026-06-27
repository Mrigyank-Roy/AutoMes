'use client'
import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase'
import { useRouter } from 'next/navigation'
import Link from 'next/link'

export default function NewAutomationPage() {
  const router = useRouter()
  const [userId, setUserId] = useState('')
  const [igAccounts, setIgAccounts] = useState<any[]>([])
  const [subscription, setSubscription] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState('')
  const [selectedAccountId, setSelectedAccountId] = useState('')
  const [postUrl, setPostUrl] = useState('')
  const [triggerType, setTriggerType] = useState<'any' | 'keyword'>('keyword')
  const [keywords, setKeywords] = useState<string[]>([])
  const [keywordInput, setKeywordInput] = useState('')
  const [dmMessage, setDmMessage] = useState('')
  const [replyEnabled, setReplyEnabled] = useState(false)
  const [replyMessages, setReplyMessages] = useState<string[]>(['Check your DMs! 📩', 'Sent you a DM! 🙌'])
  const [replyInput, setReplyInput] = useState('')
  const [autoDeactivateDays, setAutoDeactivateDays] = useState(7)

  useEffect(() => {
    async function load() {
      const { data: { session } } = await supabase.auth.getSession()
      if (!session) { router.push('/login'); return }
      setUserId(session.user.id)
      const { data: accounts } = await supabase.from('instagram_accounts').select('*').eq('user_id', session.user.id)
      setIgAccounts(accounts ?? [])
      if (accounts?.length) setSelectedAccountId(accounts[0].id)
      const { data: sub } = await supabase.from('subscriptions').select('*').eq('user_id', session.user.id).single()
      setSubscription(sub)
      setLoading(false)
    }
    load()
  }, [router])

  function addKeyword() {
    const kw = keywordInput.trim()
    if (!kw || keywords.includes(kw)) return
    setKeywords(prev => [...prev, kw])
    setKeywordInput('')
  }

  async function handleSubmit() {
    setError('')
    if (!selectedAccountId) return setError('Please select an Instagram account')
    if (!postUrl.trim() || !/instagram\.com\/(p|reel|reels|tv)\//.test(postUrl)) return setError('Please enter a valid Instagram post or reel URL')
    if (triggerType === 'keyword' && keywords.length === 0) return setError('Please add at least one keyword')
    if (!dmMessage.trim()) return setError('Please write a DM message')
    if (dmMessage.length > 1000) return setError('DM message must be under 1000 characters')
    setSubmitting(true)
    const res = await fetch('/api/automations/create', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ 
        userId, 
        igAccountId: selectedAccountId, 
        postUrl: postUrl.trim(), 
        triggerType, 
        keywords, 
        dmMessage: dmMessage.trim(), 
        replyEnabled, 
        replyMessages,
        autoDeactivateDays
      })
    })
    const data = await res.json()
    if (!res.ok) { setError(data.error ?? 'Something went wrong'); setSubmitting(false); return }
    router.push('/dashboard/automations?created=true')
  }

  const canReply = subscription && ['starter', 'pro', 'agency'].includes(subscription.plan_name)

  if (loading) return <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: 300 }}><p style={{ color: 'var(--ash)', fontSize: 14 }}>Loading...</p></div>

  if (igAccounts.length === 0) return (
    <div style={{ maxWidth: 560 }}>
      <div style={{ background: 'var(--canvas)', borderRadius: 'var(--radius-lg)', border: '1px solid var(--hairline)', padding: 64, textAlign: 'center' }}>
        <div style={{ fontSize: 48, marginBottom: 16 }}>📱</div>
        <p style={{ fontSize: 18, fontWeight: 700, color: 'var(--ink)', marginBottom: 8 }}>No Instagram account connected</p>
        <p style={{ fontSize: 14, color: 'var(--mute)', marginBottom: 28 }}>Connect your Instagram Business account first</p>
        <Link href="/dashboard/settings" className="btn-primary">Connect Instagram</Link>
      </div>
    </div>
  )

  const StepLabel = ({ n, label }: { n: number, label: string }) => (
    <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 20 }}>
      <span style={{ width: 28, height: 28, borderRadius: '50%', background: 'var(--ink)', color: '#fff', fontSize: 12, fontWeight: 800, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>{n}</span>
      <span style={{ fontSize: 14, fontWeight: 700, color: 'var(--ink)' }}>{label}</span>
    </div>
  )

  return (
    <div style={{ maxWidth: 640 }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 16, marginBottom: 32 }}>
        <Link href="/dashboard/automations" style={{ background: 'var(--card)', border: 'none', borderRadius: 'var(--radius-md)', padding: '8px 14px', fontSize: 13, fontWeight: 600, color: 'var(--mute)', cursor: 'pointer', textDecoration: 'none' }}>← Back</Link>
        <div>
          <h1 style={{ fontSize: 24, fontWeight: 800, color: 'var(--ink)', letterSpacing: -0.5 }}>Create automation</h1>
          <p style={{ fontSize: 13, color: 'var(--mute)', marginTop: 2 }}>Set up automatic DMs when people comment on your post</p>
        </div>
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>

        {/* Step 1 */}
        <div style={{ background: 'var(--canvas)', borderRadius: 'var(--radius-md)', border: '1px solid var(--hairline)', padding: 24 }}>
          <StepLabel n={1} label="Instagram account" />
          {igAccounts.length === 1 ? (
            <div style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '12px 16px', background: 'var(--surface)', borderRadius: 'var(--radius-md)', border: '1px solid var(--hairline)' }}>
              <div style={{ width: 32, height: 32, borderRadius: '50%', background: 'var(--secondary-bg)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 14 }}>@</div>
              <span style={{ fontSize: 14, fontWeight: 700, color: 'var(--ink)' }}>@{igAccounts[0].ig_username}</span>
              <span style={{ marginLeft: 'auto', background: '#e8f8ed', color: '#1a6b3a', borderRadius: 'var(--radius-full)', padding: '2px 10px', fontSize: 11, fontWeight: 700 }}>Connected</span>
            </div>
          ) : (
            <select value={selectedAccountId} onChange={e => setSelectedAccountId(e.target.value)}>
              {igAccounts.map(acc => <option key={acc.id} value={acc.id}>@{acc.ig_username}</option>)}
            </select>
          )}
        </div>

        {/* Step 2 */}
        <div style={{ background: 'var(--canvas)', borderRadius: 'var(--radius-md)', border: '1px solid var(--hairline)', padding: 24 }}>
          <StepLabel n={2} label="Instagram post URL" />
          <input type="url" value={postUrl} onChange={e => setPostUrl(e.target.value)} placeholder="https://www.instagram.com/p/DZzuPxGAdOY/" />
          <p style={{ fontSize: 12, color: 'var(--ash)', marginTop: 8 }}>Open the post on Instagram → tap the three dots → Copy link</p>
        </div>

        {/* Step 3 */}
        <div style={{ background: 'var(--canvas)', borderRadius: 'var(--radius-md)', border: '1px solid var(--hairline)', padding: 24 }}>
          <StepLabel n={3} label="Trigger type" />
          <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
            {[
              { value: 'any', title: 'Any comment', desc: 'Send DM to everyone who comments on this post' },
              { value: 'keyword', title: 'Specific keywords', desc: 'Only send DM when comment contains one of your keywords' },
            ].map(opt => (
              <label 
                key={opt.value} 
                style={{ 
                  display: 'flex', 
                  gap: 14, 
                  padding: '14px 16px', 
                  borderRadius: 'var(--radius-md)', 
                  border: `2px solid ${triggerType === opt.value ? 'var(--ink)' : 'var(--hairline)'}`, 
                  cursor: 'pointer', 
                  background: triggerType === opt.value ? 'var(--surface)' : 'transparent', 
                  transition: 'all 0.15s' 
                }}
              >
                {/* Custom radio button design replacement */}
                <div style={{ width: 18, height: 18, borderRadius: '50%', border: `2px solid ${triggerType === opt.value ? 'var(--ink)' : 'var(--stone)'}`, background: 'transparent', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, marginTop: 2 }}>
                  {triggerType === opt.value && <div style={{ width: 8, height: 8, borderRadius: '50%', background: 'var(--ink)' }} />}
                </div>

                {/* Hidden input to maintain functional accessibility */}
                <input 
                  type="radio" 
                  name="trigger" 
                  value={opt.value} 
                  checked={triggerType === opt.value} 
                  onChange={() => setTriggerType(opt.value as any)} 
                  style={{ display: 'none' }} 
                />

                <div style={{ flex: 1 }}>
                  <p style={{ fontSize: 14, fontWeight: 700, color: 'var(--ink)' }}>{opt.title}</p>
                  <p style={{ fontSize: 12, color: 'var(--mute)', marginTop: 2 }}>{opt.desc}</p>
                  {opt.value === 'keyword' && triggerType === 'keyword' && (
                    <div style={{ marginTop: 14 }} onClick={(e) => e.stopPropagation()}>
                      <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6, marginBottom: 10 }}>
                        {keywords.map(kw => (
                          <span key={kw} style={{ display: 'flex', alignItems: 'center', gap: 4, background: 'var(--ink)', color: '#fff', borderRadius: 'var(--radius-full)', padding: '4px 12px', fontSize: 12, fontWeight: 700 }}>
                            {kw}
                            <button onClick={() => setKeywords(prev => prev.filter(k => k !== kw))} style={{ background: 'none', border: 'none', color: 'rgba(255,255,255,0.7)', cursor: 'pointer', fontSize: 14, lineHeight: 1, padding: 0 }}>×</button>
                          </span>
                        ))}
                      </div>
                      <div style={{ display: 'flex', gap: 8 }}>
                        <input type="text" value={keywordInput} onChange={e => setKeywordInput(e.target.value)} onKeyDown={e => (e.key === 'Enter' || e.key === ',') && (e.preventDefault(), addKeyword())} placeholder="Type keyword and press Enter" style={{ flex: 1 }} />
                        <button onClick={addKeyword} className="btn-secondary" style={{ padding: '10px 16px', fontSize: 13 }}>Add</button>
                      </div>
                      <p style={{ fontSize: 11, color: 'var(--ash)', marginTop: 6 }}>Press Enter or comma to add. Not case sensitive.</p>
                    </div>
                  )}
                </div>
              </label>
            ))}
          </div>
        </div>

        {/* Step 4 */}
        <div style={{ background: 'var(--canvas)', borderRadius: 'var(--radius-md)', border: '1px solid var(--hairline)', padding: 24 }}>
          <StepLabel n={4} label="DM message" />
          <textarea value={dmMessage} onChange={e => setDmMessage(e.target.value)} placeholder="Hey! Here's the free guide you asked for 👉 [your link here]" rows={4} maxLength={1000} style={{ resize: 'none' }} />
          <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 8 }}>
            <p style={{ fontSize: 12, color: 'var(--ash)' }}>This message will be sent automatically to every commenter</p>
            <p style={{ fontSize: 12, color: dmMessage.length > 900 ? 'var(--red)' : 'var(--ash)', fontWeight: dmMessage.length > 900 ? 700 : 400 }}>{dmMessage.length} / 1000</p>
          </div>
        </div>

        {/* Step 5 — Auto deactivate */}
        <div style={{ background: 'var(--canvas)', borderRadius: 'var(--radius-md)', border: '1px solid var(--hairline)', padding: 24 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 20 }}>
            <span style={{ width: 28, height: 28, borderRadius: '50%', background: 'var(--ink)', color: '#fff', fontSize: 12, fontWeight: 800, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>5</span>
            <span style={{ fontSize: 14, fontWeight: 700, color: 'var(--ink)' }}>Auto deactivate</span>
          </div>
          <p style={{ fontSize: 13, color: 'var(--mute)', marginBottom: 16, lineHeight: 1.6 }}>
            Automatically pause this automation after a set number of days. Set to 0 to never auto-deactivate.
          </p>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 14 }}>
            <input type="number" value={autoDeactivateDays} min={0} max={365}
              onChange={e => setAutoDeactivateDays(Number(e.target.value))}
              style={{ width: 80, textAlign: 'center', fontWeight: 700 }} />
            <span style={{ fontSize: 14, color: 'var(--ink)', fontWeight: 500 }}>days after creation</span>
            {autoDeactivateDays === 0 && (
              <span style={{ fontSize: 12, color: '#1a6b3a', background: '#e8f8ed', padding: '4px 12px', borderRadius: 'var(--radius-full)', fontWeight: 600 }}>Never</span>
            )}
          </div>
          <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
            {[{ label: '7 days', value: 7 }, { label: '14 days', value: 14 }, { label: '30 days', value: 30 }, { label: '60 days', value: 60 }, { label: 'Never', value: 0 }].map(p => (
              <button key={p.value} onClick={() => setAutoDeactivateDays(p.value)}
                style={{ padding: '6px 14px', borderRadius: 'var(--radius-full)', border: 'none', cursor: 'pointer', fontSize: 12, fontWeight: 700, background: autoDeactivateDays === p.value ? 'var(--ink)' : 'var(--card)', color: autoDeactivateDays === p.value ? '#fff' : 'var(--mute)', transition: 'all 0.15s' }}>
                {p.label}
              </button>
            ))}
          </div>
        </div>

        {/* Step 6 — Public reply */}
        <div style={{ background: 'var(--canvas)', borderRadius: 'var(--radius-md)', border: '1px solid var(--hairline)', padding: 24, opacity: canReply ? 1 : 0.8 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 20 }}>
            <span style={{ width: 28, height: 28, borderRadius: '50%', background: 'var(--ink)', color: '#fff', fontSize: 12, fontWeight: 800, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>6</span>
            <span style={{ fontSize: 14, fontWeight: 700, color: 'var(--ink)' }}>Public comment reply</span>
            <span style={{ background: '#fff0f0', color: 'var(--red)', borderRadius: 'var(--radius-full)', padding: '2px 10px', fontSize: 11, fontWeight: 700 }}>Starter+</span>
          </div>

          {!canReply ? (
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '16px 20px', background: 'var(--surface)', borderRadius: 'var(--radius-md)', border: '1px dashed var(--hairline)' }}>
              <div>
                <p style={{ fontSize: 13, fontWeight: 700, color: 'var(--ink)' }}>🔒 Available on Starter plan and above</p>
                <p style={{ fontSize: 12, color: 'var(--mute)', marginTop: 2 }}>Automatically reply to comments to drive more engagement</p>
              </div>
              <Link href="/dashboard/billing" className="btn-secondary" style={{ padding: '8px 16px', fontSize: 13 }}>Upgrade</Link>
            </div>
          ) : (
            <div>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16 }}>
                <div>
                  <p style={{ fontSize: 13, fontWeight: 600, color: 'var(--ink)' }}>Reply to comments publicly</p>
                  <p style={{ fontSize: 12, color: 'var(--mute)', marginTop: 2 }}>Post a reply like "Check your DMs!" — rotated randomly</p>
                </div>
                <button onClick={() => setReplyEnabled(!replyEnabled)} style={{ width: 44, height: 24, borderRadius: 'var(--radius-full)', background: replyEnabled ? 'var(--ink)' : 'var(--stone)', border: 'none', cursor: 'pointer', position: 'relative', transition: 'background 0.2s' }}>
                  <span style={{ position: 'absolute', top: 3, left: replyEnabled ? 22 : 3, width: 18, height: 18, borderRadius: '50%', background: '#fff', transition: 'left 0.2s' }} />
                </button>
              </div>
              {replyEnabled && (
                <div>
                  <p style={{ fontSize: 12, fontWeight: 600, color: 'var(--mute)', marginBottom: 10 }}>Reply variations (picked randomly):</p>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 8, marginBottom: 12 }}>
                    {replyMessages.map((msg, i) => (
                      <div key={i} style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
                        <span style={{ flex: 1, padding: '10px 14px', background: 'var(--surface)', borderRadius: 'var(--radius-md)', fontSize: 13, color: 'var(--ink)', border: '1px solid var(--hairline)' }}>{msg}</span>
                        <button onClick={() => setReplyMessages(prev => prev.filter((_, j) => j !== i))} style={{ background: 'none', border: 'none', color: 'var(--ash)', cursor: 'pointer', fontSize: 18, lineHeight: 1 }}>×</button>
                      </div>
                    ))}
                  </div>
                  {replyMessages.length < 6 && (
                    <div style={{ display: 'flex', gap: 8 }}>
                      <input type="text" value={replyInput} onChange={e => setReplyInput(e.target.value)} onKeyDown={e => e.key === 'Enter' && (replyInput.trim() && setReplyMessages(p => [...p, replyInput.trim()]), setReplyInput(''))} placeholder="Add another reply variation..." />
                      <button onClick={() => { if (replyInput.trim()) { setReplyMessages(p => [...p, replyInput.trim()]); setReplyInput('') } }} className="btn-secondary" style={{ padding: '10px 16px', fontSize: 13 }}>Add</button>
                    </div>
                  )}
                </div>
              )}
            </div>
          )}
        </div>

        {/* Error */}
        {error && (
          <div style={{ background: '#fff0f0', border: '1px solid #ffd0d0', borderRadius: 'var(--radius-md)', padding: '12px 16px', fontSize: 13, color: 'var(--red)', fontWeight: 500 }}>
            {error}
          </div>
        )}

        {/* Buttons */}
        <div style={{ display: 'flex', gap: 12, paddingBottom: 32 }}>
          <Link href="/dashboard/automations" className="btn-secondary" style={{ flex: 1, justifyContent: 'center', padding: '13px' }}>Cancel</Link>
          <button onClick={handleSubmit} disabled={submitting} className="btn-primary" style={{ flex: 1, justifyContent: 'center', padding: '13px', fontSize: 15, opacity: submitting ? 0.7 : 1 }}>
            {submitting ? 'Creating...' : 'Create automation →'}
          </button>
        </div>
      </div>
    </div>
  )
}