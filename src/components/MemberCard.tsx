import Image from 'next/image'
import Link from 'next/link'
import { Profile, MembershipTier } from '@/lib/types'
import { cn, getInitials } from '@/lib/utils'

interface MemberCardProps {
  member: Profile
}

function TierBadge({ tier }: { tier: MembershipTier }) {
  if (tier === 'founding') {
    return (
      <span className="inline-flex items-center rounded-full bg-rose px-2.5 py-0.5 text-xs font-medium text-ivory">
        Founding Member
      </span>
    )
  }
  if (tier === 'member') {
    return (
      <span className="inline-flex items-center rounded-full bg-forest px-2.5 py-0.5 text-xs font-medium text-ivory">
        Member
      </span>
    )
  }
  if (tier === 'admin') {
    return (
      <span className="inline-flex items-center rounded-full bg-forest px-2.5 py-0.5 text-xs font-medium text-ivory">
        Admin
      </span>
    )
  }
  return (
    <span className="inline-flex items-center rounded-full bg-mink/20 px-2.5 py-0.5 text-xs font-medium text-mink">
      Pending
    </span>
  )
}

function VerifiedIcon() {
  return (
    <svg
      className="h-4 w-4 text-rose"
      viewBox="0 0 20 20"
      fill="currentColor"
      aria-label="Verified"
    >
      <path
        fillRule="evenodd"
        d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.857-9.809a.75.75 0 00-1.214-.882l-3.483 4.79-1.88-1.88a.75.75 0 10-1.06 1.061l2.5 2.5a.75.75 0 001.137-.089l4-5.5z"
        clipRule="evenodd"
      />
    </svg>
  )
}

function LocationIcon() {
  return (
    <svg
      className="h-3.5 w-3.5 shrink-0 text-mink"
      viewBox="0 0 20 20"
      fill="currentColor"
    >
      <path
        fillRule="evenodd"
        d="M9.69 18.933l.003.001C9.89 19.02 10 19 10 19s.11.02.308-.066l.002-.001.006-.003.018-.008a5.741 5.741 0 00.281-.14c.186-.096.446-.24.757-.433.62-.387 1.445-.966 2.274-1.765C15.302 14.988 17 12.493 17 9A7 7 0 103 9c0 3.492 1.698 5.988 3.355 7.584a13.731 13.731 0 002.273 1.765 11.842 11.842 0 00.976.544l.062.029.018.008.006.003zM10 11.25a2.25 2.25 0 100-4.5 2.25 2.25 0 000 4.5z"
        clipRule="evenodd"
      />
    </svg>
  )
}

export default function MemberCard({ member }: MemberCardProps) {
  const initials = getInitials(member.full_name)

  return (
    <Link href={`/members/${member.id}`} className="block group">
      <div className="card p-5 transition-shadow group-hover:shadow-md">
        <div className="flex items-start gap-4">
          <div className="relative shrink-0">
            {member.avatar_url ? (
              <Image
                src={member.avatar_url}
                alt={member.full_name}
                width={56}
                height={56}
                className="h-14 w-14 rounded-full object-cover"
              />
            ) : (
              <div className="flex h-14 w-14 items-center justify-center rounded-full bg-forest text-ivory font-serif text-lg font-semibold">
                {initials}
              </div>
            )}
            {member.is_verified && (
              <span className="absolute -bottom-0.5 -right-0.5 rounded-full bg-ivory">
                <VerifiedIcon />
              </span>
            )}
          </div>

          <div className="min-w-0 flex-1">
            <div className="flex items-center gap-2 flex-wrap">
              <h3 className="font-serif text-lg font-semibold text-forest leading-tight truncate">
                {member.full_name}
              </h3>
            </div>
            <p className="text-sm text-mink mt-0.5">@{member.username}</p>

            <div className="mt-2 flex items-center gap-2 flex-wrap">
              <TierBadge tier={member.tier} />
            </div>

            {member.location && (
              <div className="mt-2 flex items-center gap-1">
                <LocationIcon />
                <span className="text-xs text-mink truncate">{member.location}</span>
              </div>
            )}
          </div>
        </div>
      </div>
    </Link>
  )
}
