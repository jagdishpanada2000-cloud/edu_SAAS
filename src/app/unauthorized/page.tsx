'use client'

import { createClient } from '@/lib/supabase/client'

export default function UnauthorizedPage() {
  const handleSignOut = async () => {
    const supabase = createClient()
    await supabase.auth.signOut()
    window.location.href = '/'
  }

  return (
    <div className="min-h-screen bg-[#0a0a0a] flex items-center justify-center text-white">
      <div className="text-center">
        <h1 className="text-4xl font-black mb-4 text-red-400">Access Denied</h1>
        <p className="text-slate-400 mb-8">You don&apos;t have permission to view this page.</p>
        <div className="flex items-center justify-center gap-4">
          <a href="/" className="bg-[#13ec80] text-black font-bold px-6 py-3 rounded-lg hover:opacity-90">
            Go Home
          </a>
          <button
            onClick={handleSignOut}
            className="border border-white/20 text-white font-bold px-6 py-3 rounded-lg hover:bg-white/10 transition-colors"
          >
            Sign Out
          </button>
        </div>
      </div>
    </div>
  )
}
