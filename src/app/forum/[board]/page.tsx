import { notFound } from 'next/navigation'
import type { Metadata } from 'next'
import Link from 'next/link'
import { createClient } from '@/lib/supabase-server'
import type { ForumBoard, ForumThreadWithAuthor } from '@/lib/types'
import Navbar from '@/components/Navbar'
import Footer from '@/components/Footer'
import ForumThreadCard from '@/components/ForumThreadCard'

const BOARD_META: Record<ForumBoard, { label: string; description: string }> = {
  general: {
    label: 'General',
    description: 'Open conversation for anything on your mind.',
  },
  events: {
    label: 'Events',
    description: 'Discuss upcoming and past club events.',
  },
  announcements: {
    label: 'Announcements',
    description: 'Official updates from the IMJUSTAGIRL. team.',
  },
  introductions: {
    label: 'Introductions',
    description: 'New here? Say hello and tell us about yourself.',
  },
  recommendations: {
    label: 'Recommendations',
    description: 'Restaurants, books, services — share what you love.',
  },
}

const VALID_BOARDS = Object.keys(BOARD_META) as ForumBoard[]

function isValidBoard(value: string): value is ForumBoard {
  return VALID_BOARDS.includes(value as ForumBoard)
}

async function getBoardThreads(board: ForumBoard): Promise<ForumThreadWithAuthor[]> {
  const supabase = await createClient()

  const { data, error } = await supabase
    .from('forum_threads')
    .select(
      'id, board, title, body, author_id, is_pinned, is_locked, reply_count, last_reply_at, created_at, updated_at, author:profiles!forum_threads_author_id_fkey(id, username, avatar_url, tier)'
    )
    .eq('board', board)
    .order('is_pinned', { ascending: false })
    .order('last_reply_at', { ascending: false })

  if (error) {
    console.error(`[ForumBoardPage:${board}] failed to fetch threads:`, error.message)
    return []
  }

  return (data ?? []).map((t) => ({
    ...t,
    author: Array.isArray(t.author) ? t.author[0] : t.author,
  })) as ForumThreadWithAuthor[]
}

export async function generateMetadata({
  params,
}: {
  params: { board: string }
}): Promise<Metadata> {
  if (!isValidBoard(params.board)) return { title: 'Forum' }
  const meta = BOARD_META[params.board]
  return {
    title: `${meta.label} — Forum`,
    description: meta.description,
  }
}

export default async function ForumBoardPage({
  params,
}: {
  params: { board: string }
}) {
  if (!isValidBoard(params.board)) notFound()

  const board = params.board
  const meta = BOARD_META[board]
  const threads = await getBoardThreads(board)

  const pinnedThreads = threads.filter((t) => t.is_pinned)
  const regularThreads = threads.filter((t) => !t.is_pinned)

  return (
    <>
      <Navbar />

      {/* Breadcrumb + Header */}
      <section className="bg-cream border-b border-cream/60 py-14 md:py-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <nav className="flex items-center gap-2 text-sm text-mink mb-5">
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
            <span className="text-forest font-medium">{meta.label}</span>
          </nav>

          <div className="flex items-end justify-between gap-4">
            <div>
              <h1 className="section-heading">{meta.label}</h1>
              <p className="mt-3 text-mink font-sans text-base leading-relaxed max-w-xl">
                {meta.description}
              </p>
            </div>
            <Link
              href="/forum/new"
              className="btn-primary text-sm px-5 py-2.5 shrink-0"
            >
              New Thread
            </Link>
          </div>
        </div>
      </section>

      {/* Thread list */}
      <section className="bg-ivory py-12 md:py-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          {threads.length === 0 ? (
            <div className="text-center py-24">
              <div className="w-12 h-12 rounded-full bg-cream flex items-center justify-center mx-auto mb-4">
                <svg
                  className="w-5 h-5 text-mink"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                  strokeWidth={1.5}
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    d="M7.5 8.25h9m-9 3H12m-9.75 1.51c0 1.6 1.123 2.994 2.707 3.227 1.129.166 2.27.293 3.423.379.35.026.67.21.865.501L12 21l2.755-4.133a1.14 1.14 0 01.865-.501 48.172 48.172 0 003.423-.379c1.584-.233 2.707-1.626 2.707-3.228V6.741c0-1.602-1.123-2.995-2.707-3.228A48.394 48.394 0 0012 3c-2.392 0-4.744.175-7.043.513C3.373 3.746 2.25 5.14 2.25 6.741v6.018z"
                  />
                </svg>
              </div>
              <p className="font-serif text-xl text-forest mb-1">No threads yet</p>
              <p className="text-sm text-mink mb-6">
                Be the first to post in {meta.label}.
              </p>
              <Link href="/forum/new" className="btn-primary text-sm px-6 py-2.5">
                Start a Thread
              </Link>
            </div>
          ) : (
            <div className="space-y-8">
              {pinnedThreads.length > 0 && (
                <div>
                  <p className="label text-mink mb-3">Pinned</p>
                  <div className="card divide-y-0">
                    {pinnedThreads.map((thread) => (
                      <ForumThreadCard key={thread.id} thread={thread} />
                    ))}
                  </div>
                </div>
              )}

              {regularThreads.length > 0 && (
                <div>
                  {pinnedThreads.length > 0 && (
                    <p className="label text-mink mb-3">
                      {regularThreads.length} thread{regularThreads.length !== 1 ? 's' : ''}
                    </p>
                  )}
                  <div className="card divide-y-0">
                    {regularThreads.map((thread) => (
                      <ForumThreadCard key={thread.id} thread={thread} />
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      </section>

      <Footer />
    </>
  )
}
