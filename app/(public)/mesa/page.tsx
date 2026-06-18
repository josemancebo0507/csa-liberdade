import { createClient } from '@/lib/supabase/server'
import { UserCheck } from 'lucide-react'

export const revalidate = 300

async function getMesa() {
  const supabase = await createClient()
  const { data } = await supabase
    .from('vinculos_encargo')
    .select(`*, servidores(*), tipos_encargo(*)`)
    .eq('mesa_area', true)
    .neq('status', 'inativo')
    .order('criado_em')
  return data ?? []
}

export default async function MesaPage() {
  const encargos = await getMesa()

  return (
    <div>
      <div className="mb-8">
        <h1 className="page-title mb-1">Mesa da Área</h1>
        <p className="text-slate-500 text-sm">Encargos administrativos do CSA Liberdade</p>
      </div>

      <div className="card">
        {encargos.length === 0 ? (
          <div className="text-center py-10 text-slate-400">Nenhum encargo cadastrado.</div>
        ) : (
          <div className="divide-y divide-slate-100">
            {encargos.map((v: any) => {
              const vago = v.status === 'vago' || !v.servidores
              return (
                <div key={v.id} className="py-4 flex items-center justify-between gap-4">
                  <div className="flex items-center gap-3">
                    <div className={`w-9 h-9 rounded-full flex items-center justify-center flex-shrink-0 ${vago ? 'bg-slate-100' : 'bg-blue-100'}`}>
                      <UserCheck size={16} className={vago ? 'text-slate-400' : 'text-blue-600'} />
                    </div>
                    <div>
                      <div className="text-sm font-medium text-slate-800">
                        {v.tipos_encargo?.nome}
                      </div>
                      <div className={`text-sm ${vago ? 'text-slate-400 italic' : 'text-slate-600'}`}>
                        {vago ? 'Vago' : v.servidores?.nome_servico}
                      </div>
                      {!vago && v.servidores?.contato_publico && v.servidores?.contato && (
                        <div className="text-xs text-slate-400">{v.servidores.contato}</div>
                      )}
                    </div>
                  </div>
                  {vago
                    ? <span className="badge-yellow">Vago</span>
                    : <span className="badge-green">Em serviço</span>
                  }
                </div>
              )
            })}
          </div>
        )}
      </div>
    </div>
  )
}
