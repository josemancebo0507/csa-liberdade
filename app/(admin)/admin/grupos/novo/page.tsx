import GrupoForm from '@/components/admin/GrupoForm'
import { ArrowLeft } from 'lucide-react'
import Link from 'next/link'

export default function NovoGrupoPage() {
  return (
    <div>
      <Link href="/admin/grupos" className="inline-flex items-center gap-1 text-sm text-slate-500 hover:text-slate-900 mb-6 transition-colors">
        <ArrowLeft size={15} /> Voltar para grupos
      </Link>
      <h1 className="page-title mb-6">Novo grupo</h1>
      <div className="card max-w-xl">
        <GrupoForm />
      </div>
    </div>
  )
}
