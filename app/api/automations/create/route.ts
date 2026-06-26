import { NextRequest, NextResponse } from 'next/server'
import { createServiceSupabaseClient } from '@/lib/supabase-server'

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const {
      userId,
      igAccountId,
      postUrl,
      triggerType,
      keywords,
      dmMessage,
      replyEnabled,
      replyMessages,
    } = body

    if (!userId || !igAccountId || !postUrl || !dmMessage) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 })
    }

    const supabase = createServiceSupabaseClient()

    // Get the Instagram account and its token
    const { data: igAccount } = await supabase
      .from('instagram_accounts')
      .select('access_token_enc, ig_account_id')
      .eq('id', igAccountId)
      .eq('user_id', userId)
      .single()

    if (!igAccount) {
      return NextResponse.json({ error: 'Instagram account not found' }, { status: 404 })
    }

    // Decrypt token
    const { decrypt } = await import('@/lib/encryption')
    const accessToken = decrypt(igAccount.access_token_enc)

    // Extract shortcode from URL
    // https://www.instagram.com/p/DZzuPxGAdOY/ → DZzuPxGAdOY
    const shortcodeMatch = postUrl.match(/\/(?:p|reel|reels|tv)\/([A-Za-z0-9_-]+)/)
    if (!shortcodeMatch) {
      return NextResponse.json({ error: 'Invalid Instagram post URL' }, { status: 400 })
    }
    const shortcode = shortcodeMatch[1]

    // Get post details from Instagram API
    const mediaRes = await fetch(
      `https://graph.instagram.com/v21.0/me/media?` +
      `fields=id,caption,media_type,thumbnail_url,media_url,permalink&` +
      `access_token=${accessToken}`
    )
    const mediaData = await mediaRes.json()

    if (mediaData.error) {
      console.error('IG me/media error:', JSON.stringify(mediaData.error, null, 2))
      return NextResponse.json({
        error: 'Failed to fetch posts from Instagram',
        igError: mediaData.error.message,
        igCode: mediaData.error.code,
        igSubcode: mediaData.error.error_subcode,
        igType: mediaData.error.type,
      }, { status: 400 })
    }

    // Find the post matching this shortcode
    const post = mediaData.data?.find((p: any) =>
      p.permalink?.includes(shortcode)
    )

    if (!post) {
      return NextResponse.json({
        error: 'Post not found. Make sure this post belongs to your connected Instagram account.'
      }, { status: 404 })
    }

    const postId = post.id
    const postCaption = post.caption?.slice(0, 100) ?? ''
    const postThumbnail = post.thumbnail_url ?? post.media_url ?? null

    // Check if automation already exists for this post
    const { data: existing } = await supabase
      .from('automations')
      .select('id')
      .eq('ig_account_id', igAccountId)
      .eq('post_id', postId)
      .single()

    if (existing) {
      return NextResponse.json({
        error: 'An automation already exists for this post. Edit or delete the existing one.'
      }, { status: 400 })
    }

    // Save automation to database
    const { data: automation, error: insertError } = await supabase
      .from('automations')
      .insert({
        user_id: userId,
        ig_account_id: igAccountId,
        post_id: postId,
        post_thumbnail_url: postThumbnail,
        post_caption: postCaption,
        trigger_type: triggerType,
        keywords: triggerType === 'keyword' ? keywords : null,
        dm_message: dmMessage,
        reply_enabled: replyEnabled,
        reply_messages: replyMessages,
        is_active: true,
      })
      .select()
      .single()

    if (insertError) {
      return NextResponse.json({ error: insertError.message }, { status: 500 })
    }

    return NextResponse.json({ success: true, automation })

  } catch (err) {
    console.error('Create automation error:', err)
    return NextResponse.json({ error: 'Something went wrong' }, { status: 500 })
  }
}