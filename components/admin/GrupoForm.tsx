'use client'
import { useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { useRouter } from 'next/navigation'
import { Save, Trash2 } from 'lucide-react'
import type { Grupo } from '@/lib/types'

interface Props {
  grupo?: Grupo
}

export default function GrupoForm({ grupo }: Props) {
  const router = useRouter()
  const supabase = createClient()
  const isEdicao = !!grupo

  const [form, setForm] = useState({
    nome:        grupo?.nome        ?? '',
    cidade:      grupo?.cidade      ?? '',
    bairro:      grupo?.bairro      ?? '',
    endereco:    grupo?.endereco    ?? '',
    status:      grupo?.status      ?? 'ativo',
    observacoes: grupo?.observacoes ?? '',
  })
  const [loading, setLoading] = useState(false)
  const [erro, setErro] = useState('')

  function set(field: string, value: string) {
    setForm(f => ({ ...f, [field]: value }))
  }

  async function handleSalvar(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)
    setErro('')

    const payload = {
      nome:        form.nome.trim(),
      cidade:      form.cidade.trim(),
      bairro:      form.bairro.trim() || null,
      endereco:    form.endereco.trim() || null,
      status:      form.status,
      observacoes: form.observacoes.trim() || null,
      atualizado_em: new Date().toISOString(),
    }

    let error
    if (isEdicao) {
      ;({ error } = await supabase.from('grupos').update(payload).eq('id', grupo!.id))
    } else {
      ;({ error } = await supabase.from('grupos').insert(payload))
    }

    if (error) {
      setErro('Erro ao salvar. Tente novamente.')
      setLoading(false)
      return
    }

    router.push('/admin/grupos')
  }

  async function handleInativar() {
    if (!confirm('Inativar este grupo?')) return
    await supabase.from('grupos').update({ status: 'inativo', atualizado_em: new Date().toISOString() }).eq('id', grupo!.id)
    router.push('/admin/grupos')
  }

  return (
    <form onSubmit={handleSalvar} className="space-y-4 max-w-xl">
      <div>
        <label className="form-label">Nome do grupo *</label>
        <input className="form-input" value={form.nome} onChange={e => set('nome', e.target.value)} required />
      </div>

      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className="form-label">Cidade *</label>
          <input className="form-input" value={form.cidade} onChange={e => set('cidade', e.target.value)} required />
        </div>
        <div>
          <label className="form-label">Bairro</label>
          <input className="form-input" value={form.bairro} onChange={e => set('bairro', e.target.value)} />
        </div>
      </div>

      <div>
        <label className="form-label">Endereço</label>
        <input className="form-input" value={form.endereco} onChange={e => set('endereco', e.target.value)} placeholder="Rua, número, complemento" />
      </div>

      <div>
        <label className="form-label">Status</label>
        <select className="form-select" value={form.status} onChange={e => set('status', e.target.value)}>
          <option value="ativo">Ativo</option>
          <option value="inativo">Inativo</option>
        </select>
      </div>

      <div>
        <label className="form-label">Observações</label>
        <textarea className="form-textarea" rows={3} value={form.observacoes} onChange={e => set('observacoes', e.target.value)} />
      </div>

      {erro && <div className="text-sm text-red-600 bg-red-50 border border-red-200 rounded-lg px-3 py-2">{erro}</div>}

      <div className="flex items-center gap-3 pt-2">
        <button type="submit" disabled={loading} className="btn-primary">
          <Save size={15} /> {loading ? 'Salvando...' : 'Salvar grupo'}
        </button>
        <button type="button" onClick={() => router.back()} className="btn-secondary">
          Cancelar
        </button>
        {isEdicao && grupo?.status === 'ativo' && (
          <button type="button" onClick={handleInativar} className="btn-danger ml-auto">
            <Trash2 size={15} /> Inativar
          </button>
        )}
      </div>
    </form>
  )
}
