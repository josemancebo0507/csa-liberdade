import { createAdminClient } from '@/lib/supabase/server'
import ServidoresList from '@/components/admin/ServidoresList'

async function getMesa() {
  const supabase = await createAdminClient()
  const { data } = await supabase
    .from('vinculos_encargo')
    .select(`*, servidores(*), tipos_encargo(*)`)
    .eq('mesa_area', true)
    .neq('status', 'inativo')
    .order('criado_em')
  return data ?? []
}

async function getTiposEncargo() {
  const supabase = await createAdminClient()
  const { data } = await supabase.from('tipos_encargo').select('*').eq('ativo', true).order('nome')
  return data ?? []
}

export default async function AdminMesaPage() {
  const [vinculos, tiposEncargo] = await Promise.all([getMesa(), getTiposEncargo()])

  return (
    <div>
      <div className="mb-8">
        <h1 className="page-title mb-1">Mesa da Área</h1>
        <p className="text-slate-500 text-sm">Encargos administrativos do CSA Liberdade</p>
      </div>
      <div className="card max-w-2xl">
        <ServidoresList tipo="mesa" vinculos={vinculos} tiposEncargo={tiposEncargo} />
      </div>
    </div>
  )
}
