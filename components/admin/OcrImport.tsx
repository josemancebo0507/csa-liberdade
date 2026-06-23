'use client'
import { useState, useRef, useEffect } from 'react'
import {
  Camera, PenLine, ImagePlus, Lightbulb, Loader2,
  AlertCircle, Sparkles,
} from 'lucide-react'
import type { DadosOcr } from '@/lib/types-ata'

type Etapa = 'escolha' | 'upload' | 'processando' | 'erro'

interface Props {
  onDadosExtraidos: (dados: DadosOcr) => void
  onPularParaManual: () => void
}

const MENSAGENS = [
  'Identificando campos preenchidos...',
  'Lendo nomes e valores...',
  'Organizando as informações...',
  'Preparando o formulário...',
  'Quase pronto...',
]

export default function OcrImport({ onDadosExtraidos, onPularParaManual }: Props) {
  const [etapa,         setEtapa]         = useState<Etapa>('escolha')
  const [imagemPreview, setImagemPreview] = useState<string | null>(null)
  const [imagemFile,    setImagemFile]    = useState<File | null>(null)
  const [erro,          setErro]          = useState<string | null>(null)
  const [msgIdx,        setMsgIdx]        = useState(0)
  const [isDragOver,    setIsDragOver]    = useState(false)

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
      onDadosExtraidos(json.dados)
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

  // ─── Tela: erro ───────────────────────────────────────────────────────────

  return (
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
}
