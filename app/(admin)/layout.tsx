'use client'
import { useState } from 'react'
import AdminSidebar from '@/components/admin/AdminSidebar'
import AdminHeader from '@/components/admin/AdminHeader'

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const [mobileOpen, setMobileOpen] = useState(false)

  return (
    <div className="min-h-screen bg-[var(--csa-bg)]">
      <AdminHeader onMenuOpen={() => setMobileOpen(true)} />

      <div className="flex">
        <AdminSidebar
          mobileOpen={mobileOpen}
          onClose={() => setMobileOpen(false)}
        />

        <main className="flex-1 min-w-0 p-4 md:p-6 pt-[calc(56px+16px)] md:pt-6">
          {children}
        </main>
      </div>
    </div>
  )
}
