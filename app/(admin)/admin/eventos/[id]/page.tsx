import { createAdminClient } from '@/lib/supabase/server'
import EventoForm from '@/components/admin/EventoForm'
import Link from 'next/link'
import { ArrowLeft } from 'lucide-react'
import { notFound } from 'next/navigation'

async function getData(id: string) {
  const supabase = await createAdminClient()
  const [ev, te, g, s] = await Promise.all([
    supabase.from('eventos').select('*').eq('id', id).single(),
    supabase.from('tipos_evento').select('*').eq('ativo', true).order('nome'),
    supabase.from('grupos').select('*').eq('status', 'ativo').order('nome'),
    supabase.from('subcomites').select('*').eq('status', 'ativo').order('nome'),
  ])
  return { evento: ev.data, tiposEvento: te.data ?? [], grupos: g.data ?? [], subcomites: s.data ?? [] }
}

export default async function EditarEventoPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const { evento, tiposEvento, grupos, subcomites } = await getData(id)
  if (!evento) notFound()

  return (
    <div>
      <Link href="/admin/eventos" className="inline-flex items-center gap-1 text-sm text-slate-500 hover:text-slate-900 mb-6 transition-colors">
        <ArrowLeft size={15} /> Voltar
      </Link>
      <h1 className="page-title mb-6">Editar evento</h1>
      <div className="card max-w-xl">
        <EventoForm evento={evento} tiposEvento={tiposEvento} grupos={grupos} subcomites={subcomites} />
      </div>
    </div>
  )
}
