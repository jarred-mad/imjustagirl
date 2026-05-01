'use client'

import { useState, useRef, useCallback } from 'react'
import { createClient } from '@/lib/supabase'
import { useAuth } from '@/contexts/AuthContext'
import { cn } from '@/lib/utils'

interface UploadModalProps {
  eventId: string
  isOpen: boolean
  onClose: () => void
  onSuccess: () => void
}

interface PendingFile {
  id: string
  file: File
  previewUrl: string
  caption: string
}

type UploadState = 'idle' | 'uploading' | 'success' | 'error'

const ACCEPTED_TYPES = ['image/jpeg', 'image/png', 'image/webp', 'image/gif']
const MAX_FILE_SIZE_MB = 10

function isAcceptedType(file: File) {
  return ACCEPTED_TYPES.includes(file.type)
}

function isAcceptedSize(file: File) {
  return file.size <= MAX_FILE_SIZE_MB * 1024 * 1024
}

export default function UploadModal({ eventId, isOpen, onClose, onSuccess }: UploadModalProps) {
  const { user } = useAuth()
  const supabase = createClient()

  const [pendingFiles, setPendingFiles] = useState<PendingFile[]>([])
  const [uploadState, setUploadState] = useState<UploadState>('idle')
  const [errorMessage, setErrorMessage] = useState<string | null>(null)
  const [isDragging, setIsDragging] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)

  function addFiles(incoming: FileList | File[]) {
    const valid: PendingFile[] = []
    const rejected: string[] = []

    Array.from(incoming).forEach((file) => {
      if (!isAcceptedType(file)) {
        rejected.push(`${file.name}: unsupported type`)
        return
      }
      if (!isAcceptedSize(file)) {
        rejected.push(`${file.name}: exceeds ${MAX_FILE_SIZE_MB}MB`)
        return
      }
      valid.push({
        id: `${file.name}-${file.lastModified}-${Math.random()}`,
        file,
        previewUrl: URL.createObjectURL(file),
        caption: '',
      })
    })

    if (rejected.length > 0) {
      setErrorMessage(`Skipped: ${rejected.join('; ')}`)
    } else {
      setErrorMessage(null)
    }

    setPendingFiles((prev) => [...prev, ...valid])
  }

  function removeFile(id: string) {
    setPendingFiles((prev) => {
      const removed = prev.find((f) => f.id === id)
      if (removed) URL.revokeObjectURL(removed.previewUrl)
      return prev.filter((f) => f.id !== id)
    })
  }

  function updateCaption(id: string, caption: string) {
    setPendingFiles((prev) =>
      prev.map((f) => (f.id === id ? { ...f, caption } : f))
    )
  }

  const onDrop = useCallback((e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault()
    setIsDragging(false)
    if (e.dataTransfer.files.length > 0) {
      addFiles(e.dataTransfer.files)
    }
  }, [])

  const onDragOver = useCallback((e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault()
    setIsDragging(true)
  }, [])

  const onDragLeave = useCallback((e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault()
    setIsDragging(false)
  }, [])

  async function handleUpload() {
    if (!user || pendingFiles.length === 0) return

    setUploadState('uploading')
    setErrorMessage(null)

    try {
      for (const pending of pendingFiles) {
        const ext = pending.file.name.split('.').pop() ?? 'jpg'
        const filename = `${Date.now()}-${Math.random().toString(36).slice(2)}.${ext}`
        const storagePath = `${eventId}/${user.id}/${filename}`

        const { error: storageError } = await supabase.storage
          .from('event-media')
          .upload(storagePath, pending.file, {
            contentType: pending.file.type,
            upsert: false,
          })

        if (storageError) throw new Error(`Upload failed for ${pending.file.name}: ${storageError.message}`)

        const { data: urlData } = supabase.storage
          .from('event-media')
          .getPublicUrl(storagePath)

        const { error: dbError } = await supabase.from('media').insert({
          event_id: eventId,
          uploaded_by: user.id,
          media_type: 'photo',
          storage_path: storagePath,
          public_url: urlData.publicUrl,
          caption: pending.caption.trim() || null,
          is_approved: false,
        })

        if (dbError) throw new Error(`Failed to save record for ${pending.file.name}: ${dbError.message}`)
      }

      // Clean up preview URLs
      pendingFiles.forEach((f) => URL.revokeObjectURL(f.previewUrl))
      setPendingFiles([])
      setUploadState('success')

      setTimeout(() => {
        onSuccess()
        handleClose()
      }, 1200)
    } catch (err) {
      setErrorMessage(err instanceof Error ? err.message : 'Upload failed. Please try again.')
      setUploadState('error')
    }
  }

  function handleClose() {
    if (uploadState === 'uploading') return
    pendingFiles.forEach((f) => URL.revokeObjectURL(f.previewUrl))
    setPendingFiles([])
    setUploadState('idle')
    setErrorMessage(null)
    onClose()
  }

  if (!isOpen) return null

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
      role="dialog"
      aria-modal="true"
      aria-label="Upload photos"
    >
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/50 backdrop-blur-sm"
        onClick={handleClose}
      />

      {/* Panel */}
      <div className="relative bg-white rounded-2xl shadow-2xl w-full max-w-lg max-h-[90vh] flex flex-col overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-cream shrink-0">
          <h2 className="font-serif text-xl text-forest">Upload Photos</h2>
          <button
            onClick={handleClose}
            disabled={uploadState === 'uploading'}
            className="w-8 h-8 flex items-center justify-center rounded-full hover:bg-cream transition-colors disabled:opacity-40"
            aria-label="Close"
          >
            <svg className="w-4 h-4 text-mink" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Body */}
        <div className="flex-1 overflow-y-auto px-6 py-5 space-y-5">
          {/* Success state */}
          {uploadState === 'success' ? (
            <div className="flex flex-col items-center justify-center py-12 text-center">
              <div className="w-14 h-14 rounded-full bg-forest/10 flex items-center justify-center mb-4">
                <svg className="w-7 h-7 text-forest" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M4.5 12.75l6 6 9-13.5" />
                </svg>
              </div>
              <p className="font-serif text-lg text-forest">Photos uploaded!</p>
              <p className="text-sm text-mink mt-1">They'll appear once approved.</p>
            </div>
          ) : (
            <>
              {/* Drop zone */}
              <div
                onDrop={onDrop}
                onDragOver={onDragOver}
                onDragLeave={onDragLeave}
                onClick={() => fileInputRef.current?.click()}
                className={cn(
                  'border-2 border-dashed rounded-xl p-8 text-center cursor-pointer transition-colors duration-200',
                  isDragging
                    ? 'border-forest bg-forest/5'
                    : 'border-mink/30 hover:border-forest hover:bg-ivory'
                )}
              >
                <input
                  ref={fileInputRef}
                  type="file"
                  accept={ACCEPTED_TYPES.join(',')}
                  multiple
                  className="sr-only"
                  onChange={(e) => e.target.files && addFiles(e.target.files)}
                />
                <svg className="w-9 h-9 text-mink/50 mx-auto mb-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M3 16.5v2.25A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75V16.5m-13.5-9L12 3m0 0l4.5 4.5M12 3v13.5" />
                </svg>
                <p className="text-sm font-medium text-forest">
                  {isDragging ? 'Drop to add' : 'Drag photos here or click to browse'}
                </p>
                <p className="text-xs text-mink mt-1">JPG, PNG, WebP, GIF &middot; max {MAX_FILE_SIZE_MB}MB each</p>
              </div>

              {/* File previews */}
              {pendingFiles.length > 0 && (
                <ul className="space-y-3">
                  {pendingFiles.map((pending) => (
                    <li key={pending.id} className="flex gap-3 items-start">
                      <img
                        src={pending.previewUrl}
                        alt=""
                        className="w-16 h-16 rounded-lg object-cover shrink-0 border border-cream"
                      />
                      <div className="flex-1 min-w-0">
                        <p className="text-xs text-mink truncate mb-1.5">{pending.file.name}</p>
                        <input
                          type="text"
                          placeholder="Add a caption (optional)"
                          value={pending.caption}
                          onChange={(e) => updateCaption(pending.id, e.target.value)}
                          className="input text-sm py-2"
                          maxLength={200}
                        />
                      </div>
                      <button
                        onClick={() => removeFile(pending.id)}
                        className="mt-0.5 w-6 h-6 shrink-0 flex items-center justify-center rounded-full hover:bg-cream transition-colors"
                        aria-label={`Remove ${pending.file.name}`}
                      >
                        <svg className="w-3.5 h-3.5 text-mink" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                          <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                        </svg>
                      </button>
                    </li>
                  ))}
                </ul>
              )}

              {/* Error message */}
              {errorMessage && (
                <p className="text-xs text-rose bg-rose/10 rounded-lg px-3 py-2">{errorMessage}</p>
              )}
            </>
          )}
        </div>

        {/* Footer */}
        {uploadState !== 'success' && (
          <div className="px-6 py-4 border-t border-cream shrink-0 flex items-center justify-between gap-3">
            <p className="text-xs text-mink">
              {pendingFiles.length === 0
                ? 'No files selected'
                : `${pendingFiles.length} file${pendingFiles.length !== 1 ? 's' : ''} ready`}
            </p>
            <div className="flex gap-3">
              <button
                onClick={handleClose}
                disabled={uploadState === 'uploading'}
                className="btn-secondary text-sm px-5 py-2.5 disabled:opacity-40"
              >
                Cancel
              </button>
              <button
                onClick={handleUpload}
                disabled={pendingFiles.length === 0 || uploadState === 'uploading'}
                className="btn-primary text-sm px-5 py-2.5 flex items-center gap-2"
              >
                {uploadState === 'uploading' ? (
                  <>
                    <svg className="w-4 h-4 animate-spin" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v4l3-3-3-3v4a8 8 0 00-8 8h4z" />
                    </svg>
                    Uploading…
                  </>
                ) : (
                  'Upload'
                )}
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
