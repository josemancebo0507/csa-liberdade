import { createAdminClient } from '@/lib/supabase/server'
import EventoForm from '@/components/admin/EventoForm'
import Link from 'next/link'
import { ArrowLeft } from 'lucide-react'

async function getData() {
  const supabase = await createAdminClient()
  const [te, g, s] = await Promise.all([
    supabase.from('tipos_evento').select('*').eq('ativo', true).order('nome'),
    supabase.from('grupos').select('*').eq('status', 'ativo').order('nome'),
    supabase.from('subcomites').select('*').eq('status', 'ativo').order('nome'),
  ])
  return { tiposEvento: te.data ?? [], grupos: g.data ?? [], subcomites: s.data ?? [] }
}

export default async function NovoEventoPage() {
  const { tiposEvento, grupos, subcomites } = await getData()
  return (
    <div>
      <Link href="/admin/eventos" className="inline-flex items-center gap-1 text-sm text-slate-500 hover:text-slate-900 mb-6 transition-colors">
        <ArrowLeft size={15} /> Voltar
      </Link>
      <h1 className="page-title mb-6">Novo evento</h1>
      <div className="card max-w-xl">
        <EventoForm tiposEvento={tiposEvento} grupos={grupos} subcomites={subcomites} />
      </div>
    </div>
  )
}
