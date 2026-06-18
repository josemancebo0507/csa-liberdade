import { createAdminClient } from '@/lib/supabase/server'
import Link from 'next/link'
import { Plus, MapPin, Clock, Users } from 'lucide-react'
import { DIA_SEMANA_LABEL } from '@/lib/types'

async function getGrupos() {
  const supabase = await createAdminClient()
  const { data } = await supabase
    .from('grupos')
    .select(`*, reunioes_grupo(*), vinculos_encargo(id, status)`)
    .order('nome')
  return data ?? []
}

export default async function AdminGruposPage() {
  const grupos = await getGrupos()

  return (
    <div>
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="page-title mb-1">Grupos</h1>
          <p className="text-slate-500 text-sm">{grupos.length} grupo{grupos.length !== 1 ? 's' : ''} cadastrado{grupos.length !== 1 ? 's' : ''}</p>
        </div>
        <Link href="/admin/grupos/novo" className="btn-primary">
          <Plus size={16} /> Novo grupo
        </Link>
      </div>

      {grupos.length === 0 ? (
        <div className="card text-center py-12 text-slate-400">
          Nenhum grupo cadastrado. <Link href="/admin/grupos/novo" className="text-blue-600 hover:underline">Cadastrar primeiro grupo</Link>
        </div>
      ) : (
        <div className="grid gap-3">
          {grupos.map((g: any) => {
            const reunioesAtivas = (g.reunioes_grupo ?? []).filter((r: any) => r.status === 'ativo')
            const servidoresAtivos = (g.vinculos_encargo ?? []).filter((v: any) => v.status === 'ativo').length

            return (
              <div key={g.id} className="card flex items-center justify-between gap-4">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <span className="font-semibold text-slate-900">{g.nome}</span>
                    <span className={g.status === 'ativo' ? 'badge-green' : 'badge-gray'}>
                      {g.status === 'ativo' ? 'Ativo' : 'Inativo'}
                    </span>
                  </div>
                  <div className="flex flex-wrap gap-3 text-xs text-slate-500">
                    <span className="flex items-center gap-1">
                      <MapPin size={11} /> {[g.bairro, g.cidade].filter(Boolean).join(', ')}
                    </span>
                    <span className="flex items-center gap-1">
                      <Clock size={11} /> {reunioesAtivas.length} reunião(ões)
                    </span>
                    <span className="flex items-center gap-1">
                      <Users size={11} /> {servidoresAtivos} servidor(es)
                    </span>
                  </div>
                </div>
                <div className="flex gap-2 flex-shrink-0">
                  <Link href={`/admin/grupos/${g.id}`} className="btn-secondary text-xs py-1.5 px-3">
                    Gerenciar
                  </Link>
                </div>
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}
