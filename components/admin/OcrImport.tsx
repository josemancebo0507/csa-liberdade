'use client'
import { useState, useRef, useEffect } from 'react'
import {
  Camera, PenLine, ImagePlus, Lightbulb, Loader2,
  CheckCircle, AlertTriangle, AlertCircle, Sparkles,
  ArrowRight, Info, Pencil, X as XIcon, Plus,
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

const FICHAS = [
  '30 dias','60 dias','90 dias','6 meses','9 meses','1 ano',
  '18 meses','2 anos','3 anos','4 anos','5 anos','10 anos',
  '15 anos','20 anos','25 anos','30 anos','Outro',
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

// ─── Campo editável inline ────────────────────────────────────────────────────

interface CampoEditavelProps {
  valor: string | number | null
  placeholder: string
  tipo: 'text' | 'number' | 'date' | 'select'
  opcoes?: string[]
  onSalvar: (novoValor: string | number | null) => void
  modificado?: boolean
  currency?: boolean
}

function CampoEditavel({ valor, placeholder, tipo, opcoes, onSalvar, modificado, currency }: CampoEditavelProps) {
  const [editando, setEditando] = useState(false)
  const [valorLocal, setValorLocal] = useState<string>(valor !== null && valor !== undefined ? String(valor) : '')
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const inputRef = useRef<any>(null)

  useEffect(() => {
    if (!editando) setValorLocal(valor !== null && valor !== undefined ? String(valor) : '')
  }, [valor, editando])

  useEffect(() => {
    if (editando && inputRef.current) inputRef.current.focus()
  }, [editando])

  function confirmar() {
    const trimmed = typeof valorLocal === 'string' ? valorLocal.trim() : String(valorLocal)
    let novo: string | number | null = trimmed === '' ? null : trimmed
    if (tipo === 'number') novo = trimmed === '' ? null : parseFloat(trimmed)
    onSalvar(novo)
    setEditando(false)
  }

  function cancelar() {
    setValorLocal(valor !== null && valor !== undefined ? String(valor) : '')
    setEditando(false)
  }

  function displayValue(): React.ReactNode {
    if (valor === null || valor === '' || valor === undefined) {
      return <em style={{ color: 'var(--csa-text-3)', fontStyle: 'italic' }}>{placeholder}</em>
    }
    if (tipo === 'date') return fmtData(String(valor)) ?? String(valor)
    if (tipo === 'select') {
      const m: Record<string, string> = { aberta: 'Aberta', fechada: 'Fechada' }
      return m[String(valor)] ?? String(valor)
    }
    if (tipo === 'number') return currency ? fmtMoeda(Number(valor)) : String(valor)
    return String(valor)
  }

  const vazio = valor === null || valor === '' || valor === undefined

  const baseStyle: React.CSSProperties = {
    border: '1px solid var(--csa-accent)',
    borderRadius: 6, padding: '3px 8px', fontSize: 13,
    color: 'var(--csa-text-1)', background: 'var(--csa-surface)',
    outline: 'none', width: '100%', boxSizing: 'border-box',
  }

  if (editando) {
    if (tipo === 'select') {
      return (
        <select
          ref={inputRef}
          value={valorLocal}
          onChange={e => {
            const v = e.target.value
            setValorLocal(v)
            onSalvar(v === '' ? null : v)
            setEditando(false)
          }}
          onBlur={confirmar}
          onKeyDown={e => { if (e.key === 'Escape') cancelar() }}
          style={baseStyle}
        >
          <option value="">— selecionar —</option>
          {opcoes?.map(op => (
            <option key={op} value={op}>{op.charAt(0).toUpperCase() + op.slice(1)}</option>
          ))}
        </select>
      )
    }
    return (
      <input
        ref={inputRef}
        type={tipo}
        value={valorLocal}
        step={tipo === 'number' ? '0.01' : undefined}
        onChange={e => setValorLocal(e.target.value)}
        onKeyDown={e => {
          if (e.key === 'Enter') { e.preventDefault(); confirmar() }
          if (e.key === 'Escape') cancelar()
        }}
        onBlur={confirmar}
        style={baseStyle}
      />
    )
  }

  return (
    <span
      className="group"
      onClick={() => setEditando(true)}
      title="Clique para editar"
      style={{
        display: 'inline-flex', alignItems: 'center', gap: 4, cursor: 'pointer',
        borderBottom: '1px dashed var(--csa-border)', paddingBottom: 1,
      }}
    >
      <span style={{
        fontSize: 13,
        color: vazio ? 'var(--csa-text-3)' : 'var(--csa-text-1)',
        fontWeight: vazio ? 400 : 500,
      }}>
        {displayValue()}
      </span>
      {modificado && (
        <span title="Campo modificado" style={{
          display: 'inline-block', width: 6, height: 6,
          borderRadius: '50%', background: 'var(--csa-accent)', flexShrink: 0,
        }} />
      )}
      <Pencil
        size={12}
        style={{ color: 'var(--csa-text-3)', flexShrink: 0, opacity: 0, transition: 'opacity 0.15s' }}
        className="group-hover:opacity-60"
      />
    </span>
  )
}

// ─── Contador de campos modificados ──────────────────────────────────────────

function contarModificados(orig: DadosOcr | null, edit: DadosOcr | null): number {
  if (!orig || !edit) return 0
  let n = 0

  if (orig.secretario    !== edit.secretario)    n++
  if (orig.coordenador   !== edit.coordenador)   n++
  if (orig.numero_reuniao !== edit.numero_reuniao) n++
  if (orig.data_reuniao  !== edit.data_reuniao)  n++
  if (orig.tipo_reuniao  !== edit.tipo_reuniao)  n++
  if (orig.literatura_lida !== edit.literatura_lida) n++

  const maxP = Math.max(orig.presencas.length, edit.presencas.length)
  for (let i = 0; i < maxP; i++) {
    const op = orig.presencas[i]; const ep = edit.presencas[i]
    if (!op || !ep) n++
    else if (op.nome !== ep.nome) n++
  }

  const maxV = Math.max(orig.visitantes.length, edit.visitantes.length)
  for (let i = 0; i < maxV; i++) {
    const ov = orig.visitantes[i]; const ev = edit.visitantes[i]
    if (!ov || !ev) n++
    else if (ov.nome !== ev.nome) n++
  }

  const maxI = Math.max(orig.ingressos.length, edit.ingressos.length)
  for (let i = 0; i < maxI; i++) {
    const oi = orig.ingressos[i]; const ei = edit.ingressos[i]
    if (!oi || !ei) n++
    else {
      if (oi.nome_ingresso  !== ei.nome_ingresso)  n++
      if (oi.nome_padrinho  !== ei.nome_padrinho)  n++
      if (oi.como_conheceu  !== ei.como_conheceu)  n++
    }
  }

  const maxT = Math.max(orig.trocas_ficha.length, edit.trocas_ficha.length)
  for (let i = 0; i < maxT; i++) {
    const ot = orig.trocas_ficha[i]; const et = edit.trocas_ficha[i]
    if (!ot || !et) n++
    else {
      if (ot.nome_membro !== et.nome_membro) n++
      if (ot.ficha       !== et.ficha)       n++
      if (ot.nome_padrinho !== et.nome_padrinho) n++
    }
  }

  if (orig.tesouraria.saldo_anterior  !== edit.tesouraria.saldo_anterior)  n++
  if (orig.tesouraria.setima_tradicao !== edit.tesouraria.setima_tradicao) n++
  if (orig.tesouraria.vendas          !== edit.tesouraria.vendas)          n++
  if (orig.tesouraria.despesas        !== edit.tesouraria.despesas)        n++

  if (orig.encargos.rsg          !== edit.encargos.rsg)          n++
  if (orig.encargos.rsg_suplente !== edit.encargos.rsg_suplente) n++
  if (orig.encargos.secretario   !== edit.encargos.secretario)   n++
  if (orig.encargos.tesoureiro   !== edit.encargos.tesoureiro)   n++
  if (orig.encargos.bem_estar    !== edit.encargos.bem_estar)    n++

  return n
}

// ─── Componente principal ─────────────────────────────────────────────────────

export default function OcrImport({ onDadosExtraidos, onPularParaManual }: Props) {
  const [etapa,          setEtapa]          = useState<Etapa>('escolha')
  const [imagemPreview,  setImagemPreview]  = useState<string | null>(null)
  const [imagemFile,     setImagemFile]     = useState<File | null>(null)
  const [dadosExtraidos, setDadosExtraidos] = useState<DadosOcr | null>(null)
  const [dadosEditados,  setDadosEditados]  = useState<DadosOcr | null>(null)
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
      const dados: DadosOcr = json.dados
      setDadosExtraidos(dados)
      setDadosEditados(JSON.parse(JSON.stringify(dados)))
      setConfianca(dados.confianca_geral ?? 0)
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

      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        style={{ display: 'none' }}
        onChange={e => { const f = e.target.files?.[0]; if (f) handleFile(f) }}
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

  // ─── Tela: revisão com edição inline ─────────────────────────────────────

  if (etapa === 'revisao' && dadosEditados) {
    const de = dadosEditados
    const orig = dadosExtraidos!
    const corConfianca = CorBarraConfianca(confianca)
    const IconeConfianca = confianca >= 70 ? CheckCircle : confianca >= 40 ? AlertTriangle : AlertCircle
    const corIcone = confianca >= 70 ? '#16a34a' : confianca >= 40 ? '#d97706' : '#dc2626'
    const tituloConfianca = confianca >= 70 ? 'Ata lida com sucesso!' : confianca >= 40 ? 'Ata lida com algumas incertezas' : 'Leitura difícil — revise com atenção'
    const saldoCalc = (de.tesouraria.saldo_anterior ?? 0) + (de.tesouraria.setima_tradicao ?? 0) + (de.tesouraria.vendas ?? 0) - (de.tesouraria.despesas ?? 0)
    const totalMods = contarModificados(orig, de)

    function setScalar<K extends keyof DadosOcr>(campo: K, val: DadosOcr[K]) {
      setDadosEditados(prev => prev ? { ...prev, [campo]: val } : prev)
    }

    function setTesouraria(campo: keyof DadosOcr['tesouraria'], val: number | null) {
      setDadosEditados(prev => prev ? { ...prev, tesouraria: { ...prev.tesouraria, [campo]: val } } : prev)
    }

    function setEncargo(campo: keyof DadosOcr['encargos'], val: string | null) {
      setDadosEditados(prev => prev ? { ...prev, encargos: { ...prev.encargos, [campo]: val } } : prev)
    }

    function updatePresenca(idx: number, nome: string | null) {
      setDadosEditados(prev => {
        if (!prev) return prev
        const presencas = prev.presencas.map((p, i) => i === idx ? { ...p, nome: nome ?? '' } : p)
        return { ...prev, presencas }
      })
    }

    function removePresenca(idx: number) {
      setDadosEditados(prev => {
        if (!prev) return prev
        const presencas = prev.presencas.filter((_, i) => i !== idx).map((p, i) => ({ ...p, numero: i + 2 }))
        return { ...prev, presencas }
      })
    }

    function addPresenca() {
      setDadosEditados(prev => {
        if (!prev) return prev
        return { ...prev, presencas: [...prev.presencas, { numero: prev.presencas.length + 2, nome: '' }] }
      })
    }

    function updateVisitante(idx: number, nome: string | null) {
      setDadosEditados(prev => {
        if (!prev) return prev
        const visitantes = prev.visitantes.map((v, i) => i === idx ? { ...v, nome: nome ?? '' } : v)
        return { ...prev, visitantes }
      })
    }

    function removeVisitante(idx: number) {
      setDadosEditados(prev => {
        if (!prev) return prev
        const visitantes = prev.visitantes.filter((_, i) => i !== idx).map((v, i) => ({ ...v, numero: i + 1 }))
        return { ...prev, visitantes }
      })
    }

    function addVisitante() {
      setDadosEditados(prev => {
        if (!prev) return prev
        return { ...prev, visitantes: [...prev.visitantes, { numero: prev.visitantes.length + 1, nome: '' }] }
      })
    }

    function updateIngresso(idx: number, campo: keyof DadosOcr['ingressos'][0], val: string | null) {
      setDadosEditados(prev => {
        if (!prev) return prev
        const ingressos = prev.ingressos.map((ing, i) => i === idx ? { ...ing, [campo]: val } : ing)
        return { ...prev, ingressos }
      })
    }

    function removeIngresso(idx: number) {
      setDadosEditados(prev => prev ? { ...prev, ingressos: prev.ingressos.filter((_, i) => i !== idx) } : prev)
    }

    function addIngresso() {
      setDadosEditados(prev => prev ? { ...prev, ingressos: [...prev.ingressos, { nome_ingresso: '', nome_padrinho: '', como_conheceu: null }] } : prev)
    }

    function updateTroca(idx: number, campo: keyof DadosOcr['trocas_ficha'][0], val: string | null) {
      setDadosEditados(prev => {
        if (!prev) return prev
        const trocas_ficha = prev.trocas_ficha.map((t, i) => i === idx ? { ...t, [campo]: val ?? '' } : t)
        return { ...prev, trocas_ficha }
      })
    }

    function removeTroca(idx: number) {
      setDadosEditados(prev => prev ? { ...prev, trocas_ficha: prev.trocas_ficha.filter((_, i) => i !== idx) } : prev)
    }

    function addTroca() {
      setDadosEditados(prev => prev ? { ...prev, trocas_ficha: [...prev.trocas_ficha, { nome_membro: '', ficha: '30 dias', nome_padrinho: '' }] } : prev)
    }

    const btnAdicionar: React.CSSProperties = {
      display: 'flex', alignItems: 'center', gap: 4,
      fontSize: 12, color: 'var(--csa-accent)', background: 'none',
      border: '1px dashed var(--csa-accent)', borderRadius: 8,
      padding: '4px 10px', cursor: 'pointer', marginTop: 6,
      opacity: 0.8,
    }

    const btnRemover: React.CSSProperties = {
      background: 'none', border: 'none', cursor: 'pointer',
      color: 'var(--csa-text-3)', padding: '2px 4px', flexShrink: 0,
      display: 'flex', alignItems: 'center',
    }

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

        {/* Banner aviso + contador de edições */}
        <div style={{
          padding: '12px 16px', borderRadius: 12, marginBottom: 24,
          background: 'var(--csa-tint)', border: '1px solid var(--csa-tint-border)',
          display: 'flex', gap: 10, alignItems: 'flex-start',
        }}>
          <Info size={16} style={{ color: 'var(--csa-accent)', flexShrink: 0, marginTop: 1 }} />
          <div style={{ fontSize: 13, color: 'var(--csa-text-1)', lineHeight: 1.5 }}>
            <strong>
              {totalMods > 0
                ? `${totalMods} campo${totalMods === 1 ? '' : 's'} modificado${totalMods === 1 ? '' : 's'} · Revise e confirme`
                : 'Revise todos os campos antes de continuar.'}
            </strong>
            <br />
            Clique em qualquer valor para editar. A IA pode cometer erros em letras cursivas ou campos com rasuras.
          </div>
        </div>

        <div className="card" style={{ padding: '20px 24px' }}>
          {/* Dados gerais */}
          <SecaoRevisao titulo="Dados gerais">
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: 14 }}>
              {[
                { label: 'Secretário(a)',  campo: 'secretario'    as const, tipo: 'text'   as const },
                { label: 'Coordenador(a)', campo: 'coordenador'   as const, tipo: 'text'   as const },
                { label: 'Nº da reunião', campo: 'numero_reuniao' as const, tipo: 'number' as const },
                { label: 'Data',           campo: 'data_reuniao'  as const, tipo: 'date'   as const },
                { label: 'Literatura lida',campo: 'literatura_lida' as const, tipo: 'text' as const },
              ].map(({ label, campo, tipo }) => (
                <div key={campo}>
                  <p style={{ fontSize: 11, color: 'var(--csa-text-3)', marginBottom: 4, textTransform: 'uppercase', letterSpacing: '0.04em' }}>{label}</p>
                  <CampoEditavel
                    valor={de[campo] as string | number | null}
                    placeholder="Não identificado"
                    tipo={tipo}
                    modificado={(orig[campo] as unknown) !== (de[campo] as unknown)}
                    onSalvar={val => setScalar(campo, val as never)}
                  />
                </div>
              ))}
              <div>
                <p style={{ fontSize: 11, color: 'var(--csa-text-3)', marginBottom: 4, textTransform: 'uppercase', letterSpacing: '0.04em' }}>Tipo de reunião</p>
                <CampoEditavel
                  valor={de.tipo_reuniao}
                  placeholder="Não identificado"
                  tipo="select"
                  opcoes={['aberta', 'fechada']}
                  modificado={orig.tipo_reuniao !== de.tipo_reuniao}
                  onSalvar={val => setScalar('tipo_reuniao', (val as 'aberta' | 'fechada' | null))}
                />
              </div>
            </div>
          </SecaoRevisao>

          {/* Presenças */}
          <SecaoRevisao titulo={`Presenças (${de.presencas.length + 1} membros + ${de.visitantes.length} visitantes)`}>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 4, marginBottom: 4 }}>
              <div style={{ display: 'flex', gap: 10, padding: '5px 10px', background: '#fef9c3', borderRadius: 8 }}>
                <span style={{ width: 24, fontWeight: 700, color: '#92400e', fontSize: 12 }}>01</span>
                <span style={{ color: '#92400e', fontSize: 13, fontWeight: 500 }}>Poder Superior ✓</span>
              </div>
              {de.presencas.map((p, i) => (
                <div key={i} style={{ display: 'flex', gap: 10, padding: '5px 10px', background: 'var(--csa-tint)', borderRadius: 8, alignItems: 'center' }}>
                  <span style={{ width: 24, fontWeight: 700, color: 'var(--csa-text-3)', fontSize: 12, flexShrink: 0 }}>
                    {String(p.numero).padStart(2, '0')}
                  </span>
                  <span style={{ flex: 1 }}>
                    <CampoEditavel
                      valor={p.nome}
                      placeholder="Nome"
                      tipo="text"
                      modificado={orig.presencas[i]?.nome !== p.nome}
                      onSalvar={val => updatePresenca(i, val as string | null)}
                    />
                  </span>
                  <button style={btnRemover} onClick={() => removePresenca(i)} title="Remover presença">
                    <XIcon size={14} />
                  </button>
                </div>
              ))}
            </div>
            <button style={btnAdicionar} onClick={addPresenca}>
              <Plus size={12} /> Adicionar membro
            </button>

            {(de.visitantes.length > 0) && (
              <div style={{ marginTop: 12 }}>
                <p style={{ fontSize: 12, color: 'var(--csa-text-3)', marginBottom: 6 }}>Visitantes</p>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 4, marginBottom: 4 }}>
                  {de.visitantes.map((v, i) => (
                    <div key={i} style={{ display: 'flex', gap: 10, padding: '5px 10px', background: 'var(--csa-tint)', borderRadius: 8, alignItems: 'center' }}>
                      <span style={{ width: 28, fontWeight: 700, color: 'var(--csa-text-3)', fontSize: 12, flexShrink: 0 }}>
                        V{String(v.numero).padStart(2, '0')}
                      </span>
                      <span style={{ flex: 1 }}>
                        <CampoEditavel
                          valor={v.nome}
                          placeholder="Nome"
                          tipo="text"
                          modificado={orig.visitantes[i]?.nome !== v.nome}
                          onSalvar={val => updateVisitante(i, val as string | null)}
                        />
                      </span>
                      <button style={btnRemover} onClick={() => removeVisitante(i)} title="Remover visitante">
                        <XIcon size={14} />
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            )}
            <button style={btnAdicionar} onClick={addVisitante}>
              <Plus size={12} /> Adicionar visitante
            </button>
          </SecaoRevisao>

          {/* Ingressos */}
          <SecaoRevisao titulo="Ingressos">
            {de.ingressos.length === 0 ? (
              <p style={{ fontSize: 13, color: 'var(--csa-text-3)', fontStyle: 'italic', marginBottom: 6 }}>Nenhum registrado nesta ata</p>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 8, marginBottom: 6 }}>
                {de.ingressos.map((ing, i) => (
                  <div key={i} style={{ padding: '8px 12px', background: 'var(--csa-tint)', borderRadius: 8, position: 'relative' }}>
                    <button
                      style={{ ...btnRemover, position: 'absolute', top: 6, right: 6 }}
                      onClick={() => removeIngresso(i)} title="Remover ingresso"
                    >
                      <XIcon size={14} />
                    </button>
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8, paddingRight: 20 }}>
                      <div>
                        <p style={{ fontSize: 11, color: 'var(--csa-text-3)', marginBottom: 3 }}>Nome</p>
                        <CampoEditavel
                          valor={ing.nome_ingresso}
                          placeholder="Nome"
                          tipo="text"
                          modificado={orig.ingressos[i]?.nome_ingresso !== ing.nome_ingresso}
                          onSalvar={val => updateIngresso(i, 'nome_ingresso', val as string | null)}
                        />
                      </div>
                      <div>
                        <p style={{ fontSize: 11, color: 'var(--csa-text-3)', marginBottom: 3 }}>Padrinho/Madrinha</p>
                        <CampoEditavel
                          valor={ing.nome_padrinho}
                          placeholder="Nome"
                          tipo="text"
                          modificado={orig.ingressos[i]?.nome_padrinho !== ing.nome_padrinho}
                          onSalvar={val => updateIngresso(i, 'nome_padrinho', val as string | null)}
                        />
                      </div>
                      <div style={{ gridColumn: '1 / -1' }}>
                        <p style={{ fontSize: 11, color: 'var(--csa-text-3)', marginBottom: 3 }}>Como conheceu</p>
                        <CampoEditavel
                          valor={ing.como_conheceu}
                          placeholder="Não informado"
                          tipo="text"
                          modificado={orig.ingressos[i]?.como_conheceu !== ing.como_conheceu}
                          onSalvar={val => updateIngresso(i, 'como_conheceu', val as string | null)}
                        />
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
            <button style={btnAdicionar} onClick={addIngresso}>
              <Plus size={12} /> Adicionar ingresso
            </button>
          </SecaoRevisao>

          {/* Trocas de ficha */}
          <SecaoRevisao titulo="Trocas de ficha">
            {de.trocas_ficha.length === 0 ? (
              <p style={{ fontSize: 13, color: 'var(--csa-text-3)', fontStyle: 'italic', marginBottom: 6 }}>Nenhuma registrada nesta ata</p>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 8, marginBottom: 6 }}>
                {de.trocas_ficha.map((t, i) => (
                  <div key={i} style={{ padding: '8px 12px', background: 'var(--csa-tint)', borderRadius: 8, position: 'relative' }}>
                    <button
                      style={{ ...btnRemover, position: 'absolute', top: 6, right: 6 }}
                      onClick={() => removeTroca(i)} title="Remover troca"
                    >
                      <XIcon size={14} />
                    </button>
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8, paddingRight: 20 }}>
                      <div>
                        <p style={{ fontSize: 11, color: 'var(--csa-text-3)', marginBottom: 3 }}>Membro</p>
                        <CampoEditavel
                          valor={t.nome_membro}
                          placeholder="Nome"
                          tipo="text"
                          modificado={orig.trocas_ficha[i]?.nome_membro !== t.nome_membro}
                          onSalvar={val => updateTroca(i, 'nome_membro', val as string | null)}
                        />
                      </div>
                      <div>
                        <p style={{ fontSize: 11, color: 'var(--csa-text-3)', marginBottom: 3 }}>Ficha</p>
                        <CampoEditavel
                          valor={t.ficha}
                          placeholder="Selecionar"
                          tipo="select"
                          opcoes={FICHAS}
                          modificado={orig.trocas_ficha[i]?.ficha !== t.ficha}
                          onSalvar={val => updateTroca(i, 'ficha', val as string | null)}
                        />
                      </div>
                      <div style={{ gridColumn: '1 / -1' }}>
                        <p style={{ fontSize: 11, color: 'var(--csa-text-3)', marginBottom: 3 }}>Padrinho/Madrinha</p>
                        <CampoEditavel
                          valor={t.nome_padrinho}
                          placeholder="Nome"
                          tipo="text"
                          modificado={orig.trocas_ficha[i]?.nome_padrinho !== t.nome_padrinho}
                          onSalvar={val => updateTroca(i, 'nome_padrinho', val as string | null)}
                        />
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
            <button style={btnAdicionar} onClick={addTroca}>
              <Plus size={12} /> Adicionar troca de ficha
            </button>
          </SecaoRevisao>

          {/* Tesouraria */}
          <SecaoRevisao titulo="Tesouraria">
            <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
              {[
                { l: 'Saldo anterior',  campo: 'saldo_anterior'  as const },
                { l: 'Sétima tradição', campo: 'setima_tradicao' as const },
                { l: 'Vendas',          campo: 'vendas'          as const },
                { l: 'Despesas',        campo: 'despesas'        as const },
              ].map(({ l, campo }) => (
                <div key={campo} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: 13, padding: '5px 0', borderBottom: '1px solid var(--csa-border)' }}>
                  <span style={{ color: 'var(--csa-text-2)' }}>{l}</span>
                  <CampoEditavel
                    valor={de.tesouraria[campo]}
                    placeholder="R$ 0,00"
                    tipo="number"
                    currency
                    modificado={orig.tesouraria[campo] !== de.tesouraria[campo]}
                    onSalvar={val => setTesouraria(campo, val as number | null)}
                  />
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
                { l: 'RSG',           campo: 'rsg'          as const },
                { l: 'RSG Suplente',  campo: 'rsg_suplente' as const },
                { l: 'Secretário(a)', campo: 'secretario'   as const },
                { l: 'Tesoureiro(a)', campo: 'tesoureiro'   as const },
                { l: 'Bem Estar',     campo: 'bem_estar'    as const },
              ].map(({ l, campo }) => (
                <div key={campo}>
                  <p style={{ fontSize: 11, color: 'var(--csa-text-3)', marginBottom: 4, textTransform: 'uppercase', letterSpacing: '0.04em' }}>{l}</p>
                  <CampoEditavel
                    valor={de.encargos[campo]}
                    placeholder="Não identificado"
                    tipo="text"
                    modificado={orig.encargos[campo] !== de.encargos[campo]}
                    onSalvar={val => setEncargo(campo, val as string | null)}
                  />
                </div>
              ))}
            </div>
          </SecaoRevisao>
        </div>

        {/* Botões */}
        <div style={{ display: 'flex', gap: 12, justifyContent: 'space-between', flexWrap: 'wrap', marginTop: 24 }}>
          <button type="button" className="btn-secondary" onClick={() => setEtapa('upload')}>
            ← Tirar outra foto
          </button>
          <button type="button" className="btn-primary" onClick={() => onDadosExtraidos(de)}>
            {totalMods > 0
              ? `Preencher com dados corrigidos (${totalMods}) `
              : 'Preencher com esses dados '}
            <ArrowRight size={16} />
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
