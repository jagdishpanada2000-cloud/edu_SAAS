'use client'

import React, { useState } from 'react'
import Image from 'next/image'
import { School, ArrowRight, Quote, MapPin, Phone, Mail, LayoutDashboard, Share2, CheckCircle2, LogIn, LogOut } from 'lucide-react'
import { Modal } from './Modal'
import GoogleSignInButton from './GoogleSignInButton'
import { useAuth } from '@/hooks/useAuth'
import { useCourses } from '@/hooks/useCourses'
import { useToppers } from '@/hooks/useToppers'
import { useEnquiries } from '@/hooks/useEnquiries'
import { useBranches } from '@/hooks/useBranches'

const STATIC_COURSES = [
  { id: '1', name: '9th Standard', category: 'Foundational', description: 'Foundational excellence focusing on core concepts in Math, Science and English for high school success.', image_url: 'https://lh3.googleusercontent.com/aida-public/AB6AXuDiHiUttAI-C7WHNsffm56JrEKCGAQEP_qn4Roa2LzGYX5pVQOpUkUSZbl9l1me7sIfC0cszE9mIuzfOta_RKcEOwEYxAgRpsM-lp7QUJmNTpFgDK8gsl6_giciwLi2E6U_Yio2w6GcJNJU39I93TWRHsKpyRGvbp8hrE_jF5Y2ATb4Srm2cNyXYDvWX8fVGZNvGYGhHS-SrqpN8upqpYDl6hlUgeoSE_9EfBobuwp817TaaEdFDh1cpHwCdYWtIHZU4n7N0rmvuRIh', is_active: true },
  { id: '2', name: '10th Standard', category: 'Board Prep', description: 'Comprehensive board exam preparation with mock tests and personalized doubt clearing sessions.', image_url: 'https://lh3.googleusercontent.com/aida-public/AB6AXuAeJ8XEGBMxp4N5KflbXEw0YUIggdCTL3fKc-j7ffxUfgB5nuxDRB3DiW6gq5CFq7YxiaGZYSig2PbcCdVPV3v6X6r5B1up07Ifud6LT7G5MlIMxU3MEi3lnwwID4e-8dx12YKkQ26OEau34lTidgD2gs-4MbYKe6KZ2v-b1cLZ2I3QyYDO40mb2VHfO9bWFQtFbbgDR--YklWhMdUinxfmpwiINSxHYhM2u5NdGeZjy571M9x2zYsFB76N4xGK5SEG524nCwi6k0kX', is_active: true },
  { id: '3', name: '11th Science', category: 'Advanced', description: 'Specialized science stream coaching covering Physics, Chemistry, Biology and JEE/NEET basics.', image_url: 'https://lh3.googleusercontent.com/aida-public/AB6AXuCCY89uQbbOR1D1LxOHhcTaNcT6KIYKIxiTMoVd18mbguWfJKSL60N1vWu9unoLCy-JqYrdGY6c59nJysU7WFqmgMZtzo7ip_y8_EEc_VgHPCAiPVfJaFTaOkQIlfq_Fbrlitda-wmwUHVYnxBlQ2gfMSLOeBYV-K0qIIxB_DJZ4jfUmd0gilb7G8W43NRYoMj2E9ckBq07ykI8zSQGzRfTNgxlGZFVAcI-QsIj3o2WvIUZPe3H90GhmYShOl3LqW6hN6DfMJEi5wiu', is_active: true },
  { id: '4', name: '12th Commerce', category: 'Commerce', description: 'Intensive focus on Accountancy, Economics, and Business Studies for final board mastery.', image_url: 'https://lh3.googleusercontent.com/aida-public/AB6AXuDgeqpCOxNo3c2B4Kr5H5EdsxBZMiJFqq7WJDm4G80i09bO2ThFiLSBprZ0Bu-l5xkO3Lh3axT0M9dsNa26hROF2u2TXVaqMcJRaLGjIaSWfD4X7ldAVZ8zWv-aesUjKwqdGYRhLFoVJGgRCKLm2Lzmcc5YVkotYrx10SSGMHJqoYM-OluLyVElJiZ_Rn70K5Jze-_NRjMmd7T10qZ3176sKLeVK9uGFlZxx1C2JF0SIz7Y8j0kqx6QENIvFdJXMWWqdutNc-FZu64M', is_active: true },
]

