import { createAdminClient } from '@/lib/supabase/server'
import { Users, Layers, CalendarDays, UserCheck, BookOpen } from 'lucide-react'
import Link from 'next/link'

async function getStats() {
  const supabase = await createAdminClient()
  const [grupos, subcomites, eventos, servidores] = await Promise.all([
    supabase.from('grupos').select('id', { count: 'exact', head: true }).eq('status', 'ativo'),
    supabase.from('subcomites').select('id', { count: 'exact', head: true }).eq('status', 'ativo'),
    supabase.from('eventos').select('id', { count: 'exact', head: true }).eq('status', 'publicado').gte('data_evento', new Date().toISOString().split('T')[0]),
    supabase.from('servidores').select('id', { count: 'exact', head: true }).eq('status', 'ativo'),
  ])
  return {
    grupos: grupos.count ?? 0,
    subcomites: subcomites.count ?? 0,
    eventos: eventos.count ?? 0,
    servidores: servidores.count ?? 0,
  }
}

export default async function AdminDashboard() {
  const stats = await getStats()

  const cards = [
    { label: 'Grupos ativos',       value: stats.grupos,     icon: Users,        href: '/admin/grupos',     color: 'bg-blue-500' },
    { label: 'Subcomitês ativos',   value: stats.subcomites, icon: Layers,       href: '/admin/subcomites', color: 'bg-indigo-500' },
    { label: 'Servidores em serviço', value: stats.servidores, icon: UserCheck,  href: '/admin/grupos',     color: 'bg-violet-500' },
    { label: 'Próximos eventos',    value: stats.eventos,    icon: CalendarDays, href: '/admin/eventos',    color: 'bg-sky-500' },
  ]

  return (
    <div>
      <div className="mb-8">
        <h1 className="page-title mb-1">Painel administrativo</h1>
        <p className="text-slate-500 text-sm">Bem-vindo ao painel do CSA Liberdade</p>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        {cards.map(({ label, value, icon: Icon, href, color }) => (
          <Link key={href + label} href={href} className="card hover:shadow-md transition-shadow">
            <div className={`w-9 h-9 ${color} rounded-lg flex items-center justify-center mb-3`}>
              <Icon size={18} className="text-white" />
            </div>
            <div className="text-2xl font-bold text-slate-900">{value}</div>
            <div className="text-sm text-slate-500 mt-0.5">{label}</div>
          </Link>
        ))}
      </div>

      <div className="grid sm:grid-cols-2 gap-4">
        {[
          { href: '/admin/atas/nova',  label: 'Registrar ata de reunião', desc: 'Registre a ata da reunião de hoje',           icon: BookOpen, highlight: true },
          { href: '/admin/grupos',     label: 'Gerenciar grupos',         desc: 'Cadastre grupos, reuniões e servidores',      icon: Users },
          { href: '/admin/subcomites', label: 'Gerenciar subcomitês', desc: 'Gerencie subcomitês e seus servidores',       icon: Layers },
          { href: '/admin/mesa',       label: 'Mesa da área',         desc: 'Atualize os encargos administrativos do CSA', icon: UserCheck },
          { href: '/admin/eventos',    label: 'Gerenciar eventos',    desc: 'Cadastre e divulgue eventos da área',         icon: CalendarDays },
        ].map(({ href, label, desc, icon: Icon, highlight }) => (
          <Link key={href} href={href} className={`card hover:shadow-md transition-shadow flex items-start gap-3 ${highlight ? 'border-blue-200 bg-blue-50' : ''}`}>
            <div className={`w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0 ${highlight ? 'bg-blue-600' : 'bg-slate-100'}`}>
              <Icon size={16} className={highlight ? 'text-white' : 'text-slate-600'} />
            </div>
            <div>
              <div className={`font-medium text-sm ${highlight ? 'text-blue-800' : 'text-slate-900'}`}>{label}</div>
              <div className={`text-xs mt-0.5 ${highlight ? 'text-blue-600' : 'text-slate-400'}`}>{desc}</div>
            </div>
          </Link>
        ))}
      </div>
    </div>
  )
}
