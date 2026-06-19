import Link from 'next/link'
import { Users, Layers, CalendarDays, UserCheck } from 'lucide-react'

const cards = [
  {
    href: '/grupos',
    icon: Users,
    title: 'Grupos',
    desc: 'Encontre grupos de NA, horários de reuniões e servidores de cada grupo.',
  },
  {
    href: '/subcomites',
    icon: Layers,
    title: 'Subcomitês',
    desc: 'Conheça os subcomitês da área, suas reuniões e quem está servindo.',
  },
  {
    href: '/mesa',
    icon: UserCheck,
    title: 'Mesa da Área',
    desc: 'Veja quem ocupa os encargos administrativos do CSA Liberdade.',
  },
  {
    href: '/eventos',
    icon: CalendarDays,
    title: 'Eventos',
    desc: 'Próximos eventos de grupos, subcomitês e da área.',
  },
]

export default function HomePage() {
  return (
    <div>
      {/* Hero */}
      <div
        className="mb-10 text-center"
        style={{
          background: 'linear-gradient(160deg, #eef2fb 0%, #f4f1fa 100%)',
          border: '1px solid #e6e9f5',
          borderRadius: 24,
          padding: '72px 32px 76px',
        }}
      >
        {/* Logo com brilho radial */}
        <div
          className="relative mx-auto mb-7 flex items-center justify-center"
          style={{ width: 180, height: 180 }}
        >
          <div
            className="absolute inset-0 rounded-full"
            style={{ background: 'radial-gradient(circle, rgba(94,124,196,0.16), transparent 70%)' }}
          />
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src="/logo.png"
            alt="CSA Liberdade"
            className="relative object-contain"
            style={{ width: 148, height: 148 }}
          />
        </div>

        <h1
          style={{
            fontSize: 40,
            fontWeight: 700,
            color: '#1e293b',
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
            color: '#64748b',
            maxWidth: 480,
            margin: '0 auto',
          }}
        >
          Portal de serviços da área. Consulte grupos, reuniões, subcomitês e eventos — sem precisar de cadastro.
        </p>
      </div>

      {/* Cards de navegação */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        {cards.map(({ href, icon: Icon, title, desc }) => (
          <Link
            key={href}
            href={href}
            className="card flex gap-4 items-start group transition-all duration-200 hover:-translate-y-0.5 hover:shadow-md"
            style={{ borderRadius: 16, padding: 26, borderColor: '#ebedf0' }}
          >
            <div
              className="flex-shrink-0 p-2.5 rounded-xl"
              style={{ background: '#eef2fb' }}
            >
              <Icon size={22} style={{ color: '#3f5aa6' }} />
            </div>
            <div>
              <div
                className="font-semibold mb-1 transition-colors group-hover:text-[#3f5aa6]"
                style={{ color: '#1e293b' }}
              >
                {title}
              </div>
              <div className="text-sm leading-relaxed" style={{ color: '#64748b' }}>
                {desc}
              </div>
            </div>
          </Link>
        ))}
      </div>

      {/* Citação — 8º Conceito */}
      <div
        className="mt-10 p-5 rounded-xl text-center"
        style={{ background: '#eef2fb', border: '1px solid #e6e9f5' }}
      >
        <p className="text-sm leading-relaxed italic" style={{ color: '#475569' }}>
          "A irmandade de NA sempre terá líderes, mas nunca uma liderança."
          <span className="block mt-1 not-italic font-medium" style={{ color: '#3f5aa6' }}>
            8º Conceito — Comunicação clara a todos os níveis de serviço
          </span>
        </p>
      </div>
    </div>
  )
}
