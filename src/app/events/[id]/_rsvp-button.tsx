'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase'
import type { RsvpStatus } from '@/lib/types'

interface RsvpButtonProps {
  eventId: string
  currentStatus: RsvpStatus | null
  rsvpCount: number
  capacity: number | null
  isSoldOut: boolean
}

export default function RsvpButton({
  eventId,
  currentStatus,
  rsvpCount,
  capacity,
  isSoldOut,
}: RsvpButtonProps) {
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const isGoing = currentStatus === 'going'
  const isWaitlisted = currentStatus === 'waitlist'
  const capacityPct = capacity ? Math.min((rsvpCount / capacity) * 100, 100) : null

  async function handleRsvp() {
    setLoading(true)
    setError(null)

    try {
      const supabase = createClient()
      const {
        data: { user },
      } = await supabase.auth.getUser()

      if (!user) {
        router.push('/login')
        return
      }

      if (isGoing || isWaitlisted) {
        // Cancel RSVP
        const { error: deleteError } = await supabase
          .from('rsvps')
          .delete()
          .eq('event_id', eventId)
          .eq('user_id', user.id)

        if (deleteError) throw deleteError
      } else {
        // Create RSVP — waitlist if at capacity
        const status: RsvpStatus =
          capacity !== null && rsvpCount >= capacity ? 'waitlist' : 'going'

        const { error: insertError } = await supabase.from('rsvps').insert({
          event_id: eventId,
          user_id: user.id,
          status,
        })

        if (insertError) throw insertError
      }

      router.refresh()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Something went wrong. Try again.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="space-y-4">
      {/* Capacity bar */}
      {capacity !== null && (
        <div>
          <div className="flex justify-between text-xs text-mink mb-2">
            <span>
              {rsvpCount} going
              {isSoldOut && (
                <span className="ml-2 text-blush font-medium">· Sold out</span>
              )}
            </span>
            <span>{capacity} capacity</span>
          </div>
          <div className="h-2 bg-cream rounded-full overflow-hidden">
            <div
              className="h-full bg-forest rounded-full transition-all duration-500"
              style={{ width: `${capacityPct}%` }}
            />
          </div>
        </div>
      )}

      {capacity === null && (
        <p className="text-sm text-mink">{rsvpCount} going</p>
      )}

      {/* RSVP button */}
      <button
        onClick={handleRsvp}
        disabled={loading || (isSoldOut && !isGoing && !isWaitlisted)}
        className={
          isGoing || isWaitlisted
            ? 'btn-secondary text-sm px-6 py-2.5 w-full sm:w-auto disabled:opacity-50'
            : 'btn-primary text-sm px-6 py-2.5 w-full sm:w-auto disabled:opacity-50'
        }
      >
        {loading ? (
          <span className="flex items-center justify-center gap-2">
            <svg className="w-4 h-4 animate-spin" fill="none" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v4l3-3-3-3v4a8 8 0 00-8 8h4z" />
            </svg>
            Updating…
          </span>
        ) : isGoing ? (
          'Cancel RSVP'
        ) : isWaitlisted ? (
          'Leave Waitlist'
        ) : isSoldOut ? (
          'Join Waitlist'
        ) : (
          'RSVP'
        )}
      </button>

      {isGoing && (
        <p className="text-xs text-forest font-medium flex items-center gap-1.5">
          <svg className="w-3.5 h-3.5 text-forest" fill="currentColor" viewBox="0 0 20 20">
            <path
              fillRule="evenodd"
              d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.857-9.809a.75.75 0 00-1.214-.882l-3.483 4.79-1.88-1.88a.75.75 0 10-1.06 1.061l2.5 2.5a.75.75 0 001.137-.089l4-5.5z"
              clipRule="evenodd"
            />
          </svg>
          You're going!
        </p>
      )}

      {isWaitlisted && (
        <p className="text-xs text-mink flex items-center gap-1.5">
          <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M12 6v6h4.5m4.5 0a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          You're on the waitlist.
        </p>
      )}

      {error && (
        <p className="text-xs text-rose bg-rose/10 rounded-lg px-3 py-2">{error}</p>
      )}
    </div>
  )
}
