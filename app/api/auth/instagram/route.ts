import { NextRequest, NextResponse } from 'next/server'

export async function GET(request: NextRequest) {
  const APP_ID = process.env.META_APP_ID!
  const CALLBACK_URL = `${process.env.NEXT_PUBLIC_APP_URL}/api/auth/instagram/callback`

  // These are the correct scopes for Business Login for Instagram
  const SCOPES = [
    'instagram_business_basic',
    'instagram_business_manage_messages',
    'instagram_business_manage_comments',
  ].join(',')

  const state = Buffer.from(JSON.stringify({
    timestamp: Date.now(),
    random: Math.random().toString(36).slice(2)
  })).toString('base64')

  // Business Login for Instagram uses a different OAuth URL
  const oauthUrl = new URL('https://www.instagram.com/oauth/authorize')
  oauthUrl.searchParams.set('client_id', APP_ID)
  oauthUrl.searchParams.set('redirect_uri', CALLBACK_URL)
  oauthUrl.searchParams.set('scope', SCOPES)
  oauthUrl.searchParams.set('state', state)
  oauthUrl.searchParams.set('response_type', 'code')

  return NextResponse.redirect(oauthUrl.toString())
}