'use client'
import { useState, useMemo } from 'react'
import { MapContainer, TileLayer, Marker, useMapEvents } from 'react-leaflet'
import L from 'leaflet'
import 'leaflet/dist/leaflet.css'
import Link from 'next/link'
import { MapPin, Clock, X } from 'lucide-react'

interface ReuniaoInfo {
  dia_semana: string
  horario:    string
  status:     string
}

interface GrupoPin {
  id:             string
  nome:           string
  cidade:         string | null
  bairro:         string | null
  endereco:       string | null
  latitude:       number
  longitude:      number
  reunioes_grupo: ReuniaoInfo[]
}

const DIA_ABREV: Record<string, string> = {
  segunda: 'Seg', terca: 'Ter', quarta: 'Qua', quinta: 'Qui',
  sexta: 'Sex', sabado: 'Sáb', domingo: 'Dom',
}

function resumoReunioes(reunioes: ReuniaoInfo[]): string {
  const ativas = reunioes.filter(r => r.status === 'ativo')
  if (ativas.length === 0) return ''
  return ativas
    .map(r => `${DIA_ABREV[r.dia_semana] ?? r.dia_semana} às ${r.horario.slice(0, 5)}`)
    .join(' · ')
}

// Improved pin: bullseye design with CSS drop-shadow
// Created per-group so the same icon object is reused safely via useMemo
function criarPinIcon(): L.DivIcon {
  return L.divIcon({
    html: `<svg xmlns="http://www.w3.org/2000/svg" width="24" height="34" viewBox="0 0 24 34"
      style="filter:drop-shadow(0 2px 3px rgba(0,0,0,0.35));display:block;">
      <path fill="#3f5aa6"
        d="M12 0C5.37 0 0 5.37 0 12c0 9 12 22 12 22S24 21 24 12C24 5.37 18.63 0 12 0z"/>
      <circle fill="white" cx="12" cy="12" r="5.5"/>
      <circle fill="#3f5aa6" cx="12" cy="12" r="2.5"/>
    </svg>`,
    className:  '',
    iconSize:   [24, 34],
    iconAnchor: [12, 34],
  })
}

function MapClickHandler({ onClose }: { onClose: () => void }) {
  useMapEvents({ click: onClose })
  return null
}

export default function MapaGruposInner({ grupos }: { grupos: GrupoPin[] }) {
  const [selected, setSelected] = useState<GrupoPin | null>(null)

  // Single shared icon instance — avoids recreating L.divIcon on every render
  const pinIcon = useMemo(() => criarPinIcon(), [])

  const center: [number, number] = grupos.length > 0
    ? [
        grupos.reduce((s, g) => s + Number(g.latitude),  0) / grupos.length,
        grupos.reduce((s, g) => s + Number(g.longitude), 0) / grupos.length,
      ]
    : [-22.9056, -47.0608]

  const resumo = selected ? resumoReunioes(selected.reunioes_grupo ?? []) : ''

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
            position={[Number(g.latitude), Number(g.longitude)]}
            icon={pinIcon}
            eventHandlers={{
              click: (e) => {
                e.originalEvent.stopPropagation()
                setSelected(g)
              },
            }}
          />
        ))}
      </MapContainer>

      {/* Info card — safe-area-aware bottom offset for iOS Safari */}
      {selected && (
        <div
          style={{
            position:     'absolute',
            bottom:       'calc(env(safe-area-inset-bottom, 0px) + 16px)',
            left:         16,
            right:        16,
            maxWidth:     400,
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
          {/* Nome + fechar */}
          <div className="flex items-start justify-between gap-3 mb-2">
            <div className="font-semibold text-base leading-snug" style={{ color: 'var(--csa-text-1)' }}>
              {selected.nome}
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

          {/* Endereço */}
          {selected.endereco && (
            <div className="flex items-start gap-1.5 mb-1">
              <MapPin size={13} style={{ color: 'var(--csa-text-3)', flexShrink: 0, marginTop: 2 }} />
              <span className="text-sm" style={{ color: 'var(--csa-text-2)' }}>
                {selected.endereco}
              </span>
            </div>
          )}

          {/* Cidade / bairro */}
          <div className="text-xs mb-2" style={{ color: 'var(--csa-text-3)' }}>
            {[selected.bairro, selected.cidade].filter(Boolean).join(', ')}
          </div>

          {/* Reuniões ativas */}
          {resumo && (
            <div className="flex items-center gap-1.5 mb-3">
              <Clock size={12} style={{ color: 'var(--csa-text-3)', flexShrink: 0 }} />
              <span className="text-xs" style={{ color: 'var(--csa-text-2)' }}>{resumo}</span>
            </div>
          )}

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
