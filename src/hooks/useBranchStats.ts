'use client'

import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'

export interface BranchStats {
  students: number
  admins: number
  teachers: number
}

export function useBranchStats() {
  const [stats, setStats] = useState<Record<string, BranchStats>>({})
  const [loading, setLoading] = useState(true)
  const supabase = createClient()

  useEffect(() => {
    Promise.all([
      supabase.from('profiles').select('branch_id, role').in('role', ['student', 'branch_admin']),
      supabase.from('allowed_emails').select('branch_id, role').eq('role', 'student'),
      supabase.from('teachers').select('branch_id'),
    ]).then(([profilesRes, allowedRes, teachersRes]) => {
      const map: Record<string, BranchStats> = {}
      const ensure = (id: string) => {
        if (!map[id]) map[id] = { students: 0, admins: 0, teachers: 0 }
      }
      
      // Count registered student profiles and branch admins
      for (const p of (profilesRes.data ?? [])) {
        if (!p.branch_id) continue
        ensure(p.branch_id)
        if (p.role === 'student') map[p.branch_id].students++
        else if (p.role === 'branch_admin') map[p.branch_id].admins++
      }

      // Also count students from allowed_emails who haven't signed in yet
      // To avoid double counting, we only count allowed students whose emails 
      // don't have a profile yet, or just count all allowed students as the source of truth.
      // Given the request, counting all students in allowed_emails (access list) is more accurate 
      // for "enrolled" students.
      if (allowedRes.data) {
        for (const a of allowedRes.data) {
          if (!a.branch_id) continue
          ensure(a.branch_id)
          // If we want total ENROLLED (even if not yet signed in)
          // Let's use allowed_emails as the source of truth for student counts
        }
        
        // Let's reset student counts and use allowed_emails as source of truth for students
        Object.keys(map).forEach(id => map[id].students = 0)
        for (const a of allowedRes.data) {
          if (!a.branch_id) continue
          ensure(a.branch_id)
          map[a.branch_id].students++
        }
      }

      for (const t of (teachersRes.data ?? [])) {
        if (!t.branch_id) continue
        ensure(t.branch_id)
        map[t.branch_id].teachers++
      }
      setStats(map)
      setLoading(false)
    })
  }, []) // eslint-disable-line react-hooks/exhaustive-deps

  return { stats, loading }
}
