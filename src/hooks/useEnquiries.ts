'use client'

import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { Enquiry } from '@/types'

export function useEnquiries(branchId?: string) {
  const [enquiries, setEnquiries] = useState<Enquiry[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const supabase = createClient()

  useEffect(() => {
    let query = supabase
      .from('enquiries')
      .select('*')
      .order('created_at', { ascending: false })

    // Branch admins: show their branch enquiries plus unassigned ones
    if (branchId) query = query.or(`branch_id.eq.${branchId},branch_id.is.null`)

    query.then(({ data, error }) => {
      if (error) setError(error.message)
      else setEnquiries(data ?? [])
      setLoading(false)
    })
  }, [branchId])

  const submitEnquiry = async (enquiry: Partial<Enquiry>) => {
    const { error } = await supabase
      .from('enquiries')
      .insert(enquiry)
    if (error) throw error

    // Best-effort admin notification email after successful save.
    try {
      const res = await fetch('/api/enquiries/notify', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(enquiry),
      })
      if (!res.ok) {
        const msg = await res.text()
        console.warn('Enquiry notification email failed:', msg)
      }
    } catch {
      // Do not fail form submission if mail delivery fails.
    }

    return true
  }

  const updateStatus = async (id: string, status: Enquiry['status']) => {
    const { data, error } = await supabase
      .from('enquiries')
      .update({ status })
      .eq('id', id)
      .select()
      .single()
    if (error) throw error
    if (data) setEnquiries(prev => prev.map(e => (e.id === id ? data : e)))
    return data
  }

  const deleteEnquiry = async (id: string) => {
    const { error } = await supabase
      .from('enquiries')
      .delete()
      .eq('id', id)
    if (error) throw error
    setEnquiries(prev => prev.filter(e => e.id !== id))
  }

  return { enquiries, loading, error, submitEnquiry, updateStatus, deleteEnquiry }
}
