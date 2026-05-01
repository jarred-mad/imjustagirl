import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase-server'
import AdminSidebar from '@/components/AdminSidebar'

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  const supabase = await createClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    redirect('/login')
  }

  const { data: profile } = await supabase
    .from('profiles')
    .select('tier')
    .eq('id', user.id)
    .single()

  if (!profile || profile.tier !== 'admin') {
    redirect('/')
  }

  return (
    <div className="flex h-screen overflow-hidden bg-ivory">
      <div className="flex-shrink-0 w-56 h-full">
        <AdminSidebar />
      </div>
      <main className="flex-1 min-h-screen overflow-y-auto bg-ivory">
        {children}
      </main>
    </div>
  )
}
