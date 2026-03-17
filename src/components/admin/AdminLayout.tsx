'use client'

import React from 'react'
import Image from 'next/image'
import {
  Cloud, Bell, LayoutDashboard, GitGraph, ShieldCheck,
  Users, GraduationCap, BookOpen, MessageSquare,
  Settings as SettingsIcon, LogOut,
} from 'lucide-react'
import type { Profile } from '@/types'

const SIDEBAR_ITEMS = [
  { label: 'Dashboard',  icon: LayoutDashboard },
  { label: 'Branches',   icon: GitGraph },
  { label: 'Admins',     icon: ShieldCheck },
  { label: 'Students',   icon: Users },
  { label: 'Courses',    icon: GraduationCap },
  { label: 'Batches',    icon: BookOpen },
  { label: 'Enquiries',  icon: MessageSquare },
]

interface Props {
  profile: Profile
  activeTab: string
  setActiveTab: (tab: string) => void
  onLogout: () => void
  children: React.ReactNode
}

export function AdminLayout({ profile, activeTab, setActiveTab, onLogout, children }: Props) {
  return (
    <div className="bg-[#0f0f0f] text-slate-100 font-sans min-h-screen pb-20 md:pb-0 md:pl-20">

      {/* ── Top Navbar ── */}
      <nav className="sticky top-0 z-50 border-b border-[#2a2a2a] bg-[#0f0f0f]/80 backdrop-blur-md px-4 py-3">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="bg-[#13ec80]/20 p-2 rounded-lg">
              <Cloud className="text-[#13ec80] w-6 h-6" />
            </div>
            <h1 className="text-xl font-bold tracking-tight">
              EduCloud <span className="text-[#13ec80] font-medium">Global</span>
            </h1>
          </div>
          <div className="flex items-center gap-4">
            <button className="relative p-2 text-slate-500 hover:text-[#13ec80] transition-colors">
              <Bell size={20} />
              <span className="absolute top-2 right-2 flex h-2 w-2">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-[#13ec80] opacity-75" />
                <span className="relative inline-flex rounded-full h-2 w-2 bg-[#13ec80]" />
              </span>
            </button>
            <div className="flex items-center gap-2 border-l border-[#2a2a2a] pl-4">
              <div className="text-right hidden sm:block">
                <p className="text-xs font-semibold">{profile.full_name ?? 'Super Admin'}</p>
                <p className="text-[10px] text-slate-500">Global Region</p>
              </div>
              {profile.avatar_url
                ? <Image src={profile.avatar_url} alt="avatar" width={32} height={32} className="h-8 w-8 rounded-full border border-[#13ec80]/50" unoptimized />
                : <div className="h-8 w-8 rounded-full bg-[#13ec80]/10 border border-[#13ec80]/50 flex items-center justify-center">
                    <span className="text-[#13ec80] font-bold text-sm">{(profile.full_name ?? 'A')[0]}</span>
                  </div>
              }
            </div>
          </div>
        </div>
      </nav>

      {/* ── Main Content ── */}
      <main className="max-w-7xl mx-auto p-4 md:p-6 space-y-8">
        {children}
      </main>

      {/* ── Desktop Sidebar ── */}
      <aside className="fixed left-0 top-0 h-full w-20 bg-[#0f0f0f] border-r border-[#2a2a2a] hidden md:flex flex-col items-center py-8 gap-5">
        {SIDEBAR_ITEMS.map(item => (
          <button
            key={item.label}
            title={item.label}
            onClick={() => setActiveTab(item.label)}
            className={`p-3 rounded-xl cursor-pointer transition-all ${activeTab === item.label ? 'text-[#13ec80] bg-[#13ec80]/10' : 'text-slate-500 hover:text-[#13ec80]'}`}
          >
            <item.icon size={22} />
          </button>
        ))}
        <div className="mt-auto flex flex-col items-center gap-5">
          <button
            title="Setup"
            onClick={() => setActiveTab('Setup')}
            className={`p-3 rounded-xl cursor-pointer transition-all ${activeTab === 'Setup' ? 'text-[#13ec80] bg-[#13ec80]/10' : 'text-slate-500 hover:text-[#13ec80]'}`}
          >
            <SettingsIcon size={22} />
          </button>
          <button onClick={onLogout} className="text-slate-500 hover:text-red-500 transition-colors p-3">
            <LogOut size={22} />
          </button>
        </div>
      </aside>

      {/* ── Mobile Bottom Nav ── */}
      <div className="fixed bottom-0 left-0 right-0 z-40 bg-[#1b1b1b] border-t border-[#2a2a2a] block md:hidden">
        <div className="flex justify-around items-center p-1.5 overflow-x-auto">
          {[...SIDEBAR_ITEMS, { label: 'Setup', icon: SettingsIcon }].map(item => (
            <button
              key={item.label}
              onClick={() => setActiveTab(item.label)}
              className={`flex flex-col items-center gap-0.5 px-1.5 py-1 rounded-lg ${activeTab === item.label ? 'text-[#13ec80]' : 'text-slate-400'}`}
            >
              <item.icon size={17} />
              <span className="text-[8px] font-medium leading-none">{item.label}</span>
            </button>
          ))}
        </div>
      </div>

    </div>
  )
}
