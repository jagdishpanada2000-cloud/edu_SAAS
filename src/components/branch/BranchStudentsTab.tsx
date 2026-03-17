'use client'

import React, { useRef } from 'react'
import * as XLSX from 'xlsx'
import { Download, Upload, UserPlus, CheckCircle2, Users, Trash2, Search } from 'lucide-react'
import { Modal } from '@/components/Modal'
import { useStudents } from '@/hooks/useStudents'
import { useAllowedEmails } from '@/hooks/useAllowedEmails'

interface Props {
  branchId: string
}

const inp = 'w-full bg-[#0a0a0a] border border-white/10 rounded-lg px-4 py-2 text-sm text-white placeholder-slate-600 focus:outline-none focus:ring-1 focus:ring-[#22c55e]'
const lbl = 'block text-xs font-bold text-slate-500 uppercase mb-1'

export function BranchStudentsTab({ branchId }: Props) {
  const { students, deleteStudent, loading: studentsLoading } = useStudents(branchId)
  const { addAllowedEmail, bulkAddAllowedEmails } = useAllowedEmails()
  const [searchTerm, setSearchTerm] = React.useState('')
  const [isAddOpen, setIsAddOpen] = React.useState(false)
  const [isSubmitted, setIsSubmitted] = React.useState(false)
  const [importSummary, setImportSummary] = React.useState<{ success: number; skipped: number } | null>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)

  const filteredStudents = students.filter(s =>
    (s.full_name ?? '').toLowerCase().includes(searchTerm.toLowerCase()) ||
    (s.email ?? '').toLowerCase().includes(searchTerm.toLowerCase())
  )

  const downloadTemplate = () => {
    const ws = XLSX.utils.aoa_to_sheet([['email'], ['student1@gmail.com'], ['student2@gmail.com']])
    const wb = XLSX.utils.book_new()
    XLSX.utils.book_append_sheet(wb, ws, 'Students')
    XLSX.writeFile(wb, 'student_import_template.xlsx')
  }

  const handleImportFile = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    try {
      const buffer = await file.arrayBuffer()
      const workbook = XLSX.read(buffer)
      const sheet = workbook.Sheets[workbook.SheetNames[0]]
      const rows = XLSX.utils.sheet_to_json<{ email?: string }>(sheet)
      const entries = rows
        .filter(r => r.email?.toString().trim())
        .map(r => ({ email: r.email!.toString().trim().toLowerCase(), role: 'student' as const, branch_id: branchId || null }))
      const skipped = rows.length - entries.length
      if (entries.length === 0) { alert('No valid email rows found in the file.'); return }
      await bulkAddAllowedEmails(entries)
      setImportSummary({ success: entries.length, skipped })
    } catch (err: unknown) {
      alert(err && typeof err === 'object' && 'message' in err ? (err as { message: string }).message : 'Import failed')
    } finally {
      e.target.value = ''
    }
  }

  const handleAddStudent = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    const formData = new FormData(e.currentTarget)
    const email = (formData.get('email') as string).trim().toLowerCase()
    try {
      await addAllowedEmail({ email, role: 'student', branch_id: branchId || null })
      setIsSubmitted(true)
      setTimeout(() => { setIsSubmitted(false); setIsAddOpen(false) }, 1500)
    } catch (err: unknown) {
      alert(err && typeof err === 'object' && 'message' in err ? (err as { message: string }).message : 'Failed to add student')
    }
  }

  return (
    <>
      <section className="bg-[#1b1b1b] rounded-xl border border-[#2d2d2d] overflow-hidden">
        <div className="p-6 border-b border-[#2d2d2d] flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h2 className="text-xl font-bold">Students</h2>
            <p className="text-sm text-slate-400">Manage all students enrolled in this branch</p>
          </div>
          <div className="flex items-center gap-2 flex-wrap">
            <button onClick={downloadTemplate}
              className="flex items-center gap-2 px-3 py-2 bg-white/5 hover:bg-white/10 text-sm font-medium rounded-lg transition-colors border border-[#2d2d2d] text-slate-400 hover:text-[#22c55e]">
              <Download size={16} /> Template
            </button>
            <label className="flex items-center gap-2 px-3 py-2 bg-white/5 hover:bg-white/10 text-sm font-medium rounded-lg transition-colors border border-[#2d2d2d] text-slate-400 hover:text-[#22c55e] cursor-pointer">
              <Upload size={16} /> Import Excel
              <input ref={fileInputRef} type="file" accept=".xlsx,.xls,.csv" className="hidden" onChange={handleImportFile} />
            </label>
            <button onClick={() => setIsAddOpen(true)}
              className="flex items-center gap-2 px-4 py-2 bg-[#22c55e] hover:bg-[#22c55e]/90 text-black text-sm font-bold rounded-lg transition-colors">
              <UserPlus size={18} /> Add Student
            </button>
          </div>
        </div>
        <div className="p-4 border-b border-[#2d2d2d] bg-white/5">
          <div className="relative max-w-md">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 w-4 h-4" />
            <input
              className="w-full bg-[#0f0f0f] border border-[#2d2d2d] rounded-lg pl-10 py-2 text-sm focus:ring-1 focus:ring-[#22c55e] focus:border-[#22c55e] outline-none text-white"
              placeholder="Search by name or email..."
              type="text"
              value={searchTerm}
              onChange={e => setSearchTerm(e.target.value)}
            />
          </div>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-white/5 text-slate-400 text-xs font-semibold uppercase tracking-wider">
                <th className="px-6 py-4">Name</th>
                <th className="px-6 py-4">Email</th>
                <th className="px-6 py-4">Status</th>
                <th className="px-6 py-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#2d2d2d]">
              {studentsLoading ? (
                <tr><td colSpan={4} className="px-6 py-8 text-center text-slate-500">Loading students…</td></tr>
              ) : filteredStudents.length === 0 ? (
                <tr><td colSpan={4} className="px-6 py-12 text-center text-slate-500">
                  <Users className="mx-auto mb-3 w-10 h-10 opacity-20" />
                  <p>{searchTerm ? 'No students match your search' : 'No students yet'}</p>
                </td></tr>
              ) : filteredStudents.map(student => (
                <tr key={student.id} className="hover:bg-white/5 transition-colors">
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-3">
                      <div className="size-8 rounded-full bg-emerald-500/20 text-emerald-500 flex items-center justify-center text-xs font-bold">
                        {(student.full_name ?? 'S')[0]}
                      </div>
                      <span className="font-medium">{student.full_name ?? '—'}</span>
                    </div>
                  </td>
                  <td className="px-6 py-4 text-sm text-slate-300">{student.email}</td>
                  <td className="px-6 py-4"><span className="text-xs text-[#22c55e]">Active</span></td>
                  <td className="px-6 py-4 text-right">
                    <button onClick={() => { if (confirm('Remove this student?')) deleteStudent(student.id).catch(() => alert('Failed to delete student')) }}
                      className="text-slate-400 hover:text-red-500 transition-colors">
                      <Trash2 size={18} />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      <Modal isOpen={isAddOpen} onClose={() => setIsAddOpen(false)} title="Add Student">
        {isSubmitted ? (
          <div className="flex flex-col items-center justify-center py-8 text-center">
            <CheckCircle2 className="text-[#22c55e] w-16 h-16 mb-4 animate-bounce" />
            <h4 className="text-xl font-bold mb-2">Student Added!</h4>
            <p className="text-slate-400">They can now sign in with their Google account.</p>
          </div>
        ) : (
          <form onSubmit={handleAddStudent} className="space-y-4">
            <p className="text-xs text-slate-500">The student will be able to sign in using this Gmail address.</p>
            <div><label className={lbl}>Student Gmail</label>
              <input name="email" required type="email" className={inp} placeholder="student@gmail.com" /></div>
            <button type="submit" className="w-full bg-[#22c55e] text-black font-bold py-3 rounded-lg hover:opacity-90 transition-opacity mt-4">Add Student</button>
          </form>
        )}
      </Modal>

      {importSummary && (
        <Modal isOpen onClose={() => setImportSummary(null)} title="Import Complete">
          <div className="flex flex-col items-center justify-center py-8 text-center">
            <CheckCircle2 className="text-[#22c55e] w-16 h-16 mb-4" />
            <h4 className="text-xl font-bold mb-2">Import Done!</h4>
            <p className="text-slate-400">{importSummary.success} student email(s) added.</p>
            {importSummary.skipped > 0 && <p className="text-xs text-slate-500 mt-2">{importSummary.skipped} row(s) skipped.</p>}
            <button onClick={() => setImportSummary(null)} className="mt-6 bg-[#22c55e] text-black font-bold px-6 py-2 rounded-lg hover:opacity-90">Done</button>
          </div>
        </Modal>
      )}
    </>
  )
}
