import { GoogleGenerativeAI } from '@google/generative-ai'

const PROMPT = `Você está analisando uma foto de uma ata de reunião de Narcóticos Anônimos (NA) do CSA Liberdade.
A ata é um formulário físico preenchido à mão com campos específicos.

Extraia TODOS os dados visíveis e retorne SOMENTE um JSON válido, sem texto adicional, sem markdown, sem explicações.
Se um campo não estiver visível ou legível, use null.

Estrutura EXATA do JSON a retornar:

{
  "secretario": "string ou null",
  "coordenador": "string ou null",
  "numero_reuniao": número inteiro ou null,
  "data_reuniao": "YYYY-MM-DD ou null",
  "tipo_reuniao": "aberta ou fechada ou null",
  "literatura_lida": "string ou null",
  "observacoes": "string ou null",
  "presencas": [
    { "numero": 2, "nome": "string" },
    { "numero": 3, "nome": "string" }
  ],
  "visitantes": [
    { "numero": 1, "nome": "string" }
  ],
  "ingressos": [
    {
      "nome_ingresso": "string",
      "nome_padrinho": "string",
      "como_conheceu": "string ou null"
    }
  ],
  "trocas_ficha": [
    {
      "nome_membro": "string",
      "ficha": "string",
      "nome_padrinho": "string"
    }
  ],
  "tesouraria": {
    "saldo_anterior": número decimal ou null,
    "setima_tradicao": número decimal ou null,
    "vendas": número decimal ou null,
    "despesas": número decimal ou null
  },
  "encargos": {
    "rsg": "string ou null",
    "rsg_suplente": "string ou null",
    "secretario": "string ou null",
    "tesoureiro": "string ou null",
    "bem_estar": "string ou null"
  },
  "confianca_geral": número de 0 a 100
}

REGRAS IMPORTANTES:
- presencas começa no número 2 (posição 01 é sempre "Poder Superior" e NÃO deve ser incluída no array)
- Para tipo_reuniao: se houver um X ou marcação na caixa "FECHADA" retorne "fechada", se em "ABERTA" retorne "aberta"
- Para data_reuniao: converter para formato YYYY-MM-DD (ex: 30/06/2022 → 2022-06-30)
- Para valores monetários: converter para número decimal (ex: "119,92" → 119.92, "R$ 5,00" → 5.00)
- Para numero_reuniao: extrair apenas o número inteiro (pode haver dois números se a reunião cruzou meia-noite — usar o primeiro)
- confianca_geral: sua estimativa de 0-100 sobre a qualidade geral da leitura (100 = tudo legível e claro, 0 = ilegível)
- Incluir SOMENTE linhas preenchidas nas listas (presencas, visitantes, ingressos, trocas_ficha)
- Nomes devem ser copiados exatamente como escritos, respeitando maiúsculas/minúsculas`

export async function POST(req: Request) {
  try {
    if (!process.env.GOOGLE_AI_API_KEY) {
      return Response.json({ error: 'Serviço de IA não configurado.' }, { status: 503 })
    }

    const formData = await req.formData()
    const imagem = formData.get('imagem') as File | null

    if (!imagem) {
      return Response.json({ error: 'Nenhuma imagem enviada.' }, { status: 400 })
    }

    if (imagem.size > 10 * 1024 * 1024) {
      return Response.json({ error: 'Imagem muito grande. Máximo 10MB.' }, { status: 400 })
    }

    const bytes   = await imagem.arrayBuffer()
    const base64  = Buffer.from(bytes).toString('base64')
    const mimeType = imagem.type || 'image/jpeg'

    const genAI = new GoogleGenerativeAI(process.env.GOOGLE_AI_API_KEY)
    const model = genAI.getGenerativeModel({ model: 'gemini-2.5-flash' })

    const result = await model.generateContent([
      PROMPT,
      { inlineData: { mimeType, data: base64 } },
    ])

    const texto = result.response.text().trim()

    // Limpar possível markdown residual
    const jsonLimpo = texto
      .replace(/^```json\s*/i, '')
      .replace(/^```\s*/i, '')
      .replace(/\s*```$/i, '')
      .trim()

    let dados
    try {
      dados = JSON.parse(jsonLimpo)
    } catch {
      console.error('[/api/atas/ocr] JSON inválido:', jsonLimpo.slice(0, 200))
      return Response.json(
        { error: 'Não foi possível interpretar a ata. Tente uma foto mais nítida.' },
        { status: 422 }
      )
    }

    // Garantir estrutura mínima para campos de array
    dados.presencas   = dados.presencas   ?? []
    dados.visitantes  = dados.visitantes  ?? []
    dados.ingressos   = dados.ingressos   ?? []
    dados.trocas_ficha = dados.trocas_ficha ?? []
    dados.tesouraria  = dados.tesouraria  ?? { saldo_anterior: null, setima_tradicao: null, vendas: null, despesas: null }
    dados.encargos    = dados.encargos    ?? { rsg: null, rsg_suplente: null, secretario: null, tesoureiro: null, bem_estar: null }
    dados.confianca_geral = typeof dados.confianca_geral === 'number' ? dados.confianca_geral : 0

    return Response.json({ dados, sucesso: true })
  } catch (error: unknown) {
    console.error('[/api/atas/ocr]', error)
    const msg = error instanceof Error ? error.message : String(error)
    const isQuota = msg.includes('429') || msg.includes('quota') || msg.includes('RESOURCE_EXHAUSTED')
    return Response.json(
      {
        error: isQuota
          ? 'Serviço temporariamente sobrecarregado. Tente em alguns minutos.'
          : process.env.NODE_ENV === 'development'
            ? `[dev] ${msg}`
            : 'Erro ao processar a imagem. Tente novamente.',
      },
      { status: isQuota ? 429 : 500 }
    )
  }
}
