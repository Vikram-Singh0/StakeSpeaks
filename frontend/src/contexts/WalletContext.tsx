'use client'

import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react'
import { ethers } from 'ethers'
import { MetaMaskSDK } from '@metamask/sdk'

// Types
export interface UserProfile {
  address: string
  username?: string
  avatar?: string
  bio?: string
  expertise?: string[]
  joinedDate: string
  totalStaked: number
  totalEarnings: number
  sessionsJoined: number
  reputation: number
  isExpert: boolean
  chainId?: string
  balance?: string
}

export interface WalletContextType {
  isConnected: boolean
  isLoading: boolean
  userProfile: UserProfile | null
  connectWallet: (walletType?: string) => Promise<void>
  disconnectWallet: () => void
  updateProfile: (updates: Partial<UserProfile>) => void
  error: string | null
  switchNetwork: (chainId: string) => Promise<void>
  getBalance: () => Promise<string>
}

// Supported wallet types
const SUPPORTED_WALLETS = [
  { id: 'metamask', name: 'MetaMask', icon: '🦊' },
  { id: 'walletconnect', name: 'WalletConnect', icon: '🔗' },
  { id: 'kadena', name: 'Chainweaver', icon: '⛓️' }
]

// Network configurations
const NETWORKS = {
  ethereum: {
    chainId: '0x1',
    chainName: 'Ethereum Mainnet',
    nativeCurrency: { name: 'ETH', symbol: 'ETH', decimals: 18 },
    rpcUrls: ['https://mainnet.infura.io/v3/'],
    blockExplorerUrls: ['https://etherscan.io/']
  },
  sepolia: {
    chainId: '0xaa36a7',
    chainName: 'Sepolia Test Network',
    nativeCurrency: { name: 'ETH', symbol: 'ETH', decimals: 18 },
    rpcUrls: ['https://sepolia.infura.io/v3/'],
    blockExplorerUrls: ['https://sepolia.etherscan.io/']
  }
}

// Initialize MetaMask SDK
let metamaskSDK: MetaMaskSDK | null = null
if (typeof window !== 'undefined') {
  metamaskSDK = new MetaMaskSDK({
    dappMetadata: {
      name: 'TalkStake',
      url: window.location.host,
    },
  })
}

const WalletContext = createContext<WalletContextType | undefined>(undefined)

interface WalletProviderProps {
  children: ReactNode
}

