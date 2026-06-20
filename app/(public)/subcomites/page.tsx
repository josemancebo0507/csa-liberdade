import { createClient } from '@/lib/supabase/server'
import SubcomiteCard from '@/components/public/SubcomiteCard'

export const revalidate = 300

async function getSubcomites() {
  const supabase = await createClient()
  const { data } = await supabase
    .from('subcomites')
    .select(`*, reunioes_subcomite(*), vinculos_encargo(*, servidores(*), tipos_encargo(*))`)
    .eq('status', 'ativo')
    .order('nome')
  return data ?? []
}

export default async function SubcomitesPage() {
  const subcomites = await getSubcomites()

  return (
    <div>
      <div className="mb-8">
        <h1 className="page-title mb-1">Subcomitês</h1>
        <p className="text-sm" style={{ color: 'var(--csa-text-2)' }}>
          {subcomites.length} subcomitê{subcomites.length !== 1 ? 's' : ''} ativo{subcomites.length !== 1 ? 's' : ''}
        </p>
      </div>

      {subcomites.length === 0 ? (
        <div className="card text-center py-12" style={{ color: 'var(--csa-text-3)' }}>
          Nenhum subcomitê cadastrado.
        </div>
      ) : (
        <div className="grid gap-4">
          {subcomites.map((s: any) => (
            <SubcomiteCard key={s.id} subcomite={s} />
          ))}
        </div>
      )}
    </div>
  )
}
