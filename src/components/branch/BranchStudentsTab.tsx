'use client'

import React, { useRef, useState } from 'react'
import * as XLSX from 'xlsx'
import { Download, Upload, UserPlus, CheckCircle2, Users, Trash2, Search, Pencil } from 'lucide-react'
import { Modal } from '@/components/Modal'
import { useStudents } from '@/hooks/useStudents'
import { useAllowedEmails } from '@/hooks/useAllowedEmails'
import { AllowedEmail } from '@/types'

interface Props {
  branchId: string
}

const inp = 'w-full bg-[#0a0a0a] border border-white/10 rounded-lg px-4 py-2 text-sm text-white placeholder-slate-600 focus:outline-none focus:ring-1 focus:ring-[#22c55e]'
const lbl = 'block text-xs font-bold text-slate-500 uppercase mb-1'

export function BranchStudentsTab({ branchId }: Props) {
  const { students, deleteStudent, loading: studentsLoading } = useStudents(branchId)
  const { allowedEmails, addAllowedEmail, bulkAddAllowedEmails, removeAllowedEmail, updateAllowedEmail } = useAllowedEmails()
  const [searchTerm, setSearchTerm] = React.useState('')
  const [isAddOpen, setIsAddOpen] = React.useState(false)
  const [isEditOpen, setIsEditOpen] = React.useState(false)
  const [editingStudent, setEditingStudent] = React.useState<AllowedEmail | null>(null)
  const [isSubmitted, setIsSubmitted] = React.useState(false)
  const [importSummary, setImportSummary] = React.useState<{ success: number; skipped: number } | null>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)

  const branchStudents = allowedEmails.filter(e => e.role === 'student' && e.branch_id === branchId)

  const filteredStudents = branchStudents.filter(s =>
    (s.full_name ?? '').toLowerCase().includes(searchTerm.toLowerCase()) ||
    (s.email ?? '').toLowerCase().includes(searchTerm.toLowerCase())
  )

  const downloadTemplate = () => {
    const ws = XLSX.utils.aoa_to_sheet([
      ['email', 'full_name', 'phone', 'parent_phone', 'fees_paid', 'fees_remaining'],
      ['student1@gmail.com', 'John Doe', '9876543210', '9876543211', 5000, 15000],
      ['student2@gmail.com', 'Jane Smith', '9876543212', '', 0, 20000]
    ])
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
      const rows = XLSX.utils.sheet_to_json<{ 
        email?: string; 
        full_name?: string;
        phone?: string;
        parent_phone?: string;
        fees_paid?: number; 
        fees_remaining?: number;
      }>(sheet)
      const entries = rows
        .filter(r => r.email?.toString().trim())
        .map(r => ({ 
          email: r.email!.toString().trim().toLowerCase(), 
          role: 'student' as const, 
          branch_id: branchId || null,
          full_name: r.full_name?.toString() || undefined,
          phone: r.phone?.toString() || undefined,
          parent_phone: r.parent_phone?.toString() || undefined,
          fees_paid: Number(r.fees_paid) || 0,
          fees_remaining: Number(r.fees_remaining) || 0
        }))
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
    const fullName = (formData.get('full_name') as string).trim()
    const phone = (formData.get('phone') as string).trim()
    const parentPhone = (formData.get('parent_phone') as string).trim()
    const feesPaid = Number(formData.get('fees_paid')) || 0
    const feesRemaining = Number(formData.get('fees_remaining')) || 0
    try {
      await addAllowedEmail({ 
        email, 
        role: 'student', 
        branch_id: branchId || null,
        full_name: fullName || undefined,
        phone: phone || undefined,
        parent_phone: parentPhone || undefined,
        fees_paid: feesPaid,
        fees_remaining: feesRemaining
      })
      setIsSubmitted(true)
      setTimeout(() => { setIsSubmitted(false); setIsAddOpen(false) }, 1500)
    } catch (err: unknown) {
      alert(err && typeof err === 'object' && 'message' in err ? (err as { message: string }).message : 'Failed to add student')
    }
  }

  const handleEditStudent = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    if (!editingStudent) return
    const formData = new FormData(e.currentTarget)
    const fullName = (formData.get('full_name') as string).trim()
    const phone = (formData.get('phone') as string).trim()
    const parentPhone = (formData.get('parent_phone') as string).trim()
    const feesPaid = Number(formData.get('fees_paid')) || 0
    const feesRemaining = Number(formData.get('fees_remaining')) || 0
    try {
      await updateAllowedEmail(editingStudent.email, { 
        full_name: fullName || undefined,
        phone: phone || undefined,
        parent_phone: parentPhone || undefined,
        fees_paid: feesPaid,
        fees_remaining: feesRemaining
      })
      setIsSubmitted(true)
      setTimeout(() => { setIsSubmitted(false); setIsEditOpen(false); setEditingStudent(null) }, 1500)
    } catch (err: unknown) {
      alert(err && typeof err === 'object' && 'message' in err ? (err as { message: string }).message : 'Failed to update student')
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
          </div>Student</th>
                <th className="px-6 py-4">Contact Info</th>
                <th className="px-6 py-4">Fees Paid</th>
                <th className="px-6 py-4">Fees Rem.</th>
                <th className="px-6 py-4">Status</th>
                <th className="px-6 py-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#2d2d2d]">
              {studentsLoading ? (
                <tr><td colSpan={6} className="px-6 py-8 text-center text-slate-500">Loading students…</td></tr>
              ) : filteredStudents.length === 0 ? (
                <tr><td colSpan={6} className="px-6 py-12 text-center text-slate-500">
                  <Users className="mx-auto mb-3 w-10 h-10 opacity-20" />
                  <p>{searchTerm ? 'No students match your search' : 'No students yet'}</p>
                </td></tr>
              ) : filteredStudents.map(student => (
                <tr key={student.email} className="hover:bg-white/5 transition-colors">
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-3">
                      <div className="size-10 rounded-full bg-emerald-500/20 text-emerald-500 flex items-center justify-center text-sm font-bold">
                        {(student.full_name || student.email)[0].toUpperCase()}
                      </div>
                      <div>
                        <div className="font-medium text-white">{student.full_name || '—'}</div>
                        <div className="text-xs text-slate-500">{student.email}</div>
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <div className="text-sm">
                      <div className="text-slate-300">📱 {student.phone || 'No phone'}</div>
                      <div className="text-xs text-slate-500">🏠 {student.parent_phone || 'No parent phone'}</div>
                    </div>
                  merald-500 flex items-center justify-center text-xs font-bold">
                        {(student.full_name ?? student.email)[0].toUpperCase()}
                      </div>
                      <span className="font-medium">{student.full_name ?? '—'}</span>
                    </div>
                  </td>
                  <td className="px-6 py-4 text-sm text-slate-300">{student.email}</td>
                  <td className="px-6 py-4 text-sm font-semibold text-emerald-400">
                    ₹{student.fees_paid?.toLocaleString() ?? 0}
                  </td>
                  <td className="px-6 py-4 text-sm font-semibold text-rose-400">
                    ₹{student.fees_remaining?.toLocaleString() ?? 0}
                  </td>
                  <td className="px-6 py-4"><span className="text-xs text-[#22c55e]">Active</span></td>
                  <td className="px-6 py-4 text-right flex items-center justify-end gap-2">
                    <button 
                      onClick={() => { setIsSubmitted(false); setEditingStudent(student); setIsEditOpen(true) }}
                      className="text-slate-400 hover:text-[#22c55e] p-2 border border-[#2d2d2d] rounded-lg transition-colors"
                      title="Edit Student"
                    >
                      <Pencil size={14} />
                    </button>
                    <button onClick={() => { if (confirm(`Remove ${student.email}?`)) removeAllowedEmail(student.email).catch(() => alert('Failed to delete student')) }}
                      className="text-slate-400 hover:text-red-500 p-2 border border-[#2d2d2d] rounded-lg hover:border-red-500/30 transition-colors"
                    >
                      <Trash2 size={16} />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      <Modal isOpen={isAddOpen} onClose={() => setIsAddOpen(false)} title="Add Student">
        {isSudiv className="grid grid-cols-2 gap-4">
              <div className="col-span-2">
                <label className={lbl}>Student Email</label>
                <input name="email" required type="email" className={inp} placeholder="student@gmail.com" />
              </div>
              <div className="col-span-2">
                <label className={lbl}>Full Name</label>
                <input name="full_name" className={inp} placeholder="Jane Doe" />
              </div>
              <div>
                <label className={lbl}>Phone</label>
                <input name="phone" className={inp} placeholder="Student Phone" />
              </div>
              <div>
                <label className={lbl}>Parent Phone</label>
                <input name="parent_phone" className={inp} placeholder="Parent Phone" />
              </div>
              <div>
                <label className={lbl}>Fees Paid (₹)</label>
                <input name="fees_paid" type="number" className={inp} defaultValue={0} min={0} />
              </div>
              <div>
                <label className={lbl}>Fees Remaining (₹)</label>
                <input name="fees_remaining" type="number" className={inp} defaultValue={0} min={0} />
              </div>
            </div>
            <button type="submit" className="w-full bg-[#22c55e] text-black font-bold py-3 rounded-lg hover:opacity-90 transition-opacity mt-4">Add Student</button>
          </form>
        )}
      </Modal>

      <Modal isOpen={isEditOpen} onClose={() => { setIsEditOpen(false); setEditingStudent(null) }} title="Edit Student Details">
        {isSubmitted ? (
          <div className="flex flex-col items-center justify-center py-8 text-center">
            <CheckCircle2 className="text-[#22c55e] w-16 h-16 mb-4 animate-bounce" />
            <h4 className="text-xl font-bold mb-2">Details Updated!</h4>
            <p className="text-slate-400">Student information has been saved.</p>
          </div>
        ) : editingStudent && (
          <form onSubmit={handleEditStudent} className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="col-span-2 opacity-50">
                <label className={lbl}>Email (Cannot change)</label>
                <input className={inp} value={editingStudent.email} disabled />
              </div>
              <div className="col-span-2">
                <label className={lbl}>Full Name</label>
                <input name="full_name" className={inp} defaultValue={editingStudent.full_name || ''} />
              </div>
              <div>
                <label className={lbl}>Phone</label>
                <input name="phone" className={inp} defaultValue={editingStudent.phone || ''} />
              </div>
              <div>
                <label className={lbl}>Parent Phone</label>
                <input name="parent_phone" className={inp} defaultValue={editingStudent.parent_phone || ''} />
              </div>
              <div>
                <label className={lbl}>Fees Paid (₹)</label>
                <input name="fees_paid" type="number" className={inp} defaultValue={editingStudent.fees_paid ?? 0} min={0} />
              </div>
              <div>
                <label className={lbl}>Fees Remaining (₹)</label>
                <input name="fees_remaining" type="number" className={inp} defaultValue={editingStudent.fees_remaining ?? 0} min={0} />
              </div>
            </div>
            <button type="submit" className="w-full bg-[#22c55e] text-black font-bold py-3 rounded-lg hover:opacity-90 transition-opacity mt-4">Update Student</button>
          </form>
        )}
      </Modaltted ? (
          <div className="flex flex-col items-center justify-center py-8 text-center">
            <CheckCircle2 className="text-[#22c55e] w-16 h-16 mb-4 animate-bounce" />
            <h4 className="text-xl font-bold mb-2">Details Updated!</h4>
            <p className="text-slate-400">Student fee information has been saved.</p>
          </div>
        ) : editingStudent && (
          <form onSubmit={handleEditStudent} className="space-y-4">
            <div>
              <label className={lbl}>Student Email</label>
              <input value={editingStudent.email} disabled className={inp + ' opacity-50'} />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className={lbl}>Fees Paid (₹)</label>
                <input name="fees_paid" type="number" className={inp} defaultValue={editingStudent.fees_paid ?? 0} min={0} />
              </div>
              <div>
                <label className={lbl}>Fees Remaining (₹)</label>
                <input name="fees_remaining" type="number" className={inp} defaultValue={editingStudent.fees_remaining ?? 0} min={0} />
              </div>
            </div>
            <button type="submit" className="w-full bg-[#22c55e] text-black font-bold py-3 rounded-lg hover:opacity-90 transition-opacity mt-4">
              Save Changes
            </button>
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
