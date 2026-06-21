'use client'

import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Switch } from '@/components/ui/switch'
import { Card, CardContent } from '@/components/ui/card'
import Link from 'next/link'

export default function AutomationsPage() {
  const router = useRouter()
  const [automations, setAutomations] = useState<any[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    loadAutomations()
  }, [])

  async function loadAutomations() {
    const { data: { session } } = await supabase.auth.getSession()
    if (!session) { router.push('/login'); return }

    const { data } = await supabase
      .from('automations')
      .select(`
        *,
        instagram_accounts(ig_username)
      `)
      .eq('user_id', session.user.id)
      .order('created_at', { ascending: false })

    setAutomations(data ?? [])
    setLoading(false)
  }

  async function toggleAutomation(id: string, currentState: boolean) {
    await supabase
      .from('automations')
      .update({ is_active: !currentState })
      .eq('id', id)

    setAutomations(prev =>
      prev.map(a => a.id === id ? { ...a, is_active: !currentState } : a)
    )
  }

  async function deleteAutomation(id: string) {
    if (!confirm('Delete this automation? This cannot be undone.')) return
    await supabase.from('automations').delete().eq('id', id)
    setAutomations(prev => prev.filter(a => a.id !== id))
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <p className="text-sm text-gray-400">Loading...</p>
      </div>
    )
  }

  return (
    <div className="max-w-4xl">
      {/* Header */}
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-2xl font-semibold">Automations</h1>
          <p className="text-sm text-gray-500 mt-1">
            Manage your comment-to-DM automations
          </p>
        </div>
        <Link href="/dashboard/automations/new">
          <Button>+ Create automation</Button>
        </Link>
      </div>

      {/* Empty state */}
      {automations.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-16">
            <p className="text-2xl mb-3">⚡</p>
            <p className="font-medium text-gray-700 mb-1">No automations yet</p>
            <p className="text-sm text-gray-400 mb-6 text-center max-w-xs">
              Create your first automation to start sending DMs automatically when people comment
            </p>
            <Link href="/dashboard/automations/new">
              <Button>Create your first automation</Button>
            </Link>
          </CardContent>
        </Card>
      ) : (
        <div className="flex flex-col gap-3">
          {automations.map((automation) => (
            <Card key={automation.id}>
              <CardContent className="py-4 px-5">
                <div className="flex items-start justify-between gap-4">

                  {/* Left side */}
                  <div className="flex gap-4 flex-1 min-w-0">

                    {/* Thumbnail */}
                    {automation.post_thumbnail_url && !automation.post_thumbnail_url.includes('placeholder') ? (
                      <img
                        src={automation.post_thumbnail_url}
                        alt="Post thumbnail"
                        className="w-14 h-14 rounded-lg object-cover flex-shrink-0 border"
                      />
                    ) : (
                      <div className="w-14 h-14 rounded-lg bg-gray-100 flex-shrink-0 flex items-center justify-center border">
                        <span className="text-gray-300 text-xs text-center leading-tight">No img</span>
                      </div>
                    )}

                    {/* Details */}
                    <div className="flex-1 min-w-0">
                      {/* Account + caption + trigger type */}
                      <div className="flex items-center gap-2 mb-1 flex-wrap">
                        <span className="text-sm font-medium">
                          @{automation.instagram_accounts?.ig_username}
                        </span>
                        {automation.post_caption && (
                          <span className="text-xs text-gray-400 truncate max-w-24">
                            "{automation.post_caption}"
                          </span>
                        )}
                        <Badge variant="secondary" className="text-xs">
                          {automation.trigger_type === 'any' ? 'Any comment' : 'Keyword'}
                        </Badge>
                        {automation.reply_enabled && (
                          <Badge variant="outline" className="text-xs">
                            Public reply on
                          </Badge>
                        )}
                      </div>

                      {/* Keywords */}
                      {automation.trigger_type === 'keyword' && automation.keywords && (
                        <div className="flex flex-wrap gap-1.5 mb-1.5">
                          {automation.keywords.map((kw: string) => (
                            <span
                              key={kw}
                              className="text-xs bg-gray-100 text-gray-600 px-2 py-0.5 rounded-full"
                            >
                              {kw}
                            </span>
                          ))}
                        </div>
                      )}

                      {/* DM message preview */}
                      <p className="text-xs text-gray-400 truncate max-w-md">
                        DM: {automation.dm_message}
                      </p>
                    </div>
                  </div>

                  {/* Right side — toggle + actions */}
                  <div className="flex items-center gap-3 flex-shrink-0">
                    <Switch
                      checked={automation.is_active}
                      onCheckedChange={() => toggleAutomation(automation.id, automation.is_active)}
                    />
                    <span className="text-xs text-gray-400 w-12">
                      {automation.is_active ? 'Active' : 'Paused'}
                    </span>
                    <Button
                      variant="ghost"
                      size="sm"
                      className="text-red-400 hover:text-red-600 hover:bg-red-50"
                      onClick={() => deleteAutomation(automation.id)}
                    >
                      Delete
                    </Button>
                  </div>

                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  )
}