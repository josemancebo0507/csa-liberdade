const USER_AGENT = 'CSA-Liberdade-Portal/1.0 (contato: sperancin.ads@gmail.com)'

export async function geocodificarEndereco(
  endereco: string,
  bairro: string,
  cidade: string
): Promise<{ lat: number; lng: number } | null> {
  const query = [endereco, bairro, cidade, 'Brasil'].filter(Boolean).join(', ')
  if (!query.trim()) return null
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
