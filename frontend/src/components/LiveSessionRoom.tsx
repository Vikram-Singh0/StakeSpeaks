'use client';

import { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Mic,
  MicOff,
  Video,
  VideoOff,
  MessageSquare,
  Users,
  PhoneOff,
  Send,
  Hand,
  Crown,
  Shield,
  ChevronRight,
  Wifi,
  WifiOff,
  Settings,
  Share2,
  Volume2,
  Star,
  Zap,
  Monitor,
  MonitorOff,
  Radio,
  Eye,
  EyeOff,
  User,
  UserCheck,
  UserPlus,
  Bell,
  BellOff,
  Lock,
  Unlock,
  Heart,
  ThumbsUp,
  ThumbsDown,
  Gift,
  Sparkles
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { SpeakerSession } from '../services/filecoinStorage';

interface Message {
  id: string;
  userId: string;
  username: string;
  avatar: string;
  content: string;
  timestamp: Date;
  type: 'text' | 'system' | 'speak_request';
}

interface Participant {
  id: string;
  userId: string;
  username: string;
  avatar: string;
  isSpeaking: boolean;
  isMuted: boolean;
  isVideoOn: boolean;
  role: 'speaker' | 'participant' | 'moderator';
  speakRequested: boolean;
}

interface LiveSessionRoomProps {
  session: SpeakerSession;
  userProfile: {
    address: string;
    username: string;
    photoUrl: string;
  };
  onLeave: () => void;
}

export default function LiveSessionRoom({ session, userProfile, onLeave }: LiveSessionRoomProps) {
  const [isMuted, setIsMuted] = useState(false);
  const [isVideoOn, setIsVideoOn] = useState(true);
  const [speakRequested, setSpeakRequested] = useState(false);
  const [messages, setMessages] = useState<Message[]>([]);
  const [newMessage, setNewMessage] = useState('');
  const [participants, setParticipants] = useState<Participant[]>([]);
  const [showChat, setShowChat] = useState(true);
  const [showParticipants, setShowParticipants] = useState(false);
  const [isConnected, setIsConnected] = useState(false);
  const [audioInitialized, setAudioInitialized] = useState(false);
  
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const localStreamRef = useRef<MediaStream | null>(null);

  // Initialize session
  useEffect(() => {
    const initializeSession = async () => {
      try {
        // Add welcome message
        const welcomeMessage: Message = {
          id: `welcome-${Date.now()}`,
          userId: 'system',
          username: 'System',
          avatar: '',
          content: `Welcome to "${session.title}"! The session is now live.`,
          timestamp: new Date(),
          type: 'system'
        };
        setMessages([welcomeMessage]);

        // Add session speaker as first participant
        const speakerParticipant: Participant = {
          id: `speaker-${session.id}`,
          userId: session.speaker,
          username: 'Stranger',
          avatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150&h=150&fit=crop&crop=face',
          isSpeaking: true,
          isMuted: false,
          isVideoOn: true,
          role: 'speaker',
          speakRequested: false
        };

        // Add current user as participant
        const currentUserParticipant: Participant = {
          id: `user-${userProfile.address}`,
          userId: userProfile.address,
          username: 'Stranger',
          avatar: 'https://images.unsplash.com/photo-1494790108755-2616b612b5e5?w=150&h=150&fit=crop&crop=face',
          isSpeaking: false,
          isMuted: false,
          isVideoOn: true,
          role: 'participant',
          speakRequested: false
        };

        // Add some additional participants for demo
        const additionalParticipants: Participant[] = [
          {
            id: 'participant-1',
            userId: 'participant-1',
            username: 'Learning',
            avatar: 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=150&h=150&fit=crop&crop=face',
            isSpeaking: false,
            isMuted: true,
            isVideoOn: true,
            role: 'participant',
            speakRequested: false
          }
        ];

        setParticipants([speakerParticipant, currentUserParticipant, ...additionalParticipants]);

        // Initialize audio
        await initializeAudio();

        // Simulate connection
        setTimeout(() => {
          setIsConnected(true);
        }, 1000);

      } catch (error) {
        console.error('Error initializing session:', error);
      }
    };

    initializeSession();
    
    return () => {
      cleanup();
    };
  }, [session.id, session.title, session.speaker, session.speakerAvatar, userProfile.address, userProfile.username, userProfile.photoUrl]);

  const initializeAudio = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        audio: {
          echoCancellation: true,
          noiseSuppression: true,
          autoGainControl: true,
        },
        video: false
      });
      
      localStreamRef.current = stream;
      setAudioInitialized(true);
      console.log('Audio initialized successfully');
    } catch (error) {
      console.error('Error initializing audio:', error);
      setAudioInitialized(false);
    }
  };

  const cleanup = () => {
    if (localStreamRef.current) {
      localStreamRef.current.getTracks().forEach(track => track.stop());
      localStreamRef.current = null;
    }
  };

  // Auto-scroll to bottom of messages
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const handleSendMessage = () => {
    if (!newMessage.trim()) return;
    
    const message: Message = {
      id: `msg-${Date.now()}`,
      userId: userProfile.address,
      username: userProfile.username,
      avatar: userProfile.photoUrl,
      content: newMessage.trim(),
      timestamp: new Date(),
      type: 'text'
    };
    
    setMessages(prev => [...prev, message]);
    setNewMessage('');
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  const handleSpeakRequest = () => {
    setSpeakRequested(!speakRequested);
    
    // Update participant status
    setParticipants(prev => 
      prev.map(p => 
        p.userId === userProfile.address 
          ? { ...p, speakRequested: !speakRequested }
          : p
      )
    );
  };

  const toggleMute = () => {
    const newMutedState = !isMuted;
    setIsMuted(newMutedState);
    
    if (localStreamRef.current) {
      localStreamRef.current.getAudioTracks().forEach(track => {
        track.enabled = !newMutedState;
      });
    }
    
    // Update participant status
    setParticipants(prev => 
      prev.map(p => 
        p.userId === userProfile.address 
          ? { ...p, isMuted: newMutedState }
          : p
      )
    );
  };

  const toggleVideo = () => {
    const newVideoState = !isVideoOn;
    setIsVideoOn(newVideoState);
    
    // Update participant status
    setParticipants(prev => 
      prev.map(p => 
        p.userId === userProfile.address 
          ? { ...p, isVideoOn: newVideoState }
          : p
      )
    );
  };

  const getRoleIcon = (role: string) => {
    switch (role) {
      case 'speaker':
        return <Crown className="w-3 h-3 text-yellow-500" />;
      case 'moderator':
        return <Shield className="w-3 h-3 text-blue-500" />;
      default:
        return null;
    }
  };

  const getRoleColor = (role: string) => {
    switch (role) {
      case 'speaker':
        return 'border-yellow-500/50 bg-yellow-500/10';
      case 'moderator':
        return 'border-blue-500/50 bg-blue-500/10';
      default:
        return 'border-gray-600/50 bg-gray-800/50';
    }
  };

  return (
    <div className="fixed inset-0 bg-black z-50 flex flex-col">
      {/* Clean Header */}
      <div className="bg-gray-900/95 backdrop-blur-sm border-b border-gray-700 px-6 py-4">
        <div className="flex items-center justify-between">
          {/* Session Info */}
          <div className="flex items-center space-x-4">
            <h1 className="text-xl font-bold text-white">Stake Speaks</h1>
            {isConnected && (
              <div className="flex items-center space-x-2 px-3 py-1 bg-green-500/20 rounded-full">
                <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
                <span className="text-green-400 text-sm font-medium">Live</span>
              </div>
            )}
          </div>
          
          {/* Top Right Controls */}
          <div className="flex items-center space-x-4">
            <div className="text-right">
              <div className="text-white font-medium">0.00 KDA</div>
            </div>
            <div className="flex items-center space-x-2">
              <div className="w-8 h-8 rounded-full bg-orange-500 flex items-center justify-center">
                <span className="text-white text-sm font-bold">S</span>
              </div>
              <span className="text-white text-sm">Stranger</span>
              <span className="text-gray-400 text-sm">Speaking</span>
            </div>
          </div>
        </div>
      </div>

      <div className="flex flex-1 overflow-hidden">
        {/* Main Video Area */}
        <div className="flex-1 flex flex-col">
          {/* Participant Grid - Cleaner Design */}
          <div className="flex-1 p-8">
            <div className="flex items-center justify-center h-full">
              <div className="grid grid-cols-2 gap-8">
                {participants.slice(0, 4).map((participant, index) => (
                  <motion.div
                    key={participant.id}
                    initial={{ opacity: 0, scale: 0.8 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ duration: 0.5, delay: index * 0.1 }}
                    className="relative flex flex-col items-center space-y-4"
                  >
                    {/* Clean Circular Avatar */}
                    <div className="relative">
                      <div className={`w-32 h-32 rounded-full overflow-hidden border-4 ${
                        participant.isSpeaking 
                          ? 'border-green-400 shadow-lg shadow-green-400/30' 
                          : participant.userId === userProfile.address 
                          ? 'border-blue-400 shadow-lg shadow-blue-400/30'
                          : 'border-gray-600'
                      } transition-all duration-300`}>
                        {/* Avatar Image with Gradient Background */}
                        <div className={`absolute inset-0 bg-gradient-to-br ${
                          participant.role === 'speaker' 
                            ? 'from-orange-500 to-yellow-500' 
                            : 'from-blue-500 to-purple-600'
                        }`} />
                        
                        <img
                          src={participant.avatar}
                          alt={participant.username}
                          className="w-full h-full object-cover relative z-10"
                        />
                        
                        {/* Speaking Animation Overlay */}
                        {participant.isSpeaking && (
                          <div className="absolute inset-0 bg-green-400/20 animate-pulse rounded-full z-20" />
                        )}
                      </div>
                      
                      {/* Status Indicators */}
                      <div className="absolute -bottom-1 -right-1">
                        <div className={`rounded-full p-2 shadow-lg ${
                          participant.isMuted ? 'bg-red-500' : 'bg-green-500'
                        }`}>
                          {participant.isMuted ? (
                            <MicOff className="w-4 h-4 text-white" />
                          ) : (
                            <Mic className="w-4 h-4 text-white" />
                          )}
                        </div>
                      </div>
                      
                      {/* Speaker Badge */}
                      {participant.role === 'speaker' && (
                        <div className="absolute -top-2 -left-2 bg-gradient-to-r from-yellow-400 to-orange-500 rounded-full p-2 shadow-lg">
                          <Crown className="w-4 h-4 text-white" />
                        </div>
                      )}
                      
                      {/* Speaking Pulse Ring */}
                      {participant.isSpeaking && (
                        <motion.div
                          className="absolute inset-0 rounded-full border-2 border-green-400"
                          animate={{ 
                            scale: [1, 1.1, 1], 
                            opacity: [0.5, 0, 0.5] 
                          }}
                          transition={{ duration: 2, repeat: Infinity }}
                        />
                      )}
                    </div>
                    
                    {/* Participant Name */}
                    <div className="text-center">
                      <h3 className="text-white font-semibold text-lg">
                        {participant.username}
                      </h3>
                      <p className="text-gray-400 text-sm capitalize">
                        {participant.role}
                      </p>
                    </div>
                  </motion.div>
                ))}
              </div>
            </div>
          </div>

          {/* Control Bar - Matching Image Design */}
          <div className="bg-gray-900/95 backdrop-blur-sm border-t border-gray-700 p-6">
            <div className="flex items-center justify-center space-x-6">
              {/* Mute/Unmute Button */}
              <motion.button
                onClick={toggleMute}
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                className={`rounded-full w-12 h-12 flex items-center justify-center transition-all duration-200 ${
                  isMuted 
                    ? 'bg-red-500 hover:bg-red-600 shadow-lg shadow-red-500/30' 
                    : 'bg-gray-700 hover:bg-gray-600 shadow-lg'
                }`}
                title={isMuted ? 'Unmute' : 'Mute'}
              >
                {isMuted ? (
                  <MicOff className="w-5 h-5 text-white" />
                ) : (
                  <Mic className="w-5 h-5 text-white" />
                )}
              </motion.button>
              
              {/* Video Button */}
              <motion.button
                onClick={toggleVideo}
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                className={`rounded-full w-12 h-12 flex items-center justify-center transition-all duration-200 ${
                  !isVideoOn 
                    ? 'bg-red-500 hover:bg-red-600 shadow-lg shadow-red-500/30' 
                    : 'bg-gray-700 hover:bg-gray-600 shadow-lg'
                }`}
                title={isVideoOn ? 'Turn off camera' : 'Turn on camera'}
              >
                {isVideoOn ? (
                  <Video className="w-5 h-5 text-white" />
                ) : (
                  <VideoOff className="w-5 h-5 text-white" />
                )}
              </motion.button>
              
              {/* Super Chat Button - Featured prominently */}
              <motion.button
                onClick={handleSpeakRequest}
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                className={`rounded-full px-6 py-3 flex items-center space-x-2 transition-all duration-200 ${
                  speakRequested 
                    ? 'bg-gradient-to-r from-yellow-400 to-orange-500 shadow-lg shadow-yellow-500/40 animate-pulse' 
                    : 'bg-gradient-to-r from-yellow-400 to-orange-500 hover:from-yellow-500 hover:to-orange-600 shadow-lg shadow-yellow-500/30'
                }`}
                title="Super Chat"
              >
                <Sparkles className="w-5 h-5 text-white" />
                <span className="text-white font-bold text-sm">Super Chat</span>
              </motion.button>
              
              {/* End Call Button */}
              <motion.button
                onClick={onLeave}
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                className="rounded-full w-12 h-12 bg-red-600 hover:bg-red-700 flex items-center justify-center shadow-lg shadow-red-600/30 transition-all duration-200"
                title="End call"
              >
                <PhoneOff className="w-5 h-5 text-white" />
              </motion.button>
              
              {/* Chat Toggle Button */}
              <motion.button
                onClick={() => setShowChat(!showChat)}
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                className={`rounded-full w-12 h-12 flex items-center justify-center transition-all duration-200 ${
                  showChat 
                    ? 'bg-blue-600 hover:bg-blue-700 shadow-lg shadow-blue-600/30' 
                    : 'bg-gray-700 hover:bg-gray-600 shadow-lg'
                }`}
                title={showChat ? 'Hide chat' : 'Show chat'}
              >
                <MessageSquare className="w-5 h-5 text-white" />
              </motion.button>
              
              {/* Settings/More Button */}
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                className="rounded-full w-12 h-12 bg-gray-700 hover:bg-gray-600 flex items-center justify-center shadow-lg transition-all duration-200"
                title="More options"
              >
                <Settings className="w-5 h-5 text-white" />
              </motion.button>
            </div>
            
            {/* Connection Status */}
            <div className="flex items-center justify-center mt-4 space-x-4">
              <div className="flex items-center space-x-2 text-sm text-gray-400">
                <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
                <span>Connected</span>
              </div>
              <div className="text-gray-500">•</div>
              <div className="text-sm text-gray-400">
                Audio Ready
              </div>
              <div className="text-gray-500">•</div>
              <div className="text-sm text-gray-400">
                {participants.length} Participants
              </div>
            </div>
          </div>
        </div>

        {/* Live Chat Panel */}
        <AnimatePresence>
          {showChat && (
            <motion.div
              initial={{ width: 0, opacity: 0 }}
              animate={{ width: 350, opacity: 1 }}
              exit={{ width: 0, opacity: 0 }}
              transition={{ duration: 0.3 }}
              className="bg-gray-900/95 backdrop-blur-sm border-l border-gray-700 flex flex-col"
            >
              {/* Chat Header */}
              <div className="px-4 py-3 border-b border-gray-700">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-2">
                    <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
                    <h3 className="text-white font-semibold">Live Chat</h3>
                    <span className="bg-gray-700 rounded-full px-2 py-1 text-xs text-gray-300">
                      {messages.length}
                    </span>
                  </div>
                  <button
                    onClick={() => setShowChat(false)}
                    className="text-gray-400 hover:text-white p-1"
                  >
                    <ChevronRight className="w-4 h-4" />
                  </button>
                </div>
                <p className="text-xs text-gray-400 mt-1">
                  Welcome to Sydney! This session is now live.
                </p>
              </div>
              
              {/* Messages */}
              <div className="flex-1 overflow-y-auto p-4 space-y-3">
                {messages.map((message) => (
                  <motion.div
                    key={message.id}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="flex space-x-3"
                  >
                    {message.type !== 'system' && (
                      <img
                        src={message.avatar}
                        alt={message.username}
                        className="w-8 h-8 rounded-full flex-shrink-0"
                      />
                    )}
                    <div className="flex-1">
                      {message.type !== 'system' && (
                        <div className="flex items-center space-x-2 mb-1">
                          <span className="text-sm font-medium text-white">
                            {message.username}
                          </span>
                          <span className="text-xs text-gray-400">
                            {message.timestamp.toLocaleTimeString()}
                          </span>
                        </div>
                      )}
                      <div className={`text-sm ${
                        message.type === 'system' 
                          ? 'text-center text-gray-400 italic' 
                          : 'text-gray-300'
                      }`}>
                        {message.content}
                      </div>
                    </div>
                  </motion.div>
                ))}
                <div ref={messagesEndRef} />
              </div>
              
              {/* Message Input */}
              <div className="p-4 border-t border-gray-700">
                <div className="flex space-x-2">
                  <input
                    type="text"
                    value={newMessage}
                    onChange={(e) => setNewMessage(e.target.value)}
                    onKeyPress={handleKeyPress}
                    placeholder="Type here to search"
                    className="flex-1 px-3 py-2 bg-gray-800 border border-gray-600 rounded-lg text-white placeholder-gray-400 text-sm focus:outline-none focus:border-blue-500"
                  />
                  <button
                    onClick={handleSendMessage}
                    disabled={!newMessage.trim()}
                    className="bg-blue-600 hover:bg-blue-700 disabled:bg-gray-600 px-3 py-2 rounded-lg transition-colors"
                  >
                    <Send className="w-4 h-4 text-white" />
                  </button>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Participants Panel */}
        <AnimatePresence>
          {showParticipants && (
            <motion.div
              initial={{ width: 0 }}
              animate={{ width: 280 }}
              exit={{ width: 0 }}
              className="bg-gray-900/95 backdrop-blur-sm border-l border-gray-700 flex flex-col"
            >
              <div className="p-4 border-b border-gray-700">
                <div className="flex items-center justify-between">
                  <h3 className="font-semibold text-white">Participants</h3>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => setShowParticipants(false)}
                    className="text-gray-400 hover:text-white"
                  >
                    <ChevronRight className="w-4 h-4" />
                  </Button>
                </div>
              </div>
              
              <div className="flex-1 overflow-y-auto p-4 space-y-3">
                {participants.map((participant) => (
                  <div
                    key={participant.id}
                    className="flex items-center space-x-3 p-3 rounded-lg bg-gray-800/50 hover:bg-gray-700/50 transition-colors"
                  >
                    <img
                      src={participant.avatar}
                      alt={participant.username}
                      className="w-10 h-10 rounded-full"
                    />
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center space-x-2">
                        <span className="text-sm font-medium text-white truncate">
                          {participant.username}
                        </span>
                        {getRoleIcon(participant.role)}
                      </div>
                      <div className="flex items-center space-x-2 mt-1">
                        {participant.isSpeaking && (
                          <span className="text-xs text-emerald-400">Speaking</span>
                        )}
                        {participant.speakRequested && (
                          <span className="text-xs text-amber-400">Requested to speak</span>
                        )}
                      </div>
                    </div>
                    <div className="flex items-center space-x-1">
                      {participant.isMuted && <MicOff className="w-4 h-4 text-red-500" />}
                      {participant.isVideoOn && <Video className="w-4 h-4 text-emerald-500" />}
                    </div>
                  </div>
                ))}
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}