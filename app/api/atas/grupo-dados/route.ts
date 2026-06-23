import { createServiceClient } from '@/lib/supabase/server'
import { NextRequest } from 'next/server'

export async function GET(req: NextRequest) {
  const grupoId = req.nextUrl.searchParams.get('grupoId')
  if (!grupoId) {
    return Response.json({ error: 'grupoId obrigatório.' }, { status: 400 })
  }

  const supabase = createServiceClient()

  const [encargosRes, ultimaAtaRes] = await Promise.all([
    supabase
      .from('vinculos_encargo')
      .select('status, tipos_encargo(nome), servidores(nome_servico)')
      .eq('grupo_id', grupoId)
      .neq('status', 'inativo'),

    supabase
      .from('atas_grupo')
      .select('saldo_atual, numero_reuniao')
      .eq('grupo_id', grupoId)
      .order('data_reuniao', { ascending: false })
      .limit(1)
      .maybeSingle(),
  ])

  const encargos: Record<string, string> = {}
  for (const v of encargosRes.data ?? []) {
    const tipoNome: string = (v.tipos_encargo as any)?.nome ?? ''
    const nomeServico: string = (v.servidores as any)?.nome_servico ?? ''
    const key = tipoNome.toLowerCase()
    if (key.includes('rsg') && !key.includes('suplente') && !encargos.rsg) {
      encargos.rsg = nomeServico
    } else if ((key.includes('rsg') && key.includes('suplente')) && !encargos.rsg_suplente) {
      encargos.rsg_suplente = nomeServico
    } else if (key.includes('secretar') && !encargos.secretario) {
      encargos.secretario = nomeServico
    } else if (key.includes('tesourei') && !encargos.tesoureiro) {
      encargos.tesoureiro = nomeServico
    } else if (key.includes('bem') && !encargos.bem_estar) {
      encargos.bem_estar = nomeServico
    }
  }

  return Response.json({
    encargos,
    saldoAnterior: ultimaAtaRes.data?.saldo_atual ?? 0,
    ultimoNumero: ultimaAtaRes.data?.numero_reuniao ?? null,
  })
}
