'use client'

import React, { useState } from 'react'
import Image from 'next/image'
import { School, BarChart2, CalendarCheck2, BookOpen, UserCircle2, LogOut, Download } from 'lucide-react'
import { useAuth } from '@/hooks/useAuth'
import { useStudentTestResults } from '@/hooks/useBatchTestResults'
import { useStudentAttendance } from '@/hooks/useAttendance'
import { useEnrollments } from '@/hooks/useEnrollments'
import type { Profile } from '@/types'

interface Props { profile: Profile }

const TABS = ['Results', 'Attendance', 'Batches', 'Profile'] as const
type Tab = typeof TABS[number]

export function StudentPortalClient({ profile }: Props) {
  const { signOut } = useAuth()
  const [tab, setTab] = useState<Tab>('Results')
  const { results, loading: resultsLoading } = useStudentTestResults()
  const { attendance, loading: attendanceLoading } = useStudentAttendance(profile.id)
  const { enrollments, loading: enrollmentsLoading } = useEnrollments(profile.id)

  const avgScore = results.length
    ? Math.round(results.reduce((s, r) => s + ((r.marks_obtained ?? 0) / r.total_marks) * 100, 0) / results.length)
    : 0

  const presentDays = attendance.filter(a => a.status === 'present').length
  const attendancePct = attendance.length ? Math.round((presentDays / attendance.length) * 100) : 0

  return (
    <div className="min-h-screen bg-[#0a0a0a] text-white font-sans pb-24">
      {/* Nav */}
      <nav className="sticky top-0 z-50 bg-[#0a0a0a]/90 backdrop-blur-md border-b border-white/5 px-4 py-3 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <School className="text-[#22c55e] w-7 h-7" />
          <span className="font-bold tracking-tight">Student<span className="text-[#22c55e]">Portal</span></span>
        </div>
        <div className="flex items-center gap-3">
          {profile.avatar_url
            ? <Image src={profile.avatar_url} alt="avatar" width={36} height={36} className="rounded-full border border-white/10" unoptimized />
            : <div className="w-9 h-9 rounded-full bg-[#22c55e]/10 border border-[#22c55e]/20 flex items-center justify-center"><span className="text-[#22c55e] font-bold text-sm">{profile.full_name?.[0] ?? 'S'}</span></div>
          }
          <button onClick={signOut} className="text-slate-400 hover:text-white"><LogOut size={18} /></button>
        </div>
      </nav>

      {/* Header */}
      <header className="px-4 pt-6 pb-4">
        <h1 className="text-2xl font-bold mb-1">Welcome, {profile.full_name ?? 'Student'}</h1>
        <p className="text-slate-400 text-sm">{profile.branches?.name ?? 'BrightFuture Academy'}</p>
      </header>

      {/* Stats */}
      <div className="px-4 grid grid-cols-3 gap-3 mb-6">
        <div className="bg-[#1a1a1a] rounded-xl p-3 border border-white/5 text-center">
          <p className="text-[#22c55e] text-2xl font-black">{avgScore}%</p>
          <p className="text-slate-500 text-xs mt-1">Avg Score</p>
        </div>
        <div className="bg-[#1a1a1a] rounded-xl p-3 border border-white/5 text-center">
          <p className="text-white text-2xl font-black">{results.length}</p>
          <p className="text-slate-500 text-xs mt-1">Tests</p>
        </div>
        <div className="bg-[#1a1a1a] rounded-xl p-3 border border-white/5 text-center">
          <p className={`text-2xl font-black ${attendancePct >= 75 ? 'text-[#22c55e]' : 'text-red-400'}`}>{attendancePct}%</p>
          <p className="text-slate-500 text-xs mt-1">Attendance</p>
        </div>
      </div>

      {/* Tabs */}
      <div className="px-4 flex gap-2 mb-6 border-b border-white/5 pb-0">
        {TABS.map(t => (
          <button key={t} onClick={() => setTab(t)}
            className={`px-4 py-2 text-sm font-semibold rounded-t-lg transition-colors ${tab === t ? 'bg-[#22c55e] text-black' : 'text-slate-400 hover:text-white'}`}>
            {t}
          </button>
        ))}
      </div>

      {/* Results Tab */}
      {tab === 'Results' && (
        <main className="px-4 flex flex-col gap-4">
          {resultsLoading ? (
            <div className="space-y-3">{[1,2,3].map(i => <div key={i} className="h-24 rounded-xl bg-white/5 animate-pulse" />)}</div>
          ) : results.length === 0 ? (
            <div className="text-center py-20 text-slate-500"><BarChart2 className="mx-auto mb-4 w-12 h-12 opacity-20" /><p>No results published yet</p></div>
          ) : results.map(r => {
            const pct = Math.round(((r.marks_obtained ?? 0) / r.total_marks) * 100)
            const isGood = pct >= 75
            return (
              <article key={r.id} className={`bg-[#1a1a1a] rounded-xl p-5 border-l-4 ${isGood ? 'border-[#22c55e]' : 'border-white/10'}`}>
                <div className="flex justify-between items-start mb-3">
                  <div>
                    <h3 className="font-bold text-lg">{r.topic}</h3>
                    <p className="text-slate-400 text-sm">{r.batches?.name ?? r.batch_id}</p>
                  </div>
                  <span className={`text-3xl font-black ${isGood ? 'text-[#22c55e]' : 'text-white'}`}>{pct}%</span>
                </div>
                <div className="flex gap-6 text-sm text-slate-400">
                  <span>Marks: <strong className="text-white">{r.marks_obtained ?? '—'}/{r.total_marks}</strong></span>
                  {r.test_date && <span>{new Date(r.test_date).toLocaleDateString('en-IN', { day:'numeric', month:'short' })}</span>}
                </div>
                <div className="mt-3 h-1.5 bg-white/5 rounded-full overflow-hidden">
                  <div className={`h-full rounded-full transition-all ${isGood ? 'bg-[#22c55e]' : 'bg-slate-500'}`} style={{ width: `${pct}%` }} />
                </div>
              </article>
            )
          })}
        </main>
      )}

      {/* Attendance Tab */}
      {tab === 'Attendance' && (
        <main className="px-4">
          {attendanceLoading ? (
            <div className="space-y-3">{[1,2,3].map(i => <div key={i} className="h-12 rounded-lg bg-white/5 animate-pulse" />)}</div>
          ) : attendance.length === 0 ? (
            <div className="text-center py-20 text-slate-500"><CalendarCheck2 className="mx-auto mb-4 w-12 h-12 opacity-20" /><p>No attendance records yet</p></div>
          ) : (
            <div className="flex flex-col gap-2">
              <div className="flex justify-between text-xs text-slate-500 px-1 mb-2">
                <span>{presentDays} present</span>
                <span>{attendance.length - presentDays} absent</span>
              </div>
              {attendance.slice().sort((a,b) => new Date(b.date).getTime() - new Date(a.date).getTime()).map(a => (
                <div key={a.id} className="flex items-center justify-between bg-[#1a1a1a] rounded-lg px-4 py-3 border border-white/5">
                  <span className="text-sm text-slate-200">{new Date(a.date).toLocaleDateString('en-IN', { weekday:'short', day:'numeric', month:'short' })}</span>
                  <span className={`text-xs font-bold px-2 py-1 rounded-full ${a.status === 'present' ? 'bg-[#22c55e]/10 text-[#22c55e]' : 'bg-red-500/10 text-red-400'}`}>
                    {a.status === 'present' ? 'Present' : 'Absent'}
                  </span>
                </div>
              ))}
            </div>
          )}
        </main>
      )}

      {/* Batches Tab */}
      {tab === 'Batches' && (
        <main className="px-4">
          {enrollmentsLoading ? (
            <div className="space-y-3">{[1,2].map(i => <div key={i} className="h-20 rounded-xl bg-white/5 animate-pulse" />)}</div>
          ) : enrollments.length === 0 ? (
            <div className="text-center py-20 text-slate-500"><BookOpen className="mx-auto mb-4 w-12 h-12 opacity-20" /><p>Not enrolled in any batches yet</p></div>
          ) : enrollments.map(e => (
            <div key={e.id} className="bg-[#1a1a1a] rounded-xl p-5 border border-white/5 mb-3">
              <h3 className="font-bold text-lg mb-1">{e.batches?.name ?? 'Batch'}</h3>
              {e.batches?.courses && <p className="text-[#22c55e] text-sm font-medium">{e.batches.courses.name}</p>}
              <div className="flex gap-4 mt-3 text-xs text-slate-500">
                {e.batches?.start_date && <span>From: {new Date(e.batches.start_date).toLocaleDateString('en-IN', { day:'numeric', month:'short', year:'2-digit' })}</span>}
                {e.enrolled_at && <span>Enrolled: {new Date(e.enrolled_at).toLocaleDateString('en-IN', { day:'numeric', month:'short' })}</span>}
              </div>
              <span className={`inline-block mt-2 text-xs font-bold px-2 py-1 rounded-full ${e.status === 'active' ? 'bg-[#22c55e]/10 text-[#22c55e]' : 'bg-slate-500/10 text-slate-400'}`}>
                {e.status}
              </span>
            </div>
          ))}
        </main>
      )}

      {/* Profile Tab */}
      {tab === 'Profile' && (
        <main className="px-4">
          <div className="bg-[#1a1a1a] rounded-2xl p-6 border border-white/5">
            <div className="flex items-center gap-4 mb-6">
              {profile.avatar_url
                ? <Image src={profile.avatar_url} alt="avatar" width={72} height={72} className="rounded-full border-2 border-[#22c55e]" unoptimized />
                : <div className="w-18 h-18 rounded-full bg-[#22c55e]/10 border-2 border-[#22c55e] flex items-center justify-center w-[72px] h-[72px]"><UserCircle2 className="text-[#22c55e] w-10 h-10" /></div>
              }
              <div>
                <h2 className="text-xl font-bold">{profile.full_name ?? 'Student'}</h2>
                <p className="text-slate-400 text-sm">{profile.email}</p>
                <span className="inline-block mt-1 text-xs font-bold px-2 py-0.5 bg-[#22c55e]/10 text-[#22c55e] rounded-full">Student</span>
              </div>
            </div>
            <div className="space-y-3 text-sm">
              {profile.branches && (
                <div className="flex justify-between py-3 border-b border-white/5">
                  <span className="text-slate-500">Branch</span>
                  <span className="text-white font-medium">{profile.branches.name}</span>
                </div>
              )}
              <div className="flex justify-between py-3 border-b border-white/5">
                <span className="text-slate-500">Enrolled Tests</span>
                <span className="text-white font-medium">{results.length}</span>
              </div>
              <div className="flex justify-between py-3 border-b border-white/5">
                <span className="text-slate-500">Attendance</span>
                <span className={`font-medium ${attendancePct >= 75 ? 'text-[#22c55e]' : 'text-red-400'}`}>{attendancePct}%</span>
              </div>
              <div className="flex justify-between py-3">
                <span className="text-slate-500">Active Batches</span>
                <span className="text-white font-medium">{enrollments.filter(e => e.status === 'active').length}</span>
              </div>
            </div>
          </div>
        </main>
      )}

      {/* Bottom bar */}
      {tab === 'Results' && results.length > 0 && (
        <footer className="fixed bottom-0 left-0 w-full p-4 bg-gradient-to-t from-[#0a0a0a] via-[#0a0a0a] to-transparent">
          <button className="w-full bg-[#22c55e] hover:bg-[#16a34a] text-black font-bold py-4 rounded-2xl shadow-lg flex items-center justify-center gap-2 transition-transform active:scale-95">
            <Download size={18} /> Download All Reports
          </button>
        </footer>
      )}
    </div>
  )
}
