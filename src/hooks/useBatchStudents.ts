'use client'

import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import type { BatchPreEnrollment } from '@/types'

export function useBatchStudents(batchId?: string) {
  const [students, setStudents] = useState<BatchPreEnrollment[]>([])
  const [loading, setLoading] = useState(false)
  const supabase = createClient()

  useEffect(() => {
    if (!batchId) { setStudents([]); return }
    setLoading(true)
    supabase
      .from('batch_pre_enrollments')
      .select('*')
      .eq('batch_id', batchId)
      .order('created_at', { ascending: false })
      .then(({ data }) => {
        setStudents((data ?? []) as BatchPreEnrollment[])
        setLoading(false)
      })
  }, [batchId]) // eslint-disable-line react-hooks/exhaustive-deps

  const addBatchStudent = async (entry: {
    email: string
    full_name?: string
    phone?: string
    parent_phone?: string
    branch_id?: string | null
  }) => {
    const email = entry.email.toLowerCase().trim()

    // Upsert to allowed_emails for login gating — never override an existing non-student role
    const { data: existing } = await supabase
      .from('allowed_emails')
      .select('role')
      .eq('email', email)
      .maybeSingle()

    if (!existing) {
      const { error } = await supabase.from('allowed_emails').insert({
        email,
        role: 'student',
        branch_id: entry.branch_id ?? null,
        full_name: entry.full_name ?? null,
        phone: entry.phone ?? null,
        parent_phone: entry.parent_phone ?? null,
      })
      if (error) throw error
    } else {
      // Update info but never change the existing role
      await supabase.from('allowed_emails').update({
        full_name: entry.full_name ?? null,
        phone: entry.phone ?? null,
        parent_phone: entry.parent_phone ?? null,
      }).eq('email', email)
    }

    // Insert into batch_pre_enrollments
    const { data, error } = await supabase
      .from('batch_pre_enrollments')
      .upsert(
        { batch_id: batchId!, email, full_name: entry.full_name ?? null, phone: entry.phone ?? null, parent_phone: entry.parent_phone ?? null },
        { onConflict: 'batch_id,email', ignoreDuplicates: true }
      )
      .select()
      .single()
    if (error) throw error
    if (data) setStudents(prev => [data as BatchPreEnrollment, ...prev.filter(s => s.email !== email)])
    return data
  }

  const bulkAddBatchStudents = async (
    entries: Array<{ email: string; full_name?: string; phone?: string; parent_phone?: string; branch_id?: string | null }>
  ) => {
    const emails = entries.map(e => e.email.toLowerCase().trim())

    // Find which emails already exist
    const { data: existing } = await supabase
      .from('allowed_emails')
      .select('email')
      .in('email', emails)
    const existingSet = new Set((existing ?? []).map((r: { email: string }) => r.email))

    const toInsert = entries
      .filter(e => !existingSet.has(e.email.toLowerCase()))
      .map(e => ({
        email: e.email.toLowerCase(),
        role: 'student' as const,
        branch_id: e.branch_id ?? null,
        full_name: e.full_name ?? null,
        phone: e.phone ?? null,
        parent_phone: e.parent_phone ?? null,
      }))

    if (toInsert.length > 0) {
      const { error } = await supabase.from('allowed_emails').insert(toInsert)
      if (error) throw error
    }

    // Update info for existing (parallel updates — name/phone/parent_phone only, never role)
    await Promise.all(
      entries
        .filter(e => existingSet.has(e.email.toLowerCase()))
        .map(e =>
          supabase.from('allowed_emails')
            .update({ full_name: e.full_name ?? null, phone: e.phone ?? null, parent_phone: e.parent_phone ?? null })
            .eq('email', e.email.toLowerCase())
        )
    )

    // Bulk upsert batch_pre_enrollments
    const preRows = entries.map(e => ({
      batch_id: batchId!,
      email: e.email.toLowerCase(),
      full_name: e.full_name ?? null,
      phone: e.phone ?? null,
      parent_phone: e.parent_phone ?? null,
    }))
    const { error: preError } = await supabase
      .from('batch_pre_enrollments')
      .upsert(preRows, { onConflict: 'batch_id,email', ignoreDuplicates: true })
    if (preError) throw preError

    // Refetch
    const { data } = await supabase
      .from('batch_pre_enrollments')
      .select('*')
      .eq('batch_id', batchId!)
      .order('created_at', { ascending: false })
    if (data) setStudents(data as BatchPreEnrollment[])
  }

  const removeBatchStudent = async (id: string) => {
    const { error } = await supabase.from('batch_pre_enrollments').delete().eq('id', id)
    if (error) throw error
    setStudents(prev => prev.filter(s => s.id !== id))
  }

  const updateBatchStudent = async (id: string, updates: { full_name?: string; phone?: string; parent_phone?: string }) => {
    const { data, error } = await supabase
      .from('batch_pre_enrollments')
      .update(updates)
      .eq('id', id)
      .select()
      .single()
    if (error) throw error
    if (data) setStudents(prev => prev.map(s => (s.id === id ? (data as BatchPreEnrollment) : s)))
    return data
  }

  return { students, loading, addBatchStudent, bulkAddBatchStudents, removeBatchStudent, updateBatchStudent }
}
