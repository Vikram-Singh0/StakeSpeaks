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
          username: session.speaker,
          avatar: session.speakerAvatar,
          isSpeaking: true,
          isMuted: false,
          isVideoOn: true,
          role: 'speaker',
          speakRequested: false
        };
        setParticipants([speakerParticipant]);

        // Add current user as participant
        const currentUserParticipant: Participant = {
          id: `user-${userProfile.address}`,
          userId: userProfile.address,
          username: userProfile.username,
          avatar: userProfile.photoUrl,
          isSpeaking: false,
          isMuted: false,
          isVideoOn: true,
          role: 'participant',
          speakRequested: false
        };
        setParticipants(prev => [...prev, currentUserParticipant]);

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
      {/* Header */}
      <div className="bg-gray-900/95 backdrop-blur-sm border-b border-gray-700 p-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <Button
              variant="ghost"
              size="sm"
              onClick={onLeave}
              className="text-gray-400 hover:text-white"
            >
              <PhoneOff className="w-5 h-5" />
            </Button>
            <div>
              <h1 className="text-lg font-semibold text-white">{session.title}</h1>
              <p className="text-sm text-gray-400">by {session.speaker}</p>
            </div>
            {isConnected && (
              <div className="flex items-center space-x-2">
                <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
                <span className="text-sm text-green-400">Live</span>
              </div>
            )}
          </div>
          
          <div className="flex items-center space-x-2">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setShowParticipants(!showParticipants)}
              className="text-gray-400 hover:text-white"
            >
              <Users className="w-5 h-5" />
              <span className="ml-1">{participants.length}</span>
            </Button>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setShowChat(!showChat)}
              className="text-gray-400 hover:text-white"
            >
              <MessageSquare className="w-5 h-5" />
            </Button>
          </div>
        </div>
      </div>

      <div className="flex flex-1 overflow-hidden">
        {/* Main Video Area */}
        <div className="flex-1 flex flex-col">
          {/* Enhanced Participant Grid */}
          <div className="flex-1 p-6">
            <div className="grid grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6 h-full">
              {participants.map((participant, index) => (
                <motion.div
                  key={participant.id}
                  initial={{ opacity: 0, scale: 0.8, y: 20 }}
                  animate={{ opacity: 1, scale: 1, y: 0 }}
                  transition={{ duration: 0.5, delay: index * 0.1 }}
                  className={`relative flex flex-col items-center space-y-3 group ${
                    participant.isSpeaking ? 'ring-4 ring-green-400 shadow-2xl shadow-green-400/40' : ''
                  } ${participant.userId === userProfile.address ? 'ring-4 ring-violet-400 shadow-2xl shadow-violet-400/40' : ''}`}
                >
                  {/* Enhanced Circular Avatar Container */}
                  <div className="relative">
                    {/* Main Circular Avatar */}
                    <div className={`w-24 h-24 rounded-full overflow-hidden border-4 relative ${
                      participant.isSpeaking 
                        ? 'border-green-400 shadow-2xl shadow-green-400/50' 
                        : participant.userId === userProfile.address 
                        ? 'border-violet-400 shadow-2xl shadow-violet-400/50'
                        : 'border-gray-500'
                    }`}>
                      {/* Gradient Background */}
                      <div className={`absolute inset-0 bg-gradient-to-br ${
                        participant.role === 'speaker' 
                          ? 'from-yellow-400 to-orange-500' 
                          : participant.role === 'moderator'
                          ? 'from-blue-400 to-indigo-500'
                          : 'from-gray-600 to-gray-700'
                      } opacity-20`} />
                      
                      <img
                        src={participant.avatar}
                        alt={participant.username}
                        className="w-full h-full object-cover relative z-10"
                      />
                      
                      {/* Speaking Indicator Overlay */}
                      {participant.isSpeaking && (
                        <div className="absolute inset-0 bg-green-400/30 animate-pulse rounded-full z-20" />
                      )}
                      
                      {/* Connection Status Indicator */}
                      <div className="absolute top-1 left-1 z-30">
                        <div className="w-3 h-3 bg-green-500 rounded-full border-2 border-white shadow-lg animate-pulse" />
                      </div>
                    </div>
                    
                    {/* Enhanced Status Indicators */}
                    <div className="absolute -top-2 -right-2">
                      {/* Mic Status */}
                      <motion.div 
                        className={`rounded-full p-1.5 shadow-lg ${
                          participant.isMuted ? 'bg-red-500' : 'bg-green-500'
                        }`}
                        whileHover={{ scale: 1.1 }}
                        whileTap={{ scale: 0.95 }}
                      >
                        {participant.isMuted ? (
                          <MicOff className="w-3 h-3 text-white" />
                        ) : (
                          <Mic className="w-3 h-3 text-white" />
                        )}
                      </motion.div>
                    </div>
                    
                    <div className="absolute -bottom-2 -right-2">
                      {/* Video Status */}
                      <motion.div 
                        className={`rounded-full p-1.5 shadow-lg ${
                          participant.isVideoOn ? 'bg-blue-500' : 'bg-gray-500'
                        }`}
                        whileHover={{ scale: 1.1 }}
                        whileTap={{ scale: 0.95 }}
                      >
                        {participant.isVideoOn ? (
                          <Video className="w-3 h-3 text-white" />
                        ) : (
                          <VideoOff className="w-3 h-3 text-white" />
                        )}
                      </motion.div>
                    </div>
                    
                    {/* Enhanced Role Badge */}
                    <div className="absolute -top-2 -left-2">
                      {participant.role === 'speaker' && (
                        <motion.div 
                          className="bg-gradient-to-r from-yellow-400 to-orange-500 rounded-full p-1.5 shadow-lg"
                          animate={{ rotate: [0, 5, -5, 0] }}
                          transition={{ duration: 2, repeat: Infinity }}
                        >
                          <Crown className="w-3 h-3 text-white" />
                        </motion.div>
                      )}
                      {participant.role === 'moderator' && (
                        <motion.div 
                          className="bg-gradient-to-r from-blue-400 to-indigo-500 rounded-full p-1.5 shadow-lg"
                          whileHover={{ scale: 1.1 }}
                        >
                          <Shield className="w-3 h-3 text-white" />
                        </motion.div>
                      )}
                    </div>
                    
                    {/* Speak Request Indicator */}
                    {participant.speakRequested && (
                      <motion.div 
                        className="absolute -bottom-2 -left-2 bg-gradient-to-r from-amber-400 to-yellow-500 rounded-full p-1.5 shadow-lg"
                        animate={{ 
                          scale: [1, 1.2, 1],
                          rotate: [0, 10, -10, 0]
                        }}
                        transition={{ duration: 1, repeat: Infinity }}
                      >
                        <Hand className="w-3 h-3 text-white" />
                      </motion.div>
                    )}
                    
                    {/* Current User Badge */}
                    {participant.userId === userProfile.address && (
                      <motion.div 
                        className="absolute -top-3 left-1/2 transform -translate-x-1/2 bg-gradient-to-r from-violet-500 to-purple-600 rounded-full px-3 py-1 shadow-lg"
                        animate={{ y: [0, -2, 0] }}
                        transition={{ duration: 1.5, repeat: Infinity }}
                      >
                        <span className="text-white text-xs font-bold">YOU</span>
                      </motion.div>
                    )}
                    
                    {/* Activity Pulse Ring */}
                    {participant.isSpeaking && (
                      <motion.div
                        className="absolute inset-0 rounded-full border-4 border-green-400"
                        animate={{ scale: [1, 1.2, 1], opacity: [0.8, 0, 0.8] }}
                        transition={{ duration: 2, repeat: Infinity }}
                      />
                    )}
                  </div>
                  
                  {/* Enhanced Participant Info */}
                  <div className="text-center space-y-2">
                    <div className="flex items-center justify-center space-x-2">
                      <span className="text-white text-sm font-semibold truncate max-w-24">
                        {participant.username}
                      </span>
                      {participant.role === 'speaker' && (
                        <Star className="w-3 h-3 text-yellow-400" />
                      )}
                      {participant.role === 'moderator' && (
                        <Shield className="w-3 h-3 text-blue-400" />
                      )}
                    </div>
                    
                    <div className="flex items-center justify-center space-x-2">
                      <div className={`px-2 py-1 rounded-full text-xs font-medium ${
                        participant.isSpeaking 
                          ? 'bg-green-500/20 text-green-400 border border-green-500/30' 
                          : participant.speakRequested 
                          ? 'bg-amber-500/20 text-amber-400 border border-amber-500/30'
                          : 'bg-gray-500/20 text-gray-400 border border-gray-500/30'
                      }`}>
                        {participant.isSpeaking ? 'Speaking' : participant.speakRequested ? 'Requested' : 'Listening'}
                      </div>
                    </div>
                    
                    {/* Connection Quality Indicator */}
                    <div className="flex items-center justify-center space-x-1">
                      <div className="w-1 h-1 bg-green-500 rounded-full" />
                      <div className="w-1 h-1 bg-green-500 rounded-full" />
                      <div className="w-1 h-1 bg-green-500 rounded-full" />
                      <span className="text-xs text-gray-500 ml-1">HD</span>
                    </div>
                  </div>
                </motion.div>
              ))}
            </div>
          </div>

          {/* Enhanced Bottom Controls - Matching Image Design */}
          <div className="bg-gray-900/95 backdrop-blur-sm border-t border-gray-700 p-6">
            <div className="flex items-center justify-center space-x-4">
              {/* Mute/Unmute Button */}
              <Button
                variant="ghost"
                size="lg"
                onClick={toggleMute}
                className={`rounded-full w-14 h-14 transition-all duration-300 hover:scale-110 ${
                  isMuted 
                    ? 'bg-red-500 hover:bg-red-600 text-white shadow-lg shadow-red-500/30' 
                    : 'bg-green-500 hover:bg-green-600 text-white shadow-lg shadow-green-500/30'
                }`}
                title={isMuted ? 'Unmute Microphone' : 'Mute Microphone'}
              >
                {isMuted ? <MicOff className="w-6 h-6" /> : <Mic className="w-6 h-6" />}
              </Button>
              
              {/* Video On/Off Button */}
              <Button
                variant="ghost"
                size="lg"
                onClick={toggleVideo}
                className={`rounded-full w-14 h-14 transition-all duration-300 hover:scale-110 ${
                  isVideoOn 
                    ? 'bg-blue-500 hover:bg-blue-600 text-white shadow-lg shadow-blue-500/30' 
                    : 'bg-gray-500 hover:bg-gray-600 text-white shadow-lg shadow-gray-500/30'
                }`}
                title={isVideoOn ? 'Turn Off Camera' : 'Turn On Camera'}
              >
                {isVideoOn ? <Video className="w-6 h-6" /> : <VideoOff className="w-6 h-6" />}
              </Button>
              
              {/* Super Chat Button - Featured prominently like in the image */}
              <Button
                variant="ghost"
                size="lg"
                onClick={handleSpeakRequest}
                className={`rounded-full w-14 h-14 transition-all duration-300 hover:scale-110 ${
                  speakRequested 
                    ? 'bg-gradient-to-r from-yellow-400 to-orange-500 hover:from-yellow-500 hover:to-orange-600 text-white shadow-lg shadow-yellow-500/30 animate-pulse' 
                    : 'bg-gradient-to-r from-yellow-400 to-orange-500 hover:from-yellow-500 hover:to-orange-600 text-white shadow-lg shadow-yellow-500/30'
                }`}
                title={speakRequested ? 'Cancel Super Chat' : 'Super Chat'}
              >
                <Star className="w-6 h-6" />
              </Button>
              
              {/* End Call Button */}
              <Button
                variant="ghost"
                size="lg"
                onClick={onLeave}
                className="rounded-full w-14 h-14 bg-red-600 hover:bg-red-700 text-white shadow-lg shadow-red-600/30 transition-all duration-300 hover:scale-110"
                title="End Call"
              >
                <PhoneOff className="w-6 h-6" />
              </Button>
              
              {/* Chat Toggle Button */}
              <Button
                variant="ghost"
                size="lg"
                onClick={() => setShowChat(!showChat)}
                className={`rounded-full w-14 h-14 transition-all duration-300 hover:scale-110 ${
                  showChat 
                    ? 'bg-purple-500 hover:bg-purple-600 text-white shadow-lg shadow-purple-500/30' 
                    : 'bg-gray-600 hover:bg-gray-700 text-white shadow-lg shadow-gray-600/30'
                }`}
                title={showChat ? 'Hide Chat' : 'Show Chat'}
              >
                <MessageSquare className="w-6 h-6" />
              </Button>
              
              {/* Participants Toggle Button */}
              <Button
                variant="ghost"
                size="lg"
                onClick={() => setShowParticipants(!showParticipants)}
                className={`rounded-full w-14 h-14 transition-all duration-300 hover:scale-110 ${
                  showParticipants 
                    ? 'bg-indigo-500 hover:bg-indigo-600 text-white shadow-lg shadow-indigo-500/30' 
                    : 'bg-gray-600 hover:bg-gray-700 text-white shadow-lg shadow-gray-600/30'
                }`}
                title={showParticipants ? 'Hide Participants' : 'Show Participants'}
              >
                <Users className="w-6 h-6" />
              </Button>
            </div>
            
            {/* Enhanced Status Bar */}
            <div className="flex items-center justify-center mt-4 space-x-6">
              <div className="flex items-center space-x-2 px-3 py-1 bg-gray-800/50 rounded-full">
                {isConnected ? (
                  <>
                    <Wifi className="w-4 h-4 text-green-500" />
                    <span className="text-green-500 text-sm font-medium">Connected</span>
                  </>
                ) : (
                  <>
                    <WifiOff className="w-4 h-4 text-red-500" />
                    <span className="text-red-500 text-sm font-medium">Connecting...</span>
                  </>
                )}
              </div>
              
              {audioInitialized && (
                <div className="flex items-center space-x-2 px-3 py-1 bg-gray-800/50 rounded-full">
                  <Mic className="w-4 h-4 text-green-500" />
                  <span className="text-green-500 text-sm font-medium">Audio Ready</span>
                </div>
              )}
              
              <div className="flex items-center space-x-2 px-3 py-1 bg-gray-800/50 rounded-full">
                <Users className="w-4 h-4 text-violet-500" />
                <span className="text-violet-500 text-sm font-medium">{participants.length} Participants</span>
              </div>
            </div>
          </div>
        </div>

        {/* Chat Panel */}
        <AnimatePresence>
          {showChat && (
            <motion.div
              initial={{ width: 0 }}
              animate={{ width: 320 }}
              exit={{ width: 0 }}
              className="bg-gray-900/95 backdrop-blur-sm border-l border-gray-700 flex flex-col"
            >
              <div className="p-4 border-b border-gray-700">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-2">
                    <MessageSquare className="w-5 h-5 text-violet-500" />
                    <h3 className="font-semibold text-white">Live Chat</h3>
                    <div className="bg-violet-600 rounded-full px-2 py-1">
                      <span className="text-white text-xs font-medium">{messages.length}</span>
                    </div>
                  </div>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => setShowChat(false)}
                    className="text-gray-400 hover:text-white"
                  >
                    <ChevronRight className="w-4 h-4" />
                  </Button>
                </div>
              </div>
              
              <div className="flex-1 overflow-y-auto p-4 space-y-3">
                {messages.map((message) => (
                  <motion.div
                    key={message.id}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className={`flex space-x-3 ${
                      message.type === 'system' ? 'justify-center' : ''
                    }`}
                  >
                    {message.type !== 'system' && (
                      <img
                        src={message.avatar}
                        alt={message.username}
                        className="w-8 h-8 rounded-full flex-shrink-0 border-2 border-violet-500/30"
                      />
                    )}
                    <div className={`flex-1 ${message.type === 'system' ? 'text-center' : ''}`}>
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
                      <div className={`text-sm p-3 rounded-lg ${
                        message.type === 'system' 
                          ? 'text-gray-400 italic bg-gray-800/50' 
                          : message.type === 'speak_request'
                          ? 'text-amber-400 bg-amber-500/10 border border-amber-500/20'
                          : 'text-gray-300 bg-gray-800/50 border border-gray-700/50'
                      }`}>
                        {message.content}
                      </div>
                    </div>
                  </motion.div>
                ))}
                <div ref={messagesEndRef} />
              </div>
              
              <div className="p-4 border-t border-gray-700">
                <div className="flex space-x-2">
                  <input
                    type="text"
                    value={newMessage}
                    onChange={(e) => setNewMessage(e.target.value)}
                    onKeyPress={handleKeyPress}
                    placeholder="Type a message..."
                    className="flex-1 px-4 py-3 bg-gray-800 border border-gray-600 rounded-xl text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-violet-500 focus:border-transparent text-sm"
                  />
                  <Button
                    onClick={handleSendMessage}
                    disabled={!newMessage.trim()}
                    size="sm"
                    className="bg-gradient-to-r from-violet-600 to-blue-600 hover:from-violet-700 hover:to-blue-700 px-4 py-3 rounded-xl"
                  >
                    <Send className="w-4 h-4" />
                  </Button>
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