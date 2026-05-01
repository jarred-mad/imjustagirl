import { notFound } from 'next/navigation'
import type { Metadata } from 'next'
import Link from 'next/link'
import { createClient } from '@/lib/supabase-server'
import type { Event, MediaWithUploader, RsvpStatus } from '@/lib/types'
import { formatDate, formatDateTime, formatPrice } from '@/lib/utils'
import Navbar from '@/components/Navbar'
import Footer from '@/components/Footer'
import MediaGrid from '@/components/MediaGrid'
import UploadModalWrapper from './_upload-modal-wrapper'
import RsvpButton from './_rsvp-button'

async function getEvent(id: string): Promise<Event | null> {
  const supabase = await createClient()

  const { data, error } = await supabase
    .from('events')
    .select(
      'id, title, slug, description, body, cover_image_url, location, location_url, starts_at, ends_at, capacity, price_cents, status, is_members_only, tags, created_by, created_at, updated_at'
    )
    .eq('id', id)
    .maybeSingle()

  if (error || !data) return null
  return data as Event
}

async function getRsvpData(
  eventId: string,
  userId: string | null
): Promise<{ count: number; userStatus: RsvpStatus | null }> {
  const supabase = await createClient()

  const { count } = await supabase
    .from('rsvps')
    .select('id', { count: 'exact', head: true })
    .eq('event_id', eventId)
    .eq('status', 'going')

  let userStatus: RsvpStatus | null = null
  if (userId) {
    const { data } = await supabase
      .from('rsvps')
      .select('status')
      .eq('event_id', eventId)
      .eq('user_id', userId)
      .maybeSingle()

    userStatus = (data?.status as RsvpStatus) ?? null
  }

  return { count: count ?? 0, userStatus }
}

async function getEventMedia(eventId: string): Promise<MediaWithUploader[]> {
  const supabase = await createClient()

  const { data, error } = await supabase
    .from('media')
    .select(
      'id, event_id, uploaded_by, media_type, storage_path, public_url, caption, width, height, is_approved, created_at, uploader:profiles!media_uploaded_by_fkey(id, username, avatar_url)'
    )
    .eq('event_id', eventId)
    .eq('is_approved', true)
    .order('created_at', { ascending: false })

  if (error) {
    console.error('[EventDetailPage] failed to fetch media:', error.message)
    return []
  }

  return (data ?? []).map((m) => ({
    ...m,
    uploader: Array.isArray(m.uploader) ? m.uploader[0] : m.uploader,
  })) as MediaWithUploader[]
}

export async function generateMetadata({
  params,
}: {
  params: { id: string }
}): Promise<Metadata> {
  const event = await getEvent(params.id)
  if (!event) return { title: 'Event Not Found' }
  return {
    title: event.title,
    description: event.description ?? undefined,
  }
}

