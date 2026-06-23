import { createClient } from '@/lib/supabase/server'
import { createServiceClient } from '@/lib/supabase/server'
import { DIA_SEMANA_LABEL, FORMATO_LABEL, TIPO_REUNIAO_LABEL } from '@/lib/types'
import { MapPin, Clock, User, ArrowLeft, ExternalLink, CalendarDays, BookOpen } from 'lucide-react'
import Link from 'next/link'
import { notFound } from 'next/navigation'
import AccordionSection from '@/components/ui/AccordionSection'

export const revalidate = 300

async function getGrupo(id: string) {
  const supabase = await createClient()
  const { data, error } = await supabase
    .from('grupos')
    .select(`
      *,
      reunioes_grupo(*),
      vinculos_encargo(*, servidores(*), tipos_encargo(*)),
      eventos(*, tipos_evento(*))
    `)
    .eq('id', id)
    .eq('status', 'ativo')
    .single()
  if (error) return null
  return data
}

async function getAtasRecentes(grupoId: string) {
  const supabase = createServiceClient()
  const { data } = await supabase
    .from('atas_grupo')
    .select('id, numero_reuniao, data_reuniao, secretario, coordenador, tipo_reuniao, saldo_atual')
    .eq('grupo_id', grupoId)
    .order('data_reuniao', { ascending: false })
    .limit(5)
  return data ?? []
}

async function getTotalAtas(grupoId: string) {
  const supabase = createServiceClient()
  const { count } = await supabase
    .from('atas_grupo')
    .select('id', { count: 'exact', head: true })
    .eq('grupo_id', grupoId)
  return count ?? 0
}

async function getContagensPresenca(ataIds: string[]) {
  if (ataIds.length === 0) return {} as Record<string, number>
  const supabase = createServiceClient()
  const { data } = await supabase.from('ata_presencas').select('ata_id').in('ata_id', ataIds)
  const contagens: Record<string, number> = {}
  for (const p of data ?? []) {
    contagens[p.ata_id] = (contagens[p.ata_id] ?? 0) + 1
  }
  return contagens
}

