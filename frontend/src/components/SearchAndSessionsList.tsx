'use client';

import { useState } from 'react';
import { motion } from 'framer-motion';
import {
  Search,
  Plus,
  Calendar,
  Radio,
  CalendarClock,
  Timer,
  Eye,
  Clock,
  Star
} from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { SpeakerSession } from '../services/filecoinStorage';

// Utility function to calculate time left until session starts
const getTimeLeft = (startTime: string, status: string, isLive: boolean): string => {
  if (isLive || status === 'live') return 'LIVE NOW';
  if (status === 'completed') return 'Completed';
  if (status === 'cancelled') return 'Cancelled';
  
  const start = new Date(startTime);
  const now = new Date();
  const diff = start.getTime() - now.getTime();
  
  // If time has passed, it should be live or completed
  if (diff < 0) {
    // Check if it should still be running
    return 'Started';
  }
  
  const days = Math.floor(diff / (1000 * 60 * 60 * 24));
  const hours = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
  const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
  
  if (days > 0) return `${days} day${days > 1 ? 's' : ''}`;
  if (hours > 0) return `${hours} hour${hours > 1 ? 's' : ''}`;
  if (minutes > 0) return `${minutes} min${minutes > 1 ? 's' : ''}`;
  return 'Starting soon';
};

// Updated function to use actual speaker rating from session
const getSpeakerRating = (session: SpeakerSession): number => {
  // Use actual speaker rating from session, fallback to calculated rating or default
  if (session.speakerRating > 0) return session.speakerRating;
  if (session.averageRating > 0) return session.averageRating;
  return 4.5; // Static default for new speakers (no more random fluctuation)
};

interface SearchAndSessionsListProps {
  sessions: SpeakerSession[];
  selectedSession: SpeakerSession | null;
  onSessionSelect: (session: SpeakerSession) => void;
  searchQuery: string;
  onSearchChange: (query: string) => void;
  sessionFilter: 'all' | 'live' | 'upcoming' | 'past';
  onFilterChange: (filter: 'all' | 'live' | 'upcoming' | 'past') => void;
  onCreateNewEvent?: () => void;
  isLoadingSessions?: boolean;
}

