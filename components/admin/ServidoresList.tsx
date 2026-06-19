'use client'
import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'
import { useRouter } from 'next/navigation'
import { Plus, Pencil, X, Check, User } from 'lucide-react'
import type { TipoEncargo } from '@/lib/types'

interface Props {
  tipo: 'grupo' | 'subcomite' | 'mesa'
  contextoId?: string
  vinculos: any[]
  tiposEncargo: TipoEncargo[]
}

const emptyForm = {
  nome_servico:    '',
  contato:         '',
  contato_publico: false,
  tipo_encargo_id: '',
  status:          'ativo',
}

function maskPhone(value: string): string {
  const digits = value.replace(/\D/g, '').slice(0, 11)
  if (!digits) return ''
  if (digits.length <= 2) return `(${digits}`
  if (digits.length <= 3) return `(${digits.slice(0, 2)}) ${digits.slice(2)}`
  if (digits.length <= 7) return `(${digits.slice(0, 2)}) ${digits.slice(2, 3)} ${digits.slice(3)}`
  return `(${digits.slice(0, 2)}) ${digits.slice(2, 3)} ${digits.slice(3, 7)}-${digits.slice(7)}`
}

export default function ServidoresList({ tipo, contextoId, vinculos, tiposEncargo }: Props) {
  const supabase = createClient()
  const router = useRouter()
  const [lista, setLista] = useState(vinculos.filter(v => v.status !== 'inativo'))
  const [editando, setEditando] = useState<string | null>(null)
  const [adicionando, setAdicionando] = useState(false)
  const [form, setForm] = useState(emptyForm)
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    setLista(vinculos.filter(v => v.status !== 'inativo'))
  }, [vinculos])

  function setF(field: string, value: any) {
    setForm(f => ({ ...f, [field]: value }))
  }

  function iniciarEdicao(v: any) {
    setEditando(v.id)
    setForm({
      nome_servico:    v.servidores?.nome_servico    ?? '',
      contato:         maskPhone(v.servidores?.contato ?? ''),
      contato_publico: v.servidores?.contato_publico ?? false,
      tipo_encargo_id: v.tipo_encargo_id             ?? '',
      status:          v.status                      ?? 'ativo',
    })
  }

  async function handleSalvar() {
    if (!form.nome_servico.trim() || !form.tipo_encargo_id) return
    setLoading(true)

    if (editando) {
      // Atualiza servidor e vínculo
      const vinculo = lista.find(v => v.id === editando)
      if (vinculo?.servidor_id) {
        await supabase.from('servidores').update({
          nome_servico:    form.nome_servico.trim(),
          contato:         form.contato.trim() || null,
          contato_publico: form.contato_publico,
          atualizado_em:   new Date().toISOString(),
        }).eq('id', vinculo.servidor_id)
      }
      await supabase.from('vinculos_encargo').update({
        tipo_encargo_id: form.tipo_encargo_id,
        status:          form.status,
        atualizado_em:   new Date().toISOString(),
      }).eq('id', editando)
    } else {
      // Cria servidor + vínculo
      const { data: srv } = await supabase.from('servidores').insert({
        nome_servico:    form.nome_servico.trim(),
        contato:         form.contato.trim() || null,
        contato_publico: form.contato_publico,
      }).select().single()

      if (srv) {
        const fk =
          tipo === 'grupo'     ? { grupo_id: contextoId,     mesa_area: false } :
          tipo === 'subcomite' ? { subcomite_id: contextoId, mesa_area: false } :
                                  { mesa_area: true }

        await supabase.from('vinculos_encargo').insert({
          servidor_id:     srv.id,
          tipo_encargo_id: form.tipo_encargo_id,
          status:          form.status,
          ...fk,
        })
      }
    }

    setEditando(null)
    setAdicionando(false)
    setForm(emptyForm)
    setLoading(false)
    router.refresh()
  }

  async function handleInativar(id: string) {
    if (!confirm('Remover este servidor do encargo?')) return
    await supabase.from('vinculos_encargo').update({ status: 'inativo', atualizado_em: new Date().toISOString() }).eq('id', id)
    setLista(l => l.filter(v => v.id !== id))
    router.refresh()
  }

  function renderForm() {
    return (
      <div className="bg-blue-50 border border-blue-100 rounded-lg p-4 space-y-3">
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="form-label text-xs">Nome de serviço *</label>
            <input
              className="form-input text-sm"
              value={form.nome_servico}
              onChange={e => setF('nome_servico', e.target.value)}
              placeholder="Nome usado em NA"
            />
          </div>
          <div>
            <label className="form-label text-xs">Encargo *</label>
            <select className="form-select text-sm" value={form.tipo_encargo_id} onChange={e => setF('tipo_encargo_id', e.target.value)}>
              <option value="">Selecione...</option>
              {tiposEncargo.map(t => <option key={t.id} value={t.id}>{t.nome}</option>)}
            </select>
          </div>
        </div>

        <div>
          <label className="form-label text-xs">Telefone</label>
          <input
            className="form-input text-sm"
            value={form.contato}
            onChange={e => setF('contato', maskPhone(e.target.value))}
            placeholder="(11) 9 9999-9999"
            type="tel"
            inputMode="numeric"
          />
        </div>

        <div className="flex items-center gap-2">
          <input
            type="checkbox"
            id="publico"
            checked={form.contato_publico}
            onChange={e => setF('contato_publico', e.target.checked)}
            className="rounded"
          />
          <label htmlFor="publico" className="text-sm text-slate-700 cursor-pointer">
            Exibir contato publicamente
          </label>
        </div>

        <div>
          <label className="form-label text-xs">Status</label>
          <select className="form-select text-sm" value={form.status} onChange={e => setF('status', e.target.value)}>
            <option value="ativo">Ativo</option>
            <option value="vago">Vago</option>
          </select>
        </div>

        <div className="flex gap-2 pt-1">
          <button type="button" onClick={handleSalvar} disabled={loading || !form.nome_servico || !form.tipo_encargo_id} className="btn-primary text-xs py-1.5 px-3">
            <Check size={13} /> {loading ? 'Salvando...' : 'Salvar'}
          </button>
          <button type="button" onClick={() => { setAdicionando(false); setEditando(null); setForm(emptyForm) }} className="btn-secondary text-xs py-1.5 px-3">
            <X size={13} /> Cancelar
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-2">
      {lista.map((v: any) => (
        <div key={v.id}>
          {editando === v.id ? renderForm() : (
            <div className="flex items-center justify-between p-3 bg-slate-50 rounded-lg">
              <div className="flex items-center gap-2.5">
                <div className="w-7 h-7 rounded-full bg-blue-100 flex items-center justify-center">
                  <User size={13} className="text-blue-600" />
                </div>
                <div>
                  <div className="text-sm font-medium text-slate-800">
                    {v.servidores?.nome_servico ?? 'Vago'}
                  </div>
                  <div className="text-xs text-slate-400">{v.tipos_encargo?.nome}</div>
                </div>
              </div>
              <div className="flex gap-1.5">
                <button onClick={() => iniciarEdicao(v)} className="btn-secondary text-xs py-1 px-2.5">
                  <Pencil size={12} />
                </button>
                <button onClick={() => handleInativar(v.id)} className="btn-danger text-xs py-1 px-2.5">
                  <X size={12} />
                </button>
              </div>
            </div>
          )}
        </div>
      ))}

      {adicionando && renderForm()}

      {!adicionando && !editando && (
        <button onClick={() => setAdicionando(true)} className="btn-secondary text-xs py-1.5 px-3">
          <Plus size={13} /> Adicionar servidor
        </button>
      )}
    </div>
  )
}
