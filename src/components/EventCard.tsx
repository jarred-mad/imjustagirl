import Image from 'next/image'
import Link from 'next/link'
import { cn, formatShortDate, formatTime, formatPrice } from '@/lib/utils'
import type { Event, EventStatus } from '@/lib/types'

interface EventCardProps {
  event: Event
  showStatus?: boolean
}

const STATUS_STYLES: Record<EventStatus, { label: string; classes: string }> = {
  draft:      { label: 'Draft',      classes: 'bg-mink/20 text-mink' },
  published:  { label: 'Published',  classes: 'bg-forest/10 text-forest' },
  cancelled:  { label: 'Cancelled',  classes: 'bg-rose/15 text-rose' },
  sold_out:   { label: 'Sold Out',   classes: 'bg-blush/20 text-blush' },
}

export default function EventCard({ event, showStatus = false }: EventCardProps) {
  const price = formatPrice(event.price_cents)
  const status = STATUS_STYLES[event.status]

  return (
    <Link href={`/events/${event.slug}`} className="card block group hover:shadow-md transition-shadow duration-200">
      {/* Cover image */}
      <div className="relative aspect-[16/9] w-full bg-gradient-to-br from-forest to-forest-deep overflow-hidden">
        {event.cover_image_url ? (
          <Image
            src={event.cover_image_url}
            alt={event.title}
            fill
            sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
            className="object-cover group-hover:scale-105 transition-transform duration-500"
          />
        ) : (
          <div className="absolute inset-0 flex items-center justify-center">
            <span className="font-serif text-ivory/30 text-4xl select-none">IJG.</span>
          </div>
        )}

        {/* Overlaid badges */}
        <div className="absolute top-3 left-3 right-3 flex items-start justify-between gap-2">
          {showStatus && (
            <span
              className={cn(
                'text-xs font-medium px-2.5 py-1 rounded-full backdrop-blur-sm',
                status.classes
              )}
            >
              {status.label}
            </span>
          )}

          <div className={cn('flex flex-col items-end gap-1.5 ml-auto')}>
            <span className="text-xs font-medium bg-white/90 text-forest px-2.5 py-1 rounded-full backdrop-blur-sm">
              {price}
            </span>
            {event.is_members_only && (
              <span className="text-xs font-medium bg-forest/90 text-ivory px-2.5 py-1 rounded-full backdrop-blur-sm">
                Members Only
              </span>
            )}
          </div>
        </div>
      </div>

      {/* Card body */}
      <div className="p-5">
        <h3 className="font-serif text-lg text-forest leading-snug group-hover:text-forest-deep transition-colors line-clamp-2">
          {event.title}
        </h3>

        <div className="mt-3 space-y-1.5">
          <div className="flex items-center gap-2 text-sm text-mink">
            <svg className="w-4 h-4 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M6.75 3v2.25M17.25 3v2.25M3 18.75V7.5a2.25 2.25 0 012.25-2.25h13.5A2.25 2.25 0 0121 7.5v11.25m-18 0A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75m-18 0v-7.5A2.25 2.25 0 015.25 9h13.5A2.25 2.25 0 0121 9v7.5" />
            </svg>
            <span>
              {formatShortDate(event.starts_at)} &middot; {formatTime(event.starts_at)}
            </span>
          </div>

          {event.location && (
            <div className="flex items-center gap-2 text-sm text-mink">
              <svg className="w-4 h-4 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M15 10.5a3 3 0 11-6 0 3 3 0 016 0z" />
                <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 10.5c0 7.142-7.5 11.25-7.5 11.25S4.5 17.642 4.5 10.5a7.5 7.5 0 1115 0z" />
              </svg>
              <span className="truncate">{event.location}</span>
            </div>
          )}
        </div>

        <div className="mt-4 pt-4 border-t border-cream flex items-center justify-between">
          <span className="text-xs text-mink font-sans">
            {event.tags.slice(0, 2).join(' · ')}
          </span>
          <span className="text-xs font-medium text-forest group-hover:underline">
            View Details →
          </span>
        </div>
      </div>
    </Link>
  )
}
