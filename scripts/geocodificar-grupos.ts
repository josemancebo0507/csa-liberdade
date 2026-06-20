/**
 * Geocodifica grupos sem coordenadas usando a API Nominatim (OpenStreetMap).
 *
 * Uso:
 *   npx tsx scripts/geocodificar-grupos.ts
 *
 * Variáveis de ambiente necessárias (.env.local):
 *   NEXT_PUBLIC_SUPABASE_URL
 *   SUPABASE_SERVICE_ROLE_KEY
 *
 * Respeita o limite de 1 req/s da Nominatim com delay de 1100ms entre chamadas.
 */

import { createClient } from '@supabase/supabase-js'

const supabaseUrl  = process.env.NEXT_PUBLIC_SUPABASE_URL!
const serviceKey   = process.env.SUPABASE_SERVICE_ROLE_KEY!

if (!supabaseUrl || !serviceKey) {
  console.error('Defina NEXT_PUBLIC_SUPABASE_URL e SUPABASE_SERVICE_ROLE_KEY no ambiente.')
  process.exit(1)
}

const supabase = createClient(supabaseUrl, serviceKey)

const USER_AGENT = 'CSA-Liberdade-Portal/1.0 (contato: sperancin.ads@gmail.com)'

async function geocodificar(
  endereco: string,
  bairro: string,
  cidade: string
): Promise<{ lat: number; lng: number } | null> {
  const query = [endereco, bairro, cidade, 'Brasil'].filter(Boolean).join(', ')
  if (!query.trim()) return null
  const res = await fetch(
    `https://nominatim.openstreetmap.org/search?q=${encodeURIComponent(query)}&format=json&limit=1&countrycodes=br`,
    { headers: { 'User-Agent': USER_AGENT } }
  )
  const data = await res.json()
  if (Array.isArray(data) && data.length > 0) {
    return { lat: parseFloat(data[0].lat), lng: parseFloat(data[0].lon) }
  }
  return null
}

function delay(ms: number) {
  return new Promise(resolve => setTimeout(resolve, ms))
}

async function main() {
  const { data: grupos, error } = await supabase
    .from('grupos')
    .select('id, nome, endereco, bairro, cidade')
    .is('latitude', null)
    .eq('status', 'ativo')

  if (error) {
    console.error('Erro ao buscar grupos:', error.message)
    process.exit(1)
  }

  if (!grupos || grupos.length === 0) {
    console.log('Nenhum grupo ativo sem coordenadas. Nada a fazer.')
    return
  }

  console.log(`\n${grupos.length} grupo(s) para geocodificar...\n`)

  for (const grupo of grupos) {
    const geo = await geocodificar(grupo.endereco ?? '', grupo.bairro ?? '', grupo.cidade ?? '')

    if (geo) {
      const { error: upErr } = await supabase
        .from('grupos')
        .update({
          latitude:      geo.lat,
          longitude:     geo.lng,
          atualizado_em: new Date().toISOString(),
        })
        .eq('id', grupo.id)

      if (upErr) {
        console.error(`  ✗ ${grupo.nome} — erro ao salvar:`, upErr.message)
      } else {
        console.log(`  ✓ ${grupo.nome} → (${geo.lat.toFixed(5)}, ${geo.lng.toFixed(5)})`)
      }
    } else {
      console.log(`  ✗ ${grupo.nome} — não encontrado (verifique o endereço)`)
    }

    await delay(1100)
  }

  console.log('\nConcluído.')
}

main().catch(err => {
  console.error(err)
  process.exit(1)
})
