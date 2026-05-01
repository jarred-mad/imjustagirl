import type { Metadata } from 'next'
import { redirect } from 'next/navigation'
import Link from 'next/link'
import Image from 'next/image'
import { createClient } from '@/lib/supabase-server'
import type { ConversationWithParticipants } from '@/lib/types'
import { getInitials, formatRelativeTime, truncate } from '@/lib/utils'
import Navbar from '@/components/Navbar'
import Footer from '@/components/Footer'

export const metadata: Metadata = { title: 'Messages' }

async function getConversations(userId: string): Promise<ConversationWithParticipants[]> {
  const supabase = await createClient()

  const { data: conversations, error } = await supabase
    .from('conversations')
    .select('id, participant_ids, last_message_at, created_at')
    .contains('participant_ids', [userId])
    .order('last_message_at', { ascending: false })

  if (error || !conversations?.length) return []

  // Collect all participant IDs excluding current user
  const otherIds = [
    ...new Set(
      conversations.flatMap((c) => c.participant_ids.filter((id: string) => id !== userId))
    ),
  ]

  const { data: profiles } = await supabase
    .from('profiles')
    .select('id, username, full_name, avatar_url')
    .in('id', otherIds)

  const profileMap = new Map((profiles ?? []).map((p) => [p.id, p]))

  // Fetch last message preview for each conversation
  const lastMessageResults = await Promise.all(
    conversations.map((c) =>
      supabase
        .from('messages')
        .select('body, created_at')
        .eq('conversation_id', c.id)
        .order('created_at', { ascending: false })
        .limit(1)
        .maybeSingle()
    )
  )

  return conversations.map((c, i) => ({
    ...c,
    participants: c.participant_ids
      .map((id: string) => profileMap.get(id))
      .filter(Boolean) as ConversationWithParticipants['participants'],
    last_message: lastMessageResults[i].data ?? null,
  }))
}

function ConversationRow({
  conversation,
  currentUserId,
  active,
}: {
  conversation: ConversationWithParticipants
  currentUserId: string
  active?: boolean
}) {
  const others = conversation.participants.filter((p) => p.id !== currentUserId)
  const primary = others[0]
  if (!primary) return null

  const displayName = primary.full_name || primary.username
  const initials = getInitials(displayName)
  const preview = conversation.last_message?.body
    ? truncate(conversation.last_message.body, 52)
    : 'No messages yet'
  const time = conversation.last_message_at
    ? formatRelativeTime(conversation.last_message_at)
    : ''

  return (
    <Link
      href={`/messages/${conversation.id}`}
      className={`flex items-center gap-3 px-4 py-3.5 hover:bg-ivory transition-colors border-b border-cream last:border-b-0 ${
        active ? 'bg-ivory border-l-2 border-l-forest' : ''
      }`}
    >
      {primary.avatar_url ? (
        <Image
          src={primary.avatar_url}
          alt={displayName}
          width={40}
          height={40}
          className="h-10 w-10 rounded-full object-cover shrink-0"
        />
      ) : (
        <div className="flex h-10 w-10 items-center justify-center rounded-full bg-forest text-ivory text-xs font-semibold font-serif shrink-0">
          {initials}
        </div>
      )}
      <div className="min-w-0 flex-1">
        <div className="flex items-baseline justify-between gap-2">
          <p className="text-sm font-semibold text-forest truncate">{displayName}</p>
          {time && <span className="text-[11px] text-mink shrink-0">{time}</span>}
        </div>
        <p className="text-xs text-mink truncate mt-0.5">{preview}</p>
      </div>
    </Link>
  )
}

export default async function MessagesPage() {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) redirect('/login')

  const conversations = await getConversations(user.id)

  return (
    <>
      <Navbar />

      <div className="min-h-[calc(100vh-4rem)] bg-ivory">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="flex items-center justify-between mb-6">
            <h1 className="font-serif text-2xl text-forest">Messages</h1>
            <button className="btn-primary text-sm px-5 py-2.5">New Message</button>
          </div>

          <div className="flex gap-0 bg-white rounded-2xl border border-cream shadow-sm overflow-hidden min-h-[600px]">
            {/* Sidebar */}
            <aside className="w-full md:w-80 lg:w-96 border-r border-cream shrink-0 flex flex-col">
              <div className="px-4 py-3 border-b border-cream">
                <p className="text-xs text-mink uppercase tracking-wider font-medium">
                  {conversations.length} conversation{conversations.length !== 1 ? 's' : ''}
                </p>
              </div>

              {conversations.length > 0 ? (
                <div className="flex-1 overflow-y-auto">
                  {conversations.map((c) => (
                    <ConversationRow key={c.id} conversation={c} currentUserId={user.id} />
                  ))}
                </div>
              ) : (
                <div className="flex-1 flex flex-col items-center justify-center px-6 py-16 text-center">
                  <div className="w-12 h-12 rounded-full bg-cream flex items-center justify-center mb-4">
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
                        d="M8.625 12a.375.375 0 11-.75 0 .375.375 0 01.75 0zm0 0H8.25m4.125 0a.375.375 0 11-.75 0 .375.375 0 01.75 0zm0 0H12m4.125 0a.375.375 0 11-.75 0 .375.375 0 01.75 0zm0 0h-.375M21 12c0 4.556-4.03 8.25-9 8.25a9.764 9.764 0 01-2.555-.337A5.972 5.972 0 015.41 20.97a5.969 5.969 0 01-.474-.065 4.48 4.48 0 00.978-2.025c.09-.457-.133-.901-.467-1.226C3.93 16.178 3 14.189 3 12c0-4.556 4.03-8.25 9-8.25s9 3.694 9 8.25z"
                      />
                    </svg>
                  </div>
                  <p className="font-serif text-base text-forest">No conversations yet</p>
                  <p className="text-xs text-mink mt-1">Start a new message to connect.</p>
                </div>
              )}
            </aside>

            {/* Main area — visible on md+ only */}
            <div className="hidden md:flex flex-1 flex-col items-center justify-center text-center px-8">
              <div className="w-16 h-16 rounded-full bg-cream flex items-center justify-center mb-5">
                <svg
                  className="w-7 h-7 text-mink"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                  strokeWidth={1.5}
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    d="M21.75 6.75v10.5a2.25 2.25 0 01-2.25 2.25h-15a2.25 2.25 0 01-2.25-2.25V6.75m19.5 0A2.25 2.25 0 0019.5 4.5h-15a2.25 2.25 0 00-2.25 2.25m19.5 0v.243a2.25 2.25 0 01-1.07 1.916l-7.5 4.615a2.25 2.25 0 01-2.36 0L3.32 8.91a2.25 2.25 0 01-1.07-1.916V6.75"
                  />
                </svg>
              </div>
              <p className="font-serif text-xl text-forest">Select a conversation</p>
              <p className="text-sm text-mink mt-2 max-w-xs leading-relaxed">
                Choose a conversation from the sidebar, or start a new one.
              </p>
            </div>
          </div>
        </div>
      </div>

      <Footer />
    </>
  )
}
