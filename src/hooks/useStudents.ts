'use client'

import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { Profile } from '@/types'

export function useStudents(branchId?: string) {
  const [students, setStudents] = useState<Profile[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const supabase = createClient()

  useEffect(() => {
    if (!branchId) { setLoading(false); return }
    let query = supabase
      .from('profiles')
      .select('*')
      .eq('role', 'student')
      .order('full_name')

    if (branchId) query = query.eq('branch_id', branchId)

    query.then(({ data, error }) => {
      if (error) setError(error.message)
      else setStudents(data ?? [])
      setLoading(false)
    })
  }, [branchId])

  const addStudent = async (student: Partial<Profile>) => {
    const { data, error } = await supabase
      .from('profiles')
      .insert({ ...student, role: 'student', branch_id: branchId })
      .select()
      .single()
    if (error) throw error
    if (data) setStudents(prev => [data, ...prev])
    return data
  }

  const updateStudent = async (id: string, updates: Partial<Profile>) => {
    const { data, error } = await supabase
      .from('profiles')
      .update(updates)
      .eq('id', id)
      .select()
      .single()
    if (error) throw error
    if (data) setStudents(prev => prev.map(s => (s.id === id ? data : s)))
    return data
  }

  const deleteStudent = async (id: string) => {
    const { error } = await supabase.from('profiles').delete().eq('id', id)
    if (error) throw error
    setStudents(prev => prev.filter(s => s.id !== id))
  }

  return { students, loading, error, addStudent, updateStudent, deleteStudent }
}
