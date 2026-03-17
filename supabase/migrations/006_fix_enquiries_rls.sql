-- Migration 006: fix RLS for public enquiry submissions
ALTER TABLE public.enquiries ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "anyone_insert_enquiry" ON public.enquiries;
DROP POLICY IF EXISTS "super_admin_all_enquiries" ON public.enquiries;
DROP POLICY IF EXISTS "branch_admin_own_enquiries" ON public.enquiries;
DROP POLICY IF EXISTS "branch_admin_update_enquiries" ON public.enquiries;
DROP POLICY IF EXISTS "branch_admin_delete_enquiries" ON public.enquiries;

-- Public forms (anon + authenticated) can create enquiries
CREATE POLICY "anyone_insert_enquiry" ON public.enquiries
  FOR INSERT TO anon, authenticated
  WITH CHECK (TRUE);

-- Super admins can fully manage enquiries
CREATE POLICY "super_admin_all_enquiries" ON public.enquiries
  FOR ALL TO authenticated
  USING (public.is_super_admin())
  WITH CHECK (public.is_super_admin());

-- Branch admins can view enquiries assigned to their branch + unassigned leads
CREATE POLICY "branch_admin_own_enquiries" ON public.enquiries
  FOR SELECT TO authenticated
  USING (
    public.current_user_role() = 'branch_admin'
    AND (branch_id = public.current_user_branch_id() OR branch_id IS NULL)
  );

-- Optional: branch admins can update status for their branch + unassigned leads
CREATE POLICY "branch_admin_update_enquiries" ON public.enquiries
  FOR UPDATE TO authenticated
  USING (
    public.current_user_role() = 'branch_admin'
    AND (branch_id = public.current_user_branch_id() OR branch_id IS NULL)
  )
  WITH CHECK (
    public.current_user_role() = 'branch_admin'
    AND (branch_id = public.current_user_branch_id() OR branch_id IS NULL)
  );

-- Branch admins can delete enquiries for their branch + unassigned leads
CREATE POLICY "branch_admin_delete_enquiries" ON public.enquiries
  FOR DELETE TO authenticated
  USING (
    public.current_user_role() = 'branch_admin'
    AND (branch_id = public.current_user_branch_id() OR branch_id IS NULL)
  );
