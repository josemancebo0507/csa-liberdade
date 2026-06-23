import { GoogleGenerativeAI } from '@google/generative-ai'
import { getSystemPrompt } from '@/lib/chat-context'
import { createServiceClient } from '@/lib/supabase/server'
import { NextRequest } from 'next/server'

// ─── Detecção de intenção ─────────────────────────────────────────────────────

function perguntaSobreAtas(mensagem: string): boolean {
  const keywords = [
    'ata', 'atas', 'reunião', 'reunioes', 'reuniao',
    'tesouraria', 'saldo', 'sétima', 'setima', 'tradição', 'tradicao',
    'arrecad', 'dinheiro', 'caixa', 'despesa',
    'presença', 'presencas', 'presenca', 'membros presentes',
    'quantos membros', 'quantas pessoas',
    'ingresso', 'ingressos', 'ingressou', 'recém chegado', 'recem chegado',
    'troca', 'ficha', 'trocou',
    'mês passado', 'mes passado', 'janeiro', 'fevereiro',
    'março', 'marco', 'abril', 'maio', 'junho', 'julho', 'agosto',
    'setembro', 'outubro', 'novembro', 'dezembro',
    'último mês', 'ultimo mes', 'ultimos meses', 'esse mês', 'este mês',
    'esse mes', 'este mes', 'semana passada', 'secretário', 'coordenador',
  ]
  const lower = mensagem.toLowerCase()
  return keywords.some(k => lower.includes(k))
}

function extrairFiltrosAta(mensagem: string): {
  mesAno: { mes: number; ano: number } | null
  limite: number
} {
  const lower = mensagem.toLowerCase()

  const meses: Record<string, number> = {
    janeiro: 1, fevereiro: 2, março: 3, marco: 3,
    abril: 4, maio: 5, junho: 6, julho: 7,
    agosto: 8, setembro: 9, outubro: 10,
    novembro: 11, dezembro: 12,
  }

  let mesAno: { mes: number; ano: number } | null = null

  for (const [nome, num] of Object.entries(meses)) {
    if (lower.includes(nome)) {
      const anoMatch = mensagem.match(/20\d{2}/)
      const ano = anoMatch ? parseInt(anoMatch[0]) : new Date().getFullYear()
      mesAno = { mes: num, ano }
      break
    }
  }

  if (lower.includes('mês passado') || lower.includes('mes passado') ||
      lower.includes('último mês') || lower.includes('ultimos meses') ||
      lower.includes('ultimo mes')) {
    const d = new Date()
    d.setMonth(d.getMonth() - 1)
    mesAno = { mes: d.getMonth() + 1, ano: d.getFullYear() }
  }

  if (lower.includes('esse mês') || lower.includes('este mês') ||
      lower.includes('esse mes') || lower.includes('este mes')) {
    const d = new Date()
    mesAno = { mes: d.getMonth() + 1, ano: d.getFullYear() }
  }

  return { mesAno, limite: mesAno ? 20 : 10 }
}

