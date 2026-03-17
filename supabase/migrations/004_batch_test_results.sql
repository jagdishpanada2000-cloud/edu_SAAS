-- ================================================================
-- Migration 004: Batch Test Results
-- Each row = one student's score in one test for a batch
-- ================================================================

CREATE TABLE IF NOT EXISTS public.batch_test_results (
  id             UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  branch_id      UUID NOT NULL REFERENCES public.branches(id) ON DELETE CASCADE,
  batch_id       UUID NOT NULL REFERENCES public.batches(id) ON DELETE CASCADE,
  course_id      UUID REFERENCES public.courses(id) ON DELETE SET NULL,
  test_date      DATE NOT NULL,
  topic          TEXT NOT NULL,
  -- per-student row
  student_email  TEXT NOT NULL,
  student_name   TEXT,
  marks_obtained NUMERIC,
  total_marks    NUMERIC NOT NULL DEFAULT 100,
  -- publishing
  published_at   TIMESTAMPTZ,
  created_at     TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at     TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  -- required for upsert ON CONFLICT
  CONSTRAINT uq_batch_test_result UNIQUE (batch_id, test_date, topic, student_email)
);

ALTER TABLE public.batch_test_results ENABLE ROW LEVEL SECURITY;

-- Super admin: full access
CREATE POLICY "super_admin_all_batch_test_results" ON public.batch_test_results
  FOR ALL TO authenticated
  USING  (public.is_super_admin())
  WITH CHECK (public.is_super_admin());

-- Branch admin: full access on their own branch
CREATE POLICY "branch_admin_own_batch_test_results" ON public.batch_test_results
  FOR ALL TO authenticated
  USING  (branch_id = public.current_user_branch_id())
  WITH CHECK (branch_id = public.current_user_branch_id());

-- Students: can only read published rows where their email matches
CREATE POLICY "student_read_own_published_results" ON public.batch_test_results
  FOR SELECT TO authenticated
  USING (
    published_at IS NOT NULL
    AND student_email = auth.email()
  );

-- Updated_at trigger
CREATE OR REPLACE FUNCTION public.set_updated_at()
RETURNS TRIGGER LANGUAGE plpgsql AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$;

CREATE TRIGGER batch_test_results_updated_at
  BEFORE UPDATE ON public.batch_test_results
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();