export function WalletProvider({ children }: WalletProviderProps) {
  const [isConnected, setIsConnected] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null)
  const [error, setError] = useState<string | null>(null)

  // Load saved wallet connection on mount
  useEffect(() => {
    const loadSavedConnection = async () => {
      try {
        const savedProfile = localStorage.getItem('talkstake_user_profile')
        const savedConnection = localStorage.getItem('talkstake_connected')
        
        if (savedConnection === 'true' && savedProfile) {
          const profile = JSON.parse(savedProfile)
          
          // Try to reconnect to the wallet if it was previously connected
          if (typeof window !== 'undefined' && window.ethereum) {
            try {
              const accounts = await window.ethereum.request({ method: 'eth_accounts' })
              if (accounts.length > 0 && accounts[0].toLowerCase() === profile.address.toLowerCase()) {
                setUserProfile(profile)
                setIsConnected(true)
              } else {
                // Clear saved data if account doesn't match
                localStorage.removeItem('talkstake_user_profile')
                localStorage.removeItem('talkstake_connected')
              }
            } catch (err) {
              console.error('Error checking existing connection:', err)
            }
          }
        }
      } catch (error) {
        console.error('Error loading saved connection:', error)
        localStorage.removeItem('talkstake_user_profile')
        localStorage.removeItem('talkstake_connected')
      }
    }

    loadSavedConnection()

    // Listen for account changes
    if (typeof window !== 'undefined' && window.ethereum) {
      const handleAccountsChanged = (accounts: string[]) => {
        if (accounts.length === 0) {
          disconnectWallet()
        } else if (userProfile && accounts[0].toLowerCase() !== userProfile.address.toLowerCase()) {
          // Account changed, reconnect with new account
          disconnectWallet()
        }
      }

      const handleChainChanged = (chainId: string) => {
        // Reload the page when chain changes for now
        window.location.reload()
      }

      window.ethereum.on('accountsChanged', handleAccountsChanged)
      window.ethereum.on('chainChanged', handleChainChanged)

      return () => {
        if (window.ethereum.removeListener) {
          window.ethereum.removeListener('accountsChanged', handleAccountsChanged)
          window.ethereum.removeListener('chainChanged', handleChainChanged)
        }
      }
    }
  }, [userProfile])

  const connectWallet = async (walletType: string = 'metamask') => {
    setIsLoading(true)
    setError(null)
    
    try {
      let provider: ethers.BrowserProvider | null = null
      let address: string = ''
      let chainId: string = ''
      let balance: string = '0'

      if (walletType === 'metamask') {
        // Check if MetaMask is installed
        if (typeof window === 'undefined' || !window.ethereum) {
          throw new Error('MetaMask is not installed. Please install MetaMask extension.')
        }

        if (!window.ethereum.isMetaMask) {
          throw new Error('Please use MetaMask browser extension.')
        }

        // Request account access
        const accounts = await window.ethereum.request({
          method: 'eth_requestAccounts'
        })

        if (!accounts || accounts.length === 0) {
          throw new Error('No accounts found. Please unlock MetaMask.')
        }

        address = accounts[0]
        
        // Get current chain ID
        chainId = await window.ethereum.request({ method: 'eth_chainId' })
        
        // Create ethers provider
        provider = new ethers.BrowserProvider(window.ethereum)
        
        // Get balance
        const balanceWei = await provider.getBalance(address)
        balance = ethers.formatEther(balanceWei)

      } else if (walletType === 'walletconnect') {
        // WalletConnect implementation would go here
        throw new Error('WalletConnect integration coming soon!')
        
      } else if (walletType === 'kadena') {
        // Kadena Chainweaver implementation would go here
        throw new Error('Kadena Chainweaver integration coming soon!')
        
      } else {
        throw new Error('Unsupported wallet type')
      }

      // Check if user exists or create new profile
      const existingProfile = await checkExistingUser(address)
      
      const newProfile: UserProfile = existingProfile || {
        address: address.toLowerCase(),
        username: `User${address.slice(-4)}`,
        avatar: `https://api.dicebear.com/7.x/identicon/svg?seed=${address}`,
        bio: '',
        expertise: [],
        joinedDate: new Date().toISOString(),
        totalStaked: 0,
        totalEarnings: 0,
        sessionsJoined: 0,
        reputation: 0,
        isExpert: false,
        chainId,
        balance
      }

      // Save to localStorage
      localStorage.setItem('talkstake_connected', 'true')
      localStorage.setItem('talkstake_user_profile', JSON.stringify(newProfile))
      localStorage.setItem('talkstake_wallet_type', walletType)
      
      // Save to global profiles store
      saveUserToGlobalStore(newProfile)
      
      setUserProfile(newProfile)
      setIsConnected(true)
      
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to connect wallet'
      setError(errorMessage)
      throw err
    } finally {
      setIsLoading(false)
    }
  }

  const disconnectWallet = () => {
    setIsConnected(false)
    setUserProfile(null)
    setError(null)
    localStorage.removeItem('talkstake_connected')
    localStorage.removeItem('talkstake_user_profile')
    localStorage.removeItem('talkstake_wallet_type')
  }

  const updateProfile = (updates: Partial<UserProfile>) => {
    if (!userProfile) return
    
    const updatedProfile = { ...userProfile, ...updates }
    setUserProfile(updatedProfile)
    localStorage.setItem('talkstake_user_profile', JSON.stringify(updatedProfile))
  }

  const switchNetwork = async (targetChainId: string) => {
    if (typeof window === 'undefined' || !window.ethereum) {
      throw new Error('Wallet not connected')
    }

    try {
      await window.ethereum.request({
        method: 'wallet_switchEthereumChain',
        params: [{ chainId: targetChainId }],
      })
    } catch (switchError: any) {
      // If the chain is not added to MetaMask, add it
      if (switchError.code === 4902) {
        const networkConfig = Object.values(NETWORKS).find(n => n.chainId === targetChainId)
        if (networkConfig) {
          try {
            await window.ethereum.request({
              method: 'wallet_addEthereumChain',
              params: [networkConfig],
            })
          } catch (addError) {
            throw new Error('Failed to add network to wallet')
          }
        } else {
          throw new Error('Network configuration not found')
        }
      } else {
        throw new Error('Failed to switch network')
      }
    }
  }

  const getBalance = async (): Promise<string> => {
    if (!userProfile?.address || typeof window === 'undefined' || !window.ethereum) {
      return '0'
    }

    try {
      const provider = new ethers.BrowserProvider(window.ethereum)
      const balanceWei = await provider.getBalance(userProfile.address)
      const balance = ethers.formatEther(balanceWei)
      
      // Update profile with new balance
      const updatedProfile = { ...userProfile, balance }
      setUserProfile(updatedProfile)
      localStorage.setItem('talkstake_user_profile', JSON.stringify(updatedProfile))
      
      return balance
    } catch (error) {
      console.error('Error getting balance:', error)
      return '0'
    }
  }

  const value: WalletContextType = {
    isConnected,
    isLoading,
    userProfile,
    connectWallet,
    disconnectWallet,
    updateProfile,
    error,
    switchNetwork,
    getBalance
  }

  return (
    <WalletContext.Provider value={value}>
      {children}
    </WalletContext.Provider>
  )
}

export function useWallet() {
  const context = useContext(WalletContext)
  if (context === undefined) {
    throw new Error('useWallet must be used within a WalletProvider')
  }
  return context
}

// Utility functions
async function checkExistingUser(address: string): Promise<UserProfile | null> {
  try {
    // In a real app, this would be an API call to your backend
    // For now, we'll check localStorage for existing user data
    const existingProfiles = localStorage.getItem('talkstake_all_profiles')
    if (existingProfiles) {
      const profiles = JSON.parse(existingProfiles)
      const existing = profiles[address.toLowerCase()]
      if (existing) {
        return existing
      }
    }
    
    // Simulate API call delay
    await new Promise(resolve => setTimeout(resolve, 300))
    
    // Return null for new users
    return null
    
  } catch (error) {
    console.error('Error checking existing user:', error)
    return null
  }
}

// Helper function to save user profile to a global profiles store
function saveUserToGlobalStore(profile: UserProfile) {
  try {
    const existingProfiles = localStorage.getItem('talkstake_all_profiles')
    const profiles = existingProfiles ? JSON.parse(existingProfiles) : {}
    profiles[profile.address.toLowerCase()] = profile
    localStorage.setItem('talkstake_all_profiles', JSON.stringify(profiles))
  } catch (error) {
    console.error('Error saving user to global store:', error)
  }
}

export { SUPPORTED_WALLETS }