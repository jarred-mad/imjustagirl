-- IMJUSTAGIRL. Social Club — Full Schema
-- Run this in your Supabase SQL editor to set up the database

-- ─────────────────────────────────────────────
-- Extensions
-- ─────────────────────────────────────────────
create extension if not exists "uuid-ossp";
create extension if not exists "pg_trgm"; -- for full-text search

-- ─────────────────────────────────────────────
-- Enums
-- ─────────────────────────────────────────────
create type membership_tier as enum ('pending', 'member', 'founding', 'admin');
create type event_status as enum ('draft', 'published', 'cancelled', 'sold_out');
create type rsvp_status as enum ('going', 'waitlist', 'cancelled');
create type message_status as enum ('sent', 'read');
create type media_type as enum ('photo', 'video');
create type forum_board as enum ('general', 'events', 'announcements', 'introductions', 'recommendations');

-- ─────────────────────────────────────────────
-- Profiles (extends auth.users)
-- ─────────────────────────────────────────────
create table public.profiles (
  id uuid references auth.users(id) on delete cascade primary key,
  username text unique not null,
  full_name text not null,
  bio text,
  avatar_url text,
  location text,
  instagram_handle text,
  tier membership_tier not null default 'pending',
  is_verified boolean not null default false,
  joined_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.profiles enable row level security;

create policy "Profiles are viewable by members" on public.profiles
  for select using (
    auth.uid() is not null
    or tier != 'pending'
  );

create policy "Users can update own profile" on public.profiles
  for update using (auth.uid() = id);

create policy "Users can insert own profile" on public.profiles
  for insert with check (auth.uid() = id);

-- Trigger: keep updated_at current
create or replace function public.handle_updated_at()
returns trigger language plpgsql as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

create trigger profiles_updated_at
  before update on public.profiles
  for each row execute function public.handle_updated_at();

-- Trigger: auto-create profile on signup
create or replace function public.handle_new_user()
returns trigger language plpgsql security definer as $$
begin
  insert into public.profiles (id, username, full_name, avatar_url)
  values (
    new.id,
    coalesce(new.raw_user_meta_data->>'username', split_part(new.email, '@', 1)),
    coalesce(new.raw_user_meta_data->>'full_name', ''),
    new.raw_user_meta_data->>'avatar_url'
  );
  return new;
end;
$$;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- ─────────────────────────────────────────────
-- Events
-- ─────────────────────────────────────────────
create table public.events (
  id uuid default uuid_generate_v4() primary key,
  title text not null,
  slug text unique not null,
  description text,
  body text, -- rich content / markdown
  cover_image_url text,
  location text,
  location_url text, -- Google Maps link
  starts_at timestamptz not null,
  ends_at timestamptz,
  capacity integer,
  price_cents integer not null default 0,
  status event_status not null default 'draft',
  is_members_only boolean not null default true,
  tags text[] default '{}',
  created_by uuid references public.profiles(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.events enable row level security;

create trigger events_updated_at
  before update on public.events
  for each row execute function public.handle_updated_at();

create policy "Published events visible to all" on public.events
  for select using (status = 'published');

create policy "Admins can do everything" on public.events
  for all using (
    exists (
      select 1 from public.profiles
      where id = auth.uid() and tier = 'admin'
    )
  );

-- ─────────────────────────────────────────────
-- RSVPs
-- ─────────────────────────────────────────────
create table public.rsvps (
  id uuid default uuid_generate_v4() primary key,
  event_id uuid references public.events(id) on delete cascade not null,
  user_id uuid references public.profiles(id) on delete cascade not null,
  status rsvp_status not null default 'going',
  created_at timestamptz not null default now(),
  unique(event_id, user_id)
);

alter table public.rsvps enable row level security;

create policy "Users can view own RSVPs" on public.rsvps
  for select using (auth.uid() = user_id);

create policy "Users can manage own RSVPs" on public.rsvps
  for insert with check (auth.uid() = user_id);

create policy "Users can update own RSVPs" on public.rsvps
  for update using (auth.uid() = user_id);

create policy "Admins can view all RSVPs" on public.rsvps
  for select using (
    exists (
      select 1 from public.profiles
      where id = auth.uid() and tier = 'admin'
    )
  );

-- ─────────────────────────────────────────────
-- Media
-- ─────────────────────────────────────────────
create table public.media (
  id uuid default uuid_generate_v4() primary key,
  event_id uuid references public.events(id) on delete set null,
  uploaded_by uuid references public.profiles(id) on delete set null,
  media_type media_type not null default 'photo',
  storage_path text not null,
  public_url text not null,
  caption text,
  width integer,
  height integer,
  is_approved boolean not null default false,
  created_at timestamptz not null default now()
);

alter table public.media enable row level security;

create policy "Approved media visible to members" on public.media
  for select using (
    is_approved = true
    and auth.uid() is not null
  );

create policy "Users can upload their own media" on public.media
  for insert with check (auth.uid() = uploaded_by);

create policy "Admins can manage all media" on public.media
  for all using (
    exists (
      select 1 from public.profiles
      where id = auth.uid() and tier = 'admin'
    )
  );

-- ─────────────────────────────────────────────
-- Messages
-- ─────────────────────────────────────────────
create table public.conversations (
  id uuid default uuid_generate_v4() primary key,
  participant_ids uuid[] not null,
  last_message_at timestamptz not null default now(),
  created_at timestamptz not null default now()
);

alter table public.conversations enable row level security;

create policy "Participants can view their conversations" on public.conversations
  for select using (auth.uid() = any(participant_ids));

create policy "Members can create conversations" on public.conversations
  for insert with check (auth.uid() = any(participant_ids));

create table public.messages (
  id uuid default uuid_generate_v4() primary key,
  conversation_id uuid references public.conversations(id) on delete cascade not null,
  sender_id uuid references public.profiles(id) on delete cascade not null,
  body text not null,
  status message_status not null default 'sent',
  created_at timestamptz not null default now()
);

alter table public.messages enable row level security;

create policy "Participants can read conversation messages" on public.messages
  for select using (
    exists (
      select 1 from public.conversations
      where id = conversation_id
      and auth.uid() = any(participant_ids)
    )
  );

create policy "Participants can send messages" on public.messages
  for insert with check (
    auth.uid() = sender_id
    and exists (
      select 1 from public.conversations
      where id = conversation_id
      and auth.uid() = any(participant_ids)
    )
  );

-- ─────────────────────────────────────────────
-- Forum
-- ─────────────────────────────────────────────
create table public.forum_threads (
  id uuid default uuid_generate_v4() primary key,
  board forum_board not null default 'general',
  title text not null,
  body text not null,
  author_id uuid references public.profiles(id) on delete cascade not null,
  is_pinned boolean not null default false,
  is_locked boolean not null default false,
  reply_count integer not null default 0,
  last_reply_at timestamptz not null default now(),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.forum_threads enable row level security;

create trigger forum_threads_updated_at
  before update on public.forum_threads
  for each row execute function public.handle_updated_at();

create policy "Members can view threads" on public.forum_threads
  for select using (auth.uid() is not null);

create policy "Members can create threads" on public.forum_threads
  for insert with check (auth.uid() = author_id);

create policy "Authors can update own threads" on public.forum_threads
  for update using (auth.uid() = author_id);

create policy "Admins can manage all threads" on public.forum_threads
  for all using (
    exists (
      select 1 from public.profiles
      where id = auth.uid() and tier = 'admin'
    )
  );

create table public.forum_replies (
  id uuid default uuid_generate_v4() primary key,
  thread_id uuid references public.forum_threads(id) on delete cascade not null,
  author_id uuid references public.profiles(id) on delete cascade not null,
  body text not null,
  is_edited boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.forum_replies enable row level security;

create trigger forum_replies_updated_at
  before update on public.forum_replies
  for each row execute function public.handle_updated_at();

-- Auto-update thread reply_count and last_reply_at
create or replace function public.handle_new_reply()
returns trigger language plpgsql as $$
begin
  update public.forum_threads
  set reply_count = reply_count + 1,
      last_reply_at = now()
  where id = new.thread_id;
  return new;
end;
$$;

create trigger on_forum_reply_created
  after insert on public.forum_replies
  for each row execute function public.handle_new_reply();

create policy "Members can view replies" on public.forum_replies
  for select using (auth.uid() is not null);

create policy "Members can create replies" on public.forum_replies
  for insert with check (auth.uid() = author_id);

create policy "Authors can update own replies" on public.forum_replies
  for update using (auth.uid() = author_id);

-- ─────────────────────────────────────────────
-- Businesses (Shop the Club directory)
-- ─────────────────────────────────────────────
create table public.businesses (
  id uuid default uuid_generate_v4() primary key,
  owner_id uuid references public.profiles(id) on delete set null,
  name text not null,
  tagline text,
  description text,
  category text,
  logo_url text,
  website_url text,
  instagram_handle text,
  is_featured boolean not null default false,
  is_approved boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.businesses enable row level security;

create trigger businesses_updated_at
  before update on public.businesses
  for each row execute function public.handle_updated_at();

create policy "Approved businesses visible to all" on public.businesses
  for select using (is_approved = true);

create policy "Owners can manage own business" on public.businesses
  for all using (auth.uid() = owner_id);

create policy "Admins can manage all businesses" on public.businesses
  for all using (
    exists (
      select 1 from public.profiles
      where id = auth.uid() and tier = 'admin'
    )
  );

-- ─────────────────────────────────────────────
-- Storage Buckets
-- ─────────────────────────────────────────────
insert into storage.buckets (id, name, public)
values
  ('avatars', 'avatars', true),
  ('event-covers', 'event-covers', true),
  ('event-media', 'event-media', true),
  ('business-logos', 'business-logos', true)
on conflict do nothing;

-- Storage policies
create policy "Avatar images are publicly accessible" on storage.objects
  for select using (bucket_id = 'avatars');

create policy "Users can upload own avatar" on storage.objects
  for insert with check (
    bucket_id = 'avatars'
    and auth.uid()::text = (storage.foldername(name))[1]
  );

create policy "Event covers are publicly accessible" on storage.objects
  for select using (bucket_id = 'event-covers');

create policy "Admins can upload event covers" on storage.objects
  for insert with check (
    bucket_id = 'event-covers'
    and exists (
      select 1 from public.profiles
      where id = auth.uid() and tier = 'admin'
    )
  );

create policy "Event media is visible to members" on storage.objects
  for select using (
    bucket_id = 'event-media'
    and auth.role() = 'authenticated'
  );

create policy "Members can upload event media" on storage.objects
  for insert with check (
    bucket_id = 'event-media'
    and auth.role() = 'authenticated'
  );

-- ─────────────────────────────────────────────
-- Indexes
-- ─────────────────────────────────────────────
create index idx_events_status on public.events(status);
create index idx_events_starts_at on public.events(starts_at desc);
create index idx_rsvps_event_id on public.rsvps(event_id);
create index idx_rsvps_user_id on public.rsvps(user_id);
create index idx_media_event_id on public.media(event_id);
create index idx_media_approved on public.media(is_approved);
create index idx_messages_conversation on public.messages(conversation_id, created_at);
create index idx_forum_threads_board on public.forum_threads(board, last_reply_at desc);
create index idx_profiles_tier on public.profiles(tier);
create index idx_businesses_approved on public.businesses(is_approved, is_featured);

-- ─────────────────────────────────────────────
-- Seed Data (optional — remove for production)
-- ─────────────────────────────────────────────
-- Sample event for testing (commented out — run manually)
/*
insert into public.events (title, slug, description, starts_at, status, is_members_only)
values (
  'Summer Garden Social',
  'summer-garden-social-2024',
  'An intimate evening in the garden with cocktails, conversation, and community.',
  now() + interval '14 days',
  'published',
  true
);
*/
