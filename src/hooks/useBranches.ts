'use client'

import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { Branch } from '@/types'

export function useBranches() {
  const [branches, setBranches] = useState<Branch[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const supabase = createClient()

  useEffect(() => {
    supabase
      .from('branches')
      .select('*')
      .order('created_at', { ascending: false })
      .then(({ data, error }) => {
        if (error) setError(error.message)
        else setBranches(data ?? [])
        setLoading(false)
      })
  }, [])

  const addBranch = async (branch: Partial<Branch>) => {
    const { data, error } = await supabase
      .from('branches')
      .insert(branch)
      .select()
      .single()
    if (error) throw error
    if (data) setBranches(prev => [data, ...prev])
    return data
  }

  const updateBranch = async (id: string, updates: Partial<Branch>) => {
    const { data, error } = await supabase
      .from('branches')
      .update(updates)
      .eq('id', id)
      .select()
      .single()
    if (error) throw error
    if (data) setBranches(prev => prev.map(b => (b.id === id ? data : b)))
    return data
  }

  const deleteBranch = async (id: string) => {
    const { error } = await supabase.from('branches').delete().eq('id', id)
    if (error) throw error
    setBranches(prev => prev.filter(b => b.id !== id))
  }

  return { branches, loading, error, addBranch, updateBranch, deleteBranch }
}
