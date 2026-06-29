import Link from 'next/link'
import { LogoLockup } from '@/components/Logo'

export const metadata = {
  title: 'Data Deletion · AutoMes',
}

export default function DataDeletionPage() {
  return (
    <main
      style={ {
        maxWidth: 640,
        margin: '0 auto',
        padding: '48px 24px 64px',
        color: 'var(--ink, #1a1a1a)',
        lineHeight: 1.6,
      } }
    >
      <Link
        href="/"
        aria-label="AutoMes home"
        style={ { display: 'inline-block', color: 'var(--ink, #1a1a1a)', lineHeight: 0, marginBottom: 32 } }
      >
        <LogoLockup height={30} />
      </Link>

      <h1 style={ { fontSize: 28, fontWeight: 800, marginBottom: 16 } }>
        Data Deletion
      </h1>

      <p>
        AutoMes stores only the data needed to run your comment-to-DM
        automations: your connected Instagram account, your automations, message
        logs, and opt-out records.
      </p>

      <h2 style={ { fontSize: 20, fontWeight: 700, margin: '28px 0 8px' } }>
        How to delete your data
      </h2>

      <p>You can delete all of your AutoMes data in any of these ways:</p>

      <ol style={ { paddingLeft: 20 } }>
        <li style={ { marginBottom: 12 } }>
          <strong>Disconnect from your AutoMes dashboard.</strong> Log in to
          AutoMes, go to <em>Settings</em>, and disconnect your Instagram
          account. This removes your account and its associated data.
        </li>
        <li style={ { marginBottom: 12 } }>
          <strong>Disconnect AutoMes from Instagram.</strong> Open Instagram →{' '}
          <em>Settings → Apps and websites</em>, find <strong>AutoMes</strong>,
          and remove it. This revokes our access and signals us to delete your
          associated data.
        </li>
        <li>
          <strong>Email us a request.</strong> Send an email to{' '}
          <a
            href="mailto:automes849@gmail.com"
            style={ { color: 'var(--red, #FF3D6E)', fontWeight: 600 } }
          >
            automes849@gmail.com
          </a>{' '}
          from the email address on your account with the subject{' '}
          <strong>“Delete my data”</strong>. We will permanently delete your data
          within 30 days and confirm by email.
        </li>
      </ol>

      <h2 style={ { fontSize: 20, fontWeight: 700, margin: '28px 0 8px' } }>
        What gets deleted
      </h2>

      <ul style={ { paddingLeft: 20 } }>
        <li>Your connected Instagram account details</li>
        <li>All of your automations</li>
        <li>Message and delivery logs</li>
        <li>Opt-out records tied to your account</li>
      </ul>

      <p style={ { marginTop: 24, fontSize: 14, color: '#6b7280' } }>
        Questions about your data? Contact{' '}
        <a href="mailto:automes849@gmail.com" style={ { color: 'var(--red, #FF3D6E)' } }>
          automes849@gmail.com
        </a>
        .
      </p>
    </main>
  )
}