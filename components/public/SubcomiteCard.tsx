'use client'
import { useState } from 'react'
import { Clock, User, Layers, ChevronDown } from 'lucide-react'
import { DIA_SEMANA_LABEL, FORMATO_LABEL } from '@/lib/types'

interface Props {
  subcomite: any
}

export default function SubcomiteCard({ subcomite }: Props) {
  const [expandido, setExpandido] = useState(false)

  const reunioes  = (subcomite.reunioes_subcomite  ?? []).filter((r: any) => r.status === 'ativo')
  const servidores = (subcomite.vinculos_encargo ?? []).filter((v: any) => v.status !== 'inativo')
  const temServidores = servidores.length > 0

  return (
    <div className="card">
      {/* Cabeçalho: ícone + nome + sigla */}
      <div className="flex items-start justify-between gap-3 mb-3">
        <div className="flex items-center gap-2.5">
          <div
            className="w-9 h-9 rounded-lg flex items-center justify-center flex-shrink-0"
            style={{ background: 'var(--csa-tint)' }}
          >
            <Layers size={16} style={{ color: 'var(--csa-accent)' }} />
          </div>
          <div>
            <h2 className="font-semibold" style={{ color: 'var(--csa-text-1)' }}>
              {subcomite.nome}
            </h2>
            {subcomite.sigla && (
              <span className="badge badge-blue text-xs">{subcomite.sigla}</span>
            )}
          </div>
        </div>
      </div>

      {/* Descrição */}
      {subcomite.descricao && (
        <p className="text-sm mb-3" style={{ color: 'var(--csa-text-2)' }}>
          {subcomite.descricao}
        </p>
      )}

      {/* Reuniões — sempre visíveis */}
      {reunioes.length > 0 && (
        <div className="mb-3">
          <div
            className="text-xs font-semibold uppercase tracking-wide mb-1.5"
            style={{ color: 'var(--csa-text-3)' }}
          >
            Reuniões
          </div>
          {reunioes.map((r: any) => (
            <div
              key={r.id}
              className="flex items-center gap-1.5 text-sm"
              style={{ color: 'var(--csa-text-2)' }}
            >
              <Clock size={13} style={{ color: 'var(--csa-text-3)' }} />
              {r.recorrente
                ? `${DIA_SEMANA_LABEL[r.dia_semana as keyof typeof DIA_SEMANA_LABEL]} às ${r.horario.slice(0, 5)}`
                : `${new Date(r.data_especifica + 'T12:00:00').toLocaleDateString('pt-BR')} às ${r.horario.slice(0, 5)}`
              }
              <span style={{ color: 'var(--csa-border)' }}>·</span>
              <span>{FORMATO_LABEL[r.formato as keyof typeof FORMATO_LABEL]}</span>
            </div>
          ))}
        </div>
      )}

      {/* Servidores — seção colapsável */}
      <div
        className="mt-3 pt-3"
        style={{ borderTop: '1px solid var(--csa-border)' }}
      >
        {temServidores ? (
          <>
            <button
              onClick={() => setExpandido(v => !v)}
              className="w-full flex items-center justify-between py-0.5 cursor-pointer"
              style={{ background: 'none', border: 'none', padding: 0 }}
            >
              <span
                className="text-sm font-medium transition-colors"
                style={{ color: expandido ? 'var(--csa-text-1)' : 'var(--csa-text-2)' }}
              >
                Servidores ({servidores.length})
              </span>
              <ChevronDown
                size={16}
                style={{
                  color: 'var(--csa-text-3)',
                  transform: expandido ? 'rotate(180deg)' : 'none',
                  transition: 'transform 0.2s',
                  flexShrink: 0,
                }}
              />
            </button>

            {expandido && (
              <div className="mt-2 space-y-1">
                {servidores.map((v: any) => (
                  <div key={v.id} className="flex items-center justify-between text-sm">
                    <span className="flex items-center gap-1.5" style={{ color: 'var(--csa-text-1)' }}>
                      <User size={12} style={{ color: 'var(--csa-text-3)' }} />
                      {v.servidores?.nome_servico ?? 'Vago'}
                    </span>
                    <span className="badge badge-gray">{v.tipos_encargo?.nome}</span>
                  </div>
                ))}
              </div>
            )}
          </>
        ) : (
          <span className="text-sm cursor-default" style={{ color: 'var(--csa-text-3)' }}>
            Nenhum servidor
          </span>
        )}
      </div>
    </div>
  )
}
