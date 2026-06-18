import { createAdminClient } from '@/lib/supabase/server'
import Link from 'next/link'
import { Plus, Layers } from 'lucide-react'

async function getSubcomites() {
  const supabase = await createAdminClient()
  const { data } = await supabase.from('subcomites').select(`*, vinculos_encargo(id, status)`).order('nome')
  return data ?? []
}

export default async function AdminSubcomitesPage() {
  const subcomites = await getSubcomites()

  return (
    <div>
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="page-title mb-1">Subcomitês</h1>
          <p className="text-slate-500 text-sm">{subcomites.length} subcomitê(s) cadastrado(s)</p>
        </div>
        <Link href="/admin/subcomites/novo" className="btn-primary">
          <Plus size={16} /> Novo subcomitê
        </Link>
      </div>

      <div className="grid gap-3">
        {subcomites.map((s: any) => {
          const servidores = (s.vinculos_encargo ?? []).filter((v: any) => v.status === 'ativo').length
          return (
            <div key={s.id} className="card flex items-center justify-between gap-4">
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 bg-indigo-100 rounded-lg flex items-center justify-center">
                  <Layers size={16} className="text-indigo-600" />
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <span className="font-semibold text-slate-900">{s.nome}</span>
                    {s.sigla && <span className="badge-blue">{s.sigla}</span>}
                    <span className={s.status === 'ativo' ? 'badge-green' : 'badge-gray'}>
                      {s.status === 'ativo' ? 'Ativo' : 'Inativo'}
                    </span>
                  </div>
                  <div className="text-xs text-slate-400 mt-0.5">{servidores} servidor(es)</div>
                </div>
              </div>
              <Link href={`/admin/subcomites/${s.id}`} className="btn-secondary text-xs py-1.5 px-3">
                Gerenciar
              </Link>
            </div>
          )
        })}
      </div>
    </div>
  )
}
