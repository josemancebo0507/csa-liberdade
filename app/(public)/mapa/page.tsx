import { createClient } from '@/lib/supabase/server'
import MapaGrupos from '@/components/public/MapaGrupos'

export const revalidate = 300

async function getGruposGeocodificados() {
  const supabase = await createClient()
  const { data } = await supabase
    .from('grupos')
    .select('id, nome, cidade, bairro, latitude, longitude')
    .eq('status', 'ativo')
    .not('latitude', 'is', null)
    .not('longitude', 'is', null)
    .order('nome')
  return (data ?? []) as {
    id: string
    nome: string
    cidade: string | null
    bairro: string | null
    latitude: number
    longitude: number
  }[]
}

export default async function MapaPage() {
  const grupos = await getGruposGeocodificados()
  const apiKey = process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY ?? ''

  return (
    /* Escapa do max-w-5xl/px-4/py-8 do layout para mapa full-width */
    <div className="-mx-4 -mt-8" style={{ height: 'calc(100vh - 64px)' }}>
      <MapaGrupos grupos={grupos} apiKey={apiKey} />
    </div>
  )
}
