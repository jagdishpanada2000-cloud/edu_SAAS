'use client'

import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { Enrollment } from '@/types'

export function useEnrollments(studentId?: string, branchId?: string) {
  const [enrollments, setEnrollments] = useState<Enrollment[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const supabase = createClient()

  useEffect(() => {
    if (!studentId && !branchId) { setLoading(false); return }

    let query = supabase
      .from('enrollments')
      .select('*, profiles(*), batches(*, courses(*))')
      .order('enrolled_at', { ascending: false })

    if (studentId) query = query.eq('student_id', studentId)

    query.then(({ data, error }) => {
      if (error) setError(error.message)
      else setEnrollments(data ?? [])
      setLoading(false)
    })
  }, [studentId, branchId])

  const enroll = async (studentId: string, batchId: string) => {
    const { data, error } = await supabase
      .from('enrollments')
      .insert({ student_id: studentId, batch_id: batchId, status: 'active' })
      .select('*, profiles(*), batches(*, courses(*))')
      .single()
    if (error) throw error
    if (data) setEnrollments(prev => [data, ...prev])
    return data
  }

  const unenroll = async (id: string) => {
    const { error } = await supabase.from('enrollments').delete().eq('id', id)
    if (error) throw error
    setEnrollments(prev => prev.filter(e => e.id !== id))
  }

  return { enrollments, loading, error, enroll, unenroll }
}
