const GRAPH = 'https://graph.instagram.com/v21.0'

export type UserProfile = {
  id?: string
  name?: string
  profile_pic?: string
  follower_count?: number
  is_user_follow_business?: boolean
  is_verified_user?: boolean
}

export async function getUserProfile(igsid: string, accessToken: string): Promise<UserProfile | null> {
  const fields = 'name,profile_pic,follower_count,is_user_follow_business,is_verified_user'
  const url = `${GRAPH}/${igsid}?fields=${fields}&access_token=${accessToken}`
  try {
    const res = await fetch(url, { method: 'GET' })
    const data = await res.json()
    if (!res.ok) {
      console.error('[follow-gate] profile lookup failed:', data?.error?.message || data)
      return null
    }
    return data as UserProfile
  } catch (err) {
    console.error('[follow-gate] profile lookup error:', err)
    return null
  }
}

export async function isFollowing(igsid: string, accessToken: string): Promise<boolean> {
  const profile = await getUserProfile(igsid, accessToken)
  return profile?.is_user_follow_business === true
}

export async function isFollowingWithRetry(
  igsid: string,
  accessToken: string,
  retryDelayMs = 3000
): Promise<boolean> {
  if (await isFollowing(igsid, accessToken)) return true
  await new Promise((r) => setTimeout(r, retryDelayMs))
  return isFollowing(igsid, accessToken)
}