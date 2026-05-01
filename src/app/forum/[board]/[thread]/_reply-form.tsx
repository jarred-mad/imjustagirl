'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase'

interface ReplyFormProps {
  threadId: string
  isLocked: boolean
}

export default function ReplyForm({ threadId, isLocked }: ReplyFormProps) {
  const router = useRouter()
  const [body, setBody] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)

  if (isLocked) {
    return (
      <div className="flex items-center gap-3 px-5 py-4 bg-cream/50 rounded-2xl border border-cream">
        <svg
          className="w-4 h-4 text-mink shrink-0"
          viewBox="0 0 20 20"
          fill="currentColor"
        >
          <path
            fillRule="evenodd"
            d="M10 1a4.5 4.5 0 00-4.5 4.5V9H5a2 2 0 00-2 2v6a2 2 0 002 2h10a2 2 0 002-2v-6a2 2 0 00-2-2h-.5V5.5A4.5 4.5 0 0010 1zm3 8V5.5a3 3 0 10-6 0V9h6z"
            clipRule="evenodd"
          />
        </svg>
        <p className="text-sm text-mink">This thread is locked. No new replies can be posted.</p>
      </div>
    )
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    const trimmed = body.trim()
    if (!trimmed || submitting) return

    setSubmitting(true)
    setError(null)

    try {
      const supabase = createClient()
      const {
        data: { user },
      } = await supabase.auth.getUser()

      if (!user) {
        setError('You must be signed in to reply.')
        return
      }

      const { error: insertError } = await supabase.from('forum_replies').insert({
        thread_id: threadId,
        author_id: user.id,
        body: trimmed,
      })

      if (insertError) throw insertError

      setBody('')
      router.refresh()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to post reply. Please try again.')
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-3">
      <div>
        <label htmlFor="reply-body" className="label">
          Your Reply
        </label>
        <textarea
          id="reply-body"
          value={body}
          onChange={(e) => setBody(e.target.value)}
          placeholder="Write your reply…"
          rows={4}
          className="input resize-none"
          disabled={submitting}
          required
        />
      </div>

      {error && (
        <p className="text-xs text-rose bg-rose/10 rounded-lg px-3 py-2">{error}</p>
      )}

      <div className="flex justify-end">
        <button
          type="submit"
          disabled={!body.trim() || submitting}
          className="btn-primary text-sm px-6 py-2.5 flex items-center gap-2 disabled:opacity-40"
        >
          {submitting && (
            <svg className="w-4 h-4 animate-spin" fill="none" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v4l3-3-3-3v4a8 8 0 00-8 8h4z" />
            </svg>
          )}
          {submitting ? 'Posting…' : 'Post Reply'}
        </button>
      </div>
    </form>
  )
}
