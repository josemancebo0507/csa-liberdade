const USER_AGENT = 'CSA-Liberdade-Portal/1.0 (contato: sperancin.ads@gmail.com)'

// Remove "s/n", room/complement info that confuse Nominatim
function limparEndereco(endereco: string): string {
  return endereco
    .replace(/,?\s*\bs\/n\b/gi, '')       // Remove "s/n" / ", s/n"
    .replace(/,?\s*sala\s+\S+/gi, '')      // Remove "Sala 7"
    .replace(/,?\s*apto\.?\s+\S+/gi, '')   // Remove "Apto 3"
    .replace(/,?\s*andar\s+\S+/gi, '')     // Remove "2º Andar"
    .replace(/,\s*,/g, ',')                // Fix accidental double commas
    .trim()
    .replace(/,\s*$/, '')                  // Remove trailing comma
}

async function nominatimSearch(query: string): Promise<{ lat: number; lng: number } | null> {
  try {
    const res = await fetch(
      `https://nominatim.openstreetmap.org/search?q=${encodeURIComponent(query)}&format=json&limit=1&countrycodes=br`,
      { headers: { 'User-Agent': USER_AGENT } }
    )
    const data = await res.json()
    if (Array.isArray(data) && data.length > 0) {
      return { lat: parseFloat(data[0].lat), lng: parseFloat(data[0].lon) }
    }
  } catch {}
  return null
}

export async function geocodificarEndereco(
  endereco: string,
  bairro: string,
  cidade: string
): Promise<{ lat: number; lng: number } | null> {
  if (!cidade.trim()) return null
  const endLimpo = limparEndereco(endereco)
  const query = [endLimpo, bairro, cidade, 'Brasil'].filter(Boolean).join(', ')
  return nominatimSearch(query)
}

// Only used by the batch script — tries extra fallback queries with proper delays.
export async function geocodificarEnderecoComFallback(
  endereco: string,
  bairro: string,
  cidade: string,
  delayMs = 1100
): Promise<{ lat: number; lng: number; estrategia: string } | null> {
  if (!cidade.trim()) return null
  const endLimpo = limparEndereco(endereco)

  const estrategias: Array<[string, string]> = [
    ['completo', [endLimpo, bairro, cidade, 'Brasil'].filter(Boolean).join(', ')],
    ['sem bairro', [endLimpo, cidade, 'Brasil'].filter(Boolean).join(', ')],
    ['bairro+cidade', [bairro, cidade, 'Brasil'].filter(Boolean).join(', ')],
    ['só cidade', [cidade, 'Brasil'].filter(Boolean).join(', ')],
  ]

  for (const [nome, query] of estrategias) {
    if (!query.trim() || query === ', Brasil') continue
    const result = await nominatimSearch(query)
    if (result) return { ...result, estrategia: nome }
    await new Promise(r => setTimeout(r, delayMs))
  }

  return null
}
