import { createServiceClient } from '@/lib/supabase/server'
import Link from 'next/link'
import { ArrowLeft, BookOpen } from 'lucide-react'
import { notFound } from 'next/navigation'

export const revalidate = 300

interface SearchParams { pagina?: string }

async function getGrupo(id: string) {
  const supabase = createServiceClient()
  const { data } = await supabase
    .from('grupos')
    .select('id, nome')
    .eq('id', id)
    .eq('status', 'ativo')
    .maybeSingle()
  return data
}

const POR_PAGINA = 20

async function getAtas(grupoId: string, pagina: number) {
  const supabase = createServiceClient()
  const from = (pagina - 1) * POR_PAGINA
  const to   = from + POR_PAGINA - 1

  const [atasRes, countRes] = await Promise.all([
    supabase
      .from('atas_grupo')
      .select('id, numero_reuniao, data_reuniao, secretario, coordenador, tipo_reuniao, saldo_atual')
      .eq('grupo_id', grupoId)
      .order('data_reuniao', { ascending: false })
      .range(from, to),
    supabase
      .from('atas_grupo')
      .select('id', { count: 'exact', head: true })
      .eq('grupo_id', grupoId),
  ])

  const atas  = atasRes.data ?? []
  const total = countRes.count ?? 0

  // Contagens de presença
  const ataIds = atas.map(a => a.id)
  let contagens: Record<string, number> = {}
  if (ataIds.length > 0) {
    const { data: pr } = await supabase.from('ata_presencas').select('ata_id').in('ata_id', ataIds)
    for (const p of pr ?? []) contagens[p.ata_id] = (contagens[p.ata_id] ?? 0) + 1
  }

  return { atas, total, contagens }
}

export default async function GrupoAtasPage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>
  searchParams: Promise<SearchParams>
}) {
  const { id }    = await params
  const sp        = await searchParams
  const pagina    = Math.max(1, Number(sp.pagina ?? '1'))
  const [grupo, { atas, total, contagens }] = await Promise.all([
    getGrupo(id),
    getAtas(id, pagina),
  ])

  if (!grupo) notFound()

  const totalPaginas = Math.ceil(total / POR_PAGINA)
  const fmtData = (d: string) =>
    new Date(d + 'T12:00:00').toLocaleDateString('pt-BR', {
      weekday: 'long', day: 'numeric', month: 'long', year: 'numeric',
    })

  return (
    <div>
      <Link
        href={`/grupos/${id}`}
        className="inline-flex items-center gap-1 text-sm text-slate-500 hover:text-slate-900 mb-6 transition-colors"
      >
        <ArrowLeft size={15} /> Voltar para {grupo.nome}
      </Link>

      <div className="mb-6">
        <h1 className="page-title mb-1">Atas de reunião</h1>
        <p className="text-slate-500 text-sm">{grupo.nome} · {total} ata{total !== 1 ? 's' : ''} registrada{total !== 1 ? 's' : ''}</p>
      </div>

      {atas.length === 0 ? (
        <div className="card text-center py-12">
          <BookOpen size={40} className="text-slate-300 mx-auto mb-3" />
          <p className="text-slate-500">Nenhuma ata registrada ainda</p>
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          {atas.map((ata: any) => {
            const totalPresencas = (contagens[ata.id] ?? 0) + 1
            return (
              <div key={ata.id} className="card">
                <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 12, flexWrap: 'wrap' }}>
                  <div style={{ flex: 1 }}>
                    <p style={{ fontWeight: 600, color: 'var(--csa-text-1)', textTransform: 'capitalize', marginBottom: 2 }}>
                      {fmtData(ata.data_reuniao)}
                    </p>
                    <p style={{ fontSize: 13, color: 'var(--csa-text-3)' }}>
                      Reunião Nº {ata.numero_reuniao} · {totalPresencas} presente{totalPresencas !== 1 ? 's' : ''}
                    </p>
                    <p style={{ fontSize: 13, color: 'var(--csa-text-2)', marginTop: 4 }}>
                      Sec.: {ata.secretario} · Coord.: {ata.coordenador}
                    </p>
                  </div>
                  <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: 8 }}>
                    <span className={`badge-${ata.tipo_reuniao === 'aberta' ? 'green' : 'gray'}`}>
                      {ata.tipo_reuniao === 'aberta' ? 'Aberta' : 'Fechada'}
                    </span>
                    <Link
                      href={`/atas/${ata.id}`}
                      style={{ fontSize: 13, fontWeight: 500, color: 'var(--csa-accent)' }}
                    >
                      Ver detalhes →
                    </Link>
                  </div>
                </div>
              </div>
            )
          })}
        </div>
      )}

      {/* Paginação */}
      {totalPaginas > 1 && (
        <div style={{ display: 'flex', justifyContent: 'center', gap: 8, marginTop: 24, flexWrap: 'wrap' }}>
          {pagina > 1 && (
            <Link href={`/grupos/${id}/atas?pagina=${pagina - 1}`} className="btn-secondary">← Anterior</Link>
          )}
          <span style={{ padding: '8px 16px', fontSize: 14, color: 'var(--csa-text-2)', alignSelf: 'center' }}>
            Página {pagina} de {totalPaginas}
          </span>
          {pagina < totalPaginas && (
            <Link href={`/grupos/${id}/atas?pagina=${pagina + 1}`} className="btn-secondary">Próxima →</Link>
          )}
        </div>
      )}
    </div>
  )
}
