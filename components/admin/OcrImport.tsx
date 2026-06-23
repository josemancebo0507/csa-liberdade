'use client'
import { useState, useRef, useEffect } from 'react'
import {
  Camera, PenLine, ImagePlus, Lightbulb, Loader2,
  CheckCircle, AlertTriangle, AlertCircle, Sparkles,
  ArrowRight, Info,
} from 'lucide-react'
import type { DadosOcr } from '@/lib/types-ata'

type Etapa = 'escolha' | 'upload' | 'processando' | 'revisao' | 'erro'

interface Props {
  onDadosExtraidos: (dados: DadosOcr) => void
  onPularParaManual: () => void
}

const MENSAGENS = [
  'Identificando campos preenchidos...',
  'Lendo nomes e valores...',
  'Organizando as informações...',
  'Quase pronto...',
]

function fmtMoeda(v: number | null) {
  return (v ?? 0).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })
}

function fmtData(d: string | null) {
  if (!d) return null
  return new Date(d + 'T12:00:00').toLocaleDateString('pt-BR', {
    day: '2-digit', month: '2-digit', year: 'numeric',
  })
}

function CorBarraConfianca(c: number) {
  return c >= 70 ? '#16a34a' : c >= 40 ? '#d97706' : '#dc2626'
}

// ─── Seção de revisão simples ─────────────────────────────────────────────────

function SecaoRevisao({ titulo, children }: { titulo: string; children: React.ReactNode }) {
  return (
    <div style={{ marginBottom: 24 }}>
      <p style={{ fontWeight: 700, fontSize: 14, color: 'var(--csa-text-1)', marginBottom: 12, paddingBottom: 8, borderBottom: '1px solid var(--csa-border)' }}>
        {titulo}
      </p>
      {children}
    </div>
  )
}

function CampoRevisao({ label, valor }: { label: string; valor: string | number | null }) {
  const vazio = valor === null || valor === ''
  return (
    <div>
      <p style={{ fontSize: 11, color: 'var(--csa-text-3)', marginBottom: 2, textTransform: 'uppercase', letterSpacing: '0.04em' }}>{label}</p>
      <p style={{ fontSize: 14, color: vazio ? 'var(--csa-text-3)' : 'var(--csa-text-1)', fontStyle: vazio ? 'italic' : 'normal', fontWeight: vazio ? 400 : 500 }}>
        {vazio ? 'Não identificado' : String(valor)}
      </p>
    </div>
  )
}

// ─── Componente principal ─────────────────────────────────────────────────────

