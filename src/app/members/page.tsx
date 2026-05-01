import Link from 'next/link'
import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase-server'
import type { Profile } from '@/lib/types'
import Navbar from '@/components/Navbar'
import Footer from '@/components/Footer'
import MemberCard from '@/components/MemberCard'

export const metadata = { title: 'Members' }

export default async function MembersPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string }>
}) {
  const supabase = await createClient()

  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser()

  if (authError || !user) {
    redirect('/login')
  }

  const { q } = await searchParams
  const query = q?.trim() ?? ''

  let membersQuery = supabase
    .from('profiles')
    .select('id, username, full_name, bio, avatar_url, location, instagram_handle, tier, is_verified, joined_at, updated_at')
    .neq('tier', 'pending')
    .order('joined_at', { ascending: false })

  if (query) {
    membersQuery = membersQuery.or(
      `username.ilike.%${query}%,full_name.ilike.%${query}%`
    )
  }

  const { data, error } = await membersQuery

  const members = (data ?? []) as Profile[]

  return (
    <div className="min-h-screen flex flex-col bg-ivory">
      <Navbar />

      <main className="flex-1 max-w-7xl mx-auto w-full px-4 sm:px-6 lg:px-8 py-10 space-y-8">

        {/* Page header */}
        <section className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-4">
          <div>
            <h1 className="section-heading">Member Directory</h1>
            <p className="mt-2 text-sm text-mink">
              {members.length} {members.length === 1 ? 'member' : 'members'}
              {query && ` matching "${query}"`}
            </p>
          </div>
        </section>

        {/* Search */}
        <section>
          <form method="GET" className="max-w-md">
            <label htmlFor="q" className="label">Search Members</label>
            <div className="flex gap-3">
              <input
                id="q"
                name="q"
                type="search"
                className="input"
                placeholder="Search by name or @username…"
                defaultValue={query}
                autoComplete="off"
              />
              <button type="submit" className="btn-primary shrink-0">
                Search
              </button>
            </div>
          </form>
          {query && (
            <div className="mt-3">
              <Link
                href="/members"
                className="text-sm text-mink hover:text-forest transition-colors underline underline-offset-2"
              >
                Clear search
              </Link>
            </div>
          )}
        </section>

        {/* Member grid */}
        <section>
          {error && (
            <div className="card p-8 text-center">
              <p className="text-rose text-sm">Failed to load members. Please try again.</p>
            </div>
          )}

          {!error && members.length === 0 && (
            <div className="card p-12 text-center">
              <p className="font-serif text-xl text-forest mb-2">No members found.</p>
              {query && (
                <p className="text-sm text-mink">
                  Try a different search term or{' '}
                  <Link href="/members" className="underline underline-offset-2 hover:text-forest transition-colors">
                    view all members
                  </Link>
                  .
                </p>
              )}
            </div>
          )}

          {!error && members.length > 0 && (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {members.map((member) => (
                <MemberCard key={member.id} member={member} />
              ))}
            </div>
          )}
        </section>

      </main>

      <Footer />
    </div>
  )
}
