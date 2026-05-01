import Link from 'next/link'
import { createClient } from '@/lib/supabase-server'
import type { Event } from '@/lib/types'
import Navbar from '@/components/Navbar'
import Footer from '@/components/Footer'
import EventCard from '@/components/EventCard'

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
    .limit(3)

  if (error) {
    console.error('[HomePage] failed to fetch events:', error.message)
    return []
  }

  return data ?? []
}

// ─── Why section pillars ───────────────────────────────────────────────────────

const PILLARS = [
  {
    icon: (
      <svg className="w-7 h-7" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M18 18.72a9.094 9.094 0 003.741-.479 3 3 0 00-4.682-2.72m.94 3.198l.001.031c0 .225-.012.447-.037.666A11.944 11.944 0 0112 21c-2.17 0-4.207-.576-5.963-1.584A6.062 6.062 0 016 18.719m12 0a5.971 5.971 0 00-.941-3.197m0 0A5.995 5.995 0 0012 12.75a5.995 5.995 0 00-5.058 2.772m0 0a3 3 0 00-4.681 2.72 8.986 8.986 0 003.74.477m.94-3.197a5.971 5.971 0 00-.94 3.197M15 6.75a3 3 0 11-6 0 3 3 0 016 0zm6 3a2.25 2.25 0 11-4.5 0 2.25 2.25 0 014.5 0zm-13.5 0a2.25 2.25 0 11-4.5 0 2.25 2.25 0 014.5 0z" />
      </svg>
    ),
    heading: 'Community',
    body: 'A private space built for women who want to connect deeply — not just network. Forum threads, direct messages, and member profiles all in one place.',
  },
  {
    icon: (
      <svg className="w-7 h-7" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M6.75 3v2.25M17.25 3v2.25M3 18.75V7.5a2.25 2.25 0 012.25-2.25h13.5A2.25 2.25 0 0121 7.5v11.25m-18 0A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75m-18 0v-7.5A2.25 2.25 0 015.25 9h13.5A2.25 2.25 0 0121 9v7.5" />
      </svg>
    ),
    heading: 'Events',
    body: 'Curated dinners, workshops, and experiences designed to bring our members together IRL. Members-only access with priority booking.',
  },
  {
    icon: (
      <svg className="w-7 h-7" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 12h16.5m-16.5 3.75h16.5M3.75 19.5h16.5M5.625 4.5h12.75a1.875 1.875 0 010 3.75H5.625a1.875 1.875 0 010-3.75z" />
      </svg>
    ),
    heading: 'Directory',
    body: 'Discover and support women-owned businesses in the club. From creative studios to wellness practices — shop the community first.',
  },
]

// ─── Page ──────────────────────────────────────────────────────────────────────

