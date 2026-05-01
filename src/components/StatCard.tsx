import { cn } from '@/lib/utils'

interface StatCardProps {
  label: string
  value: number | string
  sub?: string
  accent?: 'forest' | 'rose' | 'blush'
}

const ACCENT_CLASSES: Record<NonNullable<StatCardProps['accent']>, string> = {
  forest: 'text-forest',
  rose: 'text-rose',
  blush: 'text-blush',
}

export default function StatCard({ label, value, sub, accent = 'forest' }: StatCardProps) {
  return (
    <div className="card p-6">
      <p className={cn('font-serif text-4xl font-semibold leading-none', ACCENT_CLASSES[accent])}>
        {value}
      </p>
      <p className="label mt-2">{label}</p>
      {sub && <p className="mt-1 text-xs text-mink/70">{sub}</p>}
    </div>
  )
}
