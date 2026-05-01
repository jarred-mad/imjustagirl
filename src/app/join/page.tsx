'use client'

import { useState, useTransition } from 'react'
import Link from 'next/link'
import { signUp } from '@/app/(auth)/actions'

type Tier = 'member' | 'founding'

export default function JoinPage() {
  const [isPending, startTransition] = useTransition()
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState<string | null>(null)
  const [selectedTier, setSelectedTier] = useState<Tier>('member')
  const [passwordError, setPasswordError] = useState<string | null>(null)

  function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    setError(null)
    setPasswordError(null)

    const form = e.currentTarget
    const formData = new FormData(form)
    const password = formData.get('password') as string
    const confirm = formData.get('confirmPassword') as string

    if (password !== confirm) {
      setPasswordError('Passwords do not match.')
      return
    }

    // Normalize username before sending
    formData.set('username', (formData.get('username') as string).toLowerCase().replace(/\s+/g, ''))
    formData.set('tier', selectedTier)

    startTransition(async () => {
      const result = await signUp(null, formData)
      if ('error' in result) {
        setError(result.error)
      } else {
        setSuccess(result.message ?? 'Application submitted!')
        form.reset()
      }
    })
  }

  return (
    <div className="min-h-screen flex">
      {/* Left panel — brand messaging */}
      <div className="hidden lg:flex lg:w-1/2 bg-forest flex-col justify-between p-12 relative overflow-hidden">
        {/* Decorative circle */}
        <div className="absolute -top-32 -right-32 w-96 h-96 rounded-full bg-forest-deep opacity-60" />
        <div className="absolute -bottom-20 -left-20 w-64 h-64 rounded-full bg-forest-deep opacity-40" />

        <div className="relative z-10">
          <p className="font-sans text-blush text-xs tracking-[0.25em] uppercase mb-3">
            Membership
          </p>
          <h1 className="font-serif text-ivory text-4xl xl:text-5xl leading-tight">
            IMJUSTAGIRL.<br />Social Club
          </h1>
          <p className="mt-4 text-cream/70 text-sm leading-relaxed max-w-xs">
            A private community for women who move with intention, build with purpose, and show up for each other.
          </p>
        </div>

        <div className="relative z-10 space-y-6">
          {[
            {
              icon: '◆',
              title: 'Curated Events',
              body: 'Dinners, salons, and intimate gatherings designed around the women who attend.',
            },
            {
              icon: '◆',
              title: 'Real Community',
              body: 'A private forum and direct messaging — no algorithm, no noise, just connection.',
            },
            {
              icon: '◆',
              title: 'Members-Only Access',
              body: 'Early event access, exclusive editorial content, and a business directory built by and for members.',
            },
          ].map(({ icon, title, body }) => (
            <div key={title} className="flex gap-4">
              <span className="text-blush text-xs mt-1 shrink-0">{icon}</span>
              <div>
                <p className="font-sans text-ivory text-sm font-medium">{title}</p>
                <p className="text-cream/60 text-sm mt-0.5 leading-relaxed">{body}</p>
              </div>
            </div>
          ))}
        </div>

        <p className="relative z-10 text-cream/40 text-xs">
          &copy; {new Date().getFullYear()} IMJUSTAGIRL. Social Club
        </p>
      </div>

      {/* Right panel — form */}
      <div className="flex-1 flex items-center justify-center p-6 sm:p-10 bg-ivory overflow-y-auto">
        <div className="w-full max-w-md py-8">
          {/* Mobile brand mark */}
          <div className="lg:hidden mb-8 text-center">
            <p className="font-serif text-forest text-2xl">IMJUSTAGIRL.</p>
            <p className="text-mink text-xs tracking-widest uppercase mt-1">Social Club</p>
          </div>

          <h2 className="font-serif text-3xl text-forest">Apply for membership</h2>
          <p className="text-mink text-sm mt-2">
            Tell us a little about yourself. We&apos;ll be in touch.
          </p>

          {success ? (
            <div className="mt-8 card p-6 text-center">
              <div className="w-12 h-12 rounded-full bg-forest/10 flex items-center justify-center mx-auto mb-4">
                <span className="text-forest text-xl">✓</span>
              </div>
              <h3 className="font-serif text-forest text-xl mb-2">Application received</h3>
              <p className="text-mink text-sm leading-relaxed">{success}</p>
              <Link
                href="/login"
                className="inline-block mt-6 text-sm text-forest underline underline-offset-4"
              >
                Back to sign in
              </Link>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="mt-8 space-y-5" noValidate>
              {/* Full Name */}
              <div>
                <label htmlFor="full_name" className="label">
                  Full Name
                </label>
                <input
                  id="full_name"
                  name="full_name"
                  type="text"
                  autoComplete="name"
                  required
                  placeholder="Jane Smith"
                  className="input"
                />
              </div>

              {/* Username */}
              <div>
                <label htmlFor="username" className="label">
                  Username
                </label>
                <div className="relative">
                  <span className="absolute left-4 top-1/2 -translate-y-1/2 text-mink text-sm select-none">
                    @
                  </span>
                  <input
                    id="username"
                    name="username"
                    type="text"
                    autoComplete="username"
                    required
                    placeholder="janesmith"
                    pattern="[a-z0-9._]+"
                    title="Lowercase letters, numbers, periods, and underscores only"
                    className="input pl-8"
                  />
                </div>
                <p className="text-mink/70 text-xs mt-1.5">Lowercase, no spaces.</p>
              </div>

              {/* Email */}
              <div>
                <label htmlFor="email" className="label">
                  Email
                </label>
                <input
                  id="email"
                  name="email"
                  type="email"
                  autoComplete="email"
                  required
                  placeholder="jane@example.com"
                  className="input"
                />
              </div>

              {/* Password */}
              <div>
                <label htmlFor="password" className="label">
                  Password
                </label>
                <input
                  id="password"
                  name="password"
                  type="password"
                  autoComplete="new-password"
                  required
                  minLength={8}
                  placeholder="At least 8 characters"
                  className="input"
                />
              </div>

              {/* Confirm Password */}
              <div>
                <label htmlFor="confirmPassword" className="label">
                  Confirm Password
                </label>
                <input
                  id="confirmPassword"
                  name="confirmPassword"
                  type="password"
                  autoComplete="new-password"
                  required
                  placeholder="Repeat your password"
                  className={`input ${passwordError ? 'border-rose focus:border-rose focus:ring-rose/20' : ''}`}
                />
                {passwordError && (
                  <p className="text-rose text-xs mt-1.5">{passwordError}</p>
                )}
              </div>

              {/* Tier Selection */}
              <div>
                <p className="label">Membership Tier</p>
                <div className="grid grid-cols-2 gap-3 mt-1">
                  {(
                    [
                      {
                        value: 'member' as Tier,
                        label: 'Member',
                        description: 'Full access to events and community.',
                        badge: null,
                      },
                      {
                        value: 'founding' as Tier,
                        label: 'Founding Member',
                        description: 'Lifetime perks and founding recognition.',
                        badge: 'Limited',
                      },
                    ] as const
                  ).map(({ value, label, description, badge }) => (
                    <button
                      key={value}
                      type="button"
                      onClick={() => setSelectedTier(value)}
                      className={[
                        'relative text-left rounded-xl border-2 p-4 transition-colors duration-200',
                        selectedTier === value
                          ? 'border-forest bg-forest/5'
                          : 'border-mink/20 bg-white hover:border-mink/40',
                      ].join(' ')}
                    >
                      {badge && (
                        <span className="absolute top-3 right-3 text-[10px] font-medium tracking-wider uppercase bg-blush/20 text-blush px-2 py-0.5 rounded-full">
                          {badge}
                        </span>
                      )}
                      <div
                        className={[
                          'w-4 h-4 rounded-full border-2 mb-3 flex items-center justify-center',
                          selectedTier === value ? 'border-forest' : 'border-mink/40',
                        ].join(' ')}
                      >
                        {selectedTier === value && (
                          <div className="w-2 h-2 rounded-full bg-forest" />
                        )}
                      </div>
                      <p className="font-sans text-sm font-medium text-forest">{label}</p>
                      <p className="text-mink text-xs mt-1 leading-relaxed">{description}</p>
                    </button>
                  ))}
                </div>
              </div>

              {/* Server error */}
              {error && (
                <div className="rounded-xl bg-rose/10 border border-rose/20 px-4 py-3">
                  <p className="text-rose text-sm">{error}</p>
                </div>
              )}

              <button
                type="submit"
                disabled={isPending}
                className="btn-rose w-full mt-2"
              >
                {isPending ? 'Submitting…' : 'Apply Now'}
              </button>

              <p className="text-center text-mink text-sm pt-2">
                Already a member?{' '}
                <Link
                  href="/login"
                  className="text-forest font-medium underline underline-offset-4 hover:text-forest-deep"
                >
                  Sign in
                </Link>
              </p>
            </form>
          )}
        </div>
      </div>
    </div>
  )
}
