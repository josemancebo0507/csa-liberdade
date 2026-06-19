'use client'
import { useState } from 'react'
import { ChevronDown } from 'lucide-react'

interface Props {
  title: string
  defaultOpen?: boolean
  children: React.ReactNode
}

export default function AccordionSection({ title, defaultOpen = true, children }: Props) {
  const [open, setOpen] = useState(defaultOpen)

  return (
    <div className="mb-8">
      <button
        onClick={() => setOpen(o => !o)}
        className="w-full flex items-center justify-between py-3 text-left"
        style={{ borderBottom: '1px solid var(--csa-border)' }}
      >
        <span className="section-title" style={{ color: 'var(--csa-text-1)' }}>{title}</span>
        <ChevronDown
          size={18}
          style={{
            color: 'var(--csa-text-3)',
            transform: open ? 'rotate(0deg)' : 'rotate(-90deg)',
            transition: 'transform 0.2s ease',
            flexShrink: 0,
          }}
        />
      </button>
      {open && <div className="pt-5">{children}</div>}
    </div>
  )
}
