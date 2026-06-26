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
      .select('access_token_enc, ig_account_id, ig_username')
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
    const shortcodeMatch = postUrl.match(/\/(?:p|reel|reels|tv)\/([A-Za-z0-9_-]+)/)
    if (!shortcodeMatch) {
      return NextResponse.json({ error: 'Invalid Instagram post URL' }, { status: 400 })
    }
    const shortcode = shortcodeMatch[1]

    // Try to get post details from Instagram API
    let postId: string | null = null
    let postCaption = ''
    let postThumbnail: string | null = null

    try {
      // Fetch user's media list
      const mediaRes = await fetch(
        `https://graph.instagram.com/v21.0/me/media?` +
        `fields=id,caption,media_type,thumbnail_url,media_url,permalink&` +
        `access_token=${accessToken}&` +
        `limit=50`
      )
      const mediaData = await mediaRes.json()

      console.log('Media fetch response status:', mediaRes.status)
      console.log('Media fetch error if any:', JSON.stringify(mediaData.error))

      if (!mediaData.error && mediaData.data) {
        // Find the post matching this shortcode
        const post = mediaData.data?.find((p: any) =>
          p.permalink?.includes(shortcode)
        )

        if (post) {
          postId = post.id
          postCaption = post.caption?.slice(0, 100) ?? ''
          postThumbnail = post.thumbnail_url ?? post.media_url ?? null
          console.log(`✅ Found post via API: ${postId}`)
        }
      } else {
        console.warn('Could not fetch media list:', mediaData.error?.message)
      }
    } catch (mediaErr) {
      console.warn('Media fetch failed, will use shortcode method:', mediaErr)
    }

    // Fallback — if API fetch failed or post not found,
    // try the oEmbed API to at least get the post ID
    if (!postId) {
      try {
        const oembedRes = await fetch(
          `https://graph.facebook.com/v21.0/instagram_oembed?` +
          `url=${encodeURIComponent(postUrl)}&` +
          `access_token=${process.env.META_APP_ID}|${process.env.META_APP_SECRET}`
        )
        const oembedData = await oembedRes.json()
        console.log('oEmbed response:', JSON.stringify(oembedData))

        if (!oembedData.error && oembedData.media_id) {
          postId = oembedData.media_id
          postThumbnail = oembedData.thumbnail_url ?? null
          postCaption = oembedData.title ?? ''
          console.log(`✅ Found post via oEmbed: ${postId}`)
        }
      } catch (oembedErr) {
        console.warn('oEmbed also failed:', oembedErr)
      }
    }

    // Last resort fallback — use shortcode as post identifier
    // This means automations will work but without thumbnail
    if (!postId) {
      console.warn('Could not verify post via API — using shortcode as identifier')
      postId = `shortcode_${shortcode}`
      postCaption = ''
      postThumbnail = null
    }

    // Check if automation already exists for this post
    const { data: existing } = await supabase
      .from('automations')
      .select('id')
      .eq('ig_account_id', igAccountId)
      .eq('post_id', postId)
      .maybeSingle()

    if (existing) {
      return NextResponse.json({
        error: 'An automation already exists for this post. Delete the existing one first.'
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