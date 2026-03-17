-- ================================================================
-- BrightFuture Academy / EduCloud – Full Schema with RLS
-- Run this FRESH in Supabase SQL Editor (drop all tables first if re-running)
-- ================================================================

-- ----------------------------------------------------------------
-- 1. Extensions
-- ----------------------------------------------------------------
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ----------------------------------------------------------------
-- 2. BRANCHES
-- ----------------------------------------------------------------
CREATE TABLE public.branches (
  id          UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name        TEXT NOT NULL,
  city        TEXT,
  address     TEXT,
  phone       TEXT,
  email       TEXT,
  is_active   BOOLEAN NOT NULL DEFAULT TRUE,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

ALTER TABLE public.branches ENABLE ROW LEVEL SECURITY;

CREATE POLICY "public_read_active_branches" ON public.branches
  FOR SELECT TO anon
  USING (is_active = TRUE);

-- ----------------------------------------------------------------
-- 3. PROFILES  (linked 1-to-1 with auth.users)
-- ----------------------------------------------------------------
CREATE TABLE public.profiles (
  id          UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  full_name   TEXT,
  email       TEXT,
  avatar_url  TEXT,
  role        TEXT NOT NULL DEFAULT 'student'
                   CHECK (role IN ('super_admin', 'branch_admin', 'student')),
  branch_id   UUID REFERENCES public.branches(id) ON DELETE SET NULL,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

-- Helper functions used by RLS policies to avoid recursive self-queries.
CREATE OR REPLACE FUNCTION public.current_user_role()
RETURNS TEXT
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT role FROM public.profiles WHERE id = auth.uid() LIMIT 1;
$$;

CREATE OR REPLACE FUNCTION public.current_user_branch_id()
RETURNS UUID
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT branch_id FROM public.profiles WHERE id = auth.uid() LIMIT 1;
$$;

CREATE OR REPLACE FUNCTION public.is_super_admin()
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT public.current_user_role() = 'super_admin';
$$;

GRANT EXECUTE ON FUNCTION public.current_user_role() TO authenticated;
GRANT EXECUTE ON FUNCTION public.current_user_branch_id() TO authenticated;
GRANT EXECUTE ON FUNCTION public.is_super_admin() TO authenticated;

-- Users can read their own profile
CREATE POLICY "user_read_own_profile" ON public.profiles
  FOR SELECT TO authenticated
  USING (id = auth.uid());

-- Users can update their own profile
CREATE POLICY "user_update_own_profile" ON public.profiles
  FOR UPDATE TO authenticated
  USING (id = auth.uid())
  WITH CHECK (id = auth.uid());

-- Users can insert their own profile (needed during auth callback)
CREATE POLICY "user_insert_own_profile" ON public.profiles
  FOR INSERT TO authenticated
  WITH CHECK (id = auth.uid());

-- Super admins can do everything on profiles
CREATE POLICY "super_admin_all_profiles" ON public.profiles
  FOR ALL TO authenticated
  USING  (public.is_super_admin())
  WITH CHECK (public.is_super_admin());

-- Branch admins can read profiles in their branch
CREATE POLICY "branch_admin_read_branch_profiles" ON public.profiles
  FOR SELECT TO authenticated
  USING (
    public.current_user_role() = 'branch_admin'
    AND branch_id = public.current_user_branch_id()
  );

-- ----------------------------------------------------------------
-- 4. ALLOWED_EMAILS  – gate who can sign in + assign roles
-- ----------------------------------------------------------------
CREATE TABLE public.allowed_emails (
  email       TEXT PRIMARY KEY,
  role        TEXT NOT NULL DEFAULT 'student'
                   CHECK (role IN ('super_admin', 'branch_admin', 'student')),
  branch_id   UUID REFERENCES public.branches(id) ON DELETE SET NULL,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

ALTER TABLE public.allowed_emails ENABLE ROW LEVEL SECURITY;

-- Super admins can manage all allowed emails (add/remove branch admins & students)
CREATE POLICY "super_admin_all_allowed_emails" ON public.allowed_emails
  FOR ALL TO authenticated
  USING  (public.is_super_admin())
  WITH CHECK (public.is_super_admin());

-- Any authenticated user can check if their own email is allowed (needed during auth callback)
CREATE POLICY "user_check_own_email" ON public.allowed_emails
  FOR SELECT TO authenticated
  USING (email = auth.email());

-- Seed: your super admin email
INSERT INTO public.allowed_emails (email, role)
VALUES ('jagdishpanada2000@gmail.com', 'super_admin');

-- ----------------------------------------------------------------
-- 5. Branches policies that reference profiles (after profiles table)
-- ----------------------------------------------------------------
CREATE POLICY "super_admin_all_branches" ON public.branches
  FOR ALL TO authenticated
  USING  (public.is_super_admin())
  WITH CHECK (public.is_super_admin());

CREATE POLICY "branch_admin_read_own" ON public.branches
  FOR SELECT TO authenticated
  USING (id = public.current_user_branch_id());

-- ----------------------------------------------------------------
-- 6. Trigger: auto-create profile ONLY if email is in allowed_emails
-- ----------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE
  allowed RECORD;
BEGIN
  SELECT * INTO allowed FROM public.allowed_emails WHERE email = NEW.email;

  IF NOT FOUND THEN
    RETURN NEW;  -- email not allowed, skip profile creation
  END IF;

  INSERT INTO public.profiles (id, full_name, email, avatar_url, role, branch_id)
  VALUES (
    NEW.id,
    NEW.raw_user_meta_data->>'full_name',
    NEW.email,
    NEW.raw_user_meta_data->>'avatar_url',
    allowed.role,
    allowed.branch_id
  )
  ON CONFLICT (id) DO NOTHING;
  RETURN NEW;
END;
$$;

CREATE OR REPLACE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- ----------------------------------------------------------------
-- 7. COURSES
-- ----------------------------------------------------------------
CREATE TABLE public.courses (
  id          UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name        TEXT NOT NULL,
  category    TEXT,
  description TEXT,
  image_url   TEXT,
  is_active   BOOLEAN NOT NULL DEFAULT TRUE,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

ALTER TABLE public.courses ENABLE ROW LEVEL SECURITY;

CREATE POLICY "public_read_active_courses" ON public.courses
  FOR SELECT
  USING (is_active = TRUE);

CREATE POLICY "super_admin_all_courses" ON public.courses
  FOR ALL TO authenticated
  USING  (public.is_super_admin())
  WITH CHECK (public.is_super_admin());

-- ----------------------------------------------------------------
-- 8. BATCHES
-- ----------------------------------------------------------------
CREATE TABLE public.batches (
  id          UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name        TEXT NOT NULL,
  course_id   UUID REFERENCES public.courses(id) ON DELETE SET NULL,
  branch_id   UUID REFERENCES public.branches(id) ON DELETE CASCADE,
  start_date  DATE,
  end_date    DATE,
  capacity    INT,
  is_active   BOOLEAN NOT NULL DEFAULT TRUE,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

ALTER TABLE public.batches ENABLE ROW LEVEL SECURITY;

CREATE POLICY "super_admin_all_batches" ON public.batches
  FOR ALL TO authenticated
  USING  (public.is_super_admin())
  WITH CHECK (public.is_super_admin());

CREATE POLICY "branch_admin_own_batches" ON public.batches
  FOR ALL TO authenticated
  USING  (public.current_user_role() = 'branch_admin' AND branch_id = public.current_user_branch_id())
  WITH CHECK (public.current_user_role() = 'branch_admin' AND branch_id = public.current_user_branch_id());

-- ----------------------------------------------------------------
-- 9. ENROLLMENTS
-- ----------------------------------------------------------------
CREATE TABLE public.enrollments (
  id          UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  student_id  UUID REFERENCES public.profiles(id) ON DELETE CASCADE,
  batch_id    UUID REFERENCES public.batches(id) ON DELETE CASCADE,
  status      TEXT NOT NULL DEFAULT 'active'
                   CHECK (status IN ('active', 'inactive', 'completed', 'dropped')),
  enrolled_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE (student_id, batch_id)
);

ALTER TABLE public.enrollments ENABLE ROW LEVEL SECURITY;

CREATE POLICY "super_admin_all_enrollments" ON public.enrollments
  FOR ALL TO authenticated
  USING  (public.is_super_admin())
  WITH CHECK (public.is_super_admin());

CREATE POLICY "branch_admin_branch_enrollments" ON public.enrollments
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

CREATE POLICY "student_read_own_enrollments" ON public.enrollments
  FOR SELECT TO authenticated
  USING (student_id = auth.uid());

-- Batches policy that depends on enrollments (added here, after enrollments table exists)
CREATE POLICY "student_read_enrolled_batches" ON public.batches
  FOR SELECT TO authenticated
  USING (
    id IN (SELECT batch_id FROM public.enrollments WHERE student_id = auth.uid() AND status = 'active')
  );

-- ----------------------------------------------------------------
-- 10. RESULTS
-- ----------------------------------------------------------------
CREATE TABLE public.results (
  id             UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  enrollment_id  UUID REFERENCES public.enrollments(id) ON DELETE CASCADE,
  student_id     UUID REFERENCES public.profiles(id) ON DELETE CASCADE,
  exam_name      TEXT NOT NULL,
  subject        TEXT,
  marks_obtained NUMERIC NOT NULL,
  total_marks    NUMERIC NOT NULL DEFAULT 100,
  exam_date      DATE,
  rank           INT,
  remarks        TEXT,
  published_at   TIMESTAMPTZ,
  created_at     TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

ALTER TABLE public.results ENABLE ROW LEVEL SECURITY;

CREATE POLICY "super_admin_all_results" ON public.results
  FOR ALL TO authenticated
  USING  (public.is_super_admin())
  WITH CHECK (public.is_super_admin());

CREATE POLICY "branch_admin_branch_results" ON public.results
  FOR ALL TO authenticated
  USING (
    student_id IN (
      SELECT id FROM public.profiles
      WHERE branch_id = public.current_user_branch_id()
    )
  )
  WITH CHECK (
    student_id IN (
      SELECT id FROM public.profiles
      WHERE branch_id = public.current_user_branch_id()
    )
  );

CREATE POLICY "student_read_own_published_results" ON public.results
  FOR SELECT TO authenticated
  USING (student_id = auth.uid() AND published_at IS NOT NULL);

-- ----------------------------------------------------------------
-- 11. ATTENDANCE
-- ----------------------------------------------------------------
CREATE TABLE public.attendance (
  id            UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  student_id    UUID REFERENCES public.profiles(id) ON DELETE CASCADE,
  enrollment_id UUID REFERENCES public.enrollments(id) ON DELETE CASCADE,
  date          DATE NOT NULL,
  status        TEXT NOT NULL DEFAULT 'present'
                     CHECK (status IN ('present', 'absent', 'late', 'excused')),
  note          TEXT,
  marked_by     UUID REFERENCES public.profiles(id),
  created_at    TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE (student_id, enrollment_id, date)
);

ALTER TABLE public.attendance ENABLE ROW LEVEL SECURITY;

CREATE POLICY "super_admin_all_attendance" ON public.attendance
  FOR ALL TO authenticated
  USING  (public.is_super_admin())
  WITH CHECK (public.is_super_admin());

CREATE POLICY "branch_admin_branch_attendance" ON public.attendance
  FOR ALL TO authenticated
  USING (
    student_id IN (
      SELECT id FROM public.profiles
      WHERE branch_id = public.current_user_branch_id()
    )
  )
  WITH CHECK (
    student_id IN (
      SELECT id FROM public.profiles
      WHERE branch_id = public.current_user_branch_id()
    )
  );

CREATE POLICY "student_read_own_attendance" ON public.attendance
  FOR SELECT TO authenticated
  USING (student_id = auth.uid());

-- ----------------------------------------------------------------
-- 12. ENQUIRIES
-- ----------------------------------------------------------------
CREATE TABLE public.enquiries (
  id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name            TEXT NOT NULL,
  email           TEXT,
  phone           TEXT,
  grade           TEXT,
  course_interest TEXT,
  message         TEXT,
  type            TEXT NOT NULL DEFAULT 'enquiry'
                       CHECK (type IN ('enquiry', 'demo', 'callback')),
  status          TEXT NOT NULL DEFAULT 'new'
                       CHECK (status IN ('new', 'contacted', 'enrolled', 'closed')),
  branch_id       UUID REFERENCES public.branches(id) ON DELETE SET NULL,
  created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

ALTER TABLE public.enquiries ENABLE ROW LEVEL SECURITY;

CREATE POLICY "anyone_insert_enquiry" ON public.enquiries
  FOR INSERT
  WITH CHECK (TRUE);

CREATE POLICY "super_admin_all_enquiries" ON public.enquiries
  FOR ALL TO authenticated
  USING  (public.is_super_admin())
  WITH CHECK (public.is_super_admin());

CREATE POLICY "branch_admin_own_enquiries" ON public.enquiries
  FOR SELECT TO authenticated
  USING (
    public.current_user_role() = 'branch_admin'
    AND branch_id = public.current_user_branch_id()
    OR branch_id IS NULL
  );

-- ----------------------------------------------------------------
-- 13. TOPPERS
-- ----------------------------------------------------------------
CREATE TABLE public.toppers (
  id           UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  student_name TEXT NOT NULL,
  percentage   TEXT NOT NULL,
  exam_name    TEXT NOT NULL,
  year         INT,
  image_url    TEXT,
  branch_id    UUID REFERENCES public.branches(id) ON DELETE SET NULL,
  is_featured  BOOLEAN NOT NULL DEFAULT TRUE,
  display_order INT NOT NULL DEFAULT 0,
  created_at   TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

ALTER TABLE public.toppers ENABLE ROW LEVEL SECURITY;

CREATE POLICY "public_read_featured_toppers" ON public.toppers
  FOR SELECT
  USING (is_featured = TRUE);

CREATE POLICY "super_admin_all_toppers" ON public.toppers
  FOR ALL TO authenticated
  USING  (public.is_super_admin())
  WITH CHECK (public.is_super_admin());

CREATE POLICY "branch_admin_own_toppers" ON public.toppers
  FOR ALL TO authenticated
  USING (
    public.current_user_role() = 'branch_admin'
    AND branch_id = public.current_user_branch_id()
  )
  WITH CHECK (
    public.current_user_role() = 'branch_admin'
    AND branch_id = public.current_user_branch_id()
  );

-- ----------------------------------------------------------------
-- 14. TEACHERS
-- ----------------------------------------------------------------
CREATE TABLE public.teachers (
  id          UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  full_name   TEXT NOT NULL,
  subject     TEXT,
  phone       TEXT,
  email       TEXT,
  image_url   TEXT,
  branch_id   UUID REFERENCES public.branches(id) ON DELETE CASCADE,
  is_active   BOOLEAN NOT NULL DEFAULT TRUE,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

ALTER TABLE public.teachers ENABLE ROW LEVEL SECURITY;

CREATE POLICY "super_admin_all_teachers" ON public.teachers
  FOR ALL TO authenticated
  USING  (public.is_super_admin())
  WITH CHECK (public.is_super_admin());

CREATE POLICY "branch_admin_own_teachers" ON public.teachers
  FOR ALL TO authenticated
  USING (
    public.current_user_role() = 'branch_admin'
    AND branch_id = public.current_user_branch_id()
  )
  WITH CHECK (
    public.current_user_role() = 'branch_admin'
    AND branch_id = public.current_user_branch_id()
  );

CREATE POLICY "student_read_branch_teachers" ON public.teachers
  FOR SELECT TO authenticated
  USING (
    branch_id = public.current_user_branch_id()
  );

-- ----------------------------------------------------------------
-- 15. Indexes
-- ----------------------------------------------------------------
CREATE INDEX idx_profiles_role         ON public.profiles(role);
CREATE INDEX idx_profiles_branch_id    ON public.profiles(branch_id);
CREATE INDEX idx_enrollments_student   ON public.enrollments(student_id);
CREATE INDEX idx_enrollments_batch     ON public.enrollments(batch_id);
CREATE INDEX idx_results_student       ON public.results(student_id);
CREATE INDEX idx_results_published     ON public.results(published_at) WHERE published_at IS NOT NULL;
CREATE INDEX idx_attendance_student    ON public.attendance(student_id);
CREATE INDEX idx_attendance_date       ON public.attendance(date);
CREATE INDEX idx_enquiries_status      ON public.enquiries(status);
CREATE INDEX idx_toppers_featured      ON public.toppers(is_featured, display_order);
CREATE INDEX idx_batches_branch        ON public.batches(branch_id);
CREATE INDEX idx_allowed_emails_role   ON public.allowed_emails(role);

-- ----------------------------------------------------------------
-- SETUP INSTRUCTIONS:
-- 1. Go to Supabase SQL Editor and run this entire file
-- 2. Enable Google provider in Supabase Auth > Providers
-- 3. Set Site URL and Redirect URLs in Supabase Auth > URL Config
--    Redirect URL: http://localhost:3000/auth/callback
-- 4. Set NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY in .env.local
-- 5. Sign in with jagdishpanada2000@gmail.com → you'll land on /admin
-- 6. From the Admins tab, invite branch admin emails and assign branches
-- ----------------------------------------------------------------
