-- ================================================================
-- Migration 003: Change duration_months (INT) → duration (TEXT)
-- Duration is now stored as an academic-year string, e.g. "2026-2027"
--
-- Run this in Supabase SQL Editor AFTER 002_batch_feature.sql
-- ================================================================

-- ----------------------------------------------------------------
-- 1. Rename the column and change its type
--    Handles three possible states:
--      a) duration_months (INT) exists → rename + cast to TEXT
--      b) duration (INT) exists (already renamed) → cast to TEXT
--      c) duration (TEXT) already exists → nothing to do
-- ----------------------------------------------------------------
DO $$
BEGIN
  -- Case (a): column exists as duration_months → rename it
  IF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public'
      AND table_name   = 'batches'
      AND column_name  = 'duration_months'
  ) THEN
    ALTER TABLE public.batches RENAME COLUMN duration_months TO duration;
  END IF;

  -- Case (a) after rename, or case (b): column is now "duration" but still INT → cast
  IF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public'
      AND table_name   = 'batches'
      AND column_name  = 'duration'
      AND data_type   <> 'text'
  ) THEN
    ALTER TABLE public.batches ALTER COLUMN duration TYPE TEXT USING duration::TEXT;
  END IF;

  -- Case (c): column already TEXT → nothing to do

  -- If the column doesn't exist at all, add it as TEXT
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public'
      AND table_name   = 'batches'
      AND column_name  = 'duration'
  ) THEN
    ALTER TABLE public.batches ADD COLUMN duration TEXT;
  END IF;
END;
$$;


-- ================================================================
-- 2. BREAK THE INFINITE RECURSION CYCLE
--
-- Root cause:
--   "student_read_enrolled_batches" on batches  → subqueries enrollments
--   "branch_admin_branch_enrollments" on enrollments → subqueries batches
--   → PostgreSQL detects the cycle and throws "infinite recursion"
--
-- Fix: wrap the batches subquery in a SECURITY DEFINER function so
-- it executes with bypassed RLS, breaking the cycle.
-- ================================================================

CREATE OR REPLACE FUNCTION public.get_branch_batch_ids()
RETURNS SETOF UUID LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT id FROM public.batches WHERE branch_id = public.current_user_branch_id();
$$;

GRANT EXECUTE ON FUNCTION public.get_branch_batch_ids() TO authenticated;

-- Fix the enrollment policy that triggered the recursion
DROP POLICY IF EXISTS "branch_admin_branch_enrollments" ON public.enrollments;

CREATE POLICY "branch_admin_branch_enrollments" ON public.enrollments
  FOR ALL TO authenticated
  USING    (batch_id IN (SELECT public.get_branch_batch_ids()))
  WITH CHECK (batch_id IN (SELECT public.get_branch_batch_ids()));


-- ================================================================
-- COMPLETE RLS REFERENCE — batches and batch_pre_enrollments
-- (Policies below are already created by migrations 001/002.
--  They are shown here as DROP + CREATE so you can re-run this
--  file safely if you ever need to reset / update the policies.)
-- ================================================================

-- ----------------------------------------------------------------
-- 3. batches — RLS policies for both admins
-- ----------------------------------------------------------------
DROP POLICY IF EXISTS "super_admin_all_batches"       ON public.batches;
DROP POLICY IF EXISTS "branch_admin_own_batches"      ON public.batches;
DROP POLICY IF EXISTS "student_read_enrolled_batches" ON public.batches;

-- Super-admin: full access to every batch in every branch
CREATE POLICY "super_admin_all_batches" ON public.batches
  FOR ALL TO authenticated
  USING  (public.is_super_admin())
  WITH CHECK (public.is_super_admin());

-- Branch-admin: full access only to batches that belong to their branch
CREATE POLICY "branch_admin_own_batches" ON public.batches
  FOR ALL TO authenticated
  USING  (
    public.current_user_role() = 'branch_admin'
    AND branch_id = public.current_user_branch_id()
  )
  WITH CHECK (
    public.current_user_role() = 'branch_admin'
    AND branch_id = public.current_user_branch_id()
  );

