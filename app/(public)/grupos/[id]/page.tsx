import { createClient } from '@/lib/supabase/server'
import { DIA_SEMANA_LABEL, FORMATO_LABEL, TIPO_REUNIAO_LABEL } from '@/lib/types'
import { MapPin, Clock, User, ArrowLeft, ExternalLink, CalendarDays } from 'lucide-react'
import Link from 'next/link'
import { notFound } from 'next/navigation'

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
      </div>
    </div>
  )
}
