import { createClient } from '@/lib/supabase-server'
import { formatDateTime, formatPrice } from '@/lib/utils'
import { Event, EventStatus } from '@/lib/types'
import Link from 'next/link'

export const metadata = { title: 'Events — Admin' }

const STATUS_BADGE: Record<EventStatus, { label: string; classes: string }> = {
  published: { label: 'Published', classes: 'bg-green-100 text-green-800' },
  draft: { label: 'Draft', classes: 'bg-amber-100 text-amber-800' },
  cancelled: { label: 'Cancelled', classes: 'bg-red-100 text-red-800' },
  sold_out: { label: 'Sold Out', classes: 'bg-blue-100 text-blue-700' },
}

const FILTER_TABS = [
  { label: 'All', value: null },
  { label: 'Upcoming', value: 'upcoming' },
  { label: 'Past', value: 'past' },
  { label: 'Draft', value: 'draft' },
] as const

interface PageProps {
  searchParams: Promise<{ filter?: string }>
}

export default async function AdminEventsPage({ searchParams }: PageProps) {
  const { filter } = await searchParams
  const supabase = await createClient()

  let query = supabase
    .from('events')
    .select('id, title, slug, starts_at, ends_at, status, capacity, is_members_only, price_cents, created_at')
    .order('starts_at', { ascending: false })

  if (filter === 'upcoming') {
    query = query.gt('starts_at', new Date().toISOString())
  } else if (filter === 'past') {
    query = query.lt('starts_at', new Date().toISOString())
  } else if (filter === 'draft') {
    query = query.eq('status', 'draft')
  }

  const { data: events } = await query

  // Fetch RSVP counts for all returned events
  const eventIds = (events ?? []).map((e) => e.id)
  const { data: rsvpCounts } = eventIds.length > 0
    ? await supabase
        .from('rsvps')
        .select('event_id')
        .in('event_id', eventIds)
        .eq('status', 'going')
    : { data: [] }

  const rsvpByEvent = (rsvpCounts ?? []).reduce<Record<string, number>>((acc, row) => {
    acc[row.event_id] = (acc[row.event_id] ?? 0) + 1
    return acc
  }, {})

  return (
    <div className="p-8">
      {/* Page header */}
      <div className="bg-white rounded-2xl border border-cream px-8 py-6 mb-8 flex items-center justify-between">
        <div>
          <h1 className="font-serif text-3xl text-forest font-semibold">Events</h1>
          <p className="mt-1 text-sm text-mink">{events?.length ?? 0} total events</p>
        </div>
        <Link href="/admin/events/new" className="btn-primary">
          + New Event
        </Link>
      </div>

      {/* Filter tabs */}
      <div className="flex items-center gap-1 mb-6 bg-white rounded-2xl border border-cream p-1.5 w-fit">
        {FILTER_TABS.map((tab) => {
          const isActive = (filter ?? null) === tab.value
          const href = tab.value ? `/admin/events?filter=${tab.value}` : '/admin/events'
          return (
            <Link
              key={tab.label}
              href={href}
              className={
                isActive
                  ? 'px-4 py-2 rounded-xl text-sm font-medium bg-forest text-ivory'
                  : 'px-4 py-2 rounded-xl text-sm font-medium text-mink hover:bg-ivory transition-colors'
              }
            >
              {tab.label}
            </Link>
          )
        })}
      </div>

      {/* Events table */}
      <div className="card overflow-visible">
        {events && events.length > 0 ? (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-cream bg-ivory/60">
                  <th className="px-6 py-3 text-left label mb-0">Title</th>
                  <th className="px-6 py-3 text-left label mb-0">Date</th>
                  <th className="px-6 py-3 text-left label mb-0">Status</th>
                  <th className="px-6 py-3 text-left label mb-0">Price</th>
                  <th className="px-6 py-3 text-left label mb-0">Capacity</th>
                  <th className="px-6 py-3 text-left label mb-0">RSVPs</th>
                  <th className="px-6 py-3 text-left label mb-0">Members Only</th>
                  <th className="px-6 py-3 text-right label mb-0">Actions</th>
                </tr>
              </thead>
              <tbody>
                {(events as Pick<Event, 'id' | 'title' | 'slug' | 'starts_at' | 'status' | 'capacity' | 'is_members_only' | 'price_cents'>[]).map(
                  (event) => {
                    const badge = STATUS_BADGE[event.status]
                    const rsvpCount = rsvpByEvent[event.id] ?? 0
                    return (
                      <tr
                        key={event.id}
                        className="border-b border-cream last:border-0 hover:bg-ivory/40 transition-colors"
                      >
                        <td className="px-6 py-4">
                          <span className="font-medium text-forest">{event.title}</span>
                        </td>
                        <td className="px-6 py-4 text-mink whitespace-nowrap">
                          {formatDateTime(event.starts_at)}
                        </td>
                        <td className="px-6 py-4">
                          <span
                            className={`inline-flex items-center rounded-full px-2.5 py-1 text-xs font-medium ${badge.classes}`}
                          >
                            {badge.label}
                          </span>
                        </td>
                        <td className="px-6 py-4 text-mink">
                          {formatPrice(event.price_cents)}
                        </td>
                        <td className="px-6 py-4 text-mink">
                          {event.capacity ?? '—'}
                        </td>
                        <td className="px-6 py-4 text-mink">
                          {rsvpCount}
                          {event.capacity ? ` / ${event.capacity}` : ''}
                        </td>
                        <td className="px-6 py-4">
                          {event.is_members_only ? (
                            <span className="inline-flex items-center rounded-full px-2.5 py-1 text-xs font-medium bg-forest/10 text-forest">
                              Yes
                            </span>
                          ) : (
                            <span className="text-mink text-xs">No</span>
                          )}
                        </td>
                        <td className="px-6 py-4 text-right">
                          <div className="flex items-center justify-end gap-2">
                            <Link
                              href={`/admin/events/${event.id}`}
                              className="text-xs font-medium text-forest hover:text-forest-deep border border-forest/30 rounded-full px-3 py-1.5 hover:bg-forest/5 transition-colors"
                            >
                              Edit
                            </Link>
                            <button
                              type="button"
                              className="text-xs font-medium text-rose/80 hover:text-rose border border-rose/30 rounded-full px-3 py-1.5 hover:bg-rose/5 transition-colors"
                            >
                              Delete
                            </button>
                          </div>
                        </td>
                      </tr>
                    )
                  }
                )}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="px-6 py-16 text-center text-mink text-sm">
            No events found.{' '}
            <Link href="/admin/events/new" className="text-forest font-medium hover:underline">
              Create the first one.
            </Link>
          </div>
        )}
      </div>
    </div>
  )
}
