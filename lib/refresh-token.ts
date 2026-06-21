import { createServiceSupabaseClient } from '@/lib/supabase-server'
import { encrypt, decrypt } from '@/lib/encryption'

export async function refreshInstagramToken(accountId: string): Promise<boolean> {
  const supabase = createServiceSupabaseClient()

  // Get the account
  const { data: account, error } = await supabase
    .from('instagram_accounts')
    .select('*')
    .eq('id', accountId)
    .single()

  if (error || !account) {
    console.error(`Account not found: ${accountId}`)
    return false
  }

  try {
    // Decrypt current token
    const currentToken = decrypt(account.access_token_enc)

    // Call Instagram refresh endpoint
    const res = await fetch(
      `https://graph.instagram.com/refresh_access_token?` +
      `grant_type=ig_refresh_token&` +
      `access_token=${currentToken}`
    )

    const data = await res.json()

    if (data.error || !data.access_token) {
      console.error(`Token refresh failed for account ${accountId}:`, data.error)
      return false
    }

    // Encrypt new token
    const newEncryptedToken = encrypt(data.access_token)

    // Calculate new expiry — Instagram returns expires_in in seconds
    const newExpiresAt = new Date()
    newExpiresAt.setSeconds(newExpiresAt.getSeconds() + data.expires_in)

    // Save to Supabase
    const { error: updateError } = await supabase
      .from('instagram_accounts')
      .update({
        access_token_enc: newEncryptedToken,
        token_expires_at: newExpiresAt.toISOString()
      })
      .eq('id', accountId)

    if (updateError) {
      console.error(`Failed to save refreshed token for ${accountId}:`, updateError)
      return false
    }

    console.log(`✅ Token refreshed for account ${accountId}, new expiry: ${newExpiresAt}`)
    return true

  } catch (err) {
    console.error(`Token refresh error for ${accountId}:`, err)
    return false
  }
}