export default async function HomePage() {
  const events = await getUpcomingEvents()

  return (
    <>
      <Navbar />

      {/* ── Hero ──────────────────────────────────────────────────────────── */}
      <section className="relative min-h-screen bg-forest flex items-center overflow-hidden">
        {/* Diagonal texture overlay */}
        <div
          className="absolute inset-0 opacity-[0.04]"
          style={{
            backgroundImage:
              'repeating-linear-gradient(45deg, #FAF7F2 0px, #FAF7F2 1px, transparent 1px, transparent 12px)',
          }}
        />

        {/* Decorative gradient circle */}
        <div
          className="absolute right-[-10%] top-[10%] w-[600px] h-[600px] rounded-full pointer-events-none"
          style={{
            background:
              'radial-gradient(circle, rgba(201,144,122,0.18) 0%, rgba(240,234,217,0.07) 60%, transparent 80%)',
          }}
        />
        <div
          className="absolute left-[-8%] bottom-[5%] w-[400px] h-[400px] rounded-full pointer-events-none"
          style={{
            background:
              'radial-gradient(circle, rgba(217,107,138,0.10) 0%, transparent 70%)',
          }}
        />

        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-28 md:py-40">
          <div className="max-w-3xl">
            {/* Eyebrow */}
            <p className="label text-blush/80 mb-6 tracking-[0.2em]">
              IMJUSTAGIRL. Social Club
            </p>

            {/* Headline */}
            <h1 className="font-serif text-ivory text-5xl sm:text-6xl md:text-7xl leading-[1.05] tracking-tight">
              Where women gather,&nbsp;
              <em className="not-italic text-blush">grow,</em> and glow.
            </h1>

            {/* Sub-headline */}
            <p className="mt-7 text-ivory/65 text-lg sm:text-xl font-sans leading-relaxed max-w-xl">
              An intimate members-only club for women who move with intention.
              Curated events, honest community, and a space that actually feels
              like yours.
            </p>

            {/* CTAs */}
            <div className="mt-10 flex flex-wrap gap-4">
              <Link href="/auth/join" className="btn-rose">
                Join the Club
              </Link>
              <Link
                href="/about"
                className="border border-ivory/40 text-ivory px-6 py-3 rounded-full font-sans text-sm font-medium tracking-wide hover:bg-ivory/10 transition-colors duration-200"
              >
                Learn More
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* ── Upcoming Events ───────────────────────────────────────────────── */}
      <section className="bg-ivory py-20 md:py-28">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-end justify-between mb-10 gap-4">
            <h2 className="section-heading">Upcoming Events</h2>
            <Link
              href="/events"
              className="text-sm font-medium text-forest hover:text-forest-deep transition-colors whitespace-nowrap shrink-0"
            >
              See All Events →
            </Link>
          </div>

          {events.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {events.map((event) => (
                <EventCard key={event.id} event={event} />
              ))}
            </div>
          ) : (
            <div className="text-center py-16">
              <p className="text-mink font-sans text-base">
                No upcoming events. Check back soon!
              </p>
            </div>
          )}
        </div>
      </section>

      {/* ── Why IMJUSTAGIRL. ──────────────────────────────────────────────── */}
      <section className="bg-cream py-20 md:py-28">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-14">
            <p className="label text-mink mb-3">Built differently</p>
            <h2 className="section-heading">Why IMJUSTAGIRL.</h2>
            <p className="mt-4 text-mink font-sans text-base max-w-lg mx-auto leading-relaxed">
              Every feature, every event, every corner of this club was built
              with one woman in mind. You.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {PILLARS.map((pillar) => (
              <div
                key={pillar.heading}
                className="bg-white rounded-2xl p-8 border border-cream shadow-sm"
              >
                <div className="w-12 h-12 rounded-xl bg-forest/8 text-forest flex items-center justify-center mb-5">
                  {pillar.icon}
                </div>
                <h3 className="font-serif text-xl text-forest mb-3">
                  {pillar.heading}
                </h3>
                <p className="text-mink font-sans text-sm leading-relaxed">
                  {pillar.body}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Join CTA ──────────────────────────────────────────────────────── */}
      <section className="bg-forest py-24 md:py-32 relative overflow-hidden">
        {/* Subtle accent circle */}
        <div
          className="absolute right-[-5%] top-[-20%] w-[500px] h-[500px] rounded-full pointer-events-none"
          style={{
            background:
              'radial-gradient(circle, rgba(201,144,122,0.12) 0%, transparent 70%)',
          }}
        />

        <div className="relative max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <p className="label text-blush/80 tracking-[0.2em] mb-4">
            Membership
          </p>
          <h2 className="font-serif text-ivory text-4xl md:text-5xl leading-tight">
            Ready to join a club that gets you?
          </h2>
          <p className="mt-5 text-ivory/60 font-sans text-base md:text-lg leading-relaxed max-w-xl mx-auto">
            Membership gives you access to private events, the member forum,
            direct messaging, and our growing directory of women-owned
            businesses. Apply today.
          </p>
          <div className="mt-10">
            <Link href="/auth/join" className="btn-rose">
              Join the Club
            </Link>
          </div>
        </div>
      </section>

      <Footer />
    </>
  )
}
