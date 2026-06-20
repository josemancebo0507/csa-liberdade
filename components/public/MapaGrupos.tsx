'use client'
import dynamic from 'next/dynamic'
import { Loader2 } from 'lucide-react'

interface GrupoPin {
  id:        string
  nome:      string
  cidade:    string | null
  bairro:    string | null
  latitude:  number
  longitude: number
}

const MapaGruposInner = dynamic(
  () => import('./MapaGruposInner'),
  {
    ssr: false,
    loading: () => (
      <div
        className="flex items-center justify-center h-full gap-2"
        style={{ background: 'var(--csa-bg)' }}
      >
        <Loader2 size={20} className="animate-spin" style={{ color: 'var(--csa-accent)' }} />
        <span className="text-sm" style={{ color: 'var(--csa-text-2)' }}>Carregando mapa…</span>
      </div>
    ),
  }
)

export default function MapaGrupos({ grupos }: { grupos: GrupoPin[] }) {
  return <MapaGruposInner grupos={grupos} />
}
