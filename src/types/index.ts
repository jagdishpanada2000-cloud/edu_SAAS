export interface Branch {
  id: string
  name: string
  city: string
  address?: string
  phone?: string
  email?: string
  logo_url?: string
  is_active: boolean
  created_at: string
}

export interface Profile {
  id: string
  email: string
  full_name: string
  avatar_url?: string
  role: 'super_admin' | 'branch_admin' | 'student'
  branch_id?: string
  phone?: string
  fees_paid?: number
  fees_remaining?: number
  branches?: Branch
  created_at: string
}

export interface Course {
  id: string
  branch_id?: string
  name: string
  description?: string
  category?: string
  duration_months?: number
  fee?: number
  image_url?: string
  is_active: boolean
  created_at?: string
}

export interface Batch {
  id: string
  branch_id: string
  course_id: string
  name: string
  description?: string
  duration?: string
  start_date?: string
  end_date?: string
  schedule?: string
  capacity?: number
  is_active: boolean
  courses?: Course
  created_at?: string
}

export interface BatchPreEnrollment {
  id: string
  batch_id: string
  email: string
  full_name?: string
  phone?: string
  parent_phone?: string
  created_at: string
}

export interface Enrollment {
  id: string
  student_id: string
  batch_id: string
  enrolled_at: string
  status: 'active' | 'completed' | 'dropped'
  profiles?: Profile
  batches?: Batch
}

export interface Result {
  id: string
  enrollment_id: string
  exam_name: string
  exam_date?: string
  subject?: string
  marks_obtained: number
  total_marks: number
  grade?: string
  rank?: number
  status?: string
  published_at?: string
  created_at?: string
  enrollments?: Enrollment
}

export interface Attendance {
  id: string
  enrollment_id: string
  date: string
  status: 'present' | 'absent' | 'late'
  marked_by?: string
  created_at?: string
}

export interface Enquiry {
  id: string
  name: string
  email?: string
  phone?: string
  course_interest?: string
  message?: string
  type: 'demo' | 'enquiry' | 'callback'  // ← remove 'brochure', add 'callback'
  status: 'new' | 'contacted' | 'enrolled' | 'closed'
  branch_id?: string
  created_at: string
}
export interface Topper {
  id: string
  student_name: string
  exam_name: string
  percentage: string
  image_url?: string
  branch_id?: string
  year: number
  display_order: number
  is_featured?: boolean
}

export interface BatchTestResult {
  id: string
  branch_id: string
  batch_id: string
  course_id?: string
  test_date: string
  topic: string
  student_email: string
  student_name?: string
  marks_obtained?: number | null
  total_marks: number
  published_at?: string | null
  created_at?: string
  updated_at?: string
  batches?: Batch
  courses?: Course
}

export interface Teacher {
  id: string
  branch_id: string
  profile_id?: string
  name: string
  subject?: string
  phone?: string
  email?: string
  assigned_batch_id?: string
  image_url?: string
  created_at?: string
  profiles?: Profile
  batches?: Batch
}

export interface AllowedEmail {
  email: string
  role: 'super_admin' | 'branch_admin' | 'student'
  branch_id?: string
  full_name?: string
  phone?: string
  parent_phone?: string
  fees_paid?: number
  fees_remaining?: number
  created_at?: string
  branches?: Branch
}

// Legacy types kept for static constants compatibility
export type View = 'landing' | 'portal' | 'global-admin' | 'branch-admin'
