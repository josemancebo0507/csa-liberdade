import { createClient } from '@/lib/supabase/server'
import { CalendarDays, MapPin, ExternalLink } from 'lucide-react'

export const revalidate = 300

async function getEventos() {
  const supabase = await createClient()
  const { data } = await supabase
    .from('eventos')
    .select(`*, tipos_evento(*), grupos(nome), subcomites(nome, sigla)`)
    .eq('status', 'publicado')
    .gte('data_evento', new Date().toISOString().split('T')[0])
    .order('data_evento')
  return data ?? []
}

const RESPONSAVEL_LABEL: Record<string, string> = {
  grupo: 'Grupo',
  subcomite: 'Subcomitê',
  area: 'Área',
}

function formatDate(dateStr: string) {
  return new Date(dateStr + 'T12:00:00').toLocaleDateString('pt-BR', {
    weekday: 'long', day: '2-digit', month: 'long', year: 'numeric'
  })
}

export default async function EventosPage() {
  const eventos = await getEventos()

  return (
    <div>
      <div className="mb-8">
        <h1 className="page-title mb-1">Eventos</h1>
        <p className="text-slate-500 text-sm">Próximos eventos de grupos, subcomitês e da área</p>
      </div>

      {eventos.length === 0 ? (
        <div className="card text-center py-12">
          <CalendarDays size={32} className="text-slate-300 mx-auto mb-3" />
          <p className="text-slate-400">Nenhum evento programado no momento.</p>
        </div>
      ) : (
        <div className="grid gap-3">
          {eventos.map((e: any) => {
            const responsavelNome =
              e.responsavel === 'grupo'     ? e.grupos?.nome :
              e.responsavel === 'subcomite' ? e.subcomites?.nome :
              'CSA Liberdade'

            return (
              <div key={e.id} className="card">
                <div className="flex gap-4">
                  {/* Data */}
                  <div className="flex-shrink-0 w-14 text-center">
                    <div className="text-2xl font-bold text-blue-600 leading-none">
                      {new Date(e.data_evento + 'T12:00:00').getDate().toString().padStart(2,'0')}
                    </div>
                    <div className="text-xs text-slate-400 uppercase tracking-wide mt-0.5">
                      {new Date(e.data_evento + 'T12:00:00').toLocaleDateString('pt-BR', { month: 'short' }).replace('.', '')}
                    </div>
                  </div>

                  <div className="flex-1 min-w-0">
                    <div className="flex items-start justify-between gap-2 mb-1">
                      <h2 className="font-semibold text-slate-900 text-base leading-snug">{e.titulo}</h2>
                      {e.status === 'cancelado' && <span className="badge-red flex-shrink-0">Cancelado</span>}
                    </div>

                    <div className="text-sm text-slate-500 capitalize mb-1">{formatDate(e.data_evento)}{e.horario && ` às ${e.horario.slice(0,5)}`}</div>

                    <div className="flex flex-wrap gap-2 mt-2">
                      {e.tipos_evento?.nome && <span className="badge-blue">{e.tipos_evento.nome}</span>}
                      <span className="badge-gray">{RESPONSAVEL_LABEL[e.responsavel]}: {responsavelNome}</span>
                    </div>

                    {e.local_link && (
                      <div className="flex items-center gap-1 text-sm text-slate-500 mt-2">
                        <MapPin size={13} />
                        <span>{e.local_link}</span>
                      </div>
                    )}

                    {e.descricao && <p className="text-sm text-slate-500 mt-2">{e.descricao}</p>}

                    {e.link_externo && (
                      <a href={e.link_externo} target="_blank" rel="noopener noreferrer"
                        className="inline-flex items-center gap-1 text-blue-600 text-sm mt-2 hover:underline">
                        Ver cartaz / mais informações <ExternalLink size={12} />
                      </a>
                    )}
                  </div>
                </div>
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}
