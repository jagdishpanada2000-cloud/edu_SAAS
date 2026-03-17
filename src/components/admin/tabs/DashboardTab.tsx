'use client'

import { useMemo } from 'react'
import { ArrowUp, GitGraph, Users, GraduationCap, BarChart3, Mail as MailIcon, Globe } from 'lucide-react'
import { BarChart, Bar, XAxis, Tooltip, ResponsiveContainer } from 'recharts'
import { useBranches } from '@/hooks/useBranches'
import { useEnquiries } from '@/hooks/useEnquiries'
import { useBranchStats } from '@/hooks/useBranchStats'

const chartData = [
  { name: 'Jan', value: 60 },
  { name: 'Feb', value: 45 },
  { name: 'Mar', value: 80 },
  { name: 'Apr', value: 30 },
  { name: 'May', value: 65 },
  { name: 'Jun', value: 50 },
  { name: 'Jul', value: 90 },
]

interface Props {
  setActiveTab: (tab: string) => void
}

export function DashboardTab({ setActiveTab }: Props) {
  const { branches } = useBranches()
  const { enquiries } = useEnquiries()
  const { stats } = useBranchStats()

  const totalStudents = useMemo(() => Object.values(stats).reduce((s, b) => s + b.students, 0), [stats])

  const cityDistribution = useMemo(() => {
    const map: Record<string, number> = {}
    for (const b of branches) {
      const city = (b.city ?? 'Unknown').trim()
      map[city] = (map[city] ?? 0) + 1
    }
    const total = branches.length || 1
    return Object.entries(map)
      .map(([city, count]) => ({ label: city, val: Math.round((count / total) * 100) }))
      .sort((a, b) => b.val - a.val)
      .slice(0, 5)
  }, [branches])

  return (
    <>
      {/* Stats Grid */}
      <section className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {[
          { label: 'Total Branches', val: branches.length.toString(), trend: '+', icon: GitGraph },
          { label: 'Total Students', val: totalStudents ? totalStudents.toString() : '—', trend: '', icon: Users },
          { label: 'Total Courses', val: '—', trend: '', icon: GraduationCap },
          { label: 'Enquiries', val: enquiries.length.toString(), trend: 'New', icon: BarChart3 },
        ].map((stat, i) => (
          <div key={i} className="bg-[#1b1b1b] border border-[#2a2a2a] p-5 rounded-xl flex items-center gap-4 shadow-sm">
            <div className="bg-[#13ec80]/10 p-3 rounded-lg">
              <stat.icon className="text-[#13ec80] w-6 h-6" />
            </div>
            <div>
              <p className="text-sm text-slate-400">{stat.label}</p>
              <div className="flex items-baseline gap-2">
                <h3 className="text-2xl font-bold">{stat.val}</h3>
                {stat.trend && (
                  <span className="text-xs font-medium text-[#13ec80] flex items-center gap-0.5">
                    <ArrowUp size={12} /> {stat.trend}
                  </span>
                )}
              </div>
            </div>
          </div>
        ))}
      </section>

      {/* Main Grid */}
      <section className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-6">
          {/* Recent Branches */}
          <div className="bg-[#1b1b1b] border border-[#2a2a2a] rounded-xl shadow-sm overflow-hidden">
            <div className="px-6 py-4 border-b border-[#2a2a2a] flex items-center justify-between">
              <h2 className="text-lg font-bold">Recent Branches</h2>
              <button
                onClick={() => setActiveTab('Branches')}
                className="text-xs text-[#13ec80] font-medium hover:underline"
              >
                View All
              </button>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-[#0f0f0f]/50 text-xs text-slate-500 uppercase tracking-wider">
                    <th className="px-6 py-3 font-semibold">Branch Name</th>
                    <th className="px-6 py-3 font-semibold">City</th>
                    <th className="px-6 py-3 font-semibold text-right">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#2a2a2a]">
                  {branches.slice(0, 3).map(branch => (
                    <tr key={branch.id} className="hover:bg-white/5 transition-colors">
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-3">
                          <div className="w-8 h-8 rounded-lg flex items-center justify-center font-bold bg-[#13ec80]/10 text-[#13ec80]">
                            {branch.name[0]}
                          </div>
                          <p className="font-medium">{branch.name}</p>
                        </div>
                      </td>
                      <td className="px-6 py-4 text-sm">{branch.city ?? '—'}</td>
                      <td className="px-6 py-4 text-right">
                        <span className="text-xs font-bold text-[#13ec80] bg-[#13ec80]/10 px-2 py-1 rounded">Active</span>
                      </td>
                    </tr>
                  ))}
                  {branches.length === 0 && (
                    <tr>
                      <td colSpan={3} className="px-6 py-8 text-center text-slate-500 text-sm">No branches yet</td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>

          {/* Chart */}
          <div className="bg-[#1b1b1b] border border-[#2a2a2a] rounded-xl p-6">
            <h2 className="text-lg font-bold mb-4">Branch Performance Analytics</h2>
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={chartData}>
                  <Bar dataKey="value" fill="#13ec80" opacity={0.2} radius={[4, 4, 0, 0]} />
                  <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fontSize: 10, fill: '#64748b' }} />
                  <Tooltip
                    contentStyle={{ backgroundColor: '#1b1b1b', border: '1px solid #2a2a2a', borderRadius: '8px' }}
                    itemStyle={{ color: '#13ec80' }}
                  />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>
        </div>

        <div className="space-y-6">
          {/* Branch Admins Quick Card */}
          <div className="bg-[#1b1b1b] border border-[#2a2a2a] rounded-xl p-6 shadow-sm">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-bold">Branch Admins</h2>
              <span
                onClick={() => setActiveTab('Admins')}
                className="text-xs text-[#13ec80] font-medium hover:underline cursor-pointer"
              >
                View All
              </span>
            </div>
            <p className="text-sm text-slate-400 mb-4">
              Manage branch admins by inviting them via email. They receive Google OAuth access.
            </p>
            <button
              onClick={() => setActiveTab('Admins')}
              className="w-full py-2 border border-[#2a2a2a] rounded-lg text-xs font-bold text-slate-500 hover:text-[#13ec80] transition-all flex items-center justify-center gap-2"
            >
              <MailIcon size={16} /> Invite Admin by Email
            </button>
          </div>

          {/* Regional Distribution */}
          <div className="bg-[#1b1b1b] border border-[#2a2a2a] rounded-xl p-6 shadow-sm relative overflow-hidden">
            <div className="absolute top-0 right-0 p-4 opacity-10">
              <Globe size={64} />
            </div>
            <h2 className="text-lg font-bold mb-2">Regional Distribution</h2>
            <p className="text-xs text-slate-500 mb-4">Branch concentration by region</p>
            <div className="space-y-3">
              {(cityDistribution.length > 0 ? cityDistribution : [{ label: 'No branches yet', val: 0 }]).map((region, i) => (
                <div key={i} className="space-y-1">
                  <div className="flex justify-between text-xs">
                    <span>{region.label}</span>
                    <span className="font-bold">{region.val}%</span>
                  </div>
                  <div className="w-full bg-[#0f0f0f] h-2 rounded-full">
                    <div className="bg-[#13ec80] h-full rounded-full" style={{ width: `${region.val}%` }} />
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Recent Enquiries quick link */}
          <div className="bg-[#1b1b1b] border border-[#2a2a2a] rounded-xl p-6 shadow-sm">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-bold">Enquiries</h2>
              <span
                onClick={() => setActiveTab('Enquiries')}
                className="text-xs text-[#13ec80] font-medium hover:underline cursor-pointer"
              >
                View All
              </span>
            </div>
            <div className="text-3xl font-bold text-[#13ec80]">{enquiries.length}</div>
            <p className="text-xs text-slate-500 mt-1">Total leads received</p>
          </div>
        </div>
      </section>
    </>
  )
}
