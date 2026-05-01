import { notFound, redirect } from 'next/navigation'
import Image from 'next/image'
import Link from 'next/link'
import { createClient } from '@/lib/supabase-server'
import { formatShortDate, formatRelativeTime, getInitials, truncate } from '@/lib/utils'
import type { Profile, ForumThread, MembershipTier } from '@/lib/types'
import Navbar from '@/components/Navbar'
import Footer from '@/components/Footer'

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

const BOARD_LABELS: Record<string, string> = {
  general: 'General',
  events: 'Events',
  announcements: 'Announcements',
  introductions: 'Introductions',
  recommendations: 'Recommendations',
}

export default async function MemberProfilePage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const supabase = await createClient()

  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser()

  if (authError || !user) {
    redirect('/login')
  }

  const { id } = await params

  const [profileResult, threadsResult] = await Promise.all([
    supabase
      .from('profiles')
      .select('id, username, full_name, bio, avatar_url, location, instagram_handle, tier, is_verified, joined_at, updated_at')
      .eq('id', id)
      .single(),

    supabase
      .from('forum_threads')
      .select('id, board, title, body, author_id, is_pinned, is_locked, reply_count, last_reply_at, created_at, updated_at')
      .eq('author_id', id)
      .order('created_at', { ascending: false })
      .limit(3),
  ])

  if (profileResult.error || !profileResult.data) {
    notFound()
  }

  const profile = profileResult.data as Profile
  const threads = (threadsResult.data ?? []) as ForumThread[]

  const initials = getInitials(profile.full_name)
  const isOwnProfile = user.id === profile.id

  return (
    <div className="min-h-screen flex flex-col bg-ivory">
      <Navbar />

      <main className="flex-1 max-w-3xl mx-auto w-full px-4 sm:px-6 lg:px-8 py-10 space-y-8">

        {/* Profile header */}
        <section className="card p-8">
          <div className="flex flex-col sm:flex-row items-start gap-6">
            {/* Avatar */}
            <div className="relative shrink-0">
              {profile.avatar_url ? (
                <Image
                  src={profile.avatar_url}
                  alt={profile.full_name}
                  width={112}
                  height={112}
                  className="w-28 h-28 rounded-full object-cover border-2 border-cream"
                />
              ) : (
                <div className="w-28 h-28 rounded-full bg-forest flex items-center justify-center border-2 border-cream">
                  <span className="font-serif text-3xl text-ivory font-semibold">{initials}</span>
                </div>
              )}
              {profile.is_verified && (
                <span className="absolute -bottom-1 -right-1 rounded-full bg-ivory p-0.5">
                  <svg className="w-5 h-5 text-rose" viewBox="0 0 20 20" fill="currentColor" aria-label="Verified">
                    <path
                      fillRule="evenodd"
                      d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.857-9.809a.75.75 0 00-1.214-.882l-3.483 4.79-1.88-1.88a.75.75 0 10-1.06 1.061l2.5 2.5a.75.75 0 001.137-.089l4-5.5z"
                      clipRule="evenodd"
                    />
                  </svg>
                </span>
              )}
            </div>

            {/* Info */}
            <div className="flex-1 min-w-0">
              <h1 className="font-serif text-3xl text-forest leading-tight">{profile.full_name}</h1>
              <p className="text-sm text-mink mt-0.5">@{profile.username}</p>

              <div className="mt-3 flex items-center gap-2 flex-wrap">
                <TierBadge tier={profile.tier} />
                {profile.location && (
                  <span className="flex items-center gap-1 text-xs text-mink">
                    <svg className="w-3.5 h-3.5 shrink-0" viewBox="0 0 20 20" fill="currentColor">
                      <path
                        fillRule="evenodd"
                        d="M9.69 18.933l.003.001C9.89 19.02 10 19 10 19s.11.02.308-.066l.002-.001.006-.003.018-.008a5.741 5.741 0 00.281-.14c.186-.096.446-.24.757-.433.62-.387 1.445-.966 2.274-1.765C15.302 14.988 17 12.493 17 9A7 7 0 103 9c0 3.492 1.698 5.988 3.355 7.584a13.731 13.731 0 002.273 1.765 11.842 11.842 0 00.976.544l.062.029.018.008.006.003zM10 11.25a2.25 2.25 0 100-4.5 2.25 2.25 0 000 4.5z"
                        clipRule="evenodd"
                      />
                    </svg>
                    {profile.location}
                  </span>
                )}
              </div>

              <p className="mt-3 text-xs text-mink">
                Member since {formatShortDate(profile.joined_at)}
              </p>

              {profile.bio && (
                <p className="mt-4 text-sm text-forest/80 leading-relaxed">{profile.bio}</p>
              )}

              {/* Instagram */}
              {profile.instagram_handle && (
                <a
                  href={`https://instagram.com/${profile.instagram_handle}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="mt-4 inline-flex items-center gap-2 text-sm text-mink hover:text-forest transition-colors group"
                >
                  <svg className="w-4 h-4 shrink-0" viewBox="0 0 24 24" fill="currentColor">
                    <path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zm0-2.163c-3.259 0-3.667.014-4.947.072-4.358.2-6.78 2.618-6.98 6.98-.059 1.281-.073 1.689-.073 4.948 0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98 1.281.058 1.689.072 4.948.072 3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98-1.281-.059-1.69-.073-4.949-.073zm0 5.838c-3.403 0-6.162 2.759-6.162 6.162s2.759 6.163 6.162 6.163 6.162-2.759 6.162-6.163c0-3.403-2.759-6.162-6.162-6.162zm0 10.162c-2.209 0-4-1.79-4-4 0-2.209 1.791-4 4-4s4 1.791 4 4c0 2.21-1.791 4-4 4zm6.406-11.845c-.796 0-1.441.645-1.441 1.44s.645 1.44 1.441 1.44c.795 0 1.439-.645 1.439-1.44s-.644-1.44-1.439-1.44z" />
                  </svg>
                  <span className="group-hover:underline underline-offset-2">@{profile.instagram_handle}</span>
                </a>
              )}
            </div>
          </div>

          {/* Action buttons */}
          {!isOwnProfile && (
            <div className="mt-6 pt-6 border-t border-cream flex flex-wrap gap-3">
              <Link
                href={`/messages/new?to=${profile.id}`}
                className="btn-primary"
              >
                Send a Message
              </Link>
            </div>
          )}

          {isOwnProfile && (
            <div className="mt-6 pt-6 border-t border-cream">
              <Link href="/profile" className="btn-secondary inline-block">
                Edit Your Profile
              </Link>
            </div>
          )}
        </section>

        {/* Forum activity */}
        <section>
          <h2 className="font-serif text-2xl text-forest mb-4">Recent Forum Activity</h2>

          {threads.length === 0 ? (
            <div className="card p-8 text-center">
              <p className="text-sm text-mink">
                {profile.full_name.split(' ')[0]} hasn&apos;t posted in the forum yet.
              </p>
            </div>
          ) : (
            <div className="space-y-3">
              {threads.map((thread) => (
                <Link
                  key={thread.id}
                  href={`/forum/${thread.id}`}
                  className="card p-5 block group hover:shadow-md transition-shadow duration-200"
                >
                  <div className="flex items-start justify-between gap-4">
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-2 mb-1.5 flex-wrap">
                        <span className="text-xs font-medium text-mink uppercase tracking-wide">
                          {BOARD_LABELS[thread.board] ?? thread.board}
                        </span>
                        {thread.is_pinned && (
                          <span className="text-xs text-forest bg-forest/10 px-2 py-0.5 rounded-full font-medium">
                            Pinned
                          </span>
                        )}
                      </div>
                      <h3 className="font-serif text-base text-forest group-hover:text-forest-deep transition-colors leading-snug">
                        {thread.title}
                      </h3>
                      {thread.body && (
                        <p className="mt-1.5 text-sm text-mink leading-relaxed">
                          {truncate(thread.body, 120)}
                        </p>
                      )}
                    </div>
                    <div className="shrink-0 text-right">
                      <p className="text-xs text-mink">{formatRelativeTime(thread.created_at)}</p>
                      <p className="text-xs text-mink/70 mt-1">
                        {thread.reply_count} {thread.reply_count === 1 ? 'reply' : 'replies'}
                      </p>
                    </div>
                  </div>
                </Link>
              ))}

              <div className="text-right">
                <Link
                  href={`/forum?author=${profile.id}`}
                  className="text-sm text-mink hover:text-forest transition-colors"
                >
                  View all posts by {profile.full_name.split(' ')[0]} →
                </Link>
              </div>
            </div>
          )}
        </section>

      </main>

      <Footer />
    </div>
  )
}
