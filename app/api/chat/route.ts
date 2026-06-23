import { GoogleGenerativeAI } from '@google/generative-ai'
import { getSystemPrompt } from '@/lib/chat-context'
import { NextRequest } from 'next/server'

const genAI = new GoogleGenerativeAI(process.env.GOOGLE_AI_API_KEY!)

export async function POST(req: NextRequest) {
  try {
    const { message, history } = await req.json()

    if (!message?.trim()) {
      return Response.json({ error: 'Mensagem vazia.' }, { status: 400 })
    }

    const systemPrompt = await getSystemPrompt()

    const model = genAI.getGenerativeModel({
      model: 'gemini-1.5-flash',
      systemInstruction: systemPrompt,
      generationConfig: {
        maxOutputTokens: 500,
        temperature:     0.3,
      },
    })

    // Gemini usa 'user' e 'model' (não 'assistant'), e o histórico
    // deve começar com 'user' e alternar estritamente
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

    const msg = error instanceof Error ? error.message : ''
    const isQuota = msg.includes('429') || msg.includes('quota') || msg.includes('RESOURCE_EXHAUSTED')

    return Response.json(
      {
        error: isQuota
          ? 'O assistente está com muitas solicitações no momento. Tente novamente em alguns minutos.'
          : 'Desculpe, não consegui processar sua pergunta agora. Tente novamente em instantes.',
      },
      { status: isQuota ? 429 : 500 }
    )
  }
}
