'use client'
import { useState, useMemo, useEffect } from 'react'
import { MapContainer, TileLayer, Marker, useMapEvents, useMap } from 'react-leaflet'
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

// After the open/close animation (300ms), forces Leaflet to recalculate tile coverage
function MapResizeHandler({ sheetOpen }: { sheetOpen: boolean }) {
  const map = useMap()
  useEffect(() => {
    const t = setTimeout(() => map.invalidateSize(), 350)
    return () => clearTimeout(t)
  }, [sheetOpen, map])
  return null
}

const SHEET_HEIGHT = 200

export default function MapaGruposInner({ grupos }: { grupos: GrupoPin[] }) {
  const [selected, setSelected]       = useState<GrupoPin | null>(null)
  // Stays populated until the close animation finishes so the sheet never flashes empty
  const [sheetContent, setSheetContent] = useState<GrupoPin | null>(null)

  useEffect(() => {
    if (selected) {
      setSheetContent(selected)
    } else {
      const t = setTimeout(() => setSheetContent(null), 300)
      return () => clearTimeout(t)
    }
  }, [selected])

  const pinIcon  = useMemo(() => criarPinIcon(), [])
  const sheetOpen = !!selected

  const center: [number, number] = grupos.length > 0
    ? [
        grupos.reduce((s, g) => s + Number(g.latitude),  0) / grupos.length,
        grupos.reduce((s, g) => s + Number(g.longitude), 0) / grupos.length,
      ]
    : [-22.9056, -47.0608]

  const resumo = sheetContent ? resumoReunioes(sheetContent.reunioes_grupo ?? []) : ''

  return (
    <div style={{ position: 'relative', width: '100%', height: '100%' }}>

      {/* ── Mapa ── encolhe pelo bottom para abrir espaço à sheet */}
      <div style={{
        position:   'absolute',
        top: 0, left: 0, right: 0,
        bottom:     sheetOpen ? SHEET_HEIGHT : 0,
        transition: 'bottom 0.3s ease',
      }}>
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
          <MapResizeHandler sheetOpen={sheetOpen} />
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
      </div>

      {/* ── Bottom sheet ── sobe por baixo do mapa, nunca sobrepõe */}
      <div style={{
        position:   'absolute',
        bottom: 0, left: 0, right: 0,
        height:     sheetOpen ? SHEET_HEIGHT : 0,
        overflow:   'hidden',
        transition: 'height 0.3s ease',
        background: 'var(--csa-surface)',
        borderTop:  '1px solid var(--csa-border)',
        boxShadow:  '0 -4px 16px rgba(0,0,0,0.08)',
      }}>
        {sheetContent && (
          <div style={{
            display:       'flex',
            flexDirection: 'column',
            height:        SHEET_HEIGHT,
            padding:       '10px 16px 16px',
            boxSizing:     'border-box',
          }}>
            {/* Handle visual */}
            <div style={{ display: 'flex', justifyContent: 'center', marginBottom: 8 }}>
              <div style={{
                width: 32, height: 4,
                borderRadius: 2,
                background: 'var(--csa-border)',
              }} />
            </div>

            {/* Nome + fechar */}
            <div style={{
              display:        'flex',
              alignItems:     'flex-start',
              justifyContent: 'space-between',
              gap:            12,
              marginBottom:   4,
            }}>
              <span style={{
                fontWeight:  600,
                fontSize:    16,
                lineHeight:  1.3,
                color:       'var(--csa-text-1)',
              }}>
                {sheetContent.nome}
              </span>
              <button
                onClick={() => setSelected(null)}
                aria-label="Fechar"
                style={{
                  flexShrink: 0,
                  padding:    4,
                  color:      'var(--csa-text-3)',
                  background: 'none',
                  border:     'none',
                  cursor:     'pointer',
                }}
              >
                <X size={18} />
              </button>
            </div>

            {/* Endereço */}
            {sheetContent.endereco && (
              <div style={{
                display:      'flex',
                alignItems:   'flex-start',
                gap:          6,
                marginBottom: 2,
              }}>
                <MapPin size={13} style={{ color: 'var(--csa-text-3)', flexShrink: 0, marginTop: 2 }} />
                <span style={{ fontSize: 13, color: 'var(--csa-text-2)', lineHeight: 1.4 }}>
                  {sheetContent.endereco}
                </span>
              </div>
            )}

            {/* Cidade / bairro */}
            <div style={{
              fontSize:     12,
              color:        'var(--csa-text-3)',
              marginBottom: resumo ? 6 : 0,
            }}>
              {[sheetContent.bairro, sheetContent.cidade].filter(Boolean).join(', ')}
            </div>

            {/* Horários */}
            {resumo && (
              <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                <Clock size={12} style={{ color: 'var(--csa-text-3)', flexShrink: 0 }} />
                <span style={{ fontSize: 12, color: 'var(--csa-text-2)' }}>{resumo}</span>
              </div>
            )}

            {/* CTA — sempre na base da sheet */}
            <div style={{ marginTop: 'auto' }}>
              <Link
                href={`/grupos/${sheetContent.id}`}
                className="btn-primary w-full justify-center"
                style={{ fontSize: 14 }}
              >
                Ver detalhes do grupo
              </Link>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
