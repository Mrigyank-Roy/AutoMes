import { NextRequest, NextResponse } from 'next/server'
import { createServiceSupabaseClient } from '@/lib/supabase-server'

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const {
      automationId,
      userId,
      triggerType,
      keywords,
      dmMessage,
      replyEnabled,
      replyMessages,
      autoDeactivateDays,
    } = body

    if (!automationId || !userId || !dmMessage) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 })
    }

    const supabase = createServiceSupabaseClient()

    // Verify this automation belongs to this user
    const { data: existing } = await supabase
      .from('automations')
      .select('id, created_at')
      .eq('id', automationId)
      .eq('user_id', userId)
      .single()

    if (!existing) {
      return NextResponse.json({ error: 'Automation not found' }, { status: 404 })
    }

    // Calculate deactivates_at from auto_deactivate_days
    let deactivatesAt: string | null = null
    if (autoDeactivateDays && autoDeactivateDays > 0) {
      const createdAt = new Date(existing.created_at)
      deactivatesAt = new Date(
        createdAt.getTime() + autoDeactivateDays * 24 * 60 * 60 * 1000
      ).toISOString()
    }

    const { data: updated, error: updateError } = await supabase
      .from('automations')
      .update({
        trigger_type: triggerType,
        keywords: triggerType === 'keyword' ? keywords : null,
        dm_message: dmMessage,
        reply_enabled: replyEnabled,
        reply_messages: replyMessages,
        auto_deactivate_days: autoDeactivateDays,
        deactivates_at: deactivatesAt,
      })
      .eq('id', automationId)
      .eq('user_id', userId)
      .select()
      .single()

    if (updateError) {
      return NextResponse.json({ error: updateError.message }, { status: 500 })
    }

    return NextResponse.json({ success: true, automation: updated })

  } catch (err) {
    console.error('Update automation error:', err)
    return NextResponse.json({ error: 'Something went wrong' }, { status: 500 })
  }
}