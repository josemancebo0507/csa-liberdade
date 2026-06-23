'use client'
import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
import { Users, Layers, UserCheck, CalendarDays, LogOut, Home, UserCog, BookOpen, X } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'
import { useEffect } from 'react'

const links = [
  { href: '/admin',           label: 'Painel',     icon: Home,          exact: true },
  { href: '/admin/grupos',    label: 'Grupos',     icon: Users },
  { href: '/admin/subcomites',label: 'Subcomitês', icon: Layers },
  { href: '/admin/dados-da-area', label: 'Dados da Área', icon: UserCheck },
  { href: '/admin/eventos',   label: 'Eventos',    icon: CalendarDays },
  { href: '/admin/atas',      label: 'Atas',       icon: BookOpen },
  { href: '/admin/usuarios',  label: 'Usuários',   icon: UserCog },
]

interface AdminSidebarProps {
  mobileOpen?: boolean
  onClose?: () => void
}

export default function AdminSidebar({ mobileOpen = false, onClose }: AdminSidebarProps) {
  const pathname = usePathname()
  const router = useRouter()
  const supabase = createClient()

  useEffect(() => {
    if (mobileOpen) {
      document.body.style.overflow = 'hidden'
    } else {
      document.body.style.overflow = ''
    }
    return () => { document.body.style.overflow = '' }
  }, [mobileOpen])

  async function handleLogout() {
    await supabase.auth.signOut()
    router.push('/login')
    router.refresh()
  }

  const sidebarContent = (
    <>
      {/* Logo */}
      <div className="p-4 border-b border-[var(--csa-border)] flex items-center justify-between">
        <div className="flex items-center gap-2.5">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src="/logo.png" alt="CSA Liberdade" className="object-contain flex-shrink-0 h-10 w-auto" />
          <div className="leading-tight">
            <div className="font-semibold text-[var(--csa-text-1)] text-sm">CSA Liberdade</div>
            <div className="text-xs text-[var(--csa-text-3)]">Administração</div>
          </div>
        </div>
        {/* Botão fechar — só visível em mobile */}
        <button
          onClick={onClose}
          className="md:hidden p-1 rounded-lg text-[var(--csa-text-2)] hover:bg-[var(--csa-tint)] transition-colors"
          aria-label="Fechar menu"
        >
          <X size={20} />
        </button>
      </div>

      {/* Nav */}
      <nav className="flex-1 p-3 space-y-0.5">
        {links.map(({ href, label, icon: Icon, exact }) => {
          const isActive = exact ? pathname === href : pathname.startsWith(href)
          return (
            <Link
              key={href}
              href={href}
              onClick={onClose}
              className={`flex items-center gap-2.5 px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                isActive
                  ? 'bg-[var(--csa-tint)] text-[var(--csa-accent)]'
                  : 'text-[var(--csa-text-2)] hover:bg-[var(--csa-tint)] hover:text-[var(--csa-text-1)]'
              }`}
            >
              <Icon size={16} />
              {label}
            </Link>
          )
        })}
      </nav>

      {/* Rodapé */}
      <div className="p-3 border-t border-[var(--csa-border)]">
        <a
          href="/"
          target="_blank"
          className="flex items-center gap-2 px-3 py-2 text-sm text-[var(--csa-text-3)] hover:text-[var(--csa-text-1)] transition-colors rounded-lg hover:bg-[var(--csa-tint)]"
        >
          <Home size={14} /> Ver portal público
        </a>
        <button
          onClick={handleLogout}
          className="w-full flex items-center gap-2 px-3 py-2 text-sm text-[var(--csa-text-3)] hover:text-red-600 transition-colors rounded-lg hover:bg-red-50 mt-0.5"
        >
          <LogOut size={14} /> Sair
        </button>
      </div>
    </>
  )

  return (
    <>
      {/* Desktop sidebar */}
      <aside className="hidden md:flex md:flex-col md:w-56 md:flex-shrink-0 md:min-h-screen bg-[var(--csa-surface)] border-r border-[var(--csa-border)]">
        {sidebarContent}
      </aside>

      {/* Mobile overlay + sidebar deslizante */}
      <div className="md:hidden">
        {/* Backdrop */}
        <div
          className={`fixed inset-0 z-40 bg-black/50 backdrop-blur-sm transition-opacity duration-200 ${
            mobileOpen ? 'opacity-100 pointer-events-auto' : 'opacity-0 pointer-events-none'
          }`}
          onClick={onClose}
          aria-hidden="true"
        />

        {/* Sidebar deslizante */}
        <aside
          className={`fixed left-0 top-0 h-full w-72 z-50 flex flex-col bg-[var(--csa-surface)] border-r border-[var(--csa-border)] transition-transform duration-300 ease-in-out ${
            mobileOpen ? 'translate-x-0' : '-translate-x-full'
          }`}
        >
          {sidebarContent}
        </aside>
      </div>
    </>
  )
}
