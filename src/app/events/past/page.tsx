import type { Metadata } from 'next'
import Link from 'next/link'
import { createClient } from '@/lib/supabase-server'
import type { Event } from '@/lib/types'
import Navbar from '@/components/Navbar'
import Footer from '@/components/Footer'
import EventCard from '@/components/EventCard'

export const metadata: Metadata = {
  title: 'Past Events',
  description:
    'Relive past IMJUSTAGIRL. Social Club gatherings, workshops, and experiences.',
}

// ─── Types ─────────────────────────────────────────────────────────────────────

interface EventWithPhotoCount extends Event {
  photo_count: number
}

// ─── Supabase fetch ────────────────────────────────────────────────────────────

async function getPastEvents(): Promise<EventWithPhotoCount[]> {
  const supabase = await createClient()

  // Fetch past published events
  const { data: events, error: eventsError } = await supabase
    .from('events')
    .select(
      'id, title, slug, description, body, cover_image_url, location, location_url, starts_at, ends_at, capacity, price_cents, status, is_members_only, tags, created_by, created_at, updated_at'
    )
    .eq('status', 'published')
    .lt('starts_at', new Date().toISOString())
    .order('starts_at', { ascending: false })

  if (eventsError) {
    console.error('[PastEventsPage] failed to fetch events:', eventsError.message)
    return []
  }

  if (!events || events.length === 0) return []

  // Fetch approved photo counts for each event in a single query
  const eventIds = events.map((e) => e.id)
  const { data: mediaCounts, error: mediaError } = await supabase
    .from('media')
    .select('event_id')
    .in('event_id', eventIds)
    .eq('is_approved', true)
    .eq('media_type', 'photo')

  if (mediaError) {
    // Non-fatal — render events without counts
    console.error('[PastEventsPage] failed to fetch media counts:', mediaError.message)
  }

  // Build a lookup map: event_id → count
  const countMap: Record<string, number> = {}
  if (mediaCounts) {
    for (const row of mediaCounts) {
      if (row.event_id) {
        countMap[row.event_id] = (countMap[row.event_id] ?? 0) + 1
      }
    }
  }

  return events.map((event) => ({
    ...event,
    photo_count: countMap[event.id] ?? 0,
  }))
}

// ─── Photo count badge ─────────────────────────────────────────────────────────

function PhotoBadge({ count }: { count: number }) {
  if (count === 0) return null
  return (
    <div className="flex items-center gap-1.5 text-xs text-mink font-sans mt-2">
      <svg
        className="w-3.5 h-3.5 shrink-0"
        fill="none"
        viewBox="0 0 24 24"
        stroke="currentColor"
        strokeWidth={1.5}
      >
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          d="M2.25 15.75l5.159-5.159a2.25 2.25 0 013.182 0l5.159 5.159m-1.5-1.5l1.409-1.409a2.25 2.25 0 013.182 0l2.909 2.909m-18 3.75h16.5a1.5 1.5 0 001.5-1.5V6a1.5 1.5 0 00-1.5-1.5H3.75A1.5 1.5 0 002.25 6v12a1.5 1.5 0 001.5 1.5zm10.5-11.25h.008v.008h-.008V8.25zm.375 0a.375.375 0 11-.75 0 .375.375 0 01.75 0z"
        />
      </svg>
      <span>
        {count} {count === 1 ? 'photo' : 'photos'}
      </span>
    </div>
  )
}

// ─── Page ──────────────────────────────────────────────────────────────────────

export default async function PastEventsPage() {
  const events = await getPastEvents()

  return (
    <>
      <Navbar />

      {/* ── Page header ───────────────────────────────────────────────────── */}
      <section className="bg-cream border-b border-cream/60 py-14 md:py-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <p className="label text-mink mb-3">Down memory lane</p>
          <h1 className="section-heading">Past Events</h1>
          <p className="mt-4 text-mink font-sans text-base max-w-xl leading-relaxed">
            Every gathering leaves something behind. Browse what we've been up
            to and see what's coming next.
          </p>
          <div className="mt-6">
            <Link
              href="/events"
              className="text-sm font-medium text-forest hover:text-forest-deep transition-colors"
            >
              View Upcoming Events →
            </Link>
          </div>
        </div>
      </section>

      {/* ── Event grid ────────────────────────────────────────────────────── */}
      <section className="bg-ivory py-14 md:py-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          {events.length > 0 ? (
            <>
              <p className="text-xs text-mink font-sans mb-8 uppercase tracking-wider">
                {events.length} past {events.length === 1 ? 'event' : 'events'}
              </p>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                {events.map((event) => (
                  <div key={event.id} className="flex flex-col">
                    <EventCard event={event} />
                    {event.photo_count > 0 && (
                      <div className="px-5 pb-4 -mt-1 bg-white border-x border-b border-cream rounded-b-2xl">
                        <PhotoBadge count={event.photo_count} />
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </>
          ) : (
            <div className="text-center py-24">
              <div className="w-14 h-14 rounded-full bg-cream flex items-center justify-center mx-auto mb-5">
                <svg
                  className="w-6 h-6 text-mink"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                  strokeWidth={1.5}
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    d="M12 6v6h4.5m4.5 0a9 9 0 11-18 0 9 9 0 0118 0z"
                  />
                </svg>
              </div>
              <h2 className="font-serif text-xl text-forest mb-2">
                No past events yet
              </h2>
              <p className="text-mink font-sans text-sm">
                Our story is just getting started.
              </p>
            </div>
          )}
        </div>
      </section>

      <Footer />
    </>
  )
}
