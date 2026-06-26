'use client'
import { useState } from 'react'
import Link from 'next/link'

const items = [
  {
    category: 'Public URLs',
    checks: [
      { label: 'Privacy Policy live at /privacy', href: '/privacy' },
      { label: 'Terms of Service live at /terms', href: '/terms' },
      { label: 'Landing page live at /', href: '/' },
    ]
  },
  {
    category: 'App features',
    checks: [
      { label: 'Users can connect their Instagram account', href: '/dashboard/settings' },
      { label: 'Users can create automations', href: '/dashboard/automations/new' },
      { label: 'Users can disconnect their Instagram account', href: '/dashboard/settings' },
      { label: 'Opt-out (STOP reply) is handled in webhook', href: null },
      { label: 'Message deletion webhook is handled', href: null },
      { label: 'DM logs showing usage', href: '/dashboard/logs' },
    ]
  },
  {
    category: 'Meta developer dashboard',
    checks: [
      { label: 'App icon uploaded (1024x1024 PNG)', href: 'https://developers.facebook.com' },
      { label: 'App description filled in', href: 'https://developers.facebook.com' },
      { label: 'Privacy Policy URL entered in app settings', href: 'https://developers.facebook.com' },
      { label: 'Terms of Service URL entered in app settings', href: 'https://developers.facebook.com' },
      { label: 'Webhook URL updated to Vercel URL (not ngrok)', href: 'https://developers.facebook.com' },
      { label: 'All webhook fields subscribed (comments, messages)', href: 'https://developers.facebook.com' },
    ]
  },
  {
    category: 'Screencasts to record',
    checks: [
      { label: 'Screencast for instagram_business_manage_comments (2-5 min, 1080p)', href: null },
      { label: 'Screencast for instagram_business_manage_messages (2-5 min, 1080p)', href: null },
      { label: 'Both screencasts show complete user journey with audio narration', href: null },
      { label: 'Opt-out mechanism visible in screencast', href: null },
    ]
  },
  {
    category: 'Use case descriptions',
    checks: [
      { label: 'Written use case for instagram_business_manage_comments', href: null },
      { label: 'Written use case for instagram_business_manage_messages', href: null },
    ]
  },
  {
    category: 'Business verification',
    checks: [
      { label: 'Become a Tech Provider application submitted', href: 'https://developers.facebook.com' },
      { label: 'Business details filled in Meta dashboard', href: 'https://developers.facebook.com' },
    ]
  },
]

