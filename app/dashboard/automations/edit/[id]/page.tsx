'use client'
import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase'
import { useRouter, useParams } from 'next/navigation'
import Link from 'next/link'

export default function EditAutomationPage() {
  const router = useRouter()
  const params = useParams()
  const automationId = params.id as string

  const [userId, setUserId] = useState('')
  const [automation, setAutomation] = useState<any>(null)
  const [subscription, setSubscription] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState('')

  // Form state
  const [triggerType, setTriggerType] = useState<'any' | 'keyword'>('keyword')
  const [keywords, setKeywords] = useState<string[]>([])
  const [keywordInput, setKeywordInput] = useState('')
  const [dmMessage, setDmMessage] = useState('')
  const [dmButtons, setDmButtons] = useState<{ label: string; url: string }[]>([])
  const [followEnabled, setFollowEnabled] = useState(false)
  const [followLabel, setFollowLabel] = useState('Follow me 👋')
  const [replyEnabled, setReplyEnabled] = useState(false)
  const [replyMessages, setReplyMessages] = useState<string[]>([])
  const [replyInput, setReplyInput] = useState('')
  const [autoDeactivateDays, setAutoDeactivateDays] = useState(7)

  useEffect(() => {
    async function load() {
      const { data: { session } } = await supabase.auth.getSession()
      if (!session) { router.push('/login'); return }
      setUserId(session.user.id)

      const { data: auto } = await supabase
        .from('automations')
        .select('*, instagram_accounts(ig_username)')
        .eq('id', automationId)
        .eq('user_id', session.user.id)
        .single()

      if (!auto) { router.push('/dashboard/automations'); return }

      setAutomation(auto)
      setTriggerType(auto.trigger_type ?? 'keyword')
      setKeywords(auto.keywords ?? [])
      setDmMessage(auto.dm_message ?? '')

      // Split saved buttons into manual buttons + the follow button
      const allBtns = Array.isArray(auto.dm_buttons) ? auto.dm_buttons : []
      const followBtn = allBtns.find((b: any) => b?.kind === 'follow')
      const manualBtns = allBtns.filter((b: any) => b?.kind !== 'follow')
      setDmButtons(manualBtns.map((b: any) => ({ label: b.label ?? '', url: b.url ?? '' })))
      setFollowEnabled(!!followBtn)
      setFollowLabel(followBtn?.label ?? 'Follow me 👋')

      setReplyEnabled(auto.reply_enabled ?? false)
      setReplyMessages(auto.reply_messages ?? ['Check your DMs! 📩'])
      setAutoDeactivateDays(auto.auto_deactivate_days ?? 7)

      const { data: sub } = await supabase
        .from('subscriptions')
        .select('*')
        .eq('user_id', session.user.id)
        .single()
      setSubscription(sub)
      setLoading(false)
    }
    load()
  }, [automationId, router])

  const profileUsername = automation?.instagram_accounts?.ig_username ?? ''
  const profileUrl = profileUsername ? `https://instagram.com/${profileUsername}` : ''
  const totalButtons = dmButtons.length + (followEnabled ? 1 : 0)

  function addKeyword() {
    const kw = keywordInput.trim()
    if (!kw || keywords.includes(kw)) return
    setKeywords(prev => [...prev, kw])
    setKeywordInput('')
  }

  function addButton() {
    if (dmButtons.length + (followEnabled ? 1 : 0) >= 3) return
    setDmButtons(prev => [...prev, { label: '', url: '' }])
  }
  function updateButton(i: number, field: 'label' | 'url', value: string) {
    setDmButtons(prev => prev.map((b, j) => j === i ? { ...b, [field]: value } : b))
  }
  function removeButton(i: number) {
    setDmButtons(prev => prev.filter((_, j) => j !== i))
  }

  async function handleSave() {
    setError('')
    if (triggerType === 'keyword' && keywords.length === 0) return setError('Please add at least one keyword')
    if (!dmMessage.trim()) return setError('Please write a DM message')
    if (dmMessage.length > 1000) return setError('DM message must be under 1000 characters')

    // Validate manual buttons
    for (const b of dmButtons) {
      if (!b.label.trim() || !b.url.trim()) return setError('Every button needs both a label and a link')
      if (!/^https?:\/\//i.test(b.url.trim())) return setError('Button links must start with http:// or https://')
    }
    if (followEnabled && !profileUrl) return setError('Could not find your Instagram profile link — try reconnecting your account')
    if (totalButtons > 3) return setError('You can add a maximum of 3 buttons')

    // Build final buttons (follow button always last, URL re-derived from current username)
    const allButtons: any[] = dmButtons.map(b => ({ label: b.label.trim().slice(0, 20), url: b.url.trim() }))
    if (followEnabled && profileUrl) {
      allButtons.push({ label: (followLabel.trim() || 'Follow me 👋').slice(0, 20), url: profileUrl, kind: 'follow' })
    }

    setSubmitting(true)
    const res = await fetch('/api/automations/update', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        automationId,
        userId,
        triggerType,
        keywords,
        dmMessage: dmMessage.trim(),
        dmButtons: allButtons,
        replyEnabled,
        replyMessages,
        autoDeactivateDays,
      })
    })
    const data = await res.json()
    if (!res.ok) { setError(data.error ?? 'Something went wrong'); setSubmitting(false); return }
    router.push('/dashboard/automations')
  }

  const canReply = subscription && ['starter', 'pro', 'agency'].includes(subscription.plan_name)

  if (loading) return (
    <div style={ { display: 'flex', alignItems: 'center', justifyContent: 'center', height: 300 } }>
      <p style={ { color: 'var(--ash)', fontSize: 14 } }>Loading...</p>
    </div>
  )

  const StepLabel = ({ n, label }: { n: number, label: string }) => (
    <div style={ { display: 'flex', alignItems: 'center', gap: 10, marginBottom: 20 } }>
      <span style={ { width: 28, height: 28, borderRadius: '50%', background: 'var(--ink)', color: '#fff', fontSize: 12, fontWeight: 800, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 } }>{n}</span>
      <span style={ { fontSize: 14, fontWeight: 700, color: 'var(--ink)' } }>{label}</span>
    </div>
  )

  return (
    <div style={ { maxWidth: 640 } }>
      <div style={ { display: 'flex', alignItems: 'center', gap: 16, marginBottom: 32 } }>
        <Link href="/dashboard/automations" style={ { background: 'var(--card)', border: 'none', borderRadius: 'var(--radius-md)', padding: '8px 14px', fontSize: 13, fontWeight: 600, color: 'var(--mute)', cursor: 'pointer', textDecoration: 'none' } }>← Back</Link>
        <div>
          <h1 style={ { fontSize: 24, fontWeight: 800, color: 'var(--ink)', letterSpacing: -0.5 } }>Edit automation</h1>
          <p style={ { fontSize: 13, color: 'var(--mute)', marginTop: 2 } }>
            @{automation?.instagram_accounts?.ig_username} · Post ID: {automation?.post_id?.slice(0, 20)}...
          </p>
        </div>
      </div>

      <div style={ { display: 'flex', flexDirection: 'column', gap: 16 } }>
        {/* Post URL — read only */}
        <div style={ { background: 'var(--surface)', borderRadius: 'var(--radius-md)', border: '1px solid var(--hairline)', padding: 20, display: 'flex', alignItems: 'center', gap: 12 } }>
          <span style={ { fontSize: 16 } }>🔒</span>
          <div>
            <p style={ { fontSize: 13, fontWeight: 700, color: 'var(--ink)' } }>Post URL cannot be changed</p>
            <p style={ { fontSize: 12, color: 'var(--ash)', marginTop: 2 } }>Delete this automation and create a new one to change the post.</p>
          </div>
        </div>

        {/* Step 1 — Trigger type */}
        <div style={ { background: 'var(--canvas)', borderRadius: 'var(--radius-md)', border: '1px solid var(--hairline)', padding: 24 } }>
          <StepLabel n={1} label="Trigger type" />
          <div style={ { display: 'flex', flexDirection: 'column', gap: 10 } }>
            {[
              { value: 'any', title: 'Any comment', desc: 'Send DM to everyone who comments on this post' },
              { value: 'keyword', title: 'Specific keywords', desc: 'Only send DM when comment contains one of your keywords' },
            ].map(opt => (
              <label key={opt.value} onClick={() => setTriggerType(opt.value as any)}
                style={ { display: 'flex', gap: 14, padding: '14px 16px', borderRadius: 'var(--radius-md)', border: `2px solid ${triggerType === opt.value ? 'var(--ink)' : 'var(--hairline)'}`, cursor: 'pointer', background: triggerType === opt.value ? 'var(--surface)' : 'transparent', transition: 'all 0.15s' } }>
                {/* Custom radio */}
                <div style={ { width: 18, height: 18, borderRadius: '50%', border: `2px solid ${triggerType === opt.value ? 'var(--ink)' : 'var(--stone)'}`, background: 'transparent', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, marginTop: 2 } }>
                  {triggerType === opt.value && <div style={ { width: 8, height: 8, borderRadius: '50%', background: 'var(--ink)' } } />}
                </div>
                <div style={ { flex: 1 } }>
                  <p style={ { fontSize: 14, fontWeight: 700, color: 'var(--ink)' } }>{opt.title}</p>
                  <p style={ { fontSize: 12, color: 'var(--mute)', marginTop: 2 } }>{opt.desc}</p>
                  {opt.value === 'keyword' && triggerType === 'keyword' && (
                    <div style={ { marginTop: 14 } }>
                      <div style={ { display: 'flex', flexWrap: 'wrap', gap: 6, marginBottom: 10 } }>
                        {keywords.map(kw => (
                          <span key={kw} style={ { display: 'flex', alignItems: 'center', gap: 4, background: 'var(--ink)', color: '#fff', borderRadius: 'var(--radius-full)', padding: '4px 12px', fontSize: 12, fontWeight: 700 } }>
                            {kw}
                            <button onClick={e => { e.stopPropagation(); setKeywords(prev => prev.filter(k => k !== kw)) }}
                              style={ { background: 'none', border: 'none', color: 'rgba(255,255,255,0.7)', cursor: 'pointer', fontSize: 14, lineHeight: 1, padding: 0 } }>×</button>
                          </span>
                        ))}
                      </div>
                      <div style={ { display: 'flex', gap: 8 } } onClick={e => e.stopPropagation()}>
                        <input type="text" value={keywordInput} onChange={e => setKeywordInput(e.target.value)}
                          onKeyDown={e => (e.key === 'Enter' || e.key === ',') && (e.preventDefault(), addKeyword())}
                          placeholder="Type keyword and press Enter" style={ { flex: 1 } } />
                        <button onClick={addKeyword} style={ { padding: '10px 16px', borderRadius: 'var(--radius-md)', background: 'var(--secondary-bg)', border: 'none', cursor: 'pointer', fontSize: 13, fontWeight: 700, color: 'var(--ink)' } }>Add</button>
                      </div>
                      <p style={ { fontSize: 11, color: 'var(--ash)', marginTop: 6 } }>Press Enter or comma to add. Not case sensitive.</p>
                    </div>
                  )}
                </div>
              </label>
            ))}
          </div>
        </div>

        {/* Step 2 — DM message */}
        <div style={ { background: 'var(--canvas)', borderRadius: 'var(--radius-md)', border: '1px solid var(--hairline)', padding: 24 } }>
          <StepLabel n={2} label="DM message" />
          <textarea value={dmMessage} onChange={e => setDmMessage(e.target.value)}
            placeholder="Hey! Here's the free guide you asked for 👉 [your link here]"
            rows={4} maxLength={1000} style={ { resize: 'none', width: '100%' } } />
          <div style={ { display: 'flex', justifyContent: 'space-between', marginTop: 8 } }>
            <p style={ { fontSize: 12, color: 'var(--ash)' } }>This message is sent automatically to every matching commenter</p>
            <p style={ { fontSize: 12, color: dmMessage.length > 900 ? 'var(--red)' : 'var(--ash)', fontWeight: dmMessage.length > 900 ? 700 : 400 } }>{dmMessage.length} / 1000</p>
          </div>

          {/* Optional CTA buttons (up to 3) */}
          <div style={ { marginTop: 20, paddingTop: 20, borderTop: '1px solid var(--hairline)' } }>
            <div style={ { display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 4 } }>
              <p style={ { fontSize: 13, fontWeight: 700, color: 'var(--ink)' } }>Buttons (optional)</p>
              <span style={ { fontSize: 12, color: 'var(--ash)' } }>{totalButtons} / 3</span>
            </div>
            <p style={ { fontSize: 12, color: 'var(--mute)', marginBottom: 12 } }>Add up to 3 tappable buttons that open a link inside the DM.</p>

            <div style={ { display: 'flex', flexDirection: 'column', gap: 12 } }>
              {dmButtons.map((btn, i) => (
                <div key={i} style={ { display: 'flex', flexDirection: 'column', gap: 8, padding: 12, background: 'var(--surface)', borderRadius: 'var(--radius-md)', border: '1px solid var(--hairline)' } }>
                  <div style={ { display: 'flex', alignItems: 'center', justifyContent: 'space-between' } }>
                    <span style={ { fontSize: 12, fontWeight: 700, color: 'var(--mute)' } }>Button {i + 1}</span>
                    <button onClick={() => removeButton(i)} style={ { background: 'none', border: 'none', color: 'var(--ash)', cursor: 'pointer', fontSize: 18, lineHeight: 1 } }>×</button>
                  </div>
                  <input type="text" value={btn.label} onChange={e => updateButton(i, 'label', e.target.value)} placeholder="Button label (e.g. Open PDF)" maxLength={20} />
                  <input type="url" value={btn.url} onChange={e => updateButton(i, 'url', e.target.value)} placeholder="https://your-link.com" />
                </div>
              ))}
            </div>

            {totalButtons < 3 && (
              <button onClick={addButton} style={ { marginTop: dmButtons.length > 0 ? 12 : 0, padding: '10px 16px', borderRadius: 'var(--radius-md)', background: 'var(--secondary-bg)', border: 'none', cursor: 'pointer', fontSize: 13, fontWeight: 700, color: 'var(--ink)' } }>
                + Add button
              </button>
            )}
            <p style={ { fontSize: 11, color: 'var(--ash)', marginTop: 8 } }>Max 3 buttons. Labels are limited to 20 characters.</p>

            {/* Follow me button toggle */}
            <div style={ { marginTop: 16, paddingTop: 16, borderTop: '1px dashed var(--hairline)' } }>
              <div style={ { display: 'flex', alignItems: 'center', justifyContent: 'space-between' } }>
                <div style={ { paddingRight: 12 } }>
                  <p style={ { fontSize: 13, fontWeight: 700, color: 'var(--ink)' } }>Add a "Follow me" button</p>
                  <p style={ { fontSize: 12, color: 'var(--mute)', marginTop: 2 } }>Auto-adds a button linking to @{profileUsername || 'your profile'} — always shown last.</p>
                </div>
                <button type="button" disabled={!followEnabled && dmButtons.length >= 3}
                  onClick={() => setFollowEnabled(v => !v)}
                  style={ { width: 44, height: 24, borderRadius: 'var(--radius-full)', background: followEnabled ? 'var(--ink)' : 'var(--stone)', border: 'none', cursor: (!followEnabled && dmButtons.length >= 3) ? 'not-allowed' : 'pointer', position: 'relative', transition: 'background 0.2s', flexShrink: 0, opacity: (!followEnabled && dmButtons.length >= 3) ? 0.5 : 1 } }>
                  <span style={ { position: 'absolute', top: 3, left: followEnabled ? 22 : 3, width: 18, height: 18, borderRadius: '50%', background: '#fff', transition: 'left 0.2s' } } />
                </button>
              </div>
              {!followEnabled && dmButtons.length >= 3 && (
                <p style={ { fontSize: 11, color: 'var(--red)', marginTop: 8 } }>You already have 3 buttons. Remove one to add a Follow button.</p>
              )}
              {followEnabled && (
                <div style={ { marginTop: 12 } }>
                  <label style={ { fontSize: 12, fontWeight: 600, color: 'var(--mute)', display: 'block', marginBottom: 6 } }>Button label</label>
                  <input type="text" value={followLabel} onChange={e => setFollowLabel(e.target.value)} placeholder="Follow me 👋" maxLength={20} />
                  <p style={ { fontSize: 11, color: 'var(--ash)', marginTop: 6 } }>Links to your profile automatically. Max 20 characters.</p>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Step 3 — Auto deactivate */}
        <div style={ { background: 'var(--canvas)', borderRadius: 'var(--radius-md)', border: '1px solid var(--hairline)', padding: 24 } }>
          <StepLabel n={3} label="Auto deactivate" />
          <p style={ { fontSize: 13, color: 'var(--mute)', marginBottom: 16, lineHeight: 1.6 } }>
            Automatically pause this automation after a set number of days. Useful for limited-time offers, giveaways, or launch posts. Set to 0 to never auto-deactivate.
          </p>
          <div style={ { display: 'flex', alignItems: 'center', gap: 12 } }>
            <input type="number" value={autoDeactivateDays} min={0} max={365}
              onChange={e => setAutoDeactivateDays(Number(e.target.value))}
              style={ { width: 80, textAlign: 'center', fontWeight: 700 } } />
            <span style={ { fontSize: 14, color: 'var(--ink)', fontWeight: 500 } }>days after creation</span>
            {autoDeactivateDays > 0 && automation?.created_at && (
              <span style={ { fontSize: 12, color: 'var(--ash)', background: 'var(--card)', padding: '4px 12px', borderRadius: 'var(--radius-full)' } }>
                Pauses on {new Date(new Date(automation.created_at).getTime() + autoDeactivateDays * 24 * 60 * 60 * 1000).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}
              </span>
            )}
            {autoDeactivateDays === 0 && (
              <span style={ { fontSize: 12, color: '#1a6b3a', background: '#e8f8ed', padding: '4px 12px', borderRadius: 'var(--radius-full)', fontWeight: 600 } }>
                Never auto-deactivates
              </span>
            )}
          </div>
          {/* Quick presets */}
          <div style={ { display: 'flex', gap: 8, marginTop: 14, flexWrap: 'wrap' } }>
            {[
              { label: '7 days', value: 7 },
              { label: '14 days', value: 14 },
              { label: '30 days', value: 30 },
              { label: '60 days', value: 60 },
              { label: 'Never', value: 0 },
            ].map(preset => (
              <button key={preset.value} onClick={() => setAutoDeactivateDays(preset.value)}
                style={ { padding: '6px 14px', borderRadius: 'var(--radius-full)', border: 'none', cursor: 'pointer', fontSize: 12, fontWeight: 700, background: autoDeactivateDays === preset.value ? 'var(--ink)' : 'var(--card)', color: autoDeactivateDays === preset.value ? '#fff' : 'var(--mute)', transition: 'all 0.15s' } }>
                {preset.label}
              </button>
            ))}
          </div>
        </div>

        {/* Step 4 — Public reply */}
        <div style={ { background: 'var(--canvas)', borderRadius: 'var(--radius-md)', border: '1px solid var(--hairline)', padding: 24, opacity: canReply ? 1 : 0.8 } }>
          <div style={ { display: 'flex', alignItems: 'center', gap: 8, marginBottom: 20 } }>
            <span style={ { width: 28, height: 28, borderRadius: '50%', background: 'var(--ink)', color: '#fff', fontSize: 12, fontWeight: 800, display: 'flex', alignItems: 'center', justifyContent: 'center' } }>4</span>
            <span style={ { fontSize: 14, fontWeight: 700, color: 'var(--ink)' } }>Public comment reply</span>
            <span style={ { background: '#fff0f0', color: 'var(--red)', borderRadius: 'var(--radius-full)', padding: '2px 10px', fontSize: 11, fontWeight: 700 } }>Starter+</span>
          </div>
          {!canReply ? (
            <div style={ { display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '16px 20px', background: 'var(--surface)', borderRadius: 'var(--radius-md)', border: '1px dashed var(--hairline)' } }>
              <div>
                <p style={ { fontSize: 13, fontWeight: 700, color: 'var(--ink)' } }>🔒 Available on Starter plan and above</p>
                <p style={ { fontSize: 12, color: 'var(--mute)', marginTop: 2 } }>Automatically reply to comments to drive more engagement</p>
              </div>
              <a href="/dashboard/billing" style={ { padding: '8px 16px', borderRadius: 'var(--radius-md)', background: 'var(--secondary-bg)', color: 'var(--ink)', fontSize: 13, fontWeight: 700, textDecoration: 'none' } }>Upgrade</a>
            </div>
          ) : (
            <div>
              <div style={ { display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16 } }>
                <div>
                  <p style={ { fontSize: 13, fontWeight: 600, color: 'var(--ink)' } }>Reply to comments publicly</p>
                  <p style={ { fontSize: 12, color: 'var(--mute)', marginTop: 2 } }>Post a reply like "Check your DMs!" — rotated randomly</p>
                </div>
                {/* Custom toggle */}
                <button onClick={() => setReplyEnabled(!replyEnabled)}
                  style={ { width: 40, height: 22, borderRadius: 'var(--radius-full)', background: replyEnabled ? 'var(--ink)' : 'var(--stone)', border: 'none', cursor: 'pointer', position: 'relative', transition: 'background 0.2s', flexShrink: 0 } }>
                  <span style={ { position: 'absolute', top: 3, left: replyEnabled ? 20 : 3, width: 16, height: 16, borderRadius: '50%', background: '#fff', transition: 'left 0.2s' } } />
                </button>
              </div>
              {replyEnabled && (
                <div>
                  <p style={ { fontSize: 12, fontWeight: 600, color: 'var(--mute)', marginBottom: 10 } }>Reply variations (picked randomly):</p>
                  <div style={ { display: 'flex', flexDirection: 'column', gap: 8, marginBottom: 12 } }>
                    {replyMessages.map((msg, i) => (
                      <div key={i} style={ { display: 'flex', gap: 8, alignItems: 'center' } }>
                        <span style={ { flex: 1, padding: '10px 14px', background: 'var(--surface)', borderRadius: 'var(--radius-md)', fontSize: 13, color: 'var(--ink)', border: '1px solid var(--hairline)' } }>{msg}</span>
                        <button onClick={() => replyMessages.length > 1 && setReplyMessages(prev => prev.filter((_, j) => j !== i))}
                          style={ { background: 'none', border: 'none', color: 'var(--ash)', cursor: 'pointer', fontSize: 18, lineHeight: 1 } }>×</button>
                      </div>
                    ))}
                  </div>
                  {replyMessages.length < 6 && (
                    <div style={ { display: 'flex', gap: 8 } }>
                      <input type="text" value={replyInput} onChange={e => setReplyInput(e.target.value)}
                        onKeyDown={e => e.key === 'Enter' && (replyInput.trim() && setReplyMessages(p => [...p, replyInput.trim()]), setReplyInput(''))}
                        placeholder="e.g. Check your DMs @username 📩" style={ { flex: 1 } } />
                      <button type="button" onClick={() => setReplyInput(prev => (prev + ' @username').trimStart())}
                        style={ { padding: '10px 14px', borderRadius: 'var(--radius-md)', background: 'var(--card)', border: 'none', cursor: 'pointer', fontSize: 13, fontWeight: 700, color: 'var(--ink)', whiteSpace: 'nowrap' } }>@ mention</button>
                      <button onClick={() => { if (replyInput.trim()) { setReplyMessages(p => [...p, replyInput.trim()]); setReplyInput('') } }}
                        style={ { padding: '10px 16px', borderRadius: 'var(--radius-md)', background: 'var(--secondary-bg)', border: 'none', cursor: 'pointer', fontSize: 13, fontWeight: 700, color: 'var(--ink)' } }>Add</button>
                    </div>
                  )}
                  <p style={ { fontSize: 11, color: 'var(--ash)', marginTop: 8 } }>
                    Tip: type <strong>@username</strong> anywhere and it becomes the commenter's handle (e.g. @shivam_united) automatically.
                  </p>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Error */}
        {error && (
          <div style={ { background: '#fff0f0', border: '1px solid #ffd0d0', borderRadius: 'var(--radius-md)', padding: '12px 16px', fontSize: 13, color: 'var(--red)', fontWeight: 500 } }>
            {error}
          </div>
        )}

        {/* Buttons */}
        <div style={ { display: 'flex', gap: 12, paddingBottom: 32 } }>
          <Link href="/dashboard/automations" style={ { flex: 1, padding: '13px', borderRadius: 'var(--radius-md)', background: 'var(--secondary-bg)', color: 'var(--ink)', fontSize: 15, fontWeight: 700, textDecoration: 'none', display: 'flex', alignItems: 'center', justifyContent: 'center' } }>Cancel</Link>
          <button onClick={handleSave} disabled={submitting}
            style={ { flex: 1, padding: '13px', borderRadius: 'var(--radius-md)', background: 'var(--red)', color: '#fff', border: 'none', cursor: submitting ? 'not-allowed' : 'pointer', fontSize: 15, fontWeight: 700, opacity: submitting ? 0.7 : 1 } }>
            {submitting ? 'Saving...' : 'Save changes →'}
          </button>
        </div>
      </div>
    </div>
  )
}