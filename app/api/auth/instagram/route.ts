import { NextRequest, NextResponse } from 'next/server'

export async function GET(request: NextRequest) {
  const INSTAGRAM_APP_ID = process.env.INSTAGRAM_APP_ID!
  const CALLBACK_URL = `${process.env.NEXT_PUBLIC_APP_URL}/api/auth/instagram/callback`
  
  // Get user ID passed from dashboard
  const userId = request.nextUrl.searchParams.get('uid')
  
  if (!userId) {
    return NextResponse.redirect(
      `${process.env.NEXT_PUBLIC_APP_URL}/login?error=not_logged_in`
    )
  }

  const SCOPES = [
    'instagram_business_basic',
    'instagram_business_manage_messages',
    'instagram_business_manage_comments',
  ].join(',')

  // Encode user ID in state
  const state = Buffer.from(JSON.stringify({
    userId,
    timestamp: Date.now(),
    random: Math.random().toString(36).slice(2)
  })).toString('base64')

  const oauthUrl = new URL('https://www.instagram.com/oauth/authorize')
  oauthUrl.searchParams.set('client_id', INSTAGRAM_APP_ID)
  oauthUrl.searchParams.set('redirect_uri', CALLBACK_URL)
  oauthUrl.searchParams.set('scope', SCOPES)
  oauthUrl.searchParams.set('state', state)
  oauthUrl.searchParams.set('response_type', 'code')

  return NextResponse.redirect(oauthUrl.toString())
}