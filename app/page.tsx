'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from '@/components/ui/accordion'
import { supabase } from '@/lib/supabase'
import Navbar from '@/components/landing/navbar'
import Footer from '@/components/landing/footer'

const features = [
  {
    icon: '⚡',
    title: 'DMs in under 3 seconds',
    description: 'The moment someone comments, your DM goes out instantly. No delays, no batch processing.'
  },
  {
    icon: '🎯',
    title: 'Multiple keywords per post',
    description: 'Set LINK, PDF, GUIDE — any of them triggers the DM. One automation, many triggers.'
  },
  {
    icon: '💬',
    title: 'Any comment trigger',
    description: 'Don\'t want keywords? DM everyone who comments. Perfect for giveaways and launches.'
  },
  {
    icon: '🔄',
    title: 'Random reply rotation',
    description: 'Set 4-5 public reply variations. AutoMes rotates them so your replies look natural, not robotic.'
  },
  {
    icon: '🔒',
    title: 'Secure token management',
    description: 'Your Instagram token is encrypted and auto-refreshed. Automations never break silently.'
  },
  {
    icon: '📊',
    title: 'Real-time analytics',
    description: 'See exactly how many DMs went out, when, and to whom. Full logs for every automation.'
  },
  {
    icon: '📱',
    title: 'Works on Reels, posts & carousels',
    description: 'Any Instagram post type works. Set it up once and it runs on all your content.'
  },
  {
    icon: '🇮🇳',
    title: 'Built for India',
    description: 'Pay via UPI, cards, or netbanking. Prices in INR. Support in your timezone.'
  }
]

const faqs = [
  {
    question: 'Is this against Instagram\'s rules?',
    answer: 'No. AutoMes uses Meta\'s official Instagram Graph API — the same API that powers tools like ManyChat and LinkDM. We go through Meta\'s App Review process to ensure full compliance. Your account is safe.'
  },
  {
    question: 'Does it work with personal Instagram accounts?',
    answer: 'No — Instagram\'s API only allows access to Business and Creator accounts. If you have a personal account, you can switch to a Creator account for free in Instagram settings. It takes 2 minutes and you keep all your followers.'
  },
  {
    question: 'What happens when I hit my DM limit?',
    answer: 'Your automations pause until next month or until you upgrade. We send you an email warning before you hit the limit so you have time to upgrade. No DMs are lost — they just don\'t go out.'
  },
  {
    question: 'Do my followers know the DM is automated?',
    answer: 'The DM looks exactly like a normal DM from your account. There\'s no "sent by AutoMes" label or anything like that. It comes from your Instagram account directly.'
  },
  {
    question: 'Can I cancel anytime?',
    answer: 'Yes. You can stop any automation instantly from your dashboard. For billing, contact our support and we\'ll handle it within 24 hours. We don\'t make cancellation difficult.'
  },
  {
    question: 'What payment methods do you accept?',
    answer: 'We accept UPI (GPay, PhonePe, Paytm), credit/debit cards, and netbanking — all via Razorpay. Payments are in INR with no international transaction fees.'
  },
  {
    question: 'How many Instagram accounts can I connect?',
    answer: 'It depends on your plan. Starter supports 1 account, Pro supports 3, and Agency supports 10. Perfect if you manage multiple brand accounts or clients.'
  },
  {
    question: 'What if my post goes viral and gets 10,000 comments?',
    answer: 'AutoMes handles spikes automatically with a built-in queue system. DMs go out respecting Instagram\'s rate limits so your account stays safe. It may take a few hours for all DMs to go out during viral moments.'
  }
]

