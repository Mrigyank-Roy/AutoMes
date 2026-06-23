import Link from 'next/link'
import { Button } from '@/components/ui/button'

export default function TermsPage() {
  const lastUpdated = 'June 23, 2026'

  return (
    <div className="min-h-screen bg-white">
      <nav className="border-b px-6 h-16 flex items-center justify-between max-w-4xl mx-auto">
        <Link href="/" className="text-lg font-semibold">AutoMes</Link>
        <Link href="/dashboard">
          <Button variant="outline" size="sm">Dashboard</Button>
        </Link>
      </nav>

      <div className="max-w-3xl mx-auto px-6 py-16">
        <h1 className="text-3xl font-semibold mb-2">Terms of Service</h1>
        <p className="text-sm text-gray-400 mb-10">Last updated: {lastUpdated}</p>

        <div className="prose prose-gray max-w-none space-y-8 text-sm leading-relaxed text-gray-600">

          <section>
            <h2 className="text-base font-semibold text-gray-900 mb-3">1. Acceptance of terms</h2>
            <p>
              By creating an account on AutoMes, you agree to these Terms of Service. If you do not agree, do not use AutoMes. These terms apply to all users of the AutoMes platform.
            </p>
          </section>

          <section>
            <h2 className="text-base font-semibold text-gray-900 mb-3">2. What AutoMes is</h2>
            <p>
              AutoMes is a software platform that enables Instagram Business and Creator account holders to automatically send direct messages to users who comment on their Instagram posts. AutoMes operates using Meta's official Instagram Graph API.
            </p>
            <p className="mt-2">
              AutoMes is an independent platform and is not affiliated with, endorsed by, or sponsored by Meta Platforms, Inc. or Instagram.
            </p>
          </section>

          <section>
            <h2 className="text-base font-semibold text-gray-900 mb-3">3. Eligibility</h2>
            <ul className="list-disc pl-5 space-y-2">
              <li>You must be at least 18 years old to use AutoMes</li>
              <li>You must own or have authorization to manage the Instagram account you connect</li>
              <li>The Instagram account you connect must be a Business or Creator account — personal accounts are not supported</li>
              <li>You must comply with Instagram's Terms of Use and Community Guidelines</li>
            </ul>
          </section>

          <section>
            <h2 className="text-base font-semibold text-gray-900 mb-3">4. Your responsibilities</h2>
            <p className="mb-2">You agree that you will NOT use AutoMes to:</p>
            <ul className="list-disc pl-5 space-y-2">
              <li>Send spam, unsolicited messages, or harassment to Instagram users</li>
              <li>Violate Meta's Platform Policies or Instagram's Terms of Use</li>
              <li>Send DMs containing illegal content, adult content, or content that violates Instagram's Community Guidelines</li>
              <li>Automate DMs in a way that could get your Instagram account banned or restricted</li>
              <li>Use AutoMes to impersonate any person or entity</li>
              <li>Attempt to reverse-engineer, hack, or gain unauthorized access to AutoMes</li>
              <li>Share your account credentials with others</li>
            </ul>
            <p className="mt-3">
              You are solely responsible for the content of the DMs sent through AutoMes. AutoMes is a delivery tool — what you send is your responsibility.
            </p>
          </section>

          <section>
            <h2 className="text-base font-semibold text-gray-900 mb-3">5. Payments and billing</h2>
            <ul className="list-disc pl-5 space-y-2">
              <li>AutoMes is billed monthly. Payment is due at the start of each billing cycle.</li>
              <li>All prices are in Indian Rupees (INR) and include applicable taxes.</li>
              <li>Payments are processed by Razorpay. By making a payment, you agree to Razorpay's terms.</li>
              <li>We do not offer automatic refunds. If you believe you have been charged incorrectly, contact support within 7 days.</li>
              <li>If your payment fails, your account will be downgraded to the free trial tier. You can renew at any time.</li>
              <li>We reserve the right to change pricing with 30 days notice. Existing subscribers will be notified by email.</li>
            </ul>
          </section>

          <section>
            <h2 className="text-base font-semibold text-gray-900 mb-3">6. Plan limits</h2>
            <p>
              Each plan includes a monthly DM limit. When you reach your limit, automations pause until the next billing cycle or until you upgrade. We will send you an email warning before you hit your limit. Unused DMs do not roll over to the next month.
            </p>
          </section>

          <section>
            <h2 className="text-base font-semibold text-gray-900 mb-3">7. Account suspension and termination</h2>
            <p className="mb-2">We reserve the right to suspend or terminate your account if:</p>
            <ul className="list-disc pl-5 space-y-2">
              <li>You violate these Terms of Service</li>
              <li>You violate Meta's Platform Policies using AutoMes</li>
              <li>We receive a complaint or notice that you are using AutoMes to send spam or harass users</li>
              <li>Your payment fails and remains unpaid for more than 7 days</li>
            </ul>
            <p className="mt-3">
              If we suspend your account for a policy violation, we will not issue a refund for unused days. If we suspend your account in error, we will restore it and issue a pro-rated refund.
            </p>
          </section>

          <section>
            <h2 className="text-base font-semibold text-gray-900 mb-3">8. Instagram account risk</h2>
            <p>
              Using any third-party automation tool with Instagram carries inherent risk. While AutoMes uses Meta's official API and complies with Meta's Platform Policies, we cannot guarantee that your Instagram account will never be restricted or banned. Sending excessive DMs, sending spam, or violating Instagram's guidelines through AutoMes can result in your Instagram account being restricted.
            </p>
            <p className="mt-2">
              AutoMes is not responsible for any action taken by Meta or Instagram against your account. We strongly recommend following Instagram's best practices and keeping your DM content relevant and non-spammy.
            </p>
          </section>

          <section>
            <h2 className="text-base font-semibold text-gray-900 mb-3">9. Service availability</h2>
            <p>
              We aim for 99% uptime but do not guarantee uninterrupted service. AutoMes may be unavailable due to maintenance, Meta API outages, or technical issues. We are not liable for any losses resulting from service downtime.
            </p>
          </section>

          <section>
            <h2 className="text-base font-semibold text-gray-900 mb-3">10. Limitation of liability</h2>
            <p>
              To the maximum extent permitted by law, AutoMes is not liable for any indirect, incidental, consequential, or punitive damages arising from your use of the platform, including but not limited to: loss of revenue, loss of data, Instagram account suspension, or missed DM opportunities.
            </p>
            <p className="mt-2">
              Our total liability to you for any claim arising from these terms shall not exceed the amount you paid to AutoMes in the 30 days prior to the claim.
            </p>
          </section>

          <section>
            <h2 className="text-base font-semibold text-gray-900 mb-3">11. Opt-out mechanism</h2>
            <p>
              Instagram users who receive DMs through AutoMes can opt out of future automated messages by replying with "STOP" or "UNSUBSCRIBE". When we receive such a reply, we will add that user to a blocklist and no further automated DMs will be sent to them from your account through AutoMes.
            </p>
          </section>

          <section>
            <h2 className="text-base font-semibold text-gray-900 mb-3">12. Changes to these terms</h2>
            <p>
              We may update these Terms of Service. We will notify you of significant changes via email with at least 14 days notice. Continued use of AutoMes after the notice period constitutes acceptance.
            </p>
          </section>

          <section>
            <h2 className="text-base font-semibold text-gray-900 mb-3">13. Governing law</h2>
            <p>
              These terms are governed by the laws of India. Any disputes shall be subject to the exclusive jurisdiction of the courts in India.
            </p>
          </section>

          <section>
            <h2 className="text-base font-semibold text-gray-900 mb-3">14. Contact</h2>
            <p>
              For any questions about these terms:
              <br />
              Email: <a href="mailto:support@auto-mes.vercel.app" className="underline text-gray-700">support@auto-mes.vercel.app</a>
            </p>
          </section>

        </div>
      </div>
    </div>
  )
}