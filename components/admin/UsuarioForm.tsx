'use client'
import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Save, Eye, EyeOff } from 'lucide-react'
import type { Grupo, Subcomite } from '@/lib/types'

interface Props {
  grupos: Grupo[]
  subcomites: Subcomite[]
  todosGrupos?: Grupo[]
}

export default function UsuarioForm({ grupos, subcomites, todosGrupos }: Props) {
  const router = useRouter()
  const [form, setForm] = useState({
    nome_servico:       '',
    email:              '',
    senha:              '',
    tipo:               'chave_grupo',
    grupo_id:           '',
    subcomite_id:       '',
    grupo_de_escolha:   '',
  })
  const [showSenha, setShowSenha] = useState(false)
  const [loading, setLoading] = useState(false)
  const [erro, setErro] = useState('')

  function set(field: string, value: string) { setForm(f => ({ ...f, [field]: value })) }

  async function handleSalvar(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)
    setErro('')

    const payload = {
      ...form,
      grupo_de_escolha: form.grupo_de_escolha || null,
    }
    const res = await fetch('/api/usuarios', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    })

    const json = await res.json()
    if (!res.ok) {
      setErro(json.error ?? 'Erro ao criar usuário.')
      setLoading(false)
      return
    }

    router.push('/admin/usuarios')
  }

  return (
    <form onSubmit={handleSalvar} className="space-y-4 max-w-xl">
      <div>
        <label className="form-label">Nome de serviço *</label>
        <input className="form-input" value={form.nome_servico} onChange={e => set('nome_servico', e.target.value)} required placeholder="Nome usado em NA" />
      </div>

      <div>
        <label className="form-label">E-mail *</label>
        <input type="email" className="form-input" value={form.email} onChange={e => set('email', e.target.value)} required />
      </div>

      <div>
        <label className="form-label">Senha *</label>
        <div className="relative">
          <input
            type={showSenha ? 'text' : 'password'}
            className="form-input pr-10"
            value={form.senha}
            onChange={e => set('senha', e.target.value)}
            required
            minLength={8}
            placeholder="Mínimo 8 caracteres"
          />
          <button type="button" onClick={() => setShowSenha(!showSenha)}
            className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600">
            {showSenha ? <EyeOff size={16} /> : <Eye size={16} />}
          </button>
        </div>
      </div>

      <div>
        <label className="form-label">Tipo de acesso *</label>
        <select className="form-select" value={form.tipo} onChange={e => set('tipo', e.target.value)}>
          <option value="admin">Administrador da área</option>
          <option value="chave_grupo">Usuário-chave de grupo</option>
          <option value="chave_subcomite">Usuário-chave de subcomitê</option>
        </select>
      </div>

      {form.tipo === 'chave_grupo' && (
        <div>
          <label className="form-label">Grupo *</label>
          <select className="form-select" value={form.grupo_id} onChange={e => set('grupo_id', e.target.value)} required>
            <option value="">Selecione o grupo...</option>
            {grupos.map(g => <option key={g.id} value={g.id}>{g.nome}</option>)}
          </select>
        </div>
      )}

      {form.tipo === 'chave_subcomite' && (
        <div>
          <label className="form-label">Subcomitê *</label>
          <select className="form-select" value={form.subcomite_id} onChange={e => set('subcomite_id', e.target.value)} required>
            <option value="">Selecione o subcomitê...</option>
            {subcomites.map(s => <option key={s.id} value={s.id}>{s.nome}</option>)}
          </select>
        </div>
      )}

      {(todosGrupos ?? grupos).length > 0 && (
        <div>
          <label className="form-label">Grupo de escolha</label>
          <select className="form-select" value={form.grupo_de_escolha} onChange={e => set('grupo_de_escolha', e.target.value)}>
            <option value="">Nenhum (selecionar na ata)</option>
            {(todosGrupos ?? grupos).map(g => <option key={g.id} value={g.id}>{g.nome}</option>)}
          </select>
          <p className="text-xs text-slate-400 mt-1">Grupo pré-selecionado ao registrar uma nova ata</p>
        </div>
      )}

      {erro && <div className="text-sm text-red-600 bg-red-50 border border-red-200 rounded-lg px-3 py-2">{erro}</div>}

      <div className="flex gap-3 pt-2">
        <button type="submit" disabled={loading} className="btn-primary">
          <Save size={15} /> {loading ? 'Criando...' : 'Criar usuário'}
        </button>
        <button type="button" onClick={() => router.back()} className="btn-secondary">Cancelar</button>
      </div>
    </form>
  )
}
