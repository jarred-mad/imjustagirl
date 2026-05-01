'use client'

import { useEffect, useState, useCallback } from 'react'
import Image from 'next/image'
import Link from 'next/link'
import { createClient } from '@/lib/supabase'
import { formatShortDate, getInitials } from '@/lib/utils'
import type { Media, Profile, Event } from '@/lib/types'

interface MediaRow extends Media {
  uploader: Pick<Profile, 'id' | 'username' | 'full_name' | 'avatar_url'> | null
  event: Pick<Event, 'id' | 'title'> | null
}

type FilterTab = 'all' | 'pending' | 'approved'

export default function AdminMediaPage() {
  const [items, setItems] = useState<MediaRow[]>([])
  const [loading, setLoading] = useState(true)
  const [filter, setFilter] = useState<FilterTab>('all')
  const [actionPending, setActionPending] = useState<string | null>(null)

  const supabase = createClient()

  const fetchMedia = useCallback(async () => {
    setLoading(true)

    let query = supabase
      .from('media')
      .select(`
        id, event_id, uploaded_by, media_type, storage_path, public_url,
        caption, width, height, is_approved, created_at,
        uploader:profiles!uploaded_by(id, username, full_name, avatar_url),
        event:events!event_id(id, title)
      `)
      .order('created_at', { ascending: false })

    if (filter === 'pending') query = query.eq('is_approved', false)
    if (filter === 'approved') query = query.eq('is_approved', true)

    const { data, error } = await query

    if (!error && data) {
      setItems(data as unknown as MediaRow[])
    }
    setLoading(false)
  }, [filter])

  useEffect(() => {
    fetchMedia()
  }, [fetchMedia])

  async function handleApprove(id: string) {
    setActionPending(id)
    await supabase.from('media').update({ is_approved: true }).eq('id', id)
    setItems((prev) =>
      prev.map((m) => (m.id === id ? { ...m, is_approved: true } : m))
    )
    setActionPending(null)
  }

  async function handleReject(item: MediaRow) {
    setActionPending(item.id)
    console.log('[storage] would delete:', item.storage_path)
    await supabase.from('media').delete().eq('id', item.id)
    setItems((prev) => prev.filter((m) => m.id !== item.id))
    setActionPending(null)
  }

  const tabs: { key: FilterTab; label: string }[] = [
    { key: 'all', label: 'All' },
    { key: 'pending', label: 'Pending' },
    { key: 'approved', label: 'Approved' },
  ]

  return (
    <div className="p-8">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <h1 className="font-serif text-3xl text-forest">Media</h1>
        <span className="text-sm text-mink">{items.length} items</span>
      </div>

      {/* Filter tabs */}
      <div className="flex gap-1 mb-8 border-b border-cream">
        {tabs.map((tab) => (
          <button
            key={tab.key}
            onClick={() => setFilter(tab.key)}
            className={`px-4 py-2.5 text-sm font-medium transition-colors border-b-2 -mb-px ${
              filter === tab.key
                ? 'border-forest text-forest'
                : 'border-transparent text-mink hover:text-forest'
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Grid */}
      {loading ? (
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
          {Array.from({ length: 8 }).map((_, i) => (
            <div key={i} className="card animate-pulse">
              <div className="aspect-square bg-cream" />
              <div className="p-3 space-y-2">
                <div className="h-3 bg-cream rounded w-3/4" />
                <div className="h-3 bg-cream rounded w-1/2" />
              </div>
            </div>
          ))}
        </div>
      ) : items.length === 0 ? (
        <div className="text-center py-20 text-mink">
          <p className="text-lg">No media found.</p>
        </div>
      ) : (
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
          {items.map((item) => (
            <MediaCard
              key={item.id}
              item={item}
              actionPending={actionPending}
              onApprove={handleApprove}
              onReject={handleReject}
            />
          ))}
        </div>
      )}
    </div>
  )
}

function MediaCard({
  item,
  actionPending,
  onApprove,
  onReject,
}: {
  item: MediaRow
  actionPending: string | null
  onApprove: (id: string) => Promise<void>
  onReject: (item: MediaRow) => Promise<void>
}) {
  const busy = actionPending === item.id

  return (
    <div className="card flex flex-col">
      {/* Thumbnail */}
      <div className="relative aspect-square bg-cream overflow-hidden">
        <Image
          src={item.public_url}
          alt={item.caption ?? 'Media'}
          fill
          className="object-cover"
          sizes="(max-width: 768px) 50vw, (max-width: 1024px) 33vw, 25vw"
        />
        {item.is_approved && (
          <span className="absolute top-2 right-2 bg-forest text-ivory text-[10px] font-medium px-2 py-0.5 rounded-full">
            Approved
          </span>
        )}
        {!item.is_approved && (
          <span className="absolute top-2 right-2 bg-blush text-ivory text-[10px] font-medium px-2 py-0.5 rounded-full">
            Pending
          </span>
        )}
      </div>

      {/* Meta */}
      <div className="flex-1 p-3 space-y-1.5">
        {item.caption && (
          <p className="text-xs text-forest leading-snug line-clamp-2">{item.caption}</p>
        )}

        {item.uploader && (
          <div className="flex items-center gap-1.5">
            {item.uploader.avatar_url ? (
              <Image
                src={item.uploader.avatar_url}
                alt={item.uploader.username}
                width={16}
                height={16}
                className="rounded-full object-cover"
              />
            ) : (
              <span className="flex h-4 w-4 items-center justify-center rounded-full bg-cream text-[8px] font-semibold text-mink">
                {getInitials(item.uploader.full_name ?? item.uploader.username)}
              </span>
            )}
            <span className="text-xs text-mink truncate">@{item.uploader.username}</span>
          </div>
        )}

        {item.event && (
          <p className="text-xs text-mink/70 truncate">{item.event.title}</p>
        )}

        <p className="text-[11px] text-mink/60">{formatShortDate(item.created_at)}</p>
      </div>

      {/* Actions */}
      <div className="border-t border-cream p-3 flex gap-2">
        {!item.is_approved && (
          <button
            onClick={() => onApprove(item.id)}
            disabled={busy}
            className="flex-1 text-xs font-medium py-1.5 rounded-lg bg-forest text-ivory hover:bg-forest-deep transition-colors disabled:opacity-50"
          >
            {busy ? '...' : 'Approve'}
          </button>
        )}
        <button
          onClick={() => onReject(item)}
          disabled={busy}
          className="flex-1 text-xs font-medium py-1.5 rounded-lg bg-rose/10 text-rose hover:bg-rose/20 transition-colors disabled:opacity-50"
        >
          {busy ? '...' : 'Delete'}
        </button>
      </div>
    </div>
  )
}