export default async function EventDetailPage({
  params,
}: {
  params: { id: string }
}) {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  const [event, media] = await Promise.all([
    getEvent(params.id),
    getEventMedia(params.id),
  ])

  if (!event) notFound()

  const { count: rsvpCount, userStatus } = await getRsvpData(
    event.id,
    user?.id ?? null
  )

  const isSoldOut =
    event.status === 'sold_out' ||
    (event.capacity !== null && rsvpCount >= event.capacity)

  const price = formatPrice(event.price_cents)
  const isCancelled = event.status === 'cancelled'

  return (
    <>
      <Navbar />

      {/* Hero */}
      <div className="relative h-72 md:h-96 w-full bg-gradient-to-br from-forest to-forest-deep overflow-hidden">
        {event.cover_image_url ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={event.cover_image_url}
            alt={event.title}
            className="absolute inset-0 w-full h-full object-cover"
          />
        ) : (
          <div className="absolute inset-0 flex items-center justify-center">
            <span className="font-serif text-ivory/20 text-7xl select-none">IJG.</span>
          </div>
        )}
        {/* Gradient scrim for legibility */}
        <div className="absolute inset-0 bg-gradient-to-t from-forest/70 via-forest/20 to-transparent" />

        {/* Status badge */}
        {isCancelled && (
          <div className="absolute top-4 left-4">
            <span className="bg-rose text-ivory text-xs font-medium px-3 py-1.5 rounded-full">
              Cancelled
            </span>
          </div>
        )}
        {isSoldOut && !isCancelled && (
          <div className="absolute top-4 left-4">
            <span className="bg-blush text-ivory text-xs font-medium px-3 py-1.5 rounded-full">
              Sold Out
            </span>
          </div>
        )}
        {event.is_members_only && (
          <div className="absolute top-4 right-4">
            <span className="bg-forest/90 text-ivory text-xs font-medium px-3 py-1.5 rounded-full backdrop-blur-sm">
              Members Only
            </span>
          </div>
        )}
      </div>

      {/* Content */}
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-10 md:py-14">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-10">
          {/* Main column */}
          <div className="lg:col-span-2 space-y-8">
            {/* Tags */}
            {event.tags.length > 0 && (
              <div className="flex flex-wrap gap-2">
                {event.tags.map((tag) => (
                  <span
                    key={tag}
                    className="text-xs font-medium bg-cream text-forest px-3 py-1 rounded-full"
                  >
                    {tag}
                  </span>
                ))}
              </div>
            )}

            <h1 className="font-serif text-3xl md:text-4xl text-forest leading-tight">
              {event.title}
            </h1>

            {event.description && (
              <p className="text-base text-mink leading-relaxed">{event.description}</p>
            )}

            {event.body && (
              <div className="prose prose-sm max-w-none text-forest/90 leading-relaxed whitespace-pre-wrap border-t border-cream pt-6">
                {event.body}
              </div>
            )}
          </div>

          {/* Sidebar */}
          <aside className="space-y-6">
            {/* Event details card */}
            <div className="card p-6 space-y-4">
              {/* Date */}
              <div className="flex items-start gap-3">
                <div className="w-8 h-8 rounded-lg bg-cream flex items-center justify-center shrink-0 mt-0.5">
                  <svg
                    className="w-4 h-4 text-forest"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                    strokeWidth={1.5}
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      d="M6.75 3v2.25M17.25 3v2.25M3 18.75V7.5a2.25 2.25 0 012.25-2.25h13.5A2.25 2.25 0 0121 7.5v11.25m-18 0A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75m-18 0v-7.5A2.25 2.25 0 015.25 9h13.5A2.25 2.25 0 0121 9v7.5"
                    />
                  </svg>
                </div>
                <div>
                  <p className="text-xs text-mink font-medium uppercase tracking-wider mb-0.5">
                    Date & Time
                  </p>
                  <p className="text-sm text-forest font-medium">
                    {formatDateTime(event.starts_at)}
                  </p>
                  {event.ends_at && (
                    <p className="text-xs text-mink mt-0.5">
                      Ends {formatDate(event.ends_at)}
                    </p>
                  )}
                </div>
              </div>

              {/* Location */}
              {event.location && (
                <div className="flex items-start gap-3">
                  <div className="w-8 h-8 rounded-lg bg-cream flex items-center justify-center shrink-0 mt-0.5">
                    <svg
                      className="w-4 h-4 text-forest"
                      fill="none"
                      viewBox="0 0 24 24"
                      stroke="currentColor"
                      strokeWidth={1.5}
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        d="M15 10.5a3 3 0 11-6 0 3 3 0 016 0z"
                      />
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        d="M19.5 10.5c0 7.142-7.5 11.25-7.5 11.25S4.5 17.642 4.5 10.5a7.5 7.5 0 1115 0z"
                      />
                    </svg>
                  </div>
                  <div>
                    <p className="text-xs text-mink font-medium uppercase tracking-wider mb-0.5">
                      Location
                    </p>
                    {event.location_url ? (
                      <a
                        href={event.location_url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-sm text-forest font-medium hover:text-forest-deep transition-colors underline underline-offset-2"
                      >
                        {event.location}
                      </a>
                    ) : (
                      <p className="text-sm text-forest font-medium">{event.location}</p>
                    )}
                  </div>
                </div>
              )}

              {/* Price */}
              <div className="flex items-start gap-3">
                <div className="w-8 h-8 rounded-lg bg-cream flex items-center justify-center shrink-0 mt-0.5">
                  <svg
                    className="w-4 h-4 text-forest"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                    strokeWidth={1.5}
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      d="M2.25 18.75a60.07 60.07 0 0115.797 2.101c.727.198 1.453-.342 1.453-1.096V18.75M3.75 4.5v.75A.75.75 0 013 6h-.75m0 0v-.375c0-.621.504-1.125 1.125-1.125H20.25M2.25 6v9m18-10.5v.75c0 .414.336.75.75.75h.75m-1.5-1.5h.375c.621 0 1.125.504 1.125 1.125v9.75c0 .621-.504 1.125-1.125 1.125h-.375m1.5-1.5H21a.75.75 0 00-.75.75v.75m0 0H3.75m0 0h-.375a1.125 1.125 0 01-1.125-1.125V15m1.5 1.5v-.75A.75.75 0 003 15h-.75"
                    />
                  </svg>
                </div>
                <div>
                  <p className="text-xs text-mink font-medium uppercase tracking-wider mb-0.5">
                    Price
                  </p>
                  <p className="text-sm text-forest font-medium">{price}</p>
                </div>
              </div>

              <div className="pt-2 border-t border-cream">
                {isCancelled ? (
                  <p className="text-sm text-rose font-medium text-center py-1">
                    This event has been cancelled.
                  </p>
                ) : (
                  <RsvpButton
                    eventId={event.id}
                    currentStatus={userStatus}
                    rsvpCount={rsvpCount}
                    capacity={event.capacity}
                    isSoldOut={isSoldOut}
                  />
                )}
              </div>
            </div>

            {/* Back link */}
            <Link
              href="/events"
              className="inline-flex items-center gap-1.5 text-sm text-mink hover:text-forest transition-colors"
            >
              <svg
                className="w-4 h-4"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
                strokeWidth={2}
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M15.75 19.5L8.25 12l7.5-7.5"
                />
              </svg>
              All Events
            </Link>
          </aside>
        </div>

        {/* Photo gallery */}
        <section className="mt-16 pt-10 border-t border-cream">
          <div className="flex items-center justify-between mb-6">
            <h2 className="font-serif text-2xl text-forest">Photos</h2>
            {user && (
              <UploadModalWrapper eventId={event.id} />
            )}
          </div>
          <MediaGrid items={media} columns={3} />
        </section>
      </div>

      <Footer />
    </>
  )
}
