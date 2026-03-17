import { createClient } from '@/lib/supabase/server'
import { createServerClient } from '@supabase/ssr'
import { redirect } from 'next/navigation'
import { StudentPortalClient } from '@/components/StudentPortal'

export default async function PortalPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) redirect('/')

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
    .select('*, branches(*)')
    .eq('id', user.id)
    .single()

  if (!profile) redirect('/')
  if (profile.role !== 'student') redirect('/')

  return <StudentPortalClient profile={profile} />
}
