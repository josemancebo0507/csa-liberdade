'use client'
import { useState, useMemo } from 'react'
import { CalendarDays, MapPin, ExternalLink, SlidersHorizontal, X } from 'lucide-react'

const RESPONSAVEL_LABEL: Record<string, string> = {
  grupo: 'Grupo',
  subcomite: 'Subcomitê',
  area: 'Área',
}

function formatDate(dateStr: string) {
  return new Date(dateStr + 'T12:00:00').toLocaleDateString('pt-BR', {
    weekday: 'long', day: '2-digit', month: 'long', year: 'numeric',
  })
}

export default function EventosLista({ eventos }: { eventos: any[] }) {
  const [filtroResp, setFiltroResp] = useState('')
  const [filtroTipo, setFiltroTipo] = useState('')

  /* ── Opções derivadas dos dados ─────────────────────── */

  const opcoesResponsavel = useMemo(() => {
    const opcoes: { value: string; label: string }[] = [
      { value: '', label: 'Todos os responsáveis' },
    ]
    const vistos = new Set<string>()
    for (const e of eventos) {
      if (e.responsavel === 'area' && !vistos.has('area')) {
        vistos.add('area')
        opcoes.push({ value: 'area', label: 'Área — CSA Liberdade' })
      } else if (e.responsavel === 'subcomite' && e.subcomites?.nome) {
        const key = `subcomite:${e.subcomites.nome}`
        if (!vistos.has(key)) {
          vistos.add(key)
          opcoes.push({ value: key, label: e.subcomites.sigla ? `Subcomitê ${e.subcomites.sigla}` : `Subcomitê: ${e.subcomites.nome}` })
        }
      } else if (e.responsavel === 'grupo' && e.grupos?.nome) {
        const key = `grupo:${e.grupos.nome}`
        if (!vistos.has(key)) {
          vistos.add(key)
          opcoes.push({ value: key, label: `Grupo: ${e.grupos.nome}` })
        }
      }
    }
    return opcoes
  }, [eventos])

  const opcoesTipo = useMemo(() => {
    const opcoes: { value: string; label: string }[] = [
      { value: '', label: 'Todos os tipos' },
    ]
    const vistos = new Set<string>()
    for (const e of eventos) {
      if (e.tipos_evento?.nome && !vistos.has(e.tipos_evento.nome)) {
        vistos.add(e.tipos_evento.nome)
        opcoes.push({ value: e.tipos_evento.nome, label: e.tipos_evento.nome })
      }
    }
    return opcoes
  }, [eventos])

  /* ── Filtragem ──────────────────────────────────────── */

  const eventosFiltrados = useMemo(() => {
    return eventos.filter(e => {
      if (filtroResp) {
        if (filtroResp === 'area' && e.responsavel !== 'area') return false
        if (filtroResp.startsWith('grupo:')) {
          if (e.responsavel !== 'grupo' || e.grupos?.nome !== filtroResp.slice(6)) return false
        }
        if (filtroResp.startsWith('subcomite:')) {
          if (e.responsavel !== 'subcomite' || e.subcomites?.nome !== filtroResp.slice(10)) return false
        }
      }
      if (filtroTipo && e.tipos_evento?.nome !== filtroTipo) return false
      return true
    })
  }, [eventos, filtroResp, filtroTipo])

  const filtroAtivo = filtroResp !== '' || filtroTipo !== ''

  /* ── Empty state global ─────────────────────────────── */

  if (eventos.length === 0) {
    return (
      <div className="card text-center py-12">
        <CalendarDays size={32} className="mx-auto mb-3" style={{ color: 'var(--csa-border)' }} />
        <p style={{ color: 'var(--csa-text-3)' }}>Nenhum evento programado no momento.</p>
      </div>
    )
  }

  /* ── Render ─────────────────────────────────────────── */

  return (
    <div>
      {/* Painel de filtros */}
      <div
        className="mb-6 rounded-2xl"
        style={{
          background: 'var(--csa-tint)',
          border: '1px solid var(--csa-tint-border)',
          padding: '16px 20px',
          transition: 'background 0.25s, border-color 0.25s',
        }}
      >
        {/* Cabeçalho */}
        <div className="flex items-center gap-2 mb-4">
          <SlidersHorizontal size={14} style={{ color: 'var(--csa-accent)' }} />
          <span className="text-sm font-medium" style={{ color: 'var(--csa-accent)' }}>
            Filtrar eventos
          </span>
          {filtroAtivo && (
            <button
              onClick={() => { setFiltroResp(''); setFiltroTipo('') }}
              className="ml-auto flex items-center gap-1 text-xs transition-colors"
              style={{ color: 'var(--csa-text-3)' }}
            >
              <X size={12} /> Limpar filtros
            </button>
          )}
        </div>

        {/* Selects */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <div>
            <label className="block text-xs font-medium mb-1.5" style={{ color: 'var(--csa-text-2)' }}>
              Responsável
            </label>
            <select
              className="form-select form-input text-sm"
              value={filtroResp}
              onChange={e => setFiltroResp(e.target.value)}
            >
              {opcoesResponsavel.map(o => (
                <option key={o.value} value={o.value}>{o.label}</option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-xs font-medium mb-1.5" style={{ color: 'var(--csa-text-2)' }}>
              Tipo de evento
            </label>
            <select
              className="form-select form-input text-sm"
              value={filtroTipo}
              onChange={e => setFiltroTipo(e.target.value)}
            >
              {opcoesTipo.map(o => (
                <option key={o.value} value={o.value}>{o.label}</option>
              ))}
            </select>
          </div>
        </div>

        {/* Contador */}
        {filtroAtivo && (
          <p className="mt-3 text-xs" style={{ color: 'var(--csa-text-3)' }}>
            {eventosFiltrados.length === 0
              ? 'Nenhum evento corresponde aos filtros selecionados.'
              : `${eventosFiltrados.length} de ${eventos.length} evento${eventos.length !== 1 ? 's' : ''}`}
          </p>
        )}
      </div>

      {/* Lista ou empty state filtrado */}
      {eventosFiltrados.length === 0 ? (
        <div className="card text-center py-10">
          <CalendarDays size={28} className="mx-auto mb-3" style={{ color: 'var(--csa-border)' }} />
          <p className="text-sm" style={{ color: 'var(--csa-text-3)' }}>
            Nenhum evento corresponde aos filtros selecionados.
          </p>
          <button
            onClick={() => { setFiltroResp(''); setFiltroTipo('') }}
            className="mt-3 text-sm transition-colors"
            style={{ color: 'var(--csa-accent)' }}
          >
            Limpar filtros
          </button>
        </div>
      ) : (
        <div className="grid gap-3">
          {eventosFiltrados.map((e: any) => {
            const responsavelNome =
              e.responsavel === 'grupo'     ? e.grupos?.nome :
              e.responsavel === 'subcomite' ? e.subcomites?.nome :
              'CSA Liberdade'

            return (
              <div
                key={e.id}
                className="card transition-all duration-200 hover:-translate-y-0.5 hover:shadow-md"
              >
                <div className="flex gap-4">
                  {/* Bloco de data */}
                  <div className="flex-shrink-0 w-14 text-center">
                    <div className="text-2xl font-bold leading-none" style={{ color: 'var(--csa-accent)' }}>
                      {new Date(e.data_evento + 'T12:00:00').getDate().toString().padStart(2, '0')}
                    </div>
                    <div className="text-xs uppercase tracking-wide mt-0.5" style={{ color: 'var(--csa-text-3)' }}>
                      {new Date(e.data_evento + 'T12:00:00').toLocaleDateString('pt-BR', { month: 'short' }).replace('.', '')}
                    </div>
                  </div>

                  <div className="flex-1 min-w-0">
                    <div className="flex items-start justify-between gap-2 mb-1">
                      <h2 className="font-semibold text-base leading-snug" style={{ color: 'var(--csa-text-1)' }}>
                        {e.titulo}
                      </h2>
                      {e.status === 'cancelado' && (
                        <span className="badge badge-red flex-shrink-0">Cancelado</span>
                      )}
                    </div>

                    <div className="text-sm capitalize mb-1" style={{ color: 'var(--csa-text-2)' }}>
                      {formatDate(e.data_evento)}
                      {e.horario && ` às ${e.horario.slice(0, 5)}`}
                    </div>

                    <div className="flex flex-wrap gap-2 mt-2">
                      {e.tipos_evento?.nome && (
                        <span
                          className="badge text-xs"
                          style={{ background: 'var(--csa-tint)', color: 'var(--csa-accent)' }}
                        >
                          {e.tipos_evento.nome}
                        </span>
                      )}
                      <span className="badge badge-gray text-xs">
                        {RESPONSAVEL_LABEL[e.responsavel]}: {responsavelNome}
                      </span>
                    </div>

                    {e.local_link && (
                      <div className="flex items-center gap-1 text-sm mt-2" style={{ color: 'var(--csa-text-2)' }}>
                        <MapPin size={13} />
                        <span>{e.local_link}</span>
                      </div>
                    )}

                    {e.descricao && (
                      <p className="text-sm mt-2" style={{ color: 'var(--csa-text-2)' }}>{e.descricao}</p>
                    )}

                    {e.link_externo && (
                      <a
                        href={e.link_externo}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center gap-1 text-sm mt-2 hover:underline"
                        style={{ color: 'var(--csa-accent)' }}
                      >
                        Ver cartaz / mais informações <ExternalLink size={12} />
                      </a>
                    )}
                  </div>
                </div>
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}
