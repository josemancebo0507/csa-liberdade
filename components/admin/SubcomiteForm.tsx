'use client'
import { useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { useRouter } from 'next/navigation'
import { Save } from 'lucide-react'
import type { Subcomite } from '@/lib/types'

export default function SubcomiteForm({ subcomite }: { subcomite?: Subcomite }) {
  const router = useRouter()
  const supabase = createClient()
  const isEdicao = !!subcomite
  const [form, setForm] = useState({
    nome:      subcomite?.nome      ?? '',
    sigla:     subcomite?.sigla     ?? '',
    descricao: subcomite?.descricao ?? '',
    status:    subcomite?.status    ?? 'ativo',
  })
  const [loading, setLoading] = useState(false)
  const [erro, setErro] = useState('')

  function set(field: string, value: string) { setForm(f => ({ ...f, [field]: value })) }

  async function handleSalvar(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)
    setErro('')
    const payload = {
      nome:      form.nome.trim(),
      sigla:     form.sigla.trim() || null,
      descricao: form.descricao.trim() || null,
      status:    form.status,
      atualizado_em: new Date().toISOString(),
    }
    let error
    if (isEdicao) {
      ;({ error } = await supabase.from('subcomites').update(payload).eq('id', subcomite!.id))
    } else {
      ;({ error } = await supabase.from('subcomites').insert(payload))
    }
    if (error) { setErro('Erro ao salvar.'); setLoading(false); return }
    router.push('/admin/subcomites')
    router.refresh()
  }

  return (
    <form onSubmit={handleSalvar} className="space-y-4 max-w-xl">
      <div className="grid grid-cols-3 gap-3">
        <div className="col-span-2">
          <label className="form-label">Nome *</label>
          <input className="form-input" value={form.nome} onChange={e => set('nome', e.target.value)} required />
        </div>
        <div>
          <label className="form-label">Sigla</label>
          <input className="form-input" value={form.sigla} onChange={e => set('sigla', e.target.value)} placeholder="Ex: H&I" />
        </div>
      </div>
      <div>
        <label className="form-label">Descrição</label>
        <textarea className="form-textarea" rows={2} value={form.descricao} onChange={e => set('descricao', e.target.value)} />
      </div>
      <div>
        <label className="form-label">Status</label>
        <select className="form-select" value={form.status} onChange={e => set('status', e.target.value)}>
          <option value="ativo">Ativo</option>
          <option value="inativo">Inativo</option>
        </select>
      </div>
      {erro && <div className="text-sm text-red-600 bg-red-50 border border-red-200 rounded-lg px-3 py-2">{erro}</div>}
      <div className="flex gap-3 pt-2">
        <button type="submit" disabled={loading} className="btn-primary">
          <Save size={15} /> {loading ? 'Salvando...' : 'Salvar'}
        </button>
        <button type="button" onClick={() => router.back()} className="btn-secondary">Cancelar</button>
      </div>
    </form>
  )
}
