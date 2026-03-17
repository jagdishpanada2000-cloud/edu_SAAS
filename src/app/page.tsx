import { createServerClient } from '@supabase/ssr'
import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { LandingPageClient } from '@/components/LandingPage'

export default async function HomePage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (user) {
    // Use service client to reliably read profile (bypasses RLS)
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

    const { data: profile } = await serviceClient
      .from('profiles')
      .select('role')
      .eq('id', user.id)
      .single()

    if (profile) {
      if (profile.role === 'super_admin') redirect('/admin')
      if (profile.role === 'branch_admin') redirect('/branch')
      if (profile.role === 'student') redirect('/portal')
    }
  }

  return <LandingPageClient />
}
