'use client'

import { useState } from 'react'
import { Plus, GraduationCap, CheckCircle2 } from 'lucide-react'
import { Modal } from '@/components/Modal'
import { useCourses } from '@/hooks/useCourses'

const inp = 'w-full bg-[#0a0a0a] border border-white/10 rounded-lg px-4 py-2 text-sm text-white placeholder-slate-600 focus:outline-none focus:ring-1 focus:ring-[#13ec80]'
const lbl = 'block text-xs font-bold text-slate-500 uppercase mb-1'

export function CoursesTab() {
  const { courses, addCourse, deleteCourse } = useCourses()
  const [isAddOpen, setIsAddOpen] = useState(false)
  const [submitted, setSubmitted] = useState(false)

  const handleAdd = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    const fd = new FormData(e.currentTarget)
    try {
      await addCourse({
        name: fd.get('name') as string,
        description: fd.get('description') as string,
        is_active: true,
      })
      setSubmitted(true)
      setTimeout(() => { setSubmitted(false); setIsAddOpen(false) }, 1500)
    } catch (err: unknown) {
      alert(err && typeof err === 'object' && 'message' in err ? (err as { message: string }).message : 'Failed to add course')
    }
  }

  return (
    <>
      <section className="bg-[#1b1b1b] border border-[#2a2a2a] rounded-xl shadow-sm overflow-hidden">
        <div className="px-6 py-4 border-b border-[#2a2a2a] flex items-center justify-between">
          <div>
            <h2 className="text-lg font-bold">Global Courses</h2>
            <p className="text-xs text-slate-500">Curriculum offered across all branches</p>
          </div>
          <button
            onClick={() => { setSubmitted(false); setIsAddOpen(true) }}
            className="bg-[#13ec80] hover:bg-[#13ec80]/90 text-black text-xs font-bold px-4 py-2 rounded-lg transition-all flex items-center gap-2"
          >
            <Plus size={16} /> Add Course
          </button>
        </div>

        {courses.length === 0 ? (
          <div className="p-12 text-center text-slate-500">
            <GraduationCap className="mx-auto mb-4 w-12 h-12 opacity-20" />
            <p>No courses yet. Add the first one.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 p-6">
            {courses.map(course => (
              <div key={course.id} className="bg-[#0f0f0f] border border-[#2a2a2a] p-5 rounded-xl hover:border-[#13ec80]/50 transition-colors group">
                <div className="flex justify-between items-start mb-4">
                  <div className="bg-[#13ec80]/10 p-3 rounded-lg group-hover:bg-[#13ec80]/20 transition-colors">
                    <GraduationCap className="text-[#13ec80] w-6 h-6" />
                  </div>
                  <span className="text-[10px] font-bold text-[#13ec80] bg-[#13ec80]/10 px-2 py-1 rounded uppercase tracking-wider">
                    Active
                  </span>
                </div>
                <h3 className="font-bold text-lg mb-1">{course.name}</h3>
                <p className="text-sm text-slate-500 mb-4 line-clamp-2">{course.description ?? course.category ?? 'General'}</p>
                <div className="flex gap-2">
                  <button className="flex-1 py-2 bg-[#1b1b1b] border border-[#2a2a2a] rounded-lg text-xs font-bold hover:bg-white/5 transition-colors">
                    Edit
                  </button>
                  <button
                    onClick={() => { if (confirm(`Delete "${course.name}"?`)) deleteCourse(course.id).catch(() => alert('Failed to delete course')) }}
                    className="px-3 py-2 bg-[#1b1b1b] border border-[#2a2a2a] rounded-lg text-xs font-bold hover:text-red-500 transition-colors"
                  >
                    Delete
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </section>

      {/* Add Course Modal */}
      <Modal isOpen={isAddOpen} onClose={() => setIsAddOpen(false)} title="Add New Global Course">
        {submitted ? (
          <div className="flex flex-col items-center justify-center py-8 text-center">
            <CheckCircle2 className="text-[#13ec80] w-16 h-16 mb-4 animate-bounce" />
            <h4 className="text-xl font-bold mb-2">Course Created!</h4>
            <p className="text-slate-400">The new course is now available globally.</p>
          </div>
        ) : (
          <form onSubmit={handleAdd} className="space-y-4">
            <div>
              <label className={lbl}>Course Name</label>
              <input name="name" required type="text" className={inp} placeholder="e.g. Advanced Mathematics" />
            </div>
            <div>
              <label className={lbl}>Description</label>
              <textarea name="description" rows={3} className={inp} placeholder="Brief course overview..." />
            </div>
            <button type="submit" className="w-full bg-[#13ec80] text-black font-bold py-3 rounded-lg hover:opacity-90 transition-opacity mt-4">
              Create Course
            </button>
          </form>
        )}
      </Modal>
    </>
  )
}