export default async function GrupoDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const grupo = await getGrupo(id)
  if (!grupo) notFound()

  const reunioesAtivas = (grupo.reunioes_grupo ?? []).filter((r: any) => r.status === 'ativo')
  const servidores = (grupo.vinculos_encargo ?? []).filter((v: any) => v.status !== 'inativo')
  const proximosEventos = (grupo.eventos ?? [])
    .filter((e: any) => e.status === 'publicado' && e.data_evento >= new Date().toISOString().split('T')[0])
    .sort((a: any, b: any) => a.data_evento.localeCompare(b.data_evento))
    .slice(0, 5)

  const [atasRecentes, totalAtas] = await Promise.all([
    getAtasRecentes(id),
    getTotalAtas(id),
  ])
  const contagensPresenca = await getContagensPresenca(atasRecentes.map((a: any) => a.id))

  return (
    <div>
      <Link href="/grupos" className="inline-flex items-center gap-1 text-sm text-slate-500 hover:text-slate-900 mb-6 transition-colors">
        <ArrowLeft size={15} /> Voltar para grupos
      </Link>

      <div className="mb-6">
        <h1 className="page-title mb-1">{grupo.nome}</h1>
        <div className="flex items-center gap-1.5 text-slate-500 text-sm">
          <MapPin size={14} />
          <span>{[grupo.bairro, grupo.cidade].filter(Boolean).join(', ')}</span>
        </div>
        {grupo.endereco && (
          <p className="text-slate-400 text-sm mt-0.5 ml-5">{grupo.endereco}</p>
        )}
      </div>

      <div className="grid gap-4">
        {/* Reuniões */}
        <div className="card">
          <h2 className="section-title mb-4 flex items-center gap-2">
            <Clock size={16} className="text-blue-500" /> Reuniões
          </h2>
          {reunioesAtivas.length === 0 ? (
            <p className="text-slate-400 text-sm">Nenhuma reunião ativa.</p>
          ) : (
            <div className="space-y-3">
              {reunioesAtivas.map((r: any) => (
                <div key={r.id} className="flex flex-col gap-1 p-3 bg-slate-50 rounded-lg">
                  <div className="flex items-center justify-between gap-2">
                    <span className="font-medium text-slate-800 text-sm">
                      {DIA_SEMANA_LABEL[r.dia_semana as keyof typeof DIA_SEMANA_LABEL]} às {r.horario.slice(0,5)}
                    </span>
                    <div className="flex gap-1.5">
                      <span className={r.tipo === 'aberta' ? 'badge-green' : 'badge-gray'}>
                        {TIPO_REUNIAO_LABEL[r.tipo as keyof typeof TIPO_REUNIAO_LABEL]}
                      </span>
                      <span className="badge-blue">
                        {FORMATO_LABEL[r.formato as keyof typeof FORMATO_LABEL]}
                      </span>
                    </div>
                  </div>
                  {r.endereco_link && r.formato === 'presencial' && (
                    <span className="text-slate-500 text-xs">{r.endereco_link}</span>
                  )}
                  {r.endereco_link && r.formato !== 'presencial' && (
                    <a href={r.endereco_link} target="_blank" rel="noopener noreferrer"
                      className="text-blue-600 text-xs inline-flex items-center gap-1 hover:underline">
                      Acessar link <ExternalLink size={11} />
                    </a>
                  )}
                  {r.observacoes && <p className="text-slate-400 text-xs">{r.observacoes}</p>}
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Servidores */}
        <div className="card">
          <h2 className="section-title mb-4 flex items-center gap-2">
            <User size={16} className="text-blue-500" /> Servidores
          </h2>
          {servidores.length === 0 ? (
            <p className="text-slate-400 text-sm">Nenhum servidor em exercício.</p>
          ) : (
            <div className="divide-y divide-slate-100">
              {servidores.map((v: any) => (
                <div key={v.id} className="py-2.5 flex items-center justify-between gap-3">
                  <div>
                    <div className="text-sm font-medium text-slate-800">
                      {v.servidores?.nome_servico ?? '—'}
                    </div>
                    {v.servidores?.contato_publico && v.servidores?.contato && (
                      <div className="text-xs text-slate-400">{v.servidores.contato}</div>
                    )}
                  </div>
                  <span className="badge-gray text-xs">{v.tipos_encargo?.nome}</span>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Próximos eventos */}
        {proximosEventos.length > 0 && (
          <div className="card">
            <h2 className="section-title mb-4 flex items-center gap-2">
              <CalendarDays size={16} className="text-blue-500" /> Próximos eventos
            </h2>
            <div className="space-y-2">
              {proximosEventos.map((e: any) => (
                <div key={e.id} className="p-3 bg-slate-50 rounded-lg">
                  <div className="font-medium text-slate-800 text-sm">{e.titulo}</div>
                  <div className="text-xs text-slate-500 mt-0.5">
                    {new Date(e.data_evento + 'T12:00:00').toLocaleDateString('pt-BR', { weekday: 'long', day: '2-digit', month: 'long' })}
                    {e.horario && ` às ${e.horario.slice(0,5)}`}
                    {e.local_link && ` · ${e.local_link}`}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Atas de reunião */}
        {(atasRecentes.length > 0) && (
          <div className="card">
            <AccordionSection title="Atas de reunião" defaultOpen={false}>
              <div className="space-y-3">
                {atasRecentes.map((ata: any) => {
                  const totalPresencas = (contagensPresenca[ata.id] ?? 0) + 1
                  return (
                    <div key={ata.id} className="p-3 rounded-lg" style={{ background: 'var(--csa-tint)', border: '1px solid var(--csa-tint-border)' }}>
                      <div className="flex items-start justify-between gap-2 flex-wrap">
                        <div>
                          <p className="font-medium text-sm" style={{ color: 'var(--csa-text-1)', textTransform: 'capitalize' }}>
                            {new Date(ata.data_reuniao + 'T12:00:00').toLocaleDateString('pt-BR', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })}
                          </p>
                          <p className="text-xs mt-0.5" style={{ color: 'var(--csa-text-3)' }}>
                            Reunião Nº {ata.numero_reuniao} · {totalPresencas} presente{totalPresencas !== 1 ? 's' : ''}
                          </p>
                        </div>
                        <span className={`badge-${ata.tipo_reuniao === 'aberta' ? 'green' : 'gray'} text-xs self-start`}>
                          {ata.tipo_reuniao === 'aberta' ? 'Aberta' : 'Fechada'}
                        </span>
                      </div>
                      <div className="flex items-center justify-between mt-2 flex-wrap gap-2">
                        <div className="text-xs" style={{ color: 'var(--csa-text-2)' }}>
                          Sec.: {ata.secretario} · Coord.: {ata.coordenador}
                        </div>
                        <Link
                          href={`/atas/${ata.id}`}
                          className="text-xs font-medium"
                          style={{ color: 'var(--csa-accent)' }}
                        >
                          Ver detalhes →
                        </Link>
                      </div>
                    </div>
                  )
                })}
              </div>
              {totalAtas > 5 && (
                <div className="mt-4">
                  <Link
                    href={`/grupos/${id}/atas`}
                    className="btn-secondary text-sm"
                    style={{ display: 'inline-flex' }}
                  >
                    <BookOpen size={14} /> Ver todas as atas ({totalAtas})
                  </Link>
                </div>
              )}
            </AccordionSection>
          </div>
        )}
      </div>
    </div>
  )
}
