import Link from 'next/link'
import Navbar from '@/components/Navbar'
import Footer from '@/components/Footer'
import BusinessCard from '@/components/BusinessCard'
import { createClient } from '@/lib/supabase-server'
import { Business } from '@/lib/types'

export const metadata = { title: 'Shop the Club' }

const CATEGORIES = [
  'wellness',
  'fashion',
  'food',
  'creative',
  'beauty',
  'home',
  'finance',
  'fitness',
]

interface Props {
  searchParams: { category?: string }
}

export default async function ShopTheClubPage({ searchParams }: Props) {
  const supabase = await createClient()
  const activeCategory = searchParams.category?.toLowerCase() ?? null

  let query = supabase
    .from('businesses')
    .select(
      'id, owner_id, name, tagline, description, category, logo_url, website_url, instagram_handle, is_featured, is_approved, created_at, updated_at'
    )
    .eq('is_approved', true)
    .order('is_featured', { ascending: false })
    .order('created_at', { ascending: false })

  if (activeCategory) {
    query = query.eq('category', activeCategory)
  }

  const { data, error } = await query
  const businesses: Business[] = error ? [] : (data ?? [])

  return (
    <div className="min-h-screen flex flex-col">
      <Navbar />

      {/* Hero */}
      <section className="bg-cream/40 border-b border-cream py-16 md:py-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <p className="label text-mink mb-3">The Member Directory</p>
          <h1 className="section-heading">Shop the Club</h1>
          <p className="mt-4 text-forest/60 font-sans text-lg max-w-2xl leading-relaxed">
            Businesses owned and loved by our members. Shop small. Support the women in
            your community.
          </p>
        </div>
      </section>

      {/* Filter Bar */}
      <section className="sticky top-16 z-30 bg-ivory border-b border-cream">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-3 overflow-x-auto">
          <div className="flex items-center gap-2 min-w-max">
            <Link
              href="/shop-the-club"
              className={[
                'px-4 py-2 rounded-full text-sm font-sans font-medium transition-colors duration-200 whitespace-nowrap',
                !activeCategory
                  ? 'bg-forest text-ivory'
                  : 'bg-cream text-forest hover:bg-cream/80',
              ].join(' ')}
            >
              All
            </Link>
            {CATEGORIES.map((cat) => (
              <Link
                key={cat}
                href={`/shop-the-club?category=${cat}`}
                className={[
                  'px-4 py-2 rounded-full text-sm font-sans font-medium transition-colors duration-200 capitalize whitespace-nowrap',
                  activeCategory === cat
                    ? 'bg-forest text-ivory'
                    : 'bg-cream text-forest hover:bg-cream/80',
                ].join(' ')}
              >
                {cat}
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* Business Grid */}
      <section className="flex-1 py-12 md:py-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          {businesses.length > 0 ? (
            <>
              {activeCategory && (
                <p className="text-sm text-mink font-sans mb-8 capitalize">
                  Showing{' '}
                  <span className="font-medium text-forest">{businesses.length}</span>{' '}
                  {activeCategory} {businesses.length === 1 ? 'business' : 'businesses'}
                </p>
              )}
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
                {businesses.map((business) => (
                  <BusinessCard key={business.id} business={business} />
                ))}
              </div>
            </>
          ) : (
            <div className="text-center py-24">
              <div className="w-16 h-16 rounded-full bg-cream flex items-center justify-center mx-auto mb-6">
                <span className="text-2xl text-mink">◎</span>
              </div>
              <h3 className="font-serif text-2xl text-forest mb-3">
                {activeCategory
                  ? `No ${activeCategory} businesses yet.`
                  : 'No businesses listed yet.'}
              </h3>
              <p className="text-mink font-sans text-sm mb-8 max-w-sm mx-auto leading-relaxed">
                {activeCategory
                  ? 'Check back soon, or browse all categories.'
                  : 'Are you a member with a business?'}
              </p>
              <div className="flex flex-wrap items-center justify-center gap-3">
                {activeCategory && (
                  <Link href="/shop-the-club" className="btn-secondary">
                    Browse all
                  </Link>
                )}
                <Link href="/dashboard/business/new" className="btn-primary">
                  Submit yours &rarr;
                </Link>
              </div>
            </div>
          )}
        </div>
      </section>

      {/* List Your Business CTA */}
      <section className="bg-forest py-16 md:py-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="max-w-2xl">
            <p className="label text-ivory/40 mb-3 tracking-widest">Members</p>
            <h2 className="font-serif text-3xl md:text-4xl text-ivory leading-tight mb-4">
              Have a business?
              <br />
              Get it in front of the club.
            </h2>
            <p className="text-ivory/60 font-sans leading-relaxed mb-8 max-w-lg">
              If you're a member running a business — a product, a service, a creative
              practice, anything — you can list it here. Our members shop intentionally,
              and they want to buy from you.
            </p>
            <div className="flex flex-wrap items-center gap-4">
              <Link href="/dashboard/business/new" className="btn-rose">
                List your business
              </Link>
              <Link
                href="/auth/join"
                className="text-sm text-ivory/60 hover:text-ivory transition-colors font-sans"
              >
                Not a member yet? Join the club &rarr;
              </Link>
            </div>
          </div>
        </div>
      </section>

      <Footer />
    </div>
  )
}
