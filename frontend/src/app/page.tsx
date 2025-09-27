'use client'

import { useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useWallet } from '@/contexts/WalletContext'
import LandingPage from '@/components/LandingPage'

export default function Home() {
  const router = useRouter()
  const { isConnected, isLoading } = useWallet()

  // Redirect to home if already connected
  useEffect(() => {
    if (isConnected) {
      router.push('/home')
    }
  }, [isConnected, router])

  const handleWalletConnected = () => {
    router.push('/home')
  }

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-violet-600 mx-auto mb-4"></div>
          <p className="text-gray-400">Loading...</p>
        </div>
      </div>
    )
  }

  return <LandingPage onWalletConnected={handleWalletConnected} />
}