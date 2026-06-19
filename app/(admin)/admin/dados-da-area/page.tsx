import { createAdminClient } from '@/lib/supabase/server'
import ServidoresList from '@/components/admin/ServidoresList'
import AtasAdmin from '@/components/admin/AtasAdmin'
import AccordionSection from '@/components/ui/AccordionSection'

async function getMesa() {
  const supabase = await createAdminClient()
  const { data } = await supabase
    .from('vinculos_encargo')
    .select('*, servidores(*), tipos_encargo(*)')
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

async function getAtas() {
  const supabase = await createAdminClient()
  const { data } = await supabase
    .from('atas_reuniao')
    .select('*')
    .order('data_reuniao', { ascending: false })
  return data ?? []
}

export default async function AdminDadosDaAreaPage() {
  const [vinculos, tiposEncargo, atas] = await Promise.all([
    getMesa(), getTiposEncargo(), getAtas(),
  ])

  return (
    <div>
      <div className="mb-8">
        <h1 className="page-title mb-1">Dados da Área</h1>
        <p className="text-slate-500 text-sm">Encargos administrativos e documentos do CSA Liberdade</p>
      </div>

      <AccordionSection title="Servidores da Mesa">
        <div className="card max-w-2xl">
          <ServidoresList tipo="mesa" vinculos={vinculos} tiposEncargo={tiposEncargo} />
        </div>
      </AccordionSection>

      <AccordionSection title="Atas das Reuniões">
        <div className="max-w-2xl">
          <AtasAdmin atasIniciais={atas} />
        </div>
      </AccordionSection>
    </div>
  )
}
