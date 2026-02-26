import * as React from 'react'
import { Slot } from '@radix-ui/react-slot'
import { cva, type VariantProps } from 'class-variance-authority'
import { cn } from '../../lib/utils'

const buttonVariants = cva(
  'inline-flex items-center justify-center gap-2 whitespace-nowrap font-mono text-body-sm tracking-wide transition-all duration-200 focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ink focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-40 ring-offset-paper',
  {
    variants: {
      variant: {
        default:
          'bg-ink text-paper border border-ink hover:bg-ink/90 active:scale-[0.98]',
        outline:
          'border border-ink/[0.15] bg-transparent text-ink hover:bg-ink/[0.04] hover:border-ink/[0.25] active:scale-[0.98]',
        ghost:
          'text-ink/70 hover:text-ink hover:bg-ink/[0.04]',
        secondary:
          'bg-ink/[0.06] text-ink border border-ink/[0.08] hover:bg-ink/[0.1] hover:border-ink/[0.12] active:scale-[0.98]',
      },
      size: {
        default: 'h-11 px-5 rounded-ed-md',
        sm: 'h-9 px-4 rounded-ed-sm text-[0.75rem]',
        lg: 'h-12 px-8 rounded-ed-lg',
        icon: 'h-10 w-10 rounded-ed-md',
      },
    },
    defaultVariants: {
      variant: 'default',
      size: 'default',
    },
  }
)

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof buttonVariants> {
  asChild?: boolean
}

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant, size, asChild = false, ...props }, ref) => {
    const Comp = asChild ? Slot : 'button'
    return (
      <Comp
        className={cn(buttonVariants({ variant, size, className }))}
        ref={ref}
        style={{ transitionTimingFunction: 'cubic-bezier(0.34, 1.56, 0.64, 1)' }}
        {...props}
      />
    )
  }
)
Button.displayName = 'Button'

export { Button, buttonVariants }