export default function OcrImport({ onDadosExtraidos, onPularParaManual }: Props) {
  const [etapa,          setEtapa]          = useState<Etapa>('escolha')
  const [imagemPreview,  setImagemPreview]  = useState<string | null>(null)
  const [imagemFile,     setImagemFile]     = useState<File | null>(null)
  const [dadosExtraidos, setDadosExtraidos] = useState<DadosOcr | null>(null)
  const [confianca,      setConfianca]      = useState(0)
  const [erro,           setErro]           = useState<string | null>(null)
  const [msgIdx,         setMsgIdx]         = useState(0)
  const [isDragOver,     setIsDragOver]     = useState(false)

  const fileInputRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    if (etapa !== 'processando') return
    const iv = setInterval(() => setMsgIdx(i => (i + 1) % MENSAGENS.length), 3000)
    return () => clearInterval(iv)
  }, [etapa])

  function handleFile(file: File) {
    if (!file.type.startsWith('image/')) { alert('Selecione uma imagem JPG ou PNG.'); return }
    if (file.size > 10 * 1024 * 1024)   { alert('A imagem deve ter no máximo 10MB.'); return }
    if (imagemPreview) URL.revokeObjectURL(imagemPreview)
    setImagemFile(file)
    setImagemPreview(URL.createObjectURL(file))
  }

  function handleDrop(e: React.DragEvent) {
    e.preventDefault(); setIsDragOver(false)
    const file = e.dataTransfer.files[0]
    if (file) handleFile(file)
  }

  async function handleAnalisar() {
    if (!imagemFile) return
    setEtapa('processando'); setMsgIdx(0)
    try {
      const fd = new FormData()
      fd.append('imagem', imagemFile)
      const res  = await fetch('/api/atas/ocr', { method: 'POST', body: fd })
      const json = await res.json()
      if (!res.ok || !json.sucesso) {
        setErro(json.error ?? 'Erro ao processar a imagem.'); setEtapa('erro'); return
      }
      setDadosExtraidos(json.dados)
      setConfianca(json.dados.confianca_geral ?? 0)
      setEtapa('revisao')
    } catch {
      setErro('Erro de conexão. Verifique sua internet e tente novamente.'); setEtapa('erro')
    }
  }

  // ─── Tela: escolha ────────────────────────────────────────────────────────

  if (etapa === 'escolha') return (
    <div style={{ maxWidth: 560, margin: '0 auto' }}>
      <h2 style={{ fontSize: 20, fontWeight: 700, color: 'var(--csa-text-1)', marginBottom: 6 }}>
        Como deseja preencher a ata?
      </h2>
      <p style={{ fontSize: 14, color: 'var(--csa-text-2)', marginBottom: 24 }}>
        Escolha o método que preferir. Você poderá revisar tudo antes de salvar.
      </p>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: 16 }}>
        {/* Card: importar foto */}
        <button
          type="button"
          onClick={() => setEtapa('upload')}
          style={{
            padding: 24, borderRadius: 16, textAlign: 'left', cursor: 'pointer',
            border: '2px solid var(--csa-accent)', background: 'var(--csa-tint)',
            transition: 'box-shadow 0.15s',
          }}
          onMouseEnter={e => (e.currentTarget.style.boxShadow = '0 4px 20px rgba(63,90,166,0.15)')}
          onMouseLeave={e => (e.currentTarget.style.boxShadow = 'none')}
        >
          <Camera size={40} style={{ color: 'var(--csa-accent)', marginBottom: 12 }} />
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 6 }}>
            <p style={{ fontWeight: 700, fontSize: 16, color: 'var(--csa-text-1)' }}>Importar foto</p>
            <span style={{ background: '#dcfce7', color: '#15803d', borderRadius: 99, padding: '2px 8px', fontSize: 11, fontWeight: 700 }}>Recomendado</span>
          </div>
          <p style={{ fontSize: 13, color: 'var(--csa-text-2)', lineHeight: 1.5 }}>
            Tire uma foto da ata física e a IA preencherá o formulário automaticamente
          </p>
        </button>

        {/* Card: manual */}
        <button
          type="button"
          onClick={onPularParaManual}
          style={{
            padding: 24, borderRadius: 16, textAlign: 'left', cursor: 'pointer',
            border: '2px solid var(--csa-border)', background: 'var(--csa-surface)',
            transition: 'box-shadow 0.15s',
          }}
          onMouseEnter={e => (e.currentTarget.style.boxShadow = '0 4px 12px rgba(0,0,0,0.06)')}
          onMouseLeave={e => (e.currentTarget.style.boxShadow = 'none')}
        >
          <PenLine size={40} style={{ color: 'var(--csa-text-3)', marginBottom: 12 }} />
          <p style={{ fontWeight: 700, fontSize: 16, color: 'var(--csa-text-1)', marginBottom: 6 }}>Preencher manualmente</p>
          <p style={{ fontSize: 13, color: 'var(--csa-text-2)', lineHeight: 1.5 }}>
            Digite as informações da ata campo por campo
          </p>
        </button>
      </div>
    </div>
  )

  // ─── Tela: upload ─────────────────────────────────────────────────────────

  if (etapa === 'upload') return (
    <div style={{ maxWidth: 560, margin: '0 auto' }}>
      <h2 style={{ fontSize: 20, fontWeight: 700, color: 'var(--csa-text-1)', marginBottom: 6 }}>
        Foto da ata
      </h2>
      <p style={{ fontSize: 14, color: 'var(--csa-text-2)', marginBottom: 20 }}>
        Tire uma foto clara da ata física ou selecione da galeria
      </p>

      {/* Zona de drop */}
      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        style={{ display: 'none' }}
        onChange={e => { const f = e.target.files?.[0]; if (f) handleFile(f) }}
        // Permitir câmera no mobile mas também galeria (sem capture para dar opção)
      />

      {!imagemPreview ? (
        <div
          onClick={() => fileInputRef.current?.click()}
          onDragOver={e => { e.preventDefault(); setIsDragOver(true) }}
          onDragLeave={() => setIsDragOver(false)}
          onDrop={handleDrop}
          style={{
            border: `2px dashed ${isDragOver ? 'var(--csa-accent)' : 'var(--csa-border)'}`,
            borderRadius: 16, padding: '48px 24px', textAlign: 'center',
            cursor: 'pointer', transition: 'border-color 0.15s, background 0.15s',
            background: isDragOver ? 'var(--csa-tint)' : 'var(--csa-surface)',
            marginBottom: 16,
          }}
        >
          <ImagePlus size={48} style={{ color: 'var(--csa-text-3)', marginBottom: 12, display: 'block', margin: '0 auto 12px' }} />
          <p style={{ fontWeight: 600, color: 'var(--csa-text-1)', fontSize: 16, marginBottom: 6 }}>
            Toque aqui para tirar ou escolher uma foto
          </p>
          <p style={{ fontSize: 13, color: 'var(--csa-text-3)' }}>JPG ou PNG • Máximo 10MB</p>
        </div>
      ) : (
        <div style={{ marginBottom: 16, textAlign: 'center' }}>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={imagemPreview}
            alt="Prévia da ata"
            style={{ maxHeight: 300, maxWidth: '100%', objectFit: 'contain', borderRadius: 12, border: '1px solid var(--csa-border)' }}
          />
          <div style={{ marginTop: 10 }}>
            <button
              type="button"
              className="btn-secondary"
              style={{ fontSize: 13 }}
              onClick={() => { setImagemFile(null); setImagemPreview(null); fileInputRef.current && (fileInputRef.current.value = '') }}
            >
              Trocar foto
            </button>
          </div>
        </div>
      )}

      {/* Dicas */}
      <div style={{ padding: '14px 16px', background: 'var(--csa-tint)', borderRadius: 12, marginBottom: 24, border: '1px solid var(--csa-tint-border)' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 8 }}>
          <Lightbulb size={14} style={{ color: 'var(--csa-accent)', flexShrink: 0 }} />
          <p style={{ fontSize: 13, fontWeight: 600, color: 'var(--csa-text-1)' }}>Dicas para melhor resultado:</p>
        </div>
        <ul style={{ margin: 0, padding: '0 0 0 20px', fontSize: 13, color: 'var(--csa-text-2)', lineHeight: 1.8 }}>
          <li>Fotografe em ambiente bem iluminado</li>
          <li>Mantenha a câmera paralela à folha (sem angulação)</li>
          <li>Certifique-se que todos os campos estão visíveis</li>
          <li>Evite sombras sobre o papel</li>
        </ul>
      </div>

      {/* Botões */}
      <div style={{ display: 'flex', gap: 12, justifyContent: 'space-between', flexWrap: 'wrap' }}>
        <button type="button" className="btn-secondary" onClick={() => setEtapa('escolha')}>
          ← Voltar
        </button>
        <button
          type="button"
          className="btn-primary"
          disabled={!imagemFile}
          style={{ opacity: imagemFile ? 1 : 0.4 }}
          onClick={handleAnalisar}
        >
          <Sparkles size={15} /> Analisar ata →
        </button>
      </div>
    </div>
  )

  // ─── Tela: processando ────────────────────────────────────────────────────

  if (etapa === 'processando') return (
    <div style={{ maxWidth: 400, margin: '0 auto', textAlign: 'center', padding: '48px 24px' }}>
      <Loader2
        size={48}
        style={{ color: 'var(--csa-accent)', margin: '0 auto 20px', display: 'block' }}
        className="animate-spin"
      />
      <h2 style={{ fontSize: 20, fontWeight: 700, color: 'var(--csa-text-1)', marginBottom: 12 }}>
        Analisando a ata...
      </h2>
      <p style={{ fontSize: 15, color: 'var(--csa-text-2)', marginBottom: 8, minHeight: 24, transition: 'opacity 0.3s' }}>
        {MENSAGENS[msgIdx]}
      </p>
      <p style={{ fontSize: 13, color: 'var(--csa-text-3)' }}>Isso pode levar até 15 segundos</p>
    </div>
  )

  // ─── Tela: revisão ────────────────────────────────────────────────────────

  if (etapa === 'revisao' && dadosExtraidos) {
    const d = dadosExtraidos
    const corConfianca = CorBarraConfianca(confianca)
    const IconeConfianca = confianca >= 70 ? CheckCircle : confianca >= 40 ? AlertTriangle : AlertCircle
    const corIcone = confianca >= 70 ? '#16a34a' : confianca >= 40 ? '#d97706' : '#dc2626'
    const tituloConfianca = confianca >= 70 ? 'Ata lida com sucesso!' : confianca >= 40 ? 'Ata lida com algumas incertezas' : 'Leitura difícil — revise com atenção'
    const saldoCalc = (d.tesouraria.saldo_anterior ?? 0) + (d.tesouraria.setima_tradicao ?? 0) + (d.tesouraria.vendas ?? 0) - (d.tesouraria.despesas ?? 0)

    return (
      <div style={{ maxWidth: 640, margin: '0 auto' }}>
        {/* Header confiança */}
        <div style={{ marginBottom: 20 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 16 }}>
            <IconeConfianca size={28} style={{ color: corIcone, flexShrink: 0 }} />
            <h2 style={{ fontSize: 20, fontWeight: 700, color: 'var(--csa-text-1)' }}>{tituloConfianca}</h2>
          </div>
          <div>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 4 }}>
              <p style={{ fontSize: 13, color: 'var(--csa-text-2)' }}>Qualidade da leitura</p>
              <p style={{ fontSize: 13, fontWeight: 700, color: corConfianca }}>{confianca}%</p>
            </div>
            <div style={{ height: 8, borderRadius: 4, background: 'var(--csa-border)', overflow: 'hidden' }}>
              <div style={{ height: '100%', width: `${confianca}%`, background: corConfianca, transition: 'width 0.6s ease' }} />
            </div>
          </div>
        </div>

        {/* Aviso sempre visível */}
        <div style={{
          padding: '12px 16px', borderRadius: 12, marginBottom: 24,
          background: 'var(--csa-tint)', border: '1px solid var(--csa-tint-border)',
          display: 'flex', gap: 10, alignItems: 'flex-start',
        }}>
          <Info size={16} style={{ color: 'var(--csa-accent)', flexShrink: 0, marginTop: 1 }} />
          <p style={{ fontSize: 13, color: 'var(--csa-text-1)', lineHeight: 1.5 }}>
            <strong>Revise todos os campos antes de continuar.</strong><br />
            A IA pode cometer erros, especialmente em letras cursivas ou campos com rasuras.
          </p>
        </div>

        <div className="card" style={{ padding: '20px 24px' }}>
          {/* Dados gerais */}
          <SecaoRevisao titulo="Dados gerais">
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: 14 }}>
              <CampoRevisao label="Secretário(a)" valor={d.secretario} />
              <CampoRevisao label="Coordenador(a)" valor={d.coordenador} />
              <CampoRevisao label="Nº da reunião" valor={d.numero_reuniao} />
              <CampoRevisao label="Data" valor={fmtData(d.data_reuniao)} />
              <CampoRevisao label="Tipo" valor={d.tipo_reuniao ? (d.tipo_reuniao === 'aberta' ? 'Aberta' : 'Fechada') : null} />
              <CampoRevisao label="Literatura lida" valor={d.literatura_lida} />
            </div>
          </SecaoRevisao>

          {/* Presenças */}
          <SecaoRevisao titulo={`Presenças (${d.presencas.length + 1} membros + ${d.visitantes.length} visitantes)`}>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 4, marginBottom: d.visitantes.length > 0 ? 12 : 0 }}>
              <div style={{ display: 'flex', gap: 10, padding: '5px 10px', background: '#fef9c3', borderRadius: 8 }}>
                <span style={{ width: 24, fontWeight: 700, color: '#92400e', fontSize: 12 }}>01</span>
                <span style={{ color: '#92400e', fontSize: 13, fontWeight: 500 }}>Poder Superior ✓</span>
              </div>
              {d.presencas.map((p, i) => (
                <div key={i} style={{ display: 'flex', gap: 10, padding: '5px 10px', background: 'var(--csa-tint)', borderRadius: 8 }}>
                  <span style={{ width: 24, fontWeight: 700, color: 'var(--csa-text-3)', fontSize: 12 }}>{String(p.numero).padStart(2, '0')}</span>
                  <span style={{ fontSize: 13, color: 'var(--csa-text-1)' }}>{p.nome}</span>
                </div>
              ))}
            </div>
            {d.visitantes.length > 0 && (
              <div>
                <p style={{ fontSize: 12, color: 'var(--csa-text-3)', marginBottom: 6, marginTop: 8 }}>Visitantes</p>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
                  {d.visitantes.map((v, i) => (
                    <div key={i} style={{ display: 'flex', gap: 10, padding: '5px 10px', background: 'var(--csa-tint)', borderRadius: 8 }}>
                      <span style={{ width: 24, fontWeight: 700, color: 'var(--csa-text-3)', fontSize: 12 }}>V{String(v.numero).padStart(2, '0')}</span>
                      <span style={{ fontSize: 13, color: 'var(--csa-text-1)' }}>{v.nome}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </SecaoRevisao>

          {/* Ingressos e trocas */}
          <SecaoRevisao titulo="Ingressos e trocas de ficha">
            {d.ingressos.length === 0 && d.trocas_ficha.length === 0 ? (
              <p style={{ fontSize: 13, color: 'var(--csa-text-3)', fontStyle: 'italic' }}>Nenhum registrado nesta ata</p>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                {d.ingressos.map((ing, i) => (
                  <div key={i} style={{ padding: '8px 12px', background: 'var(--csa-tint)', borderRadius: 8 }}>
                    <p style={{ fontWeight: 600, fontSize: 13, color: 'var(--csa-text-1)' }}>{ing.nome_ingresso}</p>
                    <p style={{ fontSize: 12, color: 'var(--csa-text-2)' }}>Padrinho/Madrinha: {ing.nome_padrinho}</p>
                    {ing.como_conheceu && <p style={{ fontSize: 12, color: 'var(--csa-text-3)' }}>{ing.como_conheceu}</p>}
                  </div>
                ))}
                {d.trocas_ficha.map((t, i) => (
                  <div key={i} style={{ padding: '8px 12px', background: 'var(--csa-tint)', borderRadius: 8, display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
                    <span style={{ fontWeight: 600, fontSize: 13, color: 'var(--csa-text-1)', flex: 1 }}>{t.nome_membro}</span>
                    <span style={{ background: 'var(--csa-accent)', color: 'white', borderRadius: 99, padding: '1px 8px', fontSize: 11, fontWeight: 700 }}>{t.ficha}</span>
                    <span style={{ fontSize: 12, color: 'var(--csa-text-2)' }}>com {t.nome_padrinho}</span>
                  </div>
                ))}
              </div>
            )}
          </SecaoRevisao>

          {/* Tesouraria */}
          <SecaoRevisao titulo="Tesouraria">
            <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
              {[
                { l: 'Saldo anterior',  v: d.tesouraria.saldo_anterior },
                { l: 'Sétima tradição', v: d.tesouraria.setima_tradicao },
                { l: 'Vendas',          v: d.tesouraria.vendas },
                { l: 'Despesas',        v: d.tesouraria.despesas },
              ].map(({ l, v }) => (
                <div key={l} style={{ display: 'flex', justifyContent: 'space-between', fontSize: 13, padding: '5px 0', borderBottom: '1px solid var(--csa-border)' }}>
                  <span style={{ color: 'var(--csa-text-2)' }}>{l}</span>
                  <span style={{ fontWeight: 500, color: v !== null ? 'var(--csa-text-1)' : 'var(--csa-text-3)' }}>{fmtMoeda(v)}</span>
                </div>
              ))}
              <div style={{ display: 'flex', justifyContent: 'space-between', padding: '8px 12px', background: 'var(--csa-tint)', borderRadius: 8, marginTop: 4 }}>
                <span style={{ fontWeight: 700, fontSize: 13 }}>Saldo calculado</span>
                <span style={{ fontWeight: 800, fontSize: 16, color: saldoCalc >= 0 ? '#15803d' : '#dc2626' }}>{fmtMoeda(saldoCalc)}</span>
              </div>
            </div>
          </SecaoRevisao>

          {/* Encargos */}
          <SecaoRevisao titulo="Encargos">
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(160px, 1fr))', gap: 12 }}>
              {[
                { l: 'RSG',           v: d.encargos.rsg },
                { l: 'RSG Suplente',  v: d.encargos.rsg_suplente },
                { l: 'Secretário(a)', v: d.encargos.secretario },
                { l: 'Tesoureiro(a)', v: d.encargos.tesoureiro },
                { l: 'Bem Estar',     v: d.encargos.bem_estar },
              ].map(({ l, v }) => <CampoRevisao key={l} label={l} valor={v} />)}
            </div>
          </SecaoRevisao>
        </div>

        {/* Botões */}
        <div style={{ display: 'flex', gap: 12, justifyContent: 'space-between', flexWrap: 'wrap', marginTop: 24 }}>
          <button type="button" className="btn-secondary" onClick={() => setEtapa('upload')}>
            ← Tirar outra foto
          </button>
          <button type="button" className="btn-primary" onClick={() => onDadosExtraidos(dadosExtraidos)}>
            Preencher com esses dados <ArrowRight size={16} />
          </button>
        </div>
      </div>
    )
  }

  // ─── Tela: erro ───────────────────────────────────────────────────────────

  if (etapa === 'erro') return (
    <div style={{ maxWidth: 400, margin: '0 auto', textAlign: 'center', padding: '48px 24px' }}>
      <AlertCircle size={48} style={{ color: '#dc2626', margin: '0 auto 20px', display: 'block' }} />
      <h2 style={{ fontSize: 20, fontWeight: 700, color: 'var(--csa-text-1)', marginBottom: 12 }}>
        Não foi possível ler a ata
      </h2>
      <p style={{ fontSize: 14, color: 'var(--csa-text-2)', marginBottom: 16 }}>{erro}</p>
      <div style={{
        padding: '12px 16px', background: 'var(--csa-tint)', borderRadius: 12,
        fontSize: 13, color: 'var(--csa-text-2)', marginBottom: 28, textAlign: 'left',
      }}>
        {erro?.includes('nítida') || erro?.includes('legível') ? (
          <p>Tente uma foto mais nítida em melhor iluminação</p>
        ) : erro?.includes('sobrecarregado') ? (
          <p>Serviço ocupado. Aguarde alguns minutos e tente novamente</p>
        ) : (
          <p>Tente novamente ou preencha manualmente</p>
        )}
      </div>
      <div style={{ display: 'flex', gap: 12, justifyContent: 'center', flexWrap: 'wrap' }}>
        <button type="button" className="btn-primary" onClick={() => setEtapa('upload')}>
          Tentar novamente
        </button>
        <button type="button" className="btn-secondary" onClick={onPularParaManual}>
          Preencher manualmente
        </button>
      </div>
    </div>
  )

  return null
}
