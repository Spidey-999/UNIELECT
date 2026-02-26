import { motion } from 'framer-motion'
import ThemeToggle from './ThemeToggle'

export default function FloatingThemeControl() {
  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.2, ease: [0.4, 0, 0.2, 1] }}
      className="fixed bottom-5 right-5 z-50 rounded-ed-lg border bg-white shadow-[4px_4px_0_0_rgba(0,0,0,1)] dark:bg-white/10 dark:shadow-none dark:border-white/10 backdrop-blur-md p-2"
      aria-label="Floating theme control"
    >
      <ThemeToggle />
    </motion.div>
  )
}
