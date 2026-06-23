'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { supabase } from '@/lib/supabase'
import { Button } from '@/components/ui/button'

export default function Navbar() {
  const [isLoggedIn, setIsLoggedIn] = useState(false)
  const [scrolled, setScrolled] = useState(false)

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setIsLoggedIn(!!session)
    })

    const handleScroll = () => setScrolled(window.scrollY > 10)
    window.addEventListener('scroll', handleScroll)
    return () => window.removeEventListener('scroll', handleScroll)
  }, [])

  return (
    <nav className={`fixed top-0 left-0 right-0 z-50 transition-all duration-200 ${
      scrolled ? 'bg-white/90 backdrop-blur-md border-b' : 'bg-transparent'
    }`}>
      <div className="max-w-6xl mx-auto px-6 h-16 flex items-center justify-between">
        <Link href="/" className="text-xl font-semibold tracking-tight">
          AutoMes
        </Link>

        <div className="hidden md:flex items-center gap-8">
          <a href="#how-it-works" className="text-sm text-gray-500 hover:text-gray-900 transition-colors">
            How it works
          </a>
          <a href="#features" className="text-sm text-gray-500 hover:text-gray-900 transition-colors">
            Features
          </a>
          <a href="#pricing" className="text-sm text-gray-500 hover:text-gray-900 transition-colors">
            Pricing
          </a>
          <a href="#faq" className="text-sm text-gray-500 hover:text-gray-900 transition-colors">
            FAQ
          </a>
        </div>

        <div className="flex items-center gap-3">
          {isLoggedIn ? (
            <Link href="/dashboard">
              <Button size="sm">Dashboard →</Button>
            </Link>
          ) : (
            <>
              <Link href="/login">
                <Button variant="ghost" size="sm">Log in</Button>
              </Link>
              <Link href="/signup">
                <Button size="sm">Start free →</Button>
              </Link>
            </>
          )}
        </div>
      </div>
    </nav>
  )
}