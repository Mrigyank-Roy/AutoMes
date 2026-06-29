'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { supabase } from '@/lib/supabase'

const features = [
  { icon: '⚡', title: 'DMs in under 3 seconds', desc: 'The moment someone comments, your DM goes out instantly. No delays, no batching.' },
  { icon: '🎯', title: 'Multiple keywords per post', desc: 'Set LINK, PDF, GUIDE — any of them triggers the DM. One automation, many triggers.' },
  { icon: '💬', title: 'Any comment trigger', desc: "Don't want keywords? DM everyone who comments. Perfect for giveaways and launches." },
  { icon: '🔄', title: 'Random reply rotation', desc: 'Set 4–5 public reply variations. AutoMes rotates them so replies look natural, not robotic.' },
  { icon: '🔒', title: 'Secure token management', desc: 'Your Instagram token is encrypted and auto-refreshed. Automations never break silently.' },
  { icon: '📊', title: 'Real-time analytics', desc: 'See exactly how many DMs went out, when, and to whom. Full logs per automation.' },
  { icon: '📱', title: 'Works on Reels, posts & carousels', desc: 'Any Instagram post type works. Set it up once and it runs on all your content.' },
  { icon: '🇮🇳', title: 'Built for India', desc: 'Pay via UPI, cards, or netbanking. Prices in INR. Support in your timezone.' },
]

const faqs = [
  { q: "Is this against Instagram's rules?", a: "No. AutoMes uses Meta's official Instagram Graph API — the same API that powers ManyChat and LinkDM. We're fully compliant with Meta's Platform Policies." },
  { q: 'Does it work with personal accounts?', a: "No — Instagram's API only allows Business and Creator accounts. Switching from personal to Creator takes 2 minutes and keeps all your followers." },
  { q: 'What happens when I hit my DM limit?', a: "Your automations pause. We send you an email warning before you hit the limit so you have time to upgrade. No DMs are lost permanently." },
  { q: 'Do my followers know the DM is automated?', a: "The DM looks exactly like a normal message from your account — no AutoMes label, no difference from a manually sent DM." },
  { q: 'Can I cancel anytime?', a: "Yes. Stop any automation instantly from your dashboard. For billing, contact support and we handle it within 24 hours." },
  { q: 'What payment methods do you accept?', a: "UPI (GPay, PhonePe, Paytm), credit/debit cards, and netbanking — all via Razorpay. Payments in INR, no international fees." },
]

