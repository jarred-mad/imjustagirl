import type { Metadata } from 'next'
import Link from 'next/link'
import { createClient } from '@/lib/supabase-server'
import type { ForumBoard, ForumThreadWithAuthor } from '@/lib/types'
import { formatRelativeTime } from '@/lib/utils'
import Navbar from '@/components/Navbar'
import Footer from '@/components/Footer'
import ForumThreadCard from '@/components/ForumThreadCard'

export const metadata: Metadata = {
  title: 'Forum',
  description:
    'IMJUSTAGIRL. Social Club member forum — connect, share, and discuss with the community.',
}

interface BoardMeta {
  board: ForumBoard
  label: string
  description: string
}

const BOARDS: BoardMeta[] = [
  {
    board: 'general',
    label: 'General',
    description: 'Open conversation for anything on your mind.',
  },
  {
    board: 'events',
    label: 'Events',
    description: 'Discuss upcoming and past club events.',
  },
  {
    board: 'announcements',
    label: 'Announcements',
    description: 'Official updates from the IMJUSTAGIRL. team.',
  },
  {
    board: 'introductions',
    label: 'Introductions',
    description: 'New here? Say hello and tell us about yourself.',
  },
  {
    board: 'recommendations',
    label: 'Recommendations',
    description: 'Restaurants, books, services — share what you love.',
  },
]

interface BoardStat {
  board: ForumBoard
  thread_count: number
  last_activity: string | null
}

async function getBoardStats(): Promise<Map<ForumBoard, BoardStat>> {
  const supabase = await createClient()

  const results = await Promise.all(
    BOARDS.map(async ({ board }) => {
      const { count } = await supabase
        .from('forum_threads')
        .select('id', { count: 'exact', head: true })
        .eq('board', board)

      const { data: latest } = await supabase
        .from('forum_threads')
        .select('last_reply_at, created_at')
        .eq('board', board)
        .order('last_reply_at', { ascending: false })
        .limit(1)
        .maybeSingle()

      return {
        board,
        thread_count: count ?? 0,
        last_activity: latest?.last_reply_at ?? latest?.created_at ?? null,
      }
    })
  )

  return new Map(results.map((r) => [r.board, r]))
}

async function getRecentThreads(): Promise<ForumThreadWithAuthor[]> {
  const supabase = await createClient()

  const { data, error } = await supabase
    .from('forum_threads')
    .select(
      'id, board, title, body, author_id, is_pinned, is_locked, reply_count, last_reply_at, created_at, updated_at, author:profiles!forum_threads_author_id_fkey(id, username, avatar_url, tier)'
    )
    .order('last_reply_at', { ascending: false })
    .limit(10)

  if (error) {
    console.error('[ForumPage] failed to fetch threads:', error.message)
    return []
  }

  return (data ?? []).map((t) => ({
    ...t,
    author: Array.isArray(t.author) ? t.author[0] : t.author,
  })) as ForumThreadWithAuthor[]
}

function BoardCard({ meta, stat }: { meta: BoardMeta; stat: BoardStat | undefined }) {
  return (
    <Link
      href={`/forum/${meta.board}`}
      className="card block p-5 hover:shadow-md transition-shadow duration-200 group"
    >
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0 flex-1">
          <h2 className="font-serif text-lg text-forest group-hover:text-forest-deep transition-colors">
            {meta.label}
          </h2>
          <p className="text-sm text-mink mt-1 leading-relaxed">{meta.description}</p>
        </div>
        <svg
          className="w-4 h-4 text-mink/50 shrink-0 mt-1 group-hover:text-forest transition-colors"
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
          strokeWidth={2}
        >
          <path strokeLinecap="round" strokeLinejoin="round" d="M8.25 4.5l7.5 7.5-7.5 7.5" />
        </svg>
      </div>
      <div className="mt-4 pt-4 border-t border-cream flex items-center justify-between text-xs text-mink">
        <span>
          {stat?.thread_count ?? 0} thread{(stat?.thread_count ?? 0) !== 1 ? 's' : ''}
        </span>
        {stat?.last_activity && (
          <span>Active {formatRelativeTime(stat.last_activity)}</span>
        )}
      </div>
    </Link>
  )
}

export default async function ForumPage() {
  const [boardStats, recentThreads] = await Promise.all([
    getBoardStats(),
    getRecentThreads(),
  ])

  return (
    <>
      <Navbar />

      {/* Page header */}
      <section className="bg-cream border-b border-cream/60 py-14 md:py-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <p className="label text-mink mb-3">Community</p>
          <div className="flex items-end justify-between gap-4">
            <h1 className="section-heading">Forum</h1>
            <Link href="/forum/new" className="btn-primary text-sm px-5 py-2.5">
              New Thread
            </Link>
          </div>
          <p className="mt-4 text-mink font-sans text-base max-w-xl leading-relaxed">
            A space for honest conversation, recommendations, event talk, and
            everything in between.
          </p>
        </div>
      </section>

      {/* Board grid */}
      <section className="bg-ivory py-12 md:py-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <h2 className="font-serif text-xl text-forest mb-6">Boards</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {BOARDS.map((meta) => (
              <BoardCard key={meta.board} meta={meta} stat={boardStats.get(meta.board)} />
            ))}
          </div>
        </div>
      </section>

      {/* Recent threads */}
      <section className="bg-white border-t border-cream py-12 md:py-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <h2 className="font-serif text-xl text-forest mb-6">Recent Threads</h2>

          {recentThreads.length > 0 ? (
            <div className="card divide-y-0">
              {recentThreads.map((thread) => (
                <ForumThreadCard key={thread.id} thread={thread} />
              ))}
            </div>
          ) : (
            <div className="text-center py-16">
              <p className="font-serif text-lg text-forest mb-1">No threads yet</p>
              <p className="text-sm text-mink">Be the first to start a conversation.</p>
            </div>
          )}
        </div>
      </section>

      <Footer />
    </>
  )
}
