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
 * Tenta até 4 estratégias por grupo, respeitando o limite de 1 req/s da Nominatim.
 */

import { createClient } from '@supabase/supabase-js'
import { geocodificarEnderecoComFallback } from '../lib/geocoding'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const serviceKey  = process.env.SUPABASE_SERVICE_ROLE_KEY!

if (!supabaseUrl || !serviceKey) {
  console.error('Defina NEXT_PUBLIC_SUPABASE_URL e SUPABASE_SERVICE_ROLE_KEY no ambiente.')
  process.exit(1)
}

const supabase = createClient(supabaseUrl, serviceKey)

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

  let ok = 0, falhou = 0

  for (const grupo of grupos) {
    const geo = await geocodificarEnderecoComFallback(
      grupo.endereco ?? '',
      grupo.bairro   ?? '',
      grupo.cidade   ?? ''
    )

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
        falhou++
      } else {
        console.log(`  ✓ ${grupo.nome} → (${geo.lat.toFixed(5)}, ${geo.lng.toFixed(5)}) [${geo.estrategia}]`)
        ok++
      }
    } else {
      console.log(`  ✗ ${grupo.nome} — não encontrado (revise o endereço)`)
      console.log(`      endereco: "${grupo.endereco ?? ''}" | bairro: "${grupo.bairro ?? ''}" | cidade: "${grupo.cidade ?? ''}"`)
      falhou++
    }

    // Delay entre grupos para respeitar rate limit da Nominatim
    await new Promise(r => setTimeout(r, 1100))
  }

  console.log(`\nConcluído: ${ok} geocodificado(s), ${falhou} falhou(aram).`)
}

main().catch(err => {
  console.error(err)
  process.exit(1)
})
