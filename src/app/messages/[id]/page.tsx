import { redirect, notFound } from 'next/navigation'
import Image from 'next/image'
import Link from 'next/link'
import { createClient } from '@/lib/supabase-server'
import type {
  ConversationWithParticipants,
  MessageWithSender,
} from '@/lib/types'
import { getInitials, formatRelativeTime, truncate } from '@/lib/utils'
import Navbar from '@/components/Navbar'
import Footer from '@/components/Footer'
import MessageThread from '@/components/MessageThread'

async function getConversationSidebar(
  userId: string
): Promise<ConversationWithParticipants[]> {
  const supabase = await createClient()

  const { data: conversations } = await supabase
    .from('conversations')
    .select('id, participant_ids, last_message_at, created_at')
    .contains('participant_ids', [userId])
    .order('last_message_at', { ascending: false })

  if (!conversations?.length) return []

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

  const lastMessages = await Promise.all(
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
    last_message: lastMessages[i].data ?? null,
  }))
}

function ConversationRow({
  conversation,
  currentUserId,
  active,
}: {
  conversation: ConversationWithParticipants
  currentUserId: string
  active: boolean
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

export default async function ConversationPage({
  params,
}: {
  params: { id: string }
}) {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) redirect('/login')

  // Fetch this specific conversation — verify user is a participant
  const { data: conversation } = await supabase
    .from('conversations')
    .select('id, participant_ids, last_message_at, created_at')
    .eq('id', params.id)
    .contains('participant_ids', [user.id])
    .maybeSingle()

  if (!conversation) notFound()

  // Fetch all participant profiles
  const { data: participantProfiles } = await supabase
    .from('profiles')
    .select('id, username, full_name, avatar_url')
    .in('id', conversation.participant_ids)

  // Fetch messages with sender profile join
  const { data: rawMessages } = await supabase
    .from('messages')
    .select(
      'id, conversation_id, sender_id, body, status, created_at, sender:profiles!messages_sender_id_fkey(id, username, avatar_url)'
    )
    .eq('conversation_id', conversation.id)
    .order('created_at', { ascending: true })

  const messages: MessageWithSender[] = (rawMessages ?? []).map((m) => ({
    id: m.id,
    conversation_id: m.conversation_id,
    sender_id: m.sender_id,
    body: m.body,
    status: m.status,
    created_at: m.created_at,
    sender: Array.isArray(m.sender) ? m.sender[0] : m.sender,
  }))

  const conversationWithParticipants: ConversationWithParticipants = {
    ...conversation,
    participants: participantProfiles ?? [],
  }

  // Sidebar conversations
  const sidebarConversations = await getConversationSidebar(user.id)

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
            <aside className="hidden md:flex w-80 lg:w-96 border-r border-cream shrink-0 flex-col">
              <div className="px-4 py-3 border-b border-cream">
                <p className="text-xs text-mink uppercase tracking-wider font-medium">
                  {sidebarConversations.length} conversation
                  {sidebarConversations.length !== 1 ? 's' : ''}
                </p>
              </div>
              <div className="flex-1 overflow-y-auto">
                {sidebarConversations.map((c) => (
                  <ConversationRow
                    key={c.id}
                    conversation={c}
                    currentUserId={user.id}
                    active={c.id === params.id}
                  />
                ))}
              </div>
            </aside>

            {/* Thread */}
            <div className="flex-1 flex flex-col min-h-0 min-w-0">
              {/* Mobile back link */}
              <div className="md:hidden px-4 py-3 border-b border-cream">
                <Link
                  href="/messages"
                  className="inline-flex items-center gap-1.5 text-sm text-forest hover:text-forest-deep transition-colors"
                >
                  <svg
                    className="w-4 h-4"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                    strokeWidth={2}
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      d="M15.75 19.5L8.25 12l7.5-7.5"
                    />
                  </svg>
                  All Messages
                </Link>
              </div>

              <MessageThread
                conversation={conversationWithParticipants}
                messages={messages}
                currentUserId={user.id}
              />
            </div>
          </div>
        </div>
      </div>

      <Footer />
    </>
  )
}
