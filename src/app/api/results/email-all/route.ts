import { NextResponse } from 'next/server'
import { google } from 'googleapis'
import { createClient } from '@/lib/supabase/server'

const GMAIL_CLIENT_ID = process.env.GMAIL_CLIENT_ID
const GMAIL_CLIENT_SECRET = process.env.GMAIL_CLIENT_SECRET
const GMAIL_REDIRECT_URI = process.env.GMAIL_REDIRECT_URI

export async function POST(req: Request) {
  try {
    const { branchId, testResults } = await req.json()
    if (!branchId || !testResults || !Array.isArray(testResults)) {
      return NextResponse.json({ error: 'Missing branchId or testResults' }, { status: 400 })
    }

    const supabase = await createClient()

    // 1. Get branch admin tokens from profiles (via branch_id)
    const { data: adminProfile, error: profileError } = await supabase
      .from('profiles')
      .select('gmail_access_token, gmail_refresh_token')
      .eq('branch_id', branchId)
      .eq('role', 'branch_admin')
      .not('gmail_refresh_token', 'is', null)
      .limit(1)
      .single()

    if (profileError || !adminProfile || !adminProfile.gmail_refresh_token) {
      return NextResponse.json({ error: 'Gmail not connected for this branch admin. Please re-login with Google to sync tokens.' }, { status: 404 })
    }

    // 2. Setup OAuth2
    const oAuth2Client = new google.auth.OAuth2(
      GMAIL_CLIENT_ID,
      GMAIL_CLIENT_SECRET,
      GMAIL_REDIRECT_URI
    )

    oAuth2Client.setCredentials({
      access_token: adminProfile.gmail_access_token,
      refresh_token: adminProfile.gmail_refresh_token
    })

    const gmail = google.gmail({ version: 'v1', auth: oAuth2Client })

    // 3. Find Toppers (Max Marks)
    const validResults = testResults.filter(r => r.marks_obtained !== null)
    if (validResults.length === 0) {
        return NextResponse.json({ error: 'No marks available to send' }, { status: 400 })
    }
    const maxMarks = Math.max(...validResults.map(r => r.marks_obtained))
    const toppers = validResults.filter(r => r.marks_obtained === maxMarks).map(r => r.student_email)

    // 4. Send Emails
    // 4. Send Emails
    const results = await Promise.allSettled(testResults.map(async (res) => {
      try {
        const isTopper = toppers.includes(res.student_email)
        const subject = `Test Results: ${res.topic}`
        
        let body = `Hello ${res.student_name || 'Student'},\n\n`
        body += `Your results for the test on ${res.topic} (${res.test_date}) are out.\n`
        body += `Marks Obtained: ${res.marks_obtained} / ${res.total_marks}\n\n`
        
        if (isTopper) {
          body += `Congratulations! You are one of the toppers in this test. Outstanding performance! Keep it up.\n\n`
        } else {
          body += `Good effort! Review your mistakes and keep practicing to improve in the next test.\n\n`
        }
        
        body += `Best regards,\nYour Coaching Team`

        // Construct raw email with correct headers
        const utf8Subject = `=?utf-8?B?${Buffer.from(subject).toString('base64')}?=`
        const messageParts = [
          `To: ${res.student_email}`,
          'Content-Type: text/plain; charset=utf-8',
          'MIME-Version: 1.0',
          `Subject: ${utf8Subject}`,
          '',
          body,
        ]
        const message = messageParts.join('\r\n')
        const encodedMessage = Buffer.from(message)
          .toString('base64')
          .replace(/\+/g, '-')
          .replace(/\//g, '_')
          .replace(/=+$/, '')

        return gmail.users.messages.send({
          userId: 'me',
          requestBody: { raw: encodedMessage },
        })
      } catch (err) {
        console.error(`Error sending email to ${res.student_email}:`, err)
        throw err
      }
    }))

    const successCount = results.filter(r => r.status === 'fulfilled').length
    const failCount = results.filter(r => r.status === 'rejected').length
    
    // Log failures for debugging
    if (failCount > 0) {
      results.forEach((r, i) => {
        if (r.status === 'rejected') {
          console.error(`Failed to send to ${testResults[i].student_email}:`, r.reason)
        }
      })
    }

    return NextResponse.json({ successCount, failCount })
  } catch (error: any) {
    console.error('Email results error:', error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}
