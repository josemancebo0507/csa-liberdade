'use client'
import { useState } from 'react'
import Link from 'next/link'
import { Sparkles, CalendarDays, Users, Layers, MapPin, MoonStar, ChevronDown, ExternalLink } from 'lucide-react'

/* ── Helpers de label ──────────────────────────────────── */
const FORMATO_LABELS: Record<string, string> = {
  presencial: 'Presencial',
  online:     'Online',
  hibrida:    'Híbrida',
}
const TIPO_LABELS: Record<string, string> = {
  aberta:  'Aberta',
  fechada: 'Fechada',
}

/* ── Badge de formato ──────────────────────────────────── */
function FormatoBadge({ formato }: { formato: string }) {
  const cls =
    formato === 'presencial' ? 'badge badge-green' :
    formato === 'online'     ? 'badge badge-blue'  :
                               'badge badge-gray'
  return <span className={cls}>{FORMATO_LABELS[formato] ?? formato}</span>
}

/* ── Tipos ─────────────────────────────────────────────── */
interface ReuniaoGrupo {
  id:           string
  horario:      string
  tipo:         string
  formato:      string
  endereco_link?: string | null
  grupos:       { nome: string; cidade: string | null; bairro: string | null } | null
}

interface ReuniaoSubcomite {
  id:        string
  horario:   string
  formato:   string
  local_link?: string | null
  subcomites: { nome: string; sigla: string | null } | null
}

interface Evento {
  id:        string
  titulo:    string
  horario:   string | null
  local_link?: string | null
  tipos_evento: { nome: string } | null
  grupos:      { nome: string } | null
  subcomites:  { nome: string; sigla: string | null } | null
}

interface Props {
  hoje:              string
  reunioesGrupo:     ReuniaoGrupo[]
  reunioesSubcomite: ReuniaoSubcomite[]
  eventos:           Evento[]
}

/* ── Estilos de card ───────────────────────────────────── */
const cardStyle: React.CSSProperties = {
  background:   'var(--csa-surface)',
  border:       '1px solid var(--csa-border)',
  borderRadius: 12,
  padding:      '14px 16px',
  boxShadow:    '0 1px 3px rgba(0,0,0,0.04)',
  transition:   'transform 0.15s',
}

