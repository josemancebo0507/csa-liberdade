'use client'
import { useState, useRef, useEffect, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import {
  CheckCircle, ChevronRight, ChevronLeft,
  UserPlus, X, Star, Award, DoorOpen, Lock, Sparkles,
} from 'lucide-react'
import { createClient } from '@/lib/supabase/client'
import type { Grupo } from '@/lib/types'
import OcrImport from '@/components/admin/OcrImport'
import type { DadosOcr } from '@/lib/types-ata'

// ─── Tipos internos ───────────────────────────────────────────────────────────

interface Presenca { id: string; nome: string }
interface Ingresso { id: string; nome_ingresso: string; nome_padrinho: string; como_conheceu: string }
interface TrocaFicha { id: string; nome_membro: string; ficha: string; nome_padrinho: string }

interface Encargos {
  rsg: string; rsg_suplente: string; secretario: string
  tesoureiro: string; bem_estar: string
}

interface Props {
  grupos: Grupo[]
  grupoDeEscolhaId: string | null
  encargosIniciais: Encargos
  saldoAnteriorInicial: number
}

const FICHAS = [
  '30 dias','60 dias','90 dias','6 meses','9 meses','1 ano',
  '18 meses','2 anos','3 anos','4 anos','5 anos','10 anos',
  '15 anos','20 anos','25 anos','30 anos','Outro',
]

const STEP_TITLES = [
  'Sobre a reunião',
  'Lista de presença',
  'Ingressos e trocas de ficha',
  'Tesouraria',
  'Encargos e observações',
]

const uid = () => Math.random().toString(36).slice(2)

// ─── Barra de progresso ───────────────────────────────────────────────────────

function ProgressBar({ step, total }: { step: number; total: number }) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 0, marginBottom: 28 }}>
      {Array.from({ length: total }).map((_, i) => {
        const done   = i < step
        const active = i === step
        return (
          <div key={i} style={{ display: 'flex', alignItems: 'center', flex: i < total - 1 ? 1 : 0 }}>
            <div style={{
              width: 32, height: 32, borderRadius: '50%', flexShrink: 0,
              background: done || active ? 'var(--csa-accent)' : 'var(--csa-tint)',
              color: done || active ? 'white' : 'var(--csa-text-3)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              fontWeight: 700, fontSize: 13, transition: 'background 0.2s',
              border: active ? '3px solid var(--csa-accent)' : 'none',
              boxShadow: active ? '0 0 0 4px var(--csa-tint)' : 'none',
            }}>
              {done ? <CheckCircle size={16} /> : i + 1}
            </div>
            {i < total - 1 && (
              <div style={{
                flex: 1, height: 2, margin: '0 4px',
                background: done ? 'var(--csa-accent)' : 'var(--csa-border)',
                transition: 'background 0.2s',
              }} />
            )}
          </div>
        )
      })}
    </div>
  )
}

// ─── Componente principal ─────────────────────────────────────────────────────

