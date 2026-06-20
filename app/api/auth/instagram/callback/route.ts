import { NextRequest, NextResponse } from 'next/server'
import { createServerSupabaseClient } from '@/lib/supabase-server'
import { encrypt } from '@/lib/encryption'

const APP_ID = process.env.META_APP_ID!
const APP_SECRET = process.env.META_APP_SECRET!
const APP_URL = process.env.NEXT_PUBLIC_APP_URL!

export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams
  const code = searchParams.get('code')
  const error = searchParams.get('error')

  // User denied permission
  if (error) {
    console.log('User denied OAuth:', error)
    return NextResponse.redirect(`${APP_URL}/dashboard?error=instagram_denied`)
  }

  if (!code) {
    return NextResponse.redirect(`${APP_URL}/dashboard?error=no_code`)
  }

  try {
    const CALLBACK_URL = `${APP_URL}/api/auth/instagram/callback`

    // Step A — Exchange code for short-lived token
    const tokenRes = await fetch(
      `https://graph.facebook.com/v21.0/oauth/access_token?` +
      `client_id=${APP_ID}&` +
      `client_secret=${APP_SECRET}&` +
      `redirect_uri=${encodeURIComponent(CALLBACK_URL)}&` +
      `code=${code}`
    )
    const tokenData = await tokenRes.json()

    if (tokenData.error) {
      console.error('Token exchange error:', tokenData.error)
      return NextResponse.redirect(`${APP_URL}/dashboard?error=token_exchange_failed`)
    }

    const shortLivedToken = tokenData.access_token

    // Step B — Exchange for long-lived token (valid 60 days)
    const longTokenRes = await fetch(
      `https://graph.facebook.com/v21.0/oauth/access_token?` +
      `grant_type=fb_exchange_token&` +
      `client_id=${APP_ID}&` +
      `client_secret=${APP_SECRET}&` +
      `fb_exchange_token=${shortLivedToken}`
    )
    const longTokenData = await longTokenRes.json()
    const longLivedToken = longTokenData.access_token

    // Step C — Get the Instagram Business account linked to this token
    const igAccountsRes = await fetch(
      `https://graph.facebook.com/v21.0/me/accounts?` +
      `fields=instagram_business_account{id,username}&` +
      `access_token=${longLivedToken}`
    )
    const igAccountsData = await igAccountsRes.json()

    // Find the first Instagram Business account
    const page = igAccountsData.data?.find(
      (p: any) => p.instagram_business_account
    )

    if (!page?.instagram_business_account) {
      return NextResponse.redirect(`${APP_URL}/dashboard?error=no_instagram_business_account`)
    }

    const igAccountId = page.instagram_business_account.id
    const igUsername = page.instagram_business_account.username

    // Step D — Get the page-specific token for this Instagram account
    const pageTokenRes = await fetch(
      `https://graph.facebook.com/v21.0/${page.id}?` +
      `fields=access_token&` +
      `access_token=${longLivedToken}`
    )
    const pageTokenData = await pageTokenRes.json()
    const pageAccessToken = pageTokenData.access_token ?? longLivedToken

    // Step E — Encrypt the token before saving
    const encryptedToken = encrypt(pageAccessToken)

    // Token expires in 60 days
    const expiresAt = new Date()
    expiresAt.setDate(expiresAt.getDate() + 60)

    // Step F — Get the logged in user from Supabase session
    // We read the session token from the request cookies
    const supabase = createServerSupabaseClient()
    
    const authHeader = request.headers.get('cookie') ?? ''
    const accessTokenMatch = authHeader.match(/sb-[^-]+-auth-token=([^;]+)/)
    
    // Get user from the authorization header
    const { data: { user }, error: userError } = await supabase.auth.getUser()

    // Since we can't easily get the user in this server context yet,
    // we'll store the IG data in a temp cookie and handle it client-side
    // This is the simplest approach for now

    // Step G — Save to Supabase
    // We'll use service role for this — add SUPABASE_SERVICE_KEY to env later
    // For now redirect with the data encoded
    const successUrl = new URL(`${APP_URL}/api/auth/instagram/save`)
    successUrl.searchParams.set('ig_account_id', igAccountId)
    successUrl.searchParams.set('ig_username', igUsername)
    successUrl.searchParams.set('encrypted_token', encryptedToken)
    successUrl.searchParams.set('expires_at', expiresAt.toISOString())

    return NextResponse.redirect(successUrl.toString())

  } catch (err) {
    console.error('OAuth callback error:', err)
    return NextResponse.redirect(`${APP_URL}/dashboard?error=oauth_failed`)
  }
}