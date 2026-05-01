'use client'

import { useEffect, useState, useCallback } from 'react'
import Image from 'next/image'
import { createClient } from '@/lib/supabase'
import { formatShortDate, getInitials } from '@/lib/utils'
import type { Profile, MembershipTier } from '@/lib/types'

type TierFilter = 'all' | MembershipTier

const TIER_TABS: { key: TierFilter; label: string }[] = [
  { key: 'all', label: 'All' },
  { key: 'pending', label: 'Pending' },
  { key: 'member', label: 'Member' },
  { key: 'founding', label: 'Founding' },
  { key: 'admin', label: 'Admin' },
]

const TIER_BADGE: Record<MembershipTier, string> = {
  pending: 'bg-blush/20 text-blush',
  member: 'bg-forest/10 text-forest',
  founding: 'bg-rose/10 text-rose',
  admin: 'bg-forest text-ivory',
}

export default function AdminMembersPage() {
  const [members, setMembers] = useState<Profile[]>([])
  const [loading, setLoading] = useState(true)
  const [tierFilter, setTierFilter] = useState<TierFilter>('all')
  const [search, setSearch] = useState('')
  const [actionPending, setActionPending] = useState<string | null>(null)

  const supabase = createClient()

  const fetchMembers = useCallback(async () => {
    setLoading(true)

    let query = supabase
      .from('profiles')
      .select(`
        id, username, full_name, bio, avatar_url, location,
        instagram_handle, tier, is_verified, joined_at, updated_at
      `)
      .order('joined_at', { ascending: false })

    if (tierFilter !== 'all') query = query.eq('tier', tierFilter)
    if (search.trim()) {
      query = query.or(
        `full_name.ilike.%${search.trim()}%,username.ilike.%${search.trim()}%`
      )
    }

    const { data, error } = await query
    if (!error && data) setMembers(data as Profile[])
    setLoading(false)
  }, [tierFilter, search])

  useEffect(() => {
    const id = setTimeout(fetchMembers, search ? 300 : 0)
    return () => clearTimeout(id)
  }, [fetchMembers, search])

  async function handleTierChange(memberId: string, newTier: MembershipTier) {
    setActionPending(memberId)
    const { error } = await supabase
      .from('profiles')
      .update({ tier: newTier })
      .eq('id', memberId)

    if (!error) {
      setMembers((prev) =>
        prev.map((m) => (m.id === memberId ? { ...m, tier: newTier } : m))
      )
    }
    setActionPending(null)
  }

  return (
    <div className="p-8">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <h1 className="font-serif text-3xl text-forest">Members</h1>
        <span className="text-sm text-mink">{members.length} shown</span>
      </div>

      {/* Controls */}
      <div className="flex flex-col sm:flex-row gap-3 mb-6">
        <input
          type="search"
          placeholder="Search by name or username…"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="input sm:w-72"
        />
      </div>

      {/* Tier tabs */}
      <div className="flex gap-1 mb-6 border-b border-cream">
        {TIER_TABS.map((tab) => (
          <button
            key={tab.key}
            onClick={() => setTierFilter(tab.key)}
            className={`px-4 py-2.5 text-sm font-medium transition-colors border-b-2 -mb-px ${
              tierFilter === tab.key
                ? 'border-forest text-forest'
                : 'border-transparent text-mink hover:text-forest'
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Table */}
      {loading ? (
        <SkeletonRows />
      ) : members.length === 0 ? (
        <div className="text-center py-20 text-mink">No members found.</div>
      ) : (
        <div className="card overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-cream text-left">
                <th className="px-4 py-3 label">Member</th>
                <th className="px-4 py-3 label">Username</th>
                <th className="px-4 py-3 label">Tier</th>
                <th className="px-4 py-3 label">Joined</th>
                <th className="px-4 py-3 label">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-cream">
              {members.map((member) => (
                <MemberRow
                  key={member.id}
                  member={member}
                  busy={actionPending === member.id}
                  onTierChange={handleTierChange}
                />
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  )
}

function MemberRow({
  member,
  busy,
  onTierChange,
}: {
  member: Profile
  busy: boolean
  onTierChange: (id: string, tier: MembershipTier) => Promise<void>
}) {
  return (
    <tr className="hover:bg-cream/30 transition-colors">
      {/* Avatar + name */}
      <td className="px-4 py-3">
        <div className="flex items-center gap-3">
          {member.avatar_url ? (
            <Image
              src={member.avatar_url}
              alt={member.full_name}
              width={32}
              height={32}
              className="rounded-full object-cover flex-shrink-0"
            />
          ) : (
            <span className="flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-full bg-cream text-xs font-semibold text-mink">
              {getInitials(member.full_name)}
            </span>
          )}
          <span className="font-medium text-forest">{member.full_name}</span>
        </div>
      </td>

      {/* Username */}
      <td className="px-4 py-3 text-mink">@{member.username}</td>

      {/* Tier badge */}
      <td className="px-4 py-3">
        <span
          className={`inline-block px-2.5 py-0.5 rounded-full text-xs font-medium capitalize ${TIER_BADGE[member.tier]}`}
        >
          {member.tier}
        </span>
      </td>

      {/* Joined */}
      <td className="px-4 py-3 text-mink whitespace-nowrap">
        {formatShortDate(member.joined_at)}
      </td>

      {/* Actions */}
      <td className="px-4 py-3">
        <div className="flex items-center gap-2">
          {member.tier === 'pending' && (
            <>
              <button
                onClick={() => onTierChange(member.id, 'member')}
                disabled={busy}
                className="text-xs font-medium px-3 py-1.5 rounded-lg bg-forest text-ivory hover:bg-forest-deep transition-colors disabled:opacity-50"
              >
                {busy ? '…' : 'Member'}
              </button>
              <button
                onClick={() => onTierChange(member.id, 'founding')}
                disabled={busy}
                className="text-xs font-medium px-3 py-1.5 rounded-lg bg-rose text-ivory hover:opacity-90 transition-opacity disabled:opacity-50"
              >
                {busy ? '…' : 'Founding'}
              </button>
            </>
          )}

          {member.tier !== 'pending' && (
            <TierSelect
              currentTier={member.tier}
              busy={busy}
              onChange={(tier) => onTierChange(member.id, tier)}
            />
          )}
        </div>
      </td>
    </tr>
  )
}

function TierSelect({
  currentTier,
  busy,
  onChange,
}: {
  currentTier: MembershipTier
  busy: boolean
  onChange: (tier: MembershipTier) => void
}) {
  const options: MembershipTier[] = ['member', 'founding', 'admin', 'pending']

  return (
    <select
      value={currentTier}
      disabled={busy}
      onChange={(e) => onChange(e.target.value as MembershipTier)}
      className="text-xs border border-mink/30 rounded-lg px-2.5 py-1.5 bg-white text-forest focus:outline-none focus:ring-2 focus:ring-forest/20 disabled:opacity-50 cursor-pointer"
    >
      {options.map((t) => (
        <option key={t} value={t}>
          {t.charAt(0).toUpperCase() + t.slice(1)}
        </option>
      ))}
    </select>
  )
}

function SkeletonRows() {
  return (
    <div className="card overflow-hidden">
      <table className="w-full text-sm">
        <thead>
          <tr className="border-b border-cream text-left">
            <th className="px-4 py-3 label">Member</th>
            <th className="px-4 py-3 label">Username</th>
            <th className="px-4 py-3 label">Tier</th>
            <th className="px-4 py-3 label">Joined</th>
            <th className="px-4 py-3 label">Actions</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-cream">
          {Array.from({ length: 6 }).map((_, i) => (
            <tr key={i} className="animate-pulse">
              <td className="px-4 py-3">
                <div className="flex items-center gap-3">
                  <div className="h-8 w-8 rounded-full bg-cream" />
                  <div className="h-3 w-32 rounded bg-cream" />
                </div>
              </td>
              <td className="px-4 py-3"><div className="h-3 w-24 rounded bg-cream" /></td>
              <td className="px-4 py-3"><div className="h-5 w-16 rounded-full bg-cream" /></td>
              <td className="px-4 py-3"><div className="h-3 w-20 rounded bg-cream" /></td>
              <td className="px-4 py-3"><div className="h-7 w-24 rounded-lg bg-cream" /></td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}
