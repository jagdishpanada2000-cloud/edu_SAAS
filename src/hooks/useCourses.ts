'use client'

import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { Course } from '@/types'

export function useCourses(branchId?: string, activeOnly = false) {
  const [courses, setCourses] = useState<Course[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const supabase = createClient()

  useEffect(() => {
    let query = supabase.from('courses').select('*').order('name')
    if (branchId) query = query.eq('branch_id', branchId)
    if (activeOnly) query = query.eq('is_active', true)

    query.then(({ data, error }) => {
      if (error) setError(error.message)
      else setCourses(data ?? [])
      setLoading(false)
    })
  }, [branchId, activeOnly])

  const addCourse = async (course: Partial<Course>) => {
    const { data, error } = await supabase
      .from('courses')
      .insert(course)
      .select()
      .single()
    if (error) throw error
    if (data) setCourses(prev => [data, ...prev])
    return data
  }

  const updateCourse = async (id: string, updates: Partial<Course>) => {
    const { data, error } = await supabase
      .from('courses')
      .update(updates)
      .eq('id', id)
      .select()
      .single()
    if (error) throw error
    if (data) setCourses(prev => prev.map(c => (c.id === id ? data : c)))
    return data
  }

  const deleteCourse = async (id: string) => {
    const { error } = await supabase.from('courses').delete().eq('id', id)
    if (error) throw error
    setCourses(prev => prev.filter(c => c.id !== id))
  }

  return { courses, loading, error, addCourse, updateCourse, deleteCourse }
}
