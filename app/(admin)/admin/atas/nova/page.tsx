import { createAdminClient } from '@/lib/supabase/server'
import { createServiceClient } from '@/lib/supabase/server'
import AtaForm from '@/components/admin/AtaForm'
import Link from 'next/link'
import { ArrowLeft } from 'lucide-react'
import { redirect } from 'next/navigation'

async function getData() {
  const admin   = await createAdminClient()
  const service = createServiceClient()

  const { data: { user } } = await admin.auth.getUser()
  if (!user) redirect('/login')

  const [perfilRes, gruposRes] = await Promise.all([
    admin
      .from('usuarios')
      .select('id, grupo_de_escolha, grupos(id, nome)')
      .eq('auth_user_id', user.id)
      .maybeSingle(),
    service
      .from('grupos')
      .select('id, nome')
      .eq('status', 'ativo')
      .order('nome'),
  ])

  const perfil    = perfilRes.data
  const grupos    = gruposRes.data ?? []
  const grupoDeEscolhaId: string | null = (perfil?.grupo_de_escolha as string | null) ?? null

  // Carregar encargos do grupo de escolha (ou primeiro grupo)
  const grupoAlvo = grupoDeEscolhaId ?? grupos[0]?.id ?? null

  let encargosIniciais = { rsg: '', rsg_suplente: '', secretario: '', tesoureiro: '', bem_estar: '' }
  let saldoAnteriorInicial = 0

  if (grupoAlvo) {
    const [encargosRes, ultimaAtaRes] = await Promise.all([
      service
        .from('vinculos_encargo')
        .select('status, tipos_encargo(nome), servidores(nome_servico)')
        .eq('grupo_id', grupoAlvo)
        .neq('status', 'inativo'),
      service
        .from('atas_grupo')
        .select('saldo_atual')
        .eq('grupo_id', grupoAlvo)
        .order('data_reuniao', { ascending: false })
        .limit(1)
        .maybeSingle(),
    ])

    for (const v of encargosRes.data ?? []) {
      const tipoNome: string = (v.tipos_encargo as any)?.nome ?? ''
      const nomeServico: string = (v.servidores as any)?.nome_servico ?? ''
      const key = tipoNome.toLowerCase()
      if (key.includes('rsg') && !key.includes('suplente') && !encargosIniciais.rsg) {
        encargosIniciais.rsg = nomeServico
      } else if (key.includes('rsg') && key.includes('suplente') && !encargosIniciais.rsg_suplente) {
        encargosIniciais.rsg_suplente = nomeServico
      } else if (key.includes('secretar') && !encargosIniciais.secretario) {
        encargosIniciais.secretario = nomeServico
      } else if (key.includes('tesourei') && !encargosIniciais.tesoureiro) {
        encargosIniciais.tesoureiro = nomeServico
      } else if (key.includes('bem') && !encargosIniciais.bem_estar) {
        encargosIniciais.bem_estar = nomeServico
      }
    }

    saldoAnteriorInicial = ultimaAtaRes.data?.saldo_atual ?? 0
  }

  return { grupos, grupoDeEscolhaId, encargosIniciais, saldoAnteriorInicial }
}

export default async function NovaAtaPage() {
  const { grupos, grupoDeEscolhaId, encargosIniciais, saldoAnteriorInicial } = await getData()

  if (grupos.length === 0) {
    return (
      <div>
        <Link href="/admin/atas" className="inline-flex items-center gap-1 text-sm text-slate-500 hover:text-slate-900 mb-6 transition-colors">
          <ArrowLeft size={15} /> Voltar
        </Link>
        <div className="card max-w-lg">
          <p className="text-slate-500">Nenhum grupo ativo encontrado. Cadastre um grupo antes de registrar uma ata.</p>
          <Link href="/admin/grupos/novo" className="btn-primary mt-4 inline-flex">Cadastrar grupo</Link>
        </div>
      </div>
    )
  }

  return (
    <div>
      <Link href="/admin/atas" className="inline-flex items-center gap-1 text-sm text-slate-500 hover:text-slate-900 mb-6 transition-colors">
        <ArrowLeft size={15} /> Voltar para atas
      </Link>
      <h1 className="page-title mb-1">Nova ata de reunião</h1>
      <p className="text-slate-500 text-sm mb-8">
        Registre as informações da reunião de hoje em 5 etapas simples.
      </p>
      <AtaForm
        grupos={grupos as any}
        grupoDeEscolhaId={grupoDeEscolhaId}
        encargosIniciais={encargosIniciais}
        saldoAnteriorInicial={saldoAnteriorInicial}
      />
    </div>
  )
}
