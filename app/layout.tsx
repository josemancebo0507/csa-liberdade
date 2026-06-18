import type { Metadata } from 'next'
import './globals.css'

export const metadata: Metadata = {
  title: 'CSA Liberdade — Narcóticos Anônimos',
  description: 'Portal de serviços do Comitê de Serviço de Área Liberdade — Narcóticos Anônimos',
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="pt-BR">
      <body>{children}</body>
    </html>
  )
}
