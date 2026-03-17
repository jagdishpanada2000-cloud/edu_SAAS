import { NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { google } from 'googleapis'

type NotifyPayload = {
  name: string
  email: string
  type: string
  phone?: string
  course_interest?: string
  message?: string
  branch_id?: string
}

const GMAIL_CLIENT_ID = process.env.GMAIL_CLIENT_ID
const GMAIL_CLIENT_SECRET = process.env.GMAIL_CLIENT_SECRET
const GMAIL_REDIRECT_URI = process.env.GMAIL_REDIRECT_URI || 'http://localhost:3000/auth/callback'

async function sendGmailNotification(
  fromEmail: string,
  toEmail: string,
  subject: string,
  body: string,
  accessToken: string,
  refreshToken: string
) {
  const oAuth2Client = new google.auth.OAuth2(
    GMAIL_CLIENT_ID,
    GMAIL_CLIENT_SECRET,
    GMAIL_REDIRECT_URI
  )

  oAuth2Client.setCredentials({ 
    access_token: accessToken,
    refresh_token: refreshToken 
  })

  const gmail = google.gmail({ version: 'v1', auth: oAuth2Client })

  const utf8Subject = `=?utf-8?B?${Buffer.from(subject).toString('base64')}?=`
  const messageParts = [
    `From: ${fromEmail}`,
    `To: ${toEmail}`,
    'Content-Type: text/plain; charset=utf-8',
    'MIME-Version: 1.0',
    `Subject: ${utf8Subject}`,
    '',
    body,
  ]
  const message = messageParts.join('\n')

  const encodedMessage = Buffer.from(message)
    .toString('base64')
    .replace(/\+/g, '-')
    .replace(/\//g, '_')
    .replace(/=+$/, '')

  await gmail.users.messages.send({
    userId: 'me',
    requestBody: { raw: encodedMessage },
  })
}

export async function POST(req: Request) {
  try {
    const payload = (await req.json()) as NotifyPayload

    if (!payload?.name || !payload?.email || !payload?.type) {
      return NextResponse.json({ error: 'Invalid payload' }, { status: 400 })
    }

    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
    const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY

    if (!supabaseUrl || !serviceRoleKey) {
      return NextResponse.json({ error: 'Supabase server env missing' }, { status: 500 })
    }

    const adminClient = createClient(supabaseUrl, serviceRoleKey)

    // 1. Find the Super Admin to send FROM
    // We get the first super_admin who has a refresh token
    const { data: sender, error: senderErr } = await adminClient
      .from('profiles')
      .select('email, gmail_refresh_token, gmail_access_token')
      .eq('role', 'super_admin')
      .not('gmail_refresh_token', 'is', null)
      .limit(1)
      .single()

    if (senderErr || !sender) {
      console.error('No super admin with Gmail access found:', senderErr)
      return NextResponse.json({ error: 'Gmail access not configured by admin' }, { status: 400 })
    }

    // 2. Prepare Email Content
    const subject = `Enquiry Received: ${payload.type} - BrightFuture Academy`
    const body = `Hello ${payload.name},

Thank you for your interest in BrightFuture Academy!

We have received your ${payload.type} enquiry for the ${payload.course_interest || 'course'}.
Our team will contact you shortly at ${payload.phone || 'your phone number'}.

Details:
- Name: ${payload.name}
- Course: ${payload.course_interest || 'Not specified'}
- Message: ${payload.message || 'No additional message'}

Best regards,
BrightFuture Academy Team`

    // 3. Send using Admin's Gmail
    await sendGmailNotification(
      sender.email!,
      payload.email,
      subject,
      body,
      sender.gmail_access_token!,
      sender.gmail_refresh_token!
    )

    return NextResponse.json({ success: true })
  } catch (e: unknown) {
    const msg = e && typeof e === 'object' && 'message' in e ? (e as { message: string }).message : 'Unknown error'
    console.error('Email send failed:', e)
    return NextResponse.json({ error: `Email send failed: ${msg}` }, { status: 500 })
  }
}
