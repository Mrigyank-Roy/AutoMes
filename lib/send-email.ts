export async function sendTokenExpiredEmail(
  email: string,
  igUsername: string
): Promise<void> {
  const res = await fetch('https://api.resend.com/emails', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${process.env.RESEND_API_KEY}`
    },
    body: JSON.stringify({
      from: 'AutoMes <noreply@auto-mes.vercel.app>',
      to: email,
      subject: 'Action needed — reconnect your Instagram account',
      html: `
        <div style="font-family: sans-serif; max-width: 500px; margin: 0 auto;">
          <h2>Your Instagram connection needs attention</h2>
          <p>Hi there,</p>
          <p>We weren't able to refresh the connection to your 
          <strong>@${igUsername}</strong> Instagram account. 
          Your automations may stop working soon.</p>
          <p>Please reconnect your account to keep your automations running:</p>
          <a href="${process.env.NEXT_PUBLIC_APP_URL}/dashboard" 
             style="background: black; color: white; padding: 12px 24px; 
                    text-decoration: none; border-radius: 6px; display: inline-block;">
            Reconnect Instagram
          </a>
          <p style="margin-top: 24px; color: #666; font-size: 14px;">
            This usually happens when you changed your Instagram password 
            or revoked app permissions.
          </p>
        </div>
      `
    })
  })

  if (!res.ok) {
    console.error('Failed to send email:', await res.text())
  } else {
    console.log(`📧 Alert email sent to ${email}`)
  }
}