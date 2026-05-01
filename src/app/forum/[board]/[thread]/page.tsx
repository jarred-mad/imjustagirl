import { notFound } from 'next/navigation'
import type { Metadata } from 'next'
import Image from 'next/image'
import Link from 'next/link'
import { createClient } from '@/lib/supabase-server'
import type {
  ForumBoard,
  ForumThreadWithAuthor,
  ForumReplyWithAuthor,
} from '@/lib/types'
import { getInitials, formatDate, formatRelativeTime, truncate } from '@/lib/utils'
import Navbar from '@/components/Navbar'
import Footer from '@/components/Footer'
import ReplyForm from './_reply-form'

const BOARD_LABELS: Record<ForumBoard, string> = {
  general: 'General',
  events: 'Events',
  announcements: 'Announcements',
  introductions: 'Introductions',
  recommendations: 'Recommendations',
}

const VALID_BOARDS = Object.keys(BOARD_LABELS) as ForumBoard[]

function isValidBoard(value: string): value is ForumBoard {
  return VALID_BOARDS.includes(value as ForumBoard)
}

async function getThread(id: string): Promise<ForumThreadWithAuthor | null> {
  const supabase = await createClient()

  const { data, error } = await supabase
    .from('forum_threads')
    .select(
      'id, board, title, body, author_id, is_pinned, is_locked, reply_count, last_reply_at, created_at, updated_at, author:profiles!forum_threads_author_id_fkey(id, username, avatar_url, tier)'
    )
    .eq('id', id)
    .maybeSingle()

  if (error || !data) return null

  return {
    ...data,
    author: Array.isArray(data.author) ? data.author[0] : data.author,
  } as ForumThreadWithAuthor
}

async function getReplies(threadId: string): Promise<ForumReplyWithAuthor[]> {
  const supabase = await createClient()

  const { data, error } = await supabase
    .from('forum_replies')
    .select(
      'id, thread_id, author_id, body, is_edited, created_at, updated_at, author:profiles!forum_replies_author_id_fkey(id, username, avatar_url, tier)'
    )
    .eq('thread_id', threadId)
    .order('created_at', { ascending: true })

  if (error) {
    console.error('[ForumThreadPage] failed to fetch replies:', error.message)
    return []
  }

  return (data ?? []).map((r) => ({
    ...r,
    author: Array.isArray(r.author) ? r.author[0] : r.author,
  })) as ForumReplyWithAuthor[]
}

function AuthorAvatar({
  avatarUrl,
  username,
  size = 'md',
}: {
  avatarUrl: string | null
  username: string
  size?: 'sm' | 'md'
}) {
  const dim = size === 'sm' ? 32 : 40
  const cls =
    size === 'sm'
      ? 'h-8 w-8 rounded-full object-cover shrink-0'
      : 'h-10 w-10 rounded-full object-cover shrink-0'
  const initCls =
    size === 'sm'
      ? 'flex h-8 w-8 items-center justify-center rounded-full bg-forest text-ivory text-xs font-semibold font-serif shrink-0'
      : 'flex h-10 w-10 items-center justify-center rounded-full bg-forest text-ivory text-sm font-semibold font-serif shrink-0'

  if (avatarUrl) {
    return (
      <Image src={avatarUrl} alt={username} width={dim} height={dim} className={cls} />
    )
  }
  return <div className={initCls}>{getInitials(username)}</div>
}

export async function generateMetadata({
  params,
}: {
  params: { board: string; thread: string }
}): Promise<Metadata> {
  const thread = await getThread(params.thread)
  if (!thread) return { title: 'Thread Not Found' }
  return { title: `${thread.title} — Forum` }
}

