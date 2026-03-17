'use client'

import { useState, useRef } from 'react'
import { Users, Download, Upload, UserPlus, CheckCircle2 } from 'lucide-react'
import * as XLSX from 'xlsx'
import { Modal } from '@/components/Modal'
import { useAllowedEmails } from '@/hooks/useAllowedEmails'
import { useBranches } from '@/hooks/useBranches'

const inp = 'w-full bg-[#0a0a0a] border border-white/10 rounded-lg px-4 py-2 text-sm text-white placeholder-slate-600 focus:outline-none focus:ring-1 focus:ring-[#13ec80]'
const lbl = 'block text-xs font-bold text-slate-500 uppercase mb-1'

export function StudentsTab() {
  const { allowedEmails, addAllowedEmail, bulkAddAllowedEmails, removeAllowedEmail } = useAllowedEmails()
  const { branches } = useBranches()
  const [isAddOpen, setIsAddOpen] = useState(false)
  const [submitted, setSubmitted] = useState(false)
  const [importSummary, setImportSummary] = useState<{ success: number; skipped: number } | null>(null)
  const fileRef = useRef<HTMLInputElement>(null)

  const students = allowedEmails.filter(e => e.role === 'student')

  const handleAdd = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    const fd = new FormData(e.currentTarget)
    const email = (fd.get('email') as string).trim().toLowerCase()
    const branchId = fd.get('branch_id') as string
    const feesPaid = Number(fd.get('fees_paid')) || 0
    const feesRemaining = Number(fd.get('fees_remaining')) || 0
    try {
      await addAllowedEmail({ 
        email, 
        role: 'student', 
        branch_id: branchId || null,
        fees_paid: feesPaid,
        fees_remaining: feesRemaining
      })
      setSubmitted(true)
      setTimeout(() => { setSubmitted(false); setIsAddOpen(false) }, 1500)
    } catch (err: unknown) {
      alert(err && typeof err === 'object' && 'message' in err ? (err as { message: string }).message : 'Failed to add student')
    }
  }

  const downloadTemplate = () => {
    const ws = XLSX.utils.aoa_to_sheet([
      ['email', 'branch_name', 'fees_paid', 'fees_remaining'],
      ['student1@gmail.com', 'Main Branch', 5000, 15000],
      ['student2@gmail.com', '', 0, 20000],
    ])
    const wb = XLSX.utils.book_new()
    XLSX.utils.book_append_sheet(wb, ws, 'Students')
    XLSX.writeFile(wb, 'student_import_template.xlsx')
  }

  const handleImport = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    try {
      const buf = await file.arrayBuffer()
      const wb = XLSX.read(buf)
      const rows = XLSX.utils.sheet_to_json<{ 
        email?: string; 
        branch_name?: string;
        fees_paid?: number;
        fees_remaining?: number;
      }>(wb.Sheets[wb.SheetNames[0]])
      
      const entries = rows
        .filter(r => r.email?.toString().trim())
        .map(r => ({
          email: r.email!.toString().trim().toLowerCase(),
          role: 'student' as const,
          branch_id: r.branch_name
            ? (branches.find(b => b.name.toLowerCase() === r.branch_name!.toLowerCase())?.id ?? null)
            : null,
          fees_paid: Number(r.fees_paid) || 0,
          fees_remaining: Number(r.fees_remaining) || 0
        }))
      if (entries.length === 0) { alert('No valid email rows found.'); return }
      await bulkAddAllowedEmails(entries)
      setImportSummary({ success: entries.length, skipped: rows.length - entries.length })
    } catch (err: unknown) {
      alert(err && typeof err === 'object' && 'message' in err ? (err as { message: string }).message : 'Import failed')
    } finally {
      e.target.value = ''
    }
  }

  return (
    <>
      <section className="bg-[#1b1b1b] border border-[#2a2a2a] rounded-xl shadow-sm overflow-hidden">
        <div className="px-6 py-4 border-b border-[#2a2a2a] flex items-center justify-between flex-wrap gap-3">
          <div>
            <h2 className="text-lg font-bold">Students Access List</h2>
            <p className="text-xs text-slate-500">Only students added here can sign in to the portal</p>
          </div>
          <div className="flex items-center gap-2 flex-wrap">
            <button
              onClick={downloadTemplate}
              className="border border-[#2a2a2a] hover:border-[#13ec80]/50 text-slate-400 hover:text-[#13ec80] text-xs font-bold px-3 py-2 rounded-lg transition-all flex items-center gap-2"
            >
              <Download size={14} /> Template
            </button>
            <label className="border border-[#2a2a2a] hover:border-[#13ec80]/50 text-slate-400 hover:text-[#13ec80] text-xs font-bold px-3 py-2 rounded-lg transition-all flex items-center gap-2 cursor-pointer">
              <Upload size={14} /> Import Excel
              <input ref={fileRef} type="file" accept=".xlsx,.xls,.csv" className="hidden" onChange={handleImport} />
            </label>
            <button
              onClick={() => { setSubmitted(false); setIsAddOpen(true) }}
              className="bg-[#13ec80] hover:bg-[#13ec80]/90 text-black text-xs font-bold px-4 py-2 rounded-lg transition-all flex items-center gap-2"
            >
              <UserPlus size={16} /> Add Student
            </button>
          </div>
        </div>

        {students.length === 0 ? (
          <div className="p-12 text-center text-slate-500">
            <Users className="mx-auto mb-4 w-12 h-12 opacity-20" />
            <p className="font-medium mb-1">No students yet</p>
            <p className="text-xs">Add students manually or import a list via Excel.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-[#0f0f0f]/50 text-xs text-slate-500 uppercase tracking-wider">
                  <th className="px-6 py-3 font-semibold">Email</th>
                  <th className="px-6 py-3 font-semibold">Branch</th>
                  <th className="px-6 py-3 font-semibold">Fees Paid</th>
                  <th className="px-6 py-3 font-semibold">Fees Rem.</th>
                  <th className="px-6 py-3 font-semibold">Added</th>
                  <th className="px-6 py-3 font-semibold text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#2a2a2a]">
                {students.map(student => (
                  <tr key={student.email} className="hover:bg-white/5 transition-colors">
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-full bg-blue-500/10 flex items-center justify-center">
                          <Users size={14} className="text-blue-400" />
                        </div>
                        <span className="font-medium">{student.email}</span>
                      </div>
                    </td>
                    <td className="px-6 py-4 text-sm text-slate-400">{student.branches?.name ?? 'Unassigned'}</td>
                    <td className="px-6 py-4 text-sm font-semibold text-emerald-400">
                      ₹{student.fees_paid?.toLocaleString() ?? 0}
                    </td>
                    <td className="px-6 py-4 text-sm font-semibold text-rose-400">
                      ₹{student.fees_remaining?.toLocaleString() ?? 0}
                    </td>
                    <td className="px-6 py-4 text-sm text-slate-500">
                      {student.created_at ? new Date(student.created_at).toLocaleDateString('en-IN') : '—'}
                    </td>
                    <td className="px-6 py-4 text-right">
                      <button
                        onClick={() => { if (confirm(`Remove ${student.email}?`)) removeAllowedEmail(student.email).catch(() => alert('Failed to remove student')) }}
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

      {/* Add Student Modal */}
      <Modal isOpen={isAddOpen} onClose={() => setIsAddOpen(false)} title="Add Student">
        {submitted ? (
          <div className="flex flex-col items-center justify-center py-8 text-center">
            <CheckCircle2 className="text-[#13ec80] w-16 h-16 mb-4 animate-bounce" />
            <h4 className="text-xl font-bold mb-2">Student Added!</h4>
            <p className="text-slate-400">They can now sign in with their Google account.</p>
          </div>
        ) : (
          <form onSubmit={handleAdd} className="space-y-4">
            <div>
              <label className={lbl}>Student Gmail</label>
              <input name="email" required type="email" className={inp} placeholder="student@gmail.com" />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className={lbl}>Fees Paid (₹)</label>
                <input name="fees_paid" type="number" className={inp} defaultValue={0} min={0} />
              </div>
              <div>
                <label className={lbl}>Fees Remaining (₹)</label>
                <input name="fees_remaining" type="number" className={inp} defaultValue={0} min={0} />
              </div>
            </div>
            <div>
              <label className={lbl}>Assign Branch (optional)</label>
              <select name="branch_id" className={inp}>
                <option value="">— None —</option>
                {branches.map(b => <option key={b.id} value={b.id}>{b.name}</option>)}
              </select>
            </div>
            <button type="submit" className="w-full bg-[#13ec80] text-black font-bold py-3 rounded-lg hover:opacity-90 transition-opacity mt-4">
              Add Student
            </button>
          </form>
        )}
      </Modal>

      {/* Import Summary Modal */}
      {importSummary && (
        <Modal isOpen onClose={() => setImportSummary(null)} title="Import Complete">
          <div className="flex flex-col items-center justify-center py-8 text-center">
            <CheckCircle2 className="text-[#13ec80] w-16 h-16 mb-4" />
            <h4 className="text-xl font-bold mb-2">Import Done!</h4>
            <p className="text-slate-400">{importSummary.success} student email(s) added to the access list.</p>
            {importSummary.skipped > 0 && (
              <p className="text-xs text-slate-500 mt-2">{importSummary.skipped} row(s) skipped (missing email).</p>
            )}
            <button onClick={() => setImportSummary(null)} className="mt-6 bg-[#13ec80] text-black font-bold px-6 py-2 rounded-lg hover:opacity-90">
              Done
            </button>
          </div>
        </Modal>
      )}
    </>
  )
}
