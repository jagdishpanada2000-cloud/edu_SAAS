'use client'

import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { Attendance } from '@/types'

export function useAttendance(enrollmentId?: string) {
  const [attendance, setAttendance] = useState<Attendance[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const supabase = createClient()

  useEffect(() => {
    if (!enrollmentId) { setLoading(false); return }
    supabase
      .from('attendance')
      .select('*')
      .eq('enrollment_id', enrollmentId)
      .order('date', { ascending: false })
      .then(({ data, error }) => {
        if (error) setError(error.message)
        else setAttendance(data ?? [])
        setLoading(false)
      })
  }, [enrollmentId])

  const markAttendance = async (record: Partial<Attendance>) => {
    const { data, error } = await supabase
      .from('attendance')
      .upsert(record, { onConflict: 'enrollment_id,date' })
      .select()
      .single()
    if (error) throw error
    if (data) {
      setAttendance(prev => {
        const idx = prev.findIndex(a => a.date === data.date)
        if (idx >= 0) {
          const updated = [...prev]
          updated[idx] = data
          return updated
        }
        return [data, ...prev]
      })
    }
    return data
  }

  const attendancePercentage = () => {
    if (!attendance.length) return 0
    const present = attendance.filter(a => a.status === 'present' || a.status === 'late').length
    return Math.round((present / attendance.length) * 100)
  }

  return { attendance, loading, error, markAttendance, attendancePercentage }
}

export function useStudentAttendance(studentId: string) {
  const [attendance, setAttendance] = useState<Attendance[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const supabase = createClient()

  useEffect(() => {
    if (!studentId) { setLoading(false); return }
    supabase
      .from('attendance')
      .select('*, enrollments!inner(student_id)')
      .eq('enrollments.student_id', studentId)
      .order('date', { ascending: false })
      .then(({ data, error }) => {
        if (error) setError(error.message)
        else setAttendance(data ?? [])
        setLoading(false)
      })
  }, [studentId])

  const percentage = () => {
    if (!attendance.length) return 0
    const present = attendance.filter(a => a.status === 'present' || a.status === 'late').length
    return Math.round((present / attendance.length) * 100)
  }

  return { attendance, loading, error, percentage }
}
