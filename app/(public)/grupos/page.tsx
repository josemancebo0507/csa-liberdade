import { createClient } from '@/lib/supabase/server'
import { DIA_SEMANA_LABEL, FORMATO_LABEL } from '@/lib/types'
import { MapPin, Clock, Users } from 'lucide-react'
import Link from 'next/link'

export const revalidate = 300 // revalida a cada 5 minutos

async function getGrupos() {
  const supabase = await createClient()
  const { data } = await supabase
    .from('grupos')
    .select(`*, reunioes_grupo(*), vinculos_encargo(*, servidores(*), tipos_encargo(*))`)
    .eq('status', 'ativo')
    .order('nome')
  return data ?? []
}

export default async function GruposPage() {
  const grupos = await getGrupos()

  return (
    <div>
      <div className="mb-8">
        <h1 className="page-title mb-1">Grupos</h1>
        <p className="text-slate-500 text-sm">{grupos.length} grupo{grupos.length !== 1 ? 's' : ''} ativo{grupos.length !== 1 ? 's' : ''} na área</p>
      </div>

      {grupos.length === 0 ? (
        <div className="card text-center py-12 text-slate-400">
          Nenhum grupo cadastrado ainda.
        </div>
      ) : (
        <div className="grid gap-4">
          {grupos.map((grupo: any) => {
            const reunioesAtivas = (grupo.reunioes_grupo ?? []).filter((r: any) => r.status === 'ativo')
            const servidores = (grupo.vinculos_encargo ?? []).filter((v: any) => v.status !== 'inativo')

            return (
              <Link key={grupo.id} href={`/grupos/${grupo.id}`} className="card hover:shadow-md transition-shadow block">
                <div className="flex items-start justify-between gap-4 mb-3">
                  <div>
                    <h2 className="font-semibold text-slate-900 text-base">{grupo.nome}</h2>
                    <div className="flex items-center gap-1 text-slate-500 text-sm mt-0.5">
                      <MapPin size={13} />
                      <span>{grupo.bairro ? `${grupo.bairro}, ` : ''}{grupo.cidade}</span>
                    </div>
                  </div>
                  <span className="badge-blue flex-shrink-0">Ativo</span>
                </div>

                {reunioesAtivas.length > 0 && (
                  <div className="space-y-1 mb-3">
                    {reunioesAtivas.map((r: any) => (
                      <div key={r.id} className="flex items-center gap-2 text-sm text-slate-600">
                        <Clock size={13} className="text-slate-400 flex-shrink-0" />
                        <span>
                          {DIA_SEMANA_LABEL[r.dia_semana as keyof typeof DIA_SEMANA_LABEL]} às {r.horario.slice(0,5)}
                          <span className="text-slate-400 mx-1">·</span>
                          <span className="capitalize">{FORMATO_LABEL[r.formato as keyof typeof FORMATO_LABEL]}</span>
                          {r.tipo === 'aberta' && <span className="badge-green ml-1.5">Aberta</span>}
                          {r.tipo === 'fechada' && <span className="badge-gray ml-1.5">Fechada</span>}
                        </span>
                      </div>
                    ))}
                  </div>
                )}

                <div className="flex items-center gap-1.5 text-xs text-slate-400">
                  <Users size={12} />
                  <span>{servidores.length} servidor{servidores.length !== 1 ? 'es' : ''} em serviço</span>
                </div>
              </Link>
            )
          })}
        </div>
      )}
    </div>
  )
}
