'use client'

import { useState, useEffect, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase'
import { slugify } from '@/lib/utils'
import { Event, EventStatus } from '@/lib/types'
import Link from 'next/link'

export default function AdminEditEventPage({ params }: { params: { id: string } }) {
  const router = useRouter()
  const { id } = params

  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [deleting, setDeleting] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [notFound, setNotFound] = useState(false)

  const [title, setTitle] = useState('')
  const [slug, setSlug] = useState('')
  const [description, setDescription] = useState('')
  const [body, setBody] = useState('')
  const [coverImageUrl, setCoverImageUrl] = useState('')
  const [location, setLocation] = useState('')
  const [locationUrl, setLocationUrl] = useState('')
  const [startsAt, setStartsAt] = useState('')
  const [endsAt, setEndsAt] = useState('')
  const [capacity, setCapacity] = useState('')
  const [priceDollars, setPriceDollars] = useState('')
  const [status, setStatus] = useState<EventStatus>('draft')
  const [isMembersOnly, setIsMembersOnly] = useState(false)
  const [tags, setTags] = useState('')

  // datetime-local inputs expect "YYYY-MM-DDTHH:mm" format (no seconds/tz)
  function toDatetimeLocal(isoString: string | null): string {
    if (!isoString) return ''
    return isoString.slice(0, 16)
  }

  const loadEvent = useCallback(async () => {
    const supabase = createClient()
    const { data, error: fetchError } = await supabase
      .from('events')
      .select(
        'id, title, slug, description, body, cover_image_url, location, location_url, starts_at, ends_at, capacity, price_cents, status, is_members_only, tags'
      )
      .eq('id', id)
      .single()

    setLoading(false)

    if (fetchError || !data) {
      setNotFound(true)
      return
    }

    const event = data as Event
    setTitle(event.title)
    setSlug(event.slug)
    setDescription(event.description ?? '')
    setBody(event.body ?? '')
    setCoverImageUrl(event.cover_image_url ?? '')
    setLocation(event.location ?? '')
    setLocationUrl(event.location_url ?? '')
    setStartsAt(toDatetimeLocal(event.starts_at))
    setEndsAt(toDatetimeLocal(event.ends_at))
    setCapacity(event.capacity != null ? String(event.capacity) : '')
    setPriceDollars(event.price_cents > 0 ? String(event.price_cents / 100) : '')
    setStatus(event.status)
    setIsMembersOnly(event.is_members_only)
    setTags(event.tags?.join(', ') ?? '')
  }, [id])

  useEffect(() => {
    loadEvent()
  }, [loadEvent])

  function handleTitleChange(value: string) {
    setTitle(value)
    setSlug(slugify(value))
  }

  async function handleSubmit(submitStatus: EventStatus) {
    setError(null)
    setSaving(true)

    const supabase = createClient()
    const priceCents = priceDollars ? Math.round(parseFloat(priceDollars) * 100) : 0
    const parsedCapacity = capacity ? parseInt(capacity, 10) : null
    const parsedTags = tags
      ? tags
          .split(',')
          .map((t) => t.trim())
          .filter(Boolean)
      : []

    const { error: updateError } = await supabase
      .from('events')
      .update({
        title: title.trim(),
        slug: slug.trim(),
        description: description.trim() || null,
        body: body.trim() || null,
        cover_image_url: coverImageUrl.trim() || null,
        location: location.trim() || null,
        location_url: locationUrl.trim() || null,
        starts_at: startsAt,
        ends_at: endsAt || null,
        capacity: parsedCapacity,
        price_cents: priceCents,
        status: submitStatus,
        is_members_only: isMembersOnly,
        tags: parsedTags,
        updated_at: new Date().toISOString(),
      })
      .eq('id', id)

    setSaving(false)

    if (updateError) {
      setError(updateError.message)
      return
    }

    router.push('/admin/events')
  }

  async function handleDelete() {
    if (!confirm('Delete this event? This cannot be undone.')) return
    setDeleting(true)
    setError(null)

    const supabase = createClient()
    const { error: deleteError } = await supabase.from('events').delete().eq('id', id)

    setDeleting(false)

    if (deleteError) {
      setError(deleteError.message)
      return
    }

    router.push('/admin/events')
  }

  if (loading) {
    return (
      <div className="p-8 flex items-center justify-center min-h-64">
        <p className="text-mink text-sm">Loading event…</p>
      </div>
    )
  }

  if (notFound) {
    return (
      <div className="p-8 flex flex-col items-center justify-center min-h-64 gap-4">
        <p className="text-forest font-serif text-xl">Event not found.</p>
        <Link href="/admin/events" className="btn-secondary text-sm">
          Back to Events
        </Link>
      </div>
    )
  }

  return (
    <div className="p-8">
      {/* Page header */}
      <div className="bg-white rounded-2xl border border-cream px-8 py-6 mb-8 flex items-center gap-4">
        <Link
          href="/admin/events"
          className="text-sm text-mink hover:text-forest transition-colors"
        >
          ← Events
        </Link>
        <h1 className="font-serif text-3xl text-forest font-semibold">Edit Event</h1>
      </div>

      {error && (
        <div className="mb-6 rounded-xl bg-red-50 border border-red-200 px-5 py-4 text-sm text-red-700">
          {error}
        </div>
      )}

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        {/* Main fields */}
        <div className="lg:col-span-2 space-y-6">
          <div className="card p-6 space-y-5">
            <h2 className="font-serif text-lg text-forest font-semibold">Event Details</h2>

            <div>
              <label className="label" htmlFor="title">
                Title
              </label>
              <input
                id="title"
                type="text"
                className="input"
                placeholder="An Evening in the Garden"
                value={title}
                onChange={(e) => handleTitleChange(e.target.value)}
              />
            </div>

            <div>
              <label className="label" htmlFor="slug">
                Slug
              </label>
              <input
                id="slug"
                type="text"
                className="input font-mono text-xs"
                placeholder="an-evening-in-the-garden"
                value={slug}
                onChange={(e) => setSlug(e.target.value)}
              />
              <p className="mt-1.5 text-xs text-mink/70">
                URL: /events/{slug || 'your-event-slug'}
              </p>
            </div>

            <div>
              <label className="label" htmlFor="description">
                Short Description
              </label>
              <textarea
                id="description"
                rows={3}
                className="input resize-none"
                placeholder="A brief summary shown in listings and previews."
                value={description}
                onChange={(e) => setDescription(e.target.value)}
              />
            </div>

            <div>
              <label className="label" htmlFor="body">
                Full Description
              </label>
              <textarea
                id="body"
                rows={6}
                className="input resize-y"
                placeholder="Full event details, schedule, what to expect..."
                value={body}
                onChange={(e) => setBody(e.target.value)}
              />
            </div>

            <div>
              <label className="label" htmlFor="cover-image-url">
                Cover Image URL
              </label>
              <input
                id="cover-image-url"
                type="url"
                className="input"
                placeholder="https://..."
                value={coverImageUrl}
                onChange={(e) => setCoverImageUrl(e.target.value)}
              />
              {coverImageUrl && (
                <div className="mt-3 rounded-xl overflow-hidden border border-cream h-40 bg-cream">
                  <img
                    src={coverImageUrl}
                    alt="Cover preview"
                    className="w-full h-full object-cover"
                    onError={(e) => {
                      ;(e.currentTarget as HTMLImageElement).style.display = 'none'
                    }}
                  />
                </div>
              )}
            </div>
          </div>

          <div className="card p-6 space-y-5">
            <h2 className="font-serif text-lg text-forest font-semibold">Location & Time</h2>

            <div className="grid grid-cols-1 gap-5 sm:grid-cols-2">
              <div>
                <label className="label" htmlFor="location">
                  Location
                </label>
                <input
                  id="location"
                  type="text"
                  className="input"
                  placeholder="The Garden Room, NYC"
                  value={location}
                  onChange={(e) => setLocation(e.target.value)}
                />
              </div>

              <div>
                <label className="label" htmlFor="location-url">
                  Location URL
                </label>
                <input
                  id="location-url"
                  type="url"
                  className="input"
                  placeholder="https://maps.google.com/..."
                  value={locationUrl}
                  onChange={(e) => setLocationUrl(e.target.value)}
                />
              </div>
            </div>

            <div className="grid grid-cols-1 gap-5 sm:grid-cols-2">
              <div>
                <label className="label" htmlFor="starts-at">
                  Starts At
                </label>
                <input
                  id="starts-at"
                  type="datetime-local"
                  className="input"
                  value={startsAt}
                  onChange={(e) => setStartsAt(e.target.value)}
                  required
                />
              </div>

              <div>
                <label className="label" htmlFor="ends-at">
                  Ends At <span className="normal-case text-mink/50">(optional)</span>
                </label>
                <input
                  id="ends-at"
                  type="datetime-local"
                  className="input"
                  value={endsAt}
                  onChange={(e) => setEndsAt(e.target.value)}
                />
              </div>
            </div>
          </div>
        </div>

        {/* Sidebar fields */}
        <div className="space-y-6">
          <div className="card p-6 space-y-5">
            <h2 className="font-serif text-lg text-forest font-semibold">Publishing</h2>

            <div>
              <label className="label" htmlFor="status">
                Status
              </label>
              <select
                id="status"
                className="input"
                value={status}
                onChange={(e) => setStatus(e.target.value as EventStatus)}
              >
                <option value="draft">Draft</option>
                <option value="published">Published</option>
                <option value="cancelled">Cancelled</option>
                <option value="sold_out">Sold Out</option>
              </select>
            </div>

            <div className="flex items-center gap-3">
              <input
                id="members-only"
                type="checkbox"
                className="h-4 w-4 rounded border-mink/30 text-forest focus:ring-forest/20"
                checked={isMembersOnly}
                onChange={(e) => setIsMembersOnly(e.target.checked)}
              />
              <label htmlFor="members-only" className="text-sm font-medium text-forest cursor-pointer">
                Members only
              </label>
            </div>

            <div className="flex gap-3 pt-2">
              <button
                type="button"
                disabled={saving || !title || !startsAt}
                onClick={() => handleSubmit('draft')}
                className="btn-secondary flex-1 text-center"
              >
                {saving ? 'Saving…' : 'Save Draft'}
              </button>
              <button
                type="button"
                disabled={saving || !title || !startsAt}
                onClick={() => handleSubmit('published')}
                className="btn-primary flex-1 text-center"
              >
                {saving ? 'Saving…' : 'Publish'}
              </button>
            </div>
          </div>

          <div className="card p-6 space-y-5">
            <h2 className="font-serif text-lg text-forest font-semibold">Ticketing</h2>

            <div>
              <label className="label" htmlFor="price">
                Price (USD)
              </label>
              <div className="relative">
                <span className="absolute left-4 top-1/2 -translate-y-1/2 text-mink text-sm">$</span>
                <input
                  id="price"
                  type="number"
                  min="0"
                  step="0.01"
                  className="input pl-8"
                  placeholder="0.00"
                  value={priceDollars}
                  onChange={(e) => setPriceDollars(e.target.value)}
                />
              </div>
              <p className="mt-1.5 text-xs text-mink/70">Leave blank or 0 for free events.</p>
            </div>

            <div>
              <label className="label" htmlFor="capacity">
                Capacity <span className="normal-case text-mink/50">(optional)</span>
              </label>
              <input
                id="capacity"
                type="number"
                min="1"
                className="input"
                placeholder="50"
                value={capacity}
                onChange={(e) => setCapacity(e.target.value)}
              />
            </div>
          </div>

          <div className="card p-6 space-y-5">
            <h2 className="font-serif text-lg text-forest font-semibold">Tags</h2>
            <div>
              <label className="label" htmlFor="tags">
                Tags <span className="normal-case text-mink/50">(comma-separated)</span>
              </label>
              <input
                id="tags"
                type="text"
                className="input"
                placeholder="cocktails, rooftop, summer"
                value={tags}
                onChange={(e) => setTags(e.target.value)}
              />
            </div>
          </div>

          {/* Danger zone */}
          <div className="card p-6 border-rose/30">
            <h2 className="font-serif text-lg text-rose font-semibold mb-3">Danger Zone</h2>
            <p className="text-xs text-mink mb-4">
              Permanently delete this event. All RSVPs associated with it will also be removed.
              This cannot be undone.
            </p>
            <button
              type="button"
              disabled={deleting}
              onClick={handleDelete}
              className="w-full rounded-xl border border-rose/40 bg-rose/5 px-4 py-2.5 text-sm font-medium text-rose hover:bg-rose hover:text-ivory transition-colors disabled:opacity-50"
            >
              {deleting ? 'Deleting…' : 'Delete Event'}
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
