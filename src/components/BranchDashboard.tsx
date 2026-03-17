'use client'

import React, { useState } from 'react'
import Image from 'next/image'
import {
  GraduationCap, Users, BookOpen, ClipboardCheck,
  LayoutGrid, Settings, LogOut, Plus, Trash2,
} from 'lucide-react'
import { Modal } from './Modal'
import { useAuth } from '@/hooks/useAuth'
import { useStudents } from '@/hooks/useStudents'
import { useBatches } from '@/hooks/useBatches'
import { useBatchTestResults } from '@/hooks/useBatchTestResults'
import { BranchStudentsTab } from '@/components/branch/BranchStudentsTab'
import { BranchBatchesTab } from '@/components/branch/BranchBatchesTab'
import { BranchResultsTab } from '@/components/branch/BranchResultsTab'
import type { Profile, Teacher } from '@/types'

interface Props { profile: Profile }

export function BranchDashboardClient({ profile }: Props) {
  const { signOut } = useAuth()
  const branchId = profile.branch_id ?? ''
  const { students } = useStudents(branchId)
  const { batches } = useBatches(branchId)
  const { results } = useBatchTestResults(branchId)

  const [teachers, setTeachers] = useState<Teacher[]>([])
  const [activeTab, setActiveTab] = useState('Dashboard')
  const [isAddTeacherOpen, setIsAddTeacherOpen] = useState(false)
  const [teacherSubmitted, setTeacherSubmitted] = useState(false)

  const handleAddTeacher = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    const fd = new FormData(e.currentTarget)
    const newTeacher: Teacher = {
      id: `T${Math.floor(Math.random() * 10000)}`,
      branch_id: branchId,
      name: fd.get('name') as string,
      subject: fd.get('subject') as string,
      phone: '',
      image_url: 'https://picsum.photos/seed/teacher/100/100',
    }
    setTeachers(prev => [newTeacher, ...prev])
    setTeacherSubmitted(true)
    setTimeout(() => { setTeacherSubmitted(false); setIsAddTeacherOpen(false) }, 1500)
  }

  const handleLogout = () => { if (confirm('Are you sure you want to log out?')) signOut() }

  const NAV = [
    { label: 'Dashboard', icon: LayoutGrid },
    { label: 'Students', icon: Users },
    { label: 'Batches', icon: BookOpen },
    { label: 'Teachers', icon: GraduationCap },
    { label: 'Results', icon: ClipboardCheck },
  ]

  return (
    <div className="bg-[#0f0f0f] text-slate-100 font-sans min-h-screen pb-24 lg:pb-0 lg:pl-64">
      {/* Sidebar */}
      <aside className="hidden lg:flex fixed inset-y-0 left-0 w-64 flex-col bg-[#1b1b1b] border-r border-[#2d2d2d] z-50">
        <div className="p-6 flex items-center gap-3">
          <div className="bg-[#22c55e] w-8 h-8 rounded-lg flex items-center justify-center">
            <GraduationCap className="text-black w-5 h-5" />
          </div>
          <span className="text-xl font-bold tracking-tight">EduPulse</span>
        </div>
        <nav className="flex-1 px-4 space-y-1">
          {NAV.map((item, i) => (
            <button key={i} onClick={() => setActiveTab(item.label)}
              className={`w-full flex items-center gap-3 px-3 py-2 rounded-lg transition-colors ${activeTab === item.label ? 'text-[#22c55e] bg-[#22c55e]/10' : 'text-slate-400 hover:text-slate-100 hover:bg-white/5'}`}>
              <item.icon size={20} />
              <span className="font-medium">{item.label}</span>
            </button>
          ))}
        </nav>
        <div className="p-4 border-t border-[#2d2d2d] space-y-1">
          <button onClick={() => setActiveTab('Settings')}
            className={`w-full flex items-center gap-3 px-3 py-2 rounded-lg transition-colors ${activeTab === 'Settings' ? 'text-[#22c55e] bg-[#22c55e]/10' : 'text-slate-400 hover:text-slate-100 hover:bg-white/5'}`}>
            <Settings className="w-5 h-5" />
            <span className="font-medium">Settings</span>
          </button>
          <button onClick={handleLogout}
            className="w-full flex items-center gap-3 px-3 py-2 text-slate-400 hover:text-red-500 hover:bg-red-500/5 rounded-lg transition-colors">
            <LogOut className="w-5 h-5" />
            <span className="font-medium">Log Out</span>
          </button>
        </div>
      </aside>

      {/* Top bar */}
      <header className="sticky top-0 z-40 w-full bg-[#0f0f0f]/80 backdrop-blur-md border-b border-[#2d2d2d]">
        <div className="flex items-center justify-between px-4 lg:px-8 h-16">
          <div className="flex items-center gap-4">
            <div className="lg:hidden bg-[#22c55e]/20 p-2 rounded-lg">
              <GraduationCap className="text-[#22c55e] w-5 h-5" />
            </div>
            <h1 className="text-lg font-bold">{profile.branches?.name ?? 'Branch Dashboard'}</h1>
          </div>
          <div className="flex items-center gap-3">
            <div className="size-9 rounded-full bg-[#22c55e]/20 flex items-center justify-center overflow-hidden border border-[#22c55e]/30">
              {profile.avatar_url
                ? <Image src={profile.avatar_url} alt="avatar" width={36} height={36} className="w-full h-full object-cover" unoptimized />
                : <span className="text-[#22c55e] font-bold text-sm">{profile.full_name?.[0] ?? 'B'}</span>}
            </div>
          </div>
        </div>
      </header>

      <main className="p-4 lg:p-8 max-w-7xl mx-auto space-y-8">
        {/* Dashboard overview */}
        {activeTab === 'Dashboard' && (
          <>
            <section className="grid grid-cols-2 lg:grid-cols-4 gap-4">
              {[
                { label: 'Total Students', val: students.length.toString(), icon: Users },
                { label: 'Active Batches', val: batches.length.toString(), icon: BookOpen },
                { label: 'Tests Recorded', val: new Set(results.map(r => `${r.batch_id}||${r.test_date}||${r.topic}`)).size.toString(), icon: ClipboardCheck },
                { label: 'Teachers', val: teachers.length.toString(), icon: GraduationCap },
              ].map((stat, i) => (
                <div key={i} className="bg-[#1b1b1b] p-5 rounded-xl border border-[#2d2d2d] flex flex-col gap-3">
                  <stat.icon className="text-[#22c55e] bg-[#22c55e]/10 p-2 rounded-lg w-10 h-10" />
                  <div>
                    <p className="text-slate-400 text-sm font-medium">{stat.label}</p>
                    <p className="text-2xl font-bold mt-1">{stat.val}</p>
                  </div>
                </div>
              ))}
            </section>
            <BranchStudentsTab branchId={branchId} />
          </>
        )}

        {activeTab === 'Students' && <BranchStudentsTab branchId={branchId} />}
        {activeTab === 'Batches' && <BranchBatchesTab branchId={branchId} />}
        {activeTab === 'Results' && <BranchResultsTab branchId={branchId} />}

        {/* Teachers */}
        {activeTab === 'Teachers' && (
          <section className="bg-[#1b1b1b] rounded-xl border border-[#2d2d2d] overflow-hidden">
            <div className="p-6 border-b border-[#2d2d2d] flex justify-between items-center">
              <div>
                <h2 className="text-xl font-bold">Teachers</h2>
                <p className="text-sm text-slate-400">Faculty assigned to this branch</p>
              </div>
              <button onClick={() => { setTeacherSubmitted(false); setIsAddTeacherOpen(true) }}
                className="px-4 py-2 bg-white/5 hover:bg-white/10 text-xs font-bold rounded-lg border border-[#2d2d2d] text-[#22c55e] transition-colors flex items-center gap-2">
                <Plus size={16} /> Add Teacher
              </button>
            </div>
            {teachers.length === 0 ? (
              <div className="p-12 text-center text-slate-500">
                <GraduationCap className="mx-auto mb-4 w-12 h-12 opacity-20" />
                <p className="font-medium">No teachers added yet</p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse">
                  <thead className="bg-white/5">
                    <tr className="text-slate-400 text-xs font-semibold uppercase tracking-wider">
                      <th className="px-6 py-4">Name</th>
                      <th className="px-6 py-4">Subject</th>
                      <th className="px-6 py-4 text-right">Action</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[#2d2d2d]">
                    {teachers.map(t => (
                      <tr key={t.id} className="hover:bg-white/5 transition-colors">
                        <td className="px-6 py-4">
                          <div className="flex items-center gap-3">
                            <Image src={t.image_url ?? '/placeholder.png'} alt={t.name} width={32} height={32} className="size-8 rounded-full object-cover" unoptimized />
                            <span className="font-medium">{t.name}</span>
                          </div>
                        </td>
                        <td className="px-6 py-4">
                          <span className="px-2 py-1 text-xs font-bold rounded bg-green-500/10 text-green-500">{t.subject}</span>
                        </td>
                        <td className="px-6 py-4 text-right">
                          <button onClick={() => { if (confirm('Remove this teacher?')) setTeachers(prev => prev.filter(x => x.id !== t.id)) }}
                            className="text-slate-400 hover:text-red-500 transition-colors">
                            <Trash2 size={18} />
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </section>
        )}

        {/* Settings */}
        {activeTab === 'Settings' && (
          <section className="max-w-2xl space-y-6">
            <div className="bg-[#1b1b1b] border border-[#2d2d2d] rounded-xl p-6">
              <h2 className="text-xl font-bold mb-6">Branch Settings</h2>
              <div className="space-y-6">
                <div>
                  <label className="block text-xs font-bold text-slate-500 uppercase mb-2">Branch Name</label>
                  <input type="text" defaultValue={profile.branches?.name ?? ''} className="w-full bg-black border border-[#2d2d2d] rounded-lg px-4 py-2 focus:border-[#22c55e] outline-none" />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-500 uppercase mb-2">Your Email</label>
                  <input type="email" defaultValue={profile.email ?? ''} className="w-full bg-black border border-[#2d2d2d] rounded-lg px-4 py-2 focus:border-[#22c55e] outline-none" readOnly />
                </div>
                <button className="w-full bg-[#22c55e] text-black font-bold py-3 rounded-lg hover:bg-[#16a34a] transition-colors">
                  Save Settings
                </button>
              </div>
            </div>
          </section>
        )}
      </main>

      {/* Mobile Bottom Nav */}
      <div className="lg:hidden fixed bottom-0 left-0 right-0 z-50 bg-[#1b1b1b] border-t border-[#2d2d2d] px-4 pb-4 pt-2">
        <div className="flex items-center justify-between gap-1 max-w-md mx-auto">
          {NAV.map((item, i) => (
            <div key={i} onClick={() => setActiveTab(item.label)}
              className={`flex flex-col items-center gap-1 flex-1 cursor-pointer ${activeTab === item.label ? 'text-[#22c55e]' : 'text-slate-400'}`}>
              <item.icon size={24} />
              <span className="text-[10px] font-bold uppercase tracking-tight">{item.label}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Add Teacher Modal */}
      <Modal isOpen={isAddTeacherOpen} onClose={() => setIsAddTeacherOpen(false)} title="Add Faculty Member">
        {teacherSubmitted ? (
          <div className="flex flex-col items-center justify-center py-8 text-center">
            <div className="text-[#22c55e] w-16 h-16 mb-4 text-5xl">✓</div>
            <h4 className="text-xl font-bold mb-2">Teacher Added!</h4>
            <p className="text-slate-400">New faculty member has been added.</p>
          </div>
        ) : (
          <form onSubmit={handleAddTeacher} className="space-y-4">
            <div>
              <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Teacher Name</label>
              <input name="name" required type="text" className="w-full bg-black border border-white/10 rounded-lg px-4 py-2 focus:outline-none focus:ring-1 focus:ring-[#22c55e] text-white" placeholder="Enter name" />
            </div>
            <div>
              <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Subject Expertise</label>
              <input name="subject" required type="text" className="w-full bg-black border border-white/10 rounded-lg px-4 py-2 focus:outline-none focus:ring-1 focus:ring-[#22c55e] text-white" placeholder="e.g. Mathematics" />
            </div>
            <button type="submit" className="w-full bg-[#22c55e] text-black font-bold py-3 rounded-lg hover:opacity-90 transition-opacity mt-4">Add Teacher</button>
          </form>
        )}
      </Modal>
    </div>
  )
}