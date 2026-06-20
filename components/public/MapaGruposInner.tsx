'use client'
import { useState } from 'react'
import { MapContainer, TileLayer, Marker, useMapEvents } from 'react-leaflet'
import L from 'leaflet'
import 'leaflet/dist/leaflet.css'
import Link from 'next/link'
import { MapPin, X } from 'lucide-react'

interface GrupoPin {
  id:        string
  nome:      string
  cidade:    string | null
  bairro:    string | null
  latitude:  number
  longitude: number
}

const pinIcon = L.divIcon({
  html: `<svg xmlns="http://www.w3.org/2000/svg" width="28" height="36" viewBox="0 0 28 36">
    <path fill="#3f5aa6" d="M14 0C6.27 0 0 6.27 0 14c0 10.5 14 22 14 22S28 24.5 28 14C28 6.27 21.73 0 14 0z"/>
    <circle fill="white" cx="14" cy="14" r="6"/>
  </svg>`,
  className:  '',
  iconSize:   [28, 36],
  iconAnchor: [14, 36],
})

function MapClickHandler({ onClose }: { onClose: () => void }) {
  useMapEvents({ click: onClose })
  return null
}

export default function MapaGruposInner({ grupos }: { grupos: GrupoPin[] }) {
  const [selected, setSelected] = useState<GrupoPin | null>(null)

  const center: [number, number] = grupos.length > 0
    ? [
        grupos.reduce((s, g) => s + g.latitude,  0) / grupos.length,
        grupos.reduce((s, g) => s + g.longitude, 0) / grupos.length,
      ]
    : [-22.9056, -47.0608]

  return (
    <div style={{ position: 'relative', width: '100%', height: '100%' }}>
      <MapContainer
        center={center}
        zoom={grupos.length > 0 ? 12 : 11}
        style={{ width: '100%', height: '100%' }}
        zoomControl
      >
        <TileLayer
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright" target="_blank" rel="noopener">OpenStreetMap</a> contributors'
        />
        <MapClickHandler onClose={() => setSelected(null)} />
        {grupos.map(g => (
          <Marker
            key={g.id}
            position={[g.latitude, g.longitude]}
            icon={pinIcon}
            eventHandlers={{ click: (e) => { e.originalEvent.stopPropagation(); setSelected(g) } }}
          />
        ))}
      </MapContainer>

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
            zIndex:       1000,
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

      <style>{`
        @keyframes slideUp {
          from { transform: translateY(12px); opacity: 0; }
          to   { transform: translateY(0);    opacity: 1; }
        }
      `}</style>
    </div>
  )
}
