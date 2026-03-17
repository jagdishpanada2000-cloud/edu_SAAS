'use client'

import { School } from 'lucide-react'

export default function SplashScreen() {
  return (
    <div className="min-h-screen bg-[#0a0a0a] flex flex-col items-center justify-center gap-6">
      <div className="flex items-center gap-3">
        <School className="text-[#13ec80] w-10 h-10" />
        <span className="text-2xl font-bold tracking-tight">
          BrightFuture<span className="text-[#13ec80]">Academy</span>
        </span>
      </div>
      <div className="flex items-center gap-2 text-slate-400 text-sm">
        <span className="relative flex h-2 w-2">
          <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-[#13ec80] opacity-75" />
          <span className="relative inline-flex rounded-full h-2 w-2 bg-[#13ec80]" />
        </span>
        Loading…
      </div>
    </div>
  )
}
