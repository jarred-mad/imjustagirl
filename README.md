# IMJUSTAGIRL. Social Club

A full-stack community platform for an exclusive women's social club. Built with Next.js 14, TypeScript, Tailwind CSS, and Supabase.

## Stack

- **Framework**: Next.js 14 (App Router)
- **Language**: TypeScript
- **Styling**: Tailwind CSS
- **Backend**: Supabase (auth, database, storage, realtime)
- **Deployment**: Vercel

## Features

- **Public**: Home, Events, Past Events, About, Shop the Club directory
- **Auth**: Email/password signup + login with email confirmation
- **Members**: Dashboard, profile editing, member directory, private messaging (realtime), forum
- **Events**: RSVP, photo gallery, media uploads
- **Admin**: Full CRUD for events, member management, media moderation, forum moderation, business directory moderation

## Local Setup

### Prerequisites

- Node.js 18+
- A [Supabase](https://supabase.com) project

### 1. Clone and install

```bash
git clone <your-repo>
cd imjustagirl
npm install
```

### 2. Environment variables

Copy `.env.local` and fill in your Supabase credentials:

```bash
cp .env.local .env.local
```

Edit `.env.local`:

```
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
```

Find these in your Supabase project under **Settings → API**.

### 3. Database setup

Run the schema in your Supabase SQL editor:

1. Open your Supabase project
2. Go to **SQL Editor**
3. Paste the contents of `supabase/schema.sql`
4. Click **Run**

This creates all tables, RLS policies, storage buckets, indexes, and triggers.

### 4. Run the dev server

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

## Making a User an Admin

After signing up, run this in Supabase SQL Editor:

```sql
UPDATE profiles
SET tier = 'admin'
WHERE username = 'your-username';
```

## Project Structure

```
src/
├── app/                    # Next.js App Router pages
│   ├── (auth)/             # Auth server actions
│   ├── admin/              # Admin area (protected)
│   ├── dashboard/          # Member dashboard
│   ├── events/             # Events + detail pages
│   ├── forum/              # Forum boards + threads
│   ├── join/               # Signup page
│   ├── login/              # Login page
│   ├── members/            # Member directory + profiles
│   ├── messages/           # Private messaging
│   ├── shop-the-club/      # Business directory
│   ├── globals.css         # CSS variables + utility classes
│   ├── layout.tsx          # Root layout
│   └── page.tsx            # Home page
├── components/             # Shared React components
├── contexts/               # AuthContext
└── lib/
    ├── supabase.ts         # Browser Supabase client
    ├── supabase-server.ts  # Server Supabase client
    ├── types.ts            # TypeScript interfaces
    └── utils.ts            # Helpers (dates, formatting)

supabase/
└── schema.sql              # Full DB schema + RLS + storage
```

## Type Checking

```bash
npm run type-check
```

## Deployment

Deploy to Vercel:

1. Push to GitHub
2. Import in [Vercel](https://vercel.com)
3. Add the two environment variables (`NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY`)
4. Deploy

## Brand Colors

| Token | Hex |
|-------|-----|
| `forest` | `#1C3828` |
| `forest-deep` | `#2E5240` |
| `blush` | `#C9907A` |
| `cream` | `#F0EAD9` |
| `rose` | `#D96B8A` |
| `ivory` | `#FAF7F2` |
| `mink` | `#8B7B74` |
