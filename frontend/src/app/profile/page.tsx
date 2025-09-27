'use client'

import { useRouter } from 'next/navigation'
import { useEffect, useState } from 'react'
import { useWallet } from '@/contexts/WalletContext'
import UserProfile from '@/components/UserProfile'
import { Button } from '@/components/ui/button'
import { ArrowLeft } from 'lucide-react'

export default function ProfilePage() {
  const router = useRouter()
  const { isConnected, userProfile, isLoading } = useWallet()
  const [isInitialLoading, setIsInitialLoading] = useState(true)

  useEffect(() => {
    const timer = setTimeout(() => {
      setIsInitialLoading(false)
      
      if (!isConnected || !userProfile) {
        router.push('/')
      }
    }, 100)

    return () => clearTimeout(timer)
  }, [isConnected, userProfile, router])

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
    return null
  }

  return (
    <div className="min-h-screen">
      {/* Header */}
      <header className="border-b border-border bg-card/50 backdrop-blur-sm sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <Button
                variant="ghost"
                onClick={() => router.push('/home')}
                className="text-gray-400 hover:text-white"
              >
                <ArrowLeft className="w-4 h-4 mr-2" />
                Back to Dashboard
              </Button>
            </div>
            
            <div className="flex items-center space-x-3">
              <h1 className="text-2xl font-bold">
                <span className="gradient-text">Talk</span>
                <span className="text-white">Stake</span>
              </h1>
            </div>
          </div>
        </div>
      </header>

      <div className="max-w-4xl mx-auto px-6 py-8">
        <UserProfile />
      </div>
    </div>
  )
}