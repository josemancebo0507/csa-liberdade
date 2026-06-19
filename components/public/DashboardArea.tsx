'use client'
import { useState, useEffect } from 'react'
import { Users, Layers, UserCheck, CalendarDays, MapPin } from 'lucide-react'
import {
  BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer,
} from 'recharts'

/* ── Tipos ─────────────────────────────────────────────── */
interface Props {
  totalGrupos:     number
  totalSubcomites: number
  totalServidores: number
  reunioes:        { dia_semana: string }[]
  gruposPorCidade: { cidade: string; grupos: number }[]
}

/* ── Constantes ────────────────────────────────────────── */
const DIAS_ORDER = ['segunda','terca','quarta','quinta','sexta','sabado','domingo']
const DIAS_PT    = ['Seg','Ter','Qua','Qui','Sex','Sáb','Dom']

/* ── Tooltips ──────────────────────────────────────────── */
function BarTooltip({ active, payload, label }: any) {
  if (!active || !payload?.length) return null
  return (
    <div className="px-3 py-2 rounded-lg text-sm shadow-lg"
      style={{ background: 'var(--csa-surface)', border: '1px solid var(--csa-border)', color: 'var(--csa-text-1)' }}>
      <strong>{label}</strong>: {payload[0].value} reunião{payload[0].value !== 1 ? 'ões' : ''}
    </div>
  )
}

function CityTooltip({ active, payload, label }: any) {
  if (!active || !payload?.length) return null
  const v = payload[0].value as number
  return (
    <div className="px-3 py-2 rounded-lg text-sm shadow-lg"
      style={{ background: 'var(--csa-surface)', border: '1px solid var(--csa-border)', color: 'var(--csa-text-1)' }}>
      <strong>{label}</strong>: {v} grupo{v !== 1 ? 's' : ''}
    </div>
  )
}

/* ── Componente principal ──────────────────────────────── */
export default function DashboardArea({
  totalGrupos, totalSubcomites, totalServidores,
  reunioes, gruposPorCidade,
}: Props) {

  const [isDark, setIsDark] = useState(false)
  useEffect(() => {
    const check = () => setIsDark(document.documentElement.classList.contains('dark'))
    check()
    const obs = new MutationObserver(check)
    obs.observe(document.documentElement, { attributeFilter: ['class'] })
    return () => obs.disconnect()
  }, [])
  const axisColor = isDark ? '#475569' : '#94a3b8'

  /* Stat cards */
  const statCards = [
    { label: 'Grupos ativos',         value: totalGrupos,     icon: Users        },
    { label: 'Subcomitês ativos',     value: totalSubcomites, icon: Layers       },
    { label: 'Servidores em serviço', value: totalServidores, icon: UserCheck    },
    { label: 'Reuniões cadastradas',  value: reunioes.length, icon: CalendarDays },
  ]

  /* Reuniões por dia */
  const barData = DIAS_ORDER.map((dia, i) => ({
    dia: DIAS_PT[i],
    reunioes: reunioes.filter(r => r.dia_semana === dia).length,
  }))

  /* Altura dinâmica do gráfico de cidades */
  const cityChartHeight = Math.min(Math.max(gruposPorCidade.length * 40, 180), 360)

  return (
    <div className="space-y-6">

      {/* Stat cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        {statCards.map(({ label, value, icon: Icon }) => (
          <div key={label} className="card text-center" style={{ borderRadius: 16 }}>
            <div className="flex justify-center mb-3">
              <div className="p-2.5 rounded-xl" style={{ background: 'var(--csa-tint)' }}>
                <Icon size={18} style={{ color: 'var(--csa-accent)' }} />
              </div>
            </div>
            <div className="text-3xl font-bold leading-none mb-1.5" style={{ color: 'var(--csa-text-1)' }}>
              {value}
            </div>
            <div className="text-xs leading-snug" style={{ color: 'var(--csa-text-3)' }}>
              {label}
            </div>
          </div>
        ))}
      </div>

      {/* Gráficos lado a lado */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">

        {/* Bar chart — Reuniões por dia da semana */}
        <div className="card" style={{ borderRadius: 16 }}>
          <h3 className="section-title mb-4" style={{ fontSize: '0.9rem' }}>
            Reuniões por dia da semana
          </h3>
          <ResponsiveContainer width="100%" height={240}>
            <BarChart data={barData} margin={{ top: 5, right: 8, left: -22, bottom: 0 }}>
              <XAxis dataKey="dia" tick={{ fontSize: 12, fill: axisColor }} axisLine={false} tickLine={false} />
              <YAxis allowDecimals={false} tick={{ fontSize: 12, fill: axisColor }} axisLine={false} tickLine={false} />
              <Tooltip content={<BarTooltip />} cursor={{ fill: 'transparent' }} />
              <Bar dataKey="reunioes" fill="#3f5aa6" radius={[5, 5, 0, 0]} maxBarSize={40} />
            </BarChart>
          </ResponsiveContainer>
        </div>

        {/* Horizontal bar chart — Grupos por cidade */}
        <div className="card" style={{ borderRadius: 16 }}>
          <h3 className="section-title mb-4 flex items-center gap-1.5" style={{ fontSize: '0.9rem' }}>
            <MapPin size={14} style={{ color: 'var(--csa-accent)' }} />
            Grupos por cidade
          </h3>
          {gruposPorCidade.length === 0 ? (
            <div className="flex items-center justify-center h-[240px] text-sm" style={{ color: 'var(--csa-text-3)' }}>
              Nenhum grupo ativo
            </div>
          ) : (
            <ResponsiveContainer width="100%" height={cityChartHeight}>
              <BarChart
                data={gruposPorCidade}
                layout="vertical"
                margin={{ top: 0, right: 16, left: 4, bottom: 0 }}
              >
                <XAxis
                  type="number"
                  allowDecimals={false}
                  tick={{ fontSize: 12, fill: axisColor }}
                  axisLine={false}
                  tickLine={false}
                />
                <YAxis
                  type="category"
                  dataKey="cidade"
                  width={120}
                  tick={{ fontSize: 11, fill: axisColor }}
                  axisLine={false}
                  tickLine={false}
                />
                <Tooltip content={<CityTooltip />} cursor={{ fill: 'transparent' }} />
                <Bar dataKey="grupos" fill="#3f5aa6" radius={[0, 4, 4, 0]} maxBarSize={32} />
              </BarChart>
            </ResponsiveContainer>
          )}
        </div>
      </div>
    </div>
  )
}
