export type MembershipTier = 'pending' | 'member' | 'founding' | 'admin'
export type EventStatus = 'draft' | 'published' | 'cancelled' | 'sold_out'
export type RsvpStatus = 'going' | 'waitlist' | 'cancelled'
export type MessageStatus = 'sent' | 'read'
export type MediaType = 'photo' | 'video'
export type ForumBoard = 'general' | 'events' | 'announcements' | 'introductions' | 'recommendations'

export interface Profile {
  id: string
  username: string
  full_name: string
  bio: string | null
  avatar_url: string | null
  location: string | null
  instagram_handle: string | null
  tier: MembershipTier
  is_verified: boolean
  joined_at: string
  updated_at: string
}

export interface Event {
  id: string
  title: string
  slug: string
  description: string | null
  body: string | null
  cover_image_url: string | null
  location: string | null
  location_url: string | null
  starts_at: string
  ends_at: string | null
  capacity: number | null
  price_cents: number
  status: EventStatus
  is_members_only: boolean
  tags: string[]
  created_by: string | null
  created_at: string
  updated_at: string
}

export interface EventWithRsvpCount extends Event {
  rsvp_count: number
  user_rsvp?: RsvpStatus | null
}

export interface Rsvp {
  id: string
  event_id: string
  user_id: string
  status: RsvpStatus
  created_at: string
}

export interface Media {
  id: string
  event_id: string | null
  uploaded_by: string | null
  media_type: MediaType
  storage_path: string
  public_url: string
  caption: string | null
  width: number | null
  height: number | null
  is_approved: boolean
  created_at: string
}

export interface MediaWithUploader extends Media {
  uploader: Pick<Profile, 'id' | 'username' | 'avatar_url'> | null
}

export interface Conversation {
  id: string
  participant_ids: string[]
  last_message_at: string
  created_at: string
}

export interface ConversationWithParticipants extends Conversation {
  participants: Pick<Profile, 'id' | 'username' | 'full_name' | 'avatar_url'>[]
  last_message?: Pick<Message, 'body' | 'created_at'> | null
}

export interface Message {
  id: string
  conversation_id: string
  sender_id: string
  body: string
  status: MessageStatus
  created_at: string
}

export interface MessageWithSender extends Message {
  sender: Pick<Profile, 'id' | 'username' | 'avatar_url'>
}

export interface ForumThread {
  id: string
  board: ForumBoard
  title: string
  body: string
  author_id: string
  is_pinned: boolean
  is_locked: boolean
  reply_count: number
  last_reply_at: string
  created_at: string
  updated_at: string
}

export interface ForumThreadWithAuthor extends ForumThread {
  author: Pick<Profile, 'id' | 'username' | 'avatar_url' | 'tier'>
}

export interface ForumReply {
  id: string
  thread_id: string
  author_id: string
  body: string
  is_edited: boolean
  created_at: string
  updated_at: string
}

export interface ForumReplyWithAuthor extends ForumReply {
  author: Pick<Profile, 'id' | 'username' | 'avatar_url' | 'tier'>
}

export interface Business {
  id: string
  owner_id: string | null
  name: string
  tagline: string | null
  description: string | null
  category: string | null
  logo_url: string | null
  website_url: string | null
  instagram_handle: string | null
  is_featured: boolean
  is_approved: boolean
  created_at: string
  updated_at: string
}

export interface BusinessWithOwner extends Business {
  owner: Pick<Profile, 'id' | 'username' | 'full_name'> | null
}

// Admin stats
export interface AdminStats {
  total_members: number
  pending_members: number
  upcoming_events: number
  total_media: number
  pending_media: number
  total_businesses: number
  pending_businesses: number
}
