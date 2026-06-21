'use client'

import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Switch } from '@/components/ui/switch'
import { Badge } from '@/components/ui/badge'
import Link from 'next/link'

export default function NewAutomationPage() {
  const router = useRouter()

  const [userId, setUserId] = useState('')
  const [igAccounts, setIgAccounts] = useState<any[]>([])
  const [subscription, setSubscription] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState('')

  // Form state
  const [selectedAccountId, setSelectedAccountId] = useState('')
  const [postUrl, setPostUrl] = useState('')
  const [triggerType, setTriggerType] = useState<'any' | 'keyword'>('keyword')
  const [keywords, setKeywords] = useState<string[]>([])
  const [keywordInput, setKeywordInput] = useState('')
  const [dmMessage, setDmMessage] = useState('')
  const [replyEnabled, setReplyEnabled] = useState(false)
  const [replyMessages, setReplyMessages] = useState<string[]>([
    'Check your DMs! 📩',
    'Sent you a DM! 🙌',
  ])
  const [replyInput, setReplyInput] = useState('')

  useEffect(() => {
    async function loadData() {
      const { data: { session } } = await supabase.auth.getSession()
      if (!session) { router.push('/login'); return }

      setUserId(session.user.id)

      const { data: accounts } = await supabase
        .from('instagram_accounts')
        .select('*')
        .eq('user_id', session.user.id)

      setIgAccounts(accounts ?? [])
      if (accounts && accounts.length > 0) {
        setSelectedAccountId(accounts[0].id)
      }

      const { data: sub } = await supabase
        .from('subscriptions')
        .select('*')
        .eq('user_id', session.user.id)
        .single()

      setSubscription(sub)
      setLoading(false)
    }

    loadData()
  }, [router])

  function addKeyword() {
    const kw = keywordInput.trim()
    if (!kw || keywords.includes(kw)) return
    setKeywords(prev => [...prev, kw])
    setKeywordInput('')
  }

  function removeKeyword(kw: string) {
    setKeywords(prev => prev.filter(k => k !== kw))
  }

  function handleKeywordKeyDown(e: React.KeyboardEvent) {
    if (e.key === 'Enter' || e.key === ',') {
      e.preventDefault()
      addKeyword()
    }
  }

  function addReplyMessage() {
    const msg = replyInput.trim()
    if (!msg || replyMessages.includes(msg)) return
    if (replyMessages.length >= 6) {
      setError('Maximum 6 reply variations allowed')
      return
    }
    setReplyMessages(prev => [...prev, msg])
    setReplyInput('')
  }

  function removeReplyMessage(msg: string) {
    if (replyMessages.length <= 1) return
    setReplyMessages(prev => prev.filter(m => m !== msg))
  }

  async function handleSubmit() {
    setError('')

    if (!selectedAccountId) {
      setError('Please select an Instagram account')
      return
    }
    if (!postUrl.trim()) {
      setError('Please enter an Instagram post URL')
      return
    }
    if (!postUrl.includes('instagram.com/p/')) {
      setError('Please enter a valid Instagram post URL (instagram.com/p/...)')
      return
    }
    if (triggerType === 'keyword' && keywords.length === 0) {
      setError('Please add at least one keyword')
      return
    }
    if (!dmMessage.trim()) {
      setError('Please write a DM message')
      return
    }
    if (dmMessage.length > 1000) {
      setError('DM message must be under 1000 characters')
      return
    }

    setSubmitting(true)

    const res = await fetch('/api/automations/create', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        userId,
        igAccountId: selectedAccountId,
        postUrl: postUrl.trim(),
        triggerType,
        keywords,
        dmMessage: dmMessage.trim(),
        replyEnabled,
        replyMessages,
      })
    })

    const data = await res.json()

    if (!res.ok) {
      setError(data.error ?? 'Something went wrong')
      setSubmitting(false)
      return
    }

    router.push('/dashboard/automations?created=true')
  }

  const canUseReply = subscription &&
    ['starter', 'pro', 'agency'].includes(subscription.plan_name)

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <p className="text-sm text-gray-400">Loading...</p>
      </div>
    )
  }

  if (igAccounts.length === 0) {
    return (
      <div className="max-w-2xl">
        <Card>
          <CardContent className="py-16 flex flex-col items-center">
            <p className="text-2xl mb-3">📱</p>
            <p className="font-medium mb-1">No Instagram account connected</p>
            <p className="text-sm text-gray-400 mb-6">
              Connect your Instagram Business account first
            </p>
            <Link href="/dashboard/settings">
              <Button>Connect Instagram</Button>
            </Link>
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className="max-w-2xl">
      {/* Header */}
      <div className="flex items-center gap-4 mb-8">
        <Link href="/dashboard/automations">
          <Button variant="ghost" size="sm">← Back</Button>
        </Link>
        <div>
          <h1 className="text-2xl font-semibold">Create automation</h1>
          <p className="text-sm text-gray-500 mt-0.5">
            Set up automatic DMs when people comment on your post
          </p>
        </div>
      </div>

      <div className="flex flex-col gap-5">

        {/* Step 1 — Select Instagram account */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              <span className="w-5 h-5 rounded-full bg-black text-white text-xs flex items-center justify-center">1</span>
              Instagram account
            </CardTitle>
          </CardHeader>
          <CardContent>
            {igAccounts.length === 1 ? (
              <div className="flex items-center gap-2 text-sm">
                <span className="w-7 h-7 rounded-full bg-gray-100 flex items-center justify-center text-xs">
                  @
                </span>
                <span className="font-medium">@{igAccounts[0].ig_username}</span>
              </div>
            ) : (
              <select
                value={selectedAccountId}
                onChange={e => setSelectedAccountId(e.target.value)}
                className="w-full border rounded-lg px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-black"
              >
                {igAccounts.map(acc => (
                  <option key={acc.id} value={acc.id}>
                    @{acc.ig_username}
                  </option>
                ))}
              </select>
            )}
          </CardContent>
        </Card>

        {/* Step 2 — Post URL */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              <span className="w-5 h-5 rounded-full bg-black text-white text-xs flex items-center justify-center">2</span>
              Instagram post URL
            </CardTitle>
          </CardHeader>
          <CardContent>
            <input
              type="url"
              value={postUrl}
              onChange={e => setPostUrl(e.target.value)}
              placeholder="https://www.instagram.com/p/DZzuPxGAdOY/"
              className="w-full border rounded-lg px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-black"
            />
            <p className="text-xs text-gray-400 mt-2">
              Open the post on Instagram → tap the three dots → Copy link
            </p>
          </CardContent>
        </Card>

        {/* Step 3 — Trigger type */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              <span className="w-5 h-5 rounded-full bg-black text-white text-xs flex items-center justify-center">3</span>
              Trigger type
            </CardTitle>
          </CardHeader>
          <CardContent className="flex flex-col gap-3">
            <label className={`flex items-start gap-3 p-3 rounded-lg border cursor-pointer transition-colors ${
              triggerType === 'any' ? 'border-black bg-gray-50' : 'border-gray-200'
            }`}>
              <input
                type="radio"
                name="triggerType"
                value="any"
                checked={triggerType === 'any'}
                onChange={() => setTriggerType('any')}
                className="mt-0.5"
              />
              <div>
                <p className="text-sm font-medium">Any comment</p>
                <p className="text-xs text-gray-400 mt-0.5">
                  Send DM to everyone who comments on this post
                </p>
              </div>
            </label>

            <label className={`flex items-start gap-3 p-3 rounded-lg border cursor-pointer transition-colors ${
              triggerType === 'keyword' ? 'border-black bg-gray-50' : 'border-gray-200'
            }`}>
              <input
                type="radio"
                name="triggerType"
                value="keyword"
                checked={triggerType === 'keyword'}
                onChange={() => setTriggerType('keyword')}
                className="mt-0.5"
              />
              <div className="flex-1">
                <p className="text-sm font-medium">Specific keywords</p>
                <p className="text-xs text-gray-400 mt-0.5">
                  Only send DM when comment contains one of your keywords
                </p>

                {/* Keyword input — shown only when keyword is selected */}
                {triggerType === 'keyword' && (
                  <div className="mt-3">
                    <div className="flex flex-wrap gap-1.5 mb-2">
                      {keywords.map(kw => (
                        <span
                          key={kw}
                          className="flex items-center gap-1 text-xs bg-black text-white px-2.5 py-1 rounded-full"
                        >
                          {kw}
                          <button
                            onClick={() => removeKeyword(kw)}
                            className="hover:text-gray-300 ml-0.5"
                          >
                            ×
                          </button>
                        </span>
                      ))}
                    </div>
                    <div className="flex gap-2">
                      <input
                        type="text"
                        value={keywordInput}
                        onChange={e => setKeywordInput(e.target.value)}
                        onKeyDown={handleKeywordKeyDown}
                        placeholder="Type keyword and press Enter"
                        className="flex-1 border rounded-lg px-3 py-1.5 text-sm outline-none focus:ring-2 focus:ring-black"
                      />
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        onClick={addKeyword}
                      >
                        Add
                      </Button>
                    </div>
                    <p className="text-xs text-gray-400 mt-1">
                      Press Enter or comma to add. Not case sensitive.
                    </p>
                  </div>
                )}
              </div>
            </label>
          </CardContent>
        </Card>

        {/* Step 4 — DM message */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              <span className="w-5 h-5 rounded-full bg-black text-white text-xs flex items-center justify-center">4</span>
              DM message
            </CardTitle>
          </CardHeader>
          <CardContent>
            <textarea
              value={dmMessage}
              onChange={e => setDmMessage(e.target.value)}
              placeholder="Hey! Here's the free guide you asked for 👉 [your link here]"
              rows={4}
              maxLength={1000}
              className="w-full border rounded-lg px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-black resize-none"
            />
            <div className="flex justify-between mt-1">
              <p className="text-xs text-gray-400">
                This message will be sent automatically to every commenter
              </p>
              <p className={`text-xs ${dmMessage.length > 900 ? 'text-red-400' : 'text-gray-400'}`}>
                {dmMessage.length} / 1000
              </p>
            </div>
          </CardContent>
        </Card>

        {/* Step 5 — Public comment reply */}
        <Card className={!canUseReply ? 'opacity-75' : ''}>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              <span className="w-5 h-5 rounded-full bg-black text-white text-xs flex items-center justify-center">5</span>
              Public comment reply
              <Badge variant="secondary" className="text-xs ml-1">Starter+</Badge>
            </CardTitle>
          </CardHeader>
          <CardContent>
            {!canUseReply ? (
              <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg border border-dashed">
                <div>
                  <p className="text-sm font-medium">🔒 Available on Starter plan</p>
                  <p className="text-xs text-gray-400 mt-0.5">
                    Automatically reply to comments to drive more engagement
                  </p>
                </div>
                <Link href="/dashboard/billing">
                  <Button size="sm" variant="outline">Upgrade</Button>
                </Link>
              </div>
            ) : (
              <div className="flex flex-col gap-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium">Reply to comments publicly</p>
                    <p className="text-xs text-gray-400 mt-0.5">
                      Post a public reply like "Check your DMs!" — rotated randomly
                    </p>
                  </div>
                  <Switch
                    checked={replyEnabled}
                    onCheckedChange={setReplyEnabled}
                  />
                </div>

                {replyEnabled && (
                  <div>
                    <p className="text-xs font-medium text-gray-600 mb-2">
                      Reply variations (picked randomly)
                    </p>
                    <div className="flex flex-col gap-2 mb-3">
                      {replyMessages.map((msg, i) => (
                        <div key={i} className="flex items-center gap-2">
                          <span className="flex-1 text-sm border rounded-lg px-3 py-1.5 bg-gray-50">
                            {msg}
                          </span>
                          <button
                            onClick={() => removeReplyMessage(msg)}
                            className="text-gray-300 hover:text-red-400 text-lg leading-none"
                          >
                            ×
                          </button>
                        </div>
                      ))}
                    </div>
                    {replyMessages.length < 6 && (
                      <div className="flex gap-2">
                        <input
                          type="text"
                          value={replyInput}
                          onChange={e => setReplyInput(e.target.value)}
                          onKeyDown={e => e.key === 'Enter' && addReplyMessage()}
                          placeholder="Add another reply variation..."
                          className="flex-1 border rounded-lg px-3 py-1.5 text-sm outline-none focus:ring-2 focus:ring-black"
                        />
                        <Button
                          type="button"
                          variant="outline"
                          size="sm"
                          onClick={addReplyMessage}
                        >
                          Add
                        </Button>
                      </div>
                    )}
                  </div>
                )}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Error */}
        {error && (
          <div className="bg-red-50 text-red-600 text-sm px-4 py-3 rounded-lg">
            {error}
          </div>
        )}

        {/* Submit */}
        <div className="flex gap-3 pb-8">
          <Link href="/dashboard/automations" className="flex-1">
            <Button variant="outline" className="w-full">Cancel</Button>
          </Link>
          <Button
            onClick={handleSubmit}
            disabled={submitting}
            className="flex-1"
          >
            {submitting ? 'Creating automation...' : 'Create automation'}
          </Button>
        </div>

      </div>
    </div>
  )
}