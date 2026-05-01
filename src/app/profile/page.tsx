'use client'

import { useState, useEffect, useActionState } from 'react'
import Image from 'next/image'
import Link from 'next/link'
import { createClient } from '@/lib/supabase'
import { formatShortDate, getInitials } from '@/lib/utils'
import { updateProfile } from '@/app/(auth)/actions'
import type { Profile, MembershipTier } from '@/lib/types'
import Navbar from '@/components/Navbar'
import Footer from '@/components/Footer'

function TierBadge({ tier }: { tier: MembershipTier }) {
  if (tier === 'founding') {
    return (
      <span className="inline-flex items-center rounded-full bg-rose px-3 py-1 text-xs font-medium text-ivory">
        Founding Member
      </span>
    )
  }
  if (tier === 'admin') {
    return (
      <span className="inline-flex items-center rounded-full bg-forest-deep px-3 py-1 text-xs font-medium text-ivory">
        Admin
      </span>
    )
  }
  if (tier === 'member') {
    return (
      <span className="inline-flex items-center rounded-full bg-forest px-3 py-1 text-xs font-medium text-ivory">
        Member
      </span>
    )
  }
  return (
    <span className="inline-flex items-center rounded-full bg-mink/20 px-3 py-1 text-xs font-medium text-mink">
      Pending
    </span>
  )
}

function ProfileEditForm({ profile, email }: { profile: Profile; email: string }) {
  const [state, action, isPending] = useActionState(updateProfile, null)

  const [fullName, setFullName] = useState(profile.full_name)
  const [username, setUsername] = useState(profile.username)
  const [location, setLocation] = useState(profile.location ?? '')
  const [bio, setBio] = useState(profile.bio ?? '')
  const [instagram, setInstagram] = useState(profile.instagram_handle ?? '')

  return (
    <form action={action} className="space-y-8">
      {/* Basic info */}
      <div className="card p-6 space-y-5">
        <h2 className="font-serif text-xl text-forest">Basic Info</h2>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
          <div>
            <label htmlFor="full_name" className="label">Full Name</label>
            <input
              id="full_name"
              name="full_name"
              type="text"
              className="input"
              value={fullName}
              onChange={(e) => setFullName(e.target.value)}
              required
            />
          </div>

          <div>
            <label htmlFor="username" className="label">Username</label>
            <div className="relative">
              <span className="absolute left-4 top-1/2 -translate-y-1/2 text-mink text-sm select-none">@</span>
              <input
                id="username"
                name="username"
                type="text"
                className="input pl-8"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                required
              />
            </div>
          </div>
        </div>

        <div>
          <label htmlFor="location" className="label">Location</label>
          <input
            id="location"
            name="location"
            type="text"
            className="input"
            placeholder="City, State"
            value={location}
            onChange={(e) => setLocation(e.target.value)}
          />
        </div>

        <div>
          <label htmlFor="bio" className="label">Bio</label>
          <textarea
            id="bio"
            name="bio"
            rows={4}
            className="input resize-none"
            placeholder="Tell the community a little about yourself…"
            value={bio}
            onChange={(e) => setBio(e.target.value)}
          />
        </div>

        <div>
          <label htmlFor="instagram_handle" className="label">Instagram Handle</label>
          <div className="relative">
            <span className="absolute left-4 top-1/2 -translate-y-1/2 text-mink text-sm select-none">@</span>
            <input
              id="instagram_handle"
              name="instagram_handle"
              type="text"
              className="input pl-8"
              placeholder="yourhandle"
              value={instagram}
              onChange={(e) => setInstagram(e.target.value)}
            />
          </div>
        </div>

        {state && 'error' in state && (
          <p className="text-sm text-rose">{state.error}</p>
        )}
        {state && 'success' in state && state.success && (
          <p className="text-sm text-forest">{state.message ?? 'Profile updated.'}</p>
        )}

        <div className="pt-2">
          <button type="submit" className="btn-primary" disabled={isPending}>
            {isPending ? 'Saving…' : 'Save Changes'}
          </button>
        </div>
      </div>

      {/* Account section */}
      <div className="card p-6 space-y-4">
        <h2 className="font-serif text-xl text-forest">Account</h2>

        <div>
          <label className="label">Email</label>
          <input
            type="email"
            className="input bg-cream/40 cursor-not-allowed"
            value={email}
            disabled
            readOnly
          />
          <p className="mt-1.5 text-xs text-mink">Email cannot be changed here.</p>
        </div>

        <div className="pt-1">
          <Link
            href="/login?mode=reset"
            className="text-sm text-forest underline underline-offset-2 hover:text-forest-deep transition-colors"
          >
            Change password
          </Link>
        </div>
      </div>
    </form>
  )
}