/* ── Componente ────────────────────────────────────────── */
export default function HojeSection({ hoje, reunioesGrupo, reunioesSubcomite, eventos }: Props) {
  const [expandeGrupos, setExpandeGrupos] = useState(false)

  const dataFormatada = (() => {
    const s = new Date(hoje + 'T12:00:00').toLocaleDateString('pt-BR', {
      weekday: 'long', day: 'numeric', month: 'long', year: 'numeric',
    })
    return s.charAt(0).toUpperCase() + s.slice(1)
  })()

  const vazio =
    reunioesGrupo.length === 0 &&
    reunioesSubcomite.length === 0 &&
    eventos.length === 0

  const temEventosAntes   = eventos.length > 0
  const temGruposAntes    = temEventosAntes || eventos.length > 0
  const temSubAntes       = temEventosAntes || reunioesGrupo.length > 0

  return (
    <div className="mt-10">
      {/* Cabeçalho */}
      <div className="mb-6">
        <div className="flex items-center gap-3 mb-2">
          <div className="flex-1 h-px" style={{ background: 'var(--csa-border)' }} />
          <div className="flex items-center gap-2">
            <Sparkles size={15} style={{ color: 'var(--csa-accent)' }} />
            <span className="font-semibold text-base" style={{ color: 'var(--csa-text-1)' }}>
              O que eu posso fazer hoje
            </span>
          </div>
          <div className="flex-1 h-px" style={{ background: 'var(--csa-border)' }} />
        </div>
        <p className="text-center text-sm" style={{ color: 'var(--csa-text-3)' }}>
          {dataFormatada}
        </p>
      </div>

      {/* Estado vazio */}
      {vazio && (
        <div className="card text-center py-12" style={{ borderRadius: 16 }}>
          <MoonStar size={28} className="mx-auto mb-3" style={{ color: 'var(--csa-border)' }} />
          <p className="text-sm font-medium mb-1" style={{ color: 'var(--csa-text-3)' }}>
            Nenhuma atividade programada para hoje.
          </p>
          <p className="text-sm" style={{ color: 'var(--csa-text-3)' }}>
            Consulte a agenda completa em{' '}
            <Link href="/grupos" className="underline" style={{ color: 'var(--csa-accent)' }}>Grupos</Link>
            {' '}e{' '}
            <Link href="/eventos" className="underline" style={{ color: 'var(--csa-accent)' }}>Eventos</Link>.
          </p>
        </div>
      )}

      {/* Bloco: Eventos */}
      {eventos.length > 0 && (
        <div>
          <div className="flex items-center gap-2 mb-3">
            <CalendarDays size={15} style={{ color: 'var(--csa-accent)' }} />
            <span className="font-semibold text-sm" style={{ color: 'var(--csa-text-1)' }}>
              Eventos de hoje
            </span>
          </div>
          <div className="space-y-2">
            {eventos.map(ev => (
              <div key={ev.id} className="flex gap-4 items-start hover:-translate-y-px" style={cardStyle}>
                <div className="flex-shrink-0 w-14 text-center">
                  <div className="font-bold text-sm" style={{ color: 'var(--csa-accent)' }}>
                    {ev.horario ? ev.horario.slice(0, 5) : 'Dia todo'}
                  </div>
                </div>
                <div className="flex-1 min-w-0">
                  <div className="font-medium text-sm mb-1" style={{ color: 'var(--csa-text-1)' }}>
                    {ev.titulo}
                  </div>
                  {ev.tipos_evento && (
                    <span
                      className="inline-block text-xs px-2 py-0.5 rounded-full mr-2 mb-1"
                      style={{ background: 'var(--csa-tint)', color: 'var(--csa-accent)' }}
                    >
                      {ev.tipos_evento.nome}
                    </span>
                  )}
                  {ev.local_link && (
                    <div className="flex items-center gap-1 text-xs mt-1" style={{ color: 'var(--csa-text-3)' }}>
                      <MapPin size={11} />
                      {ev.local_link.startsWith('http') ? (
                        <a
                          href={ev.local_link} target="_blank" rel="noopener noreferrer"
                          className="underline flex items-center gap-0.5"
                          style={{ color: 'var(--csa-accent)' }}
                        >
                          Acessar link <ExternalLink size={10} />
                        </a>
                      ) : (
                        <span>{ev.local_link}</span>
                      )}
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Bloco: Reuniões de grupos */}
      {reunioesGrupo.length > 0 && (
        <div
          className={temEventosAntes ? 'mt-6 pt-6' : ''}
          style={temEventosAntes ? { borderTop: '1px solid var(--csa-border)' } : {}}
        >
          <div className="flex items-center gap-2 mb-3">
            <Users size={15} style={{ color: 'var(--csa-accent)' }} />
            <span className="font-semibold text-sm" style={{ color: 'var(--csa-text-1)' }}>
              Reuniões de grupos
            </span>
          </div>
          <div className="space-y-2">
            {(expandeGrupos ? reunioesGrupo : reunioesGrupo.slice(0, 5)).map(r => {
              const loc = [r.grupos?.bairro, r.grupos?.cidade].filter(Boolean).join(', ')
              return (
                <div key={r.id} className="flex gap-4 items-center hover:-translate-y-px" style={cardStyle}>
                  <div className="flex-shrink-0 w-12 text-center">
                    <div className="font-bold text-sm" style={{ color: 'var(--csa-accent)' }}>
                      {r.horario.slice(0, 5)}
                    </div>
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="font-medium text-sm truncate" style={{ color: 'var(--csa-text-1)' }}>
                      {r.grupos?.nome ?? '—'}
                    </div>
                    {loc && (
                      <div className="flex items-center gap-1 text-xs mt-0.5" style={{ color: 'var(--csa-text-3)' }}>
                        <MapPin size={10} />{loc}
                      </div>
                    )}
                  </div>
                  <div className="flex gap-1.5 flex-shrink-0 flex-wrap justify-end">
                    <FormatoBadge formato={r.formato} />
                    <span className={r.tipo === 'aberta' ? 'badge badge-green' : 'badge badge-gray'}>
                      {TIPO_LABELS[r.tipo] ?? r.tipo}
                    </span>
                  </div>
                </div>
              )
            })}
          </div>
          {reunioesGrupo.length > 5 && (
            <button
              onClick={() => setExpandeGrupos(v => !v)}
              className="mt-3 flex items-center gap-1.5 text-sm"
              style={{ color: 'var(--csa-accent)' }}
            >
              <ChevronDown
                size={15}
                style={{
                  transform: expandeGrupos ? 'rotate(180deg)' : 'none',
                  transition: 'transform 0.2s',
                }}
              />
              {expandeGrupos
                ? 'Ver menos'
                : `Ver todas as ${reunioesGrupo.length} reuniões`}
            </button>
          )}
        </div>
      )}

      {/* Bloco: Reuniões de subcomitês */}
      {reunioesSubcomite.length > 0 && (
        <div
          className={temSubAntes && (eventos.length > 0 || reunioesGrupo.length > 0) ? 'mt-6 pt-6' : ''}
          style={(eventos.length > 0 || reunioesGrupo.length > 0) ? { borderTop: '1px solid var(--csa-border)' } : {}}
        >
          <div className="flex items-center gap-2 mb-3">
            <Layers size={15} style={{ color: 'var(--csa-accent)' }} />
            <span className="font-semibold text-sm" style={{ color: 'var(--csa-text-1)' }}>
              Reuniões de subcomitês
            </span>
          </div>
          <div className="space-y-2">
            {reunioesSubcomite.map(r => (
              <div key={r.id} className="flex gap-4 items-center hover:-translate-y-px" style={cardStyle}>
                <div className="flex-shrink-0 w-12 text-center">
                  <div className="font-bold text-sm" style={{ color: 'var(--csa-accent)' }}>
                    {r.horario.slice(0, 5)}
                  </div>
                </div>
                <div className="flex-1 min-w-0">
                  <div className="font-medium text-sm truncate" style={{ color: 'var(--csa-text-1)' }}>
                    {r.subcomites?.nome ?? '—'}
                    {r.subcomites?.sigla && (
                      <span className="ml-1 font-normal text-xs" style={{ color: 'var(--csa-text-3)' }}>
                        ({r.subcomites.sigla})
                      </span>
                    )}
                  </div>
                  {r.local_link && (
                    <div className="flex items-center gap-1 text-xs mt-0.5" style={{ color: 'var(--csa-text-3)' }}>
                      <MapPin size={10} />
                      {r.local_link.startsWith('http') ? (
                        <a
                          href={r.local_link} target="_blank" rel="noopener noreferrer"
                          className="underline flex items-center gap-0.5"
                          style={{ color: 'var(--csa-accent)' }}
                        >
                          Acessar link <ExternalLink size={10} />
                        </a>
                      ) : (
                        <span>{r.local_link}</span>
                      )}
                    </div>
                  )}
                </div>
                <div className="flex-shrink-0">
                  <FormatoBadge formato={r.formato} />
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}
