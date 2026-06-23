import { createServiceClient } from '@/lib/supabase/server'

interface CachedContext {
  systemPrompt: string
  cachedAt: number
}

const CACHE_TTL = 5 * 60 * 1000 // 5 minutos em ms
let cache: CachedContext | null = null

function filtrarContatosPrivados(obj: unknown): unknown {
  if (Array.isArray(obj)) return obj.map(filtrarContatosPrivados)
  if (obj !== null && typeof obj === 'object') {
    const o = obj as Record<string, unknown>
    const result: Record<string, unknown> = {}
    for (const [k, v] of Object.entries(o)) {
      if (k === 'contato' && 'contato_publico' in o && !o.contato_publico) continue
      result[k] = filtrarContatosPrivados(v)
    }
    return result
  }
  return obj
}

export async function getSystemPrompt(): Promise<string> {
  const agora = Date.now()

  if (cache && agora - cache.cachedAt < CACHE_TTL) {
    console.log('[chat-context] usando cache')
    return cache.systemPrompt
  }

  console.log('[chat-context] buscando dados frescos')

  const supabase = createServiceClient()
  const today    = new Date().toISOString().split('T')[0]

  const [grupos, subcomites, mesa, eventos] = await Promise.all([
    supabase.from('grupos').select(`
      id, nome, cidade, bairro, endereco, status,
      reunioes_grupo(dia_semana, horario, tipo, formato, endereco_link, status),
      vinculos_encargo(
        status,
        tipos_encargo(nome),
        servidores(nome_servico, contato, contato_publico)
      )
    `).eq('status', 'ativo'),

    supabase.from('subcomites').select(`
      id, nome, sigla, descricao, status,
      reunioes_subcomite(dia_semana, data_especifica, recorrente, horario, formato, local_link, status),
      vinculos_encargo(
        status,
        tipos_encargo(nome),
        servidores(nome_servico, contato, contato_publico)
      )
    `).eq('status', 'ativo'),

    supabase.from('vinculos_encargo').select(`
      status,
      tipos_encargo(nome),
      servidores(nome_servico, contato, contato_publico)
    `).eq('mesa_area', true).neq('status', 'inativo'),

    supabase.from('eventos').select(`
      titulo, data_evento, horario, responsavel, local_link, descricao, status,
      tipos_evento(nome),
      grupos(nome),
      subcomites(nome)
    `).eq('status', 'publicado')
      .gte('data_evento', today)
      .order('data_evento')
      .limit(20),
  ])

  const gruposData     = filtrarContatosPrivados(grupos.data     ?? [])
  const subcomitesData = filtrarContatosPrivados(subcomites.data ?? [])
  const mesaData       = filtrarContatosPrivados(mesa.data       ?? [])

  const now  = new Date()
  const dias = ['domingo','segunda','terca','quarta','quinta','sexta','sabado']

  const systemPrompt = `Você é o assistente virtual do CSA Liberdade, portal de serviços do Comitê de Serviço de Área Liberdade de Narcóticos Anônimos. Responda perguntas sobre grupos, reuniões, subcomitês, eventos e servidores da área com base nos dados abaixo.

REGRAS:
- Responda SEMPRE em português brasileiro
- Seja gentil, acolhedor e objetivo
- Nunca invente informações. Se não souber, diga que não tem essa informação e sugira contato com a área
- Nunca compartilhe contatos com contato_publico = false
- Não discuta temas fora do escopo da área
- Respostas curtas e diretas, máximo 3 parágrafos
- Se alguém parecer em crise ou precisar de ajuda urgente, forneça o telefone 132 (NA Brasil, gratuito) e o CVV 188 (Centro de Valorização da Vida, 24h, gratuito) e direcione para uma reunião aberta próxima
- Reuniões FECHADAS são exclusivas para adictos. Reuniões ABERTAS aceitam qualquer pessoa (familiares, curiosos)

DATA ATUAL: ${now.toLocaleDateString('pt-BR', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })}
DIA DA SEMANA: ${dias[now.getDay()]}

GRUPOS ATIVOS:
${JSON.stringify(gruposData)}

SUBCOMITÊS ATIVOS:
${JSON.stringify(subcomitesData)}

MESA DA ÁREA:
${JSON.stringify(mesaData)}

PRÓXIMOS EVENTOS:
${JSON.stringify(eventos.data ?? [])}`

  cache = { systemPrompt, cachedAt: agora }
  return systemPrompt
}

export function invalidarCache(): void {
  cache = null
}
