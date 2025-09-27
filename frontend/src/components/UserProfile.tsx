'use client'

import { useState } from 'react'
import { motion } from 'framer-motion'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { useWallet } from '@/contexts/WalletContext'
import { 
  User, 
  Edit3, 
  Star, 
  Calendar, 
  TrendingUp, 
  Wallet,
  Badge,
  Award,
  Copy,
  Check,
  Settings
} from 'lucide-react'

interface UserProfileProps {
  className?: string
}

export default function UserProfile({ className = '' }: UserProfileProps) {
  const { userProfile, updateProfile, disconnectWallet } = useWallet()
  const [isEditing, setIsEditing] = useState(false)
  const [copiedAddress, setCopiedAddress] = useState(false)
  const [editForm, setEditForm] = useState({
    username: userProfile?.username || '',
    bio: userProfile?.bio || '',
    expertise: userProfile?.expertise?.join(', ') || ''
  })

  if (!userProfile) {
    return (
      <Card className={className}>
        <CardContent className="p-6 text-center">
          <div className="text-gray-400">No profile data available</div>
        </CardContent>
      </Card>
    )
  }

  const handleCopyAddress = async () => {
    try {
      await navigator.clipboard.writeText(userProfile.address)
      setCopiedAddress(true)
      setTimeout(() => setCopiedAddress(false), 2000)
    } catch (err) {
      console.error('Failed to copy address:', err)
    }
  }

  const handleSaveProfile = () => {
    updateProfile({
      username: editForm.username,
      bio: editForm.bio,
      expertise: editForm.expertise.split(',').map(s => s.trim()).filter(Boolean)
    })
    setIsEditing(false)
  }

  const handleCancelEdit = () => {
    setEditForm({
      username: userProfile.username || '',
      bio: userProfile.bio || '',
      expertise: userProfile.expertise?.join(', ') || ''
    })
    setIsEditing(false)
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    })
  }

  const formatAddress = (address: string) => {
    if (address.length <= 10) return address
    return `${address.slice(0, 6)}...${address.slice(-4)}`
  }

  return (
    <div className={`space-y-6 ${className}`}>
      {/* Profile Header Card */}
      <Card className="glass-effect">
        <CardHeader>
          <div className="flex items-start justify-between">
            <div className="flex items-center space-x-4">
              <div className="w-16 h-16 rounded-full overflow-hidden bg-gradient-to-br from-violet-600 to-blue-600 flex items-center justify-center">
                {userProfile.avatar ? (
                  <img src={userProfile.avatar} alt="Profile" className="w-full h-full object-cover" />
                ) : (
                  <User className="w-8 h-8 text-white" />
                )}
              </div>
              <div className="flex-1">
                {!isEditing ? (
                  <>
                    <div className="flex items-center space-x-2 mb-1">
                      <h2 className="text-2xl font-bold text-white">{userProfile.username}</h2>
                      {userProfile.isExpert && (
                        <div className="bg-gradient-to-r from-violet-600 to-blue-600 text-white px-2 py-1 rounded-full text-xs font-medium flex items-center">
                          <Award className="w-3 h-3 mr-1" />
                          Expert
                        </div>
                      )}
                    </div>
                    <p className="text-gray-400 text-sm mb-2">
                      {userProfile.bio || 'No bio provided'}
                    </p>
                  </>
                ) : (
                  <div className="space-y-3 min-w-64">
                    <input
                      type="text"
                      placeholder="Username"
                      value={editForm.username}
                      onChange={(e) => setEditForm({...editForm, username: e.target.value})}
                      className="w-full bg-zinc-800 border border-zinc-700 rounded-lg px-3 py-2 text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-violet-500"
                    />
                    <textarea
                      placeholder="Bio"
                      value={editForm.bio}
                      onChange={(e) => setEditForm({...editForm, bio: e.target.value})}
                      rows={2}
                      className="w-full bg-zinc-800 border border-zinc-700 rounded-lg px-3 py-2 text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-violet-500 resize-none"
                    />
                  </div>
                )}
                
                <div className="flex items-center space-x-2">
                  <button
                    onClick={handleCopyAddress}
                    className="flex items-center space-x-1 text-sm text-gray-400 hover:text-violet-400 transition-colors"
                  >
                    <Wallet className="w-4 h-4" />
                    <span>{formatAddress(userProfile.address)}</span>
                    {copiedAddress ? (
                      <Check className="w-4 h-4 text-green-400" />
                    ) : (
                      <Copy className="w-4 h-4" />
                    )}
                  </button>
                </div>
              </div>
            </div>
            
            <div className="flex items-center space-x-2">
              {!isEditing ? (
                <>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => setIsEditing(true)}
                  >
                    <Edit3 className="w-4 h-4 mr-1" />
                    Edit
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={disconnectWallet}
                  >
                    <Settings className="w-4 h-4 mr-1" />
                    Settings
                  </Button>
                </>
              ) : (
                <>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={handleCancelEdit}
                  >
                    Cancel
                  </Button>
                  <Button
                    variant="gradient"
                    size="sm"
                    onClick={handleSaveProfile}
                  >
                    Save
                  </Button>
                </>
              )}
            </div>
          </div>
        </CardHeader>
      </Card>

      {/* Stats Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card className="glass-effect">
          <CardContent className="p-4 text-center">
            <div className="text-2xl font-bold text-violet-400 mb-1">
              {userProfile.totalStaked.toFixed(2)}
            </div>
            <div className="text-sm text-gray-400">KDA Staked</div>
          </CardContent>
        </Card>

        <Card className="glass-effect">
          <CardContent className="p-4 text-center">
            <div className="text-2xl font-bold text-green-400 mb-1">
              {userProfile.totalEarnings.toFixed(2)}
            </div>
            <div className="text-sm text-gray-400">KDA Earned</div>
          </CardContent>
        </Card>

        <Card className="glass-effect">
          <CardContent className="p-4 text-center">
            <div className="text-2xl font-bold text-blue-400 mb-1">
              {userProfile.sessionsJoined}
            </div>
            <div className="text-sm text-gray-400">Sessions Joined</div>
          </CardContent>
        </Card>

        <Card className="glass-effect">
          <CardContent className="p-4 text-center">
            <div className="text-2xl font-bold text-yellow-400 mb-1 flex items-center justify-center">
              {userProfile.reputation > 0 ? userProfile.reputation.toFixed(1) : 'New'}
              {userProfile.reputation > 0 && <Star className="w-4 h-4 ml-1" />}
            </div>
            <div className="text-sm text-gray-400">Reputation</div>
          </CardContent>
        </Card>
      </div>

      {/* Expertise and Details */}
      <div className="grid md:grid-cols-2 gap-6">
        <Card className="glass-effect">
          <CardHeader>
            <CardTitle className="flex items-center">
              <Badge className="w-5 h-5 mr-2 text-violet-400" />
              Expertise
            </CardTitle>
          </CardHeader>
          <CardContent>
            {!isEditing ? (
              <div className="flex flex-wrap gap-2">
                {userProfile.expertise && userProfile.expertise.length > 0 ? (
                  userProfile.expertise.map((skill, index) => (
                    <span
                      key={index}
                      className="bg-violet-600/20 text-violet-300 px-3 py-1 rounded-full text-sm border border-violet-500/30"
                    >
                      {skill}
                    </span>
                  ))
                ) : (
                  <span className="text-gray-400 text-sm">No expertise added yet</span>
                )}
              </div>
            ) : (
              <input
                type="text"
                placeholder="Enter skills separated by commas (e.g., DeFi, Smart Contracts, Trading)"
                value={editForm.expertise}
                onChange={(e) => setEditForm({...editForm, expertise: e.target.value})}
                className="w-full bg-zinc-800 border border-zinc-700 rounded-lg px-3 py-2 text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-violet-500"
              />
            )}
          </CardContent>
        </Card>

        <Card className="glass-effect">
          <CardHeader>
            <CardTitle className="flex items-center">
              <Calendar className="w-5 h-5 mr-2 text-blue-400" />
              Account Details
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="flex justify-between items-center">
              <span className="text-gray-400">Member Since</span>
              <span className="text-white">{formatDate(userProfile.joinedDate)}</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-gray-400">Account Type</span>
              <span className={`${userProfile.isExpert ? 'text-violet-400' : 'text-white'}`}>
                {userProfile.isExpert ? 'Expert' : 'Regular'}
              </span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-gray-400">Status</span>
              <span className="text-green-400 flex items-center">
                <div className="w-2 h-2 bg-green-400 rounded-full mr-2" />
                Active
              </span>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}