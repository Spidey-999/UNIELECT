import React from 'react'
import { CheckCircle, AlertCircle, X } from 'lucide-react'
import { motion } from 'framer-motion'

interface AlertProps {
  type: 'success' | 'error' | 'warning' | 'info'
  message: string
  onClose?: () => void
  className?: string
}

const Alert: React.FC<AlertProps> = ({ type, message, onClose, className = '' }) => {
  const styles: Record<string, string> = {
    success: 'border-emerald-500/30 bg-emerald-500/5 text-emerald-800',
    error: 'border-red-500/30 bg-red-500/5 text-red-800',
    warning: 'border-amber-500/30 bg-amber-500/5 text-amber-800',
    info: 'border-sky-500/30 bg-sky-500/5 text-sky-800',
  }

  const icons = {
    success: <CheckCircle className="h-4 w-4 shrink-0" strokeWidth={2} />,
    error: <AlertCircle className="h-4 w-4 shrink-0" strokeWidth={2} />,
    warning: <AlertCircle className="h-4 w-4 shrink-0" strokeWidth={2} />,
    info: <AlertCircle className="h-4 w-4 shrink-0" strokeWidth={2} />,
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: -8 }}
      animate={{ opacity: 1, y: 0 }}
      className={`rounded-ed-md border p-4 ${styles[type] || styles.info} ${className}`}
      role="alert"
    >
      <div className="flex items-start gap-3">
        {icons[type]}
        <p className="flex-1 font-mono text-body-sm leading-relaxed">{message}</p>
        {onClose && (
          <button
            onClick={onClose}
            className="shrink-0 rounded-ed-sm p-1 opacity-60 hover:opacity-100 transition-opacity"
            aria-label="Dismiss"
          >
            <X className="h-4 w-4" strokeWidth={2} />
          </button>
        )}
      </div>
    </motion.div>
  )
}

export default Alert
