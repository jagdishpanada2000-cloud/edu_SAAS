'use client'

import { useState } from 'react'
import { Plus, Edit3, Trash2, CheckCircle2 } from 'lucide-react'
import { Modal } from '@/components/Modal'
import { useBranches } from '@/hooks/useBranches'
import { useBranchStats } from '@/hooks/useBranchStats'
import type { Branch } from '@/types'

const inp = 'w-full bg-[#0a0a0a] border border-white/10 rounded-lg px-4 py-2 text-sm text-white placeholder-slate-600 focus:outline-none focus:ring-1 focus:ring-[#13ec80]'
const lbl = 'block text-xs font-bold text-slate-500 uppercase mb-1'

export function BranchesTab() {
  const { branches, addBranch, updateBranch, deleteBranch } = useBranches()
  const { stats } = useBranchStats()
  const [isAddOpen, setIsAddOpen] = useState(false)
  const [isEditOpen, setIsEditOpen] = useState(false)
  const [selectedBranch, setSelectedBranch] = useState<Branch | null>(null)
  const [submitted, setSubmitted] = useState(false)

  const handleAdd = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    const fd = new FormData(e.currentTarget)
    try {
      await addBranch({ name: fd.get('name') as string, city: fd.get('city') as string, is_active: true })
      setSubmitted(true)
      setTimeout(() => { setSubmitted(false); setIsAddOpen(false) }, 1500)
    } catch (err: unknown) {
      alert(err && typeof err === 'object' && 'message' in err ? (err as { message: string }).message : 'Failed to add branch')
    }
  }

  const handleEdit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    if (!selectedBranch) return
    const fd = new FormData(e.currentTarget)
    try {
      await updateBranch(selectedBranch.id, { name: fd.get('name') as string, city: fd.get('city') as string })
      setSubmitted(true)
      setTimeout(() => { setSubmitted(false); setIsEditOpen(false) }, 1500)
    } catch (err: unknown) {
      alert(err && typeof err === 'object' && 'message' in err ? (err as { message: string }).message : 'Failed to update branch')
    }
  }

  return (
    <>
      <section className="bg-[#1b1b1b] border border-[#2a2a2a] rounded-xl shadow-sm overflow-hidden">
        <div className="px-6 py-4 border-b border-[#2a2a2a] flex items-center justify-between">
          <div>
            <h2 className="text-lg font-bold">All Branches</h2>
            <p className="text-xs text-slate-500">Manage and monitor all educational centers</p>
          </div>
          <button
            onClick={() => { setSubmitted(false); setIsAddOpen(true) }}
            className="bg-[#13ec80] hover:bg-[#13ec80]/90 text-black text-xs font-bold px-4 py-2 rounded-lg transition-all flex items-center gap-2"
          >
            <Plus size={16} /> Add Branch
          </button>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-[#0f0f0f]/50 text-xs text-slate-500 uppercase tracking-wider">
                <th className="px-6 py-3 font-semibold">Branch Name</th>
                <th className="px-6 py-3 font-semibold">City</th>
                <th className="px-6 py-3 font-semibold text-center">Students</th>
                <th className="px-6 py-3 font-semibold text-center">Teachers</th>
                <th className="px-6 py-3 font-semibold">Admin</th>
                <th className="px-6 py-3 font-semibold text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#2a2a2a]">
              {branches.map(branch => (
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
                  <td className="px-6 py-4 text-center text-sm text-[#13ec80] font-medium">{stats[branch.id]?.students ?? '—'}</td>
                  <td className="px-6 py-4 text-center text-sm text-slate-400">{stats[branch.id]?.teachers ?? '—'}</td>
                  <td className="px-6 py-4 text-sm text-slate-400">{stats[branch.id]?.admins ?? '—'}</td>
                  <td className="px-6 py-4 text-right">
                    <button
                      onClick={() => { setSelectedBranch(branch); setSubmitted(false); setIsEditOpen(true) }}
                      className="text-slate-400 hover:text-[#13ec80] p-2 transition-colors"
                    >
                      <Edit3 size={16} />
                    </button>
                    <button
                      onClick={() => { if (confirm(`Delete "${branch.name}"?`)) deleteBranch(branch.id).catch(() => alert('Failed to delete branch')) }}
                      className="text-slate-400 hover:text-red-500 p-2 transition-colors"
                    >
                      <Trash2 size={16} />
                    </button>
                  </td>
                </tr>
              ))}
              {branches.length === 0 && (
                <tr>
                  <td colSpan={6} className="px-6 py-12 text-center text-slate-500">No branches yet</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </section>

      {/* Add Branch Modal */}
      <Modal isOpen={isAddOpen} onClose={() => setIsAddOpen(false)} title="Add New Branch">
        {submitted ? (
          <div className="flex flex-col items-center justify-center py-8 text-center">
            <CheckCircle2 className="text-[#13ec80] w-16 h-16 mb-4 animate-bounce" />
            <h4 className="text-xl font-bold mb-2">Branch Created!</h4>
            <p className="text-slate-400">The new branch has been added to the system.</p>
          </div>
        ) : (
          <form onSubmit={handleAdd} className="space-y-4">
            <div>
              <label className={lbl}>Branch Name</label>
              <input name="name" required type="text" className={inp} placeholder="e.g. Uptown Campus" />
            </div>
            <div>
              <label className={lbl}>City</label>
              <input name="city" required type="text" className={inp} placeholder="e.g. Mumbai" />
            </div>
            <button type="submit" className="w-full bg-[#13ec80] text-black font-bold py-3 rounded-lg hover:opacity-90 transition-opacity mt-4">
              Create Branch
            </button>
          </form>
        )}
      </Modal>

      {/* Edit Branch Modal */}
      <Modal isOpen={isEditOpen} onClose={() => setIsEditOpen(false)} title="Edit Branch">
        {submitted ? (
          <div className="flex flex-col items-center justify-center py-8 text-center">
            <CheckCircle2 className="text-[#13ec80] w-16 h-16 mb-4 animate-bounce" />
            <h4 className="text-xl font-bold mb-2">Branch Updated!</h4>
            <p className="text-slate-400">Changes have been saved successfully.</p>
          </div>
        ) : (
          <form onSubmit={handleEdit} className="space-y-4">
            <div>
              <label className={lbl}>Branch Name</label>
              <input name="name" required type="text" defaultValue={selectedBranch?.name} className={inp} />
            </div>
            <div>
              <label className={lbl}>City</label>
              <input name="city" required type="text" defaultValue={selectedBranch?.city} className={inp} />
            </div>
            <button type="submit" className="w-full bg-[#13ec80] text-black font-bold py-3 rounded-lg hover:opacity-90 transition-opacity mt-4">
              Save Changes
            </button>
          </form>
        )}
      </Modal>
    </>
  )
}
