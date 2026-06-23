import { NextRequest } from 'next/server'
import { createAdminClient } from '@/lib/supabase/server'
import Groq from 'groq-sdk'

// Remove contato field from servers where contato_publico is not true
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

export async function POST(req: NextRequest) {
  try {
    const body    = await req.json()
    const message = String(body?.message ?? '').trim()
    const history = Array.isArray(body?.history) ? body.history : []

    if (!message) {
      return Response.json({ error: 'Mensagem vazia.' }, { status: 400 })
    }

    if (!process.env.GROQ_API_KEY) {
      return Response.json({ error: 'Serviço de IA não configurado.' }, { status: 503 })
    }

    const supabase = await createAdminClient()
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

    const systemPrompt = `Você é o assistente virtual do CSA Liberdade, o portal de serviços do Comitê de Serviço de Área Liberdade de Narcóticos Anônimos. Você responde perguntas sobre grupos, reuniões, subcomitês, eventos e servidores da área com base nos dados abaixo.

REGRAS IMPORTANTES:
- Responda SEMPRE em português brasileiro
- Seja gentil, acolhedor e objetivo — quem pergunta pode ser um adicto em busca de ajuda ou um servidor em busca de informações
- Nunca invente informações. Se não souber, diga que não tem essa informação disponível e sugira contato com a área
- Nunca compartilhe contatos de servidores que tenham contato_publico = false
- Não discuta temas fora do escopo da área (política, religião, outros programas de recuperação)
- Respostas curtas e diretas. Máximo 3 parágrafos.
- Se alguém parecer estar em crise ou precisar de ajuda urgente, forneça o número do CVV: 188 (24h, gratuito) e direcione para uma reunião aberta próxima

DATA ATUAL: ${now.toLocaleDateString('pt-BR', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })}
DIA DA SEMANA ATUAL: ${dias[now.getDay()]}

DADOS DA ÁREA:

GRUPOS ATIVOS:
${JSON.stringify(gruposData, null, 2)}

SUBCOMITÊS ATIVOS:
${JSON.stringify(subcomitesData, null, 2)}

MESA DA ÁREA (encargos administrativos):
${JSON.stringify(mesaData, null, 2)}

PRÓXIMOS EVENTOS:
${JSON.stringify(eventos.data ?? [], null, 2)}`

    const groq = new Groq({ apiKey: process.env.GROQ_API_KEY })

    const stream = await groq.chat.completions.create({
      model:       'llama3-70b-8192',
      messages: [
        { role: 'system', content: systemPrompt },
        ...history.slice(-6) as { role: 'user' | 'assistant'; content: string }[],
        { role: 'user', content: message },
      ],
      max_tokens:  500,
      temperature: 0.3,
      stream:      true,
    })

    return new Response(
      new ReadableStream({
        async start(controller) {
          try {
            for await (const chunk of stream) {
              const text = chunk.choices[0]?.delta?.content ?? ''
              if (text) controller.enqueue(new TextEncoder().encode(text))
            }
          } finally {
            controller.close()
          }
        },
      }),
      { headers: { 'Content-Type': 'text/plain; charset=utf-8' } }
    )
  } catch (err) {
    console.error('[/api/chat]', err)
    return Response.json(
      { error: 'Desculpe, não consegui processar sua pergunta agora. Tente novamente em instantes.' },
      { status: 500 }
    )
  }
}