const STATIC_TOPPERS = [
  { id: '1', student_name: 'Arjun Sharma', percentage: '98.4%', exam_name: 'CBSE 12th Boards', image_url: 'https://lh3.googleusercontent.com/aida-public/AB6AXuAN-m5AegNnD9WtP-h6sw9_VPnOE8qFd-NApWpqHAzDAM3o7cVRB6CAvCpk-nRMpNw20RnE1NABBc-meWv9MrEXCRUTRP-GnWTA5cvBjrbrg3qgjFoxZtc94kaelpnzdBl8ywOsn267-kxn8TUkKrNVOXcf6RMFJxrq2rNW-HDgz26Ww0wU0W3DzTgyyDZS7jfzEMHkbdlzZqW5qs33gXpsxq9aTfvkayHrmn2_dKo6Trsp5RCOG4gdhWujzEpLQ4u3F9-nMX1s0XW_', year: 2025, display_order: 0 },
  { id: '2', student_name: 'Priya Patel', percentage: '97.8%', exam_name: 'ICSE 10th Boards', image_url: 'https://lh3.googleusercontent.com/aida-public/AB6AXuC_xWQukpkSlhIqo3o8wAIiQsBFq8Txp8qBohElPcLR1kNyKbabaMaMY6nuo8ChqKzhopTLga6JioX7fqkpXTC9N8Zp59wCBw5nGAAMBiXpZwkBnXYZ3yMsO91P5bGXYE_GoqbqPHKiJ6emz14Uy3wdMet4KJOo4gDYHoSFtYP82et9129BkqktgPqmrx5eXXNff513LylDeDqu-MFupimA63s2KhQxqfTildUvD1z0xnjYBjrPHHzXC0wy0O4EDC19hSZtEgWNnsCK', year: 2025, display_order: 1 },
  { id: '3', student_name: 'Rohan Gupta', percentage: '96.5%', exam_name: '12th Commerce', image_url: 'https://lh3.googleusercontent.com/aida-public/AB6AXuDVDBPhCuf9f634DIquyxH8Bpu_QLHFkEUFCxoEmLIsR0DogPdSFEdALu_vyswLE5vnsqbW7KWcrITfTHLefG1n0DxHJOnELn_YiUtEhqA6ZsogJLG_e3Pt28MmWVjcqEqGC8ISut2pbt0ji8-AgUIwc1VctZKbgDckeHTS_vreg1FHp7usvCFPAnIn_iurKzg2Nvh3UiOjlmDqauGQsrVuNT0xcnBG-YQaR91ptAg0vsktYZUUsLB5_tMn9mFLmpyqg3ZkCW_DbT7j', year: 2025, display_order: 2 },
  { id: '4', student_name: 'Sanya Verma', percentage: '95.2%', exam_name: 'State Board 12th', image_url: 'https://lh3.googleusercontent.com/aida-public/AB6AXuDKygKRVYw0wkPNb8bNwIE013XxC2DzQeA3DhGwvpwG6pr-gY_9J9mcIW9Z44pdvNyjGFQ2teKM6OBWr_wc5T5nOfBrolhVNFA96z9rrGLiVsDQIzbSwvpZgQUO9jRtXyRux7tywLer4hujt46CvK5EYf8G-ubqSpJXoFHvMQWLMtuKveWaA9bvpxpOLLdTUbLguJnSZ_I600flaHF-j9hAj094gvhMvMeYjedImJbd95Q4w0GBMo-KuIt-O52KKjcGKwLj6gLW4Hnq', year: 2025, display_order: 3 },
]

