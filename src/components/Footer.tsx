import Link from 'next/link'

const NAVIGATE_LINKS = [
  { label: 'Home', href: '/' },
  { label: 'Events', href: '/events' },
  { label: 'About', href: '/about' },
  { label: 'Shop the Club', href: '/shop' },
]

const MEMBER_LINKS = [
  { label: 'Dashboard', href: '/dashboard' },
  { label: 'Forum', href: '/forum' },
  { label: 'Messages', href: '/messages' },
]

const LEGAL_LINKS = [
  { label: 'Privacy', href: '/privacy' },
  { label: 'Terms', href: '/terms' },
]

export default function Footer() {
  const currentYear = new Date().getFullYear()

  return (
    <footer className="bg-forest text-ivory">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-14">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-10 pb-10 border-b border-ivory/10">
          {/* Brand */}
          <div className="md:col-span-1">
            <Link href="/" className="font-serif text-xl tracking-tight hover:opacity-80 transition-opacity">
              IMJUSTAGIRL.
            </Link>
            <p className="mt-3 text-sm text-ivory/60 font-sans leading-relaxed">
              For women who move with intention.
            </p>
          </div>

          {/* Navigate */}
          <div>
            <p className="label text-ivory/40 mb-4">Navigate</p>
            <ul className="space-y-3">
              {NAVIGATE_LINKS.map((link) => (
                <li key={link.href}>
                  <Link
                    href={link.href}
                    className="text-sm text-ivory/70 hover:text-ivory transition-colors duration-200"
                  >
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Members */}
          <div>
            <p className="label text-ivory/40 mb-4">Members</p>
            <ul className="space-y-3">
              {MEMBER_LINKS.map((link) => (
                <li key={link.href}>
                  <Link
                    href={link.href}
                    className="text-sm text-ivory/70 hover:text-ivory transition-colors duration-200"
                  >
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Legal */}
          <div>
            <p className="label text-ivory/40 mb-4">Legal</p>
            <ul className="space-y-3">
              {LEGAL_LINKS.map((link) => (
                <li key={link.href}>
                  <Link
                    href={link.href}
                    className="text-sm text-ivory/70 hover:text-ivory transition-colors duration-200"
                  >
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>
        </div>

        <div className="pt-6 flex flex-col sm:flex-row items-center justify-between gap-2">
          <p className="text-xs text-ivory/40 font-sans">
            &copy; {currentYear} IMJUSTAGIRL. Social Club. All rights reserved.
          </p>
          <p className="text-xs text-ivory/30 font-sans">Made with intention.</p>
        </div>
      </div>
    </footer>
  )
}
