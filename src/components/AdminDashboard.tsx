'use client'

import { useState } from 'react'
import { useAuth } from '@/hooks/useAuth'
import { AdminLayout } from './admin/AdminLayout'
import { DashboardTab } from './admin/tabs/DashboardTab'
import { BranchesTab } from './admin/tabs/BranchesTab'
import { AdminsTab } from './admin/tabs/AdminsTab'
import { StudentsTab } from './admin/tabs/StudentsTab'
import { CoursesTab } from './admin/tabs/CoursesTab'
import { BatchesTab } from './admin/tabs/BatchesTab'
import { EnquiriesTab } from './admin/tabs/EnquiriesTab'
import { SetupTab } from './admin/tabs/SetupTab'
import type { Profile } from '@/types'

export function AdminDashboardClient({ profile }: { profile: Profile }) {
  const { signOut } = useAuth()
  const [activeTab, setActiveTab] = useState('Dashboard')

  return (
    <AdminLayout
      profile={profile}
      activeTab={activeTab}
      setActiveTab={setActiveTab}
      onLogout={() => { if (confirm('Are you sure you want to log out?')) signOut() }}
    >
      {activeTab === 'Dashboard'  && <DashboardTab setActiveTab={setActiveTab} />}
      {activeTab === 'Branches'   && <BranchesTab />}
      {activeTab === 'Admins'     && <AdminsTab />}
      {activeTab === 'Students'   && <StudentsTab />}
      {activeTab === 'Courses'    && <CoursesTab />}
      {activeTab === 'Batches'    && <BatchesTab />}
      {activeTab === 'Enquiries'  && <EnquiriesTab />}
      {activeTab === 'Setup'      && <SetupTab profile={profile} />}
    </AdminLayout>
  )
}