export default function SearchAndSessionsList({
  sessions,
  selectedSession,
  onSessionSelect,
  searchQuery,
  onSearchChange,
  sessionFilter,
  onFilterChange,
  onCreateNewEvent,
  isLoadingSessions = false
}: SearchAndSessionsListProps) {
  
  // Filter sessions based on search query and filter
  const filteredSessions = sessions.filter(session => {
    const matchesSearch = session.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         session.speaker.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         session.topics.some(topic => topic.toLowerCase().includes(searchQuery.toLowerCase()));
    
    if (!matchesSearch) return false;

    // Use the same logic as the backend filtering for consistency
    const now = new Date();
    const startTime = new Date(session.startTime);
    const endTime = session.endTime 
      ? new Date(session.endTime) 
      : new Date(startTime.getTime() + (session.duration * 60 * 1000));

    switch (sessionFilter) {
      case 'live':
        return session.status === 'live' || session.isLive || (now >= startTime && now <= endTime);
      case 'upcoming':
        return session.status === 'scheduled' && startTime > now;
      case 'past':
        return session.status === 'completed' || session.status === 'cancelled' || endTime < now;
      case 'all':
      default:
        return true;
    }
  });

  const filters = [
    { key: 'all', label: 'All', icon: Calendar },
    { key: 'live', label: 'Live', icon: Radio },
    { key: 'upcoming', label: 'Upcoming', icon: CalendarClock },
    { key: 'past', label: 'Past', icon: Timer }
  ];

  return (
    <div className="flex flex-col h-full space-y-4">
      {/* Search and Create Section */}
      <Card className="bg-gray-800/50 border-gray-700">
        <CardContent className="p-4">
          <div className="space-y-4">
            {/* Search Bar */}
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
              <input
                type="text"
                placeholder="Search sessions..."
                value={searchQuery}
                onChange={(e) => onSearchChange(e.target.value)}
                className="w-full pl-10 pr-4 py-2 bg-gray-700/50 border border-gray-600/50 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-violet-500 focus:border-transparent text-sm"
              />
            </div>

            {/* Create Session Button */}
            <Button 
              onClick={onCreateNewEvent}
              className="w-full bg-gradient-to-r from-violet-600 to-blue-600 hover:from-violet-700 hover:to-blue-700 text-white text-sm py-2"
            >
              <Plus className="w-4 h-4 mr-2" />
              Create New Event
            </Button>

            {/* Filter Buttons */}
            <div className="flex gap-2">
              {filters.map((filter) => {
                const IconComponent = filter.icon;
                return (
                  <button
                    key={filter.key}
                    onClick={() => onFilterChange(filter.key as 'all' | 'live' | 'upcoming' | 'past')}
                    className={`flex items-center space-x-1 px-3 py-1.5 rounded-lg text-xs font-medium transition-all flex-1 justify-center ${
                      sessionFilter === filter.key
                        ? 'bg-gradient-to-r from-violet-600 to-blue-600 text-white'
                        : 'bg-gray-700/50 text-gray-300 hover:bg-gray-600/50'
                    }`}
                  >
                    <IconComponent className="w-3 h-3" />
                    <span>{filter.label}</span>
                  </button>
                );
              })}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Sessions List */}
      <div className="flex-1 overflow-hidden">
        <div className="space-y-3 h-full overflow-y-auto pr-2">
          {isLoadingSessions ? (
            <div className="text-center p-6">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-violet-500 mx-auto"></div>
              <p className="text-gray-400 text-sm mt-2">Loading sessions...</p>
            </div>
          ) : filteredSessions.length === 0 ? (
            <Card className="p-6 text-center bg-gray-800/50 border-gray-700">
              <div className="text-gray-400 text-sm">
                {searchQuery ? 'No sessions match your search.' : sessions.length === 0 ? 'No sessions created yet. Create your first session!' : 'No sessions match the current filter.'}
              </div>
            </Card>
          ) : (
            filteredSessions.map((session, index) => (
              <motion.div
                key={session.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: index * 0.05 }}
                onClick={() => onSessionSelect(session)}
                className={`cursor-pointer transition-all duration-300 ${
                  selectedSession?.id === session.id ? 'scale-[1.02]' : ''
                }`}
              >
                <Card className={`hover:border-violet-500/50 transition-all duration-300 ${
                  selectedSession?.id === session.id 
                    ? 'border-violet-500 bg-violet-500/5' 
                    : 'border-gray-700'
                } bg-gray-800/50`}>
                  <CardContent className="p-3">
                    <div className="flex items-start space-x-3">
                      {/* Speaker Avatar */}
                      <img 
                        src={session.speakerAvatar} 
                        alt={session.speaker}
                        className="w-10 h-10 rounded-full flex-shrink-0"
                      />
                      
                      <div className="flex-1 min-w-0">
                        {/* Session Header */}
                        <div className="flex items-center justify-between mb-2">
                          <div className="flex items-center space-x-2">
                            {(session.isLive || session.status === 'live') ? (
                              <span className="px-2 py-0.5 bg-red-600 text-white text-xs rounded-full flex items-center animate-pulse">
                                <Radio className="w-2.5 h-2.5 mr-1" />
                                LIVE
                              </span>
                            ) : session.status === 'completed' ? (
                              <span className="px-2 py-0.5 bg-gray-600 text-white text-xs rounded-full flex items-center">
                                <Timer className="w-2.5 h-2.5 mr-1" />
                                Completed
                              </span>
                            ) : session.status === 'cancelled' ? (
                              <span className="px-2 py-0.5 bg-red-800 text-white text-xs rounded-full flex items-center">
                                <Timer className="w-2.5 h-2.5 mr-1" />
                                Cancelled
                              </span>
                            ) : (
                              <span className="px-2 py-0.5 bg-blue-600 text-white text-xs rounded-full flex items-center">
                                <Timer className="w-2.5 h-2.5 mr-1" />
                                {getTimeLeft(session.startTime, session.status, session.isLive)}
                              </span>
                            )}
                          </div>
                          <div className="text-xs text-violet-400 font-medium">
                            {session.entryFee} ETH
                          </div>
                        </div>

                        {/* Session Title & Speaker */}
                        <h3 className="font-semibold text-sm text-white mb-1 truncate">
                          {session.title}
                        </h3>
                        <p className="text-xs text-gray-400 mb-2">by {session.speaker}</p>

                        {/* Session Stats */}
                        <div className="flex items-center space-x-3 text-xs text-gray-500 mb-2">
                          <div className="flex items-center">
                            <Eye className="w-3 h-3 mr-1" />
                            {session.isLive ? session.viewers : session.participants}
                          </div>
                          <div className="flex items-center">
                            <Clock className="w-3 h-3 mr-1" />
                            {session.duration}m
                          </div>
                          <div className="flex items-center">
                            <Star className="w-3 h-3 mr-1 text-yellow-500" />
                            {getSpeakerRating(session).toFixed(1)}
                          </div>
                        </div>

                        {/* Tags */}
                        <div className="flex flex-wrap gap-1">
                          {session.topics.slice(0, 2).map((topic: string) => (
                            <span 
                              key={topic}
                              className="px-2 py-0.5 bg-gray-700/70 text-gray-300 text-xs rounded-md"
                            >
                              {topic}
                            </span>
                          ))}
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </motion.div>
            ))
          )}
        </div>
      </div>
    </div>
  );
}