async function buscarContextoAtas(filtros: ReturnType<typeof extrairFiltrosAta>): Promise<string> {
  const supabase = createServiceClient()

  let query = supabase
    .from('atas_grupo')
    .select(`
      id,
      numero_reuniao,
      data_reuniao,
      tipo_reuniao,
      secretario,
      coordenador,
      literatura_lida,
      observacoes,
      saldo_anterior,
      setima_tradicao,
      vendas,
      despesas,
      saldo_atual,
      grupos(nome, cidade),
      ata_presencas(id, visitante),
      ata_ingressos(id, nome_ingresso, nome_padrinho, como_conheceu),
      ata_trocas_ficha(id, nome_membro, ficha, nome_padrinho)
    `)
    .order('data_reuniao', { ascending: false })
    .limit(filtros.limite)

  if (filtros.mesAno) {
    const { mes, ano } = filtros.mesAno
    const inicio = `${ano}-${String(mes).padStart(2, '0')}-01`
    const fim = new Date(ano, mes, 0).toISOString().split('T')[0]
    query = query.gte('data_reuniao', inicio).lte('data_reuniao', fim)
  }

  const { data: atas, error } = await query

  if (error || !atas?.length) {
    return filtros.mesAno
      ? 'Nenhuma ata encontrada para o período solicitado.'
      : 'Nenhuma ata registrada ainda.'
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const resumo = atas.map((ata: any) => {
    const membros    = (ata.ata_presencas ?? []).filter((p: any) => !p.visitante).length
    const visitantes = (ata.ata_presencas ?? []).filter((p: any) =>  p.visitante).length

    return {
      grupo:       ata.grupos?.nome ?? 'Grupo desconhecido',
      cidade:      ata.grupos?.cidade,
      reuniao:     ata.numero_reuniao,
      data:        ata.data_reuniao,
      tipo:        ata.tipo_reuniao,
      secretario:  ata.secretario,
      coordenador: ata.coordenador,
      literatura:  ata.literatura_lida,
      observacoes: ata.observacoes,
      presencas: {
        membros,
        visitantes,
        total: membros + visitantes + 1,
      },
      ingressos: (ata.ata_ingressos ?? []).map((i: any) => ({
        nome:         i.nome_ingresso,
        padrinho:     i.nome_padrinho,
        como_conheceu: i.como_conheceu,
      })),
      trocas_ficha: (ata.ata_trocas_ficha ?? []).map((t: any) => ({
        membro:  t.nome_membro,
        ficha:   t.ficha,
        padrinho: t.nome_padrinho,
      })),
      tesouraria: {
        saldo_anterior:  ata.saldo_anterior,
        setima_tradicao: ata.setima_tradicao,
        vendas:          ata.vendas,
        despesas:        ata.despesas,
        saldo_atual:     ata.saldo_atual,
      },
    }
  })

  return JSON.stringify(resumo, null, 2)
}

// ─── Handler ─────────────────────────────────────────────────────────────────

export async function POST(req: NextRequest) {
  try {
    if (!process.env.GOOGLE_AI_API_KEY) {
      return Response.json({ error: 'Serviço de IA não configurado.' }, { status: 503 })
    }

    const { message, history } = await req.json()

    if (!message?.trim()) {
      return Response.json({ error: 'Mensagem vazia.' }, { status: 400 })
    }

    const precisaAtas = perguntaSobreAtas(message)
    const [systemPrompt, contextoAtas] = await Promise.all([
      getSystemPrompt(),
      precisaAtas ? buscarContextoAtas(extrairFiltrosAta(message)) : Promise.resolve(''),
    ])

    const systemComAtas = precisaAtas
      ? systemPrompt + `\n\nATAS DE REUNIÃO (dados dinâmicos buscados para esta pergunta):\n${contextoAtas}`
      : systemPrompt

    const genAI = new GoogleGenerativeAI(process.env.GOOGLE_AI_API_KEY)

    const model = genAI.getGenerativeModel({
      model: 'gemini-2.5-flash',
      systemInstruction: systemComAtas,
      generationConfig: {
        maxOutputTokens: 500,
        temperature:     0.3,
      },
    })

    const historyGemini = (history ?? [])
      .slice(-6)
      .filter((m: { role: string }) => m.role === 'user' || m.role === 'assistant')
      .map((m: { role: string; content: string }) => ({
        role:  m.role === 'assistant' ? 'model' : 'user',
        parts: [{ text: m.content }],
      }))

    const chat   = model.startChat({ history: historyGemini })
    const result = await chat.sendMessageStream(message.trim())

    return new Response(
      new ReadableStream({
        async start(controller) {
          try {
            for await (const chunk of result.stream) {
              const text = chunk.text()
              if (text) controller.enqueue(new TextEncoder().encode(text))
            }
          } finally {
            controller.close()
          }
        },
      }),
      {
        headers: {
          'Content-Type':  'text/plain; charset=utf-8',
          'Cache-Control': 'no-cache',
        },
      }
    )
  } catch (error: unknown) {
    console.error('[/api/chat]', error)

    const msg     = error instanceof Error ? error.message : String(error)
    const isQuota = msg.includes('429') || msg.includes('quota') || msg.includes('RESOURCE_EXHAUSTED')

    const userMsg = isQuota
      ? 'O assistente está com muitas solicitações no momento. Tente novamente em alguns minutos.'
      : process.env.NODE_ENV === 'development'
        ? `[dev] ${msg}`
        : 'Desculpe, não consegui processar sua pergunta agora. Tente novamente em instantes.'

    return Response.json({ error: userMsg }, { status: isQuota ? 429 : 500 })
  }
}
