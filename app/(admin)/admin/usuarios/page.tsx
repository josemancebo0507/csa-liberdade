import { createAdminClient } from '@/lib/supabase/server'
import Link from 'next/link'
import { Plus, UserCog } from 'lucide-react'

async function getUsuarios() {
  const supabase = await createAdminClient()
  const { data } = await supabase
    .from('usuarios')
    .select(`
      *,
      usuario_grupo(grupos(nome)),
      usuario_subcomite(subcomites(nome))
    `)
    .order('nome_servico')
  return data ?? []
}

const TIPO_LABEL: Record<string, string> = {
  admin:             'Administrador',
  chave_grupo:       'Usuário-chave de grupo',
  chave_subcomite:   'Usuário-chave de subcomitê',
}

export default async function AdminUsuariosPage() {
  const usuarios = await getUsuarios()

  return (
    <div>
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="page-title mb-1">Usuários</h1>
          <p className="text-slate-500 text-sm">{usuarios.length} usuário(s) cadastrado(s)</p>
        </div>
        <Link href="/admin/usuarios/novo" className="btn-primary">
          <Plus size={16} /> Novo usuário
        </Link>
      </div>

      <div className="card">
        {usuarios.length === 0 ? (
          <div className="text-center py-10 text-slate-400">
            Nenhum usuário administrativo.{' '}
            <Link href="/admin/usuarios/novo" className="text-blue-600 hover:underline">Criar primeiro usuário</Link>
          </div>
        ) : (
          <div className="divide-y divide-slate-100">
            {usuarios.map((u: any) => {
              const grupos = (u.usuario_grupo ?? []).map((ug: any) => ug.grupos?.nome).filter(Boolean)
              const subcomites = (u.usuario_subcomite ?? []).map((us: any) => us.subcomites?.nome).filter(Boolean)
              return (
                <div key={u.id} className="py-4 flex items-center justify-between gap-4">
                  <div className="flex items-center gap-3">
                    <div className="w-9 h-9 bg-slate-100 rounded-full flex items-center justify-center">
                      <UserCog size={16} className="text-slate-500" />
                    </div>
                    <div>
                      <div className="font-medium text-slate-900">{u.nome_servico}</div>
                      <div className="text-xs text-slate-400 mt-0.5">
                        {TIPO_LABEL[u.tipo]}
                        {grupos.length > 0 && ` · ${grupos.join(', ')}`}
                        {subcomites.length > 0 && ` · ${subcomites.join(', ')}`}
                      </div>
                    </div>
                  </div>
                  <span className={u.ativo ? 'badge-green' : 'badge-gray'}>
                    {u.ativo ? 'Ativo' : 'Inativo'}
                  </span>
                </div>
              )
            })}
          </div>
        )}
      </div>
    </div>
  )
}