export default function ProfilePage() {
  const [profile, setProfile] = useState<Profile | null>(null)
  const [email, setEmail] = useState('')
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    async function load() {
      try {
        const supabase = createClient()
        const {
          data: { user },
          error: authError,
        } = await supabase.auth.getUser()

        if (authError || !user) {
          window.location.href = '/login'
          return
        }

        setEmail(user.email ?? '')

        const { data, error: profileError } = await supabase
          .from('profiles')
          .select('id, username, full_name, bio, avatar_url, location, instagram_handle, tier, is_verified, joined_at, updated_at')
          .eq('id', user.id)
          .single()

        if (profileError) {
          setError('Failed to load profile.')
        } else {
          setProfile(data as Profile)
        }
      } catch {
        setError('An unexpected error occurred.')
      } finally {
        setLoading(false)
      }
    }

    load()
  }, [])

  const initials = getInitials(profile?.full_name ?? profile?.username ?? 'M')

  return (
    <div className="min-h-screen flex flex-col bg-ivory">
      <Navbar />

      <main className="flex-1 max-w-3xl mx-auto w-full px-4 sm:px-6 lg:px-8 py-10 space-y-8">

        {loading && (
          <div className="space-y-4">
            <div className="h-32 rounded-2xl bg-cream animate-pulse" />
            <div className="h-64 rounded-2xl bg-cream animate-pulse" />
          </div>
        )}

        {error && !loading && (
          <div className="card p-8 text-center">
            <p className="text-rose">{error}</p>
          </div>
        )}

        {!loading && !error && profile && (
          <>
            {/* Profile header */}
            <section className="card p-6">
              <div className="flex flex-col sm:flex-row items-start sm:items-center gap-5">
                {/* Avatar with upload overlay */}
                <div className="relative shrink-0 group cursor-pointer">
                  {profile.avatar_url ? (
                    <Image
                      src={profile.avatar_url}
                      alt={profile.full_name}
                      width={96}
                      height={96}
                      className="w-24 h-24 rounded-full object-cover border-2 border-cream"
                    />
                  ) : (
                    <div className="w-24 h-24 rounded-full bg-forest flex items-center justify-center border-2 border-cream">
                      <span className="font-serif text-2xl text-ivory font-semibold">{initials}</span>
                    </div>
                  )}
                  <div className="absolute inset-0 rounded-full bg-forest/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                    <svg className="w-5 h-5 text-ivory" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M3 16.5v2.25A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75V16.5m-13.5-9L12 3m0 0l4.5 4.5M12 3v13.5" />
                    </svg>
                  </div>
                </div>

                <div className="flex-1 min-w-0">
                  <h1 className="font-serif text-2xl text-forest leading-tight">{profile.full_name}</h1>
                  <p className="text-sm text-mink mt-0.5">@{profile.username}</p>
                  <div className="mt-2 flex items-center gap-2 flex-wrap">
                    <TierBadge tier={profile.tier} />
                    <span className="text-xs text-mink">
                      Joined {formatShortDate(profile.joined_at)}
                    </span>
                  </div>
                  {profile.bio && (
                    <p className="mt-3 text-sm text-forest/80 leading-relaxed">{profile.bio}</p>
                  )}
                </div>
              </div>
            </section>

            {/* Edit form */}
            <ProfileEditForm profile={profile} email={email} />
          </>
        )}

      </main>

      <Footer />
    </div>
  )
}
