import type { Metadata } from 'next'
import { createClient } from '@/lib/supabase-server'
import type { Event } from '@/lib/types'
import Navbar from '@/components/Navbar'
import Footer from '@/components/Footer'
import EventCard from '@/components/EventCard'

export const metadata: Metadata = {
  title: 'Events',
  description:
    'Browse upcoming IMJUSTAGIRL. Social Club events — curated experiences for women who move with intention.',
}

// ─── Supabase fetch ────────────────────────────────────────────────────────────

async function getUpcomingEvents(): Promise<Event[]> {
  const supabase = await createClient()
  const { data, error } = await supabase
    .from('events')
    .select(
      'id, title, slug, description, body, cover_image_url, location, location_url, starts_at, ends_at, capacity, price_cents, status, is_members_only, tags, created_by, created_at, updated_at'
    )
    .eq('status', 'published')
    .gt('starts_at', new Date().toISOString())
    .order('starts_at', { ascending: true })

  if (error) {
    console.error('[EventsPage] failed to fetch events:', error.message)
    return []
  }

  return data ?? []
}

// ─── Page ──────────────────────────────────────────────────────────────────────

export default async function EventsPage() {
  const events = await getUpcomingEvents()

  return (
    <>
      <Navbar />

      {/* ── Page header ───────────────────────────────────────────────────── */}
      <section className="bg-cream border-b border-cream/60 py-14 md:py-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <p className="label text-mink mb-3">What's coming up</p>
          <h1 className="section-heading">Upcoming Events</h1>
          <p className="mt-4 text-mink font-sans text-base max-w-xl leading-relaxed">
            Curated gatherings, workshops, and experiences — designed for
            women who show up fully.
          </p>
        </div>
      </section>

      {/* ── Event grid ────────────────────────────────────────────────────── */}
      <section className="bg-ivory py-14 md:py-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          {events.length > 0 ? (
            <>
              <p className="text-xs text-mink font-sans mb-8 uppercase tracking-wider">
                {events.length} {events.length === 1 ? 'event' : 'events'} coming up
              </p>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                {events.map((event) => (
                  <EventCard key={event.id} event={event} />
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
                    d="M6.75 3v2.25M17.25 3v2.25M3 18.75V7.5a2.25 2.25 0 012.25-2.25h13.5A2.25 2.25 0 0121 7.5v11.25m-18 0A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75m-18 0v-7.5A2.25 2.25 0 015.25 9h13.5A2.25 2.25 0 0121 9v7.5"
                  />
                </svg>
              </div>
              <h2 className="font-serif text-xl text-forest mb-2">
                Nothing on the calendar yet
              </h2>
              <p className="text-mink font-sans text-sm">
                Check back soon — something good is always in the works.
              </p>
            </div>
          )}
        </div>
      </section>

      <Footer />
    </>
  )
}
