import Link from 'next/link'
import { Users, Layers, CalendarDays, UserCheck } from 'lucide-react'

const cards = [
  {
    href: '/grupos',
    icon: Users,
    title: 'Grupos',
    desc: 'Encontre grupos de NA, horários de reuniões e servidores de cada grupo.',
    color: 'bg-blue-500',
  },
  {
    href: '/subcomites',
    icon: Layers,
    title: 'Subcomitês',
    desc: 'Conheça os subcomitês da área, suas reuniões e quem está servindo.',
    color: 'bg-indigo-500',
  },
  {
    href: '/mesa',
    icon: UserCheck,
    title: 'Mesa da Área',
    desc: 'Veja quem ocupa os encargos administrativos do CSA Liberdade.',
    color: 'bg-violet-500',
  },
  {
    href: '/eventos',
    icon: CalendarDays,
    title: 'Eventos',
    desc: 'Próximos eventos de grupos, subcomitês e da área.',
    color: 'bg-sky-500',
  },
]

export default function HomePage() {
  return (
    <div>
      {/* Hero */}
      <div className="mb-10">
        <div className="inline-flex items-center gap-2 bg-blue-50 text-blue-700 text-xs font-medium px-3 py-1 rounded-full mb-4">
          <span className="w-1.5 h-1.5 rounded-full bg-blue-500 inline-block" />
          Comitê de Serviço de Área
        </div>
        <h1 className="text-3xl font-bold text-slate-900 mb-3">
          CSA Liberdade
        </h1>
        <p className="text-slate-500 text-lg max-w-xl leading-relaxed">
          Portal de serviços da área. Consulte grupos, reuniões, subcomitês e eventos — sem precisar de cadastro.
        </p>
      </div>

      {/* Cards de navegação */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        {cards.map(({ href, icon: Icon, title, desc, color }) => (
          <Link
            key={href}
            href={href}
            className="card hover:shadow-md transition-shadow duration-200 flex gap-4 items-start group"
          >
            <div className={`${color} p-2.5 rounded-xl flex-shrink-0`}>
              <Icon size={22} className="text-white" />
            </div>
            <div>
              <div className="font-semibold text-slate-900 mb-1 group-hover:text-blue-600 transition-colors">
                {title}
              </div>
              <div className="text-sm text-slate-500 leading-relaxed">{desc}</div>
            </div>
          </Link>
        ))}
      </div>

      {/* Chamada do 8º conceito */}
      <div className="mt-10 p-5 bg-blue-50 border border-blue-100 rounded-xl">
        <p className="text-sm text-blue-800 leading-relaxed text-center italic">
          "A irmandade de NA sempre terá líderes, mas nunca uma liderança."
          <span className="block mt-1 not-italic font-medium text-blue-600">
            8º Conceito — Comunicação clara a todos os níveis de serviço
          </span>
        </p>
      </div>
    </div>
  )
}
