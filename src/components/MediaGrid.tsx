'use client'

import { useState } from 'react'
import { cn } from '@/lib/utils'
import type { MediaWithUploader } from '@/lib/types'

interface MediaGridProps {
  items: MediaWithUploader[]
  columns?: 2 | 3 | 4
}

const COLUMN_CLASSES: Record<2 | 3 | 4, string> = {
  2: 'columns-2',
  3: 'columns-2 sm:columns-3',
  4: 'columns-2 sm:columns-3 lg:columns-4',
}

export default function MediaGrid({ items, columns = 3 }: MediaGridProps) {
  const [lightboxIndex, setLightboxIndex] = useState<number | null>(null)

  if (items.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-20 text-center">
        <svg className="w-12 h-12 text-cream mb-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 15.75l5.159-5.159a2.25 2.25 0 013.182 0l5.159 5.159m-1.5-1.5l1.409-1.409a2.25 2.25 0 013.182 0l2.909 2.909m-18 3.75h16.5a1.5 1.5 0 001.5-1.5V6a1.5 1.5 0 00-1.5-1.5H3.75A1.5 1.5 0 002.25 6v12a1.5 1.5 0 001.5 1.5zm10.5-11.25h.008v.008h-.008V8.25zm.375 0a.375.375 0 11-.75 0 .375.375 0 01.75 0z" />
        </svg>
        <p className="font-serif text-lg text-forest">No photos yet</p>
        <p className="text-sm text-mink mt-1">Be the first to upload!</p>
      </div>
    )
  }

  const activeItem = lightboxIndex !== null ? items[lightboxIndex] : null

  return (
    <>
      <div className={cn('gap-3', COLUMN_CLASSES[columns])}>
        {items.map((item, index) => (
          <button
            key={item.id}
            onClick={() => setLightboxIndex(index)}
            className="relative block w-full mb-3 break-inside-avoid group cursor-zoom-in"
          >
            {/* Image */}
            <img
              src={item.public_url}
              alt={item.caption ?? `Photo by ${item.uploader?.username ?? 'a member'}`}
              className="w-full rounded-xl object-cover block transition-transform duration-300 group-hover:brightness-90"
              loading="lazy"
            />

            {/* Caption overlay */}
            {item.caption && (
              <div className="absolute inset-0 rounded-xl bg-gradient-to-t from-forest/70 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-200 flex items-end p-3">
                <p className="text-xs text-ivory line-clamp-2 text-left">{item.caption}</p>
              </div>
            )}
          </button>
        ))}
      </div>

      {/* Uploader names are shown below each item — rendered as overlay for accessibility */}
      {/* Note: because masonry is CSS columns, we embed uploader inside each tile above */}

      {/* Lightbox */}
      {activeItem !== null && lightboxIndex !== null && (
        <div
          className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4"
          onClick={() => setLightboxIndex(null)}
        >
          <div
            className="relative max-w-4xl w-full bg-white rounded-2xl overflow-hidden shadow-2xl"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Close */}
            <button
              onClick={() => setLightboxIndex(null)}
              className="absolute top-3 right-3 z-10 w-8 h-8 bg-black/40 hover:bg-black/60 rounded-full flex items-center justify-center text-white transition-colors"
              aria-label="Close"
            >
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>

            {/* Prev */}
            {lightboxIndex > 0 && (
              <button
                onClick={() => setLightboxIndex((i) => (i !== null ? i - 1 : null))}
                className="absolute left-3 top-1/2 -translate-y-1/2 z-10 w-9 h-9 bg-black/40 hover:bg-black/60 rounded-full flex items-center justify-center text-white transition-colors"
                aria-label="Previous"
              >
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 19.5L8.25 12l7.5-7.5" />
                </svg>
              </button>
            )}

            {/* Next */}
            {lightboxIndex < items.length - 1 && (
              <button
                onClick={() => setLightboxIndex((i) => (i !== null ? i + 1 : null))}
                className="absolute right-3 top-1/2 -translate-y-1/2 z-10 w-9 h-9 bg-black/40 hover:bg-black/60 rounded-full flex items-center justify-center text-white transition-colors"
                aria-label="Next"
              >
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M8.25 4.5l7.5 7.5-7.5 7.5" />
                </svg>
              </button>
            )}

            {/* Image */}
            <img
              src={activeItem.public_url}
              alt={activeItem.caption ?? `Photo by ${activeItem.uploader?.username ?? 'a member'}`}
              className="w-full max-h-[75vh] object-contain bg-black"
            />

            {/* Footer */}
            <div className="px-5 py-4 flex items-start justify-between gap-4">
              <div>
                {activeItem.caption && (
                  <p className="text-sm text-forest">{activeItem.caption}</p>
                )}
                {activeItem.uploader && (
                  <p className="text-xs text-mink mt-1">
                    Uploaded by{' '}
                    <span className="font-medium text-forest">
                      @{activeItem.uploader.username}
                    </span>
                  </p>
                )}
              </div>
              <span className="text-xs text-mink shrink-0 mt-0.5">
                {lightboxIndex + 1} / {items.length}
              </span>
            </div>
          </div>
        </div>
      )}
    </>
  )
}
