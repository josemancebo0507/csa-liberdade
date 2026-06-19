import PublicNav from '@/components/public/PublicNav'

export default function PublicLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen" style={{ backgroundColor: 'var(--csa-bg)', transition: 'background-color 0.25s' }}>
      <PublicNav />
      <main className="max-w-5xl mx-auto px-4 py-8">
        {children}
      </main>
      <footer className="border-t border-slate-200 mt-16 py-8 text-center text-sm text-slate-400">
        CSA Liberdade — Narcóticos Anônimos
        <span className="mx-2">·</span>
        <a href="/admin" className="hover:text-slate-600 transition-colors">Área administrativa</a>
      </footer>
    </div>
  )
}
