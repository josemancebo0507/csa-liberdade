import { createServiceClient } from '@/lib/supabase/server'
import Link from 'next/link'
import { ArrowLeft } from 'lucide-react'
import { notFound } from 'next/navigation'
import PrintButton from '@/components/admin/PrintButton'

async function getAta(id: string) {
  const supabase = createServiceClient()
  const { data, error } = await supabase
    .from('atas_grupo')
    .select(`
      *,
      grupos(id, nome),
      ata_presencas(*),
      ata_ingressos(*),
      ata_trocas_ficha(*)
    `)
    .eq('id', id)
    .single()
  if (error) return null
  return data
}

export default async function AtaAdminDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const ata = await getAta(id)
  if (!ata) notFound()

  const membros    = (ata.ata_presencas ?? []).filter((p: any) => !p.visitante).sort((a: any, b: any) => a.numero - b.numero)
  const visitantes = (ata.ata_presencas ?? []).filter((p: any) => p.visitante).sort((a: any, b: any) => a.numero - b.numero)

  const fmtData = (d: string) =>
    new Date(d + 'T12:00:00').toLocaleDateString('pt-BR', {
      weekday: 'long', day: 'numeric', month: 'long', year: 'numeric',
    })
  const fmtMoeda = (v: number) =>
    v.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })

  const encargosMap = [
    { label: 'RSG',           valor: ata.encargo_rsg },
    { label: 'RSG Suplente',  valor: ata.encargo_rsg_suplente },
    { label: 'Secretário(a)', valor: ata.encargo_secretario },
    { label: 'Tesoureiro(a)', valor: ata.encargo_tesoureiro },
    { label: 'Bem Estar',     valor: ata.encargo_bem_estar },
  ].filter(e => e.valor)

  return (
    <div>
      <div className="flex items-center justify-between mb-6 flex-wrap gap-3">
        <Link href="/admin/atas" className="inline-flex items-center gap-1 text-sm text-slate-500 hover:text-slate-900 transition-colors">
          <ArrowLeft size={15} /> Voltar para atas
        </Link>
        <PrintButton />
      </div>

      <div className="mb-6">
        <div className="flex items-start gap-3 flex-wrap">
          <div>
            <h1 className="page-title mb-1">{ata.grupos?.nome}</h1>
            <p className="text-slate-500 text-sm" style={{ textTransform: 'capitalize' }}>
              Reunião Nº {ata.numero_reuniao} — {fmtData(ata.data_reuniao)}
            </p>
          </div>
          <span className={`badge-${ata.tipo_reuniao === 'aberta' ? 'green' : 'gray'} self-start`}>
            {ata.tipo_reuniao === 'aberta' ? 'Aberta' : 'Fechada'}
          </span>
        </div>
      </div>

      <div style={{ display: 'grid', gap: 16 }}>
        {/* Identificação */}
        <div className="card">
          <h2 className="section-title mb-4">Identificação</h2>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: 16 }}>
            <div>
              <p style={{ fontSize: 12, color: 'var(--csa-text-3)', marginBottom: 2 }}>Secretário(a)</p>
              <p style={{ fontWeight: 500, color: 'var(--csa-text-1)' }}>{ata.secretario}</p>
            </div>
            <div>
              <p style={{ fontSize: 12, color: 'var(--csa-text-3)', marginBottom: 2 }}>Coordenador(a)</p>
              <p style={{ fontWeight: 500, color: 'var(--csa-text-1)' }}>{ata.coordenador}</p>
            </div>
            {ata.literatura_lida && (
              <div>
                <p style={{ fontSize: 12, color: 'var(--csa-text-3)', marginBottom: 2 }}>Literatura lida</p>
                <p style={{ color: 'var(--csa-text-1)' }}>{ata.literatura_lida}</p>
              </div>
            )}
          </div>
        </div>

        {/* Presenças */}
        <div className="card">
          <h2 className="section-title mb-4">
            Presenças — {membros.length + 1 + visitantes.length} total
          </h2>
          <div style={{ marginBottom: visitantes.length > 0 ? 16 : 0 }}>
            <p style={{ fontSize: 13, fontWeight: 600, color: 'var(--csa-text-2)', marginBottom: 8 }}>
              Membros ({membros.length + 1})
            </p>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
              <div style={{ display: 'flex', gap: 12, padding: '6px 10px', background: '#fef9c3', borderRadius: 8 }}>
                <span style={{ width: 28, fontWeight: 700, color: '#92400e', fontSize: 13 }}>01</span>
                <span style={{ color: '#92400e', fontWeight: 500, fontSize: 14 }}>Poder Superior</span>
              </div>
              {membros.map((m: any) => (
                <div key={m.id} style={{ display: 'flex', gap: 12, padding: '6px 10px', borderRadius: 8, background: 'var(--csa-tint)' }}>
                  <span style={{ width: 28, fontWeight: 700, color: 'var(--csa-text-3)', fontSize: 13 }}>
                    {String(m.numero).padStart(2, '0')}
                  </span>
                  <span style={{ color: 'var(--csa-text-1)', fontSize: 14 }}>{m.nome}</span>
                </div>
              ))}
            </div>
          </div>
          {visitantes.length > 0 && (
            <div>
              <p style={{ fontSize: 13, fontWeight: 600, color: 'var(--csa-text-2)', marginBottom: 8 }}>
                Visitantes ({visitantes.length})
              </p>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
                {visitantes.map((v: any) => (
                  <div key={v.id} style={{ display: 'flex', gap: 12, padding: '6px 10px', borderRadius: 8, background: 'var(--csa-tint)' }}>
                    <span style={{ width: 28, fontWeight: 700, color: 'var(--csa-text-3)', fontSize: 13 }}>
                      V{String(v.numero).padStart(2, '0')}
                    </span>
                    <span style={{ color: 'var(--csa-text-1)', fontSize: 14 }}>{v.nome}</span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Ingressos */}
        {ata.ata_ingressos?.length > 0 && (
          <div className="card">
            <h2 className="section-title mb-4">Ingressos ({ata.ata_ingressos.length})</h2>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
              {ata.ata_ingressos.map((ing: any) => (
                <div key={ing.id} style={{ padding: '10px 14px', background: 'var(--csa-tint)', borderRadius: 10 }}>
                  <p style={{ fontWeight: 600, color: 'var(--csa-text-1)' }}>{ing.nome_ingresso}</p>
                  <p style={{ fontSize: 13, color: 'var(--csa-text-2)' }}>Padrinho/Madrinha: {ing.nome_padrinho}</p>
                  {ing.como_conheceu && <p style={{ fontSize: 12, color: 'var(--csa-text-3)' }}>{ing.como_conheceu}</p>}
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Trocas de ficha */}
        {ata.ata_trocas_ficha?.length > 0 && (
          <div className="card">
            <h2 className="section-title mb-4">Trocas de ficha ({ata.ata_trocas_ficha.length})</h2>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
              {ata.ata_trocas_ficha.map((t: any) => (
                <div key={t.id} style={{ padding: '10px 14px', background: 'var(--csa-tint)', borderRadius: 10, display: 'flex', alignItems: 'center', gap: 12, flexWrap: 'wrap' }}>
                  <span style={{ fontWeight: 600, color: 'var(--csa-text-1)', flex: 1 }}>{t.nome_membro}</span>
                  <span style={{ background: 'var(--csa-accent)', color: 'white', borderRadius: 99, padding: '2px 10px', fontSize: 12, fontWeight: 700 }}>{t.ficha}</span>
                  <span style={{ fontSize: 13, color: 'var(--csa-text-2)' }}>com {t.nome_padrinho}</span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Tesouraria */}
        <div className="card">
          <h2 className="section-title mb-4">Tesouraria</h2>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            {[
              { label: 'Saldo anterior',    valor: ata.saldo_anterior },
              { label: 'Sétima tradição',   valor: ata.setima_tradicao },
              { label: 'Vendas',            valor: ata.vendas },
              { label: 'Despesas',          valor: ata.despesas },
            ].map(({ label, valor }) => (
              <div key={label} style={{ display: 'flex', justifyContent: 'space-between', padding: '8px 0', borderBottom: '1px solid var(--csa-border)' }}>
                <span style={{ fontSize: 14, color: 'var(--csa-text-2)' }}>{label}</span>
                <span style={{ fontSize: 14, fontWeight: 500, color: 'var(--csa-text-1)' }}>{fmtMoeda(valor ?? 0)}</span>
              </div>
            ))}
            <div style={{ display: 'flex', justifyContent: 'space-between', padding: '10px 14px', background: 'var(--csa-tint)', borderRadius: 10, marginTop: 4 }}>
              <span style={{ fontWeight: 700, color: 'var(--csa-text-1)' }}>Saldo atual</span>
              <span style={{ fontWeight: 800, fontSize: 18, color: ata.saldo_atual >= 0 ? '#15803d' : '#dc2626' }}>
                {fmtMoeda(ata.saldo_atual ?? 0)}
              </span>
            </div>
          </div>
        </div>

        {/* Encargos */}
        {encargosMap.length > 0 && (
          <div className="card">
            <h2 className="section-title mb-4">Encargos do grupo</h2>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(170px, 1fr))', gap: 14 }}>
              {encargosMap.map(({ label, valor }) => (
                <div key={label}>
                  <p style={{ fontSize: 12, color: 'var(--csa-text-3)', marginBottom: 2 }}>{label}</p>
                  <p style={{ fontWeight: 500, color: 'var(--csa-text-1)' }}>{valor}</p>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Observações */}
        {ata.observacoes && (
          <div className="card">
            <h2 className="section-title mb-3">Observações</h2>
            <p style={{ color: 'var(--csa-text-1)', fontSize: 14, lineHeight: 1.6, whiteSpace: 'pre-wrap' }}>{ata.observacoes}</p>
          </div>
        )}
      </div>
    </div>
  )
}
