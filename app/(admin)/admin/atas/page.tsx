import { createAdminClient } from '@/lib/supabase/server'
import { createServiceClient } from '@/lib/supabase/server'
import Link from 'next/link'
import { BookOpen, Plus, Eye } from 'lucide-react'

interface SearchParams { grupo?: string; de?: string; ate?: string }

async function getAtas(params: SearchParams) {
  const supabase = createServiceClient()

  let q = supabase
    .from('atas_grupo')
    .select(`
      id, numero_reuniao, data_reuniao, secretario, saldo_atual, tipo_reuniao,
      grupos(nome)
    `)
    .order('data_reuniao', { ascending: false })

  if (params.grupo) q = q.eq('grupo_id', params.grupo)
  if (params.de)    q = q.gte('data_reuniao', params.de)
  if (params.ate)   q = q.lte('data_reuniao', params.ate)

  const { data: atas } = await q.limit(100)

  // Contagens de presença por ata
  const ataIds = (atas ?? []).map(a => a.id)
  let contagens: Record<string, number> = {}
  if (ataIds.length > 0) {
    const { data: prList } = await supabase
      .from('ata_presencas')
      .select('ata_id')
      .in('ata_id', ataIds)
    for (const p of prList ?? []) {
      contagens[p.ata_id] = (contagens[p.ata_id] ?? 0) + 1
    }
  }

  return { atas: atas ?? [], contagens }
}

async function getGrupos() {
  const supabase = createServiceClient()
  const { data } = await supabase.from('grupos').select('id, nome').eq('status', 'ativo').order('nome')
  return data ?? []
}

export default async function AtasAdminPage({
  searchParams,
}: {
  searchParams: Promise<SearchParams>
}) {
  const params = await searchParams
  const [{ atas, contagens }, grupos] = await Promise.all([getAtas(params), getGrupos()])

  const fmt = (v: number | null) =>
    (v ?? 0).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })
  const fmtData = (d: string) =>
    new Date(d + 'T12:00:00').toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit', year: 'numeric' })

  return (
    <div>
      <div className="flex items-start justify-between mb-6">
        <div>
          <h1 className="page-title mb-1">Atas de reunião</h1>
          <p className="text-slate-500 text-sm">Histórico de reuniões registradas</p>
        </div>
        <Link href="/admin/atas/nova" className="btn-primary">
          <Plus size={15} /> Nova ata
        </Link>
      </div>

      {/* Filtros */}
      <form method="GET" className="card mb-6 flex flex-wrap gap-3 items-end">
        <div className="flex-1 min-w-36">
          <label className="form-label">Grupo</label>
          <select name="grupo" className="form-select" defaultValue={params.grupo ?? ''}>
            <option value="">Todos os grupos</option>
            {grupos.map(g => <option key={g.id} value={g.id}>{g.nome}</option>)}
          </select>
        </div>
        <div>
          <label className="form-label">De</label>
          <input type="date" name="de" className="form-input" defaultValue={params.de ?? ''} />
        </div>
        <div>
          <label className="form-label">Até</label>
          <input type="date" name="ate" className="form-input" defaultValue={params.ate ?? ''} />
        </div>
        <button type="submit" className="btn-secondary">Filtrar</button>
        {(params.grupo || params.de || params.ate) && (
          <Link href="/admin/atas" className="btn-secondary">Limpar</Link>
        )}
      </form>

      {atas.length === 0 ? (
        <div className="card text-center py-12">
          <BookOpen size={40} className="text-slate-300 mx-auto mb-3" />
          <p className="text-slate-500 font-medium">Nenhuma ata encontrada</p>
          <p className="text-slate-400 text-sm mt-1">Registre a ata da próxima reunião</p>
          <Link href="/admin/atas/nova" className="btn-primary mt-4 inline-flex">
            <Plus size={15} /> Nova ata
          </Link>
        </div>
      ) : (
        <div className="card overflow-hidden p-0">
          <div className="overflow-x-auto">
            <table style={{ width: '100%', borderCollapse: 'collapse' }}>
              <thead>
                <tr style={{ background: 'var(--csa-tint)', borderBottom: '1px solid var(--csa-border)' }}>
                  {['Data', 'Grupo', 'Nº Reunião', 'Secretário', 'Presenças', 'Saldo', ''].map(h => (
                    <th key={h} style={{
                      padding: '10px 16px', textAlign: 'left', fontSize: 13,
                      fontWeight: 600, color: 'var(--csa-text-2)', whiteSpace: 'nowrap',
                    }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {atas.map((ata: any, i: number) => (
                  <tr
                    key={ata.id}
                    style={{
                      borderBottom: '1px solid var(--csa-border)',
                      background: i % 2 === 0 ? 'var(--csa-surface)' : 'var(--csa-tint)',
                    }}
                  >
                    <td style={{ padding: '10px 16px', fontSize: 14, fontWeight: 500, color: 'var(--csa-text-1)', whiteSpace: 'nowrap' }}>
                      {fmtData(ata.data_reuniao)}
                    </td>
                    <td style={{ padding: '10px 16px', fontSize: 14, color: 'var(--csa-text-1)' }}>
                      {ata.grupos?.nome ?? '—'}
                    </td>
                    <td style={{ padding: '10px 16px', fontSize: 14, color: 'var(--csa-text-2)' }}>
                      #{ata.numero_reuniao}
                    </td>
                    <td style={{ padding: '10px 16px', fontSize: 14, color: 'var(--csa-text-2)' }}>
                      {ata.secretario}
                    </td>
                    <td style={{ padding: '10px 16px', fontSize: 14, color: 'var(--csa-text-2)' }}>
                      {(contagens[ata.id] ?? 0) + 1} {/* +1 Poder Superior */}
                    </td>
                    <td style={{ padding: '10px 16px', fontSize: 14, fontWeight: 500, color: ata.saldo_atual >= 0 ? '#15803d' : '#dc2626', whiteSpace: 'nowrap' }}>
                      {fmt(ata.saldo_atual)}
                    </td>
                    <td style={{ padding: '10px 16px' }}>
                      <Link
                        href={`/admin/atas/${ata.id}`}
                        style={{ display: 'inline-flex', alignItems: 'center', gap: 4, fontSize: 13, color: 'var(--csa-accent)', textDecoration: 'none', fontWeight: 500 }}
                      >
                        <Eye size={14} /> Ver
                      </Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  )
}
