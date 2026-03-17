'use client'

import { MessageSquare, Trash2 } from 'lucide-react'
import { useEnquiries } from '@/hooks/useEnquiries'

export function EnquiriesTab() {
  const { enquiries, updateStatus, deleteEnquiry } = useEnquiries()

  return (
    <section className="bg-[#1b1b1b] border border-[#2a2a2a] rounded-xl shadow-sm overflow-hidden">
      <div className="px-6 py-4 border-b border-[#2a2a2a]">
        <h2 className="text-lg font-bold">Enquiries</h2>
        <p className="text-xs text-slate-500">Leads from the landing page contact and demo booking forms</p>
      </div>

      {enquiries.length === 0 ? (
        <div className="p-12 text-center text-slate-500">
          <MessageSquare className="mx-auto mb-4 w-12 h-12 opacity-20" />
          <p>No enquiries yet</p>
        </div>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-[#0f0f0f]/50 text-xs text-slate-500 uppercase tracking-wider">
                <th className="px-6 py-3 font-semibold">Name</th>
                <th className="px-6 py-3 font-semibold">Type</th>
                <th className="px-6 py-3 font-semibold">Contact</th>
                <th className="px-6 py-3 font-semibold">Message</th>
                <th className="px-6 py-3 font-semibold">Status</th>
                <th className="px-6 py-3 font-semibold">Date</th>
                <th className="px-6 py-3 font-semibold text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#2a2a2a]">
              {enquiries.map(enq => (
                <tr key={enq.id} className="hover:bg-white/5 transition-colors">
                  <td className="px-6 py-4 font-medium">{enq.name}</td>
                  <td className="px-6 py-4">
                    <span className="text-xs bg-[#13ec80]/10 text-[#13ec80] px-2 py-1 rounded font-bold uppercase">
                      {enq.type}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-sm text-slate-400">{enq.email ?? enq.phone ?? '—'}</td>
                  <td className="px-6 py-4 text-sm text-slate-400 max-w-[200px] truncate">
                    {enq.message ?? enq.course_interest ?? '—'}
                  </td>
                  <td className="px-6 py-4">
                    <select
                      value={enq.status}
                      onChange={e =>
                        updateStatus(enq.id, e.target.value as 'new' | 'contacted' | 'enrolled' | 'closed').catch(
                          () => alert('Failed to update status')
                        )
                      }
                      className="bg-black border border-[#2a2a2a] text-xs rounded px-2 py-1 text-slate-300 focus:outline-none focus:ring-1 focus:ring-[#13ec80]"
                    >
                      <option value="new">new</option>
                      <option value="contacted">contacted</option>
                      <option value="enrolled">enrolled</option>
                      <option value="closed">closed</option>
                    </select>
                  </td>
                  <td className="px-6 py-4 text-xs text-slate-500">
                    {enq.created_at ? new Date(enq.created_at).toLocaleDateString('en-IN') : '—'}
                  </td>
                  <td className="px-6 py-4 text-right">
                    <button
                      onClick={() => {
                        if (confirm(`Delete enquiry from ${enq.name}?`)) {
                          deleteEnquiry(enq.id).catch(() => alert('Failed to delete enquiry'))
                        }
                      }}
                      className="text-slate-400 hover:text-red-500 p-2 transition-colors"
                      title="Delete enquiry"
                    >
                      <Trash2 size={16} />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </section>
  )
}
