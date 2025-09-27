'use client'

import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { useWallet, SUPPORTED_WALLETS } from '@/contexts/WalletContext'
import { 
  X, 
  Wallet, 
  AlertCircle, 
  CheckCircle,
  ExternalLink,
  Shield
} from 'lucide-react'

interface WalletConnectionModalProps {
  isOpen: boolean
  onClose: () => void
  onSuccess?: () => void
}

export default function WalletConnectionModal({ isOpen, onClose, onSuccess }: WalletConnectionModalProps) {
  const { connectWallet, isLoading, error } = useWallet()
  const [selectedWallet, setSelectedWallet] = useState<string | null>(null)
  const [step, setStep] = useState<'select' | 'connecting' | 'success' | 'error'>('select')

  const handleWalletSelect = async (walletId: string) => {
    setSelectedWallet(walletId)
    setStep('connecting')
    
    try {
      await connectWallet(walletId)
      setStep('success')
      setTimeout(() => {
        onSuccess?.()
        onClose()
      }, 2000)
    } catch (err) {
      setStep('error')
    }
  }

  const handleClose = () => {
    if (!isLoading) {
      setStep('select')
      setSelectedWallet(null)
      onClose()
    }
  }

  const handleRetry = () => {
    setStep('select')
    setSelectedWallet(null)
  }

  if (!isOpen) return null

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-center justify-center">
        {/* Backdrop */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="absolute inset-0 bg-black/80 backdrop-blur-sm"
          onClick={handleClose}
        />
        
        {/* Modal */}
        <motion.div
          initial={{ opacity: 0, scale: 0.9, y: 20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.9, y: 20 }}
          transition={{ duration: 0.3 }}
          className="relative z-10 w-full max-w-md mx-4"
        >
          <Card className="glass-effect border-violet-500/30">
            <CardHeader className="text-center relative">
              {!isLoading && (
                <button
                  onClick={handleClose}
                  className="absolute right-4 top-4 text-gray-400 hover:text-white transition-colors"
                >
                  <X className="w-5 h-5" />
                </button>
              )}
              
              {step === 'select' && (
                <>
                  <div className="w-16 h-16 bg-gradient-to-br from-violet-600 to-blue-600 rounded-full flex items-center justify-center mx-auto mb-4">
                    <Wallet className="w-8 h-8 text-white" />
                  </div>
                  <CardTitle className="text-2xl mb-2">Connect Wallet</CardTitle>
                  <CardDescription>
                    Choose your preferred wallet to connect to TalkStake
                  </CardDescription>
                </>
              )}

              {step === 'connecting' && (
                <>
                  <div className="w-16 h-16 bg-gradient-to-br from-violet-600 to-blue-600 rounded-full flex items-center justify-center mx-auto mb-4">
                    <div className="animate-spin rounded-full h-8 w-8 border-2 border-white border-t-transparent" />
                  </div>
                  <CardTitle className="text-2xl mb-2">Connecting...</CardTitle>
                  <CardDescription>
                    Please approve the connection in your wallet
                  </CardDescription>
                </>
              )}

              {step === 'success' && (
                <>
                  <div className="w-16 h-16 bg-green-600 rounded-full flex items-center justify-center mx-auto mb-4">
                    <CheckCircle className="w-8 h-8 text-white" />
                  </div>
                  <CardTitle className="text-2xl mb-2 text-green-400">Connected!</CardTitle>
                  <CardDescription>
                    Welcome to TalkStake. Redirecting to dashboard...
                  </CardDescription>
                </>
              )}

              {step === 'error' && (
                <>
                  <div className="w-16 h-16 bg-red-600 rounded-full flex items-center justify-center mx-auto mb-4">
                    <AlertCircle className="w-8 h-8 text-white" />
                  </div>
                  <CardTitle className="text-2xl mb-2 text-red-400">Connection Failed</CardTitle>
                  <CardDescription>
                    {error || 'Something went wrong. Please try again.'}
                  </CardDescription>
                </>
              )}
            </CardHeader>

            <CardContent>
              {step === 'select' && (
                <div className="space-y-3">
                  {SUPPORTED_WALLETS.map((wallet) => (
                    <Button
                      key={wallet.id}
                      variant="outline"
                      className="w-full justify-start h-14 border-zinc-700 hover:border-violet-500/50 hover:bg-violet-500/10"
                      onClick={() => handleWalletSelect(wallet.id)}
                    >
                      <span className="text-2xl mr-3">{wallet.icon}</span>
                      <div className="text-left">
                        <div className="font-medium">{wallet.name}</div>
                        <div className="text-sm text-gray-400">
                          {wallet.id === 'kadena' && 'Connect with Chainweaver'}
                          {wallet.id === 'metamask' && 'For PYUSD payments'}
                          {wallet.id === 'walletconnect' && 'Mobile wallet support'}
                        </div>
                      </div>
                      <ExternalLink className="w-4 h-4 ml-auto text-gray-400" />
                    </Button>
                  ))}
                  
                  <div className="mt-6 p-4 bg-blue-900/20 border border-blue-500/30 rounded-lg">
                    <div className="flex items-start space-x-3">
                      <Shield className="w-5 h-5 text-blue-400 mt-0.5" />
                      <div className="text-sm">
                        <p className="font-medium text-blue-400 mb-1">Secure Connection</p>
                        <p className="text-gray-400">
                          Your wallet connection is encrypted and secure. We never store your private keys.
                        </p>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {step === 'connecting' && (
                <div className="text-center space-y-4">
                  <div className="text-gray-400">
                    Connecting to <span className="text-violet-400 font-medium">
                      {SUPPORTED_WALLETS.find(w => w.id === selectedWallet)?.name}
                    </span>
                  </div>
                  <div className="text-sm text-gray-500">
                    This may take a few moments...
                  </div>
                </div>
              )}

              {step === 'success' && (
                <div className="text-center">
                  <div className="text-green-400 font-medium mb-2">
                    Wallet connected successfully!
                  </div>
                  <div className="text-sm text-gray-400">
                    Setting up your profile...
                  </div>
                </div>
              )}

              {step === 'error' && (
                <div className="space-y-4">
                  <div className="text-center text-sm text-gray-400 mb-4">
                    Please make sure your wallet is installed and unlocked.
                  </div>
                  <div className="flex space-x-3">
                    <Button variant="outline" onClick={handleRetry} className="flex-1">
                      Try Again
                    </Button>
                    <Button variant="ghost" onClick={handleClose} className="flex-1">
                      Cancel
                    </Button>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </motion.div>
      </div>
    </AnimatePresence>
  )
}