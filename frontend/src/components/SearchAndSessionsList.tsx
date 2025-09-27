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

interface SearchAndSessionsListProps {
  sessions: Session[];
  selectedSession: Session | null;
  onSessionSelect: (session: Session) => void;
  searchQuery: string;
  onSearchChange: (query: string) => void;
  sessionFilter: 'all' | 'live' | 'upcoming';
  onFilterChange: (filter: 'all' | 'live' | 'upcoming') => void;
}

export default function SearchAndSessionsList({
  sessions,
  selectedSession,
  onSessionSelect,
  searchQuery,
  onSearchChange,
  sessionFilter,
  onFilterChange
}: SearchAndSessionsListProps) {
  // Filter sessions based on search and filter criteria
  const filteredSessions = sessions.filter(session => {
    // Search filter
    const matchesSearch = searchQuery === '' || 
      session.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      session.speaker.toLowerCase().includes(searchQuery.toLowerCase()) ||
      session.tags.some(tag => tag.toLowerCase().includes(searchQuery.toLowerCase()));

    // Status filter
    const matchesFilter = sessionFilter === 'all' ||
      (sessionFilter === 'live' && session.isLive) ||
      (sessionFilter === 'upcoming' && !session.isLive);

    return matchesSearch && matchesFilter;
  });

  return (
    <div className="space-y-4 h-full flex flex-col">
      {/* Search and Create Section - Compact */}
      <Card className="p-4 flex-shrink-0">
        <div className="space-y-3">
          {/* Search Bar */}
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
            <input
              type="text"
              placeholder="Search sessions..."
              value={searchQuery}
              onChange={(e) => onSearchChange(e.target.value)}
              className="w-full pl-10 pr-4 py-2.5 bg-gray-800/50 border border-gray-700 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:border-violet-500 transition-colors text-sm"
            />
          </div>

          {/* Create Session Button */}
          <Button 
            onClick={() => console.log('Create new session clicked')}
            className="w-full bg-gradient-to-r from-violet-600 to-blue-600 hover:from-violet-700 hover:to-blue-700 py-2.5 text-sm"
          >
            <Plus className="w-4 h-4 mr-2" />
            Create New Session
          </Button>

          {/* Filter Tabs */}
          <div className="flex space-x-1 bg-gray-800/50 p-1 rounded-lg">
            {[
              { id: 'all', label: 'All', icon: Calendar },
              { id: 'live', label: 'Live', icon: Radio },
              { id: 'upcoming', label: 'Upcoming', icon: CalendarClock }
            ].map((filter) => {
              const IconComponent = filter.icon;
              return (
                <button
                  key={filter.id}
                  onClick={() => onFilterChange(filter.id as any)}
                  className={`flex items-center space-x-1 px-2 py-1.5 rounded-md transition-all duration-300 flex-1 justify-center text-xs ${
                    sessionFilter === filter.id
                      ? 'bg-violet-600 text-white'
                      : 'text-gray-400 hover:text-white hover:bg-gray-700/50'
                  }`}
                >
                  <IconComponent className="w-3 h-3" />
                  <span className="hidden sm:inline">{filter.label}</span>
                </button>
              );
            })}
          </div>
        </div>
      </Card>

      {/* Sessions List */}
      <div className="flex-1 overflow-hidden">
        <div className="space-y-3 h-full overflow-y-auto pr-2">
          {filteredSessions.length === 0 ? (
            <Card className="p-6 text-center">
              <div className="text-gray-400">
                {searchQuery ? 'No sessions match your search.' : 'No sessions available.'}
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
                }`}>
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
                            {session.isLive ? (
                              <span className="px-2 py-0.5 bg-red-600 text-white text-xs rounded-full flex items-center">
                                <Radio className="w-2.5 h-2.5 mr-1" />
                                LIVE
                              </span>
                            ) : (
                              <span className="px-2 py-0.5 bg-blue-600 text-white text-xs rounded-full flex items-center">
                                <Timer className="w-2.5 h-2.5 mr-1" />
                                {session.timeLeft}
                              </span>
                            )}
                          </div>
                          <div className="text-right">
                            <div className="text-xs font-bold text-violet-400">
                              {session.stakeRequired} KDA
                            </div>
                          </div>
                        </div>

                        {/* Session Info */}
                        <h3 className="font-semibold text-white text-sm mb-1 line-clamp-2 leading-tight">
                          {session.title}
                        </h3>
                        <p className="text-xs text-gray-400 mb-2">
                          by {session.speaker}
                        </p>

                        {/* Stats */}
                        <div className="flex items-center space-x-3 text-xs text-gray-400 mb-2">
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
                            {session.speakerRating}
                          </div>
                        </div>

                        {/* Tags */}
                        <div className="flex flex-wrap gap-1">
                          {session.tags.slice(0, 2).map((tag) => (
                            <span 
                              key={tag}
                              className="px-2 py-0.5 bg-gray-800 text-gray-300 text-xs rounded-md"
                            >
                              {tag}
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