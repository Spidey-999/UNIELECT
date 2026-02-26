import { useEffect, useState } from 'react'
import { Moon, Sun } from 'lucide-react'
import { cn } from '../lib/utils'
import { Button } from './ui/button'

export default function ThemeToggle({ className }: { className?: string }) {
  const [isDark, setIsDark] = useState<boolean>(() => {
    const saved = localStorage.getItem('theme')
    if (saved) return saved === 'dark'
    return window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches
  })

  useEffect(() => {
    const root = document.documentElement
    if (isDark) {
      root.classList.add('dark')
      localStorage.setItem('theme', 'dark')
    } else {
      root.classList.remove('dark')
      localStorage.setItem('theme', 'light')
    }
  }, [isDark])

  return (
    <Button
      variant="outline"
      size="icon"
      aria-label="Toggle theme"
      className={cn('shrink-0', className)}
      onClick={() => setIsDark((v) => !v)}
    >
      {isDark ? <Sun className="h-4 w-4" strokeWidth={2} /> : <Moon className="h-4 w-4" strokeWidth={2} />}
    </Button>
  )
}
