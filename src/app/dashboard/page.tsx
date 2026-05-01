import { redirect } from 'next/navigation'
import Link from 'next/link'
import { createClient } from '@/lib/supabase-server'
import { formatShortDate, getInitials } from '@/lib/utils'
import type { Profile, Event, Rsvp, MembershipTier } from '@/lib/types'
import Navbar from '@/components/Navbar'
import Footer from '@/components/Footer'
import StatCard from '@/components/StatCard'
import EventCard from '@/components/EventCard'

export const metadata = { title: 'Dashboard' }

interface RsvpWithEvent extends Rsvp {
  events: Event
}

function TierBadge({ tier }: { tier: MembershipTier }) {
  if (tier === 'founding') {
    return (
      <span className="inline-flex items-center rounded-full bg-rose px-3 py-1 text-xs font-medium text-ivory">
        Founding Member
      </span>
    )
  }
  if (tier === 'admin') {
    return (
      <span className="inline-flex items-center rounded-full bg-forest-deep px-3 py-1 text-xs font-medium text-ivory">
        Admin
      </span>
    )
  }
  if (tier === 'member') {
    return (
      <span className="inline-flex items-center rounded-full bg-forest px-3 py-1 text-xs font-medium text-ivory">
        Member
      </span>
    )
  }
  return (
    <span className="inline-flex items-center rounded-full bg-mink/20 px-3 py-1 text-xs font-medium text-mink">
      Pending
    </span>
  )
}

const QUICK_LINKS = [
  {
    label: 'Members Directory',
    href: '/members',
    description: 'Browse and connect with other members.',
    icon: (
      <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M15 19.128a9.38 9.38 0 002.625.372 9.337 9.337 0 004.121-.952 4.125 4.125 0 00-7.533-2.493M15 19.128v-.003c0-1.113-.285-2.16-.786-3.07M15 19.128v.106A12.318 12.318 0 018.624 21c-2.331 0-4.512-.645-6.374-1.766l-.001-.109a6.375 6.375 0 0111.964-3.07M12 6.375a3.375 3.375 0 11-6.75 0 3.375 3.375 0 016.75 0zm8.25 2.25a2.625 2.625 0 11-5.25 0 2.625 2.625 0 015.25 0z" />
      </svg>
    ),
  },
  {
    label: 'Forum',
    href: '/forum',
    description: 'Join the conversation in our private boards.',
    icon: (
      <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M7.5 8.25h9m-9 3H12m-9.75 1.51c0 1.6 1.123 2.994 2.707 3.227 1.129.166 2.27.293 3.423.379.35.026.67.21.865.501L12 21l2.755-4.133a1.14 1.14 0 01.865-.501 48.172 48.172 0 003.423-.379c1.584-.233 2.707-1.626 2.707-3.228V6.741c0-1.602-1.123-2.995-2.707-3.228A48.394 48.394 0 0012 3c-2.392 0-4.744.175-7.043.513C3.373 3.746 2.25 5.14 2.25 6.741v6.018z" />
      </svg>
    ),
  },
  {
    label: 'Messages',
    href: '/messages',
    description: 'Direct messages with other members.',
    icon: (
      <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M21.75 6.75v10.5a2.25 2.25 0 01-2.25 2.25h-15a2.25 2.25 0 01-2.25-2.25V6.75m19.5 0A2.25 2.25 0 0019.5 4.5h-15a2.25 2.25 0 00-2.25 2.25m19.5 0v.243a2.25 2.25 0 01-1.07 1.916l-7.5 4.615a2.25 2.25 0 01-2.36 0L3.32 8.91a2.25 2.25 0 01-1.07-1.916V6.75" />
      </svg>
    ),
  },
  {
    label: 'Shop the Club',
    href: '/shop-the-club',
    description: 'Member-run businesses and recommendations.',
    icon: (
      <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 10.5V6a3.75 3.75 0 10-7.5 0v4.5m11.356-1.993l1.263 12c.07.665-.45 1.243-1.119 1.243H4.25a1.125 1.125 0 01-1.12-1.243l1.264-12A1.125 1.125 0 015.513 7.5h12.974c.576 0 1.059.435 1.119 1.007zM8.625 10.5a.375.375 0 11-.75 0 .375.375 0 01.75 0zm7.5 0a.375.375 0 11-.75 0 .375.375 0 01.75 0z" />
      </svg>
    ),
  },
]

