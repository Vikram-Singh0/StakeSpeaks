'use client'

import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { useWallet } from '@/contexts/WalletContext'
import WalletConnectionModal from '@/components/WalletConnectionModal'
import { 
  Mic, 
  Users, 
  DollarSign, 
  Shield, 
  Star, 
  ArrowRight, 
  Wallet,
  Globe,
  Zap,
  TrendingUp
} from 'lucide-react'

interface LandingPageProps {
  onWalletConnected?: () => void
}

export default function LandingPage({ onWalletConnected }: LandingPageProps) {
  const { isConnected, isLoading } = useWallet()
  const [currentFeature, setCurrentFeature] = useState(0)
  const [showWalletModal, setShowWalletModal] = useState(false)
  
  const features = [
    {
      icon: <Mic className="w-6 h-6" />,
      title: "Expert Discussions",
      description: "Join premium conversations with industry experts and thought leaders."
    },
    {
      icon: <DollarSign className="w-6 h-6" />,
      title: "Stake & Earn",
      description: "Stake KDA tokens to participate and earn compound yields on your investment."
    },
    {
      icon: <Users className="w-6 h-6" />,
      title: "Superchat Rewards",
      description: "Send PYUSD superchats to speakers and share in the rewards pool."
    },
    {
      icon: <Shield className="w-6 h-6" />,
      title: "Verified Storage",
      description: "All sessions permanently stored on Filecoin for transparency and verification."
    }
  ]

  const stats = [
    { label: "Active Speakers", value: "1,250+", icon: <Mic className="w-5 h-5" /> },
    { label: "Total Staked", value: "$2.5M", icon: <TrendingUp className="w-5 h-5" /> },
    { label: "Sessions Hosted", value: "15,000+", icon: <Users className="w-5 h-5" /> },
    { label: "Average Yield", value: "8.5%", icon: <Zap className="w-5 h-5" /> }
  ]

  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentFeature((prev) => (prev + 1) % features.length)
    }, 3000)
    return () => clearInterval(interval)
  }, [features.length])

  const handleConnectWallet = () => {
    setShowWalletModal(true)
  }

  const handleWalletConnected = () => {
    setShowWalletModal(false)
    onWalletConnected?.()
  }

  return (
    <div className="min-h-screen">
      {/* Hero Section */}
      <section className="relative overflow-hidden px-6 pt-20 pb-32">
        <div className="absolute inset-0 bg-gradient-to-br from-violet-900/20 via-transparent to-blue-900/20" />
        <div className="relative max-w-7xl mx-auto">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
            className="text-center"
          >
            <motion.div
              initial={{ scale: 0.8, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              transition={{ duration: 0.6, delay: 0.2 }}
              className="mb-8"
            >
              <div className="flex items-center justify-center mb-6">
                <div className="w-20 h-20 mr-4">
                  <svg viewBox="0 0 64 64" fill="none" xmlns="http://www.w3.org/2000/svg">
                    <defs>
                      <linearGradient id="gradient" x1="0%" y1="0%" x2="100%" y2="100%">
                        <stop offset="0%" stopColor="#8b5cf6" />
                        <stop offset="100%" stopColor="#3b82f6" />
                      </linearGradient>
                    </defs>
                    <rect x="26" y="8" width="12" height="24" rx="6" fill="url(#gradient)" />
                    <line x1="30" y1="14" x2="30" y2="26" stroke="white" strokeWidth="1" opacity="0.7" />
                    <line x1="32" y1="14" x2="32" y2="26" stroke="white" strokeWidth="1" opacity="0.7" />
                    <line x1="34" y1="14" x2="34" y2="26" stroke="white" strokeWidth="1" opacity="0.7" />
                    <line x1="32" y1="32" x2="32" y2="44" stroke="url(#gradient)" strokeWidth="2" />
                    <rect x="24" y="44" width="16" height="4" rx="2" fill="url(#gradient)" />
                    <path d="M44 20 C48 16, 48 28, 44 24" stroke="url(#gradient)" strokeWidth="2" fill="none" opacity="0.6" />
                    <path d="M48 16 C54 10, 54 34, 48 28" stroke="url(#gradient)" strokeWidth="2" fill="none" opacity="0.4" />
                    <path d="M20 20 C16 16, 16 28, 20 24" stroke="url(#gradient)" strokeWidth="2" fill="none" opacity="0.6" />
                    <path d="M16 16 C10 10, 10 34, 16 28" stroke="url(#gradient)" strokeWidth="2" fill="none" opacity="0.4" />
                    <polygon points="32,52 28,58 36,58" fill="url(#gradient)" opacity="0.8" />
                  </svg>
                </div>
              </div>
              <h1 className="text-6xl md:text-8xl font-bold mb-6">
                <span className="gradient-text">Talk</span>
                <span className="text-white">Stake</span>
              </h1>
              <p className="text-xl md:text-2xl text-gray-400 max-w-3xl mx-auto leading-relaxed">
                Monetize expert knowledge through staked conversations. 
                <span className="text-violet-400"> Stake KDA</span>, earn yields, and unlock premium discussions.
              </p>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.4 }}
              className="flex flex-col sm:flex-row gap-4 justify-center mb-16"
            >
              <Button 
                variant="gradient" 
                size="lg" 
                onClick={handleConnectWallet}
                disabled={isLoading}
                className="text-lg px-8 py-6 h-auto"
              >
                <Wallet className="w-5 h-5 mr-2" />
                {isLoading ? 'Connecting...' : 'Connect Wallet & Start'}
                <ArrowRight className="w-5 h-5 ml-2" />
              </Button>
              <Button 
                variant="outline" 
                size="lg"
                className="text-lg px-8 py-6 h-auto border-violet-500/50 hover:border-violet-400 hover:bg-violet-500/10"
              >
                <Globe className="w-5 h-5 mr-2" />
                Explore Sessions
              </Button>
            </motion.div>

            {/* Stats Grid */}
            <motion.div
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8, delay: 0.6 }}
              className="grid grid-cols-2 md:grid-cols-4 gap-6 max-w-4xl mx-auto"
            >
              {stats.map((stat, index) => (
                <motion.div
                  key={stat.label}
                  initial={{ opacity: 0, scale: 0.8 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ duration: 0.5, delay: 0.8 + index * 0.1 }}
                  className="glass-effect rounded-xl p-6 text-center"
                >
                  <div className="flex justify-center mb-2 text-violet-400">
                    {stat.icon}
                  </div>
                  <div className="text-2xl font-bold text-white mb-1">{stat.value}</div>
                  <div className="text-sm text-gray-400">{stat.label}</div>
                </motion.div>
              ))}
            </motion.div>
          </motion.div>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-24 px-6">
        <div className="max-w-7xl mx-auto">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
            viewport={{ once: true }}
            className="text-center mb-16"
          >
            <h2 className="text-4xl md:text-5xl font-bold mb-6">
              Why Choose <span className="gradient-text">TalkStake</span>?
            </h2>
            <p className="text-xl text-gray-400 max-w-2xl mx-auto">
              Experience the future of knowledge monetization with our innovative staking platform
            </p>
          </motion.div>

          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8">
            {features.map((feature, index) => (
              <motion.div
                key={feature.title}
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6, delay: index * 0.1 }}
                viewport={{ once: true }}
                whileHover={{ scale: 1.05, transition: { duration: 0.2 } }}
              >
                <Card className="h-full hover:border-violet-500/50 transition-all duration-300">
                  <CardHeader className="text-center">
                    <div className="mx-auto w-14 h-14 bg-gradient-to-br from-violet-600 to-blue-600 rounded-xl flex items-center justify-center mb-4 text-white">
                      {feature.icon}
                    </div>
                    <CardTitle className="text-xl">{feature.title}</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <CardDescription className="text-center text-gray-400">
                      {feature.description}
                    </CardDescription>
                  </CardContent>
                </Card>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* How It Works Section */}
      <section className="py-24 px-6 bg-gradient-to-br from-violet-900/10 to-blue-900/10">
        <div className="max-w-7xl mx-auto">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
            viewport={{ once: true }}
            className="text-center mb-16"
          >
            <h2 className="text-4xl md:text-5xl font-bold mb-6">How It Works</h2>
            <p className="text-xl text-gray-400 max-w-2xl mx-auto">
              Simple steps to start earning from expert knowledge
            </p>
          </motion.div>

          <div className="grid md:grid-cols-3 gap-8">
            {[
              {
                step: "01",
                title: "Connect & Stake",
                description: "Connect your wallet and stake KDA tokens to join premium discussions"
              },
              {
                step: "02", 
                title: "Join Conversations",
                description: "Participate in live expert sessions and send PYUSD superchats"
              },
              {
                step: "03",
                title: "Earn Rewards",
                description: "Receive compound yields and share in superchat reward pools"
              }
            ].map((step, index) => (
              <motion.div
                key={step.step}
                initial={{ opacity: 0, x: -30 }}
                whileInView={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.6, delay: index * 0.2 }}
                viewport={{ once: true }}
                className="relative"
              >
                <Card className="h-full hover:border-violet-500/50 transition-all duration-300">
                  <CardHeader>
                    <div className="text-6xl font-bold gradient-text mb-4">{step.step}</div>
                    <CardTitle className="text-2xl">{step.title}</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <CardDescription className="text-gray-400 text-lg">
                      {step.description}
                    </CardDescription>
                  </CardContent>
                </Card>
                {index < 2 && (
                  <div className="hidden md:block absolute top-1/2 -right-4 w-8 h-0.5 bg-gradient-to-r from-violet-600 to-blue-600" />
                )}
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-24 px-6">
        <div className="max-w-4xl mx-auto text-center">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
            viewport={{ once: true }}
          >
            <h2 className="text-4xl md:text-5xl font-bold mb-6">
              Ready to <span className="gradient-text">Monetize</span> Your Knowledge?
            </h2>
            <p className="text-xl text-gray-400 mb-8 max-w-2xl mx-auto">
              Join thousands of experts already earning through staked conversations on TalkStake
            </p>
            <Button 
              variant="gradient" 
              size="lg" 
              onClick={handleConnectWallet}
              disabled={isLoading}
              className="text-xl px-12 py-8 h-auto"
            >
              <Wallet className="w-6 h-6 mr-3" />
              {isLoading ? 'Connecting...' : 'Get Started Now'}
              <ArrowRight className="w-6 h-6 ml-3" />
            </Button>
          </motion.div>
        </div>
      </section>
      
      {/* Wallet Connection Modal */}
      <WalletConnectionModal
        isOpen={showWalletModal}
        onClose={() => setShowWalletModal(false)}
        onSuccess={handleWalletConnected}
      />
    </div>
  )
}