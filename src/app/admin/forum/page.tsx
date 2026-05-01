'use client'

import { useEffect, useState, useCallback } from 'react'
import Image from 'next/image'
import { createClient } from '@/lib/supabase'
import { formatShortDate, getInitials, truncate } from '@/lib/utils'
import type { ForumThreadWithAuthor, ForumBoard } from '@/lib/types'

const BOARD_LABELS: Record<ForumBoard, string> = {
  general: 'General',
  events: 'Events',
  announcements: 'Announcements',
  introductions: 'Introductions',
  recommendations: 'Recommendations',
}

export default function AdminForumPage() {
  const [threads, setThreads] = useState<ForumThreadWithAuthor[]>([])
  const [loading, setLoading] = useState(true)
  const [actionPending, setActionPending] = useState<string | null>(null)

  const supabase = createClient()

  const fetchThreads = useCallback(async () => {
    setLoading(true)
    const { data, error } = await supabase
      .from('forum_threads')
      .select(`
        id, board, title, body, author_id, is_pinned, is_locked,
        reply_count, last_reply_at, created_at, updated_at,
        author:profiles!author_id(id, username, avatar_url, tier)
      `)
      .order('created_at', { ascending: false })

    if (!error && data) setThreads(data as unknown as ForumThreadWithAuthor[])
    setLoading(false)
  }, [])

  useEffect(() => {
    fetchThreads()
  }, [fetchThreads])

  async function handleToggle(
    id: string,
    field: 'is_pinned' | 'is_locked',
    current: boolean
  ) {
    setActionPending(`${id}-${field}`)
    const { error } = await supabase
      .from('forum_threads')
      .update({ [field]: !current })
      .eq('id', id)

    if (!error) {
      setThreads((prev) =>
        prev.map((t) => (t.id === id ? { ...t, [field]: !current } : t))
      )
    }
    setActionPending(null)
  }

  async function handleDelete(id: string) {
    if (!confirm('Delete this thread and all its replies? This cannot be undone.')) return
    setActionPending(`${id}-delete`)
    const { error } = await supabase.from('forum_threads').delete().eq('id', id)
    if (!error) setThreads((prev) => prev.filter((t) => t.id !== id))
    setActionPending(null)
  }

  return (
    <div className="p-8">
      {/* Header */}
      <div className="flex items-center justify-between mb-8">
        <h1 className="font-serif text-3xl text-forest">Forum Moderation</h1>
        <span className="text-sm text-mink">{threads.length} threads</span>
      </div>

      {loading ? (
        <SkeletonRows />
      ) : threads.length === 0 ? (
        <div className="text-center py-20 text-mink">No threads found.</div>
      ) : (
        <div className="card overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-cream text-left">
                <th className="px-4 py-3 label">Thread</th>
                <th className="px-4 py-3 label">Board</th>
                <th className="px-4 py-3 label">Author</th>
                <th className="px-4 py-3 label text-center">Replies</th>
                <th className="px-4 py-3 label">Created</th>
                <th className="px-4 py-3 label text-center">Pinned</th>
                <th className="px-4 py-3 label text-center">Locked</th>
                <th className="px-4 py-3 label">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-cream">
              {threads.map((thread) => (
                <ThreadRow
                  key={thread.id}
                  thread={thread}
                  actionPending={actionPending}
                  onToggle={handleToggle}
                  onDelete={handleDelete}
                />
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  )
}

function ThreadRow({
  thread,
  actionPending,
  onToggle,
  onDelete,
}: {
  thread: ForumThreadWithAuthor
  actionPending: string | null
  onToggle: (id: string, field: 'is_pinned' | 'is_locked', current: boolean) => Promise<void>
  onDelete: (id: string) => Promise<void>
}) {
  const pinBusy = actionPending === `${thread.id}-is_pinned`
  const lockBusy = actionPending === `${thread.id}-is_locked`
  const deleteBusy = actionPending === `${thread.id}-delete`
  const anyBusy = pinBusy || lockBusy || deleteBusy

  return (
    <tr className="hover:bg-cream/30 transition-colors align-middle">
      {/* Title */}
      <td className="px-4 py-3 max-w-xs">
        <span className="font-medium text-forest leading-snug">
          {truncate(thread.title, 60)}
        </span>
      </td>

      {/* Board */}
      <td className="px-4 py-3 whitespace-nowrap">
        <span className="text-xs bg-cream text-forest px-2.5 py-1 rounded-full font-medium">
          {BOARD_LABELS[thread.board]}
        </span>
      </td>

      {/* Author */}
      <td className="px-4 py-3">
        <div className="flex items-center gap-2">
          {thread.author.avatar_url ? (
            <Image
              src={thread.author.avatar_url}
              alt={thread.author.username}
              width={24}
              height={24}
              className="rounded-full object-cover flex-shrink-0"
            />
          ) : (
            <span className="flex h-6 w-6 flex-shrink-0 items-center justify-center rounded-full bg-cream text-[9px] font-semibold text-mink">
              {getInitials(thread.author.username)}
            </span>
          )}
          <span className="text-mink text-xs whitespace-nowrap">
            @{thread.author.username}
          </span>
        </div>
      </td>

      {/* Reply count */}
      <td className="px-4 py-3 text-center text-mink">{thread.reply_count}</td>

      {/* Created */}
      <td className="px-4 py-3 text-mink whitespace-nowrap text-xs">
        {formatShortDate(thread.created_at)}
      </td>

      {/* Pinned toggle */}
      <td className="px-4 py-3 text-center">
        <button
          onClick={() => onToggle(thread.id, 'is_pinned', thread.is_pinned)}
          disabled={anyBusy}
          title={thread.is_pinned ? 'Unpin' : 'Pin'}
          className={`inline-flex items-center justify-center h-7 w-7 rounded-lg transition-colors disabled:opacity-40 ${
            thread.is_pinned
              ? 'bg-forest text-ivory'
              : 'bg-cream text-mink hover:bg-forest/10'
          }`}
        >
          {pinBusy ? (
            <span className="text-[10px]">…</span>
          ) : (
            <PinIcon />
          )}
        </button>
      </td>

      {/* Locked toggle */}
      <td className="px-4 py-3 text-center">
        <button
          onClick={() => onToggle(thread.id, 'is_locked', thread.is_locked)}
          disabled={anyBusy}
          title={thread.is_locked ? 'Unlock' : 'Lock'}
          className={`inline-flex items-center justify-center h-7 w-7 rounded-lg transition-colors disabled:opacity-40 ${
            thread.is_locked
              ? 'bg-rose text-ivory'
              : 'bg-cream text-mink hover:bg-rose/10'
          }`}
        >
          {lockBusy ? (
            <span className="text-[10px]">…</span>
          ) : (
            <LockIcon />
          )}
        </button>
      </td>

      {/* Delete */}
      <td className="px-4 py-3">
        <button
          onClick={() => onDelete(thread.id)}
          disabled={anyBusy}
          className="text-xs font-medium px-3 py-1.5 rounded-lg bg-rose/10 text-rose hover:bg-rose/20 transition-colors disabled:opacity-50"
        >
          {deleteBusy ? '…' : 'Delete'}
        </button>
      </td>
    </tr>
  )
}

function PinIcon() {
  return (
    <svg className="h-3.5 w-3.5" viewBox="0 0 20 20" fill="currentColor">
      <path
        fillRule="evenodd"
        d="M10.707 2.293a1 1 0 00-1.414 0l-7 7a1 1 0 001.414 1.414L4 10.414V17a1 1 0 001 1h2a1 1 0 001-1v-2a1 1 0 011-1h2a1 1 0 011 1v2a1 1 0 001 1h2a1 1 0 001-1v-6.586l.293.293a1 1 0 001.414-1.414l-7-7z"
        clipRule="evenodd"
      />
    </svg>
  )
}

function LockIcon() {
  return (
    <svg className="h-3.5 w-3.5" viewBox="0 0 20 20" fill="currentColor">
      <path
        fillRule="evenodd"
        d="M10 1a4.5 4.5 0 00-4.5 4.5V9H5a2 2 0 00-2 2v6a2 2 0 002 2h10a2 2 0 002-2v-6a2 2 0 00-2-2h-.5V5.5A4.5 4.5 0 0010 1zm3 8V5.5a3 3 0 10-6 0V9h6z"
        clipRule="evenodd"
      />
    </svg>
  )
}

function SkeletonRows() {
  return (
    <div className="card overflow-hidden">
      <table className="w-full text-sm">
        <thead>
          <tr className="border-b border-cream">
            {['Thread', 'Board', 'Author', 'Replies', 'Created', 'Pinned', 'Locked', 'Actions'].map(
              (h) => (
                <th key={h} className="px-4 py-3 label text-left">
                  {h}
                </th>
              )
            )}
          </tr>
        </thead>
        <tbody className="divide-y divide-cream">
          {Array.from({ length: 6 }).map((_, i) => (
            <tr key={i} className="animate-pulse">
              <td className="px-4 py-3"><div className="h-3 w-40 rounded bg-cream" /></td>
              <td className="px-4 py-3"><div className="h-5 w-24 rounded-full bg-cream" /></td>
              <td className="px-4 py-3"><div className="h-3 w-20 rounded bg-cream" /></td>
              <td className="px-4 py-3"><div className="h-3 w-6 rounded bg-cream mx-auto" /></td>
              <td className="px-4 py-3"><div className="h-3 w-20 rounded bg-cream" /></td>
              <td className="px-4 py-3"><div className="h-7 w-7 rounded-lg bg-cream mx-auto" /></td>
              <td className="px-4 py-3"><div className="h-7 w-7 rounded-lg bg-cream mx-auto" /></td>
              <td className="px-4 py-3"><div className="h-7 w-16 rounded-lg bg-cream" /></td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}
