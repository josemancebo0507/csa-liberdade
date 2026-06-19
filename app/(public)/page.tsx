import { createClient } from '@/lib/supabase/server'
import Link from 'next/link'
import { Users, Layers, CalendarDays, UserCheck } from 'lucide-react'

export const revalidate = 300

async function getStats() {
  const supabase = await createClient()
  const [grupos, subcomites, eventos, servidores] = await Promise.all([
    supabase.from('grupos').select('id', { count: 'exact', head: true }).eq('status', 'ativo'),
    supabase.from('subcomites').select('id', { count: 'exact', head: true }).eq('status', 'ativo'),
    supabase.from('eventos').select('id', { count: 'exact', head: true }).eq('status', 'publicado').gte('data_evento', new Date().toISOString().split('T')[0]),
    supabase.from('servidores').select('id', { count: 'exact', head: true }).eq('status', 'ativo'),
  ])
  return {
    grupos:     grupos.count     ?? 0,
    subcomites: subcomites.count ?? 0,
    eventos:    eventos.count    ?? 0,
    servidores: servidores.count ?? 0,
  }
}

const navCards = [
  { href: '/grupos',    icon: Users,        title: 'Grupos',       desc: 'Encontre grupos de NA, horários de reuniões e servidores de cada grupo.'        },
  { href: '/subcomites',icon: Layers,       title: 'Subcomitês',   desc: 'Conheça os subcomitês da área, suas reuniões e quem está servindo.'              },
  { href: '/mesa',      icon: UserCheck,    title: 'Mesa da Área', desc: 'Veja quem ocupa os encargos administrativos do CSA Liberdade.'                   },
  { href: '/eventos',   icon: CalendarDays, title: 'Eventos',      desc: 'Próximos eventos de grupos, subcomitês e da área.'                               },
]

export default async function HomePage() {
  const stats = await getStats()

  const statCards = [
    { label: 'Grupos ativos',         value: stats.grupos,     icon: Users        },
    { label: 'Subcomitês ativos',     value: stats.subcomites, icon: Layers       },
    { label: 'Servidores em serviço', value: stats.servidores, icon: UserCheck    },
    { label: 'Próximos eventos',      value: stats.eventos,    icon: CalendarDays },
  ]

  return (
    <div>
      {/* ── Hero ──────────────────────────────────────────── */}
      <div
        className="mb-10 text-center"
        style={{
          background: 'var(--csa-hero-grad)',
          border: '1px solid var(--csa-tint-border)',
          borderRadius: 24,
          padding: '72px 32px 76px',
          transition: 'background 0.25s, border-color 0.25s',
        }}
      >
        {/* Logo com brilho radial */}
        <div
          className="relative mx-auto mb-2 flex items-center justify-center"
          style={{ width: 288, height: 256 }}
        >
          <div
            className="absolute inset-0 rounded-full"
            style={{ background: 'radial-gradient(circle, rgba(94,124,196,0.18), transparent 70%)' }}
          />
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src="/logo.png"
            alt="CSA Liberdade"
            className="hero-logo relative object-contain"
            style={{ width: 256, height: 256 }}
          />
        </div>

        <h1
          style={{
            fontSize: 40,
            fontWeight: 700,
            color: 'var(--csa-text-1)',
            letterSpacing: '-0.8px',
            margin: '0 0 16px',
            lineHeight: 1.15,
          }}
        >
          CSA Liberdade
        </h1>

        <p
          style={{
            fontSize: 17,
            lineHeight: 1.6,
            color: 'var(--csa-text-2)',
            maxWidth: 480,
            margin: '0 auto',
          }}
        >
          Portal de serviços da área. Consulte grupos, reuniões, subcomitês e eventos.
        </p>
      </div>

      {/* ── Cards de navegação ────────────────────────────── */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        {navCards.map(({ href, icon: Icon, title, desc }) => (
          <Link
            key={href}
            href={href}
            className="card flex gap-4 items-start group transition-all duration-200 hover:-translate-y-0.5 hover:shadow-md"
            style={{ borderRadius: 16, padding: 26 }}
          >
            <div className="flex-shrink-0 p-2.5 rounded-xl" style={{ background: 'var(--csa-tint)' }}>
              <Icon size={22} style={{ color: 'var(--csa-accent)' }} />
            </div>
            <div>
              <div
                className="font-semibold mb-1 transition-colors group-hover:text-[--csa-accent]"
                style={{ color: 'var(--csa-text-1)' }}
              >
                {title}
              </div>
              <div className="text-sm leading-relaxed" style={{ color: 'var(--csa-text-2)' }}>
                {desc}
              </div>
            </div>
          </Link>
        ))}
      </div>

      {/* ── A área em números ─────────────────────────────── */}
      <div className="mt-10">
        <div className="flex items-center gap-3 mb-5">
          <div className="flex-1 h-px" style={{ background: 'var(--csa-border)' }} />
          <span
            className="text-xs font-semibold uppercase tracking-wider"
            style={{ color: 'var(--csa-text-3)' }}
          >
            A área em números
          </span>
          <div className="flex-1 h-px" style={{ background: 'var(--csa-border)' }} />
        </div>

        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
          {statCards.map(({ label, value, icon: Icon }) => (
            <div key={label} className="card text-center" style={{ borderRadius: 16 }}>
              <div className="flex justify-center mb-3">
                <div className="p-2.5 rounded-xl" style={{ background: 'var(--csa-tint)' }}>
                  <Icon size={18} style={{ color: 'var(--csa-accent)' }} />
                </div>
              </div>
              <div
                className="text-3xl font-bold leading-none mb-1.5"
                style={{ color: 'var(--csa-text-1)' }}
              >
                {value}
              </div>
              <div className="text-xs leading-snug" style={{ color: 'var(--csa-text-3)' }}>
                {label}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* ── Citação — 8º Conceito ─────────────────────────── */}
      <div
        className="mt-10 p-5 rounded-xl text-center"
        style={{ background: 'var(--csa-tint)', border: '1px solid var(--csa-tint-border)' }}
      >
        <p className="text-sm leading-relaxed italic" style={{ color: 'var(--csa-text-2)' }}>
          "A nossa estrutura de serviço depende da integridade e eficiência de nossas comunicações."
          <span className="block mt-1 not-italic font-medium" style={{ color: 'var(--csa-accent)' }}>
            8º Conceito — Comunicação clara a todos os níveis de serviço
          </span>
        </p>
      </div>
    </div>
  )
}