export default function AtaForm({ grupos, grupoDeEscolhaId, encargosIniciais, saldoAnteriorInicial }: Props) {
  const router = useRouter()
  const [step, setStep] = useState(0)

  // Controle do modo de entrada
  const [modoEntrada,  setModoEntrada]  = useState<'escolha' | 'manual'>('escolha')
  const [ocrUtilizado, setOcrUtilizado] = useState(false)

  // ── Etapa 1
  const [grupoId,       setGrupoId]       = useState(grupoDeEscolhaId ?? grupos[0]?.id ?? '')
  const [dataReuniao,   setDataReuniao]   = useState(new Date().toISOString().split('T')[0])
  const [numeroReuniao, setNumeroReuniao] = useState('')
  const [tipoReuniao,   setTipoReuniao]   = useState<'aberta'|'fechada'>('fechada')
  const [secretario,    setSecretario]    = useState('')
  const [coordenador,   setCoordenador]   = useState('')

  // ── Etapa 2
  const [membros,    setMembros]    = useState<Presenca[]>([{ id: uid(), nome: '' }])
  const [visitantes, setVisitantes] = useState<Presenca[]>([])

  // ── Etapa 3
  const [ingressos,   setIngressos]   = useState<Ingresso[]>([])
  const [trocasFicha, setTrocasFicha] = useState<TrocaFicha[]>([])

  // ── Etapa 4
  const [saldoAnterior, setSaldoAnterior] = useState(saldoAnteriorInicial)
  const [setimaTrad,    setSetimaTrad]    = useState(0)
  const [vendas,        setVendas]        = useState(0)
  const [despesas,      setDespesas]      = useState(0)

  // ── Etapa 5
  const [encargos,       setEncargos]       = useState<Encargos>(encargosIniciais)
  const [literaturaLida, setLiteraturaLida] = useState('')
  const [observacoes,    setObservacoes]    = useState('')

  // ── Controle
  const [erroStep, setErroStep] = useState('')
  const [loading,  setLoading]  = useState(false)
  const [modal,    setModal]    = useState(false)
  const [sucesso,  setSucesso]  = useState<{ id: string; numero: number; data: string } | null>(null)
  const [carregandoGrupo, setCarregandoGrupo] = useState(false)

  const membrosInputRefs    = useRef<(HTMLInputElement | null)[]>([])
  const visitantesInputRefs = useRef<(HTMLInputElement | null)[]>([])

  // ── Carregar dados ao trocar de grupo
  const carregarDadosGrupo = useCallback(async (id: string) => {
    if (!id) return
    setCarregandoGrupo(true)
    try {
      const r = await fetch(`/api/atas/grupo-dados?grupoId=${id}`)
      if (r.ok) {
        const d = await r.json()
        setSaldoAnterior(d.saldoAnterior ?? 0)
        setEncargos(prev => ({
          rsg:           d.encargos.rsg           ?? prev.rsg,
          rsg_suplente:  d.encargos.rsg_suplente  ?? prev.rsg_suplente,
          secretario:    d.encargos.secretario    ?? prev.secretario,
          tesoureiro:    d.encargos.tesoureiro    ?? prev.tesoureiro,
          bem_estar:     d.encargos.bem_estar     ?? prev.bem_estar,
        }))
      }
    } finally {
      setCarregandoGrupo(false)
    }
  }, [])

  useEffect(() => {
    if (grupoId) carregarDadosGrupo(grupoId)
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [grupoId])

  const saldoAtual = saldoAnterior + setimaTrad + vendas - despesas

  // ── Preencher formulário com dados extraídos pelo OCR
  function preencherComDadosOcr(dados: DadosOcr) {
    if (dados.secretario)                         setSecretario(dados.secretario)
    if (dados.coordenador)                        setCoordenador(dados.coordenador)
    if (dados.numero_reuniao !== null)            setNumeroReuniao(String(dados.numero_reuniao))
    if (dados.data_reuniao)                       setDataReuniao(dados.data_reuniao)
    if (dados.tipo_reuniao)                       setTipoReuniao(dados.tipo_reuniao)
    if (dados.literatura_lida)                    setLiteraturaLida(dados.literatura_lida)
    if (dados.observacoes)                        setObservacoes(dados.observacoes)

    if (dados.presencas?.length > 0)
      setMembros(dados.presencas.map(p => ({ id: uid(), nome: p.nome })))
    if (dados.visitantes?.length > 0)
      setVisitantes(dados.visitantes.map(v => ({ id: uid(), nome: v.nome })))

    if (dados.ingressos?.length > 0)
      setIngressos(dados.ingressos.map(i => ({ id: uid(), nome_ingresso: i.nome_ingresso, nome_padrinho: i.nome_padrinho, como_conheceu: i.como_conheceu ?? '' })))
    if (dados.trocas_ficha?.length > 0)
      setTrocasFicha(dados.trocas_ficha.map(t => ({ id: uid(), nome_membro: t.nome_membro, ficha: t.ficha, nome_padrinho: t.nome_padrinho })))

    if (dados.tesouraria) {
      if (dados.tesouraria.saldo_anterior  !== null) setSaldoAnterior(dados.tesouraria.saldo_anterior)
      if (dados.tesouraria.setima_tradicao !== null) setSetimaTrad(dados.tesouraria.setima_tradicao)
      if (dados.tesouraria.vendas          !== null) setVendas(dados.tesouraria.vendas)
      if (dados.tesouraria.despesas        !== null) setDespesas(dados.tesouraria.despesas)
    }

    if (dados.encargos) {
      setEncargos(prev => ({
        rsg:          dados.encargos.rsg          ?? prev.rsg,
        rsg_suplente: dados.encargos.rsg_suplente ?? prev.rsg_suplente,
        secretario:   dados.encargos.secretario   ?? prev.secretario,
        tesoureiro:   dados.encargos.tesoureiro   ?? prev.tesoureiro,
        bem_estar:    dados.encargos.bem_estar    ?? prev.bem_estar,
      }))
    }

    setOcrUtilizado(true)
    setModoEntrada('manual')
    setStep(0)
  }

  // ── Validação por etapa
  function validarEtapa(): boolean {
    setErroStep('')
    if (step === 0) {
      if (!grupoId)                    { setErroStep('Selecione o grupo.'); return false }
      if (!dataReuniao)                { setErroStep('Informe a data da reunião.'); return false }
      if (!numeroReuniao || Number(numeroReuniao) < 1) { setErroStep('Informe o número da reunião.'); return false }
      if (!secretario.trim())          { setErroStep('Informe o nome do secretário(a).'); return false }
      if (!coordenador.trim())         { setErroStep('Informe o nome do coordenador(a).'); return false }
    }
    if (step === 1) {
      const preenchidos = membros.filter(m => m.nome.trim())
      if (preenchidos.length === 0) { setErroStep('Adicione pelo menos um membro na lista de presença.'); return false }
    }
    if (step === 2) {
      for (const ing of ingressos) {
        if (!ing.nome_ingresso.trim() || !ing.nome_padrinho.trim()) {
          setErroStep('Preencha nome e padrinho/madrinha em todos os ingressos.'); return false
        }
      }
      for (const t of trocasFicha) {
        if (!t.nome_membro.trim() || !t.ficha || !t.nome_padrinho.trim()) {
          setErroStep('Preencha todos os campos em cada troca de ficha.'); return false
        }
      }
    }
    if (step === 3) {
      if (saldoAtual < 0 && !confirm('O saldo ficará negativo. Deseja continuar assim mesmo?')) return false
    }
    return true
  }

  function avancar() { if (!validarEtapa()) return; setStep(s => s + 1) }
  function voltar()  { setErroStep(''); setStep(s => s - 1) }

  // ── Helpers de lista dinâmica
  function addMembro() {
    setMembros(prev => {
      const next = [...prev, { id: uid(), nome: '' }]
      setTimeout(() => membrosInputRefs.current[next.length - 1]?.focus(), 50)
      return next
    })
  }
  function removeMembro(id: string)              { setMembros(prev => prev.filter(m => m.id !== id)) }
  function updateMembro(id: string, nome: string) { setMembros(prev => prev.map(m => m.id === id ? { ...m, nome } : m)) }
  function onMembroEnter(idx: number) {
    if (idx < membros.length - 1) membrosInputRefs.current[idx + 1]?.focus()
    else addMembro()
  }

  function addVisitante() {
    setVisitantes(prev => {
      const next = [...prev, { id: uid(), nome: '' }]
      setTimeout(() => visitantesInputRefs.current[next.length - 1]?.focus(), 50)
      return next
    })
  }
  function removeVisitante(id: string)               { setVisitantes(prev => prev.filter(v => v.id !== id)) }
  function updateVisitante(id: string, nome: string) { setVisitantes(prev => prev.map(v => v.id === id ? { ...v, nome } : v)) }
  function onVisitanteEnter(idx: number) {
    if (idx < visitantes.length - 1) visitantesInputRefs.current[idx + 1]?.focus()
    else addVisitante()
  }

  function addIngresso()                                     { setIngressos(prev => [...prev, { id: uid(), nome_ingresso: '', nome_padrinho: '', como_conheceu: '' }]) }
  function removeIngresso(id: string)                        { setIngressos(prev => prev.filter(i => i.id !== id)) }
  function updateIngresso(id: string, field: keyof Ingresso, val: string) {
    setIngressos(prev => prev.map(i => i.id === id ? { ...i, [field]: val } : i))
  }

  function addTroca()                                        { setTrocasFicha(prev => [...prev, { id: uid(), nome_membro: '', ficha: '30 dias', nome_padrinho: '' }]) }
  function removeTroca(id: string)                           { setTrocasFicha(prev => prev.filter(t => t.id !== id)) }
  function updateTroca(id: string, field: keyof TrocaFicha, val: string) {
    setTrocasFicha(prev => prev.map(t => t.id === id ? { ...t, [field]: val } : t))
  }

  function setEncargo(key: keyof Encargos, val: string) {
    setEncargos(prev => ({ ...prev, [key]: val }))
  }

  // ── Salvamento
  async function handleSalvar() {
    setLoading(true); setErroStep('')
    try {
      const supabase = createClient()
      const { data: ataData, error: ataErr } = await supabase
        .from('atas_grupo')
        .insert({
          grupo_id:            grupoId,
          numero_reuniao:      Number(numeroReuniao),
          data_reuniao:        dataReuniao,
          tipo_reuniao:        tipoReuniao,
          secretario:          secretario.trim(),
          coordenador:         coordenador.trim(),
          literatura_lida:     literaturaLida.trim() || null,
          observacoes:         observacoes.trim() || null,
          saldo_anterior:      saldoAnterior,
          setima_tradicao:     setimaTrad,
          vendas,
          despesas,
          encargo_rsg:          encargos.rsg.trim() || null,
          encargo_rsg_suplente: encargos.rsg_suplente.trim() || null,
          encargo_secretario:   encargos.secretario.trim() || null,
          encargo_tesoureiro:   encargos.tesoureiro.trim() || null,
          encargo_bem_estar:    encargos.bem_estar.trim() || null,
        })
        .select('id')
        .single()

      if (ataErr || !ataData) throw new Error(ataErr?.message ?? 'Erro ao salvar ata.')
      const ataId = ataData.id

      const membrosPayload = membros
        .filter(m => m.nome.trim())
        .map((m, i) => ({ ata_id: ataId, numero: i + 2, nome: m.nome.trim(), visitante: false }))
      const visitantesPayload = visitantes
        .filter(v => v.nome.trim())
        .map((v, i) => ({ ata_id: ataId, numero: i + 1, nome: v.nome.trim(), visitante: true }))
      const ingPayload = ingressos
        .filter(i => i.nome_ingresso.trim())
        .map(i => ({ ata_id: ataId, nome_ingresso: i.nome_ingresso.trim(), nome_padrinho: i.nome_padrinho.trim(), como_conheceu: i.como_conheceu.trim() || null }))
      const trocasPayload = trocasFicha
        .filter(t => t.nome_membro.trim())
        .map(t => ({ ata_id: ataId, nome_membro: t.nome_membro.trim(), ficha: t.ficha, nome_padrinho: t.nome_padrinho.trim() }))

      await Promise.all([
        ...(membrosPayload.length > 0 || visitantesPayload.length > 0
          ? [supabase.from('ata_presencas').insert([...membrosPayload, ...visitantesPayload])]
          : []),
        ...(ingPayload.length > 0    ? [supabase.from('ata_ingressos').insert(ingPayload)]    : []),
        ...(trocasPayload.length > 0 ? [supabase.from('ata_trocas_ficha').insert(trocasPayload)] : []),
      ])

      setModal(false)
      fetch('/api/cache/invalidar', { method: 'POST' }).catch(() => {})
      setSucesso({
        id: ataId,
        numero: Number(numeroReuniao),
        data: new Date(dataReuniao + 'T12:00:00').toLocaleDateString('pt-BR', {
          weekday: 'long', day: 'numeric', month: 'long', year: 'numeric',
        }),
      })
    } catch (err: unknown) {
      setErroStep(err instanceof Error ? err.message : 'Ocorreu um erro. Tente novamente.')
    } finally {
      setLoading(false)
    }
  }

  // ─── Tela de escolha (OCR vs manual) ──────────────────────────────────────
  if (modoEntrada === 'escolha') {
    return (
      <div style={{ maxWidth: 640, margin: '0 auto' }}>
        <div className="card">
          <OcrImport
            onDadosExtraidos={preencherComDadosOcr}
            onPularParaManual={() => setModoEntrada('manual')}
          />
        </div>
      </div>
    )
  }

  // ─── Tela de sucesso ───────────────────────────────────────────────────────
  if (sucesso) {
    return (
      <div style={{ textAlign: 'center', padding: '48px 24px' }}>
        <CheckCircle size={64} style={{ color: '#16a34a', margin: '0 auto 20px' }} />
        <h2 style={{ fontSize: 22, fontWeight: 700, color: 'var(--csa-text-1)', marginBottom: 8 }}>
          Ata salva com sucesso!
        </h2>
        <p style={{ color: 'var(--csa-text-2)', marginBottom: 4 }}>Reunião Nº {sucesso.numero}</p>
        <p style={{ color: 'var(--csa-text-3)', fontSize: 14, marginBottom: 32, textTransform: 'capitalize' }}>
          {sucesso.data}
        </p>
        <div style={{ display: 'flex', gap: 12, justifyContent: 'center', flexWrap: 'wrap' }}>
          <a href={`/admin/atas/${sucesso.id}`} className="btn-primary">
            <CheckCircle size={15} /> Ver ata salva
          </a>
          <button
            className="btn-secondary"
            onClick={() => {
              setSucesso(null); setStep(0); setModoEntrada('escolha'); setOcrUtilizado(false)
              setMembros([{ id: uid(), nome: '' }]); setVisitantes([])
              setIngressos([]); setTrocasFicha([])
              setNumeroReuniao(''); setSecretario(''); setCoordenador('')
              setDataReuniao(new Date().toISOString().split('T')[0])
              setSetimaTrad(0); setVendas(0); setDespesas(0)
              setLiteraturaLida(''); setObservacoes('')
            }}
          >
            Registrar nova ata
          </button>
        </div>
      </div>
    )
  }

  const inputStyle: React.CSSProperties = {
    width: '100%', padding: '14px 16px', fontSize: 16,
    border: '1px solid var(--csa-border)', borderRadius: 10,
    background: 'var(--csa-surface)', color: 'var(--csa-text-1)',
    boxSizing: 'border-box', outline: 'none', fontFamily: 'inherit',
  }
  const labelStyle: React.CSSProperties = {
    display: 'block', fontWeight: 600, fontSize: 14,
    color: 'var(--csa-text-1)', marginBottom: 6,
  }

  // ─── Render por etapa ──────────────────────────────────────────────────────
  const renderEtapa = () => {
    // Etapa 1 ─ Identificação
    if (step === 0) return (
      <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
        <div>
          <label style={labelStyle}>Grupo *</label>
          <select
            style={inputStyle}
            value={grupoId}
            onChange={e => setGrupoId(e.target.value)}
            disabled={carregandoGrupo}
          >
            {grupos.map(g => <option key={g.id} value={g.id}>{g.nome}</option>)}
          </select>
          {carregandoGrupo && <p style={{ fontSize: 12, color: 'var(--csa-text-3)', marginTop: 4 }}>Carregando dados do grupo...</p>}
        </div>
        <div>
          <label style={labelStyle}>Data da reunião *</label>
          <input type="date" style={inputStyle} value={dataReuniao} onChange={e => setDataReuniao(e.target.value)} />
        </div>
        <div>
          <label style={labelStyle}>Número da reunião *</label>
          <input
            type="number" min="1" style={inputStyle}
            value={numeroReuniao} placeholder="Ex: 3628"
            onChange={e => setNumeroReuniao(e.target.value)}
          />
        </div>
        <div>
          <label style={labelStyle}>Tipo da reunião *</label>
          <div style={{ display: 'flex', gap: 12 }}>
            {(['aberta','fechada'] as const).map(tipo => (
              <button
                key={tipo} type="button"
                onClick={() => setTipoReuniao(tipo)}
                style={{
                  flex: 1, padding: '14px 12px', borderRadius: 10, cursor: 'pointer',
                  border: tipoReuniao === tipo ? '2px solid var(--csa-accent)' : '2px solid var(--csa-border)',
                  background: tipoReuniao === tipo ? 'var(--csa-tint)' : 'var(--csa-surface)',
                  color: tipoReuniao === tipo ? 'var(--csa-accent)' : 'var(--csa-text-2)',
                  fontWeight: 600, fontSize: 15, display: 'flex',
                  alignItems: 'center', justifyContent: 'center', gap: 8,
                  transition: 'all 0.15s', fontFamily: 'inherit',
                }}
              >
                {tipo === 'aberta' ? <DoorOpen size={18} /> : <Lock size={18} />}
                {tipo === 'aberta' ? 'Aberta' : 'Fechada'}
              </button>
            ))}
          </div>
        </div>
        <div>
          <label style={labelStyle}>Secretário(a) *</label>
          <input style={inputStyle} value={secretario} placeholder="Nome de serviço" onChange={e => setSecretario(e.target.value)} />
        </div>
        <div>
          <label style={labelStyle}>Coordenador(a) *</label>
          <input style={inputStyle} value={coordenador} placeholder="Nome de serviço" onChange={e => setCoordenador(e.target.value)} />
        </div>
      </div>
    )

    // Etapa 2 ─ Presenças
    if (step === 1) return (
      <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
        <div style={{ padding: '12px 16px', borderRadius: 10, background: '#fef9c3', border: '1px solid #fde68a', display: 'flex', alignItems: 'center', gap: 10 }}>
          <span style={{ fontWeight: 700, color: '#92400e', fontSize: 15 }}>01</span>
          <span style={{ color: '#92400e', fontWeight: 500 }}>Poder Superior</span>
          <CheckCircle size={16} style={{ color: '#92400e', marginLeft: 'auto' }} />
        </div>

        <div>
          <p style={{ fontWeight: 600, color: 'var(--csa-text-1)', marginBottom: 12 }}>Membros</p>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            {membros.map((m, i) => (
              <div key={m.id} style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <span style={{ width: 28, textAlign: 'center', fontWeight: 600, color: 'var(--csa-text-3)', flexShrink: 0, fontSize: 13 }}>
                  {String(i + 2).padStart(2, '0')}
                </span>
                <input
                  ref={el => { membrosInputRefs.current[i] = el }}
                  style={{ ...inputStyle, padding: '11px 14px', fontSize: 15 }}
                  value={m.nome}
                  placeholder="Nome de serviço"
                  onChange={e => updateMembro(m.id, e.target.value)}
                  onKeyDown={e => { if (e.key === 'Enter') { e.preventDefault(); onMembroEnter(i) } }}
                />
                <button type="button" onClick={() => removeMembro(m.id)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#ef4444', padding: 4, flexShrink: 0 }}>
                  <X size={18} />
                </button>
              </div>
            ))}
          </div>
          <button type="button" onClick={addMembro} className="btn-secondary" style={{ marginTop: 10, fontSize: 14 }}>
            <UserPlus size={15} /> Adicionar membro
          </button>
        </div>

        <hr style={{ border: 'none', borderTop: '1px solid var(--csa-border)' }} />

        <div>
          <p style={{ fontWeight: 600, color: 'var(--csa-text-1)', marginBottom: 12 }}>Visitantes</p>
          {visitantes.length === 0 && <p style={{ fontSize: 14, color: 'var(--csa-text-3)', marginBottom: 10 }}>Nenhum visitante nesta reunião</p>}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            {visitantes.map((v, i) => (
              <div key={v.id} style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <span style={{ width: 28, textAlign: 'center', fontWeight: 600, color: 'var(--csa-text-3)', flexShrink: 0, fontSize: 13 }}>
                  V{String(i + 1).padStart(2, '0')}
                </span>
                <input
                  ref={el => { visitantesInputRefs.current[i] = el }}
                  style={{ ...inputStyle, padding: '11px 14px', fontSize: 15 }}
                  value={v.nome}
                  placeholder="Nome do visitante"
                  onChange={e => updateVisitante(v.id, e.target.value)}
                  onKeyDown={e => { if (e.key === 'Enter') { e.preventDefault(); onVisitanteEnter(i) } }}
                />
                <button type="button" onClick={() => removeVisitante(v.id)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#ef4444', padding: 4, flexShrink: 0 }}>
                  <X size={18} />
                </button>
              </div>
            ))}
          </div>
          <button type="button" onClick={addVisitante} className="btn-secondary" style={{ marginTop: 10, fontSize: 14 }}>
            <UserPlus size={15} /> Adicionar visitante
          </button>
        </div>
      </div>
    )

    // Etapa 3 ─ Ingressos e trocas de ficha
    if (step === 2) {
      const vazio = ingressos.length === 0 && trocasFicha.length === 0
      return (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 32 }}>
          {vazio && (
            <div style={{ textAlign: 'center', padding: '16px 0', color: 'var(--csa-text-3)', fontSize: 14 }}>
              Nenhum ingresso ou troca registrada — tudo bem!
            </div>
          )}

          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 16 }}>
              <Star size={18} style={{ color: 'var(--csa-accent)' }} />
              <span style={{ fontWeight: 600, color: 'var(--csa-text-1)' }}>Ingressos</span>
              {ingressos.length > 0 && (
                <span style={{ background: 'var(--csa-accent)', color: 'white', borderRadius: 99, padding: '2px 8px', fontSize: 12, fontWeight: 700 }}>{ingressos.length}</span>
              )}
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
              {ingressos.map(ing => (
                <div key={ing.id} style={{ padding: 14, border: '1px solid var(--csa-border)', borderRadius: 10, display: 'flex', flexDirection: 'column', gap: 10 }}>
                  <div style={{ display: 'flex', gap: 8, justifyContent: 'flex-end' }}>
                    <button type="button" onClick={() => removeIngresso(ing.id)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#ef4444', padding: 4 }}><X size={16} /></button>
                  </div>
                  <div style={{ display: 'grid', gap: 10, gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))' }}>
                    <div>
                      <label style={{ ...labelStyle, fontSize: 13 }}>Quem ingressou *</label>
                      <input style={{ ...inputStyle, padding: '10px 12px', fontSize: 14 }} value={ing.nome_ingresso} placeholder="Nome de serviço" onChange={e => updateIngresso(ing.id, 'nome_ingresso', e.target.value)} />
                    </div>
                    <div>
                      <label style={{ ...labelStyle, fontSize: 13 }}>Padrinho / Madrinha *</label>
                      <input style={{ ...inputStyle, padding: '10px 12px', fontSize: 14 }} value={ing.nome_padrinho} placeholder="Nome de serviço" onChange={e => updateIngresso(ing.id, 'nome_padrinho', e.target.value)} />
                    </div>
                    <div>
                      <label style={{ ...labelStyle, fontSize: 13 }}>Como conheceu NA?</label>
                      <input style={{ ...inputStyle, padding: '10px 12px', fontSize: 14 }} value={ing.como_conheceu} placeholder="Opcional" onChange={e => updateIngresso(ing.id, 'como_conheceu', e.target.value)} />
                    </div>
                  </div>
                </div>
              ))}
            </div>
            <button type="button" onClick={addIngresso} className="btn-secondary" style={{ marginTop: 10, fontSize: 14 }}>
              <Star size={15} /> Adicionar ingresso
            </button>
          </div>

          <hr style={{ border: 'none', borderTop: '1px solid var(--csa-border)' }} />

          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 16 }}>
              <Award size={18} style={{ color: 'var(--csa-accent)' }} />
              <span style={{ fontWeight: 600, color: 'var(--csa-text-1)' }}>Trocas de ficha</span>
              {trocasFicha.length > 0 && (
                <span style={{ background: 'var(--csa-accent)', color: 'white', borderRadius: 99, padding: '2px 8px', fontSize: 12, fontWeight: 700 }}>{trocasFicha.length}</span>
              )}
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
              {trocasFicha.map(t => (
                <div key={t.id} style={{ padding: 14, border: '1px solid var(--csa-border)', borderRadius: 10, display: 'flex', flexDirection: 'column', gap: 10 }}>
                  <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
                    <button type="button" onClick={() => removeTroca(t.id)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#ef4444', padding: 4 }}><X size={16} /></button>
                  </div>
                  <div style={{ display: 'grid', gap: 10, gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))' }}>
                    <div>
                      <label style={{ ...labelStyle, fontSize: 13 }}>Nome do membro *</label>
                      <input style={{ ...inputStyle, padding: '10px 12px', fontSize: 14 }} value={t.nome_membro} placeholder="Nome de serviço" onChange={e => updateTroca(t.id, 'nome_membro', e.target.value)} />
                    </div>
                    <div>
                      <label style={{ ...labelStyle, fontSize: 13 }}>Ficha *</label>
                      <select style={{ ...inputStyle, padding: '10px 12px', fontSize: 14 }} value={t.ficha} onChange={e => updateTroca(t.id, 'ficha', e.target.value)}>
                        {FICHAS.map(f => <option key={f} value={f}>{f}</option>)}
                      </select>
                    </div>
                    <div>
                      <label style={{ ...labelStyle, fontSize: 13 }}>Padrinho / Madrinha *</label>
                      <input style={{ ...inputStyle, padding: '10px 12px', fontSize: 14 }} value={t.nome_padrinho} placeholder="Nome de serviço" onChange={e => updateTroca(t.id, 'nome_padrinho', e.target.value)} />
                    </div>
                  </div>
                </div>
              ))}
            </div>
            <button type="button" onClick={addTroca} className="btn-secondary" style={{ marginTop: 10, fontSize: 14 }}>
              <Award size={15} /> Adicionar troca de ficha
            </button>
          </div>
        </div>
      )
    }

    // Etapa 4 ─ Tesouraria
    if (step === 3) {
      const fmt = (v: number) => v.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })
      return (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
          <div style={{ padding: '16px 20px', borderRadius: 12, background: 'var(--csa-tint)', border: '1px solid var(--csa-tint-border)' }}>
            <p style={{ fontSize: 13, color: 'var(--csa-text-2)', marginBottom: 4 }}>Saldo anterior</p>
            <p style={{ fontSize: 24, fontWeight: 700, color: 'var(--csa-text-1)' }}>{fmt(saldoAnterior)}</p>
            <p style={{ fontSize: 12, color: 'var(--csa-text-3)', marginTop: 4 }}>Herdado da reunião anterior</p>
          </div>
          <div>
            <label style={labelStyle}>Sétima tradição (contribuições)</label>
            <input type="number" step="0.01" min="0" style={inputStyle} value={setimaTrad || ''} placeholder="0,00" onChange={e => setSetimaTrad(parseFloat(e.target.value) || 0)} />
          </div>
          <div>
            <label style={labelStyle}>Venda de literatura / fichas</label>
            <input type="number" step="0.01" min="0" style={inputStyle} value={vendas || ''} placeholder="0,00" onChange={e => setVendas(parseFloat(e.target.value) || 0)} />
          </div>
          <div>
            <label style={labelStyle}>Despesas diversas</label>
            <input type="number" step="0.01" min="0" style={inputStyle} value={despesas || ''} placeholder="0,00" onChange={e => setDespesas(parseFloat(e.target.value) || 0)} />
          </div>
          <div style={{ padding: '20px 24px', borderRadius: 14, background: 'var(--csa-tint)', border: '2px solid var(--csa-tint-border)' }}>
            <p style={{ fontSize: 13, color: 'var(--csa-text-2)', marginBottom: 8 }}>Saldo atual calculado</p>
            <p style={{ fontSize: 32, fontWeight: 800, marginBottom: 8, color: saldoAtual >= 0 ? '#15803d' : '#dc2626' }}>
              {fmt(saldoAtual)}
            </p>
            <p style={{ fontSize: 12, color: 'var(--csa-text-3)', fontFamily: 'monospace' }}>
              {fmt(saldoAnterior)} + {fmt(setimaTrad)} + {fmt(vendas)} − {fmt(despesas)} = {fmt(saldoAtual)}
            </p>
          </div>
        </div>
      )
    }

    // Etapa 5 ─ Encargos e observações
    if (step === 4) {
      const encargosFields: { key: keyof Encargos; label: string }[] = [
        { key: 'rsg',          label: 'RSG' },
        { key: 'rsg_suplente', label: 'RSG Suplente' },
        { key: 'secretario',   label: 'Secretário(a)' },
        { key: 'tesoureiro',   label: 'Tesoureiro(a)' },
        { key: 'bem_estar',    label: 'Bem Estar' },
      ]
      return (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 28 }}>
          <div>
            <p style={{ fontWeight: 600, color: 'var(--csa-text-1)', marginBottom: 4 }}>Encargos do grupo</p>
            <p style={{ fontSize: 13, color: 'var(--csa-text-2)', marginBottom: 16 }}>
              Preenchidos automaticamente com base nos servidores cadastrados. Corrija se necessário.
            </p>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
              {encargosFields.map(({ key, label }) => (
                <div key={key}>
                  <label style={labelStyle}>{label}</label>
                  <input style={inputStyle} value={encargos[key]} placeholder="—" onChange={e => setEncargo(key, e.target.value)} />
                </div>
              ))}
            </div>
          </div>

          <hr style={{ border: 'none', borderTop: '1px solid var(--csa-border)' }} />

          <div>
            <label style={labelStyle}>Literatura lida na reunião</label>
            <input style={inputStyle} value={literaturaLida} placeholder="Ex: Básico cap. 4, Só por Hoje pág. 112" onChange={e => setLiteraturaLida(e.target.value)} />
          </div>
          <div>
            <label style={labelStyle}>
              Recados / Observações gerais
              <span style={{ float: 'right', fontWeight: 400, color: 'var(--csa-text-3)', fontSize: 12 }}>
                {observacoes.length}/2000
              </span>
            </label>
            <textarea
              rows={6} maxLength={2000}
              style={{ ...inputStyle, resize: 'vertical', minHeight: 140 }}
              value={observacoes}
              placeholder="Espaço livre para registrar recados, decisões, observações importantes da reunião..."
              onChange={e => setObservacoes(e.target.value)}
            />
          </div>
        </div>
      )
    }

    return null
  }

  // ─── Modal de confirmação ──────────────────────────────────────────────────
  const ModalConfirmacao = () => modal ? (
    <div style={{ position: 'fixed', inset: 0, zIndex: 100, background: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 20 }}>
      <div style={{ background: 'var(--csa-surface)', borderRadius: 16, padding: 28, maxWidth: 400, width: '100%', boxShadow: '0 20px 60px rgba(0,0,0,0.2)' }}>
        <h3 style={{ fontWeight: 700, fontSize: 18, color: 'var(--csa-text-1)', marginBottom: 12 }}>Salvar esta ata?</h3>
        <p style={{ color: 'var(--csa-text-2)', fontSize: 14, marginBottom: 24 }}>
          A ata será salva e ficará visível publicamente no portal do grupo.
        </p>
        <div style={{ display: 'flex', gap: 10 }}>
          <button className="btn-primary" style={{ flex: 1 }} disabled={loading} onClick={handleSalvar}>
            <CheckCircle size={15} /> {loading ? 'Salvando...' : 'Confirmar'}
          </button>
          <button className="btn-secondary" style={{ flex: 1 }} onClick={() => setModal(false)} disabled={loading}>Cancelar</button>
        </div>
        {erroStep && (
          <div style={{ marginTop: 12, fontSize: 13, color: '#dc2626', background: '#fef2f2', border: '1px solid #fecaca', borderRadius: 8, padding: '8px 12px' }}>
            {erroStep}
          </div>
        )}
      </div>
    </div>
  ) : null

  // ─── Layout principal ──────────────────────────────────────────────────────
  return (
    <div style={{ maxWidth: 640, margin: '0 auto' }}>
      <ModalConfirmacao />

      <div className="card">
        {/* Banner OCR */}
        {ocrUtilizado && (
          <div style={{
            display: 'flex', alignItems: 'center', gap: 8, marginBottom: 20,
            padding: '10px 14px', borderRadius: 10,
            background: '#fefce8', border: '1px solid #fde68a',
          }}>
            <Sparkles size={15} style={{ color: '#b45309', flexShrink: 0 }} />
            <p style={{ flex: 1, fontSize: 13, color: '#92400e' }}>
              Formulário pré-preenchido pela IA. Revise cada campo antes de salvar.
            </p>
            <button
              type="button"
              onClick={() => setOcrUtilizado(false)}
              style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#b45309', padding: 2, flexShrink: 0, display: 'flex' }}
            >
              <X size={14} />
            </button>
          </div>
        )}

        <ProgressBar step={step} total={5} />
        <div style={{ marginBottom: 24 }}>
          <h2 style={{ fontSize: 20, fontWeight: 700, color: 'var(--csa-text-1)', marginBottom: 4 }}>
            {STEP_TITLES[step]}
          </h2>
          <p style={{ fontSize: 14, color: 'var(--csa-text-2)' }}>
            {step === 0 && 'Preencha as informações básicas desta reunião'}
            {step === 1 && 'O primeiro lugar (01) é sempre o Poder Superior'}
            {step === 2 && 'Deixe em branco se não houve nesta reunião'}
            {step === 3 && 'Registre os valores desta reunião'}
            {step === 4 && 'Confirme os encargos do grupo e adicione observações'}
          </p>
        </div>

        {renderEtapa()}

        {erroStep && (
          <div style={{ marginTop: 20, fontSize: 14, color: '#dc2626', background: '#fef2f2', border: '1px solid #fecaca', borderRadius: 10, padding: '12px 16px' }}>
            {erroStep}
          </div>
        )}

        {/* Rodapé de navegação */}
        <div style={{ marginTop: 28, display: 'flex', justifyContent: step === 0 ? 'flex-end' : 'space-between', gap: 12, flexWrap: 'wrap' }}>
          {step > 0 && (
            <button type="button" className="btn-secondary" onClick={voltar}>
              <ChevronLeft size={16} /> Voltar
            </button>
          )}
          {step === 0 && (
            <button type="button" className="btn-secondary" onClick={() => setModoEntrada('escolha')} style={{ marginRight: 'auto' }}>
              ← Método de entrada
            </button>
          )}
          {step < 4 ? (
            <button type="button" className="btn-primary" onClick={avancar}>
              Próximo <ChevronRight size={16} />
            </button>
          ) : (
            <button
              type="button" className="btn-primary"
              style={{ width: '100%', justifyContent: 'center', padding: '14px 24px', fontSize: 16 }}
              onClick={() => { if (validarEtapa()) setModal(true) }}
            >
              <CheckCircle size={18} /> Salvar ata
            </button>
          )}
        </div>
      </div>
    </div>
  )
}
