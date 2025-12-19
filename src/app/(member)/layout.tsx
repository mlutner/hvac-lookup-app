import { Header } from '@/components/layout/header'

export default function MemberLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <div className="min-h-screen bg-slate-50">
      <Header />
      <main className="pb-8">
        {children}
      </main>
    </div>
  )
}
