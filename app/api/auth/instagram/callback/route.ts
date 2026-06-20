import { NextRequest, NextResponse } from 'next/server'
import { createServiceSupabaseClient } from '@/lib/supabase-server'
import { encrypt } from '@/lib/encryption'

const INSTAGRAM_APP_ID = process.env.INSTAGRAM_APP_ID!
const INSTAGRAM_APP_SECRET = process.env.INSTAGRAM_APP_SECRET!
const APP_URL = process.env.NEXT_PUBLIC_APP_URL!

export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams
  const code = searchParams.get('code')
  const error = searchParams.get('error')

  if (error) {
    return NextResponse.redirect(`${APP_URL}/dashboard?error=instagram_denied`)
  }

  if (!code) {
    return NextResponse.redirect(`${APP_URL}/dashboard?error=no_code`)
  }

  try {
    const CALLBACK_URL = `${APP_URL}/api/auth/instagram/callback`

    // Step A — Exchange code for short-lived token
    // Instagram Login uses api.instagram.com not graph.facebook.com
    const tokenRes = await fetch('https://api.instagram.com/oauth/access_token', {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: new URLSearchParams({
        client_id: INSTAGRAM_APP_ID,
        client_secret: INSTAGRAM_APP_SECRET,
        grant_type: 'authorization_code',
        redirect_uri: CALLBACK_URL,
        code: code,
      })
    })
    const tokenData = await tokenRes.json()
    console.log('Short-lived token response:', tokenData)

    if (tokenData.error_type || !tokenData.access_token) {
      console.error('Token exchange error:', tokenData)
      return NextResponse.redirect(`${APP_URL}/dashboard?error=token_exchange_failed`)
    }

    const shortLivedToken = tokenData.access_token
    const igUserId = tokenData.user_id

    // Step B — Exchange for long-lived token (valid 60 days)
    const longTokenRes = await fetch(
      `https://graph.instagram.com/access_token?` +
      `grant_type=ig_exchange_token&` +
      `client_secret=${INSTAGRAM_APP_SECRET}&` +
      `access_token=${shortLivedToken}`
    )
    const longTokenData = await longTokenRes.json()
    console.log('Long-lived token response:', longTokenData)

    const longLivedToken = longTokenData.access_token

    // Step C — Get Instagram account details
    const igProfileRes = await fetch(
      `https://graph.instagram.com/v21.0/me?` +
      `fields=id,username&` +
      `access_token=${longLivedToken}`
    )
    const igProfile = await igProfileRes.json()
    console.log('IG Profile:', igProfile)

    const igAccountId = igProfile.id
    const igUsername = igProfile.username

    // Step D — Encrypt the token
    const encryptedToken = encrypt(longLivedToken)

    // Token expires in 60 days
    const expiresAt = new Date()
    expiresAt.setDate(expiresAt.getDate() + 60)

    // Step E — Get user from cookies and save to Supabase
    const cookieHeader = request.headers.get('cookie') ?? ''
    const cookies = Object.fromEntries(
      cookieHeader.split(';').map(c => {
        const [key, ...val] = c.trim().split('=')
        return [key.trim(), val.join('=')]
      })
    )

    const sessionKey = Object.keys(cookies).find(k => 
      k.includes('auth-token') && !k.includes('code-verifier')
    )

    if (!sessionKey) {
      console.error('No session cookie found. Keys:', Object.keys(cookies))
      return NextResponse.redirect(`${APP_URL}/login?error=not_logged_in`)
    }

    let userId: string | null = null
    try {
      const sessionData = JSON.parse(decodeURIComponent(cookies[sessionKey]))
      userId = sessionData?.user?.id
    } catch (e) {
      console.error('Failed to parse session cookie:', e)
      return NextResponse.redirect(`${APP_URL}/login?error=session_parse_failed`)
    }

    if (!userId) {
      return NextResponse.redirect(`${APP_URL}/login?error=not_logged_in`)
    }

    // Step F — Save to Supabase
    const serviceSupabase = createServiceSupabaseClient()

    const { error: dbError } = await serviceSupabase
      .from('instagram_accounts')
      .upsert({
        user_id: userId,
        ig_account_id: igAccountId,
        ig_username: igUsername,
        access_token_enc: encryptedToken,
        token_expires_at: expiresAt.toISOString()
      }, {
        onConflict: 'ig_account_id'
      })

    if (dbError) {
      console.error('Supabase save error:', dbError)
      return NextResponse.redirect(`${APP_URL}/dashboard?error=save_failed`)
    }

    return NextResponse.redirect(`${APP_URL}/dashboard?success=instagram_connected`)

  } catch (err) {
    console.error('OAuth callback error:', err)
    return NextResponse.redirect(`${APP_URL}/dashboard?error=oauth_failed`)
  }
}