import Link from 'next/link'
import { Button } from '@/components/ui/button'

export default function PrivacyPage() {
  const lastUpdated = 'June 23, 2026'

  return (
    <div className="min-h-screen bg-white">
      {/* Simple navbar */}
      <nav className="border-b px-6 h-16 flex items-center justify-between max-w-4xl mx-auto">
        <Link href="/" className="text-lg font-semibold">AutoMes</Link>
        <Link href="/dashboard">
          <Button variant="outline" size="sm">Dashboard</Button>
        </Link>
      </nav>

      <div className="max-w-3xl mx-auto px-6 py-16">
        <h1 className="text-3xl font-semibold mb-2">Privacy Policy</h1>
        <p className="text-sm text-gray-400 mb-10">Last updated: {lastUpdated}</p>

        <div className="prose prose-gray max-w-none space-y-8 text-sm leading-relaxed text-gray-600">

          <section>
            <h2 className="text-base font-semibold text-gray-900 mb-3">1. Who we are</h2>
            <p>
              AutoMes ("we", "our", or "us") is an Instagram DM automation platform
              that helps creators and businesses automatically send direct messages
              to users who comment on their Instagram posts. AutoMes is operated
              independently and is not affiliated with Meta Platforms, Inc.
            </p>
            <p className="mt-2">
              For privacy-related questions, contact us at:{' '}
              <a href="mailto:privacy@auto-mes.vercel.app" className="underline text-gray-700">
                privacy@auto-mes.vercel.app
              </a>
            </p>
          </section>

          <section>
            <h2 className="text-base font-semibold text-gray-900 mb-3">2. What data we collect</h2>
            <p className="mb-3"><strong>Account information:</strong></p>
            <ul className="list-disc pl-5 space-y-1">
              <li>Your email address (used for login and notifications)</li>
              <li>Your name (optional, used to personalize the dashboard)</li>
            </ul>

            <p className="mt-4 mb-3"><strong>Instagram account data:</strong></p>
            <ul className="list-disc pl-5 space-y-1">
              <li>Your Instagram Business or Creator account username and account ID</li>
              <li>An access token that allows AutoMes to read comments on your posts and send DMs on your behalf — this token is encrypted before storage</li>
              <li>Post IDs for posts you add automations to</li>
              <li>Comment text and commenter IDs from posts with active automations</li>
            </ul>

            <p className="mt-4 mb-3"><strong>Usage data:</strong></p>
            <ul className="list-disc pl-5 space-y-1">
              <li>Number of DMs sent per month</li>
              <li>Automation configuration (keywords, DM messages, reply settings)</li>
              <li>DM delivery logs (who received a DM, when, and whether it succeeded)</li>
            </ul>

            <p className="mt-4 mb-3"><strong>Payment data:</strong></p>
            <ul className="list-disc pl-5 space-y-1">
              <li>Payment amount, date, and plan purchased — stored in our database</li>
              <li>We do NOT store card numbers, UPI IDs, or bank details — all payments are processed by Razorpay</li>
            </ul>
          </section>

          <section>
            <h2 className="text-base font-semibold text-gray-900 mb-3">3. How we use your data</h2>
            <ul className="list-disc pl-5 space-y-2">
              <li>To operate the AutoMes service — receive Instagram comment webhooks and send DMs on your behalf</li>
              <li>To send you transactional emails (token expiry alerts, plan renewal reminders, payment confirmations)</li>
              <li>To enforce plan limits (tracking DMs sent per month)</li>
              <li>To debug and improve the service (error logs, performance monitoring)</li>
            </ul>
            <p className="mt-3">
              We do not use your data for advertising. We do not sell your data to third parties. We do not post on your Instagram account or access any content beyond what is needed to run your automations.
            </p>
          </section>

          <section>
            <h2 className="text-base font-semibold text-gray-900 mb-3">4. How we store and protect your data</h2>
            <ul className="list-disc pl-5 space-y-2">
              <li>All data is stored on Supabase (PostgreSQL), hosted on AWS infrastructure in the ap-south-1 (Mumbai) region</li>
              <li>Instagram access tokens are encrypted using AES-256-CBC encryption before being stored</li>
              <li>All data transmission uses HTTPS/TLS encryption</li>
              <li>Access to the database is restricted to the AutoMes application only</li>
              <li>We do not store Instagram passwords at any point</li>
            </ul>
          </section>

          <section>
            <h2 className="text-base font-semibold text-gray-900 mb-3">5. Data retention</h2>
            <ul className="list-disc pl-5 space-y-2">
              <li>DM logs are retained for 90 days, then automatically deleted</li>
              <li>Account data is retained for as long as your account is active</li>
              <li>Payment records are retained for 7 years as required by Indian financial regulations</li>
              <li>If you delete your account, all personal data except payment records is deleted within 30 days</li>
            </ul>
          </section>

          <section>
            <h2 className="text-base font-semibold text-gray-900 mb-3">6. Message deletion</h2>
            <p>
              In compliance with Meta's platform policies, if an Instagram user deletes a message they sent to your account, we delete any stored copy of that message from our logs within 24 hours of receiving the deletion notification from Meta's webhook.
            </p>
          </section>

          <section>
            <h2 className="text-base font-semibold text-gray-900 mb-3">7. Third-party services</h2>
            <p className="mb-2">We use the following third-party services:</p>
            <ul className="list-disc pl-5 space-y-2">
              <li><strong>Meta/Instagram Graph API</strong> — to receive comment webhooks and send DMs. Subject to Meta's Privacy Policy.</li>
              <li><strong>Supabase</strong> — database and authentication hosting. Subject to Supabase's Privacy Policy.</li>
              <li><strong>Razorpay</strong> — payment processing. Subject to Razorpay's Privacy Policy. We do not share your personal data with Razorpay beyond what's required for payment processing.</li>
              <li><strong>Resend</strong> — transactional email delivery. We share your email address with Resend only to deliver emails you've requested.</li>
              <li><strong>Vercel</strong> — application hosting. Subject to Vercel's Privacy Policy.</li>
              <li><strong>Upstash</strong> — queue and caching infrastructure. No personal data is stored in the queue beyond what's needed to process the current job.</li>
            </ul>
          </section>

          <section>
            <h2 className="text-base font-semibold text-gray-900 mb-3">8. Your rights</h2>
            <p className="mb-2">You have the right to:</p>
            <ul className="list-disc pl-5 space-y-2">
              <li><strong>Access</strong> — request a copy of all personal data we hold about you</li>
              <li><strong>Correction</strong> — request correction of inaccurate data</li>
              <li><strong>Deletion</strong> — request deletion of your account and personal data</li>
              <li><strong>Opt-out</strong> — disconnect your Instagram account at any time from the Settings page, which immediately revokes AutoMes's ability to act on your behalf</li>
              <li><strong>Data portability</strong> — request a copy of your data in a machine-readable format</li>
            </ul>
            <p className="mt-3">
              To exercise any of these rights, email us at{' '}
              <a href="mailto:privacy@auto-mes.vercel.app" className="underline text-gray-700">
                privacy@auto-mes.vercel.app
              </a>
            </p>
          </section>

          <section>
            <h2 className="text-base font-semibold text-gray-900 mb-3">9. Cookies</h2>
            <p>
              AutoMes uses only essential cookies required for authentication (to keep you logged in). We do not use tracking cookies, advertising cookies, or third-party analytics cookies.
            </p>
          </section>

          <section>
            <h2 className="text-base font-semibold text-gray-900 mb-3">10. Changes to this policy</h2>
            <p>
              We may update this Privacy Policy from time to time. We will notify you of significant changes via email or a notice in the dashboard. Continued use of AutoMes after changes constitutes acceptance of the updated policy.
            </p>
          </section>

          <section>
            <h2 className="text-base font-semibold text-gray-900 mb-3">11. Contact</h2>
            <p>
              For any privacy-related questions or requests:
              <br />
              Email: <a href="mailto:privacy@auto-mes.vercel.app" className="underline text-gray-700">privacy@auto-mes.vercel.app</a>
            </p>
          </section>

        </div>
      </div>
    </div>
  )
}