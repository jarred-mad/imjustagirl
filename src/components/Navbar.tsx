'use client'

import { useState, useRef, useEffect } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { useAuth } from '@/contexts/AuthContext'
import { getInitials, cn } from '@/lib/utils'

const NAV_LINKS = [
  { label: 'Home', href: '/' },
  { label: 'Events', href: '/events' },
  { label: 'Past Events', href: '/events/past' },
  { label: 'About', href: '/about' },
  { label: 'Shop the Club', href: '/shop' },
]

export default function Navbar() {
  const { user, profile, signOut, isLoading } = useAuth()
  const router = useRouter()
  const [mobileOpen, setMobileOpen] = useState(false)
  const [dropdownOpen, setDropdownOpen] = useState(false)
  const dropdownRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setDropdownOpen(false)
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  async function handleSignOut() {
    setDropdownOpen(false)
    setMobileOpen(false)
    await signOut()
    router.push('/')
  }

  const avatarUrl = profile?.avatar_url
  const displayName = profile?.username ?? profile?.full_name ?? 'Member'
  const initials = getInitials(profile?.full_name ?? profile?.username ?? 'M')

  return (
    <header className="sticky top-0 z-50 bg-white border-b border-cream">
      <nav className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Brand */}
          <Link
            href="/"
            className="font-serif text-xl text-forest tracking-tight hover:opacity-80 transition-opacity"
          >
            IMJUSTAGIRL.
          </Link>

          {/* Desktop nav */}
          <ul className="hidden md:flex items-center gap-7">
            {NAV_LINKS.map((link) => (
              <li key={link.href}>
                <Link
                  href={link.href}
                  className="text-sm text-forest/70 hover:text-forest transition-colors duration-200 font-sans"
                >
                  {link.label}
                </Link>
              </li>
            ))}
          </ul>

          {/* Desktop auth controls */}
          <div className="hidden md:flex items-center gap-4">
            {isLoading ? (
              <div className="w-8 h-8 rounded-full bg-cream animate-pulse" />
            ) : user ? (
              <div className="relative" ref={dropdownRef}>
                <button
                  onClick={() => setDropdownOpen((prev) => !prev)}
                  className="flex items-center gap-2 group"
                  aria-expanded={dropdownOpen}
                  aria-haspopup="true"
                >
                  {avatarUrl ? (
                    <img
                      src={avatarUrl}
                      alt={displayName}
                      className="w-8 h-8 rounded-full object-cover border border-cream"
                    />
                  ) : (
                    <span className="w-8 h-8 rounded-full bg-forest text-ivory text-xs font-medium flex items-center justify-center">
                      {initials}
                    </span>
                  )}
                  <span className="text-sm text-forest font-sans group-hover:text-forest/70 transition-colors">
                    {displayName}
                  </span>
                  <svg
                    className={cn(
                      'w-4 h-4 text-mink transition-transform duration-200',
                      dropdownOpen && 'rotate-180'
                    )}
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                    strokeWidth={2}
                  >
                    <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
                  </svg>
                </button>

                {dropdownOpen && (
                  <div className="absolute right-0 mt-2 w-48 bg-white rounded-2xl shadow-lg border border-cream py-1 text-sm">
                    <Link
                      href="/dashboard"
                      onClick={() => setDropdownOpen(false)}
                      className="block px-4 py-2.5 text-forest hover:bg-ivory transition-colors"
                    >
                      Dashboard
                    </Link>
                    <Link
                      href="/profile"
                      onClick={() => setDropdownOpen(false)}
                      className="block px-4 py-2.5 text-forest hover:bg-ivory transition-colors"
                    >
                      Profile
                    </Link>
                    <div className="my-1 border-t border-cream" />
                    <button
                      onClick={handleSignOut}
                      className="w-full text-left px-4 py-2.5 text-rose hover:bg-ivory transition-colors"
                    >
                      Sign Out
                    </button>
                  </div>
                )}
              </div>
            ) : (
              <>
                <Link href="/auth/login" className="text-sm text-forest hover:text-forest/70 transition-colors font-sans">
                  Log in
                </Link>
                <Link href="/auth/join" className="btn-rose text-sm px-5 py-2">
                  Join
                </Link>
              </>
            )}
          </div>

          {/* Mobile hamburger */}
          <button
            className="md:hidden p-2 text-forest hover:text-forest/70 transition-colors"
            onClick={() => setMobileOpen((prev) => !prev)}
            aria-label="Toggle menu"
            aria-expanded={mobileOpen}
          >
            {mobileOpen ? (
              <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
              </svg>
            ) : (
              <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M4 6h16M4 12h16M4 18h16" />
              </svg>
            )}
          </button>
        </div>
      </nav>

      {/* Mobile menu */}
      {mobileOpen && (
        <div className="md:hidden bg-white border-t border-cream px-4 pb-4 pt-2">
          <ul className="space-y-1">
            {NAV_LINKS.map((link) => (
              <li key={link.href}>
                <Link
                  href={link.href}
                  onClick={() => setMobileOpen(false)}
                  className="block py-2.5 text-sm text-forest hover:text-forest/70 transition-colors"
                >
                  {link.label}
                </Link>
              </li>
            ))}
          </ul>

          <div className="mt-4 pt-4 border-t border-cream">
            {isLoading ? (
              <div className="h-10 rounded-full bg-cream animate-pulse" />
            ) : user ? (
              <div className="space-y-1">
                <div className="flex items-center gap-3 py-2">
                  {avatarUrl ? (
                    <img
                      src={avatarUrl}
                      alt={displayName}
                      className="w-8 h-8 rounded-full object-cover border border-cream"
                    />
                  ) : (
                    <span className="w-8 h-8 rounded-full bg-forest text-ivory text-xs font-medium flex items-center justify-center">
                      {initials}
                    </span>
                  )}
                  <span className="text-sm font-medium text-forest">{displayName}</span>
                </div>
                <Link
                  href="/dashboard"
                  onClick={() => setMobileOpen(false)}
                  className="block py-2.5 text-sm text-forest hover:text-forest/70 transition-colors"
                >
                  Dashboard
                </Link>
                <Link
                  href="/profile"
                  onClick={() => setMobileOpen(false)}
                  className="block py-2.5 text-sm text-forest hover:text-forest/70 transition-colors"
                >
                  Profile
                </Link>
                <button
                  onClick={handleSignOut}
                  className="block w-full text-left py-2.5 text-sm text-rose hover:text-rose/80 transition-colors"
                >
                  Sign Out
                </button>
              </div>
            ) : (
              <div className="flex flex-col gap-3">
                <Link href="/auth/join" className="btn-rose text-center text-sm py-2.5">
                  Join
                </Link>
                <Link
                  href="/auth/login"
                  onClick={() => setMobileOpen(false)}
                  className="text-center text-sm text-forest hover:text-forest/70 transition-colors py-1"
                >
                  Log in
                </Link>
              </div>
            )}
          </div>
        </div>
      )}
    </header>
  )
}
