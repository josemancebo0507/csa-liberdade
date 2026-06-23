'use client'
import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
import { Users, Layers, UserCheck, CalendarDays, LogOut, Home, UserCog, BookOpen } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'

const links = [
  { href: '/admin',           label: 'Painel',     icon: Home,          exact: true },
  { href: '/admin/grupos',    label: 'Grupos',     icon: Users },
  { href: '/admin/subcomites',label: 'Subcomitês', icon: Layers },
  { href: '/admin/dados-da-area', label: 'Dados da Área', icon: UserCheck },
  { href: '/admin/eventos',   label: 'Eventos',    icon: CalendarDays },
  { href: '/admin/atas',      label: 'Atas',       icon: BookOpen },
  { href: '/admin/usuarios',  label: 'Usuários',   icon: UserCog },
]

export default function AdminSidebar() {
  const pathname = usePathname()
  const router = useRouter()
  const supabase = createClient()

  async function handleLogout() {
    await supabase.auth.signOut()
    router.push('/login')
    router.refresh()
  }

  return (
    <aside className="w-56 flex-shrink-0 bg-white border-r border-slate-200 flex flex-col min-h-screen">
      {/* Logo */}
      <div className="p-4 border-b border-slate-100">
        <div className="flex items-center gap-2.5">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src="/logo.png" alt="CSA Liberdade" className="object-contain flex-shrink-0 h-10 w-auto" />
          <div className="leading-tight">
            <div className="font-semibold text-slate-900 text-sm">CSA Liberdade</div>
            <div className="text-xs text-slate-400">Administração</div>
          </div>
        </div>
      </div>

      {/* Nav */}
      <nav className="flex-1 p-3 space-y-0.5">
        {links.map(({ href, label, icon: Icon, exact }) => {
          const active = exact ? pathname === href : pathname.startsWith(href) && href !== '/admin'
            || (exact && pathname === href)
          const isActive = exact ? pathname === href : pathname.startsWith(href)

          return (
            <Link
              key={href}
              href={href}
              className={`flex items-center gap-2.5 px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                isActive
                  ? 'bg-blue-50 text-blue-700'
                  : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900'
              }`}
            >
              <Icon size={16} />
              {label}
            </Link>
          )
        })}
      </nav>

      {/* Rodapé */}
      <div className="p-3 border-t border-slate-100">
        <a href="/" target="_blank" className="flex items-center gap-2 px-3 py-2 text-sm text-slate-400 hover:text-slate-600 transition-colors rounded-lg hover:bg-slate-50">
          <Home size={14} /> Ver portal público
        </a>
        <button
          onClick={handleLogout}
          className="w-full flex items-center gap-2 px-3 py-2 text-sm text-slate-400 hover:text-red-600 transition-colors rounded-lg hover:bg-red-50 mt-0.5"
        >
          <LogOut size={14} /> Sair
        </button>
      </div>
    </aside>
  )
}
