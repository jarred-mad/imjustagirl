import Link from 'next/link'
import Navbar from '@/components/Navbar'
import Footer from '@/components/Footer'

export const metadata = { title: 'About' }

const VALUES = [
  {
    icon: '✦',
    title: 'Authenticity',
    description:
      'We show up as ourselves, not as who we think we should be. Real conversations, real connections, and zero performance required.',
  },
  {
    icon: '◈',
    title: 'Community',
    description:
      `The women in this club are your people. We celebrate each other\u2019s wins, hold space in hard seasons, and build something together.`,
  },
  {
    icon: '↑',
    title: 'Elevation',
    description:
      'We are not here to stay the same. Every event, every connection, every resource in this club is designed to move you forward.',
  },
  {
    icon: '◎',
    title: 'Joy',
    description:
      'We take our work seriously. We do not take ourselves too seriously. Pleasure, laughter, and delight are non-negotiable.',
  },
]

const MEMBER_BENEFITS = [
  'Access to all member events',
  'Private member directory',
  'Member-only forum and discussion boards',
  'Early access to event tickets',
  'Monthly digital resources and guides',
  'Discounts with partner businesses',
]

const FOUNDING_BENEFITS = [
  'Everything in the Member tier',
  'Name listed in the founding member roll',
  'Exclusive founding member badge on your profile',
  'Founding tier pricing locked in forever',
  'Private founding member group chat',
  'One complimentary ticket to the annual event',
]

