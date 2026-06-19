'use client'
import { useState, useRef } from 'react'
import { createClient } from '@/lib/supabase/client'
import { FileText, Upload, Trash2, Loader2 } from 'lucide-react'

const STORAGE_URL = 'https://ehbosnplrsixaloivtbe.supabase.co/storage/v1/object/public/atas'

interface Ata {
  id: string
  titulo: string
  data_reuniao: string
  descricao?: string | null
  storage_path: string
  arquivo_nome: string
  tamanho_bytes?: number | null
}

export default function AtasAdmin({ atasIniciais }: { atasIniciais: Ata[] }) {
  const [atas, setAtas]               = useState<Ata[]>(atasIniciais)
  const [titulo, setTitulo]           = useState('')
  const [dataReuniao, setDataReuniao] = useState('')
  const [descricao, setDescricao]     = useState('')
  const [arquivo, setArquivo]         = useState<File | null>(null)
  const [loading, setLoading]         = useState(false)
  const [erro, setErro]               = useState('')
  const [deletingId, setDeletingId]   = useState<string | null>(null)
  const fileRef = useRef<HTMLInputElement>(null)
  const supabase = createClient()

  /* ── Upload ──────────────────────────────────────────── */
  async function handleUpload(e: React.FormEvent) {
    e.preventDefault()
    if (!arquivo) return
    setLoading(true); setErro('')

    const dt   = new Date(dataReuniao + 'T12:00:00')
    const ano  = dt.getFullYear()
    const mes  = String(dt.getMonth() + 1).padStart(2, '0')
    const uuid = crypto.randomUUID()
    const safe = arquivo.name.replace(/[^a-zA-Z0-9._-]/g, '_')
    const path = `${ano}/${mes}/${uuid}-${safe}`

    const { error: stErr } = await supabase.storage
      .from('atas')
      .upload(path, arquivo, { contentType: 'application/pdf' })

    if (stErr) { setErro(`Erro no upload: ${stErr.message}`); setLoading(false); return }

    const { data: nova, error: dbErr } = await supabase
      .from('atas_reuniao')
      .insert({ titulo, data_reuniao: dataReuniao, descricao: descricao || null,
                storage_path: path, arquivo_nome: arquivo.name, tamanho_bytes: arquivo.size })
      .select()
      .single()

    if (dbErr) {
      setErro(`Erro ao salvar: ${dbErr.message}`)
      await supabase.storage.from('atas').remove([path])
    } else {
      setAtas(prev => [nova, ...prev])
      setTitulo(''); setDataReuniao(''); setDescricao(''); setArquivo(null)
      if (fileRef.current) fileRef.current.value = ''
    }
    setLoading(false)
  }

  /* ── Delete ──────────────────────────────────────────── */
  async function handleDelete(ata: Ata) {
    if (!confirm(`Excluir "${ata.titulo}"? Esta ação não pode ser desfeita.`)) return
    setDeletingId(ata.id)
    await supabase.storage.from('atas').remove([ata.storage_path])
    await supabase.from('atas_reuniao').delete().eq('id', ata.id)
    setAtas(prev => prev.filter(a => a.id !== ata.id))
    setDeletingId(null)
  }

  /* ── Helpers ─────────────────────────────────────────── */
  function fmtSize(b?: number | null) {
    if (!b) return ''
    return b < 1024 * 1024 ? `${Math.round(b / 1024)} KB` : `${(b / 1024 / 1024).toFixed(1)} MB`
  }
  function fmtDate(d: string) {
    return new Date(d + 'T12:00:00').toLocaleDateString('pt-BR', { month: 'long', year: 'numeric' })
  }

  /* ── Render ──────────────────────────────────────────── */
  return (
    <div>
      {/* Formulário de upload */}
      <div className="card mb-6" style={{ borderRadius: 16 }}>
        <h3 className="font-semibold mb-4" style={{ color: 'var(--csa-text-1)' }}>
          Adicionar ata
        </h3>
        <form onSubmit={handleUpload} className="space-y-3">
          <div className="grid sm:grid-cols-2 gap-3">
            <div>
              <label className="form-label">Título</label>
              <input className="form-input" value={titulo} onChange={e => setTitulo(e.target.value)}
                placeholder="Ex: Ata de Abril de 2026" required />
            </div>
            <div>
              <label className="form-label">Data da reunião</label>
              <input type="date" className="form-input" value={dataReuniao}
                onChange={e => setDataReuniao(e.target.value)} required />
            </div>
          </div>
          <div>
            <label className="form-label">Descrição (opcional)</label>
            <textarea className="form-input form-textarea" rows={2} value={descricao}
              onChange={e => setDescricao(e.target.value)} placeholder="Breve descrição da reunião..." />
          </div>
          <div>
            <label className="form-label">Arquivo PDF</label>
            <input ref={fileRef} type="file" accept=".pdf" className="form-input"
              onChange={e => setArquivo(e.target.files?.[0] ?? null)} required />
          </div>
          {erro && (
            <p className="text-sm text-red-600 bg-red-50 border border-red-200 rounded-lg px-3 py-2">{erro}</p>
          )}
          <button type="submit" disabled={loading} className="btn-primary">
            {loading ? <Loader2 size={15} className="animate-spin" /> : <Upload size={15} />}
            {loading ? 'Enviando...' : 'Enviar ata'}
          </button>
        </form>
      </div>

      {/* Lista de atas */}
      <div className="space-y-2">
        {atas.length === 0 ? (
          <div className="card text-center py-8 text-sm" style={{ color: 'var(--csa-text-3)' }}>
            Nenhuma ata cadastrada.
          </div>
        ) : atas.map(ata => (
          <div key={ata.id} className="card flex items-center justify-between gap-4" style={{ padding: '14px 20px' }}>
            <div className="flex items-start gap-3 min-w-0">
              <FileText size={18} style={{ color: 'var(--csa-accent)', flexShrink: 0, marginTop: 2 }} />
              <div className="min-w-0">
                <div className="font-medium text-sm truncate" style={{ color: 'var(--csa-text-1)' }}>
                  {ata.titulo}
                </div>
                <div className="text-xs mt-0.5 capitalize" style={{ color: 'var(--csa-text-3)' }}>
                  {fmtDate(ata.data_reuniao)}{ata.tamanho_bytes ? ` · ${fmtSize(ata.tamanho_bytes)}` : ''}
                </div>
              </div>
            </div>
            <div className="flex gap-2 flex-shrink-0">
              <a href={`${STORAGE_URL}/${ata.storage_path}`} target="_blank" rel="noopener noreferrer"
                className="btn-secondary text-xs py-1.5 px-3">
                Visualizar
              </a>
              <button onClick={() => handleDelete(ata)} disabled={deletingId === ata.id}
                className="btn-danger text-xs py-1.5 px-3 flex items-center gap-1.5">
                {deletingId === ata.id ? <Loader2 size={13} className="animate-spin" /> : <Trash2 size={13} />}
                Excluir
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