export default async function DashboardPage() {
  const supabase = await createClient()

  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser()

  if (authError || !user) {
    redirect('/login')
  }

  const [profileResult, rsvpResult, conversationsResult] = await Promise.all([
    supabase
      .from('profiles')
      .select('id, username, full_name, bio, avatar_url, location, instagram_handle, tier, is_verified, joined_at, updated_at')
      .eq('id', user.id)
      .single(),

    supabase
      .from('rsvps')
      .select('id, event_id, user_id, status, created_at, events(id, title, slug, description, body, cover_image_url, location, location_url, starts_at, ends_at, capacity, price_cents, status, is_members_only, tags, created_by, created_at, updated_at)')
      .eq('user_id', user.id)
      .eq('status', 'going')
      .gt('events.starts_at', new Date().toISOString())
      .order('events(starts_at)', { ascending: true })
      .limit(5),

    supabase
      .from('conversations')
      .select('id')
      .contains('participant_ids', [user.id]),
  ])

  const profile = profileResult.data as Profile | null
  const rsvps = (rsvpResult.data ?? []) as unknown as RsvpWithEvent[]

  const conversationIds = (conversationsResult.data ?? []).map((c) => c.id)

  let unreadCount = 0
  if (conversationIds.length > 0) {
    const { count } = await supabase
      .from('messages')
      .select('id', { count: 'exact', head: true })
      .eq('status', 'sent')
      .neq('sender_id', user.id)
      .in('conversation_id', conversationIds)

    unreadCount = count ?? 0
  }

  const upcomingEvents = rsvps
    .map((r) => r.events)
    .filter(Boolean)

  const memberSince = profile?.joined_at
    ? new Date(profile.joined_at).toLocaleDateString('en-US', { month: 'long', year: 'numeric' })
    : '—'

  const firstName = profile?.full_name?.split(' ')[0] ?? profile?.username ?? 'there'
  const initials = getInitials(profile?.full_name ?? profile?.username ?? 'M')

  return (
    <div className="min-h-screen flex flex-col bg-ivory">
      <Navbar />

      <main className="flex-1 max-w-7xl mx-auto w-full px-4 sm:px-6 lg:px-8 py-10 space-y-10">

        {/* Welcome header */}
        <section className="flex items-center gap-5">
          <div className="shrink-0">
            {profile?.avatar_url ? (
              <img
                src={profile.avatar_url}
                alt={profile.full_name}
                className="w-16 h-16 rounded-full object-cover border-2 border-cream"
              />
            ) : (
              <div className="w-16 h-16 rounded-full bg-forest flex items-center justify-center">
                <span className="font-serif text-xl text-ivory font-semibold">{initials}</span>
              </div>
            )}
          </div>
          <div>
            <h1 className="font-serif text-3xl text-forest leading-tight">
              Welcome back, {firstName}.
            </h1>
            <div className="mt-1.5 flex items-center gap-2 flex-wrap">
              {profile && <TierBadge tier={profile.tier} />}
              {profile?.username && (
                <span className="text-sm text-mink">@{profile.username}</span>
              )}
            </div>
          </div>
        </section>

        {/* Stats row */}
        <section>
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            <StatCard
              label="Upcoming RSVPs"
              value={upcomingEvents.length}
              accent="forest"
            />
            <StatCard
              label="Member Since"
              value={memberSince}
              accent="blush"
            />
            <StatCard
              label="Unread Messages"
              value={unreadCount}
              accent={unreadCount > 0 ? 'rose' : 'forest'}
            />
            <StatCard
              label="Membership Tier"
              value={
                profile?.tier === 'founding'
                  ? 'Founding'
                  : profile?.tier === 'admin'
                  ? 'Admin'
                  : profile?.tier === 'member'
                  ? 'Member'
                  : 'Pending'
              }
              accent="blush"
            />
          </div>
        </section>

        {/* Upcoming events */}
        <section>
          <div className="flex items-center justify-between mb-5">
            <h2 className="font-serif text-2xl text-forest">Your Upcoming Events</h2>
            <Link href="/events" className="text-sm text-mink hover:text-forest transition-colors">
              Browse all events →
            </Link>
          </div>

          {upcomingEvents.length > 0 ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
              {upcomingEvents.map((event) => (
                <EventCard key={event.id} event={event} />
              ))}
            </div>
          ) : (
            <div className="card p-10 text-center">
              <p className="font-serif text-xl text-forest mb-2">No upcoming events yet.</p>
              <p className="text-sm text-mink mb-5">Browse what&apos;s coming up and RSVP.</p>
              <Link href="/events" className="btn-primary inline-block">
                View Events
              </Link>
            </div>
          )}
        </section>

        {/* Quick links */}
        <section>
          <h2 className="font-serif text-2xl text-forest mb-5">Quick Links</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {QUICK_LINKS.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                className="card p-6 group hover:shadow-md transition-shadow duration-200 flex flex-col gap-3"
              >
                <span className="text-forest group-hover:text-forest-deep transition-colors">
                  {link.icon}
                </span>
                <div>
                  <p className="font-serif text-base text-forest font-semibold leading-tight group-hover:text-forest-deep transition-colors">
                    {link.label}
                  </p>
                  <p className="mt-1 text-xs text-mink leading-relaxed">{link.description}</p>
                </div>
              </Link>
            ))}
          </div>
        </section>

      </main>

      <Footer />
    </div>
  )
}
