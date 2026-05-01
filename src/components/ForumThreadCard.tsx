import Image from 'next/image'
import Link from 'next/link'
import { ForumThreadWithAuthor, ForumBoard } from '@/lib/types'
import { getInitials, formatRelativeTime, formatShortDate } from '@/lib/utils'

interface ForumThreadCardProps {
  thread: ForumThreadWithAuthor
}

const BOARD_LABELS: Record<ForumBoard, string> = {
  general: 'General',
  events: 'Events',
  announcements: 'Announcements',
  introductions: 'Introductions',
  recommendations: 'Recommendations',
}

function PinIcon() {
  return (
    <svg className="h-3.5 w-3.5" viewBox="0 0 20 20" fill="currentColor">
      <path d="M9.828.722a.5.5 0 01.354 0l7 2.5a.5.5 0 010 .95L10 6.686 2.818 4.172a.5.5 0 010-.95l7-2.5zM10 7.737L3 5.387v1.586L10 9.32l7-2.346V5.387L10 7.737zM3 8.586v1.586L10 12.5l7-2.328V8.586L10 10.913 3 8.586z" />
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

function ReplyIcon() {
  return (
    <svg className="h-3.5 w-3.5" viewBox="0 0 20 20" fill="currentColor">
      <path
        fillRule="evenodd"
        d="M10 3a6 6 0 00-6 6v2.172l1.586-1.586a.75.75 0 111.06 1.06l-3 3a.75.75 0 01-1.06 0l-3-3a.75.75 0 111.06-1.06L2 11.172V9A8 8 0 0118 9a.75.75 0 01-1.5 0 6.5 6.5 0 00-6.5-6z"
        clipRule="evenodd"
      />
    </svg>
  )
}

export default function ForumThreadCard({ thread }: ForumThreadCardProps) {
  const { author } = thread
  const initials = getInitials(author.username)
  const boardLabel = BOARD_LABELS[thread.board]
  const lastActivity = thread.last_reply_at
    ? formatRelativeTime(thread.last_reply_at)
    : formatShortDate(thread.created_at)

  return (
    <div className="group flex items-start gap-4 px-4 py-3.5 hover:bg-ivory transition-colors border-b border-cream last:border-b-0">
      <div className="shrink-0 mt-0.5">
        {author.avatar_url ? (
          <Image
            src={author.avatar_url}
            alt={author.username}
            width={36}
            height={36}
            className="h-9 w-9 rounded-full object-cover"
          />
        ) : (
          <div className="flex h-9 w-9 items-center justify-center rounded-full bg-forest text-ivory text-xs font-semibold font-serif">
            {initials}
          </div>
        )}
      </div>

      <div className="min-w-0 flex-1">
        <div className="flex items-start justify-between gap-2">
          <div className="min-w-0 flex-1">
            <div className="flex items-center gap-2 flex-wrap mb-1">
              {thread.is_pinned && (
                <span className="inline-flex items-center gap-1 text-xs font-medium text-blush">
                  <PinIcon />
                  Pinned
                </span>
              )}
              {thread.is_locked && (
                <span className="inline-flex items-center gap-1 text-xs font-medium text-mink">
                  <LockIcon />
                  Locked
                </span>
              )}
              <span className="inline-block rounded-full bg-cream px-2 py-0.5 text-xs font-medium text-forest">
                {boardLabel}
              </span>
            </div>

            <Link
              href={`/forum/${thread.board}/${thread.id}`}
              className="block font-serif text-base font-semibold text-forest leading-snug group-hover:text-forest-deep transition-colors line-clamp-2"
            >
              {thread.title}
            </Link>
          </div>
        </div>

        <div className="mt-1.5 flex items-center gap-3 text-xs text-mink flex-wrap">
          <span>@{author.username}</span>
          <span className="text-cream">·</span>
          <span className="inline-flex items-center gap-1">
            <ReplyIcon />
            {thread.reply_count} {thread.reply_count === 1 ? 'reply' : 'replies'}
          </span>
          <span className="text-cream">·</span>
          <span>{lastActivity}</span>
        </div>
      </div>
    </div>
  )
}
