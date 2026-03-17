-- ================================================================
-- Migration 002: Batch Feature
-- Run this in Supabase SQL Editor AFTER 001_schema.sql
-- ================================================================

-- ----------------------------------------------------------------
-- 1. Extra student info fields on allowed_emails
-- ----------------------------------------------------------------
ALTER TABLE public.allowed_emails
  ADD COLUMN IF NOT EXISTS full_name    TEXT,
  ADD COLUMN IF NOT EXISTS phone        TEXT,
  ADD COLUMN IF NOT EXISTS parent_phone TEXT;

-- ----------------------------------------------------------------
-- 2. Add description and duration to batches
-- ----------------------------------------------------------------
ALTER TABLE public.batches
  ADD COLUMN IF NOT EXISTS description     TEXT,
  ADD COLUMN IF NOT EXISTS duration_months INT;

-- ----------------------------------------------------------------
-- 3. batch_pre_enrollments — students pre-assigned to a batch
--    Stores full student info directly so no cross-table joins needed.
-- ----------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.batch_pre_enrollments (
  id           UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  batch_id     UUID NOT NULL REFERENCES public.batches(id) ON DELETE CASCADE,
  email        TEXT NOT NULL,
  full_name    TEXT,
  phone        TEXT,
  parent_phone TEXT,
  created_at   TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE (batch_id, email)
);

ALTER TABLE public.batch_pre_enrollments ENABLE ROW LEVEL SECURITY;

CREATE POLICY "super_admin_all_batch_pre" ON public.batch_pre_enrollments
  FOR ALL TO authenticated
  USING  (public.is_super_admin())
  WITH CHECK (public.is_super_admin());

CREATE POLICY "branch_admin_own_batch_pre" ON public.batch_pre_enrollments
  FOR ALL TO authenticated
  USING (
    batch_id IN (
      SELECT id FROM public.batches
      WHERE branch_id = public.current_user_branch_id()
    )
  )
  WITH CHECK (
    batch_id IN (
      SELECT id FROM public.batches
      WHERE branch_id = public.current_user_branch_id()
    )
  );

-- ----------------------------------------------------------------
-- 4. Allow branch admins to manage student entries in allowed_emails
--    (so they can pre-register students from BranchDashboard)
-- ----------------------------------------------------------------
CREATE POLICY "branch_admin_insert_students_allowed" ON public.allowed_emails
  FOR INSERT TO authenticated
  WITH CHECK (
    public.current_user_role() = 'branch_admin'
    AND role = 'student'
  );

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

CREATE POLICY "branch_admin_read_branch_students" ON public.allowed_emails
  FOR SELECT TO authenticated
  USING (
    public.current_user_role() = 'branch_admin'
    AND role = 'student'
    AND branch_id = public.current_user_branch_id()
  );

-- ----------------------------------------------------------------
-- 5. Update handle_new_user trigger to use pre-registered full_name
--    when the student signs in for the first time.
-- ----------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE
  allowed RECORD;
BEGIN
  SELECT * INTO allowed FROM public.allowed_emails WHERE email = NEW.email;

  IF NOT FOUND THEN
    RETURN NEW;
  END IF;

  INSERT INTO public.profiles (id, full_name, email, avatar_url, role, branch_id)
  VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data->>'full_name', allowed.full_name),
    NEW.email,
    NEW.raw_user_meta_data->>'avatar_url',
    allowed.role,
    allowed.branch_id
  )
  ON CONFLICT (id) DO NOTHING;
  RETURN NEW;
END;
$$;

-- ----------------------------------------------------------------
-- 6. Indexes
-- ----------------------------------------------------------------
CREATE INDEX IF NOT EXISTS idx_batch_pre_enrollments_batch ON public.batch_pre_enrollments(batch_id);
CREATE INDEX IF NOT EXISTS idx_batch_pre_enrollments_email ON public.batch_pre_enrollments(email);
