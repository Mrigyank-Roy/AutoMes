export const FG = {
  ACCESS: 'FG_ACCESS:',
  FOLLOW: 'FG_FOLLOW:',
}

export const FOLLOW_GATE_DEFAULTS = {
  step1_text: "Hey! Thanks so much for stopping by 😊 Tap below and I'll send you access shortly ✨",
  step1_button: 'Send me the access',
  step2_text: "Hey! It looks like you're not following me yet. I'd love it if you could check out my profile and hit follow 😊",
  step2_follow_button: "I'm following ✅",
}

export function profileUrlFromUsername(username: string): string {
  return `https://www.instagram.com/${(username || '').replace(/^@/, '').trim()}`
}

export function parseGatePayload(
  payload?: string | null
): { kind: 'access' | 'follow'; automationId: string } | null {
  if (!payload) return null
  if (payload.startsWith(FG.ACCESS)) return { kind: 'access', automationId: payload.slice(FG.ACCESS.length) }
  if (payload.startsWith(FG.FOLLOW)) return { kind: 'follow', automationId: payload.slice(FG.FOLLOW.length) }
  return null
}