export default function LandingPage() {
  const [plans, setPlans] = useState<any[]>([])
  const [isLoggedIn, setIsLoggedIn] = useState(false)
  const [scrolled, setScrolled] = useState(false)
  const [openFaq, setOpenFaq] = useState<number | null>(null)

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => setIsLoggedIn(!!session))
    supabase.from('plans').select('*').eq('is_active', true).order('sort_order').then(({ data }) => setPlans(data ?? []))
    const fn = () => setScrolled(window.scrollY > 8)
    window.addEventListener('scroll', fn)
    return () => window.removeEventListener('scroll', fn)
  }, [])

  return (
    <div style={ { minHeight: '100vh', background: 'var(--surface)' } }>
      {/* NAV */}
      <nav style={ {
        position: 'fixed', top: 0, left: 0, right: 0, zIndex: 100,
        background: scrolled ? 'rgba(251,251,249,0.92)' : 'transparent',
        backdropFilter: scrolled ? 'blur(12px)' : 'none',
        borderBottom: scrolled ? '1px solid var(--hairline)' : 'none',
        transition: 'all 0.2s',
      } }>
        <div style={ { maxWidth: 1200, margin: '0 auto', padding: '0 24px', height: 64, display: 'flex', alignItems: 'center', justifyContent: 'space-between' } }>
          <Link href="/" style={ { fontSize: 22, fontWeight: 800, color: 'var(--red)', textDecoration: 'none', letterSpacing: '-0.5px' } }>AutoMes</Link>
          <div style={ { display: 'flex', gap: 32, alignItems: 'center' } }>
            {['How it works', 'Features', 'Pricing', 'FAQ'].map(label => (
              <a key={label} href={`#${label.toLowerCase().replace(/ /g, '-')}`}
                style={ { fontSize: 14, fontWeight: 500, color: 'var(--mute)', textDecoration: 'none' } }>
                {label}
              </a>
            ))}
          </div>
          <div style={ { display: 'flex', gap: 8, alignItems: 'center' } }>
            {isLoggedIn ? (
              <Link href="/dashboard" className="btn-primary">Dashboard →</Link>
            ) : (
              <>
                <Link href="/login" className="btn-ghost">Log in</Link>
                <Link href="/signup" className="btn-primary">Start free →</Link>
              </>
            )}
          </div>
        </div>
      </nav>

      {/* HERO */}
      <section style={ { paddingTop: 140, paddingBottom: 80, paddingLeft: 24, paddingRight: 24, textAlign: 'center' } }>
        <div style={ { maxWidth: 800, margin: '0 auto' } }>
          <div style={ {
            display: 'inline-block', background: '#fff0f0', color: 'var(--red)',
            borderRadius: 'var(--radius-full)', padding: '6px 16px', fontSize: 13,
            fontWeight: 700, marginBottom: 28, border: '1px solid #ffd0d0'
          } }>
            🇮🇳 Built for Indian creators & businesses
          </div>
          <h1 style={ { fontSize: 64, fontWeight: 800, lineHeight: 1.08, letterSpacing: -2, color: 'var(--ink)', marginBottom: 24 } }>
            Turn Instagram comments<br />
            <span style={ { color: 'var(--red)' } }>into automatic DMs</span>
          </h1>
          <p style={ { fontSize: 20, color: 'var(--mute)', lineHeight: 1.6, marginBottom: 12, maxWidth: 560, margin: '0 auto 12px' } }>
            Someone comments <code style={ { background: 'var(--card)', padding: '2px 8px', borderRadius: 6, fontSize: 16, fontFamily: 'monospace', color: 'var(--ink)' } }>"LINK"</code> on your post → they get your link in their DMs within seconds. Automatically.
          </p>
          <p style={ { fontSize: 14, color: 'var(--ash)', marginBottom: 40 } }>
            Works on Reels, posts, and carousels · UPI payments accepted · Cancel anytime
          </p>
          <div style={ { display: 'flex', gap: 12, justifyContent: 'center', flexWrap: 'wrap' } }>
            <Link href="/signup" className="btn-primary" style={ { fontSize: 16, padding: '14px 32px', borderRadius: 'var(--radius-md)' } }>
              Start for free →
            </Link>
            <a href="#how-it-works" className="btn-secondary" style={ { fontSize: 16, padding: '14px 32px', borderRadius: 'var(--radius-md)' } }>
              See how it works
            </a>
          </div>
          <p style={ { fontSize: 12, color: 'var(--ash)', marginTop: 16 } }>Free trial included · No credit card required</p>

          {/* Dashboard preview */}
          <div style={ {
            marginTop: 60, borderRadius: 'var(--radius-lg)', border: '1px solid var(--hairline)',
            background: 'var(--canvas)', overflow: 'hidden', boxShadow: '0 20px 60px rgba(0,0,0,0.08)'
          } }>
            <div style={ { background: 'var(--card)', padding: '12px 16px', display: 'flex', alignItems: 'center', gap: 8, borderBottom: '1px solid var(--hairline)' } }>
              <div style={ { width: 10, height: 10, borderRadius: '50%', background: '#ff5f56' } } />
              <div style={ { width: 10, height: 10, borderRadius: '50%', background: '#ffbd2e' } } />
              <div style={ { width: 10, height: 10, borderRadius: '50%', background: '#27c93f' } } />
              <span style={ { fontSize: 12, color: 'var(--ash)', marginLeft: 8 } }>auto-mes.vercel.app/dashboard</span>
            </div>
            <div style={ { padding: 24 } }>
              <div style={ { display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: 16, marginBottom: 20 } }>
                {[
                  { label: 'DMs this month', value: '347', sub: '/ 500' },
                  { label: 'DMs today', value: '23', sub: 'since midnight' },
                  { label: 'Active automations', value: '4', sub: 'running now' },
                ].map(s => (
                  <div key={s.label} style={ { background: 'var(--card)', borderRadius: 'var(--radius-md)', padding: '16px 20px', textAlign: 'left' } }>
                    <p style={ { fontSize: 12, color: 'var(--ash)', marginBottom: 6 } }>{s.label}</p>
                    <p style={ { fontSize: 28, fontWeight: 700, color: 'var(--ink)', lineHeight: 1 } }>
                      {s.value}<span style={ { fontSize: 14, color: 'var(--stone)', fontWeight: 400 } }> {s.sub}</span>
                    </p>
                  </div>
                ))}
              </div>
              <div style={ { background: 'var(--card)', borderRadius: 'var(--radius-md)', padding: '16px 20px', display: 'flex', alignItems: 'center', gap: 16 } }>
                <div style={ { width: 48, height: 48, borderRadius: 'var(--radius-sm)', background: 'var(--secondary-bg)' } } />
                <div style={ { flex: 1 } }>
                  <p style={ { fontSize: 13, fontWeight: 600, color: 'var(--ink)' } }>@youraccount · "My latest Reel"</p>
                  <div style={ { display: 'flex', gap: 6, marginTop: 6 } }>
                    {['LINK', 'PDF', 'GUIDE'].map(kw => (
                      <span key={kw} style={ { background: 'var(--secondary-bg)', borderRadius: 'var(--radius-full)', padding: '2px 10px', fontSize: 11, fontWeight: 700, color: 'var(--ink-soft)' } }>{kw}</span>
                    ))}
                  </div>
                </div>
                <div style={ { textAlign: 'right' } }>
                  <p style={ { fontSize: 12, color: 'var(--ash)' } }>247 DMs sent</p>
                  <span style={ { background: '#e8f8ed', color: '#1a6b3a', borderRadius: 'var(--radius-full)', padding: '3px 10px', fontSize: 11, fontWeight: 700 } }>Active</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* HOW IT WORKS */}
      <section id="how-it-works" style={ { padding: '80px 24px', background: 'var(--canvas)' } }>
        <div style={ { maxWidth: 1000, margin: '0 auto' } }>
          <p style={ { fontSize: 12, fontWeight: 700, color: 'var(--red)', textTransform: 'uppercase', letterSpacing: 2, textAlign: 'center', marginBottom: 12 } }>How it works</p>
          <h2 style={ { fontSize: 40, fontWeight: 800, letterSpacing: -1, textAlign: 'center', color: 'var(--ink)', marginBottom: 60 } }>Set up in under 5 minutes</h2>
          <div style={ { display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: 24 } }>
            {[
              { step: '01', icon: '📱', title: 'Connect your Instagram', desc: "Link your Business or Creator account with one click. We use Instagram's official API — no passwords shared." },
              { step: '02', icon: '⚡', title: 'Set your trigger', desc: 'Paste your post URL, choose keywords like "LINK" or "PDF", or trigger on any comment. Add your DM message.' },
              { step: '03', icon: '🎉', title: 'DMs go out automatically', desc: "That's it. Every time someone comments your keyword, they get your DM within seconds. You do nothing." },
            ].map(item => (
              <div key={item.step} style={ { padding: 32, background: 'var(--surface)', borderRadius: 'var(--radius-md)', border: '1px solid var(--hairline)', position: 'relative' } }>
                <span style={ { position: 'absolute', top: 20, right: 24, fontSize: 13, fontWeight: 800, color: 'var(--hairline)', fontFamily: 'monospace' } }>{item.step}</span>
                <div style={ { fontSize: 36, marginBottom: 16 } }>{item.icon}</div>
                <h3 style={ { fontSize: 18, fontWeight: 700, color: 'var(--ink)', marginBottom: 10 } }>{item.title}</h3>
                <p style={ { fontSize: 14, color: 'var(--mute)', lineHeight: 1.6 } }>{item.desc}</p>
              </div>
            ))}
          </div>

          {/* Flow */}
          <div style={ { marginTop: 48, padding: 28, background: 'var(--surface)', borderRadius: 'var(--radius-md)', border: '1px solid var(--hairline)', display: 'flex', alignItems: 'center', gap: 12, flexWrap: 'wrap', justifyContent: 'center' } }>
            {[
              { label: 'Comment "LINK"', bg: 'var(--card)', color: 'var(--ink)' },
              { label: '→', bg: 'transparent', color: 'var(--stone)' },
              { label: 'AutoMes detects it', bg: '#e8f0fe', color: '#1a4fb5' },
              { label: '→', bg: 'transparent', color: 'var(--stone)' },
              { label: 'DM sent in 2–3s', bg: '#e8f8ed', color: '#1a6b3a' },
              { label: '→', bg: 'transparent', color: 'var(--stone)' },
              { label: 'Follower gets the link', bg: 'var(--ink)', color: '#fff' },
            ].map((item, i) => (
              <span key={i} style={ { background: item.bg, color: item.color, padding: item.bg === 'transparent' ? '0' : '8px 16px', borderRadius: 'var(--radius-full)', fontSize: 13, fontWeight: item.bg === 'transparent' ? 400 : 700 } }>{item.label}</span>
            ))}
          </div>
        </div>
      </section>

      {/* FEATURES */}
      <section id="features" style={ { padding: '80px 24px', background: 'var(--surface)' } }>
        <div style={ { maxWidth: 1100, margin: '0 auto' } }>
          <p style={ { fontSize: 12, fontWeight: 700, color: 'var(--red)', textTransform: 'uppercase', letterSpacing: 2, textAlign: 'center', marginBottom: 12 } }>Features</p>
          <h2 style={ { fontSize: 40, fontWeight: 800, letterSpacing: -1, textAlign: 'center', color: 'var(--ink)', marginBottom: 12 } }>Everything you need</h2>
          <p style={ { textAlign: 'center', color: 'var(--mute)', marginBottom: 56, fontSize: 16 } }>No fluff. Every feature exists because real creators needed it.</p>
          <div style={ { display: 'grid', gridTemplateColumns: 'repeat(4,1fr)', gap: 16 } }>
            {features.map(f => (
              <div key={f.title} style={ { padding: 24, background: 'var(--canvas)', borderRadius: 'var(--radius-md)', border: '1px solid var(--hairline)', transition: 'border-color 0.15s', cursor: 'default' } }
                onMouseEnter={e => (e.currentTarget.style.borderColor = 'var(--stone)')}
                onMouseLeave={e => (e.currentTarget.style.borderColor = 'var(--hairline)')}>
                <div style={ { fontSize: 28, marginBottom: 14 } }>{f.icon}</div>
                <h3 style={ { fontSize: 14, fontWeight: 700, color: 'var(--ink)', marginBottom: 8 } }>{f.title}</h3>
                <p style={ { fontSize: 13, color: 'var(--mute)', lineHeight: 1.6 } }>{f.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* PRICING */}
      <section id="pricing" style={ { padding: '80px 24px', background: 'var(--canvas)' } }>
        <div style={ { maxWidth: 1000, margin: '0 auto' } }>
          <p style={ { fontSize: 12, fontWeight: 700, color: 'var(--red)', textTransform: 'uppercase', letterSpacing: 2, textAlign: 'center', marginBottom: 12 } }>Pricing</p>
          <h2 style={ { fontSize: 40, fontWeight: 800, letterSpacing: -1, textAlign: 'center', color: 'var(--ink)', marginBottom: 12 } }>Simple, honest pricing</h2>
          <p style={ { textAlign: 'center', color: 'var(--mute)', marginBottom: 56, fontSize: 16 } }>Start free. Upgrade when you're ready. Cancel anytime.</p>
          <div style={ { display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: 20 } }>
            {plans.filter(p => p.id !== 'trial').map(plan => {
              const isPro = plan.id === 'pro'
              return (
                <div key={plan.id} style={ {
                  background: isPro ? 'var(--ink)' : 'var(--canvas)',
                  borderRadius: 'var(--radius-lg)',
                  border: isPro ? 'none' : '1px solid var(--hairline)',
                  padding: 32,
                  position: 'relative',
                  transform: isPro ? 'scale(1.02)' : 'none',
                } }>
                  {isPro && (
                    <span style={ { position: 'absolute', top: -12, left: '50%', transform: 'translateX(-50%)', background: 'var(--red)', color: '#fff', fontSize: 11, fontWeight: 800, padding: '4px 14px', borderRadius: 'var(--radius-full)' } }>
                      Most popular
                    </span>
                  )}
                  <p style={ { fontSize: 16, fontWeight: 700, color: isPro ? '#fff' : 'var(--ink)', marginBottom: 8 } }>{plan.name}</p>
                  <div style={ { marginBottom: 24 } }>
                    <span style={ { fontSize: 36, fontWeight: 800, color: isPro ? '#fff' : 'var(--ink)' } }>₹{plan.price_inr.toLocaleString()}</span>
                    <span style={ { fontSize: 14, color: isPro ? 'rgba(255,255,255,0.6)' : 'var(--ash)' } }>/month</span>
                  </div>
                  <div style={ { display: 'flex', flexDirection: 'column', gap: 10, marginBottom: 28 } }>
                    {[
                      `${plan.dm_limit.toLocaleString()} DMs/month`,
                      `${plan.account_limit} Instagram account${plan.account_limit > 1 ? 's' : ''}`,
                      plan.allows_comment_reply ? 'Public comment reply ✓' : 'Public comment reply ✗',
                      'All trigger types',
                      'Real-time analytics',
                    ].map((item, i) => (
                      <div key={i} style={ { display: 'flex', gap: 8, alignItems: 'center' } }>
                        <span style={ { color: isPro ? '#4ade80' : '#22c55e', fontWeight: 700 } }>
                          {item.includes('✗') ? '✗' : '✓'}
                        </span>
                        <span style={ { fontSize: 13, color: isPro ? 'rgba(255,255,255,0.85)' : 'var(--body)', opacity: item.includes('✗') ? 0.5 : 1 } }>
                          {item.replace(' ✓', '').replace(' ✗', '')}
                        </span>
                      </div>
                    ))}
                  </div>
                  <Link href="/signup" style={ {
                    display: 'block', textAlign: 'center', padding: '12px', borderRadius: 'var(--radius-md)',
                    background: isPro ? 'var(--red)' : 'var(--secondary-bg)',
                    color: isPro ? '#fff' : 'var(--ink)',
                    fontWeight: 700, fontSize: 14, textDecoration: 'none',
                    transition: 'opacity 0.15s',
                  } }>
                    Get started →
                  </Link>
                </div>
              )
            })}
          </div>
          <p style={ { textAlign: 'center', marginTop: 32, fontSize: 14, color: 'var(--mute)' } }>
            Not ready to pay?{' '}
            <Link href="/signup" style={ { color: 'var(--ink)', fontWeight: 600 } }>Start with the free trial</Link>
            {' '}— no credit card needed.
          </p>
        </div>
      </section>

      {/* FAQ */}
      <section id="faq" style={ { padding: '80px 24px', background: 'var(--surface)' } }>
        <div style={ { maxWidth: 720, margin: '0 auto' } }>
          <p style={ { fontSize: 12, fontWeight: 700, color: 'var(--red)', textTransform: 'uppercase', letterSpacing: 2, textAlign: 'center', marginBottom: 12 } }>FAQ</p>
          <h2 style={ { fontSize: 40, fontWeight: 800, letterSpacing: -1, textAlign: 'center', color: 'var(--ink)', marginBottom: 48 } }>Common questions</h2>
          <div style={ { display: 'flex', flexDirection: 'column', gap: 8 } }>
            {faqs.map((faq, i) => (
              <div key={i} style={ { background: 'var(--canvas)', borderRadius: 'var(--radius-md)', border: '1px solid var(--hairline)', overflow: 'hidden' } }>
                <button onClick={() => setOpenFaq(openFaq === i ? null : i)}
                  style={ { width: '100%', padding: '18px 24px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: 'none', border: 'none', cursor: 'pointer', textAlign: 'left' } }>
                  <span style={ { fontSize: 15, fontWeight: 600, color: 'var(--ink)' } }>{faq.q}</span>
                  <span style={ { fontSize: 20, color: 'var(--ash)', transition: 'transform 0.2s', transform: openFaq === i ? 'rotate(45deg)' : 'none', flexShrink: 0, marginLeft: 12 } }>+</span>
                </button>
                {openFaq === i && (
                  <div style={ { padding: '0 24px 20px', fontSize: 14, color: 'var(--mute)', lineHeight: 1.7 } }>
                    {faq.a}
                  </div>
                )}
              </div>
            ))}
          </div>
          <div style={ { marginTop: 40, padding: 28, background: 'var(--canvas)', borderRadius: 'var(--radius-md)', border: '1px solid var(--hairline)', textAlign: 'center' } }>
            <p style={ { fontSize: 14, fontWeight: 600, color: 'var(--ink)', marginBottom: 4 } }>Still have questions?</p>
            <p style={ { fontSize: 13, color: 'var(--mute)' } }>
              Email us at{' '}
              <a href="mailto:support@auto-mes.vercel.app" style={ { color: 'var(--red)', fontWeight: 600 } }>support@auto-mes.vercel.app</a>
            </p>
          </div>
        </div>
      </section>

      {/* CTA BANNER */}
      <section style={ { padding: '80px 24px', background: 'var(--ink)' } }>
        <div style={ { maxWidth: 600, margin: '0 auto', textAlign: 'center' } }>
          <h2 style={ { fontSize: 44, fontWeight: 800, color: '#fff', letterSpacing: -1, marginBottom: 16 } }>Start automating today</h2>
          <p style={ { fontSize: 18, color: 'rgba(255,255,255,0.6)', marginBottom: 36 } }>Join creators turning every comment into a conversation.</p>
          <Link href="/signup" style={ {
            display: 'inline-block', background: 'var(--red)', color: '#fff',
            padding: '14px 36px', borderRadius: 'var(--radius-md)', fontWeight: 700,
            fontSize: 16, textDecoration: 'none',
          } }>
            Get started for free →
          </Link>
          <p style={ { fontSize: 12, color: 'rgba(255,255,255,0.4)', marginTop: 16 } }>Free trial · No credit card required · Cancel anytime</p>
        </div>
      </section>

      {/* FOOTER */}
      <footer style={ { background: 'var(--canvas)', borderTop: '1px solid var(--hairline)', padding: '60px 24px 32px' } }>
        <div style={ { maxWidth: 1100, margin: '0 auto' } }>
          <div style={ { display: 'grid', gridTemplateColumns: '2fr 1fr 1fr 1fr', gap: 40, marginBottom: 48 } }>
            <div>
              <p style={ { fontSize: 20, fontWeight: 800, color: 'var(--red)', marginBottom: 10 } }>AutoMes</p>
              <p style={ { fontSize: 13, color: 'var(--mute)', lineHeight: 1.7, maxWidth: 260 } }>
                Turn Instagram comments into automatic DMs. Built for Indian creators and businesses.
              </p>
            </div>
            {[
              { title: 'Product', links: [['How it works', '#how-it-works'], ['Features', '#features'], ['Pricing', '#pricing'], ['FAQ', '#faq']] },
              { title: 'Account', links: [['Sign up', '/signup'], ['Log in', '/login'], ['Dashboard', '/dashboard'], ['Billing', '/dashboard/billing']] },
              { title: 'Legal', links: [['Privacy Policy', '/privacy'], ['Terms of Service', '/terms'], ['Data Deletion', '/data-deletion']] },
            ].map(col => (
              <div key={col.title}>
                <p style={ { fontSize: 13, fontWeight: 700, color: 'var(--ink)', marginBottom: 14 } }>{col.title}</p>
                <div style={ { display: 'flex', flexDirection: 'column', gap: 10 } }>
                  {col.links.map(([label, href]) => (
                    <a key={label} href={href} style={ { fontSize: 13, color: 'var(--mute)', textDecoration: 'none' } }>{label}</a>
                  ))}
                </div>
              </div>
            ))}
          </div>
          <div style={ { borderTop: '1px solid var(--hairline)', paddingTop: 24, display: 'flex', justifyContent: 'space-between', alignItems: 'center' } }>
            <p style={ { fontSize: 12, color: 'var(--ash)' } }>© {new Date().getFullYear()} AutoMes. All rights reserved.</p>
            <p style={ { fontSize: 12, color: 'var(--ash)' } }>Made in India 🇮🇳</p>
          </div>
        </div>
      </footer>
    </div>
  )
}