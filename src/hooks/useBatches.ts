'use client'

import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { Batch } from '@/types'

export function useBatches(branchId?: string) {
  const [batches, setBatches] = useState<Batch[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const supabase = createClient()

  useEffect(() => {
    let query = supabase
      .from('batches')
      .select('*, courses(*)')
      .order('name')
    if (branchId) query = query.eq('branch_id', branchId)

    query.then(({ data, error }) => {
      if (error) setError(error.message)
      else setBatches(data ?? [])
      setLoading(false)
    })
  }, [branchId])

  const addBatch = async (batch: Partial<Batch>) => {
    const { data, error } = await supabase
      .from('batches')
      .insert(batch)
      .select('*, courses(*)')
      .single()
    if (error) throw error
    if (data) setBatches(prev => [data, ...prev])
    return data
  }

  const updateBatch = async (id: string, updates: Partial<Batch>) => {
    const { data, error } = await supabase
      .from('batches')
      .update(updates)
      .eq('id', id)
      .select('*, courses(*)')
      .single()
    if (error) throw error
    if (data) setBatches(prev => prev.map(b => (b.id === id ? data : b)))
    return data
  }

  const deleteBatch = async (id: string) => {
    const { error } = await supabase.from('batches').delete().eq('id', id)
    if (error) throw error
    setBatches(prev => prev.filter(b => b.id !== id))
  }

  return { batches, loading, error, addBatch, updateBatch, deleteBatch }
}
