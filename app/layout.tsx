import type { Metadata } from 'next'
import './globals.css'

export const metadata: Metadata = {
  title: 'CSA Liberdade — Narcóticos Anônimos',
  description: 'Portal de serviços do Comitê de Serviço de Área Liberdade — Narcóticos Anônimos',
}

const themeScript = `(function(){try{var t=localStorage.getItem('csa-theme'),s=window.matchMedia('(prefers-color-scheme:dark)').matches;if(t==='dark'||(t===null&&s))document.documentElement.classList.add('dark')}catch(e){}})()`

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="pt-BR" suppressHydrationWarning>
      <head>
        {/* Prevent flash of wrong theme before hydration */}
        <script dangerouslySetInnerHTML={{ __html: themeScript }} />
      </head>
      <body>{children}</body>
    </html>
  )
}