export default function LandingPage() {
  const [plans, setPlans] = useState<any[]>([])

  useEffect(() => {
    supabase
      .from('plans')
      .select('*')
      .eq('is_active', true)
      .order('sort_order', { ascending: true })
      .then(({ data }) => setPlans(data ?? []))
  }, [])

  return (
    <div className="min-h-screen bg-white">
      <Navbar />

      {/* ── HERO ── */}
      <section className="pt-32 pb-20 px-6">
        <div className="max-w-4xl mx-auto text-center">
          <Badge variant="secondary" className="mb-6 text-xs px-3 py-1">
            🇮🇳 Built for Indian creators & businesses
          </Badge>

          <h1 className="text-5xl md:text-6xl font-semibold tracking-tight leading-tight mb-6">
            Turn Instagram comments
            <br />
            <span className="text-gray-400">into automatic DMs</span>
          </h1>

          <p className="text-xl text-gray-500 max-w-2xl mx-auto mb-4">
            Someone comments <span className="font-mono bg-gray-100 px-2 py-0.5 rounded text-gray-700 text-base">"LINK"</span> on your post →
            they get your link in their DMs within seconds.
            <br />
            Automatically. No manual work.
          </p>

          <p className="text-sm text-gray-400 mb-10">
            Works on Reels, posts, and carousels · UPI payments accepted · Cancel anytime
          </p>

          <div className="flex items-center justify-center gap-4">
            <Link href="/signup">
              <Button size="lg" className="h-12 px-8 text-base">
                Start for free →
              </Button>
            </Link>
            <a href="#how-it-works">
              <Button variant="outline" size="lg" className="h-12 px-8 text-base">
                See how it works
              </Button>
            </a>
          </div>

          <p className="text-xs text-gray-400 mt-4">
            Free trial included · No credit card required
          </p>

          {/* Product preview */}
          <div className="mt-16 rounded-2xl border bg-gray-50 overflow-hidden shadow-xl">
            <div className="bg-white border-b px-4 py-3 flex items-center gap-2">
              <div className="w-3 h-3 rounded-full bg-red-400" />
              <div className="w-3 h-3 rounded-full bg-yellow-400" />
              <div className="w-3 h-3 rounded-full bg-green-400" />
              <span className="text-xs text-gray-400 ml-2">auto-mes.vercel.app/dashboard</span>
            </div>
            <div className="p-6 grid grid-cols-3 gap-4">
              <div className="bg-white rounded-xl border p-4 text-left">
                <p className="text-xs text-gray-400 mb-1">DMs this month</p>
                <p className="text-2xl font-semibold">347<span className="text-gray-300 text-base font-normal"> / 500</span></p>
                <div className="h-1.5 bg-gray-100 rounded mt-2">
                  <div className="h-full w-[69%] bg-black rounded" />
                </div>
              </div>
              <div className="bg-white rounded-xl border p-4 text-left">
                <p className="text-xs text-gray-400 mb-1">DMs today</p>
                <p className="text-2xl font-semibold">23</p>
                <p className="text-xs text-gray-400 mt-1">since midnight</p>
              </div>
              <div className="bg-white rounded-xl border p-4 text-left">
                <p className="text-xs text-gray-400 mb-1">Active automations</p>
                <p className="text-2xl font-semibold">4</p>
                <p className="text-xs text-gray-400 mt-1">running right now</p>
              </div>
            </div>
            <div className="px-6 pb-6">
              <div className="bg-white rounded-xl border p-4">
                <div className="flex items-center justify-between mb-3">
                  <p className="text-sm font-medium">Recent automation</p>
                  <span className="text-xs bg-green-100 text-green-700 px-2 py-0.5 rounded-full">Active</span>
                </div>
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-lg bg-gray-100 flex-shrink-0" />
                  <div className="flex-1">
                    <p className="text-sm font-medium">@youraccount · "My latest Reel"</p>
                    <div className="flex gap-1.5 mt-1">
                      {['LINK', 'PDF', 'GUIDE'].map(kw => (
                        <span key={kw} className="text-xs bg-gray-100 text-gray-600 px-2 py-0.5 rounded-full">{kw}</span>
                      ))}
                    </div>
                  </div>
                  <p className="text-xs text-gray-400">247 DMs sent</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ── HOW IT WORKS ── */}
      <section id="how-it-works" className="py-20 px-6 bg-gray-50">
        <div className="max-w-5xl mx-auto">
          <div className="text-center mb-14">
            <p className="text-sm font-medium text-gray-400 uppercase tracking-widest mb-3">How it works</p>
            <h2 className="text-3xl md:text-4xl font-semibold">Set up in under 5 minutes</h2>
          </div>

          <div className="grid md:grid-cols-3 gap-8">
            {[
              {
                step: '01',
                title: 'Connect your Instagram',
                description: 'Link your Business or Creator account with one click. We use Instagram\'s official API — no passwords shared.',
                icon: '📱'
              },
              {
                step: '02',
                title: 'Set your trigger',
                description: 'Paste your post URL, choose a keyword like "LINK" or "PDF", or trigger on any comment. Add your DM message.',
                icon: '⚡'
              },
              {
                step: '03',
                title: 'DMs go out automatically',
                description: 'That\'s it. Every time someone comments your keyword, they get your DM within seconds. You do nothing.',
                icon: '🎉'
              }
            ].map((item) => (
              <div key={item.step} className="relative">
                <div className="text-5xl mb-4">{item.icon}</div>
                <div className="text-xs font-mono text-gray-300 mb-2">{item.step}</div>
                <h3 className="text-lg font-semibold mb-2">{item.title}</h3>
                <p className="text-gray-500 text-sm leading-relaxed">{item.description}</p>
              </div>
            ))}
          </div>

          {/* Flow diagram */}
          <div className="mt-16 bg-white rounded-2xl border p-8">
            <div className="flex items-center justify-center gap-3 flex-wrap">
              {[
                { label: 'Someone comments "LINK"', bg: 'bg-gray-100' },
                { label: '→', bg: 'transparent', small: true },
                { label: 'AutoMes detects it', bg: 'bg-blue-50 text-blue-700' },
                { label: '→', bg: 'transparent', small: true },
                { label: 'DM sent in 2-3 seconds', bg: 'bg-green-50 text-green-700' },
                { label: '→', bg: 'transparent', small: true },
                { label: 'Follower gets the link', bg: 'bg-black text-white' },
              ].map((item, i) => (
                item.small
                  ? <span key={i} className="text-gray-300 text-xl">→</span>
                  : <div key={i} className={`${item.bg} px-4 py-2 rounded-lg text-sm font-medium`}>
                      {item.label}
                    </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* ── FEATURES ── */}
      <section id="features" className="py-20 px-6">
        <div className="max-w-5xl mx-auto">
          <div className="text-center mb-14">
            <p className="text-sm font-medium text-gray-400 uppercase tracking-widest mb-3">Features</p>
            <h2 className="text-3xl md:text-4xl font-semibold">Everything you need</h2>
            <p className="text-gray-500 mt-3 max-w-xl mx-auto">
              No fluff. Every feature is here because real creators needed it.
            </p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-5">
            {features.map((feature) => (
              <div
                key={feature.title}
                className="p-5 rounded-xl border hover:border-gray-300 hover:shadow-sm transition-all"
              >
                <div className="text-2xl mb-3">{feature.icon}</div>
                <h3 className="font-medium text-sm mb-1.5">{feature.title}</h3>
                <p className="text-xs text-gray-500 leading-relaxed">{feature.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── PRICING ── */}
      <section id="pricing" className="py-20 px-6 bg-gray-50">
        <div className="max-w-5xl mx-auto">
          <div className="text-center mb-14">
            <p className="text-sm font-medium text-gray-400 uppercase tracking-widest mb-3">Pricing</p>
            <h2 className="text-3xl md:text-4xl font-semibold">Simple, honest pricing</h2>
            <p className="text-gray-500 mt-3">
              Start free. Upgrade when you're ready. Cancel anytime.
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-5">
            {plans.filter(p => p.id !== 'trial').map((plan) => {
              const isPopular = plan.id === 'pro'
              return (
                <div
                  key={plan.id}
                  className={`relative bg-white rounded-2xl border p-6 ${
                    isPopular ? 'border-black shadow-lg scale-[1.02]' : ''
                  }`}
                >
                  {isPopular && (
                    <div className="absolute -top-3 left-1/2 -translate-x-1/2">
                      <span className="bg-black text-white text-xs px-3 py-1 rounded-full font-medium">
                        Most popular
                      </span>
                    </div>
                  )}

                  <div className="mb-5">
                    <p className="font-semibold text-lg">{plan.name}</p>
                    <div className="flex items-baseline gap-1 mt-1">
                      <span className="text-3xl font-semibold">
                        ₹{plan.price_inr.toLocaleString()}
                      </span>
                      <span className="text-gray-400">/month</span>
                    </div>
                  </div>

                  <div className="flex flex-col gap-3 mb-6 text-sm">
                    <div className="flex items-center gap-2">
                      <span className="text-green-500 font-medium">✓</span>
                      <span>{plan.dm_limit.toLocaleString()} DMs per month</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="text-green-500 font-medium">✓</span>
                      <span>{plan.account_limit} Instagram account{plan.account_limit > 1 ? 's' : ''}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      {plan.allows_comment_reply
                        ? <span className="text-green-500 font-medium">✓</span>
                        : <span className="text-gray-300">✗</span>}
                      <span className={plan.allows_comment_reply ? '' : 'text-gray-400'}>
                        Public comment reply
                      </span>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="text-green-500 font-medium">✓</span>
                      <span>All trigger types</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="text-green-500 font-medium">✓</span>
                      <span>Real-time analytics</span>
                    </div>
                  </div>

                  <Link href="/signup">
                    <Button
                      className="w-full"
                      variant={isPopular ? 'default' : 'outline'}
                    >
                      Get started →
                    </Button>
                  </Link>
                </div>
              )
            })}
          </div>

          {/* Trial note */}
          <div className="text-center mt-8">
            <p className="text-sm text-gray-500">
              Not ready to pay?{' '}
              <Link href="/signup" className="underline text-gray-700">
                Start with the free trial
              </Link>
              {' '}— no credit card needed.
            </p>
          </div>
        </div>
      </section>

      {/* ── FAQ ── */}
      <section id="faq" className="py-20 px-6">
        <div className="max-w-3xl mx-auto">
          <div className="text-center mb-14">
            <p className="text-sm font-medium text-gray-400 uppercase tracking-widest mb-3">FAQ</p>
            <h2 className="text-3xl md:text-4xl font-semibold">Common questions</h2>
          </div>

          <Accordion type="single" collapsible className="flex flex-col gap-2">
            {faqs.map((faq, i) => (
              <AccordionItem
                key={i}
                value={`faq-${i}`}
                className="border rounded-xl px-5"
              >
                <AccordionTrigger className="text-left text-sm font-medium hover:no-underline py-4">
                  {faq.question}
                </AccordionTrigger>
                <AccordionContent className="text-sm text-gray-500 leading-relaxed pb-4">
                  {faq.answer}
                </AccordionContent>
              </AccordionItem>
            ))}
          </Accordion>

          <div className="mt-10 text-center p-6 bg-gray-50 rounded-2xl">
            <p className="text-sm font-medium mb-1">Still have questions?</p>
            <p className="text-sm text-gray-500 mb-4">
              Email us at{' '}
              <a href="mailto:support@auto-mes.vercel.app" className="underline">
                support@auto-mes.vercel.app
              </a>
            </p>
          </div>
        </div>
      </section>

      {/* ── CTA BANNER ── */}
      <section className="py-20 px-6 bg-black">
        <div className="max-w-3xl mx-auto text-center">
          <h2 className="text-3xl md:text-4xl font-semibold text-white mb-4">
            Start automating today
          </h2>
          <p className="text-gray-400 mb-8 text-lg">
            Join creators who are turning every comment into a conversation.
          </p>
          <Link href="/signup">
            <Button size="lg" variant="secondary" className="h-12 px-8 text-base">
              Get started for free →
            </Button>
          </Link>
          <p className="text-gray-500 text-sm mt-4">
            Free trial · No credit card required · Cancel anytime
          </p>
        </div>
      </section>

      <Footer />
    </div>
  )
}