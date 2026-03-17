'use client'

import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { Result } from '@/types'

export function useResults(enrollmentId?: string) {
  const [results, setResults] = useState<Result[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const supabase = createClient()

  useEffect(() => {
    let query = supabase
      .from('results')
      .select('*, enrollments(*, profiles(*), batches(*, courses(*)))')
      .order('created_at', { ascending: false })

    if (enrollmentId) query = query.eq('enrollment_id', enrollmentId)

    query.then(({ data, error }) => {
      if (error) setError(error.message)
      else setResults(data ?? [])
      setLoading(false)
    })
  }, [enrollmentId])

  const upsertResults = async (rows: Partial<Result>[]) => {
    const { data, error } = await supabase
      .from('results')
      .upsert(rows, { onConflict: 'id' })
      .select()
    if (error) throw error
    if (data) {
      setResults(prev => {
        const updated = [...prev]
        data.forEach((r: Result) => {
          const idx = updated.findIndex(x => x.id === r.id)
          if (idx >= 0) updated[idx] = r
          else updated.unshift(r)
        })
        return updated
      })
    }
    return data
  }

  const publishResults = async (batchId: string, examName: string) => {
    const enrollmentIds = results
      .filter(r => r.enrollments?.batch_id === batchId && r.exam_name === examName)
      .map(r => r.enrollment_id)

    const { error } = await supabase
      .from('results')
      .update({ published_at: new Date().toISOString() })
      .in('enrollment_id', enrollmentIds)
      .eq('exam_name', examName)

    if (error) throw error
    setResults(prev =>
      prev.map(r =>
        r.enrollments?.batch_id === batchId && r.exam_name === examName
          ? { ...r, published_at: new Date().toISOString() }
          : r
      )
    )
  }

  return { results, loading, error, upsertResults, publishResults, setResults }
}

export function useStudentResults(studentId: string) {
  const [results, setResults] = useState<Result[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const supabase = createClient()

  useEffect(() => {
    if (!studentId) { setLoading(false); return }
    supabase
      .from('results')
      .select('*, enrollments!inner(student_id, batches(*, courses(*)))')
      .eq('enrollments.student_id', studentId)
      .not('published_at', 'is', null)
      .order('created_at', { ascending: false })
      .then(({ data, error }) => {
        if (error) setError(error.message)
        else setResults(data ?? [])
        setLoading(false)
      })
  }, [studentId])

  return { results, loading, error }
}
