import { createClient } from '@/lib/supabase/server'
import { UserCheck, FileText } from 'lucide-react'
import AccordionSection from '@/components/ui/AccordionSection'
import DashboardArea from '@/components/public/DashboardArea'

export const revalidate = 300

const STORAGE_URL = 'https://ehbosnplrsixaloivtbe.supabase.co/storage/v1/object/public/atas'

/* ── Fetches ─────────────────────────────────────────────── */
async function getDashboardData() {
  const supabase = await createClient()
  const [gruposR, subcomitesR, servidoresR, reunioesR] = await Promise.all([
    supabase.from('grupos').select('cidade').eq('status', 'ativo'),
    supabase.from('subcomites').select('id', { count: 'exact', head: true }).eq('status', 'ativo'),
    supabase.from('servidores').select('id', { count: 'exact', head: true }).eq('status', 'ativo'),
    supabase.from('reunioes_grupo').select('dia_semana').eq('status', 'ativo'),
  ])

  const gruposData = gruposR.data ?? []
  const cidadeMap: Record<string, number> = {}
  for (const g of gruposData) {
    const cidade = (g.cidade as string | null) ?? 'Sem cidade'
    cidadeMap[cidade] = (cidadeMap[cidade] ?? 0) + 1
  }
  let gruposPorCidade = Object.entries(cidadeMap)
    .map(([cidade, grupos]) => ({ cidade, grupos }))
    .sort((a, b) => b.grupos - a.grupos)
  if (gruposPorCidade.length > 8) {
    const top8 = gruposPorCidade.slice(0, 8)
    const outrasCount = gruposPorCidade.slice(8).reduce((sum, c) => sum + c.grupos, 0)
    gruposPorCidade = [...top8, { cidade: 'Outras cidades', grupos: outrasCount }]
  }

  return {
    totalGrupos:     gruposData.length,
    totalSubcomites: subcomitesR.count ?? 0,
    totalServidores: servidoresR.count ?? 0,
    reunioes:        (reunioesR.data   ?? []) as { dia_semana: string }[],
    gruposPorCidade,
  }
}

async function getMesa() {
  const supabase = await createClient()
  const { data } = await supabase
    .from('vinculos_encargo')
    .select('*, servidores(*), tipos_encargo(*)')
    .eq('mesa_area', true)
    .neq('status', 'inativo')
    .order('criado_em')
  return data ?? []
}

async function getAtas() {
  const supabase = await createClient()
  const { data } = await supabase
    .from('atas_reuniao')
    .select('*')
    .order('data_reuniao', { ascending: false })
  return data ?? []
}

/* ── Helpers ─────────────────────────────────────────────── */
function fmtAtaDate(d: string) {
  return new Date(d + 'T12:00:00').toLocaleDateString('pt-BR', { month: 'long', year: 'numeric' })
}

/* ── Page ────────────────────────────────────────────────── */
export default async function DadosDaAreaPage() {
  const [dash, mesa, atas] = await Promise.all([getDashboardData(), getMesa(), getAtas()])

  return (
    <div>
      <div className="mb-8">
        <h1 className="page-title mb-1">Dados da Área</h1>
        <p className="text-sm" style={{ color: 'var(--csa-text-2)' }}>
          Visão geral, servidores e documentos do CSA Liberdade
        </p>
      </div>

      {/* ── Seção 1: Dashboard ─────────────────────────────── */}
      <AccordionSection title="Dashboard da Área">
        <DashboardArea
          totalGrupos={dash.totalGrupos}
          totalSubcomites={dash.totalSubcomites}
          totalServidores={dash.totalServidores}
          reunioes={dash.reunioes}
          gruposPorCidade={dash.gruposPorCidade}
        />
      </AccordionSection>

      {/* ── Seção 2: Servidores da Mesa ────────────────────── */}
      <AccordionSection title="Servidores da Mesa">
        <div className="card">
          {mesa.length === 0 ? (
            <div className="text-center py-10 text-sm" style={{ color: 'var(--csa-text-3)' }}>
              Nenhum encargo cadastrado.
            </div>
          ) : (
            <div style={{ borderTop: '1px solid var(--csa-border)' }}>
              {(mesa as any[]).map(v => {
                const vago = v.status === 'vago' || !v.servidores
                return (
                  <div
                    key={v.id}
                    className="py-4 flex items-center justify-between gap-4"
                    style={{ borderBottom: '1px solid var(--csa-border)' }}
                  >
                    <div className="flex items-center gap-3">
                      <div
                        className="w-9 h-9 rounded-full flex items-center justify-center flex-shrink-0"
                        style={{ background: vago ? 'var(--csa-border)' : 'var(--csa-tint)' }}
                      >
                        <UserCheck size={16} style={{ color: vago ? 'var(--csa-text-3)' : 'var(--csa-accent)' }} />
                      </div>
                      <div>
                        <div className="text-sm font-medium" style={{ color: 'var(--csa-text-1)' }}>
                          {v.tipos_encargo?.nome}
                        </div>
                        <div className="text-sm" style={{ color: vago ? 'var(--csa-text-3)' : 'var(--csa-text-2)', fontStyle: vago ? 'italic' : 'normal' }}>
                          {vago ? 'Vago' : v.servidores?.nome_servico}
                        </div>
                        {!vago && v.servidores?.contato_publico && v.servidores?.contato && (
                          <div className="text-xs" style={{ color: 'var(--csa-text-3)' }}>{v.servidores.contato}</div>
                        )}
                      </div>
                    </div>
                    {vago
                      ? <span className="badge badge-yellow">Vago</span>
                      : <span className="badge badge-green">Em serviço</span>
                    }
                  </div>
                )
              })}
            </div>
          )}
        </div>
      </AccordionSection>

      {/* ── Seção 3: Atas ──────────────────────────────────── */}
      <AccordionSection title="Atas das Reuniões de Serviço">
        {atas.length === 0 ? (
          <div className="card text-center py-12">
            <FileText size={32} className="mx-auto mb-3" style={{ color: 'var(--csa-border)' }} />
            <p className="text-sm" style={{ color: 'var(--csa-text-3)' }}>
              Nenhuma ata disponível no momento.
            </p>
          </div>
        ) : (
          <div className="grid gap-3">
            {(atas as any[]).map(ata => (
              <div key={ata.id} className="card flex gap-4 items-start" style={{ borderRadius: 16 }}>
                <FileText size={20} style={{ color: 'var(--csa-accent)', flexShrink: 0, marginTop: 2 }} />
                <div className="flex-1 min-w-0">
                  <div className="font-semibold mb-0.5" style={{ color: 'var(--csa-text-1)' }}>
                    {ata.titulo}
                  </div>
                  <div className="text-sm capitalize mb-1" style={{ color: 'var(--csa-text-3)' }}>
                    {fmtAtaDate(ata.data_reuniao)}
                  </div>
                  {ata.descricao && (
                    <p className="text-sm mb-2" style={{ color: 'var(--csa-text-2)' }}>{ata.descricao}</p>
                  )}
                  <div className="flex gap-2 mt-2">
                    <a
                      href={`${STORAGE_URL}/${ata.storage_path}`}
                      target="_blank" rel="noopener noreferrer"
                      className="btn-secondary text-xs py-1.5 px-3"
                    >
                      Visualizar
                    </a>
                    <a
                      href={`${STORAGE_URL}/${ata.storage_path}`}
                      download={ata.arquivo_nome}
                      className="btn-secondary text-xs py-1.5 px-3"
                    >
                      Baixar
                    </a>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </AccordionSection>
    </div>
  )
}
