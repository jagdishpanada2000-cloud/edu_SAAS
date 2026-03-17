'use client'

import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { Topper } from '@/types'

export function useToppers() {
  const [toppers, setToppers] = useState<Topper[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const supabase = createClient()

  useEffect(() => {
    supabase
      .from('toppers')
      .select('*')
      .eq('is_featured', true)
      .order('display_order')
      .then(({ data, error }) => {
        if (error) setError(error.message)
        else setToppers(data ?? [])
        setLoading(false)
      })
  }, [])

  return { toppers, loading, error }
}
