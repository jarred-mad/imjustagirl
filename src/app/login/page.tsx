'use client'

import { useState, useTransition } from 'react'
import Link from 'next/link'
import { useRouter, useSearchParams } from 'next/navigation'
import { signIn } from '@/app/(auth)/actions'

export default function LoginPage() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const redirectTo = searchParams.get('redirectTo') ?? '/dashboard'

  const [isPending, startTransition] = useTransition()
  const [error, setError] = useState<string | null>(null)
  const [showPassword, setShowPassword] = useState(false)

  function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    setError(null)

    const formData = new FormData(e.currentTarget)

    startTransition(async () => {
      try {
        // signIn redirects on success; if it returns, it's an error
        const result = await signIn(null, formData)
        if ('error' in result) {
          setError(result.error)
        } else {
          router.push(redirectTo)
        }
      } catch (err: unknown) {
        // next/navigation redirect() throws a special error — let it propagate
        if (
          err &&
          typeof err === 'object' &&
          'digest' in err &&
          typeof (err as { digest: string }).digest === 'string' &&
          (err as { digest: string }).digest.startsWith('NEXT_REDIRECT')
        ) {
          router.push(redirectTo)
          return
        }
        setError('An unexpected error occurred. Please try again.')
      }
    })
  }

  return (
    <div className="min-h-screen bg-ivory flex flex-col items-center justify-center p-6">
      <div className="w-full max-w-md">
        {/* Logo mark */}
        <div className="flex flex-col items-center mb-10">
          <div className="w-14 h-14 rounded-full bg-forest flex items-center justify-center mb-4">
            <span className="font-serif text-ivory text-xl leading-none">IG</span>
          </div>
          <p className="font-serif text-forest text-sm tracking-[0.2em] uppercase">
            IMJUSTAGIRL.
          </p>
        </div>

        <div className="card p-8">
          <h1 className="font-serif text-3xl text-forest mb-1">Welcome back</h1>
          <p className="text-mink text-sm mb-8">Sign in to your membership.</p>

          <form onSubmit={handleSubmit} noValidate className="space-y-5">
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
              <div className="flex items-center justify-between mb-1.5">
                <label htmlFor="password" className="label mb-0">
                  Password
                </label>
                <button
                  type="button"
                  className="text-mink text-xs hover:text-forest transition-colors"
                  onClick={() => setShowPassword((prev) => !prev)}
                >
                  {showPassword ? 'Hide' : 'Show'}
                </button>
              </div>
              <input
                id="password"
                name="password"
                type={showPassword ? 'text' : 'password'}
                autoComplete="current-password"
                required
                placeholder="Your password"
                className="input"
              />
            </div>

            {/* Forgot password */}
            <div className="flex justify-end -mt-1">
              <Link
                href="/forgot-password"
                className="text-xs text-mink hover:text-forest underline underline-offset-4 transition-colors"
              >
                Forgot password?
              </Link>
            </div>

            {/* Error message */}
            {error && (
              <div className="rounded-xl bg-rose/10 border border-rose/20 px-4 py-3">
                <p className="text-rose text-sm">{error}</p>
              </div>
            )}

            <button
              type="submit"
              disabled={isPending}
              className="btn-primary w-full"
            >
              {isPending ? 'Signing in…' : 'Sign In'}
            </button>
          </form>
        </div>

        <p className="text-center text-mink text-sm mt-6">
          Not a member yet?{' '}
          <Link
            href="/join"
            className="text-forest font-medium underline underline-offset-4 hover:text-forest-deep"
          >
            Apply &rarr;
          </Link>
        </p>
      </div>
    </div>
  )
}
