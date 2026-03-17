import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'
import { NextResponse } from 'next/server'

export async function GET(request: Request) {
  const { searchParams, origin } = new URL(request.url)
  const code = searchParams.get('code')

  if (!code) {
    return NextResponse.redirect(`${origin}/`)
  }

  const cookieStore = await cookies()

  // 1. Normal client (anon key, respects RLS) for auth exchange
  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() { return cookieStore.getAll() },
        setAll(cookiesToSet: { name: string; value: string; options?: Record<string, unknown> }[]) {
          try { cookiesToSet.forEach(({ name, value, options }) => cookieStore.set(name, value, options)) } catch { /* Server Component */ }
        },
      },
    }
  )

  const { data: { session }, error } = await supabase.auth.exchangeCodeForSession(code)
  if (error) {
    console.error('[auth/callback] exchangeCodeForSession error:', error.message)
    return NextResponse.redirect(`${origin}/`)
  }

  const { data: { user } } = await supabase.auth.getUser()
  if (!user || !session) {
    return NextResponse.redirect(`${origin}/`)
  }

  // 1.5 Extract Provider Tokens if available (for Gmail)
  const providerToken = session.provider_token
  const refreshToken = session.provider_refresh_token
  const expiresAt = session.expires_at ? new Date(session.expires_at * 1000).toISOString() : null

  // 2. Service-role client (bypasses RLS) for profile lookup/creation
  const serviceClient = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    {
      cookies: {
        getAll() { return [] },
        setAll() {},
      },
    }
  )

  // Check if profile exists
  const { data: profile } = await serviceClient
    .from('profiles')
    .select('role')
    .eq('id', user.id)
    .single()

  if (profile) {
    // Update tokens for existing user if login/re-auth
    if (providerToken || refreshToken) {
      await serviceClient
        .from('profiles')
        .update({
          gmail_access_token: providerToken ?? undefined,
          gmail_refresh_token: refreshToken ?? undefined,
          gmail_token_expires_at: expiresAt ?? undefined
        })
        .eq('id', user.id)
    }

    if (profile.role === 'super_admin') return NextResponse.redirect(`${origin}/admin`)
    if (profile.role === 'branch_admin') return NextResponse.redirect(`${origin}/branch`)
    return NextResponse.redirect(`${origin}/portal`)
  }

  // No profile yet — check if email is allowed
  const { data: allowed } = await serviceClient
    .from('allowed_emails')
    .select('role, branch_id')
    .eq('email', user.email!)
    .single()

  if (!allowed) {
    // Email not in allowlist → sign out
    await supabase.auth.signOut()
    return NextResponse.redirect(`${origin}/unauthorized`)
  }

  // Create profile with the role from allowed_emails
  await serviceClient
    .from('profiles')
    .upsert({
      id: user.id,
      full_name: user.user_metadata?.full_name ?? null,
      email: user.email,
      avatar_url: user.user_metadata?.avatar_url ?? null,
      role: allowed.role,
      branch_id: allowed.branch_id,
      gmail_access_token: providerToken ?? null,
      gmail_refresh_token: refreshToken ?? null,
      gmail_token_expires_at: expiresAt ?? null
    })

  if (allowed.role === 'super_admin') return NextResponse.redirect(`${origin}/admin`)
  if (allowed.role === 'branch_admin') return NextResponse.redirect(`${origin}/branch`)
  return NextResponse.redirect(`${origin}/portal`)
}
