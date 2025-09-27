'use client';

import {
  Star,
  Radio,
  Users,
  Clock,
  Wallet,
  TrendingUp,
  Play,
  Heart,
  MessageSquare,
  Share2,
  Mic
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
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

interface SessionDetailsProps {
  session: Session | null;
  userProfile: any;
}

export default function SessionDetails({ session, userProfile }: SessionDetailsProps) {
  if (!session) {
    return (
      <Card>
        <CardContent className="p-12 text-center">
          <div className="mb-6">
            <h2 className="text-2xl font-bold bg-gradient-to-r from-violet-400 to-blue-400 bg-clip-text text-transparent mb-2">
              Welcome back, {userProfile?.username || 'User'}!
            </h2>
            <p className="text-gray-400">
              Connected: {userProfile?.address?.slice(0, 6)}...{userProfile?.address?.slice(-4)}
            </p>
          </div>
          <Mic className="w-16 h-16 text-gray-600 mx-auto mb-4" />
          <h3 className="text-lg font-semibold text-gray-400 mb-2">Select a Session</h3>
          <p className="text-sm text-gray-500">
            Choose a session from the left sidebar to view details and join the conversation
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      {/* Session Details Card */}
      <Card className="overflow-hidden">
        <div className="relative h-48 bg-gradient-to-br from-violet-900/50 to-blue-900/50">
          <div className="absolute inset-0 bg-black/20" />
          <div className="absolute bottom-4 left-4 right-4">
            <div className="flex items-center space-x-3 mb-2">
              <img 
                src={session.speakerAvatar} 
                alt={session.speaker}
                className="w-16 h-16 rounded-full border-2 border-white"
              />
              <div>
                <h2 className="text-xl font-bold text-white">{session.speaker}</h2>
                <div className="flex items-center space-x-2">
                  <Star className="w-4 h-4 text-yellow-400" />
                  <span className="text-sm text-white">{session.speakerRating}</span>
                </div>
              </div>
            </div>
            {session.isLive && (
              <span className="px-3 py-1 bg-red-600 text-white text-sm rounded-full flex items-center w-fit">
                <Radio className="w-4 h-4 mr-2 animate-pulse" />
                LIVE NOW
              </span>
            )}
          </div>
        </div>
        
        <CardContent className="p-6">
          <h1 className="text-2xl font-bold text-white mb-3">{session.title}</h1>
          <p className="text-gray-400 mb-4">{session.description}</p>
          
          {/* Session Stats */}
          <div className="grid grid-cols-2 gap-4 mb-6">
            <div className="bg-gray-800/50 p-3 rounded-lg">
              <div className="flex items-center justify-between mb-1">
                <span className="text-sm text-gray-400">Participants</span>
                <Users className="w-4 h-4 text-gray-400" />
              </div>
              <div className="text-lg font-bold text-white">
                {session.isLive ? session.viewers : session.participants}
              </div>
            </div>
            <div className="bg-gray-800/50 p-3 rounded-lg">
              <div className="flex items-center justify-between mb-1">
                <span className="text-sm text-gray-400">Duration</span>
                <Clock className="w-4 h-4 text-gray-400" />
              </div>
              <div className="text-lg font-bold text-white">{session.duration}min</div>
            </div>
            <div className="bg-gray-800/50 p-3 rounded-lg">
              <div className="flex items-center justify-between mb-1">
                <span className="text-sm text-gray-400">Stake Required</span>
                <Wallet className="w-4 h-4 text-gray-400" />
              </div>
              <div className="text-lg font-bold text-violet-400">{session.stakeRequired} KDA</div>
            </div>
            <div className="bg-gray-800/50 p-3 rounded-lg">
              <div className="flex items-center justify-between mb-1">
                <span className="text-sm text-gray-400">Est. Yield</span>
                <TrendingUp className="w-4 h-4 text-green-400" />
              </div>
              <div className="text-lg font-bold text-green-400">{session.estimatedYield}%</div>
            </div>
          </div>

          {/* Tags */}
          <div className="flex flex-wrap gap-2 mb-6">
            {session.tags.map((tag: string) => (
              <span 
                key={tag}
                className="px-3 py-1 bg-violet-600/20 text-violet-400 text-sm rounded-full border border-violet-600/30"
              >
                {tag}
              </span>
            ))}
          </div>

          {/* Action Buttons */}
          <div className="space-y-3">
            {session.isLive ? (
              <Button className="w-full bg-gradient-to-r from-red-600 to-orange-600 hover:from-red-700 hover:to-orange-700 animate-glow">
                <Play className="w-4 h-4 mr-2" />
                Join Live Session
              </Button>
            ) : (
              <Button className="w-full bg-gradient-to-r from-violet-600 to-blue-600 hover:from-violet-700 hover:to-blue-700">
                <Wallet className="w-4 h-4 mr-2" />
                Stake & Reserve Spot
              </Button>
            )}
            
            <div className="flex space-x-2">
              <Button variant="outline" size="sm" className="flex-1">
                <Heart className="w-4 h-4 mr-2" />
                {session.likes}
              </Button>
              <Button variant="outline" size="sm" className="flex-1">
                <MessageSquare className="w-4 h-4 mr-2" />
                {session.comments}
              </Button>
              <Button variant="outline" size="sm" className="flex-1">
                <Share2 className="w-4 h-4 mr-2" />
                Share
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Additional Session Info */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Session Timeline</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            <div className="flex items-center justify-between p-3 bg-gray-800/50 rounded-lg">
              <span className="text-sm text-gray-400">
                {session.isLive ? 'Started' : 'Starts'}
              </span>
              <span className="text-sm text-white">
                {new Date(session.startTime).toLocaleString()}
              </span>
            </div>
            <div className="flex items-center justify-between p-3 bg-gray-800/50 rounded-lg">
              <span className="text-sm text-gray-400">Total Staked</span>
              <span className="text-sm font-bold text-violet-400">
                {session.totalStaked} KDA
              </span>
            </div>
            <div className="flex items-center justify-between p-3 bg-gray-800/50 rounded-lg">
              <span className="text-sm text-gray-400">Category</span>
              <span className="text-sm text-white">{session.category}</span>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}