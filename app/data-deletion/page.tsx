import Link from 'next/link'
import { LogoLockup } from '@/components/Logo'

export const metadata = {
  title: 'Data Deletion',
}

export default function DataDeletionPage() {
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
        <div style={ { marginBottom: 40 } }>
          <p style={ { fontSize: 12, fontWeight: 700, color: 'var(--red)', textTransform: 'uppercase', letterSpacing: 2, marginBottom: 12 } }>Legal</p>
          <h1 style={ { fontSize: 40, fontWeight: 800, color: 'var(--ink)', letterSpacing: -1, marginBottom: 8 } }>Data Deletion</h1>
          <p style={ { fontSize: 13, color: 'var(--ash)' } }>Last updated: June 30, 2026</p>
        </div>

        <p style={ { fontSize: 14, color: 'var(--body)', lineHeight: 1.8, marginBottom: 32 } }>
          AutoMes stores only the data needed to run your comment-to-DM automations: your connected Instagram account,
          your automations, message logs, and opt-out records. You can delete all of it at any time.
        </p>

        <div style={ { marginBottom: 32, paddingBottom: 32, borderBottom: '1px solid var(--hairline)' } }>
          <h2 style={ { fontSize: 16, fontWeight: 700, color: 'var(--ink)', marginBottom: 16 } }>How to delete your data</h2>
          <ol style={ { paddingLeft: 20, margin: 0 } }>
            <li style={ { fontSize: 14, color: 'var(--body)', lineHeight: 1.8, marginBottom: 14 } }>
              <strong style={ { color: 'var(--ink)' } }>Disconnect from your AutoMes dashboard.</strong> Log in to AutoMes, go to{' '}
              <em>Settings</em>, and disconnect your Instagram account. This removes your account and its associated data.
            </li>
            <li style={ { fontSize: 14, color: 'var(--body)', lineHeight: 1.8, marginBottom: 14 } }>
              <strong style={ { color: 'var(--ink)' } }>Disconnect AutoMes from Instagram.</strong> Open Instagram →{' '}
              <em>Settings → Apps and websites</em>, find <strong>AutoMes</strong>, and remove it. This revokes our access
              and signals us to delete your associated data.
            </li>
            <li style={ { fontSize: 14, color: 'var(--body)', lineHeight: 1.8 } }>
              <strong style={ { color: 'var(--ink)' } }>Email us a request.</strong> Send an email to{' '}
              <a href="mailto:automes849@gmail.com" style={ { color: 'var(--red)', fontWeight: 600 } }>automes849@gmail.com</a>{' '}
              from the email address on your account with the subject <strong>“Delete my data”</strong>. We will permanently
              delete your data within 30 days and confirm by email.
            </li>
          </ol>
        </div>

        <div style={ { marginBottom: 32, paddingBottom: 32, borderBottom: '1px solid var(--hairline)' } }>
          <h2 style={ { fontSize: 16, fontWeight: 700, color: 'var(--ink)', marginBottom: 16 } }>What gets deleted</h2>
          <ul style={ { paddingLeft: 20, margin: 0 } }>
            <li style={ { fontSize: 14, color: 'var(--body)', lineHeight: 1.8 } }>Your connected Instagram account details</li>
            <li style={ { fontSize: 14, color: 'var(--body)', lineHeight: 1.8 } }>All of your automations</li>
            <li style={ { fontSize: 14, color: 'var(--body)', lineHeight: 1.8 } }>Message and delivery logs</li>
            <li style={ { fontSize: 14, color: 'var(--body)', lineHeight: 1.8 } }>Opt-out records tied to your account</li>
          </ul>
        </div>

        <p style={ { fontSize: 14, color: 'var(--mute)', lineHeight: 1.8 } }>
          Questions about your data? Contact{' '}
          <a href="mailto:automes849@gmail.com" style={ { color: 'var(--red)', fontWeight: 600 } }>automes849@gmail.com</a>.
        </p>
      </div>
    </div>
  )
}