'use client'
import { useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { useRouter } from 'next/navigation'
import { Save } from 'lucide-react'
import type { Evento, TipoEvento, Grupo, Subcomite } from '@/lib/types'

interface Props {
  evento?: Evento
  tiposEvento: TipoEvento[]
  grupos: Grupo[]
  subcomites: Subcomite[]
}

export default function EventoForm({ evento, tiposEvento, grupos, subcomites }: Props) {
  const router = useRouter()
  const supabase = createClient()
  const isEdicao = !!evento

  const [form, setForm] = useState({
    titulo:         evento?.titulo         ?? '',
    data_evento:    evento?.data_evento    ?? '',
    horario:        evento?.horario?.slice(0,5) ?? '',
    tipo_evento_id: evento?.tipo_evento_id ?? '',
    responsavel:    evento?.responsavel    ?? 'area',
    grupo_id:       evento?.grupo_id       ?? '',
    subcomite_id:   evento?.subcomite_id   ?? '',
    local_link:     evento?.local_link     ?? '',
    descricao:      evento?.descricao      ?? '',
    link_externo:   evento?.link_externo   ?? '',
    status:         evento?.status         ?? 'publicado',
  })
  const [loading, setLoading] = useState(false)
  const [erro, setErro] = useState('')

  function set(field: string, value: string) { setForm(f => ({ ...f, [field]: value })) }

  async function handleSalvar(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)
    setErro('')

    const payload: any = {
      titulo:         form.titulo.trim(),
      data_evento:    form.data_evento,
      horario:        form.horario || null,
      tipo_evento_id: form.tipo_evento_id,
      responsavel:    form.responsavel,
      grupo_id:       form.responsavel === 'grupo'     ? form.grupo_id     || null : null,
      subcomite_id:   form.responsavel === 'subcomite' ? form.subcomite_id || null : null,
      local_link:     form.local_link.trim()   || null,
      descricao:      form.descricao.trim()    || null,
      link_externo:   form.link_externo.trim() || null,
      status:         form.status,
      atualizado_em:  new Date().toISOString(),
    }

    let error
    if (isEdicao) {
      ;({ error } = await supabase.from('eventos').update(payload).eq('id', evento!.id))
    } else {
      ;({ error } = await supabase.from('eventos').insert(payload))
    }

    if (error) { setErro('Erro ao salvar: ' + error.message); setLoading(false); return }
    router.push('/admin/eventos')
  }

  return (
    <form onSubmit={handleSalvar} className="space-y-4 max-w-xl">
      <div>
        <label className="form-label">Título *</label>
        <input className="form-input" value={form.titulo} onChange={e => set('titulo', e.target.value)} required />
      </div>

      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className="form-label">Data *</label>
          <input type="date" className="form-input" value={form.data_evento} onChange={e => set('data_evento', e.target.value)} required />
        </div>
        <div>
          <label className="form-label">Horário</label>
          <input type="time" className="form-input" value={form.horario} onChange={e => set('horario', e.target.value)} />
        </div>
      </div>

      <div>
        <label className="form-label">Tipo de evento *</label>
        <select className="form-select" value={form.tipo_evento_id} onChange={e => set('tipo_evento_id', e.target.value)} required>
          <option value="">Selecione...</option>
          {tiposEvento.map(t => <option key={t.id} value={t.id}>{t.nome}</option>)}
        </select>
      </div>

      <div>
        <label className="form-label">Responsável *</label>
        <select className="form-select" value={form.responsavel} onChange={e => set('responsavel', e.target.value)}>
          <option value="area">Área (CSA Liberdade)</option>
          <option value="grupo">Grupo</option>
          <option value="subcomite">Subcomitê</option>
        </select>
      </div>

      {form.responsavel === 'grupo' && (
        <div>
          <label className="form-label">Grupo *</label>
          <select className="form-select" value={form.grupo_id} onChange={e => set('grupo_id', e.target.value)} required>
            <option value="">Selecione o grupo...</option>
            {grupos.map(g => <option key={g.id} value={g.id}>{g.nome}</option>)}
          </select>
        </div>
      )}

      {form.responsavel === 'subcomite' && (
        <div>
          <label className="form-label">Subcomitê *</label>
          <select className="form-select" value={form.subcomite_id} onChange={e => set('subcomite_id', e.target.value)} required>
            <option value="">Selecione o subcomitê...</option>
            {subcomites.map(s => <option key={s.id} value={s.id}>{s.nome}</option>)}
          </select>
        </div>
      )}

      <div>
        <label className="form-label">Local ou link</label>
        <input className="form-input" value={form.local_link} onChange={e => set('local_link', e.target.value)} placeholder="Endereço, sala ou link online" />
      </div>

      <div>
        <label className="form-label">Descrição</label>
        <textarea className="form-textarea" rows={3} value={form.descricao} onChange={e => set('descricao', e.target.value)} />
      </div>

      <div>
        <label className="form-label">Link do cartaz</label>
        <input className="form-input" type="url" value={form.link_externo} onChange={e => set('link_externo', e.target.value)} placeholder="https://drive.google.com/..." />
        <p className="text-xs text-slate-400 mt-1">Cole o link para o cartaz no Google Drive, Instagram, etc.</p>
      </div>

      <div>
        <label className="form-label">Status</label>
        <select className="form-select" value={form.status} onChange={e => set('status', e.target.value)}>
          <option value="publicado">Publicado</option>
          <option value="cancelado">Cancelado</option>
        </select>
      </div>

      {erro && <div className="text-sm text-red-600 bg-red-50 border border-red-200 rounded-lg px-3 py-2">{erro}</div>}

      <div className="flex gap-3 pt-2">
        <button type="submit" disabled={loading} className="btn-primary">
          <Save size={15} /> {loading ? 'Salvando...' : 'Salvar evento'}
        </button>
        <button type="button" onClick={() => router.back()} className="btn-secondary">Cancelar</button>
      </div>
    </form>
  )
}