export default function ReviewChecklistPage() {
  const totalItems = items.flatMap(i => i.checks).length
  const [checked, setChecked] = useState<Record<string, boolean>>({})
  const completedCount = Object.values(checked).filter(Boolean).length

  function toggle(key: string) {
    setChecked(prev => ({ ...prev, [key]: !prev[key] }))
  }

  const pct = Math.round((completedCount / totalItems) * 100)

  return (
    <div style={{ maxWidth: 720 }}>
      <div style={{ marginBottom: 32 }}>
        <h1 style={{ fontSize: 28, fontWeight: 800, color: 'var(--ink)', letterSpacing: -0.5 }}>App Review Checklist</h1>
        <p style={{ fontSize: 14, color: 'var(--mute)', marginTop: 4 }}>Complete all items before submitting to Meta for App Review</p>
      </div>

      {/* Progress */}
      <div style={{ background: 'var(--canvas)', borderRadius: 'var(--radius-md)', border: '1px solid var(--hairline)', padding: 24, marginBottom: 24 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 10 }}>
          <p style={{ fontSize: 14, fontWeight: 700, color: 'var(--ink)' }}>{completedCount} of {totalItems} completed</p>
          <p style={{ fontSize: 14, fontWeight: 700, color: pct === 100 ? '#1a6b3a' : 'var(--ink)' }}>{pct}%</p>
        </div>
        <div style={{ height: 10, background: 'var(--card)', borderRadius: 'var(--radius-full)', overflow: 'hidden' }}>
          <div style={{ height: '100%', width: `${pct}%`, background: pct === 100 ? '#22c55e' : 'var(--red)', borderRadius: 'var(--radius-full)', transition: 'width 0.4s' }} />
        </div>
        {pct === 100 && (
          <p style={{ fontSize: 13, color: '#1a6b3a', fontWeight: 700, marginTop: 12, textAlign: 'center' }}>
            🎉 All items complete! You're ready to submit App Review.
          </p>
        )}
      </div>

      {/* Checklist */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
        {items.map(section => (
          <div key={section.category} style={{ background: 'var(--canvas)', borderRadius: 'var(--radius-md)', border: '1px solid var(--hairline)', overflow: 'hidden' }}>
            <div style={{ padding: '14px 20px', background: 'var(--surface)', borderBottom: '1px solid var(--hairline)' }}>
              <p style={{ fontSize: 13, fontWeight: 700, color: 'var(--ink)' }}>{section.category}</p>
              <p style={{ fontSize: 11, color: 'var(--ash)', marginTop: 2 }}>
                {section.checks.filter(c => checked[`${section.category}-${c.label}`]).length} / {section.checks.length} done
              </p>
            </div>
            <div style={{ padding: '8px 0' }}>
              {section.checks.map(check => {
                const key = `${section.category}-${check.label}`
                const isDone = checked[key]
                return (
                  <div key={key} style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '12px 20px', borderBottom: '1px solid var(--hairline)', cursor: 'pointer', transition: 'background 0.15s' }}
                    onClick={() => toggle(key)}
                    onMouseEnter={e => e.currentTarget.style.background = 'var(--surface)'}
                    onMouseLeave={e => e.currentTarget.style.background = 'transparent'}>
                    {/* Checkbox */}
                    <div style={{ width: 20, height: 20, borderRadius: 6, border: `2px solid ${isDone ? 'var(--ink)' : 'var(--stone)'}`, background: isDone ? 'var(--ink)' : 'transparent', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, transition: 'all 0.15s' }}>
                      {isDone && <span style={{ color: '#fff', fontSize: 12, lineHeight: 1 }}>✓</span>}
                    </div>
                    <span style={{ fontSize: 13, color: isDone ? 'var(--ash)' : 'var(--ink)', textDecoration: isDone ? 'line-through' : 'none', flex: 1, fontWeight: isDone ? 400 : 500 }}>
                      {check.label}
                    </span>
                    {check.href && (
                      <a href={check.href} target={check.href.startsWith('http') ? '_blank' : '_self'} rel="noreferrer"
                        onClick={e => e.stopPropagation()}
                        style={{ fontSize: 11, color: 'var(--red)', fontWeight: 700, textDecoration: 'none', padding: '4px 10px', background: '#fff0f0', borderRadius: 'var(--radius-full)', whiteSpace: 'nowrap' }}>
                        Open →
                      </a>
                    )}
                  </div>
                )
              })}
            </div>
          </div>
        ))}
      </div>

      {/* Submission button */}
      <div style={{ marginTop: 24, padding: 24, background: pct === 100 ? '#e8f8ed' : 'var(--canvas)', borderRadius: 'var(--radius-md)', border: `1px solid ${pct === 100 ? '#a3d9b8' : 'var(--hairline)'}`, textAlign: 'center' }}>
        {pct === 100 ? (
          <>
            <p style={{ fontSize: 15, fontWeight: 700, color: '#1a6b3a', marginBottom: 12 }}>✅ Ready to submit!</p>
            <a href="https://developers.facebook.com" target="_blank" rel="noreferrer"
              className="btn-primary" style={{ display: 'inline-flex', padding: '12px 28px', fontSize: 14 }}>
              Go to Meta App Review →
            </a>
          </>
        ) : (
          <>
            <p style={{ fontSize: 14, color: 'var(--mute)', marginBottom: 8 }}>Complete all {totalItems - completedCount} remaining items before submitting</p>
            <p style={{ fontSize: 12, color: 'var(--ash)' }}>Meta reviewers check everything on this list. Missing items = rejection.</p>
          </>
        )}
      </div>

      {/* Screencast guide */}
      <div style={{ marginTop: 16, background: 'var(--canvas)', borderRadius: 'var(--radius-md)', border: '1px solid var(--hairline)', padding: 24 }}>
        <p style={{ fontSize: 14, fontWeight: 700, color: 'var(--ink)', marginBottom: 16 }}>📹 Screencast guide</p>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
          {[
            {
              title: 'instagram_business_manage_comments',
              steps: [
                'Log in to AutoMes',
                'Go to Create automation',
                'Paste an Instagram post URL',
                'Show the keyword field — type "LINK"',
                'Show the DM message field',
                'Click Create automation',
                'Go to automations list — show it\'s active',
                'Narrate: "We use this permission to detect keyword triggers in comments in real time"',
              ]
            },
            {
              title: 'instagram_business_manage_messages',
              steps: [
                'Continue from the comments screencast',
                'Go to DM Logs — show a test log entry',
                'Show the Settings page → Connected accounts → Disconnect button (opt-out proof)',
                'Narrate: "We use this permission to send a DM to the commenter containing the link they requested by commenting a keyword"',
                'Narrate: "Users can opt out at any time by replying STOP or by disconnecting their account"',
              ]
            }
          ].map(sc => (
            <div key={sc.title}>
              <p style={{ fontSize: 13, fontWeight: 700, color: 'var(--ink)', fontFamily: 'monospace', background: 'var(--card)', padding: '4px 10px', borderRadius: 6, display: 'inline-block', marginBottom: 10 }}>{sc.title}</p>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                {sc.steps.map((step, i) => (
                  <div key={i} style={{ display: 'flex', gap: 10, alignItems: 'flex-start' }}>
                    <span style={{ fontSize: 11, fontWeight: 700, color: 'var(--red)', background: '#fff0f0', borderRadius: 'var(--radius-full)', width: 20, height: 20, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, marginTop: 1 }}>{i + 1}</span>
                    <p style={{ fontSize: 13, color: 'var(--body)', lineHeight: 1.5 }}>{step}</p>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Use case descriptions */}
      <div style={{ marginTop: 16, background: 'var(--canvas)', borderRadius: 'var(--radius-md)', border: '1px solid var(--hairline)', padding: 24 }}>
        <p style={{ fontSize: 14, fontWeight: 700, color: 'var(--ink)', marginBottom: 16 }}>📝 Use case descriptions (copy these into Meta)</p>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
          {[
            {
              permission: 'instagram_business_manage_comments',
              text: `AutoMes enables Instagram Business and Creator account owners to automatically respond to commenters on their posts via direct message.\n\nWe use instagram_business_manage_comments to:\n1. Receive real-time webhook notifications when users comment on posts that have active automations\n2. Read the comment text to check if it contains the keyword(s) configured by the business owner (e.g. "LINK", "PDF", "GUIDE")\n3. Optionally post a public reply to the comment (e.g. "Check your DMs!") to acknowledge the interaction\n\nWe only access comments on posts where the business owner has explicitly created an automation. We do not access, store, or process comments on any other posts.`
            },
            {
              permission: 'instagram_business_manage_messages',
              text: `AutoMes uses instagram_business_manage_messages to send a single direct message to users who comment a specific keyword on an Instagram Business post.\n\nThe use case is:\n- A creator posts "Comment LINK for my free PDF"\n- A follower comments "LINK"\n- AutoMes automatically sends that follower the PDF link via DM\n\nThis replaces the manual process of DMing every commenter individually. The DM is sent only to users who have explicitly commented a keyword, indicating they want to receive this information.\n\nUsers can opt out by replying "STOP" or "UNSUBSCRIBE" to any automated DM. Business account owners can delete automations at any time from the AutoMes dashboard.`
            }
          ].map(uc => (
            <div key={uc.permission}>
              <p style={{ fontSize: 13, fontWeight: 700, color: 'var(--ink)', fontFamily: 'monospace', background: 'var(--card)', padding: '4px 10px', borderRadius: 6, display: 'inline-block', marginBottom: 10 }}>{uc.permission}</p>
              <div style={{ background: 'var(--surface)', borderRadius: 'var(--radius-md)', border: '1px solid var(--hairline)', padding: 16, position: 'relative' }}>
                <pre style={{ fontSize: 12, color: 'var(--body)', lineHeight: 1.7, whiteSpace: 'pre-wrap', fontFamily: 'inherit', margin: 0 }}>{uc.text}</pre>
                <button onClick={() => navigator.clipboard.writeText(uc.text)}
                  style={{ position: 'absolute', top: 12, right: 12, background: 'var(--secondary-bg)', border: 'none', borderRadius: 'var(--radius-sm)', padding: '4px 10px', fontSize: 11, fontWeight: 700, color: 'var(--mute)', cursor: 'pointer' }}>
                  Copy
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}