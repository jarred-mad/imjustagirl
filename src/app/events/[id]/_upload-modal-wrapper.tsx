'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import UploadModal from '@/components/UploadModal'

interface UploadModalWrapperProps {
  eventId: string
}

export default function UploadModalWrapper({ eventId }: UploadModalWrapperProps) {
  const router = useRouter()
  const [open, setOpen] = useState(false)

  return (
    <>
      <button onClick={() => setOpen(true)} className="btn-secondary text-sm px-5 py-2.5">
        Upload Photos
      </button>
      <UploadModal
        eventId={eventId}
        isOpen={open}
        onClose={() => setOpen(false)}
        onSuccess={() => {
          setOpen(false)
          router.refresh()
        }}
      />
    </>
  )
}
