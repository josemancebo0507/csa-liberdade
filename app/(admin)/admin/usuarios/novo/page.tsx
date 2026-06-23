import { createAdminClient } from '@/lib/supabase/server'
import UsuarioForm from '@/components/admin/UsuarioForm'
import Link from 'next/link'
import { ArrowLeft } from 'lucide-react'

async function getData() {
  const supabase = await createAdminClient()
  const [g, s] = await Promise.all([
    supabase.from('grupos').select('*').eq('status', 'ativo').order('nome'),
    supabase.from('subcomites').select('*').eq('status', 'ativo').order('nome'),
  ])
  return { grupos: g.data ?? [], subcomites: s.data ?? [] }
}

export default async function NovoUsuarioPage() {
  const { grupos, subcomites } = await getData()
  return (
    <div>
      <Link href="/admin/usuarios" className="inline-flex items-center gap-1 text-sm text-slate-500 hover:text-slate-900 mb-6 transition-colors">
        <ArrowLeft size={15} /> Voltar
      </Link>
      <h1 className="page-title mb-2">Novo usuário</h1>
      <p className="text-slate-500 text-sm mb-6">
        Crie um acesso para um responsável de grupo, subcomitê ou administrador da área.
      </p>
      <div className="card max-w-xl">
        <UsuarioForm grupos={grupos} subcomites={subcomites} todosGrupos={grupos} />
      </div>
    </div>
  )
}
