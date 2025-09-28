'use client';

import { useState, useEffect } from 'react';
import { useWallet } from '@/contexts/WalletContext';
import { motion } from 'framer-motion';
import NavigationBar from './NavigationBar';
import SearchAndSessionsList from './SearchAndSessionsList';
import SessionDetails from './SessionDetails';
import ProfileManager from './ProfileManager';
import LiveSessionRoom from './LiveSessionRoom';
import { CreateSessionModal } from './CreateSessionModal';
import { filecoinStorage, UserProfile, SpeakerSession } from '../services/filecoinStorage';

export default function HomePage() {
  const { isConnected, userProfile, disconnectWallet, loadProfileFromFilecoin } = useWallet();
  const [selectedSession, setSelectedSession] = useState<SpeakerSession | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [sessionFilter, setSessionFilter] = useState<'all' | 'live' | 'upcoming' | 'past'>('all');
  const [showProfileManager, setShowProfileManager] = useState(false);
  const [showCreateSession, setShowCreateSession] = useState(false);
  const [filecoinProfile, setFilecoinProfile] = useState<UserProfile | null>(null);
  const [isLoadingProfile, setIsLoadingProfile] = useState(false);
  const [sessions, setSessions] = useState<SpeakerSession[]>([]);
  const [isLoadingSessions, setIsLoadingSessions] = useState(false);
  const [currentLiveSession, setCurrentLiveSession] = useState<SpeakerSession | null>(null);

  // Load profile from Filecoin when user connects
  useEffect(() => {
    if (userProfile?.address) {
      loadFilecoinProfile();
      loadSessions();
    }
  }, [userProfile?.address]);

  // Load sessions when filter changes
  useEffect(() => {
    if (userProfile?.address) {
      loadSessions();
    }
  }, [sessionFilter, userProfile?.address]);

  // Periodic refresh to update session statuses (every 30 seconds)
  useEffect(() => {
    if (!userProfile?.address) return;

    const interval = setInterval(() => {
      console.log('🔄 Auto-refreshing sessions to update statuses...');
      loadSessions();
    }, 30000); // Refresh every 30 seconds

    return () => clearInterval(interval);
  }, [userProfile?.address, sessionFilter]);

  const loadFilecoinProfile = async () => {
    if (!userProfile?.address) return;
    
    setIsLoadingProfile(true);
    try {
      console.log('🔍 Loading profile from Filecoin for:', userProfile.address);
      const profile = await filecoinStorage.getUserProfile(userProfile.address);
      if (profile) {
        setFilecoinProfile(profile);
        console.log('✅ Profile loaded from Filecoin:', profile.name);
      } else {
        console.log('📝 No profile found, user needs to create one');
        setFilecoinProfile(null);
      }
    } catch (error) {
      console.error('❌ Error loading profile:', error);
    } finally {
      setIsLoadingProfile(false);
    }
  };

  const loadSessions = async () => {
    setIsLoadingSessions(true);
    try {
      console.log('📥 Loading sessions from Filecoin...', { filter: sessionFilter });
      const loadedSessions = await filecoinStorage.getFilteredSessions(sessionFilter);
      setSessions(loadedSessions);
      console.log(`✅ Loaded ${loadedSessions.length} sessions`);
    } catch (error) {
      console.error('❌ Error loading sessions:', error);
      setSessions([]);
    } finally {
      setIsLoadingSessions(false);
    }
  };

  const handleCreateSession = async (sessionData: Omit<SpeakerSession, 'id' | 'createdAt' | 'updatedAt' | 'filecoinHash' | 'averageRating' | 'totalRatings' | 'speakerRating' | 'engagementScore' | 'reviews' | 'completionRate' | 'recommendationScore'>) => {
    try {
      console.log('📝 Creating new session...', sessionData.title);
      const newSession = await filecoinStorage.createSpeakerSession(sessionData);
      
      // Add to local state immediately (optimistic update)
      setSessions(prev => [newSession, ...prev]);
      
      console.log('✅ Session created successfully:', newSession.id);
      
      // Show success message
      alert('🎉 Session created successfully! It will appear in the sessions list.');
      
      // Reload sessions after a short delay to ensure consistency (but don't duplicate)
      setTimeout(async () => {
        try {
          const refreshedSessions = await filecoinStorage.getFilteredSessions(sessionFilter);
          setSessions(refreshedSessions);
        } catch (error) {
          console.error('❌ Error refreshing sessions:', error);
        }
      }, 2000);
      
    } catch (error) {
      console.error('❌ Error creating session:', error);
      throw error;
    }
  };

  const handleLogout = () => {
    disconnectWallet();
  };

  const handleProfileClick = () => {
    setShowProfileManager(true);
  };

  const handleCreateNewEvent = () => {
    if (!filecoinProfile) {
      alert('Please complete your profile first before creating sessions.');
      setShowProfileManager(true);
      return;
    }
    setShowCreateSession(true);
  };

  const handleProfileUpdate = async (updatedProfile: UserProfile) => {
    // Profile is already stored on Filecoin by ProfileManager
    // Refresh the local Filecoin profile data
    setFilecoinProfile(updatedProfile);
    
    // Also reload from Filecoin to ensure consistency
    await loadFilecoinProfile();
    
    // Reload it in the wallet context if needed
    if (updatedProfile.walletAddress && loadProfileFromFilecoin) {
      await loadProfileFromFilecoin(updatedProfile.walletAddress);
    }
    
    setShowProfileManager(false);
  };

  const handleJoinSession = (session: SpeakerSession) => {
    setCurrentLiveSession(session);
  };

  const handleLeaveSession = () => {
    setCurrentLiveSession(null);
  };

  // Create enhanced profile for navbar (combines wallet + Filecoin data)
  const profile = {
    address: userProfile?.address || '',
    username: filecoinProfile?.name || userProfile?.username || 'Anonymous User',
    name: filecoinProfile?.name || 'Anonymous User',
    photoUrl: filecoinProfile?.photoUrl || `https://api.dicebear.com/7.x/identicon/svg?seed=${userProfile?.address || 'default'}`,
    bio: filecoinProfile?.bio || '',
    twitterHandle: filecoinProfile?.twitterHandle || '',
    totalStaked: filecoinProfile?.totalStaked || userProfile?.totalStaked || 0,
    totalEarnings: filecoinProfile?.totalEarnings || userProfile?.totalEarnings || 0,
    balance: userProfile?.balance || '0',
    isLoadingProfile,
    hasFilecoinProfile: !!filecoinProfile
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900">
      {/* Live Session Room */}
      {currentLiveSession && (
        <LiveSessionRoom
          session={currentLiveSession}
          userProfile={profile}
          onLeave={handleLeaveSession}
        />
      )}

      {/* Navigation Bar */}
      <NavigationBar 
        userProfile={profile} 
        onLogout={handleLogout}
        onProfileClick={handleProfileClick}
      />

      {/* Main Content */}
      <div className="container mx-auto px-6 py-8">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.2 }}
          className="grid grid-cols-12 gap-8 h-[calc(100vh-140px)]"
        >
          {/* Left Column - Search & Sessions (Narrower) */}
          <div className="col-span-12 lg:col-span-5">
            <SearchAndSessionsList 
              sessions={sessions}
              selectedSession={selectedSession}
              onSessionSelect={setSelectedSession}
              searchQuery={searchQuery}
              onSearchChange={setSearchQuery}
              sessionFilter={sessionFilter}
              onFilterChange={setSessionFilter}
              onCreateNewEvent={handleCreateNewEvent}
              isLoadingSessions={isLoadingSessions}
            />
          </div>

          {/* Right Column - Session Details (Wider) */}
          <div className="col-span-12 lg:col-span-7">
            <SessionDetails 
              session={selectedSession}
              userProfile={profile}
              onJoinSession={handleJoinSession}
            />
          </div>
        </motion.div>
      </div>

      {/* Profile Manager Modal */}
      <ProfileManager
        isOpen={showProfileManager}
        onClose={() => setShowProfileManager(false)}
        onProfileUpdate={handleProfileUpdate}
      />

      {/* Create Session Modal */}
      <CreateSessionModal
        isOpen={showCreateSession}
        onClose={() => setShowCreateSession(false)}
        onCreateSession={handleCreateSession}
        userAddress={userProfile?.address || ''}
        userName={filecoinProfile?.name || 'Anonymous User'}
        userPhotoUrl={filecoinProfile?.photoUrl || `https://api.dicebear.com/7.x/identicon/svg?seed=${userProfile?.address || 'default'}`}
      />
    </div>
  );
}