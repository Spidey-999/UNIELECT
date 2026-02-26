import React from 'react'

interface LoadingSpinnerProps {
  size?: 'sm' | 'md' | 'lg'
  className?: string
}

const LoadingSpinner: React.FC<LoadingSpinnerProps> = ({ size = 'md', className = '' }) => {
  const sizes = {
    sm: 'h-4 w-4 border-[2px]',
    md: 'h-8 w-8 border-[2px]',
    lg: 'h-12 w-12 border-2',
  }

  return (
    <div
      className={`animate-spin rounded-full border-ink/20 border-t-ink ${sizes[size]} ${className}`}
      role="status"
      aria-label="Loading"
    >
      <span className="sr-only">Loading...</span>
    </div>
  )
}

export default LoadingSpinner
