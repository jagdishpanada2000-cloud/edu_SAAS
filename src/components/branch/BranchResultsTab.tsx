'use client'

import React, { useRef } from 'react'
import * as XLSX from 'xlsx'
import {
  Download, Upload, CheckCircle2, ClipboardCheck, Trash2,
  Eye, EyeOff, Plus, ChevronDown, Mail, MessageSquare, Send, Bot, X
} from 'lucide-react'
import { Modal } from '@/components/Modal'
import { useBatches } from '@/hooks/useBatches'
import { useCourses } from '@/hooks/useCourses'
import { useBatchStudents } from '@/hooks/useBatchStudents'
import { useBatchTestResults } from '@/hooks/useBatchTestResults'
import type { BatchTestResult } from '@/types'

interface Props { branchId: string }

const inp = 'w-full bg-[#0a0a0a] border border-white/10 rounded-lg px-4 py-2 text-sm text-white placeholder-slate-600 focus:outline-none focus:ring-1 focus:ring-[#22c55e]'
const lbl = 'block text-xs font-bold text-slate-500 uppercase mb-1'

// Group published results by batch+date+topic
interface TestGroup {
  batchId: string
  batchName: string
  courseName: string
  testDate: string
  topic: string
  rows: BatchTestResult[]
  published: boolean
}

