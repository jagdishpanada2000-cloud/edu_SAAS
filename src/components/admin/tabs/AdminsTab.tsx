'use client'

import { useState } from 'react'
import { Plus, Mail as MailIcon, ShieldCheck, CheckCircle2 } from 'lucide-react'
import { Modal } from '@/components/Modal'
import { useAllowedEmails } from '@/hooks/useAllowedEmails'
import { useBranches } from '@/hooks/useBranches'

const inp = 'w-full bg-[#0a0a0a] border border-white/10 rounded-lg px-4 py-2 text-sm text-white placeholder-slate-600 focus:outline-none focus:ring-1 focus:ring-[#13ec80]'
const lbl = 'block text-xs font-bold text-slate-500 uppercase mb-1'

export function AdminsTab() {
  const { allowedEmails, addAllowedEmail, removeAllowedEmail } = useAllowedEmails()
  const { branches } = useBranches()
  const [isInviteOpen, setIsInviteOpen] = useState(false)
  const [submitted, setSubmitted] = useState(false)

  const admins = allowedEmails.filter(e => e.role === 'branch_admin' || e.role === 'super_admin')

  const handleInvite = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    const fd = new FormData(e.currentTarget)
    const email = fd.get('email') as string
    const role = fd.get('role') as 'super_admin' | 'branch_admin'
    const branchId = fd.get('branch_id') as string
    try {
      await addAllowedEmail({ email, role, branch_id: branchId || null })
      setSubmitted(true)
      setTimeout(() => { setSubmitted(false); setIsInviteOpen(false) }, 1500)
    } catch (err: unknown) {
      alert(err && typeof err === 'object' && 'message' in err ? (err as { message: string }).message : 'Failed to add admin')
    }
  }

  return (
    <>
      <section className="bg-[#1b1b1b] border border-[#2a2a2a] rounded-xl shadow-sm overflow-hidden">
        <div className="px-6 py-4 border-b border-[#2a2a2a] flex items-center justify-between">
          <div>
            <h2 className="text-lg font-bold">Branch Administrators</h2>
            <p className="text-xs text-slate-500">Manage access and roles for branch managers</p>
          </div>
          <button
            onClick={() => { setSubmitted(false); setIsInviteOpen(true) }}
            className="bg-[#13ec80] hover:bg-[#13ec80]/90 text-black text-xs font-bold px-4 py-2 rounded-lg transition-all flex items-center gap-2"
          >
            <Plus size={16} /> Invite Admin
          </button>
        </div>

        {admins.length === 0 ? (
          <div className="p-12 text-center text-slate-500">
            <ShieldCheck className="mx-auto mb-4 w-12 h-12 opacity-20" />
            <p>No admins yet. Invite one by clicking the button above.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-[#0f0f0f]/50 text-xs text-slate-500 uppercase tracking-wider">
                  <th className="px-6 py-3 font-semibold">Email</th>
                  <th className="px-6 py-3 font-semibold">Role</th>
                  <th className="px-6 py-3 font-semibold">Branch</th>
                  <th className="px-6 py-3 font-semibold">Added</th>
                  <th className="px-6 py-3 font-semibold text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#2a2a2a]">
                {admins.map(admin => (
                  <tr key={admin.email} className="hover:bg-white/5 transition-colors">
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-full bg-[#13ec80]/10 flex items-center justify-center">
                          <MailIcon size={14} className="text-[#13ec80]" />
                        </div>
                        <span className="font-medium">{admin.email}</span>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <span className={`text-xs font-bold px-2 py-1 rounded uppercase ${admin.role === 'super_admin' ? 'bg-purple-500/10 text-purple-400' : 'bg-[#13ec80]/10 text-[#13ec80]'}`}>
                        {admin.role === 'super_admin' ? 'Super Admin' : 'Branch Admin'}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-sm text-slate-400">{admin.branches?.name ?? 'Unassigned'}</td>
                    <td className="px-6 py-4 text-sm text-slate-500">
                      {admin.created_at ? new Date(admin.created_at).toLocaleDateString('en-IN') : '—'}
                    </td>
                    <td className="px-6 py-4 text-right">
                      <button
                        onClick={() => { if (confirm(`Remove ${admin.email}?`)) removeAllowedEmail(admin.email).catch(() => alert('Failed to remove admin')) }}
                        className="text-slate-400 hover:text-red-500 text-xs font-bold px-3 py-1 border border-[#2a2a2a] rounded-lg hover:border-red-500/30 transition-colors"
                      >
                        Remove
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>

      {/* Invite Modal */}
      <Modal isOpen={isInviteOpen} onClose={() => setIsInviteOpen(false)} title="Invite Admin">
        {submitted ? (
          <div className="flex flex-col items-center justify-center py-8 text-center">
            <CheckCircle2 className="text-[#13ec80] w-16 h-16 mb-4 animate-bounce" />
            <h4 className="text-xl font-bold mb-2">Admin Added!</h4>
            <p className="text-slate-400">The email has been added to the access list.</p>
          </div>
        ) : (
          <form onSubmit={handleInvite} className="space-y-4">
            <div>
              <label className={lbl}>Admin Email</label>
              <input name="email" required type="email" className={inp} placeholder="admin@gmail.com" />
            </div>
            <div>
              <label className={lbl}>Role</label>
              <select name="role" required className={inp}>
                <option value="branch_admin">Branch Admin</option>
                <option value="super_admin">Super Admin</option>
              </select>
            </div>
            <div>
              <label className={lbl}>Assign Branch (optional)</label>
              <select name="branch_id" className={inp}>
                <option value="">— None —</option>
                {branches.map(b => <option key={b.id} value={b.id}>{b.name}</option>)}
              </select>
            </div>
            <button type="submit" className="w-full bg-[#13ec80] text-black font-bold py-3 rounded-lg hover:opacity-90 transition-opacity mt-4">
              Add Admin
            </button>
          </form>
        )}
      </Modal>
    </>
  )
}
