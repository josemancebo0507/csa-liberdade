'use client'
import { Printer } from 'lucide-react'

export default function PrintButton() {
  return (
    <button className="btn-secondary print:hidden" onClick={() => window.print()}>
      <Printer size={15} /> Imprimir
    </button>
  )
}
