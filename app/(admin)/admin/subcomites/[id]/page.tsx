import { createAdminClient } from '@/lib/supabase/server'
import { notFound } from 'next/navigation'
import Link from 'next/link'
import { ArrowLeft } from 'lucide-react'
import SubcomiteForm from '@/components/admin/SubcomiteForm'
import ReunioesList from '@/components/admin/ReunioesList'
import ServidoresList from '@/components/admin/ServidoresList'

async function getSubcomite(id: string) {
  const supabase = await createAdminClient()
  const { data } = await supabase
    .from('subcomites')
    .select(`*, reunioes_subcomite(*), vinculos_encargo(*, servidores(*), tipos_encargo(*))`)
    .eq('id', id).single()
  return data
}

async function getTiposEncargo() {
  const supabase = await createAdminClient()
  const { data } = await supabase.from('tipos_encargo').select('*').eq('ativo', true).order('nome')
  return data ?? []
}

export default async function SubcomiteDetailAdminPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const [subcomite, tiposEncargo] = await Promise.all([getSubcomite(id), getTiposEncargo()])
  if (!subcomite) notFound()

  return (
    <div>
      <Link href="/admin/subcomites" className="inline-flex items-center gap-1 text-sm text-slate-500 hover:text-slate-900 mb-6 transition-colors">
        <ArrowLeft size={15} /> Voltar
      </Link>
      <h1 className="page-title mb-6">{subcomite.nome}</h1>
      <div className="space-y-6">
        <div className="card"><h2 className="section-title mb-4">Dados do subcomitê</h2><SubcomiteForm subcomite={subcomite} /></div>
        <div className="card"><h2 className="section-title mb-4">Reuniões</h2><ReunioesList tipo="subcomite" contextoId={subcomite.id} reunioes={subcomite.reunioes_subcomite ?? []} /></div>
        <div className="card"><h2 className="section-title mb-4">Servidores</h2><ServidoresList tipo="subcomite" contextoId={subcomite.id} vinculos={subcomite.vinculos_encargo ?? []} tiposEncargo={tiposEncargo} /></div>
      </div>
    </div>
  )
}
