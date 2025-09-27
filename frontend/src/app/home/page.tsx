'use client'

import { useRouter } from 'next/navigation'
import { useEffect, useState } from 'react'
import { useWallet } from '@/contexts/WalletContext'
import HomePage from '@/components/HomePage'

export default function Home() {
  const router = useRouter()
  const { isConnected, userProfile, isLoading } = useWallet()
  const [isInitialLoading, setIsInitialLoading] = useState(true)

  useEffect(() => {
    // Small delay to ensure wallet context is initialized
    const timer = setTimeout(() => {
      setIsInitialLoading(false)
      
      if (!isConnected || !userProfile) {
        router.push('/')
      }
    }, 100)

    return () => clearTimeout(timer)
  }, [isConnected, userProfile, router])

  const handleDisconnect = () => {
    router.push('/')
  }

  if (isInitialLoading || isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-violet-600 mx-auto mb-4"></div>
          <p className="text-gray-400">Loading...</p>
        </div>
      </div>
    )
  }

  if (!isConnected || !userProfile) {
    return null // Will redirect to landing page
  }

  return <HomePage userProfile={userProfile} onDisconnect={handleDisconnect} />
}