'use client'

import { useEffect, useState, useCallback } from 'react'
import Image from 'next/image'
import { createClient } from '@/lib/supabase'
import { formatShortDate, getInitials, truncate } from '@/lib/utils'
import type { BusinessWithOwner } from '@/lib/types'

export default function AdminBusinessesPage() {
  const [businesses, setBusinesses] = useState<BusinessWithOwner[]>([])
  const [loading, setLoading] = useState(true)
  const [actionPending, setActionPending] = useState<string | null>(null)

  const supabase = createClient()

  const fetchBusinesses = useCallback(async () => {
    setLoading(true)
    const { data, error } = await supabase
      .from('businesses')
      .select(`
        id, owner_id, name, tagline, description, category, logo_url,
        website_url, instagram_handle, is_featured, is_approved,
        created_at, updated_at,
        owner:profiles!owner_id(id, username, full_name)
      `)
      .order('created_at', { ascending: false })

    if (!error && data) setBusinesses(data as unknown as BusinessWithOwner[])
    setLoading(false)
  }, [])

  useEffect(() => {
    fetchBusinesses()
  }, [fetchBusinesses])

  async function handleToggle(
    id: string,
    field: 'is_approved' | 'is_featured',
    current: boolean
  ) {
    setActionPending(`${id}-${field}`)
    const { error } = await supabase
      .from('businesses')
      .update({ [field]: !current })
      .eq('id', id)

    if (!error) {
      setBusinesses((prev) =>
        prev.map((b) => (b.id === id ? { ...b, [field]: !current } : b))
      )
    }
    setActionPending(null)
  }

  async function handleDelete(id: string) {
    if (!confirm('Delete this business listing? This cannot be undone.')) return
    setActionPending(`${id}-delete`)
    const { error } = await supabase.from('businesses').delete().eq('id', id)
    if (!error) setBusinesses((prev) => prev.filter((b) => b.id !== id))
    setActionPending(null)
  }

  const pending = businesses.filter((b) => !b.is_approved)
  const approved = businesses.filter((b) => b.is_approved)

  return (
    <div className="p-8">
      {/* Header */}
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="font-serif text-3xl text-forest">Businesses</h1>
          {pending.length > 0 && (
            <p className="mt-1 text-sm text-blush font-medium">
              {pending.length} pending approval
            </p>
          )}
        </div>
        <span className="text-sm text-mink">{businesses.length} total</span>
      </div>

      {loading ? (
        <SkeletonRows />
      ) : businesses.length === 0 ? (
        <div className="text-center py-20 text-mink">No businesses listed yet.</div>
      ) : (
        <div className="card overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-cream text-left">
                <th className="px-4 py-3 label">Business</th>
                <th className="px-4 py-3 label">Category</th>
                <th className="px-4 py-3 label">Owner</th>
                <th className="px-4 py-3 label">Listed</th>
                <th className="px-4 py-3 label text-center">Featured</th>
                <th className="px-4 py-3 label text-center">Approved</th>
                <th className="px-4 py-3 label">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-cream">
              {businesses.map((biz) => (
                <BusinessRow
                  key={biz.id}
                  business={biz}
                  actionPending={actionPending}
                  onToggle={handleToggle}
                  onDelete={handleDelete}
                />
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  )
}

function BusinessRow({
  business,
  actionPending,
  onToggle,
  onDelete,
}: {
  business: BusinessWithOwner
  actionPending: string | null
  onToggle: (id: string, field: 'is_approved' | 'is_featured', current: boolean) => Promise<void>
  onDelete: (id: string) => Promise<void>
}) {
  const approveBusy = actionPending === `${business.id}-is_approved`
  const featureBusy = actionPending === `${business.id}-is_featured`
  const deleteBusy = actionPending === `${business.id}-delete`
  const anyBusy = approveBusy || featureBusy || deleteBusy

  return (
    <tr className="hover:bg-cream/30 transition-colors align-middle">
      {/* Logo + name */}
      <td className="px-4 py-3">
        <div className="flex items-center gap-3">
          {business.logo_url ? (
            <Image
              src={business.logo_url}
              alt={business.name}
              width={36}
              height={36}
              className="rounded-xl object-cover flex-shrink-0 border border-cream"
            />
          ) : (
            <span className="flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-xl bg-cream text-xs font-bold text-mink border border-cream">
              {getInitials(business.name)}
            </span>
          )}
          <div className="min-w-0">
            <p className="font-medium text-forest truncate">{business.name}</p>
            {business.tagline && (
              <p className="text-xs text-mink truncate">{truncate(business.tagline, 40)}</p>
            )}
          </div>
        </div>
      </td>

      {/* Category */}
      <td className="px-4 py-3">
        {business.category ? (
          <span className="text-xs bg-cream text-forest px-2.5 py-1 rounded-full font-medium capitalize">
            {business.category}
          </span>
        ) : (
          <span className="text-mink/40 text-xs">—</span>
        )}
      </td>

      {/* Owner */}
      <td className="px-4 py-3">
        {business.owner ? (
          <div className="text-xs text-mink">
            <p className="font-medium text-forest">{business.owner.full_name}</p>
            <p className="text-mink/70">@{business.owner.username}</p>
          </div>
        ) : (
          <span className="text-mink/40 text-xs">—</span>
        )}
      </td>

      {/* Date listed */}
      <td className="px-4 py-3 text-mink text-xs whitespace-nowrap">
        {formatShortDate(business.created_at)}
      </td>

      {/* Featured toggle */}
      <td className="px-4 py-3 text-center">
        <button
          onClick={() => onToggle(business.id, 'is_featured', business.is_featured)}
          disabled={anyBusy}
          title={business.is_featured ? 'Remove feature' : 'Feature'}
          className={`inline-flex items-center justify-center h-7 w-7 rounded-lg transition-colors disabled:opacity-40 ${
            business.is_featured
              ? 'bg-rose text-ivory'
              : 'bg-cream text-mink hover:bg-rose/10 hover:text-rose'
          }`}
        >
          {featureBusy ? <span className="text-[10px]">…</span> : <StarIcon />}
        </button>
      </td>

      {/* Approved toggle */}
      <td className="px-4 py-3 text-center">
        <button
          onClick={() => onToggle(business.id, 'is_approved', business.is_approved)}
          disabled={anyBusy}
          title={business.is_approved ? 'Revoke approval' : 'Approve'}
          className={`inline-flex items-center justify-center h-7 w-7 rounded-lg transition-colors disabled:opacity-40 ${
            business.is_approved
              ? 'bg-forest text-ivory'
              : 'bg-cream text-mink hover:bg-forest/10 hover:text-forest'
          }`}
        >
          {approveBusy ? <span className="text-[10px]">…</span> : <CheckIcon />}
        </button>
      </td>

      {/* Delete */}
      <td className="px-4 py-3">
        <button
          onClick={() => onDelete(business.id)}
          disabled={anyBusy}
          className="text-xs font-medium px-3 py-1.5 rounded-lg bg-rose/10 text-rose hover:bg-rose/20 transition-colors disabled:opacity-50"
        >
          {deleteBusy ? '…' : 'Delete'}
        </button>
      </td>
    </tr>
  )
}

function StarIcon() {
  return (
    <svg className="h-3.5 w-3.5" viewBox="0 0 20 20" fill="currentColor">
      <path
        fillRule="evenodd"
        d="M10.868 2.884c-.321-.772-1.415-.772-1.736 0l-1.83 4.401-4.753.381c-.833.067-1.171 1.107-.536 1.651l3.62 3.102-1.106 4.637c-.194.813.691 1.456 1.405 1.02L10 15.591l4.069 2.485c.713.436 1.598-.207 1.404-1.02l-1.106-4.637 3.62-3.102c.635-.544.297-1.584-.536-1.65l-4.752-.382-1.831-4.401z"
        clipRule="evenodd"
      />
    </svg>
  )
}

function CheckIcon() {
  return (
    <svg className="h-3.5 w-3.5" viewBox="0 0 20 20" fill="currentColor">
      <path
        fillRule="evenodd"
        d="M16.704 4.153a.75.75 0 01.143 1.052l-8 10.5a.75.75 0 01-1.127.075l-4.5-4.5a.75.75 0 011.06-1.06l3.894 3.893 7.48-9.817a.75.75 0 011.05-.143z"
        clipRule="evenodd"
      />
    </svg>
  )
}

function SkeletonRows() {
  return (
    <div className="card overflow-hidden">
      <table className="w-full text-sm">
        <thead>
          <tr className="border-b border-cream">
            {['Business', 'Category', 'Owner', 'Listed', 'Featured', 'Approved', 'Actions'].map(
              (h) => (
                <th key={h} className="px-4 py-3 label text-left">
                  {h}
                </th>
              )
            )}
          </tr>
        </thead>
        <tbody className="divide-y divide-cream">
          {Array.from({ length: 5 }).map((_, i) => (
            <tr key={i} className="animate-pulse">
              <td className="px-4 py-3">
                <div className="flex items-center gap-3">
                  <div className="h-9 w-9 rounded-xl bg-cream" />
                  <div className="h-3 w-32 rounded bg-cream" />
                </div>
              </td>
              <td className="px-4 py-3"><div className="h-5 w-20 rounded-full bg-cream" /></td>
              <td className="px-4 py-3"><div className="h-3 w-24 rounded bg-cream" /></td>
              <td className="px-4 py-3"><div className="h-3 w-20 rounded bg-cream" /></td>
              <td className="px-4 py-3"><div className="h-7 w-7 rounded-lg bg-cream mx-auto" /></td>
              <td className="px-4 py-3"><div className="h-7 w-7 rounded-lg bg-cream mx-auto" /></td>
              <td className="px-4 py-3"><div className="h-7 w-16 rounded-lg bg-cream" /></td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}
