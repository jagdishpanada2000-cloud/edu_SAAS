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
      supabase.from('teachers').select('branch_id'),
    ]).then(([profilesRes, teachersRes]) => {
      const map: Record<string, BranchStats> = {}
      const ensure = (id: string) => {
        if (!map[id]) map[id] = { students: 0, admins: 0, teachers: 0 }
      }
      for (const p of (profilesRes.data ?? [])) {
        if (!p.branch_id) continue
        ensure(p.branch_id)
        if (p.role === 'student') map[p.branch_id].students++
        else if (p.role === 'branch_admin') map[p.branch_id].admins++
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
