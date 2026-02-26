import { Link, useLocation } from 'react-router-dom'
import { Shield, Menu, X } from 'lucide-react'
import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { cn } from '../lib/utils'
import ThemeToggle from './ThemeToggle'

const Navbar = () => {
  const location = useLocation()
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false)
  const isAdminRoute = location.pathname.startsWith('/admin')
  const isElectionsRoute = !isAdminRoute

  const handleMobileMenuToggle = () => setIsMobileMenuOpen(!isMobileMenuOpen)
  const handleMobileMenuClose = () => setIsMobileMenuOpen(false)

  const navLinkClass = (active: boolean) =>
    cn(
      'font-mono text-body-sm tracking-wide transition-colors duration-200 weight-animate',
      active ? 'text-ink' : 'text-ink/55 hover:text-ink'
    )

  return (
    <header
      className="sticky top-0 z-50 w-full border-b border-ink/[0.08] bg-paper/80 backdrop-blur-[16px]"
      style={{ WebkitBackdropFilter: 'blur(16px)' }}
    >
      <div className="max-w-[1600px] mx-auto px-6 sm:px-10 lg:px-16">
        <div className="flex h-20 items-center justify-between">
          <Link
            to="/"
            className="flex items-center gap-4 group"
            onClick={handleMobileMenuClose}
          >
            <div
              className="flex h-10 w-10 items-center justify-center rounded-ed-md border border-ink/[0.1] bg-ink/[0.03] font-mono text-body-sm font-medium tracking-tight transition-all duration-200 group-hover:border-ink/[0.2] group-hover:bg-ink/[0.06]"
              style={{ transitionTimingFunction: 'cubic-bezier(0.34, 1.56, 0.64, 1)' }}
            >
              UNI
            </div>
            <div>
              <span className="font-display text-display-sm font-bold tracking-tight text-ink">
                UNIELECT
              </span>
              <span className="block font-mono text-[0.6875rem] text-ink/50 tracking-wider uppercase">
                Student elections
              </span>
            </div>
          </Link>

          <nav className="hidden items-center gap-6 md:flex">
            <Link to="/" className={navLinkClass(isElectionsRoute)}>
              Elections
            </Link>
            <Link to="/admin/login" className={navLinkClass(isAdminRoute)}>
              <span className="inline-flex items-center gap-2">
                <Shield className="h-3.5 w-3.5" strokeWidth={2} />
                Admin
              </span>
            </Link>
            <ThemeToggle />
          </nav>

          <button
            type="button"
            onClick={handleMobileMenuToggle}
            className="flex h-10 w-10 items-center justify-center rounded-ed-md border border-ink/[0.1] text-ink/70 hover:text-ink hover:border-ink/[0.2] transition-all duration-200 md:hidden"
            aria-label="Toggle menu"
          >
            {isMobileMenuOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
          </button>
        </div>
      </div>

      <AnimatePresence>
        {isMobileMenuOpen && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            transition={{ duration: 0.2, ease: [0.4, 0, 0.2, 1] }}
            className="overflow-hidden md:hidden border-t border-ink/[0.08] bg-paper/95 backdrop-blur-md"
          >
            <div className="flex flex-col gap-1 py-4 px-6">
              <Link
                to="/"
                onClick={handleMobileMenuClose}
                className={cn(
                  'rounded-ed-md px-4 py-3 font-mono text-body-sm transition-colors',
                  isElectionsRoute ? 'bg-ink/[0.06] text-ink' : 'text-ink/55 hover:bg-ink/[0.04] hover:text-ink'
                )}
              >
                Elections
              </Link>
              <Link
                to="/admin/login"
                onClick={handleMobileMenuClose}
                className={cn(
                  'rounded-ed-md px-4 py-3 font-mono text-body-sm flex items-center gap-2 transition-colors',
                  isAdminRoute ? 'bg-ink/[0.06] text-ink' : 'text-ink/55 hover:bg-ink/[0.04] hover:text-ink'
                )}
              >
                <Shield className="h-3.5 w-3.5" strokeWidth={2} />
                Admin
              </Link>
              <div className="pt-2">
                <ThemeToggle className="w-full" />
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </header>
  )
}

export default Navbar
