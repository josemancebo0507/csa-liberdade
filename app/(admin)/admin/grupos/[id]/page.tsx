import { createAdminClient } from '@/lib/supabase/server'
import { notFound } from 'next/navigation'
import Link from 'next/link'
import { ArrowLeft } from 'lucide-react'
import GrupoForm from '@/components/admin/GrupoForm'
import ReunioesList from '@/components/admin/ReunioesList'
import ServidoresList from '@/components/admin/ServidoresList'

async function getGrupo(id: string) {
  const supabase = await createAdminClient()
  const { data } = await supabase
    .from('grupos')
    .select(`*, reunioes_grupo(*), vinculos_encargo(*, servidores(*), tipos_encargo(*))`)
    .eq('id', id)
    .single()
  return data
}

async function getTiposEncargo() {
  const supabase = await createAdminClient()
  const { data } = await supabase.from('tipos_encargo').select('*').eq('ativo', true).order('nome')
  return data ?? []
}

export default async function GrupoDetailAdminPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const [grupo, tiposEncargo] = await Promise.all([getGrupo(id), getTiposEncargo()])
  if (!grupo) notFound()

  return (
    <div>
      <Link href="/admin/grupos" className="inline-flex items-center gap-1 text-sm text-slate-500 hover:text-slate-900 mb-6 transition-colors">
        <ArrowLeft size={15} /> Voltar para grupos
      </Link>

      <h1 className="page-title mb-6">{grupo.nome}</h1>

      <div className="space-y-6">
        {/* Dados gerais */}
        <div className="card">
          <h2 className="section-title mb-4">Dados do grupo</h2>
          <GrupoForm grupo={grupo} />
        </div>

        {/* Reuniões */}
        <div className="card">
          <h2 className="section-title mb-4">Reuniões</h2>
          <ReunioesList
            tipo="grupo"
            contextoId={grupo.id}
            reunioes={grupo.reunioes_grupo ?? []}
          />
        </div>

        {/* Servidores */}
        <div className="card">
          <h2 className="section-title mb-4">Servidores</h2>
          <ServidoresList
            tipo="grupo"
            contextoId={grupo.id}
            vinculos={grupo.vinculos_encargo ?? []}
            tiposEncargo={tiposEncargo}
          />
        </div>
      </div>
    </div>
  )
}
