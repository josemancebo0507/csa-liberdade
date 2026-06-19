'use client'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { Menu, X } from 'lucide-react'
import { useState } from 'react'

const links = [
  { href: '/grupos',    label: 'Grupos'     },
  { href: '/subcomites', label: 'Subcomitês' },
  { href: '/mesa',      label: 'Mesa da Área'},
  { href: '/eventos',   label: 'Eventos'    },
]

export default function PublicNav() {
  const pathname = usePathname()
  const [open, setOpen] = useState(false)

  return (
    <header className="bg-white border-b border-slate-200 sticky top-0 z-30">
      <div className="max-w-5xl mx-auto px-4">
        <div className="flex items-center justify-between h-16">
          {/* Logo */}
          <Link href="/" className="flex items-center">
            <div className="leading-tight">
              <div className="font-semibold text-slate-900 text-sm">CSA Liberdade</div>
              <div className="text-xs text-slate-500">Narcóticos Anônimos</div>
            </div>
          </Link>

          {/* Desktop nav */}
          <nav className="hidden md:flex items-center gap-1">
            {links.map(l => (
              <Link
                key={l.href}
                href={l.href}
                className={`px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                  pathname.startsWith(l.href)
                    ? 'bg-[#eef2fb] text-[#3f5aa6]'
                    : 'text-[#475569] hover:bg-slate-100 hover:text-[#1e293b]'
                }`}
              >
                {l.label}
              </Link>
            ))}
          </nav>

          {/* Mobile menu button */}
          <button
            className="md:hidden p-2 rounded-lg text-slate-600 hover:bg-slate-100"
            onClick={() => setOpen(!open)}
          >
            {open ? <X size={20} /> : <Menu size={20} />}
          </button>
        </div>

        {/* Mobile menu */}
        {open && (
          <div className="md:hidden pb-3 border-t border-slate-100 pt-2">
            {links.map(l => (
              <Link
                key={l.href}
                href={l.href}
                onClick={() => setOpen(false)}
                className={`block px-3 py-2.5 rounded-lg text-sm font-medium transition-colors mb-0.5 ${
                  pathname.startsWith(l.href)
                    ? 'bg-[#eef2fb] text-[#3f5aa6]'
                    : 'text-[#475569] hover:bg-slate-100'
                }`}
              >
                {l.label}
              </Link>
            ))}
          </div>
        )}
      </div>
    </header>
  )
}
