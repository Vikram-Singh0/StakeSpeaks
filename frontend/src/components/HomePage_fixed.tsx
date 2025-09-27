'use client';

import { useState } from 'react';
import { useWallet } from '@/contexts/WalletContext';
import { motion } from 'framer-motion';
import NavigationBar from './NavigationBar';
import SearchAndSessionsList from './SearchAndSessionsList';
import SessionDetails from './SessionDetails';

// Session interface matching the component requirements
interface Session {
  id: string;
  title: string;
  speaker: string;
  speakerAvatar: string;
  description: string;
  isLive: boolean;
  liveStatus: string;
  participants: number;
  stakeRequired: number;
  totalStaked: number;
  duration: number;
  estimatedYield: number;
  speakerRating: number;
  category: string;
  startTime: string;
  timeLeft: string;
  tags: string[];
  viewers: number;
  likes: number;
  comments: number;
}

// Mock data for sessions
const mockSessions: Session[] = [
  {
    id: '1',
    title: 'Web3 Development Masterclass',
    speaker: 'Sarah Chen',
    speakerAvatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=sarah',
    description: 'Learn the fundamentals of building decentralized applications with modern tools and frameworks.',
    participants: 847,
    stakeRequired: 5.2,
    totalStaked: 4403.4,
    duration: 120,
    estimatedYield: 8.5,
    speakerRating: 4.8,
    category: 'Technology',
    isLive: false,
    liveStatus: 'Upcoming',
    startTime: '2024-01-15T14:00:00Z',
    timeLeft: '2 hours',
    tags: ['Web3', 'Blockchain', 'DApp'],
    viewers: 1250,
    likes: 89,
    comments: 34
  },
  {
    id: '2',
    title: 'DeFi Strategies for 2024',
    speaker: 'Marcus Thompson',
    speakerAvatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=marcus',
    description: 'Explore the latest DeFi protocols and yield farming strategies for maximizing returns.',
    participants: 1203,
    stakeRequired: 8.7,
    totalStaked: 10466.1,
    duration: 90,
    estimatedYield: 12.0,
    speakerRating: 4.9,
    category: 'Finance',
    isLive: true,
    liveStatus: 'LIVE NOW',
    startTime: '2024-01-14T16:30:00Z',
    timeLeft: 'Live',
    tags: ['DeFi', 'Yield Farming', 'Protocol'],
    viewers: 2150,
    likes: 156,
    comments: 78
  },
  {
    id: '3',
    title: 'NFT Art Creation Workshop',
    speaker: 'Alex Rivera',
    speakerAvatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=alex',
    description: 'Create and mint your own NFT collection with professional techniques and market insights.',
    participants: 432,
    stakeRequired: 3.1,
    totalStaked: 1339.2,
    duration: 150,
    estimatedYield: 6.5,
    speakerRating: 4.7,
    category: 'Arts',
    isLive: false,
    liveStatus: 'Upcoming',
    startTime: '2024-01-16T10:00:00Z',
    timeLeft: '1 day',
    tags: ['NFT', 'Art', 'Creation'],
    viewers: 890,
    likes: 67,
    comments: 23
  },
  {
    id: '4',
    title: 'Cryptocurrency Trading Psychology',
    speaker: 'Dr. Emma Watson',
    speakerAvatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=emma',
    description: 'Master the mental game of trading and overcome emotional barriers to success.',
    participants: 689,
    stakeRequired: 4.8,
    totalStaked: 3307.2,
    duration: 75,
    estimatedYield: 9.5,
    speakerRating: 4.6,
    category: 'Psychology',
    isLive: false,
    liveStatus: 'Upcoming',
    startTime: '2024-01-17T18:00:00Z',
    timeLeft: '3 days',
    tags: ['Trading', 'Psychology', 'Mindset'],
    viewers: 1450,
    likes: 112,
    comments: 56
  },
  {
    id: '5',
    title: 'Smart Contract Security Audit',
    speaker: 'John Davidson',
    speakerAvatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=john',
    description: 'Learn how to identify vulnerabilities and secure your smart contracts against common attacks.',
    participants: 556,
    stakeRequired: 6.3,
    totalStaked: 3502.8,
    duration: 100,
    estimatedYield: 11.0,
    speakerRating: 4.9,
    category: 'Security',
    isLive: false,
    liveStatus: 'Upcoming',
    startTime: '2024-01-18T15:30:00Z',
    timeLeft: '4 days',
    tags: ['Security', 'Audit', 'Smart Contracts'],
    viewers: 1100,
    likes: 95,
    comments: 41
  }
];

export default function HomePage() {
  const { isConnected, userProfile, disconnectWallet } = useWallet();
  const [selectedSession, setSelectedSession] = useState<Session | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [sessionFilter, setSessionFilter] = useState<'all' | 'live' | 'upcoming'>('all');

  const handleLogout = () => {
    disconnectWallet();
  };

  const profile = userProfile || {
    address: '',
    username: 'Anonymous User',
    totalStaked: 0,
    totalEarnings: 0,
    balance: '0'
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900">
      {/* Navigation Bar */}
      <NavigationBar userProfile={profile} onLogout={handleLogout} />

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