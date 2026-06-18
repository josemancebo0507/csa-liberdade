import SubcomiteForm from '@/components/admin/SubcomiteForm'
import Link from 'next/link'
import { ArrowLeft } from 'lucide-react'

export default function NovoSubcomitePage() {
  return (
    <div>
      <Link href="/admin/subcomites" className="inline-flex items-center gap-1 text-sm text-slate-500 hover:text-slate-900 mb-6 transition-colors">
        <ArrowLeft size={15} /> Voltar
      </Link>
      <h1 className="page-title mb-6">Novo subcomitê</h1>
      <div className="card max-w-xl"><SubcomiteForm /></div>
    </div>
  )
}
