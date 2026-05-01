'use client'

import { useEffect, useRef, useState } from 'react'
import Image from 'next/image'
import { ConversationWithParticipants, MessageWithSender } from '@/lib/types'
import { createClient } from '@/lib/supabase'
import { cn, getInitials, formatRelativeTime } from '@/lib/utils'

interface MessageThreadProps {
  conversation: ConversationWithParticipants
  messages: MessageWithSender[]
  currentUserId: string
}

function SendIcon() {
  return (
    <svg className="h-4 w-4" viewBox="0 0 20 20" fill="currentColor">
      <path d="M3.105 2.289a.75.75 0 00-.826.95l1.414 4.925A1.5 1.5 0 005.135 9.25h6.115a.75.75 0 010 1.5H5.135a1.5 1.5 0 00-1.442 1.086l-1.414 4.926a.75.75 0 00.826.95 28.896 28.896 0 0015.293-7.154.75.75 0 000-1.115A28.897 28.897 0 003.105 2.289z" />
    </svg>
  )
}

function AvatarSmall({ avatarUrl, username }: { avatarUrl: string | null; username: string }) {
  if (avatarUrl) {
    return (
      <Image
        src={avatarUrl}
        alt={username}
        width={28}
        height={28}
        className="h-7 w-7 rounded-full object-cover shrink-0"
      />
    )
  }
  return (
    <div className="flex h-7 w-7 items-center justify-center rounded-full bg-forest text-ivory text-xs font-semibold shrink-0">
      {getInitials(username)}
    </div>
  )
}

export default function MessageThread({
  conversation,
  messages: initialMessages,
  currentUserId,
}: MessageThreadProps) {
  const supabase = createClient()
  const [messages, setMessages] = useState<MessageWithSender[]>(initialMessages)
  const [body, setBody] = useState('')
  const [sending, setSending] = useState(false)
  const bottomRef = useRef<HTMLDivElement>(null)

  const otherParticipants = conversation.participants.filter((p) => p.id !== currentUserId)

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

  useEffect(() => {
    const channel = supabase
      .channel(`messages:${conversation.id}`)
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'messages',
          filter: `conversation_id=eq.${conversation.id}`,
        },
        async (payload) => {
          const newMsg = payload.new as { id: string; sender_id: string; body: string; conversation_id: string; status: string; created_at: string }

          // Avoid duplicating optimistically added own messages
          setMessages((prev) => {
            if (prev.some((m) => m.id === newMsg.id)) return prev

            const sender = conversation.participants.find((p) => p.id === newMsg.sender_id) ?? {
              id: newMsg.sender_id,
              username: 'unknown',
              avatar_url: null,
            }

            return [
              ...prev,
              {
                id: newMsg.id,
                conversation_id: newMsg.conversation_id,
                sender_id: newMsg.sender_id,
                body: newMsg.body,
                status: newMsg.status as 'sent' | 'read',
                created_at: newMsg.created_at,
                sender,
              } as MessageWithSender,
            ]
          })
        }
      )
      .subscribe()

    return () => {
      supabase.removeChannel(channel)
    }
  }, [conversation.id, conversation.participants, supabase])

  async function handleSend() {
    const trimmed = body.trim()
    if (!trimmed || sending) return

    const optimisticId = `optimistic-${Date.now()}`
    const currentSender = conversation.participants.find((p) => p.id === currentUserId)

    const optimisticMessage: MessageWithSender = {
      id: optimisticId,
      conversation_id: conversation.id,
      sender_id: currentUserId,
      body: trimmed,
      status: 'sent',
      created_at: new Date().toISOString(),
      sender: {
        id: currentUserId,
        username: currentSender?.username ?? '',
        avatar_url: currentSender?.avatar_url ?? null,
      },
    }

    setMessages((prev) => [...prev, optimisticMessage])
    setBody('')
    setSending(true)

    try {
      const { data, error } = await supabase
        .from('messages')
        .insert({
          conversation_id: conversation.id,
          sender_id: currentUserId,
          body: trimmed,
          status: 'sent',
        })
        .select('id')
        .single()

      if (error) throw error

      // Replace optimistic message with real ID
      setMessages((prev) =>
        prev.map((m) =>
          m.id === optimisticId ? { ...m, id: data.id } : m
        )
      )
    } catch {
      // Remove optimistic message on failure
      setMessages((prev) => prev.filter((m) => m.id !== optimisticId))
      setBody(trimmed)
    } finally {
      setSending(false)
    }
  }

  function handleKeyDown(e: React.KeyboardEvent<HTMLTextAreaElement>) {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      handleSend()
    }
  }

  return (
    <div className="flex flex-col h-full min-h-0">
      {/* Header */}
      <div className="flex items-center gap-3 px-4 py-3 border-b border-cream bg-ivory shrink-0">
        <div className="flex -space-x-1.5">
          {otherParticipants.slice(0, 3).map((p) => (
            <AvatarSmall key={p.id} avatarUrl={p.avatar_url} username={p.username} />
          ))}
        </div>
        <div>
          <p className="text-sm font-semibold text-forest leading-none">
            {otherParticipants.map((p) => p.full_name || p.username).join(', ')}
          </p>
          {otherParticipants.length > 0 && (
            <p className="text-xs text-mink mt-0.5">
              {otherParticipants.map((p) => `@${p.username}`).join(', ')}
            </p>
          )}
        </div>
      </div>

      {/* Message list */}
      <div className="flex-1 overflow-y-auto px-4 py-4 space-y-3 min-h-0">
        {messages.length === 0 && (
          <div className="flex items-center justify-center h-full text-sm text-mink">
            No messages yet. Say hello!
          </div>
        )}
        {messages.map((message) => {
          const isOwn = message.sender_id === currentUserId
          return (
            <div
              key={message.id}
              className={cn('flex items-end gap-2', isOwn ? 'justify-end' : 'justify-start')}
            >
              {!isOwn && (
                <AvatarSmall
                  avatarUrl={message.sender.avatar_url}
                  username={message.sender.username}
                />
              )}
              <div className={cn('flex flex-col gap-1', isOwn ? 'items-end' : 'items-start')}>
                <div
                  className={cn(
                    'max-w-xs px-4 py-2.5 text-sm leading-relaxed whitespace-pre-wrap break-words lg:max-w-sm',
                    isOwn
                      ? 'rounded-2xl rounded-tr-sm bg-forest text-ivory'
                      : 'rounded-2xl rounded-tl-sm border border-mink/20 bg-white text-forest'
                  )}
                >
                  {message.body}
                </div>
                <span className="text-[11px] text-mink px-1">
                  {formatRelativeTime(message.created_at)}
                </span>
              </div>
            </div>
          )
        })}
        <div ref={bottomRef} />
      </div>

      {/* Input */}
      <div className="shrink-0 border-t border-cream bg-ivory px-4 py-3">
        <div className="flex items-end gap-2">
          <textarea
            value={body}
            onChange={(e) => setBody(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Write a message…"
            rows={1}
            className="input resize-none py-2.5 text-sm leading-relaxed max-h-32 overflow-y-auto"
            style={{ fieldSizing: 'content' } as React.CSSProperties}
          />
          <button
            onClick={handleSend}
            disabled={!body.trim() || sending}
            className="btn-primary flex items-center justify-center h-10 w-10 rounded-full p-0 shrink-0 disabled:opacity-40 disabled:cursor-not-allowed transition-opacity"
            aria-label="Send message"
          >
            <SendIcon />
          </button>
        </div>
      </div>
    </div>
  )
}
