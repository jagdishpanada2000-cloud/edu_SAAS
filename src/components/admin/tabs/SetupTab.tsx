'use client'

import type { Profile } from '@/types'

interface Props {
  profile: Profile
}

export function SetupTab({ profile }: Props) {
  return (
    <section className="max-w-2xl space-y-6">
      <div className="bg-[#1b1b1b] border border-[#2a2a2a] rounded-xl p-6">
        <h2 className="text-xl font-bold mb-1">Global Settings</h2>
        <p className="text-xs text-slate-500 mb-6">Signed in as <span className="text-white">{profile.email}</span></p>
        <div className="space-y-6">
          <div className="flex items-center justify-between p-4 bg-[#0f0f0f] rounded-lg border border-[#2a2a2a]">
            <div>
              <p className="font-bold">Maintenance Mode</p>
              <p className="text-xs text-slate-500">Disable branch access for updates</p>
            </div>
            <div className="w-12 h-6 bg-[#2a2a2a] rounded-full relative cursor-pointer">
              <div className="absolute left-1 top-1 w-4 h-4 bg-slate-500 rounded-full transition-all" />
            </div>
          </div>
          <div className="flex items-center justify-between p-4 bg-[#0f0f0f] rounded-lg border border-[#2a2a2a]">
            <div>
              <p className="font-bold">Auto-Backup</p>
              <p className="text-xs text-slate-500">Daily database snapshots</p>
            </div>
            <div className="w-12 h-6 bg-[#13ec80]/20 rounded-full relative cursor-pointer border border-[#13ec80]/30">
              <div className="absolute right-1 top-1 w-4 h-4 bg-[#13ec80] rounded-full transition-all" />
            </div>
          </div>
          <div className="pt-4">
            <button className="w-full bg-[#13ec80] text-black font-bold py-3 rounded-lg hover:opacity-90 transition-opacity">
              Save Changes
            </button>
          </div>
        </div>
      </div>
    </section>
  )
}
