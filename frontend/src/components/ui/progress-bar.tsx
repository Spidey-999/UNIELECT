import { motion } from 'framer-motion'
import { cn } from '../../lib/utils'

export function ProgressBar({
  value,
  className,
}: {
  value: number
  className?: string
}) {
  const clamped = Math.max(0, Math.min(100, value))
  return (
    <div className={cn('h-1 w-full rounded-full bg-ink/[0.06] dark:bg-white/10 overflow-hidden', className)}>
      <motion.div
        initial={{ width: 0 }}
        animate={{ width: `${clamped}%` }}
        transition={{ duration: 0.8, ease: [0.4, 0, 0.2, 1] }}
        className="h-full bg-ink dark:bg-emerald-500 rounded-full"
      />
    </div>
  )
}