export default async function ForumThreadPage({
  params,
}: {
  params: { board: string; thread: string }
}) {
  if (!isValidBoard(params.board)) notFound()

  const [thread, replies] = await Promise.all([
    getThread(params.thread),
    getReplies(params.thread),
  ])

  if (!thread) notFound()

  const boardLabel = BOARD_LABELS[params.board as ForumBoard]

  return (
    <>
      <Navbar />

      <div className="bg-cream border-b border-cream/60 py-8">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          {/* Breadcrumb */}
          <nav className="flex items-center gap-2 text-sm text-mink mb-4">
            <Link href="/forum" className="hover:text-forest transition-colors">
              Forum
            </Link>
            <svg
              className="w-3 h-3 shrink-0"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
              strokeWidth={2.5}
            >
              <path strokeLinecap="round" strokeLinejoin="round" d="M8.25 4.5l7.5 7.5-7.5 7.5" />
            </svg>
            <Link
              href={`/forum/${params.board}`}
              className="hover:text-forest transition-colors"
            >
              {boardLabel}
            </Link>
            <svg
              className="w-3 h-3 shrink-0"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
              strokeWidth={2.5}
            >
              <path strokeLinecap="round" strokeLinejoin="round" d="M8.25 4.5l7.5 7.5-7.5 7.5" />
            </svg>
            <span className="text-forest font-medium truncate max-w-[200px]">
              {truncate(thread.title, 40)}
            </span>
          </nav>

          {/* Thread header */}
          <div className="flex items-start gap-1 flex-wrap mb-3">
            {thread.is_pinned && (
              <span className="inline-flex items-center gap-1 text-xs font-medium text-blush bg-blush/10 px-2.5 py-1 rounded-full">
                Pinned
              </span>
            )}
            {thread.is_locked && (
              <span className="inline-flex items-center gap-1 text-xs font-medium text-mink bg-mink/10 px-2.5 py-1 rounded-full">
                Locked
              </span>
            )}
          </div>
          <h1 className="font-serif text-2xl md:text-3xl text-forest leading-snug">
            {thread.title}
          </h1>
        </div>
      </div>

      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-10 space-y-8">
        {/* Original post */}
        <article className="card p-6 md:p-8">
          <div className="flex items-center gap-3 mb-5">
            <AuthorAvatar
              avatarUrl={thread.author.avatar_url}
              username={thread.author.username}
            />
            <div>
              <p className="text-sm font-semibold text-forest">
                @{thread.author.username}
              </p>
              <p className="text-xs text-mink mt-0.5">
                {formatDate(thread.created_at)}
              </p>
            </div>
            {thread.author.tier === 'founding' && (
              <span className="ml-auto text-xs font-medium bg-forest/10 text-forest px-2.5 py-1 rounded-full">
                Founding Member
              </span>
            )}
          </div>
          <div className="prose prose-sm max-w-none text-forest/90 leading-relaxed whitespace-pre-wrap">
            {thread.body}
          </div>
        </article>

        {/* Replies */}
        {replies.length > 0 && (
          <section>
            <p className="label text-mink mb-4">
              {replies.length} {replies.length === 1 ? 'Reply' : 'Replies'}
            </p>
            <div className="space-y-4">
              {replies.map((reply) => (
                <div key={reply.id} className="card p-5 md:p-6">
                  <div className="flex items-center gap-3 mb-4">
                    <AuthorAvatar
                      avatarUrl={reply.author.avatar_url}
                      username={reply.author.username}
                      size="sm"
                    />
                    <div className="min-w-0 flex-1">
                      <p className="text-sm font-semibold text-forest">
                        @{reply.author.username}
                      </p>
                      <p className="text-xs text-mink mt-0.5">
                        {formatRelativeTime(reply.created_at)}
                        {reply.is_edited && (
                          <span className="ml-1.5 text-mink/60">(edited)</span>
                        )}
                      </p>
                    </div>
                    {reply.author.tier === 'founding' && (
                      <span className="text-xs font-medium bg-forest/10 text-forest px-2.5 py-1 rounded-full shrink-0">
                        Founding
                      </span>
                    )}
                  </div>
                  <p className="text-sm text-forest/90 leading-relaxed whitespace-pre-wrap">
                    {reply.body}
                  </p>
                </div>
              ))}
            </div>
          </section>
        )}

        {/* Reply form */}
        <section>
          <h2 className="font-serif text-lg text-forest mb-4">
            {thread.is_locked ? 'Thread Locked' : 'Leave a Reply'}
          </h2>
          <ReplyForm threadId={thread.id} isLocked={thread.is_locked} />
        </section>
      </div>

      <Footer />
    </>
  )
}
