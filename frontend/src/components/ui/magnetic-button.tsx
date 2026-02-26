import * as React from 'react'
import { type ButtonProps } from './button'
import { buttonVariants } from './button'
import { motion } from 'framer-motion'
import { cn } from '../../lib/utils'

type MotionSafeButtonProps = Omit<
  ButtonProps,
  | 'onDrag'
  | 'onDragStart'
  | 'onDragEnd'
  | 'onDragCapture'
  | 'onDragStartCapture'
  | 'onDragEndCapture'
  | 'onDragEnter'
  | 'onDragLeave'
  | 'onDragOver'
>

export function MagneticButton({
  children,
  variant,
  size,
  className,
  ...rest
}: MotionSafeButtonProps) {
  const ref = React.useRef<HTMLButtonElement | null>(null)

  const handleMove = (e: React.MouseEvent<HTMLButtonElement>) => {
    const el = ref.current
    if (!el) return
    const rect = el.getBoundingClientRect()
    const x = e.clientX - rect.left - rect.width / 2
    const y = e.clientY - rect.top - rect.height / 2
    const max = 6
    const tx = Math.max(-max, Math.min(max, x * 0.08))
    const ty = Math.max(-max, Math.min(max, y * 0.08))
    el.style.transform = `translate(${tx}px, ${ty}px)`
  }

  const handleLeave = () => {
    const el = ref.current
    if (!el) return
    el.style.transform = 'translate(0, 0)'
  }

  return (
    <motion.button
      {...rest}
      ref={ref}
      onMouseMove={handleMove}
      onMouseLeave={handleLeave}
      whileTap={{ scale: 0.96, transition: { type: 'spring', stiffness: 400, damping: 10 } }}
      className={cn(buttonVariants({ variant, size, className }))}
      style={{ transitionTimingFunction: 'cubic-bezier(0.34, 1.56, 0.64, 1)' }}
    >
      {children}
    </motion.button>
  )
}
