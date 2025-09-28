'use client';

import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { useWallet } from '@/contexts/WalletContext';
import { SpeakerSession } from '@/services/filecoinStorage';
import SearchAndSessionsList from './SearchAndSessionsList';
import SessionDetails from './SessionDetails';
import NavigationBar from './NavigationBar';

// Mock data for sessions - simplified for now
const mockSessions: SpeakerSession[] = [];

export default function HomePageFixed() {
  const { isConnected, userProfile, disconnectWallet } = useWallet();
  const [selectedSession, setSelectedSession] = useState<SpeakerSession | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [sessionFilter, setSessionFilter] = useState<'all' | 'live' | 'upcoming' | 'past'>('all');

  const handleLogout = () => {
    disconnectWallet();
  };

  const handleProfileClick = () => {
    console.log('Profile clicked');
    // Add profile management logic here
  };

  const profile = userProfile ? {
    address: userProfile.address,
    username: userProfile.username,
    name: userProfile.username, // Use username as name
    photoUrl: userProfile.avatar, // Use avatar as photoUrl
    totalStaked: userProfile.totalStaked,
    totalEarnings: userProfile.totalEarnings,
    balance: userProfile.balance || '0',
    isLoadingProfile: false,
    hasFilecoinProfile: false,
    twitterHandle: ''
  } : {
    address: '',
    username: 'Anonymous User',
    name: 'Anonymous User',
    photoUrl: '',
    totalStaked: 0,
    totalEarnings: 0,
    balance: '0',
    isLoadingProfile: false,
    hasFilecoinProfile: false,
    twitterHandle: ''
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900">
      {/* Navigation Bar */}
      <NavigationBar userProfile={profile} onLogout={handleLogout} onProfileClick={handleProfileClick} />

      {/* Main Content */}
      <div className="container mx-auto px-6 py-8">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.2 }}
          className="grid grid-cols-1 xl:grid-cols-[400px_1fr] gap-6 h-[calc(100vh-140px)]"
        >
          {/* Left Column - Search & Sessions (Narrow) */}
          <SearchAndSessionsList 
            sessions={mockSessions}
            selectedSession={selectedSession}
            onSessionSelect={setSelectedSession}
            searchQuery={searchQuery}
            onSearchChange={setSearchQuery}
            sessionFilter={sessionFilter}
            onFilterChange={setSessionFilter}
          />

          {/* Right Column - Session Details (Wide) */}
          <SessionDetails 
            session={selectedSession}
            userProfile={profile}
          />
        </motion.div>
      </div>
    </div>
  );
}