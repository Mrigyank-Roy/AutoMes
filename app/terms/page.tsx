import Link from 'next/link'
import { LogoLockup } from '@/components/Logo'

export const metadata = {
  title: 'Terms of Service',
}

export default function TermsPage() {
  return (
    <div style={ { minHeight: '100vh', background: 'var(--surface)' } }>
      {/* Full-width top bar */}
      <nav style={ { background: 'var(--canvas)', borderBottom: '1px solid var(--hairline)' } }>
        <div style={ { maxWidth: 1100, margin: '0 auto', padding: '0 24px', height: 64, display: 'flex', alignItems: 'center', justifyContent: 'space-between' } }>
          <Link href="/" aria-label="AutoMes home" style={ { display: 'inline-block', color: 'var(--ink)', lineHeight: 0 } }>
            <LogoLockup height={40} />
          </Link>
          <Link href="/dashboard" style={ { fontSize: 13, fontWeight: 600, color: 'var(--mute)', textDecoration: 'none', padding: '8px 16px', background: 'var(--card)', borderRadius: 'var(--radius-md)' } }>Dashboard</Link>
        </div>
      </nav>

      <div style={ { maxWidth: 720, margin: '0 auto', padding: '60px 24px' } }>
        <div style={ { marginBottom: 48 } }>
          <p style={ { fontSize: 12, fontWeight: 700, color: 'var(--red)', textTransform: 'uppercase', letterSpacing: 2, marginBottom: 12 } }>Legal</p>
          <h1 style={ { fontSize: 40, fontWeight: 800, color: 'var(--ink)', letterSpacing: -1, marginBottom: 8 } }>Terms of Service</h1>
          <p style={ { fontSize: 13, color: 'var(--ash)' } }>Last updated: June 23, 2026</p>
        </div>

        {[
          { title: '1. Acceptance of terms', content: 'By creating an account on AutoMes, you agree to these Terms of Service. If you do not agree, do not use AutoMes.' },
          { title: '2. What AutoMes is', content: "AutoMes is a software platform that enables Instagram Business and Creator account holders to automatically send direct messages to users who comment on their posts. AutoMes uses Meta's official Instagram Graph API and is not affiliated with Meta Platforms, Inc." },
          { title: '3. Eligibility', content: 'You must be at least 18 years old. You must own or have authorization to manage the Instagram account you connect. The Instagram account must be a Business or Creator account. You must comply with Instagram\'s Terms of Use and Community Guidelines.' },
          { title: '4. Your responsibilities', content: 'You agree NOT to use AutoMes to send spam, unsolicited messages, or harassment. You must not violate Meta\'s Platform Policies. You must not send DMs containing illegal content. You are solely responsible for the content of DMs sent through AutoMes.' },
          { title: '5. Payments and billing', content: 'AutoMes is billed monthly. All prices are in INR. Payments are processed by Razorpay. We do not offer automatic refunds — contact support within 7 days if charged incorrectly. Failed payments result in downgrade to the free trial tier.' },
          { title: '6. Plan limits', content: 'Each plan includes a monthly DM limit. When you reach your limit, automations pause. Unused DMs do not roll over.' },
          { title: '7. Account suspension', content: 'We may suspend accounts for policy violations, Meta policy violations, spam complaints, or unpaid balances over 7 days. Policy violation suspensions are non-refundable.' },
          { title: '8. Instagram account risk', content: "Using third-party automation tools with Instagram carries inherent risk. AutoMes uses Meta's official API, but we cannot guarantee your Instagram account will never be restricted. We are not responsible for actions taken by Meta against your account." },
          { title: '9. Opt-out mechanism', content: 'Instagram users who receive DMs through AutoMes can opt out by replying "STOP" or "UNSUBSCRIBE". We will add them to a blocklist and no further automated DMs will be sent from your account through AutoMes.' },
          { title: '10. Limitation of liability', content: 'To the maximum extent permitted by law, AutoMes is not liable for indirect, incidental, or consequential damages. Our total liability shall not exceed what you paid to AutoMes in the 30 days prior to the claim.' },
          { title: '11. Governing law', content: 'These terms are governed by the laws of India. Disputes shall be subject to the exclusive jurisdiction of courts in India.' },
          { title: '12. Contact', content: 'For questions about these terms: support@auto-mes.vercel.app' },
        ].map(section => (
          <div key={section.title} style={ { marginBottom: 32, paddingBottom: 32, borderBottom: '1px solid var(--hairline)' } }>
            <h2 style={ { fontSize: 16, fontWeight: 700, color: 'var(--ink)', marginBottom: 12 } }>{section.title}</h2>
            <p style={ { fontSize: 14, color: 'var(--body)', lineHeight: 1.8 } }>{section.content}</p>
          </div>
        ))}
      </div>
    </div>
  )
}