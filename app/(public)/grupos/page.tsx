import { createClient } from '@/lib/supabase/server'
import { DIA_SEMANA_LABEL, FORMATO_LABEL } from '@/lib/types'
import { MapPin, Clock, Users, Map } from 'lucide-react'
import Link from 'next/link'

export const revalidate = 300

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
      <div className="flex items-center justify-between gap-4 mb-8">
        <div>
          <h1 className="page-title mb-1">Grupos</h1>
          <p className="text-sm" style={{ color: 'var(--csa-text-2)' }}>
            {grupos.length} grupo{grupos.length !== 1 ? 's' : ''} ativo{grupos.length !== 1 ? 's' : ''} na área
          </p>
        </div>
        <Link href="/mapa" className="btn-secondary flex-shrink-0">
          <Map size={15} /> Ver mapa
        </Link>
      </div>

      {grupos.length === 0 ? (
        <div className="card text-center py-12" style={{ color: 'var(--csa-text-3)' }}>
          Nenhum grupo cadastrado ainda.
        </div>
      ) : (
        <div className="grid gap-4">
          {grupos.map((grupo: any) => {
            const reunioesAtivas = (grupo.reunioes_grupo ?? []).filter((r: any) => r.status === 'ativo')
            const servidores = (grupo.vinculos_encargo ?? []).filter((v: any) => v.status !== 'inativo')

            return (
              <Link
                key={grupo.id}
                href={`/grupos/${grupo.id}`}
                className="card hover:-translate-y-0.5 hover:shadow-md transition-all block"
              >
                {/* Header: nome + badge ativo */}
                <div className="flex items-start justify-between gap-4 mb-3">
                  <div>
                    <h2 className="font-semibold text-base" style={{ color: 'var(--csa-text-1)' }}>
                      {grupo.nome}
                    </h2>
                    <div className="flex items-center gap-1 text-sm mt-0.5" style={{ color: 'var(--csa-text-2)' }}>
                      <MapPin size={13} style={{ color: 'var(--csa-text-3)' }} />
                      <span>{grupo.bairro ? `${grupo.bairro}, ` : ''}{grupo.cidade}</span>
                    </div>
                  </div>

                  {/* Pulse dot badge */}
                  <div
                    className="flex items-center gap-1.5 px-3 py-1 rounded-full flex-shrink-0"
                    style={{ background: 'var(--csa-tint)' }}
                  >
                    <span
                      className="w-2 h-2 rounded-full flex-shrink-0"
                      style={{
                        background: 'var(--csa-accent)',
                        boxShadow: '0 0 0 3px rgba(63,90,166,0.18)',
                      }}
                    />
                    <span className="text-xs font-medium" style={{ color: 'var(--csa-accent)' }}>
                      Ativo
                    </span>
                  </div>
                </div>

                {/* Chips de reunião */}
                {reunioesAtivas.length > 0 && (
                  <div className="space-y-1.5 mb-3">
                    {reunioesAtivas.map((r: any) => (
                      <div
                        key={r.id}
                        className="flex items-center justify-between px-3 py-2.5 rounded-[10px]"
                        style={{ background: 'var(--csa-bg)' }}
                      >
                        <div className="flex items-center gap-2 text-sm min-w-0">
                          <Clock size={14} style={{ color: 'var(--csa-text-3)', flexShrink: 0 }} />
                          <span className="font-medium truncate" style={{ color: 'var(--csa-text-1)' }}>
                            {DIA_SEMANA_LABEL[r.dia_semana as keyof typeof DIA_SEMANA_LABEL]}
                          </span>
                          <span className="flex-shrink-0" style={{ color: 'var(--csa-text-2)' }}>
                            às {r.horario.slice(0, 5)}
                          </span>
                        </div>
                        <div className="flex gap-1.5 flex-shrink-0 ml-2">
                          {/* Badge de formato */}
                          {r.formato === 'presencial' ? (
                            <span className="badge" style={{ background: 'var(--csa-tint)', color: 'var(--csa-accent)' }}>
                              {FORMATO_LABEL[r.formato as keyof typeof FORMATO_LABEL]}
                            </span>
                          ) : r.formato === 'online' ? (
                            <span className="badge badge-blue">
                              {FORMATO_LABEL[r.formato as keyof typeof FORMATO_LABEL]}
                            </span>
                          ) : (
                            <span className="badge badge-gray">
                              {FORMATO_LABEL[r.formato as keyof typeof FORMATO_LABEL]}
                            </span>
                          )}
                          {/* Badge de tipo */}
                          <span className={r.tipo === 'aberta' ? 'badge badge-green' : 'badge badge-gray'}>
                            {r.tipo === 'aberta' ? 'Aberta' : 'Fechada'}
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                )}

                {/* Rodapé: servidores */}
                <div className="flex items-center gap-1.5 text-xs" style={{ color: 'var(--csa-text-3)' }}>
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
