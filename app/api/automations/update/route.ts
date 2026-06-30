import { NextRequest, NextResponse } from 'next/server'
import { createServiceSupabaseClient } from '@/lib/supabase-server'

const PRO_PLANS = ['pro', 'agency']

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const {
      automationId, userId, triggerType, keywords, dmMessage, dmButtons,
      followersOnly, replyEnabled, replyMessages, autoDeactivateDays,
    } = body

    if (!automationId || !userId || !dmMessage) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 })
    }

    // Validate & clean buttons
    let cleanButtons: Array<{ label: string; url: string; kind?: string }> = []
    if (Array.isArray(dmButtons)) {
      cleanButtons = dmButtons
        .filter((b: any) => b && b.url && b.label)
        .slice(0, 3)
        .map((b: any) => ({
          label: String(b.label).trim().slice(0, 20),
          url: String(b.url).trim(),
          ...(b.kind === 'follow' ? { kind: 'follow' } : {}),
        }))
      for (const b of cleanButtons) {
        if (!/^https?:\/\//i.test(b.url)) {
          return NextResponse.json({ error: 'Each button link must start with http:// or https://' }, { status: 400 })
        }
        if (!b.label) {
          return NextResponse.json({ error: 'Each button needs a label' }, { status: 400 })
        }
      }
    }

    const supabase = createServiceSupabaseClient()

    const { data: existing } = await supabase
      .from('automations').select('id, created_at')
      .eq('id', automationId).eq('user_id', userId).single()
    if (!existing) {
      return NextResponse.json({ error: 'Automation not found' }, { status: 404 })
    }

    let deactivatesAt: string | null = null
    if (autoDeactivateDays && autoDeactivateDays > 0) {
      const createdAt = new Date(existing.created_at)
      deactivatesAt = new Date(createdAt.getTime() + autoDeactivateDays * 24 * 60 * 60 * 1000).toISOString()
    }

    const updateData: Record<string, unknown> = {
      trigger_type: triggerType,
      keywords: triggerType === 'keyword' ? keywords : null,
      dm_message: dmMessage,
      dm_buttons: cleanButtons,
      reply_enabled: replyEnabled,
      reply_messages: replyMessages,
      auto_deactivate_days: autoDeactivateDays,
      deactivates_at: deactivatesAt,
    }

    // Only touch followers_only if the form actually sent it (Pro/Agency gated)
    if (typeof followersOnly !== 'undefined') {
      if (followersOnly) {
        const { data: sub } = await supabase
          .from('subscriptions').select('plan_name').eq('user_id', userId).single()
        if (!sub || !PRO_PLANS.includes(sub.plan_name)) {
          return NextResponse.json({ error: 'Follower-only automations are available on the Pro and Agency plans.' }, { status: 403 })
        }
      }
      updateData.followers_only = !!followersOnly
    }

    const { data: updated, error: updateError } = await supabase
      .from('automations')
      .update(updateData)
      .eq('id', automationId).eq('user_id', userId)
      .select().single()

    if (updateError) {
      return NextResponse.json({ error: updateError.message }, { status: 500 })
    }

    return NextResponse.json({ success: true, automation: updated })
  } catch (err) {
    console.error('Update automation error:', err)
    return NextResponse.json({ error: 'Something went wrong' }, { status: 500 })
  }
}