export function BranchResultsTab({ branchId }: Props) {
  const { batches } = useBatches(branchId)
  const { courses } = useCourses()
  const { results, loading, submitResults, publishResults, deleteTest } = useBatchTestResults(branchId)

  // Wizard state
  const [step, setStep] = React.useState<'select' | 'sheet'>('select')
  const [selCourseId, setSelCourseId] = React.useState('')
  const [selBatchId, setSelBatchId] = React.useState('')
  const [selDate, setSelDate] = React.useState('')
  const [selTopic, setSelTopic] = React.useState('')

  // Students for selected batch (to prefill template)
  const { students: batchStudents } = useBatchStudents(selBatchId || undefined)

  // Sheet rows state: [{ email, name, marks }]
  const [sheetRows, setSheetRows] = React.useState<{ email: string; name: string; marks: string }[]>([])
  const [totalMarks, setTotalMarks] = React.useState('100')
  const importRef = useRef<HTMLInputElement>(null)

  // Publish modal
  const [isPublishing, setIsPublishing] = React.useState(false)
  const [publishedOk, setPublishedOk] = React.useState(false)

  // Filter batches by selected course
  const filteredBatches = selCourseId ? batches.filter(b => b.course_id === selCourseId) : batches

  // ── Prefill sheet from batch students ─────────────────────────────────────

  const handleProceedToSheet = () => {
    if (!selBatchId || !selDate || !selTopic.trim()) {
      alert('Please select Course, Batch, Test Date and Topic.')
      return
    }
    const rows = batchStudents.map(s => ({
      email: s.email,
      name: s.full_name ?? '',
      marks: '',
    }))
    setSheetRows(rows.length > 0 ? rows : [{ email: '', name: '', marks: '' }])
    setStep('sheet')
  }

  // ── Download template with students prefilled ─────────────────────────────

  const downloadTemplate = () => {
    const batchName = batches.find(b => b.id === selBatchId)?.name ?? 'batch'
    const header = ['email', 'student_name', `marks_obtained (out of ${totalMarks})`]
    const dataRows = batchStudents.map(s => [s.email, s.full_name ?? '', ''])
    const ws = XLSX.utils.aoa_to_sheet([header, ...dataRows])
    const wb = XLSX.utils.book_new()
    XLSX.utils.book_append_sheet(wb, ws, 'Results')
    XLSX.writeFile(wb, `results_${batchName}_${selDate}_${selTopic}.xlsx`)
  }

  // ── Import filled template ────────────────────────────────────────────────

  const handleImport = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    try {
      const buf = await file.arrayBuffer()
      const wb = XLSX.read(buf)
      const rows = XLSX.utils.sheet_to_json<Record<string, string>>(wb.Sheets[wb.SheetNames[0]])
      const parsed = rows
        .filter(r => r['email']?.toString().trim())
        .map(r => {
          const marksKey = Object.keys(r).find(k => k.toLowerCase().includes('marks')) ?? ''
          return {
            email: r['email'].toString().trim().toLowerCase(),
            name: (r['student_name'] ?? '').toString().trim(),
            marks: (r[marksKey] ?? '').toString().trim(),
          }
        })
      setSheetRows(parsed)
    } catch (err: unknown) {
      alert(err && typeof err === 'object' && 'message' in err ? (err as { message: string }).message : 'Failed to read file')
    } finally {
      e.target.value = ''
    }
  }

  // ── Submit (save without publishing) ─────────────────────────────────────

  const handleSubmit = async () => {
    const rows = sheetRows.filter(r => r.email.trim())
    if (rows.length === 0) { alert('No student rows to submit.'); return }
    try {
      const payload = rows.map(r => ({
        branch_id: branchId,
        batch_id: selBatchId,
        course_id: selCourseId || null,
        test_date: selDate,
        topic: selTopic.trim(),
        student_email: r.email,
        student_name: r.name || null,
        marks_obtained: r.marks !== '' ? parseFloat(r.marks) : null,
        total_marks: parseFloat(totalMarks) || 100,
        published_at: null,
      }))
      await submitResults(payload as Parameters<typeof submitResults>[0])
      alert('Results saved! You can publish them when ready.')
      setStep('select')
      resetForm()
    } catch (err: unknown) {
      alert(err && typeof err === 'object' && 'message' in err ? (err as { message: string }).message : 'Failed to save results')
    }
  }

  // ── Publish ───────────────────────────────────────────────────────────────

  const handlePublish = async (batchId: string, testDate: string, topic: string) => {
    setIsPublishing(true)
    try {
      await publishResults(batchId, testDate, topic)
      setPublishedOk(true)
      setTimeout(() => setPublishedOk(false), 2000)
    } catch (err: unknown) {
      alert(err && typeof err === 'object' && 'message' in err ? (err as { message: string }).message : 'Failed to publish')
    } finally {
      setIsPublishing(false)
    }
  }

  const resetForm = () => {
    setSelCourseId('')
    setSelBatchId('')
    setSelDate('')
    setSelTopic('')
    setSheetRows([])
    setTotalMarks('100')
  }

  // ── Group results ─────────────────────────────────────────────────────────

  const testGroups: TestGroup[] = React.useMemo(() => {
    const map = new Map<string, TestGroup>()
    for (const r of results) {
      const key = `${r.batch_id}||${r.test_date}||${r.topic}`
      if (!map.has(key)) {
        map.set(key, {
          batchId: r.batch_id,
          batchName: (r.batches as { name?: string })?.name ?? '—',
          courseName: (r.courses as { name?: string })?.name ?? '—',
          testDate: r.test_date,
          topic: r.topic,
          rows: [],
          published: false,
        })
      }
      const g = map.get(key)!
      g.rows.push(r)
      if (r.published_at) g.published = true
    }
    return Array.from(map.values()).sort((a, b) => b.testDate.localeCompare(a.testDate))
  }, [results])

  // ── Render ────────────────────────────────────────────────────────────────

  return (
    <div className="space-y-6">
      {/* New Test Button */}
      {step === 'select' && (
        <div className="flex justify-end">
          <button
            onClick={() => setStep('select')}
            className="flex items-center gap-2 px-4 py-2 bg-[#22c55e] hover:bg-[#22c55e]/90 text-black text-sm font-bold rounded-lg transition-colors"
          >
            <Plus size={18} /> New Test Results
          </button>
        </div>
      )}

      {/* ── Step 1: Select details ── */}
      {step === 'select' && (
        <section className="bg-[#1b1b1b] rounded-xl border border-[#2d2d2d] p-6 space-y-5">
          <div>
            <h2 className="text-lg font-bold">Enter Test Details</h2>
            <p className="text-xs text-slate-400 mt-1">Select the course, batch, date and topic before generating the results sheet.</p>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className={lbl}>Course <span className="text-red-400">*</span></label>
              <div className="relative">
                <select value={selCourseId} onChange={e => { setSelCourseId(e.target.value); setSelBatchId('') }} className={inp + ' appearance-none pr-8'}>
                  <option value="">— Select Course —</option>
                  {courses.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                </select>
                <ChevronDown size={14} className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
              </div>
            </div>
            <div>
              <label className={lbl}>Batch <span className="text-red-400">*</span></label>
              <div className="relative">
                <select value={selBatchId} onChange={e => setSelBatchId(e.target.value)} className={inp + ' appearance-none pr-8'}>
                  <option value="">— Select Batch —</option>
                  {filteredBatches.map(b => <option key={b.id} value={b.id}>{b.name}</option>)}
                </select>
                <ChevronDown size={14} className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
              </div>
            </div>
            <div>
              <label className={lbl}>Test Date <span className="text-red-400">*</span></label>
              <input type="date" value={selDate} onChange={e => setSelDate(e.target.value)} className={inp + ' [color-scheme:dark]'} />
            </div>
            <div>
              <label className={lbl}>Topic / Exam Name <span className="text-red-400">*</span></label>
              <input type="text" value={selTopic} onChange={e => setSelTopic(e.target.value)} className={inp} placeholder="e.g. Unit Test 1 – Algebra" />
            </div>
            <div>
              <label className={lbl}>Total Marks</label>
              <input type="number" value={totalMarks} onChange={e => setTotalMarks(e.target.value)} className={inp} placeholder="100" min="1" />
            </div>
          </div>
          <div className="flex flex-wrap gap-3 pt-2">
            <button
              onClick={handleProceedToSheet}
              className="flex items-center gap-2 px-5 py-2.5 bg-[#22c55e] hover:bg-[#22c55e]/90 text-black text-sm font-bold rounded-lg transition-colors"
            >
              Generate Sheet
            </button>
            {selBatchId && selDate && selTopic && (
              <button
                onClick={downloadTemplate}
                className="flex items-center gap-2 px-4 py-2.5 border border-[#2d2d2d] hover:border-[#22c55e]/50 text-slate-400 hover:text-[#22c55e] text-sm font-bold rounded-lg transition-all"
              >
                <Download size={16} /> Download Template
              </button>
            )}
          </div>
        </section>
      )}

      {/* ── Step 2: Edit sheet + upload ── */}
      {step === 'sheet' && (
        <section className="bg-[#1b1b1b] rounded-xl border border-[#2d2d2d] overflow-hidden">
          <div className="p-5 border-b border-[#2d2d2d] flex flex-wrap items-center justify-between gap-3">
            <div>
              <h2 className="text-base font-bold">
                {batches.find(b => b.id === selBatchId)?.name} — {selTopic}
              </h2>
              <p className="text-xs text-slate-400">{selDate} · Total marks: {totalMarks}</p>
            </div>
            <div className="flex items-center gap-2">
              <button onClick={downloadTemplate}
                className="flex items-center gap-2 px-3 py-2 border border-[#2d2d2d] hover:border-[#22c55e]/50 text-slate-400 hover:text-[#22c55e] text-xs font-bold rounded-lg transition-all">
                <Download size={14} /> Download Template
              </button>
              <label className="flex items-center gap-2 px-3 py-2 border border-[#2d2d2d] hover:border-[#22c55e]/50 text-slate-400 hover:text-[#22c55e] text-xs font-bold rounded-lg transition-all cursor-pointer">
                <Upload size={14} /> Import Filled Excel
                <input ref={importRef} type="file" accept=".xlsx,.xls,.csv" className="hidden" onChange={handleImport} />
              </label>
            </div>
          </div>

          {/* Editable grid */}
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-sm">
              <thead>
                <tr className="bg-white/5 text-xs text-slate-500 uppercase tracking-wider">
                  <th className="px-4 py-3 font-semibold">#</th>
                  <th className="px-4 py-3 font-semibold">Email</th>
                  <th className="px-4 py-3 font-semibold">Name</th>
                  <th className="px-4 py-3 font-semibold text-center">Marks / {totalMarks}</th>
                  <th className="px-4 py-3 font-semibold text-right">Remove</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#2d2d2d]">
                {sheetRows.map((row, i) => (
                  <tr key={i} className="hover:bg-white/5">
                    <td className="px-4 py-2 text-slate-600 text-xs">{i + 1}</td>
                    <td className="px-4 py-2">
                      <input
                        value={row.email}
                        onChange={e => setSheetRows(prev => prev.map((r, j) => j === i ? { ...r, email: e.target.value } : r))}
                        className="w-full bg-transparent border-b border-white/10 focus:border-[#22c55e] outline-none py-1 text-sm"
                        placeholder="student@gmail.com"
                      />
                    </td>
                    <td className="px-4 py-2">
                      <input
                        value={row.name}
                        onChange={e => setSheetRows(prev => prev.map((r, j) => j === i ? { ...r, name: e.target.value } : r))}
                        className="w-full bg-transparent border-b border-white/10 focus:border-[#22c55e] outline-none py-1 text-sm"
                        placeholder="Full name"
                      />
                    </td>
                    <td className="px-4 py-2 text-center">
                      <input
                        type="number"
                        value={row.marks}
                        min="0"
                        max={totalMarks}
                        onChange={e => setSheetRows(prev => prev.map((r, j) => j === i ? { ...r, marks: e.target.value } : r))}
                        className="w-20 bg-transparent border-b border-white/10 focus:border-[#22c55e] outline-none py-1 text-sm text-center mx-auto block"
                        placeholder="0"
                      />
                    </td>
                    <td className="px-4 py-2 text-right">
                      <button onClick={() => setSheetRows(prev => prev.filter((_, j) => j !== i))} className="text-slate-600 hover:text-red-500 transition-colors">
                        <Trash2 size={15} />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <div className="p-4 border-t border-[#2d2d2d] flex flex-wrap gap-3 items-center justify-between">
            <button
              onClick={() => setSheetRows(prev => [...prev, { email: '', name: '', marks: '' }])}
              className="text-xs text-slate-400 hover:text-[#22c55e] flex items-center gap-1 transition-colors"
            >
              <Plus size={14} /> Add Row
            </button>
            <div className="flex gap-3">
              <button onClick={() => { setStep('select'); resetForm() }}
                className="px-4 py-2 border border-[#2d2d2d] text-slate-400 hover:text-white text-sm font-bold rounded-lg transition-colors">
                Cancel
              </button>
              <button onClick={handleSubmit}
                className="px-5 py-2 bg-[#22c55e] hover:bg-[#22c55e]/90 text-black text-sm font-bold rounded-lg transition-colors flex items-center gap-2">
                <CheckCircle2 size={16} /> Save Results
              </button>
            </div>
          </div>
        </section>
      )}

      {/* ── Published / Saved Tests List ── */}
      <section className="bg-[#1b1b1b] rounded-xl border border-[#2d2d2d] overflow-hidden">
        <div className="px-6 py-4 border-b border-[#2d2d2d]">
          <h3 className="text-base font-bold">Saved Tests</h3>
          <p className="text-xs text-slate-400 mt-0.5">Publish a test to make it visible to students in their portal.</p>
        </div>
        {loading ? (
          <div className="p-8 text-center text-slate-500">Loading…</div>
        ) : testGroups.length === 0 ? (
          <div className="p-12 text-center text-slate-500">
            <ClipboardCheck className="mx-auto mb-4 w-12 h-12 opacity-20" />
            <p className="font-medium">No test results saved yet</p>
            <p className="text-xs mt-1">Use the form above to add results for a batch.</p>
          </div>
        ) : (
          <div className="divide-y divide-[#2d2d2d]">
            {testGroups.map((g, i) => (
              <TestGroupRow
                key={i}
                group={g}
                branchId={branchId}
                onPublish={() => handlePublish(g.batchId, g.testDate, g.topic)}
                onDelete={() => { if (confirm(`Delete all results for "${g.topic}" on ${g.testDate}?`)) deleteTest(g.batchId, g.testDate, g.topic).catch(() => alert('Delete failed')) }}
              />
            ))}
          </div>
        )}
      </section>

      {/* Publish success toast */}
      {publishedOk && (
        <div className="fixed bottom-6 right-6 bg-[#22c55e] text-black font-bold px-5 py-3 rounded-xl shadow-xl flex items-center gap-2 z-50">
          <CheckCircle2 size={18} /> Results published!
        </div>
      )}

      {/* Publishing overlay */}
      {isPublishing && (
        <Modal isOpen onClose={() => {}} title="Publishing…">
          <div className="flex flex-col items-center justify-center py-10">
            <div className="w-10 h-10 border-4 border-[#22c55e] border-t-transparent rounded-full animate-spin mb-4" />
            <p className="text-slate-400">Publishing results to student portals…</p>
          </div>
        </Modal>
      )}
    </div>
  )
}

// ── Test Group Row ─────────────────────────────────────────────────────────

function TestGroupRow({ group, onPublish, onDelete, branchId }: { group: TestGroup; onPublish: () => void; onDelete: () => void; branchId: string }) {
  const [expanded, setExpanded] = React.useState(false)
  const [sendingEmail, setSendingEmail] = React.useState(false)
  
  // AI Chat state
  const [isAiOpen, setIsAiOpen] = React.useState(false)
  const [aiMessage, setAiMessage] = React.useState('')
  const [chat, setChat] = React.useState<{ role: 'user' | 'ai'; content: string }[]>([])
  const [isTyping, setIsTyping] = React.useState(false)
  const chatEndRef = React.useRef<HTMLDivElement>(null)

  const scrollToBottom = () => chatEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  React.useEffect(() => { if (isAiOpen) scrollToBottom() }, [chat, isAiOpen])

  const handleAiChat = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!aiMessage.trim() || isTyping) return
    const msg = aiMessage.trim()
    setAiMessage('')
    setChat(prev => [...prev, { role: 'user', content: msg }])
    setIsTyping(true)

    try {
      const res = await fetch('/api/results/ai-analyze', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ message: msg, branchId, testResults: group.rows })
      })
      const data = await res.json()
      if (data.error) throw new Error(data.error)
      
      setChat(prev => [...prev, { role: 'ai', content: data.reply }])

      // Check for export data
      const exportMatch = data.reply.match(/```json_export_data\n([\s\S]*?)\n```/)
      if (exportMatch) {
        try {
          const exportData = JSON.parse(exportMatch[1])
          const ws = XLSX.utils.json_to_sheet(exportData)
          const wb = XLSX.utils.book_new()
          XLSX.utils.book_append_sheet(wb, ws, 'AI_Export')
          XLSX.writeFile(wb, `AI_Analysis_${group.topic}.xlsx`)
        } catch (e) { console.error('Export fail', e) }
      }
    } catch (err: any) {
      setChat(prev => [...prev, { role: 'ai', content: 'Sorry, I encountered an error: ' + err.message }])
    } finally {
      setIsTyping(false)
    }
  }

  const handleEmailResults = async () => {
    if (!confirm('Email result notifications to all students?')) return
    setSendingEmail(true)
    try {
      const res = await fetch('/api/results/email-all', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          branchId,
          testResults: group.rows
        })
      })
      const data = await res.json()
      if (data.error) throw new Error(data.error)
      alert(`Emails sent! Success: ${data.successCount}, Failed: ${data.failCount}`)
    } catch (err: any) {
      alert(err.message || 'Failed to send emails')
    } finally {
      setSendingEmail(false)
    }
  }

  const avg = group.rows.filter(r => r.marks_obtained != null).length
    ? Math.round(group.rows.filter(r => r.marks_obtained != null).reduce((s, r) => s + (r.marks_obtained! / r.total_marks) * 100, 0) / group.rows.filter(r => r.marks_obtained != null).length)
    : null

  return (
    <div>
      <div className="px-6 py-4 flex flex-wrap items-center justify-between gap-3 hover:bg-white/5 transition-colors">
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <span className="font-semibold truncate">{group.topic}</span>
            {group.published ? (
              <span className="text-xs bg-[#22c55e]/10 text-[#22c55e] px-2 py-0.5 rounded-full font-bold">Published</span>
            ) : (
              <span className="text-xs bg-yellow-500/10 text-yellow-400 px-2 py-0.5 rounded-full font-bold">Draft</span>
            )}
          </div>
          <p className="text-xs text-slate-500 mt-0.5">
            {group.batchName} · {group.courseName} · {new Date(group.testDate).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })} · {group.rows.length} students{avg !== null ? ` · Avg ${avg}%` : ''}
          </p>
        </div>
        <div className="flex items-center gap-2">
          {group.published && (
            <>
              <button
                onClick={() => setIsAiOpen(true)}
                className="text-xs border border-[#2d2d2d] hover:border-[#22c55e]/50 text-slate-400 hover:text-[#22c55e] font-bold px-3 py-1.5 rounded-lg transition-colors flex items-center gap-1"
                title="AI Analysis"
              >
                <Bot size={13} />
                AI Analyze
              </button>
              <button
                onClick={handleEmailResults}
              disabled={sendingEmail}
              className="text-xs border border-[#2d2d2d] hover:border-blue-500/50 text-slate-400 hover:text-blue-400 font-bold px-3 py-1.5 rounded-lg transition-colors flex items-center gap-1 disabled:opacity-50"
              title="Email all students their marks"
            >
              {sendingEmail ? (
                <div className="w-3 h-3 border-2 border-blue-400 border-t-transparent rounded-full animate-spin" />
              ) : (
                <Mail size={13} />
              )}
              {sendingEmail ? 'Sending...' : 'Email All'}
            </button>
            </>
          )}
          <button onClick={() => setExpanded(v => !v)}
            className="text-xs text-slate-400 hover:text-white px-3 py-1.5 border border-[#2d2d2d] rounded-lg flex items-center gap-1 transition-colors">
            {expanded ? <EyeOff size={13} /> : <Eye size={13} />} {expanded ? 'Hide' : 'View'}
          </button>
          {!group.published && (
            <button onClick={onPublish}
              className="text-xs bg-[#22c55e] hover:bg-[#22c55e]/90 text-black font-bold px-3 py-1.5 rounded-lg transition-colors flex items-center gap-1">
              <Eye size={13} /> Publish
            </button>
          )}
          <button onClick={onDelete} className="text-slate-500 hover:text-red-500 p-1.5 transition-colors" title="Delete test">
            <Trash2 size={15} />
          </button>
        </div>
      </div>

      {expanded && (
        <div className="px-6 pb-4">
          <div className="rounded-lg border border-[#2d2d2d] overflow-hidden">
            <table className="w-full text-left border-collapse text-sm">
              <thead>
                <tr className="bg-white/5 text-xs text-slate-500 uppercase">
                  <th className="px-4 py-2">Student</th>
                  <th className="px-4 py-2">Email</th>
                  <th className="px-4 py-2 text-center">Marks</th>
                  <th className="px-4 py-2 text-center">%</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#2d2d2d]">
                {group.rows.map(r => {
                  const pct = r.marks_obtained != null ? Math.round((r.marks_obtained / r.total_marks) * 100) : null
                  return (
                    <tr key={r.id} className="hover:bg-white/5">
                      <td className="px-4 py-2 font-medium">{r.student_name ?? '—'}</td>
                      <td className="px-4 py-2 text-slate-400">{r.student_email}</td>
                      <td className="px-4 py-2 text-center text-slate-300">{r.marks_obtained != null ? `${r.marks_obtained}/${r.total_marks}` : '—'}</td>
                      <td className="px-4 py-2 text-center">
                        {pct != null ? (
                          <span className={`font-bold ${pct >= 75 ? 'text-[#22c55e]' : pct >= 50 ? 'text-yellow-400' : 'text-red-400'}`}>{pct}%</span>
                        ) : '—'}
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* AI Analysis Modal */}
      <Modal isOpen={isAiOpen} onClose={() => setIsAiOpen(false)} title={`AI Analysis: ${group.topic}`}>
        <div className="flex flex-col h-[500px]">
          <div className="flex-1 overflow-y-auto space-y-4 p-4 scrollbar-thin scrollbar-thumb-white/10">
            <div className="bg-[#22c55e]/10 border border-[#22c55e]/20 p-3 rounded-lg flex gap-3">
              <Bot className="text-[#22c55e] shrink-0" size={20} />
              <div className="text-sm text-slate-300">
                Hi! I have analyzed the results for **{group.topic}**.
                <br /><br />
                Ask me to:
                <ul className="list-disc list-inside mt-2 space-y-1">
                  <li>Find the average score & toppers</li>
                  <li>Export a list of high scorers to Excel</li>
                  <li>Export a list of low scorers for remedial classes</li>
                </ul>
              </div>
            </div>
            {chat.map((m, i) => (
              <div key={i} className={`flex ${m.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                <div className={`max-w-[85%] p-3 rounded-xl text-sm ${
                  m.role === 'user' 
                    ? 'bg-[#22c55e] text-black font-medium' 
                    : 'bg-white/5 border border-white/10 text-slate-200'
                }`}>
                  {m.content.replace(/```json_export_data\n([\s\S]*?)\n```/g, '*(Excel file generated and downloaded)*')}
                </div>
              </div>
            ))}
            {isTyping && (
              <div className="flex justify-start">
                <div className="bg-white/5 border border-white/10 p-3 rounded-xl flex gap-1 animate-pulse">
                  <div className="w-1.5 h-1.5 bg-slate-500 rounded-full" />
                  <div className="w-1.5 h-1.5 bg-slate-500 rounded-full" />
                  <div className="w-1.5 h-1.5 bg-slate-500 rounded-full" />
                </div>
              </div>
            )}
            <div ref={chatEndRef} />
          </div>
          <form onSubmit={handleAiChat} className="p-4 border-t border-white/5 flex gap-2">
            <input
              value={aiMessage}
              onChange={e => setAiMessage(e.target.value)}
              placeholder="Ask AI about results..."
              className="flex-1 bg-[#0a0a0a] border border-white/10 rounded-lg px-4 py-2 text-sm text-white focus:outline-none focus:ring-1 focus:ring-[#22c55e]"
            />
            <button
              disabled={isTyping}
              className="bg-[#22c55e] text-black p-2 rounded-lg hover:bg-[#22c55e]/90 transition-opacity disabled:opacity-50"
            >
              <Send size={18} />
            </button>
          </form>
        </div>
      </Modal>
    </div>
  )
}
