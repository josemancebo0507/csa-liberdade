import { createAdminClient } from '@/lib/supabase/server'
import Link from 'next/link'
import { Plus, CalendarDays } from 'lucide-react'

async function getEventos() {
  const supabase = await createAdminClient()
  const { data } = await supabase
    .from('eventos')
    .select(`*, tipos_evento(*), grupos(nome), subcomites(nome)`)
    .order('data_evento', { ascending: false })
  return data ?? []
}

const RESPONSAVEL: Record<string, string> = { grupo: 'Grupo', subcomite: 'Subcomitê', area: 'Área' }

export default async function AdminEventosPage() {
  const eventos = await getEventos()

  return (
    <div>
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="page-title mb-1">Eventos</h1>
          <p className="text-slate-500 text-sm">{eventos.length} evento(s) cadastrado(s)</p>
        </div>
        <Link href="/admin/eventos/novo" className="btn-primary">
          <Plus size={16} /> Novo evento
        </Link>
      </div>

      <div className="grid gap-3">
        {eventos.map((e: any) => {
          const responsavelNome = e.responsavel === 'grupo' ? e.grupos?.nome : e.responsavel === 'subcomite' ? e.subcomites?.nome : 'CSA Liberdade'
          return (
            <div key={e.id} className="card flex items-center justify-between gap-4">
              <div className="flex items-center gap-3">
                <div className="w-12 text-center flex-shrink-0">
                  <div className="text-lg font-bold text-blue-600 leading-none">
                    {new Date(e.data_evento + 'T12:00:00').getDate().toString().padStart(2,'0')}
                  </div>
                  <div className="text-xs text-slate-400 uppercase">
                    {new Date(e.data_evento + 'T12:00:00').toLocaleDateString('pt-BR', { month: 'short' }).replace('.', '')}
                  </div>
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <span className="font-semibold text-slate-900">{e.titulo}</span>
                    <span className={e.status === 'publicado' ? 'badge-green' : 'badge-red'}>
                      {e.status === 'publicado' ? 'Publicado' : 'Cancelado'}
                    </span>
                  </div>
                  <div className="text-xs text-slate-400 mt-0.5">
                    {e.tipos_evento?.nome} · {RESPONSAVEL[e.responsavel]}: {responsavelNome}
                  </div>
                </div>
              </div>
              <Link href={`/admin/eventos/${e.id}`} className="btn-secondary text-xs py-1.5 px-3 flex-shrink-0">
                Editar
              </Link>
            </div>
          )
        })}
        {eventos.length === 0 && (
          <div className="card text-center py-12 text-slate-400">
            Nenhum evento. <Link href="/admin/eventos/novo" className="text-blue-600 hover:underline">Cadastrar evento</Link>
          </div>
        )}
      </div>
    </div>
  )
}
