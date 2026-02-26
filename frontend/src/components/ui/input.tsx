import * as React from 'react'
import { cn } from '../../lib/utils'

export interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {}

const Input = React.forwardRef<HTMLInputElement, InputProps>(
  ({ className, type, ...props }, ref) => {
    return (
      <input
        type={type}
        className={cn(
          'flex h-11 w-full rounded-ed-md border border-ink/[0.1] bg-paper px-4 font-mono text-body-sm placeholder:text-ink/40 focus-visible:outline-none focus-visible:border-ink/[0.3] focus-visible:ring-1 focus-visible:ring-ink/[0.1] disabled:cursor-not-allowed disabled:opacity-50 transition-all duration-200',
          className
        )}
        ref={ref}
        style={{ transitionTimingFunction: 'cubic-bezier(0.4, 0, 0.2, 1)' }}
        {...props}
      />
    )
  }
)
Input.displayName = 'Input'

export { Input }
