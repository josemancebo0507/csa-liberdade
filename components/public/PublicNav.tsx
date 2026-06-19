'use client'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { Menu, X, Moon, Sun } from 'lucide-react'
import { useState, useEffect } from 'react'

const links = [
  { href: '/grupos',    label: 'Grupos'      },
  { href: '/subcomites', label: 'Subcomitês' },
  { href: '/mesa',      label: 'Mesa da Área' },
  { href: '/eventos',   label: 'Eventos'     },
]

function ThemeToggle() {
  const [dark, setDark] = useState(false)
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    setMounted(true)
    setDark(localStorage.getItem('csa-theme') === 'dark')
  }, [])

  function toggle() {
    const next = !dark
    setDark(next)
    document.documentElement.classList.toggle('dark', next)
    localStorage.setItem('csa-theme', next ? 'dark' : 'light')
  }

  if (!mounted) return <div className="w-9 h-9" />

  return (
    <button
      onClick={toggle}
      className="w-9 h-9 flex items-center justify-center rounded-lg transition-colors nav-link"
      style={{ color: 'var(--csa-text-3)' }}
      title={dark ? 'Modo claro' : 'Modo escuro'}
      aria-label={dark ? 'Ativar modo claro' : 'Ativar modo escuro'}
    >
      {dark ? <Sun size={16} /> : <Moon size={16} />}
    </button>
  )
}

export default function PublicNav() {
  const pathname = usePathname()
  const [open, setOpen] = useState(false)

  return (
    <header
      className="sticky top-0 z-30 border-b backdrop-blur-sm"
      style={{
        backgroundColor: 'var(--csa-surface)',
        borderColor: 'var(--csa-border-2)',
        transition: 'background-color 0.25s, border-color 0.25s',
      }}
    >
      <div className="max-w-5xl mx-auto px-4">
        <div className="flex items-center justify-between h-16">

          {/* Marca */}
          <Link href="/" className="flex items-center">
            <div className="leading-tight">
              <div className="font-semibold text-sm" style={{ color: 'var(--csa-text-1)' }}>
                CSA Liberdade
              </div>
              <div className="text-xs" style={{ color: 'var(--csa-text-3)' }}>
                Narcóticos Anônimos
              </div>
            </div>
          </Link>

          {/* Direita: nav desktop + toggle + menu mobile */}
          <div className="flex items-center gap-1">
            <nav className="hidden md:flex items-center gap-0.5">
              {links.map(l => (
                <Link
                  key={l.href}
                  href={l.href}
                  className="nav-link px-3 py-2 rounded-lg text-sm font-medium transition-colors"
                  style={
                    pathname.startsWith(l.href)
                      ? { backgroundColor: 'var(--csa-tint)', color: 'var(--csa-accent)' }
                      : { color: 'var(--csa-text-2)' }
                  }
                >
                  {l.label}
                </Link>
              ))}
            </nav>

            {/* Toggle dark/light — sempre visível */}
            <ThemeToggle />

            {/* Hambúrguer — só mobile */}
            <button
              className="md:hidden w-9 h-9 flex items-center justify-center rounded-lg nav-link transition-colors"
              style={{ color: 'var(--csa-text-2)' }}
              onClick={() => setOpen(!open)}
            >
              {open ? <X size={20} /> : <Menu size={20} />}
            </button>
          </div>
        </div>

        {/* Menu mobile expandido */}
        {open && (
          <div
            className="md:hidden pb-3 border-t pt-2"
            style={{ borderColor: 'var(--csa-border)' }}
          >
            {links.map(l => (
              <Link
                key={l.href}
                href={l.href}
                onClick={() => setOpen(false)}
                className="block px-3 py-2.5 rounded-lg text-sm font-medium transition-colors mb-0.5"
                style={
                  pathname.startsWith(l.href)
                    ? { backgroundColor: 'var(--csa-tint)', color: 'var(--csa-accent)' }
                    : { color: 'var(--csa-text-2)' }
                }
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
