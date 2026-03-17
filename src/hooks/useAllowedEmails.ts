'use client'

import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { AllowedEmail } from '@/types'

export function useAllowedEmails() {
  const [allowedEmails, setAllowedEmails] = useState<AllowedEmail[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const supabase = createClient()

  useEffect(() => {
    supabase
      .from('allowed_emails')
      .select('*, branches(name)')
      .order('created_at', { ascending: false })
      .then(({ data, error }) => {
        if (error) setError(error.message)
        else setAllowedEmails(data ?? [])
        setLoading(false)
      })
  }, [])

  const addAllowedEmail = async (entry: { email: string; role: AllowedEmail['role']; branch_id?: string | null }) => {
    const { data, error } = await supabase
      .from('allowed_emails')
      .insert({ email: entry.email, role: entry.role, branch_id: entry.branch_id ?? null })
      .select('*, branches(name)')
      .single()
    if (error) throw error
    if (data) setAllowedEmails(prev => [data, ...prev])
    return data
  }

  const bulkAddAllowedEmails = async (entries: Array<{ email: string; role: AllowedEmail['role']; branch_id?: string | null }>) => {
    const { error } = await supabase
      .from('allowed_emails')
      .upsert(
        entries.map(e => ({ email: e.email, role: e.role, branch_id: e.branch_id ?? null })),
        { onConflict: 'email', ignoreDuplicates: true }
      )
    if (error) throw error
    // Refetch to reflect any newly inserted rows
    const { data } = await supabase
      .from('allowed_emails')
      .select('*, branches(name)')
      .order('created_at', { ascending: false })
    if (data) setAllowedEmails(data)
  }

  const removeAllowedEmail = async (email: string) => {
    const { error } = await supabase.from('allowed_emails').delete().eq('email', email)
    if (error) throw error
    setAllowedEmails(prev => prev.filter(e => e.email !== email))
  }

  return { allowedEmails, loading, error, addAllowedEmail, bulkAddAllowedEmails, removeAllowedEmail }
}
