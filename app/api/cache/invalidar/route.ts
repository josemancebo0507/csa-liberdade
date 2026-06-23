import { invalidarCache } from '@/lib/chat-context'

export async function POST() {
  invalidarCache()
  return Response.json({ ok: true })
}
