import Image from 'next/image'
import { Business } from '@/lib/types'
import { getInitials } from '@/lib/utils'

interface BusinessCardProps {
  business: Business
}

function ExternalLinkIcon() {
  return (
    <svg
      className="h-3.5 w-3.5"
      viewBox="0 0 20 20"
      fill="none"
      stroke="currentColor"
      strokeWidth={1.75}
    >
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        d="M13.5 6H5.25A2.25 2.25 0 003 8.25v9.5A2.25 2.25 0 005.25 20h9.5A2.25 2.25 0 0017 17.75V9.5M13.5 6V3.75M13.5 6l-9 9"
      />
    </svg>
  )
}

function InstagramIcon() {
  return (
    <svg
      className="h-3.5 w-3.5"
      viewBox="0 0 24 24"
      fill="currentColor"
    >
      <path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zm0-2.163c-3.259 0-3.667.014-4.947.072-4.358.2-6.78 2.618-6.98 6.98-.059 1.281-.073 1.689-.073 4.948 0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98 1.281.058 1.689.072 4.948.072 3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98-1.281-.059-1.69-.073-4.949-.073zm0 5.838c-3.403 0-6.162 2.759-6.162 6.162s2.759 6.163 6.162 6.163 6.162-2.759 6.162-6.163c0-3.403-2.759-6.162-6.162-6.162zm0 10.162c-2.209 0-4-1.79-4-4 0-2.209 1.791-4 4-4s4 1.791 4 4c0 2.21-1.791 4-4 4zm6.406-11.845c-.796 0-1.441.645-1.441 1.44s.645 1.44 1.441 1.44c.795 0 1.439-.645 1.439-1.44s-.644-1.44-1.439-1.44z" />
    </svg>
  )
}

function StarIcon() {
  return (
    <svg
      className="h-3.5 w-3.5"
      viewBox="0 0 20 20"
      fill="currentColor"
    >
      <path
        fillRule="evenodd"
        d="M10.868 2.884c-.321-.772-1.415-.772-1.736 0l-1.83 4.401-4.753.381c-.833.067-1.171 1.107-.536 1.651l3.62 3.102-1.106 4.637c-.194.813.691 1.456 1.405 1.02L10 15.591l4.069 2.485c.713.436 1.598-.207 1.404-1.02l-1.106-4.637 3.62-3.102c.635-.544.297-1.584-.536-1.65l-4.752-.382-1.831-4.401z"
        clipRule="evenodd"
      />
    </svg>
  )
}

export default function BusinessCard({ business }: BusinessCardProps) {
  const initial = business.name.charAt(0).toUpperCase()

  return (
    <div className="card p-5 flex flex-col gap-4">
      <div className="flex items-start gap-4">
        <div className="shrink-0">
          {business.logo_url ? (
            <Image
              src={business.logo_url}
              alt={business.name}
              width={52}
              height={52}
              className="h-13 w-13 rounded-xl object-cover"
            />
          ) : (
            <div className="flex h-13 w-13 items-center justify-center rounded-xl bg-cream text-forest font-serif text-xl font-bold border border-cream">
              {initial}
            </div>
          )}
        </div>

        <div className="min-w-0 flex-1">
          <div className="flex items-start justify-between gap-2">
            <h3 className="font-serif text-lg font-semibold text-forest leading-tight">
              {business.name}
            </h3>
            {business.is_featured && (
              <span className="inline-flex items-center gap-1 rounded-full bg-blush/20 px-2 py-0.5 text-xs font-medium text-blush shrink-0">
                <StarIcon />
                Featured
              </span>
            )}
          </div>

          {business.tagline && (
            <p className="mt-1 text-sm text-mink leading-snug">{business.tagline}</p>
          )}

          {business.category && (
            <span className="mt-2 inline-block rounded-full border border-cream bg-cream/50 px-2.5 py-0.5 text-xs font-medium text-forest capitalize">
              {business.category}
            </span>
          )}
        </div>
      </div>

      {(business.website_url || business.instagram_handle) && (
        <div className="flex items-center gap-3 pt-1 border-t border-cream">
          {business.website_url && (
            <a
              href={business.website_url}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1.5 text-xs text-mink hover:text-forest transition-colors"
            >
              <ExternalLinkIcon />
              Website
            </a>
          )}
          {business.instagram_handle && (
            <a
              href={`https://instagram.com/${business.instagram_handle.replace(/^@/, '')}`}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1.5 text-xs text-mink hover:text-rose transition-colors"
            >
              <InstagramIcon />
              @{business.instagram_handle.replace(/^@/, '')}
            </a>
          )}
        </div>
      )}
    </div>
  )
}
