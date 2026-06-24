import Link from 'next/link'

export default function PrivacyPage() {
  return (
    <div style={{ minHeight: '100vh', background: 'var(--surface)' }}>
      <nav style={{ background: 'var(--canvas)', borderBottom: '1px solid var(--hairline)', padding: '0 24px', height: 64, display: 'flex', alignItems: 'center', justifyContent: 'space-between', maxWidth: 1100, margin: '0 auto' }}>
        <Link href="/" style={{ fontSize: 20, fontWeight: 800, color: 'var(--red)', textDecoration: 'none' }}>AutoMes</Link>
        <Link href="/dashboard" style={{ fontSize: 13, fontWeight: 600, color: 'var(--mute)', textDecoration: 'none', padding: '8px 16px', background: 'var(--card)', borderRadius: 'var(--radius-md)' }}>Dashboard</Link>
      </nav>

      <div style={{ maxWidth: 720, margin: '0 auto', padding: '60px 24px' }}>
        <div style={{ marginBottom: 48 }}>
          <p style={{ fontSize: 12, fontWeight: 700, color: 'var(--red)', textTransform: 'uppercase', letterSpacing: 2, marginBottom: 12 }}>Legal</p>
          <h1 style={{ fontSize: 40, fontWeight: 800, color: 'var(--ink)', letterSpacing: -1, marginBottom: 8 }}>Privacy Policy</h1>
          <p style={{ fontSize: 13, color: 'var(--ash)' }}>Last updated: June 23, 2026</p>
        </div>

        {[
          { title: '1. Who we are', content: 'AutoMes is an Instagram DM automation platform that helps creators and businesses automatically send direct messages to users who comment on their Instagram posts. AutoMes is not affiliated with Meta Platforms, Inc. For privacy-related questions: privacy@auto-mes.vercel.app' },
          { title: '2. What data we collect', content: 'Account information: your email address and optional name. Instagram account data: username, account ID, access token (encrypted before storage), post IDs, and comment data from posts with active automations. Usage data: DM counts, automation configs, and delivery logs. Payment data: amount, date, plan — stored in our database. We never store card numbers or UPI IDs.' },
          { title: '3. How we use your data', content: 'To operate the AutoMes service — receive comment webhooks and send DMs on your behalf. To send transactional emails (token expiry, renewal reminders, payment confirmations). To enforce plan limits. To debug and improve the service. We do not use your data for advertising. We do not sell your data to third parties.' },
          { title: '4. How we store and protect your data', content: 'All data is stored on Supabase (PostgreSQL) on AWS in the ap-south-1 (Mumbai) region. Instagram access tokens are encrypted using AES-256-CBC encryption before storage. All data transmission uses HTTPS/TLS. We do not store Instagram passwords at any point.' },
          { title: '5. Data retention', content: 'DM logs are retained for 90 days, then deleted. Account data is retained while your account is active. Payment records are retained for 7 years per Indian financial regulations. If you delete your account, all personal data except payment records is deleted within 30 days.' },
          { title: '6. Message deletion', content: "In compliance with Meta's platform policies, if a user deletes a message, we delete any stored copy from our logs within 24 hours of receiving Meta's deletion notification." },
          { title: '7. Third-party services', content: 'Meta/Instagram Graph API — to receive webhooks and send DMs. Supabase — database and auth hosting. Razorpay — payment processing. Resend — transactional email delivery. Vercel — application hosting. Upstash — queue and caching infrastructure.' },
          { title: '8. Your rights', content: 'You have the right to access, correct, delete, and export your data. You can disconnect your Instagram account at any time from the Settings page. To exercise any rights, email privacy@auto-mes.vercel.app' },
          { title: '9. Cookies', content: 'AutoMes uses only essential cookies required for authentication. We do not use tracking, advertising, or analytics cookies.' },
          { title: '10. Contact', content: 'For privacy questions: privacy@auto-mes.vercel.app' },
        ].map(section => (
          <div key={section.title} style={{ marginBottom: 32, paddingBottom: 32, borderBottom: '1px solid var(--hairline)' }}>
            <h2 style={{ fontSize: 16, fontWeight: 700, color: 'var(--ink)', marginBottom: 12 }}>{section.title}</h2>
            <p style={{ fontSize: 14, color: 'var(--body)', lineHeight: 1.8 }}>{section.content}</p>
          </div>
        ))}
      </div>
    </div>
  )
}