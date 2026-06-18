import { createClient } from '@/lib/supabase/server'
import { DIA_SEMANA_LABEL, FORMATO_LABEL } from '@/lib/types'
import { Clock, User, Layers } from 'lucide-react'

export const revalidate = 300

async function getSubcomites() {
  const supabase = await createClient()
  const { data } = await supabase
    .from('subcomites')
    .select(`*, reunioes_subcomite(*), vinculos_encargo(*, servidores(*), tipos_encargo(*))`)
    .eq('status', 'ativo')
    .order('nome')
  return data ?? []
}

export default async function SubcomitesPage() {
  const subcomites = await getSubcomites()

  return (
    <div>
      <div className="mb-8">
        <h1 className="page-title mb-1">Subcomitês</h1>
        <p className="text-slate-500 text-sm">{subcomites.length} subcomitê{subcomites.length !== 1 ? 's' : ''} ativo{subcomites.length !== 1 ? 's' : ''}</p>
      </div>

      {subcomites.length === 0 ? (
        <div className="card text-center py-12 text-slate-400">Nenhum subcomitê cadastrado.</div>
      ) : (
        <div className="grid gap-4">
          {subcomites.map((s: any) => {
            const reunioes = (s.reunioes_subcomite ?? []).filter((r: any) => r.status === 'ativo')
            const servidores = (s.vinculos_encargo ?? []).filter((v: any) => v.status !== 'inativo')

            return (
              <div key={s.id} className="card">
                <div className="flex items-start justify-between gap-3 mb-3">
                  <div className="flex items-center gap-2.5">
                    <div className="w-9 h-9 rounded-lg bg-indigo-100 flex items-center justify-center flex-shrink-0">
                      <Layers size={16} className="text-indigo-600" />
                    </div>
                    <div>
                      <h2 className="font-semibold text-slate-900">{s.nome}</h2>
                      {s.sigla && <span className="badge-blue text-xs">{s.sigla}</span>}
                    </div>
                  </div>
                </div>

                {s.descricao && <p className="text-sm text-slate-500 mb-3">{s.descricao}</p>}

                {reunioes.length > 0 && (
                  <div className="mb-3">
                    <div className="text-xs font-medium text-slate-400 uppercase tracking-wide mb-1.5">Reuniões</div>
                    {reunioes.map((r: any) => (
                      <div key={r.id} className="flex items-center gap-1.5 text-sm text-slate-600">
                        <Clock size={13} className="text-slate-400" />
                        {r.recorrente
                          ? `${DIA_SEMANA_LABEL[r.dia_semana as keyof typeof DIA_SEMANA_LABEL]} às ${r.horario.slice(0,5)}`
                          : `${new Date(r.data_especifica + 'T12:00:00').toLocaleDateString('pt-BR')} às ${r.horario.slice(0,5)}`
                        }
                        <span className="text-slate-400">·</span>
                        <span>{FORMATO_LABEL[r.formato as keyof typeof FORMATO_LABEL]}</span>
                      </div>
                    ))}
                  </div>
                )}

                {servidores.length > 0 && (
                  <div>
                    <div className="text-xs font-medium text-slate-400 uppercase tracking-wide mb-1.5">Servidores</div>
                    <div className="space-y-1">
                      {servidores.map((v: any) => (
                        <div key={v.id} className="flex items-center justify-between text-sm">
                          <span className="text-slate-700 flex items-center gap-1.5">
                            <User size={12} className="text-slate-400" />
                            {v.servidores?.nome_servico ?? 'Vago'}
                          </span>
                          <span className="badge-gray">{v.tipos_encargo?.nome}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}
