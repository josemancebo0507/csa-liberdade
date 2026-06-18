'use client'
import { useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { useRouter } from 'next/navigation'
import { Plus, Pencil, X, Check } from 'lucide-react'
import { DIA_SEMANA_LABEL, FORMATO_LABEL, TIPO_REUNIAO_LABEL } from '@/lib/types'
import type { DiaSemana, FormatoReuniao, TipoReuniao } from '@/lib/types'

interface Props {
  tipo: 'grupo' | 'subcomite'
  contextoId: string
  reunioes: any[]
}

const DIAS: DiaSemana[] = ['segunda','terca','quarta','quinta','sexta','sabado','domingo']
const FORMATOS: FormatoReuniao[] = ['presencial','online','hibrida']
const TIPOS: TipoReuniao[] = ['aberta','fechada']

const emptyForm = {
  dia_semana: 'sabado' as DiaSemana,
  data_especifica: '',
  recorrente: true,
  horario: '19:00',
  tipo: 'aberta' as TipoReuniao,
  formato: 'presencial' as FormatoReuniao,
  endereco_link: '',
  local_link: '',
  observacoes: '',
  status: 'ativo',
}

export default function ReunioesList({ tipo, contextoId, reunioes }: Props) {
  const supabase = createClient()
  const router = useRouter()
  const [lista, setLista] = useState(reunioes)
  const [editando, setEditando] = useState<string | null>(null)
  const [adicionando, setAdicionando] = useState(false)
  const [form, setForm] = useState(emptyForm)
  const [loading, setLoading] = useState(false)
  const tabela = tipo === 'grupo' ? 'reunioes_grupo' : 'reunioes_subcomite'

  function setF(field: string, value: any) {
    setForm(f => ({ ...f, [field]: value }))
  }

  function iniciarEdicao(r: any) {
    setEditando(r.id)
    setForm({
      dia_semana:      r.dia_semana      ?? 'sabado',
      data_especifica: r.data_especifica ?? '',
      recorrente:      r.recorrente      ?? true,
      horario:         r.horario?.slice(0,5) ?? '19:00',
      tipo:            r.tipo            ?? 'aberta',
      formato:         r.formato         ?? 'presencial',
      endereco_link:   r.endereco_link   ?? '',
      local_link:      r.local_link      ?? '',
      observacoes:     r.observacoes     ?? '',
      status:          r.status          ?? 'ativo',
    })
  }

  function buildPayload() {
    const base: any = {
      horario:      form.horario,
      formato:      form.formato,
      status:       form.status,
      observacoes:  form.observacoes.trim() || null,
      atualizado_em: new Date().toISOString(),
    }
    if (tipo === 'grupo') {
      base.dia_semana    = form.dia_semana
      base.tipo          = form.tipo
      base.endereco_link = form.endereco_link.trim() || null
    } else {
      base.recorrente = form.recorrente
      if (form.recorrente) {
        base.dia_semana      = form.dia_semana
        base.data_especifica = null
      } else {
        base.data_especifica = form.data_especifica
        base.dia_semana      = null
      }
      base.local_link = form.local_link.trim() || null
    }
    return base
  }

  async function handleSalvar() {
    setLoading(true)
    const payload = buildPayload()

    if (editando) {
      const { data, error } = await supabase.from(tabela).update(payload).eq('id', editando).select().single()
      if (!error && data) setLista(l => l.map(r => r.id === editando ? data : r))
    } else {
      const fk = tipo === 'grupo' ? { grupo_id: contextoId } : { subcomite_id: contextoId }
      const { data, error } = await supabase.from(tabela).insert({ ...fk, ...payload }).select().single()
      if (!error && data) setLista(l => [...l, data])
    }

    setEditando(null)
    setAdicionando(false)
    setForm(emptyForm)
    setLoading(false)
    router.refresh()
  }

  async function handleInativar(id: string) {
    if (!confirm('Inativar esta reunião?')) return
    await supabase.from(tabela).update({ status: 'inativo' }).eq('id', id)
    setLista(l => l.map(r => r.id === id ? { ...r, status: 'inativo' } : r))
    router.refresh()
  }

  function renderForm() {
    return (
      <div className="bg-blue-50 border border-blue-100 rounded-lg p-4 space-y-3">
        {tipo === 'subcomite' && (
          <div className="flex gap-4">
            <label className="flex items-center gap-2 text-sm cursor-pointer">
              <input type="radio" checked={form.recorrente} onChange={() => setF('recorrente', true)} />
              Recorrente (dia da semana)
            </label>
            <label className="flex items-center gap-2 text-sm cursor-pointer">
              <input type="radio" checked={!form.recorrente} onChange={() => setF('recorrente', false)} />
              Data específica
            </label>
          </div>
        )}

        <div className="grid grid-cols-2 gap-3">
          {(tipo === 'grupo' || form.recorrente) && (
            <div>
              <label className="form-label text-xs">Dia da semana</label>
              <select className="form-select text-sm" value={form.dia_semana} onChange={e => setF('dia_semana', e.target.value)}>
                {DIAS.map(d => <option key={d} value={d}>{DIA_SEMANA_LABEL[d]}</option>)}
              </select>
            </div>
          )}
          {tipo === 'subcomite' && !form.recorrente && (
            <div>
              <label className="form-label text-xs">Data</label>
              <input type="date" className="form-input text-sm" value={form.data_especifica} onChange={e => setF('data_especifica', e.target.value)} />
            </div>
          )}
          <div>
            <label className="form-label text-xs">Horário</label>
            <input type="time" className="form-input text-sm" value={form.horario} onChange={e => setF('horario', e.target.value)} />
          </div>
        </div>

        <div className="grid grid-cols-2 gap-3">
          {tipo === 'grupo' && (
            <div>
              <label className="form-label text-xs">Tipo</label>
              <select className="form-select text-sm" value={form.tipo} onChange={e => setF('tipo', e.target.value)}>
                {TIPOS.map(t => <option key={t} value={t}>{TIPO_REUNIAO_LABEL[t]}</option>)}
              </select>
            </div>
          )}
          <div>
            <label className="form-label text-xs">Formato</label>
            <select className="form-select text-sm" value={form.formato} onChange={e => setF('formato', e.target.value)}>
              {FORMATOS.map(f => <option key={f} value={f}>{FORMATO_LABEL[f]}</option>)}
            </select>
          </div>
        </div>

        <div>
          <label className="form-label text-xs">
            {tipo === 'grupo' ? 'Endereço ou link' : 'Local ou link'}
          </label>
          <input
            className="form-input text-sm"
            value={tipo === 'grupo' ? form.endereco_link : form.local_link}
            onChange={e => setF(tipo === 'grupo' ? 'endereco_link' : 'local_link', e.target.value)}
            placeholder={form.formato === 'presencial' ? 'Endereço completo' : 'https://meet.google.com/...'}
          />
        </div>

        <div>
          <label className="form-label text-xs">Observações</label>
          <input className="form-input text-sm" value={form.observacoes} onChange={e => setF('observacoes', e.target.value)} />
        </div>

        <div>
          <label className="form-label text-xs">Status</label>
          <select className="form-select text-sm" value={form.status} onChange={e => setF('status', e.target.value)}>
            <option value="ativo">Ativa</option>
            <option value="inativo">Inativa</option>
          </select>
        </div>

        <div className="flex gap-2 pt-1">
          <button type="button" onClick={handleSalvar} disabled={loading} className="btn-primary text-xs py-1.5 px-3">
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
      {lista.filter(r => r.status !== 'inativo').map((r: any) => (
        <div key={r.id}>
          {editando === r.id ? renderForm() : (
            <div className="flex items-center justify-between p-3 bg-slate-50 rounded-lg">
              <div className="text-sm text-slate-700">
                {r.recorrente === false && r.data_especifica
                  ? new Date(r.data_especifica + 'T12:00:00').toLocaleDateString('pt-BR')
                  : DIA_SEMANA_LABEL[r.dia_semana as DiaSemana]
                }
                {' às '}{r.horario?.slice(0,5)}
                <span className="text-slate-400 mx-1.5">·</span>
                {FORMATO_LABEL[r.formato as FormatoReuniao]}
                {r.tipo && <><span className="text-slate-400 mx-1.5">·</span>{TIPO_REUNIAO_LABEL[r.tipo as TipoReuniao]}</>}
              </div>
              <div className="flex gap-1.5">
                <button onClick={() => iniciarEdicao(r)} className="btn-secondary text-xs py-1 px-2.5">
                  <Pencil size={12} />
                </button>
                <button onClick={() => handleInativar(r.id)} className="btn-danger text-xs py-1 px-2.5">
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
          <Plus size={13} /> Adicionar reunião
        </button>
      )}
    </div>
  )
}
