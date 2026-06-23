'use client'
import { Menu } from 'lucide-react'

interface AdminHeaderProps {
  onMenuOpen: () => void
}

export default function AdminHeader({ onMenuOpen }: AdminHeaderProps) {
  return (
    <header className="flex md:hidden fixed top-0 left-0 right-0 z-30 h-14 items-center justify-between px-4 bg-[var(--csa-surface)] border-b border-[var(--csa-border)]">
      <button
        onClick={onMenuOpen}
        className="p-1.5 rounded-lg text-[var(--csa-text-2)] hover:bg-[var(--csa-tint)] transition-colors"
        aria-label="Abrir menu"
      >
        <Menu size={24} />
      </button>

      <div className="flex items-center gap-2">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src="/logo.png" alt="CSA Liberdade" className="h-8 w-auto object-contain" />
        <span className="font-semibold text-sm text-[var(--csa-text-1)]">CSA Liberdade</span>
      </div>

      {/* Espaço para balancear o layout */}
      <div className="w-9" />
    </header>
  )
}
