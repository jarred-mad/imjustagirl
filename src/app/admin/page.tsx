import { createClient } from '@/lib/supabase-server'
import StatCard from '@/components/StatCard'
import { formatDateTime } from '@/lib/utils'
import { Profile } from '@/lib/types'
import Link from 'next/link'

export const metadata = { title: 'Admin Dashboard' }

export default async function AdminDashboardPage() {
  const supabase = await createClient()

  const [
    { count: totalMembers },
    { count: pendingMembers },
    { count: upcomingEvents },
    { count: totalMedia },
    { count: pendingMedia },
    { count: totalBusinesses },
    { count: pendingBusinesses },
  ] = await Promise.all([
    supabase
      .from('profiles')
      .select('id', { count: 'exact', head: true })
      .neq('tier', 'pending'),
    supabase
      .from('profiles')
      .select('id', { count: 'exact', head: true })
      .eq('tier', 'pending'),
    supabase
      .from('events')
      .select('id', { count: 'exact', head: true })
      .gt('starts_at', new Date().toISOString())
      .eq('status', 'published'),
    supabase
      .from('media')
      .select('id', { count: 'exact', head: true }),
    supabase
      .from('media')
      .select('id', { count: 'exact', head: true })
      .eq('is_approved', false),
    supabase
      .from('businesses')
      .select('id', { count: 'exact', head: true }),
    supabase
      .from('businesses')
      .select('id', { count: 'exact', head: true })
      .eq('is_approved', false),
  ])

  const { data: recentPending } = await supabase
    .from('profiles')
    .select('id, username, full_name, avatar_url, joined_at, tier')
    .eq('tier', 'pending')
    .order('joined_at', { ascending: false })
    .limit(5)

  return (
    <div className="p-8">
      {/* Page header */}
      <div className="bg-white rounded-2xl border border-cream px-8 py-6 mb-8">
        <h1 className="font-serif text-3xl text-forest font-semibold">Dashboard</h1>
        <p className="mt-1 text-sm text-mink">IMJUSTAGIRL. Social Club — Admin overview</p>
      </div>

      {/* Stats grid */}
      <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 xl:grid-cols-4 mb-8">
        <StatCard
          label="Total Members"
          value={totalMembers ?? 0}
          sub="Active across all tiers"
          accent="forest"
        />
        <StatCard
          label="Pending Approvals"
          value={pendingMembers ?? 0}
          sub="Awaiting review"
          accent="rose"
        />
        <StatCard
          label="Upcoming Events"
          value={upcomingEvents ?? 0}
          sub="Published & future"
          accent="forest"
        />
        <StatCard
          label="Total Media"
          value={totalMedia ?? 0}
          sub="All uploads"
          accent="blush"
        />
        <StatCard
          label="Pending Media"
          value={pendingMedia ?? 0}
          sub="Not yet approved"
          accent="rose"
        />
        <StatCard
          label="Total Businesses"
          value={totalBusinesses ?? 0}
          sub="In the directory"
          accent="forest"
        />
        <StatCard
          label="Pending Businesses"
          value={pendingBusinesses ?? 0}
          sub="Awaiting approval"
          accent="rose"
        />
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        {/* Recent pending members */}
        <div className="lg:col-span-2 card overflow-visible">
          <div className="flex items-center justify-between px-6 py-4 border-b border-cream">
            <h2 className="font-serif text-lg text-forest font-semibold">
              Recent Applications
            </h2>
            <Link
              href="/admin/members"
              className="text-xs text-blush font-medium hover:underline"
            >
              View all
            </Link>
          </div>

          {recentPending && recentPending.length > 0 ? (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-cream bg-ivory/60">
                    <th className="px-6 py-3 text-left label mb-0">Member</th>
                    <th className="px-6 py-3 text-left label mb-0">Username</th>
                    <th className="px-6 py-3 text-left label mb-0">Joined</th>
                    <th className="px-6 py-3 text-right label mb-0">Action</th>
                  </tr>
                </thead>
                <tbody>
                  {(recentPending as Pick<Profile, 'id' | 'username' | 'full_name' | 'avatar_url' | 'joined_at'>[]).map(
                    (member) => (
                      <tr key={member.id} className="border-b border-cream last:border-0 hover:bg-ivory/40 transition-colors">
                        <td className="px-6 py-4">
                          <div className="flex items-center gap-3">
                            {member.avatar_url ? (
                              <img
                                src={member.avatar_url}
                                alt={member.full_name}
                                className="h-8 w-8 rounded-full object-cover flex-shrink-0"
                              />
                            ) : (
                              <div className="h-8 w-8 rounded-full bg-cream flex items-center justify-center flex-shrink-0">
                                <span className="text-xs font-medium text-mink">
                                  {member.full_name?.charAt(0).toUpperCase() ?? '?'}
                                </span>
                              </div>
                            )}
                            <span className="font-medium text-forest">{member.full_name}</span>
                          </div>
                        </td>
                        <td className="px-6 py-4 text-mink">@{member.username}</td>
                        <td className="px-6 py-4 text-mink whitespace-nowrap">
                          {formatDateTime(member.joined_at)}
                        </td>
                        <td className="px-6 py-4 text-right">
                          <Link
                            href="/admin/members"
                            className="text-xs font-medium text-forest hover:text-forest-deep border border-forest/30 rounded-full px-3 py-1.5 hover:bg-forest/5 transition-colors"
                          >
                            Review
                          </Link>
                        </td>
                      </tr>
                    )
                  )}
                </tbody>
              </table>
            </div>
          ) : (
            <div className="px-6 py-10 text-center text-mink text-sm">
              No pending applications.
            </div>
          )}
        </div>

        {/* Pending actions */}
        <div className="space-y-4">
          <div className="card p-6">
            <h2 className="font-serif text-lg text-forest font-semibold mb-4">
              Pending Actions
            </h2>
            <div className="space-y-3">
              <Link
                href="/admin/media"
                className="flex items-center justify-between rounded-xl bg-ivory px-4 py-3 hover:bg-cream transition-colors"
              >
                <div>
                  <p className="text-sm font-medium text-forest">Media Approvals</p>
                  <p className="text-xs text-mink mt-0.5">Review uploaded photos & videos</p>
                </div>
                {(pendingMedia ?? 0) > 0 && (
                  <span className="inline-flex items-center justify-center h-6 min-w-6 rounded-full bg-rose text-ivory text-xs font-semibold px-1.5">
                    {pendingMedia}
                  </span>
                )}
              </Link>

              <Link
                href="/admin/businesses"
                className="flex items-center justify-between rounded-xl bg-ivory px-4 py-3 hover:bg-cream transition-colors"
              >
                <div>
                  <p className="text-sm font-medium text-forest">Business Approvals</p>
                  <p className="text-xs text-mink mt-0.5">Review directory submissions</p>
                </div>
                {(pendingBusinesses ?? 0) > 0 && (
                  <span className="inline-flex items-center justify-center h-6 min-w-6 rounded-full bg-rose text-ivory text-xs font-semibold px-1.5">
                    {pendingBusinesses}
                  </span>
                )}
              </Link>

              <Link
                href="/admin/members"
                className="flex items-center justify-between rounded-xl bg-ivory px-4 py-3 hover:bg-cream transition-colors"
              >
                <div>
                  <p className="text-sm font-medium text-forest">Member Approvals</p>
                  <p className="text-xs text-mink mt-0.5">Approve pending applications</p>
                </div>
                {(pendingMembers ?? 0) > 0 && (
                  <span className="inline-flex items-center justify-center h-6 min-w-6 rounded-full bg-rose text-ivory text-xs font-semibold px-1.5">
                    {pendingMembers}
                  </span>
                )}
              </Link>
            </div>
          </div>

          <div className="card p-6">
            <h2 className="font-serif text-lg text-forest font-semibold mb-4">
              Quick Links
            </h2>
            <div className="space-y-2">
              <Link
                href="/admin/events/new"
                className="block text-sm font-medium text-blush hover:underline"
              >
                + Create new event
              </Link>
              <Link
                href="/admin/events"
                className="block text-sm font-medium text-blush hover:underline"
              >
                Manage events
              </Link>
              <Link
                href="/admin/forum"
                className="block text-sm font-medium text-blush hover:underline"
              >
                Moderate forum
              </Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
