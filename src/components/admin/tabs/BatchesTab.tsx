'use client'

import { useState, useRef } from 'react'
import {
  Plus, ArrowLeft, Download, Upload, UserPlus, CheckCircle2,
  BookOpen, Users, Trash2, Pencil,
} from 'lucide-react'
import * as XLSX from 'xlsx'
import { Modal } from '@/components/Modal'
import { useBatches } from '@/hooks/useBatches'
import { useCourses } from '@/hooks/useCourses'
import { useBranches } from '@/hooks/useBranches'
import { useBatchStudents } from '@/hooks/useBatchStudents'
import type { Batch } from '@/types'

const inp = 'w-full bg-[#0a0a0a] border border-white/10 rounded-lg px-4 py-2 text-sm text-white placeholder-slate-600 focus:outline-none focus:ring-1 focus:ring-[#13ec80]'
const lbl = 'block text-xs font-bold text-slate-500 uppercase mb-1'

export function BatchesTab() {
  const { batches, addBatch, updateBatch, deleteBatch } = useBatches()
  const { courses } = useCourses()
  const { branches } = useBranches()

  // Dual-view state
  const [view, setView] = useState<'list' | 'detail'>('list')
  const [selectedBatch, setSelectedBatch] = useState<Batch | null>(null)

  // Batch student hook — only active when a batch is selected
  const { students, addBatchStudent, bulkAddBatchStudents, removeBatchStudent, updateBatchStudent } = useBatchStudents(
    view === 'detail' ? selectedBatch?.id : undefined
  )

  // Create batch modal
  const [isCreateOpen, setIsCreateOpen] = useState(false)
  const [createSubmitted, setCreateSubmitted] = useState(false)

  // Add student modal
  const [isAddStudentOpen, setIsAddStudentOpen] = useState(false)
  const [studentSubmitted, setStudentSubmitted] = useState(false)

  // Edit batch modal
  const [isEditBatchOpen, setIsEditBatchOpen] = useState(false)
  const [editBatchSubmitted, setEditBatchSubmitted] = useState(false)

  // Edit student modal
  const [editingStudent, setEditingStudent] = useState<{ id: string; full_name?: string; phone?: string; parent_phone?: string } | null>(null)
  const [editStudentSubmitted, setEditStudentSubmitted] = useState(false)

  // Import
  const [importSummary, setImportSummary] = useState<{ success: number; skipped: number } | null>(null)
  const importRef = useRef<HTMLInputElement>(null)

  // ── Handlers ──────────────────────────────────────────────────────────────

  const handleCreateBatch = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    const fd = new FormData(e.currentTarget)
    const durationRaw = fd.get('duration') as string
    try {
      await addBatch({
        name: fd.get('name') as string,
        branch_id: fd.get('branch_id') as string,
        course_id: (fd.get('course_id') as string) || undefined,
        description: (fd.get('description') as string) || undefined,
        duration: durationRaw || undefined,
        is_active: true,
      })
      setCreateSubmitted(true)
      setTimeout(() => { setCreateSubmitted(false); setIsCreateOpen(false) }, 1500)
    } catch (err: unknown) {
      alert(err && typeof err === 'object' && 'message' in err ? (err as { message: string }).message : 'Failed to create batch')
    }
  }

  const handleAddStudent = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    const fd = new FormData(e.currentTarget)
    try {
      await addBatchStudent({
        email: (fd.get('email') as string).trim().toLowerCase(),
        full_name: (fd.get('full_name') as string) || undefined,
        phone: (fd.get('phone') as string) || undefined,
        parent_phone: (fd.get('parent_phone') as string) || undefined,
        branch_id: selectedBatch?.branch_id,
      })
      setStudentSubmitted(true)
      setTimeout(() => { setStudentSubmitted(false); setIsAddStudentOpen(false) }, 1500)
    } catch (err: unknown) {
      alert(err && typeof err === 'object' && 'message' in err ? (err as { message: string }).message : 'Failed to add student')
    }
  }

  const downloadTemplate = () => {
    const ws = XLSX.utils.aoa_to_sheet([
      ['email', 'full_name', 'phone', 'parent_phone'],
      ['student1@gmail.com', 'Riya Patel', '+91 98765 43210', '+91 98765 43211'],
      ['student2@gmail.com', 'Arjun Mehta', '+91 87654 32100', '+91 87654 32101'],
    ])
    const wb = XLSX.utils.book_new()
    XLSX.utils.book_append_sheet(wb, ws, 'Students')
    XLSX.writeFile(wb, 'batch_students_template.xlsx')
  }

  const handleImport = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file || !selectedBatch) return
    try {
      const buf = await file.arrayBuffer()
      const wb = XLSX.read(buf)
      const rows = XLSX.utils.sheet_to_json<{
        email?: string; full_name?: string; phone?: string; parent_phone?: string
      }>(wb.Sheets[wb.SheetNames[0]])
      const entries = rows
        .filter(r => r.email?.toString().trim())
        .map(r => ({
          email: r.email!.toString().trim().toLowerCase(),
          full_name: r.full_name?.toString().trim() || undefined,
          phone: r.phone?.toString().trim() || undefined,
          parent_phone: r.parent_phone?.toString().trim() || undefined,
          branch_id: selectedBatch.branch_id,
        }))
      if (entries.length === 0) { alert('No valid email rows found.'); return }
      await bulkAddBatchStudents(entries)
      setImportSummary({ success: entries.length, skipped: rows.length - entries.length })
    } catch (err: unknown) {
      alert(err && typeof err === 'object' && 'message' in err ? (err as { message: string }).message : 'Import failed')
    } finally {
      e.target.value = ''
    }
  }

  const handleEditBatch = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    if (!selectedBatch) return
    const fd = new FormData(e.currentTarget)
    try {
      const updated = await updateBatch(selectedBatch.id, {
        name: fd.get('name') as string,
        branch_id: fd.get('branch_id') as string,
        course_id: (fd.get('course_id') as string) || undefined,
        description: (fd.get('description') as string) || undefined,
        duration: (fd.get('duration') as string) || undefined,
      })
      if (updated) setSelectedBatch(updated)
      setEditBatchSubmitted(true)
      setTimeout(() => { setEditBatchSubmitted(false); setIsEditBatchOpen(false) }, 1500)
    } catch (err: unknown) {
      alert(err && typeof err === 'object' && 'message' in err ? (err as { message: string }).message : 'Failed to update batch')
    }
  }

  const handleEditStudent = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    if (!editingStudent) return
    const fd = new FormData(e.currentTarget)
    try {
      await updateBatchStudent(editingStudent.id, {
        full_name: (fd.get('full_name') as string) || undefined,
        phone: (fd.get('phone') as string) || undefined,
        parent_phone: (fd.get('parent_phone') as string) || undefined,
      })
      setEditStudentSubmitted(true)
      setTimeout(() => { setEditStudentSubmitted(false); setEditingStudent(null) }, 1500)
    } catch (err: unknown) {
      alert(err && typeof err === 'object' && 'message' in err ? (err as { message: string }).message : 'Failed to update student')
    }
  }

  const openDetail = (batch: Batch) => {
    setSelectedBatch(batch)
    setView('detail')
  }

  // ── Detail View (student management) ─────────────────────────────────────

  if (view === 'detail' && selectedBatch) {
    const courseName = courses.find(c => c.id === selectedBatch.course_id)?.name ?? '—'

    return (
      <>
        <div className="space-y-6">
          {/* Detail Header */}
          <div className="flex items-center justify-between flex-wrap gap-4">
            <div className="flex items-center gap-3">
              <button
                onClick={() => setView('list')}
                className="p-2 rounded-lg text-slate-400 hover:text-[#13ec80] hover:bg-[#13ec80]/10 transition-all"
                title="Back to Batches"
              >
                <ArrowLeft size={20} />
              </button>
              <div>
                <h2 className="text-xl font-bold">{selectedBatch.name}</h2>
                <p className="text-xs text-slate-500">
                  {courseName}
                  {selectedBatch.duration ? ` · ${selectedBatch.duration}` : ''}
                  {selectedBatch.description ? ` · ${selectedBatch.description}` : ''}
                </p>
              </div>
            </div>
            <div className="flex items-center gap-2 flex-wrap">
              <button
                onClick={() => { setEditBatchSubmitted(false); setIsEditBatchOpen(true) }}
                className="border border-[#2a2a2a] hover:border-[#13ec80]/50 text-slate-400 hover:text-[#13ec80] text-xs font-bold px-3 py-2 rounded-lg transition-all flex items-center gap-2"
              >
                <Pencil size={14} /> Edit Batch
              </button>
              <button
                onClick={downloadTemplate}
                className="border border-[#2a2a2a] hover:border-[#13ec80]/50 text-slate-400 hover:text-[#13ec80] text-xs font-bold px-3 py-2 rounded-lg transition-all flex items-center gap-2"
              >
                <Download size={14} /> Template
              </button>
              <label className="border border-[#2a2a2a] hover:border-[#13ec80]/50 text-slate-400 hover:text-[#13ec80] text-xs font-bold px-3 py-2 rounded-lg transition-all flex items-center gap-2 cursor-pointer">
                <Upload size={14} /> Import Excel
                <input ref={importRef} type="file" accept=".xlsx,.xls,.csv" className="hidden" onChange={handleImport} />
              </label>
              <button
                onClick={() => { setStudentSubmitted(false); setIsAddStudentOpen(true) }}
                className="bg-[#13ec80] hover:bg-[#13ec80]/90 text-black text-xs font-bold px-4 py-2 rounded-lg transition-all flex items-center gap-2"
              >
                <UserPlus size={16} /> Add Student
              </button>
            </div>
          </div>

          {/* Batch Info Cards */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
            {[
              { label: 'Course', val: courseName },
              { label: 'Branch', val: branches.find(b => b.id === selectedBatch.branch_id)?.name ?? '—' },
              { label: 'Duration', val: selectedBatch.duration ?? '—' },
              { label: 'Students', val: students.length.toString() },
            ].map((item, i) => (
              <div key={i} className="bg-[#1b1b1b] border border-[#2a2a2a] rounded-xl p-4">
                <p className="text-xs text-slate-500 uppercase font-bold mb-1">{item.label}</p>
                <p className="font-bold text-sm">{item.val}</p>
              </div>
            ))}
          </div>

          {/* Student List */}
          <section className="bg-[#1b1b1b] border border-[#2a2a2a] rounded-xl shadow-sm overflow-hidden">
            <div className="px-6 py-4 border-b border-[#2a2a2a]">
              <h3 className="text-base font-bold">Enrolled Students</h3>
              <p className="text-xs text-slate-500">Students pre-enrolled in this batch</p>
            </div>
            {students.length === 0 ? (
              <div className="p-12 text-center text-slate-500">
                <Users className="mx-auto mb-4 w-12 h-12 opacity-20" />
                <p className="font-medium mb-1">No students yet</p>
                <p className="text-xs">Add students manually or import via Excel template.</p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="bg-[#0f0f0f]/50 text-xs text-slate-500 uppercase tracking-wider">
                      <th className="px-6 py-3 font-semibold">Full Name</th>
                      <th className="px-6 py-3 font-semibold">Email</th>
                      <th className="px-6 py-3 font-semibold">Phone</th>
                      <th className="px-6 py-3 font-semibold">Parent Phone</th>
                      <th className="px-6 py-3 font-semibold">Added</th>
                      <th className="px-6 py-3 font-semibold text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[#2a2a2a]">
                    {students.map(s => (
                      <tr key={s.id} className="hover:bg-white/5 transition-colors">
                        <td className="px-6 py-4">
                          <div className="flex items-center gap-3">
                            <div className="w-8 h-8 rounded-full bg-[#13ec80]/10 flex items-center justify-center">
                              <span className="text-[#13ec80] font-bold text-sm">
                                {(s.full_name ?? s.email)[0].toUpperCase()}
                              </span>
                            </div>
                            <span className="font-medium">{s.full_name ?? '—'}</span>
                          </div>
                        </td>
                        <td className="px-6 py-4 text-sm text-slate-400">{s.email}</td>
                        <td className="px-6 py-4 text-sm text-slate-400">{s.phone ?? '—'}</td>
                        <td className="px-6 py-4 text-sm text-slate-400">{s.parent_phone ?? '—'}</td>
                        <td className="px-6 py-4 text-xs text-slate-500">
                          {s.created_at ? new Date(s.created_at).toLocaleDateString('en-IN') : '—'}
                        </td>
                        <td className="px-6 py-4 text-right">
                          <div className="flex items-center justify-end gap-1">
                            <button
                              onClick={() => { setEditStudentSubmitted(false); setEditingStudent({ id: s.id, full_name: s.full_name, phone: s.phone, parent_phone: s.parent_phone }) }}
                              className="text-slate-400 hover:text-[#13ec80] p-2 transition-colors"
                              title="Edit student"
                            >
                              <Pencil size={15} />
                            </button>
                            <button
                              onClick={() => { if (confirm(`Remove ${s.email} from this batch?`)) removeBatchStudent(s.id).catch(() => alert('Failed to remove student')) }}
                              className="text-slate-400 hover:text-red-500 p-2 transition-colors"
                              title="Remove from batch"
                            >
                              <Trash2 size={16} />
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </section>
        </div>

        {/* Add Student Modal */}
        <Modal isOpen={isAddStudentOpen} onClose={() => setIsAddStudentOpen(false)} title="Add Student to Batch">
          {studentSubmitted ? (
            <div className="flex flex-col items-center justify-center py-8 text-center">
              <CheckCircle2 className="text-[#13ec80] w-16 h-16 mb-4 animate-bounce" />
              <h4 className="text-xl font-bold mb-2">Student Added!</h4>
              <p className="text-slate-400">The student has been enrolled in this batch.</p>
            </div>
          ) : (
            <form onSubmit={handleAddStudent} className="space-y-4">
              <div>
                <label className={lbl}>Student Gmail <span className="text-red-400">*</span></label>
                <input name="email" required type="email" className={inp} placeholder="student@gmail.com" />
              </div>
              <div>
                <label className={lbl}>Full Name</label>
                <input name="full_name" type="text" className={inp} placeholder="e.g. Riya Patel" />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className={lbl}>Student Phone</label>
                  <input name="phone" type="tel" className={inp} placeholder="+91 98765 43210" />
                </div>
                <div>
                  <label className={lbl}>Parent Phone</label>
                  <input name="parent_phone" type="tel" className={inp} placeholder="+91 98765 43211" />
                </div>
              </div>
              <button type="submit" className="w-full bg-[#13ec80] text-black font-bold py-3 rounded-lg hover:opacity-90 transition-opacity mt-4">
                Add to Batch
              </button>
            </form>
          )}
        </Modal>

        {/* Edit Batch Modal */}
        <Modal isOpen={isEditBatchOpen} onClose={() => setIsEditBatchOpen(false)} title="Edit Batch">
          {editBatchSubmitted ? (
            <div className="flex flex-col items-center justify-center py-8 text-center">
              <CheckCircle2 className="text-[#13ec80] w-16 h-16 mb-4 animate-bounce" />
              <h4 className="text-xl font-bold mb-2">Batch Updated!</h4>
              <p className="text-slate-400">Batch details have been saved.</p>
            </div>
          ) : (
            <form onSubmit={handleEditBatch} className="space-y-4">
              <div>
                <label className={lbl}>Batch Name <span className="text-red-400">*</span></label>
                <input name="name" required type="text" className={inp} defaultValue={selectedBatch?.name} />
              </div>
              <div>
                <label className={lbl}>Branch <span className="text-red-400">*</span></label>
                <select name="branch_id" required className={inp} defaultValue={selectedBatch?.branch_id}>
                  <option value="">— Select Branch —</option>
                  {branches.map(b => <option key={b.id} value={b.id}>{b.name}</option>)}
                </select>
              </div>
              <div>
                <label className={lbl}>Course (optional)</label>
                <select name="course_id" className={inp} defaultValue={selectedBatch?.course_id ?? ''}>
                  <option value="">— Select Course —</option>
                  {courses.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                </select>
              </div>
              <div>
                <label className={lbl}>Description (optional)</label>
                <textarea name="description" rows={2} className={inp} defaultValue={selectedBatch?.description ?? ''} />
              </div>
              <div>
                <label className={lbl}>Duration (e.g. 2026-2027)</label>
                <input name="duration" type="text" className={inp} defaultValue={selectedBatch?.duration ?? ''} placeholder="e.g. 2026-2027" />
              </div>
              <button type="submit" className="w-full bg-[#13ec80] text-black font-bold py-3 rounded-lg hover:opacity-90 transition-opacity mt-4">
                Save Changes
              </button>
            </form>
          )}
        </Modal>

        {/* Edit Student Modal */}
        <Modal isOpen={!!editingStudent} onClose={() => setEditingStudent(null)} title="Edit Student">
          {editStudentSubmitted ? (
            <div className="flex flex-col items-center justify-center py-8 text-center">
              <CheckCircle2 className="text-[#13ec80] w-16 h-16 mb-4 animate-bounce" />
              <h4 className="text-xl font-bold mb-2">Student Updated!</h4>
              <p className="text-slate-400">Student details have been saved.</p>
            </div>
          ) : (
            <form onSubmit={handleEditStudent} className="space-y-4">
              <div>
                <label className={lbl}>Full Name</label>
                <input name="full_name" type="text" className={inp} defaultValue={editingStudent?.full_name ?? ''} placeholder="e.g. Riya Patel" />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className={lbl}>Student Phone</label>
                  <input name="phone" type="tel" className={inp} defaultValue={editingStudent?.phone ?? ''} placeholder="+91 98765 43210" />
                </div>
                <div>
                  <label className={lbl}>Parent Phone</label>
                  <input name="parent_phone" type="tel" className={inp} defaultValue={editingStudent?.parent_phone ?? ''} placeholder="+91 98765 43211" />
                </div>
              </div>
              <button type="submit" className="w-full bg-[#13ec80] text-black font-bold py-3 rounded-lg hover:opacity-90 transition-opacity mt-4">
                Save Changes
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
              <p className="text-slate-400">{importSummary.success} student(s) added to the batch.</p>
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

  // ── List View ─────────────────────────────────────────────────────────────

  return (
    <>
      <section className="bg-[#1b1b1b] border border-[#2a2a2a] rounded-xl shadow-sm overflow-hidden">
        <div className="px-6 py-4 border-b border-[#2a2a2a] flex items-center justify-between">
          <div>
            <h2 className="text-lg font-bold">Batches</h2>
            <p className="text-xs text-slate-500">Create and manage class batches across branches</p>
          </div>
          <button
            onClick={() => { setCreateSubmitted(false); setIsCreateOpen(true) }}
            className="bg-[#13ec80] hover:bg-[#13ec80]/90 text-black text-xs font-bold px-4 py-2 rounded-lg transition-all flex items-center gap-2"
          >
            <Plus size={16} /> Create Batch
          </button>
        </div>

        {batches.length === 0 ? (
          <div className="p-12 text-center text-slate-500">
            <BookOpen className="mx-auto mb-4 w-12 h-12 opacity-20" />
            <p className="font-medium mb-1">No batches yet</p>
            <p className="text-xs">Create the first batch to start assigning students.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-[#0f0f0f]/50 text-xs text-slate-500 uppercase tracking-wider">
                  <th className="px-6 py-3 font-semibold">Batch Name</th>
                  <th className="px-6 py-3 font-semibold">Course</th>
                  <th className="px-6 py-3 font-semibold">Branch</th>
                  <th className="px-6 py-3 font-semibold">Duration</th>
                  <th className="px-6 py-3 font-semibold">Description</th>
                  <th className="px-6 py-3 font-semibold text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#2a2a2a]">
                {batches.map(batch => (
                  <tr key={batch.id} className="hover:bg-white/5 transition-colors">
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-lg flex items-center justify-center font-bold bg-[#13ec80]/10 text-[#13ec80]">
                          {batch.name[0]}
                        </div>
                        <p className="font-medium">{batch.name}</p>
                      </div>
                    </td>
                    <td className="px-6 py-4 text-sm text-slate-400">{batch.courses?.name ?? '—'}</td>
                    <td className="px-6 py-4 text-sm text-slate-400">
                      {branches.find(b => b.id === batch.branch_id)?.name ?? '—'}
                    </td>
                    <td className="px-6 py-4 text-sm text-slate-400">
                      {batch.duration ?? '—'}
                    </td>
                    <td className="px-6 py-4 text-sm text-slate-500 max-w-[180px] truncate">
                      {batch.description ?? '—'}
                    </td>
                    <td className="px-6 py-4 text-right">
                      <div className="flex items-center justify-end gap-2">
                        <button
                          onClick={() => openDetail(batch)}
                          className="text-xs font-bold px-3 py-1.5 bg-[#13ec80]/10 text-[#13ec80] rounded-lg hover:bg-[#13ec80]/20 transition-colors flex items-center gap-1"
                        >
                          <Users size={13} /> Manage Students
                        </button>
                        <button
                          onClick={() => { if (confirm(`Delete "${batch.name}"?`)) deleteBatch(batch.id).catch(() => alert('Failed to delete batch')) }}
                          className="text-slate-400 hover:text-red-500 p-2 transition-colors"
                        >
                          <Trash2 size={16} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>

      {/* Create Batch Modal */}
      <Modal isOpen={isCreateOpen} onClose={() => setIsCreateOpen(false)} title="Create New Batch">
        {createSubmitted ? (
          <div className="flex flex-col items-center justify-center py-8 text-center">
            <CheckCircle2 className="text-[#13ec80] w-16 h-16 mb-4 animate-bounce" />
            <h4 className="text-xl font-bold mb-2">Batch Created!</h4>
            <p className="text-slate-400">The batch is ready for student enrollment.</p>
          </div>
        ) : (
          <form onSubmit={handleCreateBatch} className="space-y-4">
            <div>
              <label className={lbl}>Batch Name <span className="text-red-400">*</span></label>
              <input name="name" required type="text" className={inp} placeholder="e.g. Morning Batch 2025" />
            </div>
            <div>
              <label className={lbl}>Branch <span className="text-red-400">*</span></label>
              <select name="branch_id" required className={inp}>
                <option value="">— Select Branch —</option>
                {branches.map(b => <option key={b.id} value={b.id}>{b.name}</option>)}
              </select>
            </div>
            <div>
              <label className={lbl}>Course (optional)</label>
              <select name="course_id" className={inp}>
                <option value="">— Select Course —</option>
                {courses.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
              </select>
            </div>
            <div>
              <label className={lbl}>Description (optional)</label>
              <textarea name="description" rows={2} className={inp} placeholder="Brief batch description..." />
            </div>
            <div>
              <label className={lbl}>Duration (e.g. 2026-2027)</label>
              <input name="duration" type="text" className={inp} placeholder="e.g. 2026-2027" />
            </div>
            <button type="submit" className="w-full bg-[#13ec80] text-black font-bold py-3 rounded-lg hover:opacity-90 transition-opacity mt-4">
              Create Batch
            </button>
          </form>
        )}
      </Modal>
    </>
  )
}
