'use client'

import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import type { BatchTestResult } from '@/types'

// ── Branch-admin hook: full CRUD on batch_test_results ──────────────────────

export function useBatchTestResults(branchId?: string) {
  const [results, setResults] = useState<BatchTestResult[]>([])
  const [loading, setLoading] = useState(false)
  const supabase = createClient()

  const fetchResults = async (bid: string) => {
    setLoading(true)
    const { data } = await supabase
      .from('batch_test_results')
      .select('*, batches(name), courses(name)')
      .eq('branch_id', bid)
      .order('created_at', { ascending: false })
    setResults((data ?? []) as BatchTestResult[])
    setLoading(false)
  }

  useEffect(() => {
    if (branchId) fetchResults(branchId)
  }, [branchId]) // eslint-disable-line react-hooks/exhaustive-deps

  /** Insert multiple student rows for a test (upsert so re-publish is safe) */
  const submitResults = async (
    rows: Omit<BatchTestResult, 'id' | 'created_at' | 'updated_at' | 'batches' | 'courses'>[]
  ) => {
    const { data, error } = await supabase
      .from('batch_test_results')
      .upsert(rows, { onConflict: 'batch_id,test_date,topic,student_email', ignoreDuplicates: false })
      .select()
    if (error) throw error
    if (branchId) await fetchResults(branchId)
    return data
  }

  /** Publish all rows for a given batch+date+topic */
  const publishResults = async (batchId: string, testDate: string, topic: string) => {
    const { error } = await supabase
      .from('batch_test_results')
      .update({ published_at: new Date().toISOString() })
      .eq('batch_id', batchId)
      .eq('test_date', testDate)
      .eq('topic', topic)
    if (error) throw error
    if (branchId) await fetchResults(branchId)
  }

  /** Delete all rows for a given batch+date+topic */
  const deleteTest = async (batchId: string, testDate: string, topic: string) => {
    const { error } = await supabase
      .from('batch_test_results')
      .delete()
      .eq('batch_id', batchId)
      .eq('test_date', testDate)
      .eq('topic', topic)
    if (error) throw error
    setResults(prev =>
      prev.filter(r => !(r.batch_id === batchId && r.test_date === testDate && r.topic === topic))
    )
  }

  return { results, loading, submitResults, publishResults, deleteTest }
}

// ── Student hook: only published results for the logged-in student ───────────

export function useStudentTestResults() {
  const [results, setResults] = useState<BatchTestResult[]>([])
  const [loading, setLoading] = useState(true)
  const supabase = createClient()

  useEffect(() => {
    supabase.auth.getUser().then(({ data: { user } }) => {
      if (!user?.email) { setLoading(false); return }
      supabase
        .from('batch_test_results')
        .select('*, batches(name, courses(name))')
        .not('published_at', 'is', null)
        .eq('student_email', user.email)
        .order('test_date', { ascending: false })
        .then(({ data }) => {
          setResults((data ?? []) as BatchTestResult[])
          setLoading(false)
        })
    })
  }, []) // eslint-disable-line react-hooks/exhaustive-deps

  return { results, loading }
}