export function LandingPageClient() {
  const { signInWithGoogle, signOut, session } = useAuth()
  const { courses, loading: coursesLoading } = useCourses(undefined, true)
  const { toppers, loading: toppersLoading } = useToppers()
  const { submitEnquiry } = useEnquiries()
  const { branches } = useBranches()

  const [isDemoModalOpen, setIsDemoModalOpen] = useState(false)
  const [isEnquiryModalOpen, setIsEnquiryModalOpen] = useState(false)
  const [selectedCourse, setSelectedCourse] = useState<string | null>(null)
  const [demoSubmitted, setDemoSubmitted] = useState(false)
  const [enquirySubmitted, setEnquirySubmitted] = useState(false)
  const [submitting, setSubmitting] = useState(false)
  const [demoForm, setDemoForm] = useState({ name: '', email: '', course: '', phone: '', branch_id: '', message: '' })
  const [enquiryForm, setEnquiryForm] = useState({ name: '', email: '', message: '' })

  const displayCourses = courses.length > 0 ? courses : STATIC_COURSES
  const displayToppers = toppers.length > 0 ? toppers : STATIC_TOPPERS

  const handleDemoSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setSubmitting(true)
    try {
      if (!demoForm.branch_id) throw new Error('Please select a preferred branch')
      await submitEnquiry({
        name: demoForm.name,
        email: demoForm.email || undefined,
        phone: demoForm.phone,
        course_interest: demoForm.course || undefined,
        message: demoForm.message || undefined,
        branch_id: demoForm.branch_id,
        type: 'demo',
        status: 'new'
      })
      setDemoSubmitted(true)
      setTimeout(() => {
        setDemoSubmitted(false)
        setIsDemoModalOpen(false)
        setDemoForm({ name: '', email: '', course: '', phone: '', branch_id: '', message: '' })
      }, 2500)
    } catch (err: unknown) {
      alert(err && typeof err === 'object' && 'message' in err ? (err as { message: string }).message : 'Failed to submit demo enquiry')
    } finally {
      setSubmitting(false)
    }
  }

  const handleEnquirySubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setSubmitting(true)
    try {
      await submitEnquiry({ name: enquiryForm.name, email: enquiryForm.email, message: enquiryForm.message, course_interest: selectedCourse ?? undefined, type: 'enquiry', status: 'new' })
      setEnquirySubmitted(true)
      setTimeout(() => {
        setEnquirySubmitted(false)
        setIsEnquiryModalOpen(false)
        setEnquiryForm({ name: '', email: '', message: '' })
      }, 2500)
    } catch (err: unknown) {
      alert(err && typeof err === 'object' && 'message' in err ? (err as { message: string }).message : 'Failed to submit enquiry')
    } finally {
      setSubmitting(false)
    }
  }

  const openEnquiry = (courseName: string) => { setSelectedCourse(courseName); setIsEnquiryModalOpen(true) }

  return (
    <div className="bg-black text-white min-h-screen font-sans">
      {/* Nav */}
      <nav className="sticky top-0 z-50 border-b border-white/10 bg-black/80 backdrop-blur-md px-4 py-3">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-2">
            <School className="text-[#13ec80] w-8 h-8" />
            <span className="text-xl font-bold tracking-tight">BrightFuture<span className="text-[#13ec80]">Academy</span></span>
          </div>
          <div className="hidden md:flex items-center gap-8">
            <a href="#courses" className="text-sm font-medium hover:text-[#13ec80] transition-colors text-slate-300">Courses</a>
            <a href="#toppers" className="text-sm font-medium hover:text-[#13ec80] transition-colors text-slate-300">Results</a>
            <a href="#contact" className="text-sm font-medium hover:text-[#13ec80] transition-colors text-slate-300">Contact</a>
          </div>
          {session ? (
            <button onClick={signOut} className="flex items-center gap-2 border border-white/20 text-white px-4 py-2 rounded-lg font-medium hover:bg-white/10 transition-colors">
              <LogOut size={16} /> Sign Out
            </button>
          ) : (
            <GoogleSignInButton onClick={signInWithGoogle} />
          )}
        </div>
      </nav>

      {/* Hero */}
      <section className="max-w-7xl mx-auto px-4 py-12 md:py-20">
        <div className="flex flex-col md:flex-row gap-8 items-center">
          <div className="w-full md:w-1/2 aspect-video rounded-xl shadow-2xl border border-white/10 relative overflow-hidden">
            <Image src="https://lh3.googleusercontent.com/aida-public/AB6AXuCvpgUG060Ct_q1woq43-loweBZt3j61D8ACjzhxynPzS4zzCXXYk00HUTvRc4DhBuojId_yAGouWkeiM2dCrpu38JVAuusWcDqtty4R1FnMWgXNdM6naQfhH8kfLlTWJSePsKWun97anQBXZdAYpmYh4e0RdnwJhstYKVBqCGfqmF5NHPUgJipoO5Pb4AJW19zkWqEL2VPHRGLJsMXgxutBjRJasMDiaoI7uph-3Q6AMCE7qH-CWncUy009neUPcghNXfzAgdaeZMA" alt="Students" fill className="object-cover" unoptimized />
          </div>
          <div className="w-full md:w-1/2 flex flex-col gap-6">
            <span className="text-[#13ec80] font-bold tracking-widest text-xs uppercase">Limited Seats Available</span>
            <h1 className="text-4xl md:text-6xl font-black leading-tight tracking-tighter">Admissions Open 2026 â€“ 9th to 12th Coaching</h1>
            <p className="text-slate-400 text-base md:text-lg leading-relaxed">Empowering students to achieve excellence through personalized coaching, rigorous curriculum, and expert mentorship.</p>
            <div className="flex flex-wrap gap-4">
              <button onClick={() => setIsDemoModalOpen(true)} className="bg-[#13ec80] text-black px-6 h-12 rounded font-bold transition-transform hover:scale-105">Book Demo Class</button>
              {session ? (
                <button onClick={signOut} className="border border-white/30 text-white px-6 h-12 rounded font-bold hover:bg-white/5 flex items-center gap-2"><LogOut size={18} /> Sign Out</button>
              ) : (
                <button onClick={signInWithGoogle} className="border border-white/30 text-white px-6 h-12 rounded font-bold hover:bg-white/5 flex items-center gap-2"><LogIn size={18} /> Sign In</button>
              )}
            </div>
          </div>
        </div>
      </section>

      {/* Stats */}
      <div className="max-w-7xl mx-auto px-4 py-10">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 border-y border-white/10 py-10">
          {[{val:'15+',label:'Years Excellence'},{val:'5000+',label:'Students Mentored'},{val:'98%',label:'Success Rate'},{val:'50+',label:'Expert Faculty'}].map((s,i) => (
            <div key={i} className="text-center">
              <p className="text-[#13ec80] text-3xl font-black">{s.val}</p>
              <p className="text-slate-500 text-sm">{s.label}</p>
            </div>
          ))}
        </div>
      </div>

      {/* Courses */}
      <section id="courses" className="max-w-7xl mx-auto px-4 py-12">
        <div className="flex items-center justify-between mb-8">
          <h2 className="text-3xl font-bold tracking-tight">Our Specialized Courses</h2>
          <div className="h-1 w-20 bg-[#13ec80] rounded-full" />
        </div>
        {coursesLoading ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {[1,2,3,4].map(i => <div key={i} className="h-72 rounded-xl bg-white/5 animate-pulse" />)}
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {displayCourses.map(course => (
              <div key={course.id} className="p-4 rounded-xl bg-[#1a1a1a] border border-white/5 group hover:border-[#13ec80]/40 transition-all">
                <div className="aspect-video rounded-lg mb-4 overflow-hidden relative bg-white/5">
                  {course.image_url && <Image src={course.image_url} alt={course.name} fill className="object-cover group-hover:scale-105 transition-transform" unoptimized />}
                </div>
                <p className="text-[#13ec80] text-xs font-bold uppercase mb-1">{course.category}</p>
                <h3 className="text-xl font-bold mb-2">{course.name}</h3>
                <p className="text-slate-400 text-sm leading-relaxed mb-6">{course.description}</p>
                <button onClick={() => openEnquiry(course.name)} className="w-full flex items-center justify-center gap-2 py-3 bg-white/5 hover:bg-[#13ec80] text-[#13ec80] hover:text-black rounded font-bold text-sm transition-all">
                  Enquire Now <ArrowRight size={16} />
                </button>
              </div>
            ))}
          </div>
        )}
      </section>

      {/* Toppers */}
      <section id="toppers" className="max-w-7xl mx-auto px-4 py-16">
        <div className="text-center mb-12">
          <h2 className="text-4xl font-black mb-4">Our Toppers â€“ 2025</h2>
          <p className="text-slate-400 max-w-2xl mx-auto">Success is not just about grades, but our results speak for the dedication of our students.</p>
        </div>
        {toppersLoading ? (
          <div className="flex gap-6 overflow-hidden">{[1,2,3,4].map(i => <div key={i} className="flex-none w-72 h-96 rounded-xl bg-white/5 animate-pulse" />)}</div>
        ) : (
          <div className="flex overflow-x-auto pb-8 gap-6 snap-x scrollbar-hide">
            {displayToppers.map(t => (
              <div key={t.id} className="flex-none w-72 snap-start group">
                <div className="relative rounded-xl overflow-hidden border-2 border-white/10 group-hover:border-[#13ec80] transition-all">
                  <div className="aspect-[3/4] relative bg-slate-800">
                    {t.image_url && <Image src={t.image_url} alt={t.student_name} fill className="object-cover" unoptimized />}
                    <div className="absolute inset-0 bg-gradient-to-t from-black to-transparent opacity-80" />
                  </div>
                  <div className="absolute bottom-4 left-4 right-4">
                    <div className="bg-[#13ec80] text-black inline-block px-3 py-1 rounded-full text-sm font-black mb-2 shadow-lg">{t.percentage}</div>
                    <h3 className="text-white text-xl font-bold">{t.student_name}</h3>
                    <p className="text-[#13ec80]/80 text-sm font-medium">{t.exam_name}</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </section>

      {/* Testimonial */}
      <section className="max-w-7xl mx-auto px-4 py-16 bg-[#1a1a1a] rounded-3xl my-10">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-12 items-center">
          <div className="p-8">
            <Quote className="text-[#13ec80] w-12 h-12 opacity-20 mb-4" />
            <p className="text-2xl text-slate-200 font-medium italic mb-8">&ldquo;The personalized attention and the regular test series at BrightFuture Academy helped me crack my board exams with flying colors. The teachers are always available for doubt solving.&rdquo;</p>
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 rounded-full bg-[#13ec80]/10 border border-[#13ec80]/20 flex items-center justify-center"><span className="text-[#13ec80] font-bold">AD</span></div>
              <div>
                <p className="text-slate-100 font-bold">Ananya Deshmukh</p>
                <p className="text-slate-500 text-sm">Parent of 10th Standard Student</p>
              </div>
            </div>
          </div>
          <div className="relative aspect-video rounded-2xl overflow-hidden border border-white/5 bg-slate-800">
            <Image src="https://lh3.googleusercontent.com/aida-public/AB6AXuAi9DCT1X6_tUk-V1c2WTvHqoLwrciQJ5jIugZCXmD9N_-lEuLtzrcMpwCO9JhgVISbX7sTEDNv98_oAIu7lUBJub6J5H34R0AwzTb9kviHCxTBiSkfRYVrrJA67wqwtRnxQe6tIStBn4ymPD7VSmSFYmw6wwx6o-z_RXvccKnRzZP8zL8KirSgykTFjIPvu3rLVjhVRT5o2Fk3bZhL23fTrLy7wpaTkR46xHyZ20CSHwXE9ps0NvKdHZeJwz27xVSl2eO9S4euvUIS" alt="" fill className="object-cover opacity-60" unoptimized />
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer id="contact" className="bg-black border-t border-white/10 pt-16 pb-8">
        <div className="max-w-7xl mx-auto px-4">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-12 mb-12">
            <div>
              <div className="flex items-center gap-2 mb-6"><School className="text-[#13ec80] w-8 h-8" /><span className="text-xl font-bold tracking-tight">BrightFuture<span className="text-[#13ec80]">Academy</span></span></div>
              <p className="text-slate-400 text-sm leading-relaxed mb-6">Nurturing talent and guiding dreams toward reality since 2010.</p>
              <div className="flex gap-4">
                <div className="w-10 h-10 rounded-full bg-white/5 flex items-center justify-center text-[#13ec80] hover:bg-[#13ec80] hover:text-black transition-all cursor-pointer"><LayoutDashboard size={20} /></div>
                <div className="w-10 h-10 rounded-full bg-white/5 flex items-center justify-center text-[#13ec80] hover:bg-[#13ec80] hover:text-black transition-all cursor-pointer"><Share2 size={20} /></div>
              </div>
            </div>
            <div>
              <h4 className="text-slate-100 font-bold mb-6">Quick Links</h4>
              <ul className="space-y-4 text-slate-400 text-sm">{['About Us','Our Faculty','Scholarship Test','Success Stories'].map(l => <li key={l}><a href="#" className="hover:text-[#13ec80]">{l}</a></li>)}</ul>
            </div>
            <div>
              <h4 className="text-slate-100 font-bold mb-6">Courses</h4>
              <ul className="space-y-4 text-slate-400 text-sm">{['Secondary School (9-10)','Senior Secondary Science','Senior Secondary Commerce','Crash Courses'].map(l => <li key={l}><a href="#courses" className="hover:text-[#13ec80]">{l}</a></li>)}</ul>
            </div>
            <div>
              <h4 className="text-slate-100 font-bold mb-6">Contact Us</h4>
              <ul className="space-y-4 text-slate-400 text-sm">
                <li className="flex items-start gap-3"><MapPin className="text-[#13ec80] w-5 h-5 shrink-0" /><span>123 Knowledge Square, Mumbai, 400001</span></li>
                <li className="flex items-center gap-3"><Phone className="text-[#13ec80] w-5 h-5 shrink-0" /><span>+91 98765 43210</span></li>
                <li className="flex items-center gap-3"><Mail className="text-[#13ec80] w-5 h-5 shrink-0" /><span>admissions@brightfuture.edu.in</span></li>
              </ul>
            </div>
          </div>
          <div className="pt-8 border-t border-white/5 text-center">
            <p className="text-slate-500 text-xs tracking-wider uppercase"> 2026 BrightFuture Academy. All Rights Reserved.</p>
          </div>
        </div>
      </footer>

      {/* Demo Modal */}
      <Modal isOpen={isDemoModalOpen} onClose={() => setIsDemoModalOpen(false)} title="Book a Free Demo Class">
        {demoSubmitted ? (
          <div className="flex flex-col items-center justify-center py-8 text-center">
            <CheckCircle2 className="text-[#13ec80] w-16 h-16 mb-4 animate-bounce" />
            <h4 className="text-xl font-bold mb-2">Request Received!</h4>
            <p className="text-slate-400">Our counselor will call you within 24 hours to schedule your demo.</p>
          </div>
        ) : (
          <form onSubmit={handleDemoSubmit} className="space-y-4">
            <div>
              <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Student Name</label>
              <input required type="text" value={demoForm.name} onChange={e => setDemoForm(p => ({ ...p, name: e.target.value }))} className="w-full bg-black border border-white/10 rounded-lg px-4 py-2 focus:outline-none focus:ring-1 focus:ring-[#13ec80] text-white" placeholder="Enter name" />
            </div>
            <div>
              <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Email (Optional)</label>
              <input type="email" value={demoForm.email} onChange={e => setDemoForm(p => ({ ...p, email: e.target.value }))} className="w-full bg-black border border-white/10 rounded-lg px-4 py-2 focus:outline-none focus:ring-1 focus:ring-[#13ec80] text-white" placeholder="email@example.com" />
            </div>
            <div>
              <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Select Course (Optional)</label>
              <select value={demoForm.course} onChange={e => setDemoForm(p => ({ ...p, course: e.target.value }))} className="w-full bg-black border border-white/10 rounded-lg px-4 py-2 focus:outline-none focus:ring-1 focus:ring-[#13ec80] text-white">
                <option value="">Choose a course (optional)</option>
                {(courses.length ? courses : STATIC_COURSES).map(c => <option key={c.id} value={c.name}>{c.name}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Preferred Branch</label>
              <select required value={demoForm.branch_id} onChange={e => setDemoForm(p => ({ ...p, branch_id: e.target.value }))} className="w-full bg-black border border-white/10 rounded-lg px-4 py-2 focus:outline-none focus:ring-1 focus:ring-[#13ec80] text-white">
                <option value="" disabled>Select preferred branch</option>
                {branches.map(b => <option key={b.id} value={b.id}>{b.name}{b.city ? ` - ${b.city}` : ''}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Phone Number</label>
              <input required type="tel" value={demoForm.phone} onChange={e => setDemoForm(p => ({ ...p, phone: e.target.value }))} className="w-full bg-black border border-white/10 rounded-lg px-4 py-2 focus:outline-none focus:ring-1 focus:ring-[#13ec80] text-white" placeholder="+91 XXXXX XXXXX" />
            </div>
            <div>
              <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Message (Optional)</label>
              <textarea value={demoForm.message} onChange={e => setDemoForm(p => ({ ...p, message: e.target.value }))} className="w-full bg-black border border-white/10 rounded-lg px-4 py-2 focus:outline-none focus:ring-1 focus:ring-[#13ec80] text-white h-24" placeholder="Anything you want us to know before the demo?" />
            </div>
            <button type="submit" disabled={submitting} className="w-full bg-[#13ec80] text-black font-bold py-3 rounded-lg hover:opacity-90 transition-opacity mt-4 disabled:opacity-50">{submitting ? 'Sending…' : 'Schedule Demo'}</button>
          </form>
        )}
      </Modal>

      {/* Enquiry Modal */}
      <Modal isOpen={isEnquiryModalOpen} onClose={() => setIsEnquiryModalOpen(false)} title={`Enquire about ${selectedCourse}`}>
        {enquirySubmitted ? (
          <div className="flex flex-col items-center justify-center py-8 text-center">
            <CheckCircle2 className="text-[#13ec80] w-16 h-16 mb-4 animate-bounce" />
            <h4 className="text-xl font-bold mb-2">Enquiry Sent!</h4>
            <p className="text-slate-400">We have received your enquiry for {selectedCourse}.</p>
          </div>
        ) : (
          <form onSubmit={handleEnquirySubmit} className="space-y-4">
            <div><label className="block text-xs font-bold text-slate-500 uppercase mb-1">Your Name</label><input required type="text" value={enquiryForm.name} onChange={e => setEnquiryForm(p => ({...p, name: e.target.value}))} className="w-full bg-black border border-white/10 rounded-lg px-4 py-2 focus:outline-none focus:ring-1 focus:ring-[#13ec80] text-white" placeholder="Enter name" /></div>
            <div><label className="block text-xs font-bold text-slate-500 uppercase mb-1">Email Address</label><input required type="email" value={enquiryForm.email} onChange={e => setEnquiryForm(p => ({...p, email: e.target.value}))} className="w-full bg-black border border-white/10 rounded-lg px-4 py-2 focus:outline-none focus:ring-1 focus:ring-[#13ec80] text-white" placeholder="email@example.com" /></div>
            <div><label className="block text-xs font-bold text-slate-500 uppercase mb-1">Message (Optional)</label><textarea value={enquiryForm.message} onChange={e => setEnquiryForm(p => ({...p, message: e.target.value}))} className="w-full bg-black border border-white/10 rounded-lg px-4 py-2 focus:outline-none focus:ring-1 focus:ring-[#13ec80] text-white h-24" placeholder="How can we help you?" /></div>
            <button type="submit" disabled={submitting} className="w-full bg-[#13ec80] text-black font-bold py-3 rounded-lg hover:opacity-90 transition-opacity mt-4 disabled:opacity-50">{submitting ? 'Sending…' : 'Send Enquiry'}</button>
          </form>
        )}
      </Modal>
    </div>
  )
}
