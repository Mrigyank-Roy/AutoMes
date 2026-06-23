import Link from 'next/link'

export default function Footer() {
  return (
    <footer className="border-t bg-gray-50">
      <div className="max-w-6xl mx-auto px-6 py-12">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-8 mb-12">
          <div className="col-span-2 md:col-span-1">
            <p className="text-lg font-semibold mb-2">AutoMes</p>
            <p className="text-sm text-gray-500 max-w-xs">
              Turn Instagram comments into automatic DMs. Built for Indian creators and businesses.
            </p>
          </div>

          <div>
            <p className="text-sm font-medium mb-3">Product</p>
            <div className="flex flex-col gap-2">
              <a href="#how-it-works" className="text-sm text-gray-500 hover:text-gray-900">How it works</a>
              <a href="#features" className="text-sm text-gray-500 hover:text-gray-900">Features</a>
              <a href="#pricing" className="text-sm text-gray-500 hover:text-gray-900">Pricing</a>
              <a href="#faq" className="text-sm text-gray-500 hover:text-gray-900">FAQ</a>
            </div>
          </div>

          <div>
            <p className="text-sm font-medium mb-3">Account</p>
            <div className="flex flex-col gap-2">
              <Link href="/signup" className="text-sm text-gray-500 hover:text-gray-900">Sign up</Link>
              <Link href="/login" className="text-sm text-gray-500 hover:text-gray-900">Log in</Link>
              <Link href="/dashboard/billing" className="text-sm text-gray-500 hover:text-gray-900">Billing</Link>
            </div>
          </div>

          <div>
            <p className="text-sm font-medium mb-3">Legal</p>
            <div className="flex flex-col gap-2">
              <Link href="/privacy" className="text-sm text-gray-500 hover:text-gray-900">Privacy Policy</Link>
              <Link href="/terms" className="text-sm text-gray-500 hover:text-gray-900">Terms of Service</Link>
            </div>
          </div>
        </div>

        <div className="border-t pt-8 flex flex-col md:flex-row items-center justify-between gap-4">
          <p className="text-sm text-gray-400">
            © {new Date().getFullYear()} AutoMes. All rights reserved.
          </p>
          <p className="text-sm text-gray-400">
            Made in India 🇮🇳 for Indian creators
          </p>
        </div>
      </div>
    </footer>
  )
}