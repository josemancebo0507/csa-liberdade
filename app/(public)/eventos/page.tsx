import { createClient } from '@/lib/supabase/server'
import EventosLista from '@/components/public/EventosLista'

export const revalidate = 300

async function getEventos() {
  const supabase = await createClient()
  const { data } = await supabase
    .from('eventos')
    .select(`*, tipos_evento(id, nome), grupos(id, nome), subcomites(id, nome, sigla)`)
    .eq('status', 'publicado')
    .gte('data_evento', new Date().toISOString().split('T')[0])
    .order('data_evento')
  return data ?? []
}

export default async function EventosPage() {
  const eventos = await getEventos()

  return (
    <div>
      <div className="mb-6">
        <h1 className="page-title mb-1">Eventos</h1>
        <p className="text-sm" style={{ color: '#64748b' }}>
          Próximos eventos de grupos, subcomitês e da área
        </p>
      </div>

      <EventosLista eventos={eventos} />
    </div>
  )
}