export default async function AboutPage() {
  return (
    <div className="min-h-screen flex flex-col">
      <Navbar />

      {/* Hero */}
      <section className="bg-forest py-24 md:py-32">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <p className="label text-ivory/40 mb-4 tracking-widest">The Social Club</p>
          <h1 className="font-serif text-5xl md:text-6xl lg:text-7xl text-ivory leading-tight">
            About IMJUSTAGIRL.
          </h1>
          <p className="mt-6 text-ivory/70 text-lg md:text-xl font-sans max-w-2xl mx-auto leading-relaxed">
            A private social club for women who are building something real — in their careers,
            their creative work, and their lives.
          </p>
        </div>
      </section>

      {/* Our Story */}
      <section className="py-20 md:py-28 bg-ivory">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-16 items-center">
            <div>
              <p className="label text-mink mb-3">Our Story</p>
              <h2 className="section-heading mb-8">
                Built on a group chat that got too good to ignore.
              </h2>
              <div className="space-y-5 text-forest/80 font-sans leading-relaxed">
                <p>
                  IMJUSTAGIRL. started as a small group of women who kept having the same
                  conversation: where do ambitious, creative, intentional women actually go to meet
                  each other? Not at networking events. Not at industry happy hours. Somewhere
                  real — where people actually talk, actually share, and actually show up for each
                  other.
                </p>
                <p>
                  What began as a handful of dinners and a running text thread became something
                  much bigger. Today, IMJUSTAGIRL. is a curated social club with members across
                  cities — women in fashion, wellness, finance, the arts, entrepreneurship, and
                  everywhere in between. What unites us isn't an industry. It's a way of moving
                  through the world: with purpose, with warmth, and without apology.
                </p>
              </div>
            </div>

            {/* Decorative element */}
            <div className="flex items-center justify-center">
              <div className="relative">
                <div className="w-72 h-72 md:w-80 md:h-80 rounded-full bg-cream flex flex-col items-center justify-center border border-cream shadow-sm">
                  <span className="font-serif text-forest text-6xl md:text-7xl leading-none">
                    Est.
                  </span>
                  <span className="font-serif text-forest text-5xl md:text-6xl leading-none mt-1">
                    2023
                  </span>
                  <div className="mt-4 w-12 h-px bg-blush" />
                  <p className="mt-4 text-xs text-mink uppercase tracking-widest font-sans">
                    Social Club
                  </p>
                </div>
                {/* Accent ring */}
                <div className="absolute -inset-4 rounded-full border border-cream/60 pointer-events-none" />
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* What We Believe */}
      <section className="py-20 md:py-28 bg-cream/30">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-14">
            <p className="label text-mink mb-3">Our Values</p>
            <h2 className="section-heading">What we believe.</h2>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
            {VALUES.map((value) => (
              <div
                key={value.title}
                className="bg-cream rounded-2xl p-8 border border-cream/80"
              >
                <span className="text-2xl text-blush leading-none">{value.icon}</span>
                <h3 className="font-serif text-xl text-forest mt-4 mb-3">{value.title}</h3>
                <p className="text-sm text-forest/70 font-sans leading-relaxed">
                  {value.description}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Meet the Founder */}
      <section className="py-20 md:py-28 bg-forest">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="max-w-3xl mx-auto text-center">
            <p className="label text-ivory/40 mb-3 tracking-widest">The Founder</p>
            <h2 className="font-serif text-4xl md:text-5xl text-ivory leading-tight mb-10">
              Meet the Founder
            </h2>

            {/* Avatar placeholder */}
            <div className="flex justify-center mb-8">
              <div className="w-28 h-28 md:w-32 md:h-32 rounded-full bg-forest-deep border-2 border-blush/40 flex items-center justify-center">
                <span className="font-serif text-4xl text-ivory/40 select-none">F</span>
              </div>
            </div>

            <p className="font-serif text-xl text-ivory/90 mb-1">The Founder</p>
            <p className="text-sm text-ivory/40 font-sans mb-8 uppercase tracking-wider">
              Founder & Community Director
            </p>

            <div className="space-y-4 text-ivory/70 font-sans leading-relaxed text-left sm:text-center">
              <p>
                She built IMJUSTAGIRL. because she was tired of women having to choose between
                ambition and belonging. A creative director and entrepreneur with a decade of
                experience building brands and communities, she has always believed that the
                most important room in the building is the one where women are honest with each
                other.
              </p>
              <p>
                IMJUSTAGIRL. is her answer to the club she always wanted to be in — one where
                the conversation is real, the access is real, and the support is real. She is
                proud to have built something that keeps getting better every time a new woman
                walks through the door.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Membership Tiers */}
      <section className="py-20 md:py-28 bg-ivory">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-14">
            <p className="label text-mink mb-3">Join Us</p>
            <h2 className="section-heading">Membership</h2>
            <p className="mt-4 text-forest/60 font-sans max-w-xl mx-auto">
              Two ways to become part of the club. Both give you access to the community —
              Founding Membership is for those who want to be part of the beginning.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 max-w-4xl mx-auto">
            {/* Member Tier */}
            <div className="card p-8 flex flex-col">
              <div className="mb-6">
                <p className="label text-mink mb-2">Standard</p>
                <h3 className="font-serif text-2xl text-forest">Member</h3>
                <p className="mt-2 text-sm text-mink font-sans">
                  Full access to the community and everything it offers.
                </p>
              </div>
              <ul className="space-y-3 flex-1">
                {MEMBER_BENEFITS.map((benefit) => (
                  <li key={benefit} className="flex items-start gap-3 text-sm text-forest/80 font-sans">
                    <span className="mt-0.5 text-blush shrink-0">✓</span>
                    {benefit}
                  </li>
                ))}
              </ul>
              <div className="mt-8">
                <Link href="/auth/join" className="btn-secondary w-full text-center block">
                  Apply for Membership
                </Link>
              </div>
            </div>

            {/* Founding Member Tier */}
            <div className="relative card p-8 flex flex-col bg-forest border-forest overflow-visible">
              <div className="absolute -top-3 left-1/2 -translate-x-1/2">
                <span className="bg-blush text-ivory text-xs font-sans font-medium px-4 py-1 rounded-full uppercase tracking-wider">
                  Limited Spots
                </span>
              </div>
              <div className="mb-6">
                <p className="label text-ivory/40 mb-2">Premium</p>
                <h3 className="font-serif text-2xl text-ivory">Founding Member</h3>
                <p className="mt-2 text-sm text-ivory/60 font-sans">
                  For those who want to be part of the story from the very start.
                </p>
              </div>
              <ul className="space-y-3 flex-1">
                {FOUNDING_BENEFITS.map((benefit) => (
                  <li key={benefit} className="flex items-start gap-3 text-sm text-ivory/80 font-sans">
                    <span className="mt-0.5 text-blush shrink-0">✓</span>
                    {benefit}
                  </li>
                ))}
              </ul>
              <div className="mt-8">
                <Link href="/auth/join?tier=founding" className="btn-rose w-full text-center block">
                  Claim Founding Membership
                </Link>
              </div>
            </div>
          </div>
        </div>
      </section>

      <Footer />
    </div>
  )
}
