'use client'
import { useState, useCallback } from 'react'
import { GoogleMap, useLoadScript, Marker } from '@react-google-maps/api'
import Link from 'next/link'
import { MapPin, X, Loader2 } from 'lucide-react'

interface GrupoPin {
  id:        string
  nome:      string
  cidade:    string | null
  bairro:    string | null
  latitude:  number
  longitude: number
}

interface Props {
  grupos: GrupoPin[]
  apiKey: string
}

const MAP_OPTIONS: google.maps.MapOptions = {
  disableDefaultUI:       false,
  clickableIcons:         false,
  fullscreenControl:      true,
  streetViewControl:      false,
  mapTypeControl:         false,
  zoomControlOptions:     { position: 9 }, // RIGHT_CENTER
}

const PIN_SVG = encodeURIComponent(
  `<svg xmlns="http://www.w3.org/2000/svg" width="28" height="36" viewBox="0 0 28 36">
    <path fill="#3f5aa6" d="M14 0C6.27 0 0 6.27 0 14c0 10.5 14 22 14 22S28 24.5 28 14C28 6.27 21.73 0 14 0z"/>
    <circle fill="white" cx="14" cy="14" r="6"/>
  </svg>`
)
const PIN_URL = `data:image/svg+xml,${PIN_SVG}`

export default function MapaGrupos({ grupos, apiKey }: Props) {
  const [selected, setSelected] = useState<GrupoPin | null>(null)

  const { isLoaded, loadError } = useLoadScript({ googleMapsApiKey: apiKey })

  const center = grupos.length > 0
    ? {
        lat: grupos.reduce((s, g) => s + g.latitude,  0) / grupos.length,
        lng: grupos.reduce((s, g) => s + g.longitude, 0) / grupos.length,
      }
    : { lat: -22.9056, lng: -47.0608 }

  const onMapClick = useCallback(() => setSelected(null), [])

  if (!apiKey) {
    return (
      <div className="flex flex-col items-center justify-center h-full gap-3"
        style={{ background: 'var(--csa-bg)' }}>
        <MapPin size={32} style={{ color: 'var(--csa-border)' }} />
        <p className="text-sm" style={{ color: 'var(--csa-text-3)' }}>
          Chave do Google Maps não configurada.
        </p>
        <p className="text-xs" style={{ color: 'var(--csa-text-3)' }}>
          Defina <code>NEXT_PUBLIC_GOOGLE_MAPS_API_KEY</code> no arquivo <code>.env.local</code>.
        </p>
      </div>
    )
  }

  if (loadError) {
    return (
      <div className="flex items-center justify-center h-full"
        style={{ background: 'var(--csa-bg)' }}>
        <p className="text-sm" style={{ color: 'var(--csa-text-3)' }}>
          Erro ao carregar o mapa. Verifique a chave da API.
        </p>
      </div>
    )
  }

  if (!isLoaded) {
    return (
      <div className="flex items-center justify-center h-full gap-2"
        style={{ background: 'var(--csa-bg)' }}>
        <Loader2 size={20} className="animate-spin" style={{ color: 'var(--csa-accent)' }} />
        <span className="text-sm" style={{ color: 'var(--csa-text-2)' }}>Carregando mapa…</span>
      </div>
    )
  }

  return (
    <div style={{ position: 'relative', width: '100%', height: '100%' }}>
      <GoogleMap
        mapContainerStyle={{ width: '100%', height: '100%' }}
        center={center}
        zoom={grupos.length > 0 ? 12 : 11}
        options={MAP_OPTIONS}
        onClick={onMapClick}
      >
        {grupos.map(g => (
          <Marker
            key={g.id}
            position={{ lat: g.latitude, lng: g.longitude }}
            icon={PIN_URL}
            title={g.nome}
            onClick={() => setSelected(g)}
          />
        ))}
      </GoogleMap>

      {/* Info card do grupo selecionado */}
      {selected && (
        <div
          style={{
            position:     'absolute',
            bottom:       16,
            left:         16,
            right:        16,
            maxWidth:     380,
            margin:       '0 auto',
            background:   'var(--csa-surface)',
            border:       '1px solid var(--csa-border)',
            borderRadius: 16,
            padding:      '16px 20px',
            boxShadow:    '0 8px 32px rgba(0,0,0,0.15)',
            animation:    'slideUp 0.18s ease-out',
          }}
        >
          <div className="flex items-start justify-between gap-3 mb-3">
            <div>
              <div className="font-semibold text-base mb-0.5" style={{ color: 'var(--csa-text-1)' }}>
                {selected.nome}
              </div>
              <div className="flex items-center gap-1 text-sm" style={{ color: 'var(--csa-text-2)' }}>
                <MapPin size={13} style={{ color: 'var(--csa-text-3)' }} />
                {[selected.bairro, selected.cidade].filter(Boolean).join(', ')}
              </div>
            </div>
            <button
              onClick={() => setSelected(null)}
              className="flex-shrink-0 p-1 rounded-lg"
              style={{ color: 'var(--csa-text-3)' }}
              aria-label="Fechar"
            >
              <X size={18} />
            </button>
          </div>
          <Link
            href={`/grupos/${selected.id}`}
            className="btn-secondary w-full justify-center text-sm"
          >
            Ver detalhes do grupo
          </Link>
        </div>
      )}

      {/* Slide-up animation */}
      <style>{`
        @keyframes slideUp {
          from { transform: translateY(12px); opacity: 0; }
          to   { transform: translateY(0);    opacity: 1; }
        }
      `}</style>
    </div>
  )
}
