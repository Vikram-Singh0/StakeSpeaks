import React from 'react'

interface LogoProps {
  className?: string
  size?: 'sm' | 'md' | 'lg'
}

export default function Logo({ className = '', size = 'md' }: LogoProps) {
  const sizeClasses = {
    sm: 'w-8 h-8',
    md: 'w-12 h-12', 
    lg: 'w-16 h-16'
  }

  return (
    <div className={`${sizeClasses[size]} ${className}`}>
      <svg viewBox="0 0 64 64" fill="none" xmlns="http://www.w3.org/2000/svg">
        <defs>
          <linearGradient id="gradient" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#8b5cf6" />
            <stop offset="100%" stopColor="#3b82f6" />
          </linearGradient>
        </defs>
        
        {/* Microphone body */}
        <rect x="26" y="8" width="12" height="24" rx="6" fill="url(#gradient)" />
        
        {/* Microphone grille */}
        <line x1="30" y1="14" x2="30" y2="26" stroke="white" strokeWidth="1" opacity="0.7" />
        <line x1="32" y1="14" x2="32" y2="26" stroke="white" strokeWidth="1" opacity="0.7" />
        <line x1="34" y1="14" x2="34" y2="26" stroke="white" strokeWidth="1" opacity="0.7" />
        
        {/* Microphone stand */}
        <line x1="32" y1="32" x2="32" y2="44" stroke="url(#gradient)" strokeWidth="2" />
        <rect x="24" y="44" width="16" height="4" rx="2" fill="url(#gradient)" />
        
        {/* Sound waves */}
        <path d="M44 20 C48 16, 48 28, 44 24" stroke="url(#gradient)" strokeWidth="2" fill="none" opacity="0.6" />
        <path d="M48 16 C54 10, 54 34, 48 28" stroke="url(#gradient)" strokeWidth="2" fill="none" opacity="0.4" />
        
        <path d="M20 20 C16 16, 16 28, 20 24" stroke="url(#gradient)" strokeWidth="2" fill="none" opacity="0.6" />
        <path d="M16 16 C10 10, 10 34, 16 28" stroke="url(#gradient)" strokeWidth="2" fill="none" opacity="0.4" />
        
        {/* Stake symbol (small triangle) */}
        <polygon points="32,52 28,58 36,58" fill="url(#gradient)" opacity="0.8" />
      </svg>
    </div>
  )
}