-- Students: read-only view of their actively enrolled batches
CREATE POLICY "student_read_enrolled_batches" ON public.batches
  FOR SELECT TO authenticated
  USING (
    id IN (
      SELECT batch_id FROM public.enrollments
      WHERE student_id = auth.uid() AND status = 'active'
    )
  );


-- ----------------------------------------------------------------
-- 3. batch_pre_enrollments — RLS policies for both admins
-- ----------------------------------------------------------------
DROP POLICY IF EXISTS "super_admin_all_batch_pre"   ON public.batch_pre_enrollments;
DROP POLICY IF EXISTS "branch_admin_own_batch_pre"  ON public.batch_pre_enrollments;

-- Super-admin: full access to all pre-enrollments across all branches
CREATE POLICY "super_admin_all_batch_pre" ON public.batch_pre_enrollments
  FOR ALL TO authenticated
  USING  (public.is_super_admin())
  WITH CHECK (public.is_super_admin());

-- Branch-admin: full access only to pre-enrollments whose batch belongs to their branch
-- Uses get_branch_batch_ids() to avoid the batches → enrollments → batches recursion
CREATE POLICY "branch_admin_own_batch_pre" ON public.batch_pre_enrollments
  FOR ALL TO authenticated
  USING (
    public.current_user_role() = 'branch_admin'
    AND batch_id IN (SELECT public.get_branch_batch_ids())
  )
  WITH CHECK (
    public.current_user_role() = 'branch_admin'
    AND batch_id IN (SELECT public.get_branch_batch_ids())
  );


-- ----------------------------------------------------------------
-- 4. allowed_emails — RLS policies for both admins (full reference)
-- ----------------------------------------------------------------
DROP POLICY IF EXISTS "super_admin_all_allowed_emails"         ON public.allowed_emails;
DROP POLICY IF EXISTS "user_check_own_email"                   ON public.allowed_emails;
DROP POLICY IF EXISTS "branch_admin_insert_students_allowed"   ON public.allowed_emails;
DROP POLICY IF EXISTS "branch_admin_update_student_info"       ON public.allowed_emails;
DROP POLICY IF EXISTS "branch_admin_read_branch_students"      ON public.allowed_emails;

-- Super-admin: full access to every row in allowed_emails
CREATE POLICY "super_admin_all_allowed_emails" ON public.allowed_emails
  FOR ALL TO authenticated
  USING  (public.is_super_admin())
  WITH CHECK (public.is_super_admin());

-- Any authenticated user can check whether their own email is listed
-- (used by the auth callback to gate access)
CREATE POLICY "user_check_own_email" ON public.allowed_emails
  FOR SELECT TO authenticated
  USING (email = auth.email());

-- Branch-admin: insert new student rows (role must be 'student')
CREATE POLICY "branch_admin_insert_students_allowed" ON public.allowed_emails
  FOR INSERT TO authenticated
  WITH CHECK (
    public.current_user_role() = 'branch_admin'
    AND role = 'student'
  );

-- Branch-admin: update info for students that belong to their branch
CREATE POLICY "branch_admin_update_student_info" ON public.allowed_emails
  FOR UPDATE TO authenticated
  USING (
    public.current_user_role() = 'branch_admin'
    AND role = 'student'
    AND branch_id = public.current_user_branch_id()
  )
  WITH CHECK (
    public.current_user_role() = 'branch_admin'
    AND role = 'student'
    AND branch_id = public.current_user_branch_id()
  );

-- Branch-admin: read students that belong to their branch
CREATE POLICY "branch_admin_read_branch_students" ON public.allowed_emails
  FOR SELECT TO authenticated
  USING (
    public.current_user_role() = 'branch_admin'
    AND role = 'student'
    AND branch_id = public.current_user_branch_id()
  );
