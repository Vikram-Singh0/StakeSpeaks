'use client';

import { useState, useEffect, useRef } from 'react';
import { motion } from 'framer-motion';
import {
  ChevronDown,
  LogOut,
  Bell,
  User
} from 'lucide-react';
import { Button } from '@/components/ui/button';

interface NavigationBarProps {
  userProfile: any;
  onLogout: () => void;
  onProfileClick: () => void;
}

export default function NavigationBar({ userProfile, onLogout, onProfileClick }: NavigationBarProps) {
  const [showProfileMenu, setShowProfileMenu] = useState(false);
  const profileMenuRef = useRef<HTMLDivElement>(null);

  // Close profile menu when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (profileMenuRef.current && !profileMenuRef.current.contains(event.target as Node)) {
        setShowProfileMenu(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleLogout = () => {
    onLogout();
    setShowProfileMenu(false);
  };

  const profile = userProfile || {
    address: '',
    username: 'Anonymous User',
    totalStaked: 0,
    totalEarnings: 0,
    balance: '0'
  };

  return (
    <motion.nav
      initial={{ opacity: 0, y: -20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
      className="sticky top-0 z-50 bg-gray-900/95 backdrop-blur-sm border-b border-gray-800"
    >
      <div className="container mx-auto px-6 py-4">
        <div className="flex items-center justify-between">
          {/* Logo */}
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10">
              <svg viewBox="0 0 64 64" fill="none" xmlns="http://www.w3.org/2000/svg">
                <defs>
                  <linearGradient id="gradient" x1="0%" y1="0%" x2="100%" y2="100%">
                    <stop offset="0%" stopColor="#8b5cf6" />
                    <stop offset="100%" stopColor="#3b82f6" />
                  </linearGradient>
                </defs>
                <rect x="26" y="8" width="12" height="24" rx="6" fill="url(#gradient)" />
                <line x1="30" y1="14" x2="30" y2="26" stroke="white" strokeWidth="1" opacity="0.7" />
                <line x1="32" y1="14" x2="32" y2="26" stroke="white" strokeWidth="1" opacity="0.7" />
                <line x1="34" y1="14" x2="34" y2="26" stroke="white" strokeWidth="1" opacity="0.7" />
                <line x1="32" y1="32" x2="32" y2="44" stroke="url(#gradient)" strokeWidth="2" />
                <rect x="24" y="44" width="16" height="4" rx="2" fill="url(#gradient)" />
                <path d="M44 20 C48 16, 48 28, 44 24" stroke="url(#gradient)" strokeWidth="2" fill="none" opacity="0.6" />
                <path d="M48 16 C54 10, 54 34, 48 28" stroke="url(#gradient)" strokeWidth="2" fill="none" opacity="0.4" />
                <path d="M20 20 C16 16, 16 28, 20 24" stroke="url(#gradient)" strokeWidth="2" fill="none" opacity="0.6" />
                <path d="M16 16 C10 10, 10 34, 16 28" stroke="url(#gradient)" strokeWidth="2" fill="none" opacity="0.4" />
                <polygon points="32,52 28,58 36,58" fill="url(#gradient)" opacity="0.8" />
              </svg>
            </div>
            <span className="text-2xl font-bold bg-gradient-to-r from-violet-400 to-blue-400 bg-clip-text text-transparent">
              TalkStake
            </span>
          </div>

          {/* Right Section */}
          <div className="flex items-center space-x-4">
            {/* Notifications */}
            <Button variant="ghost" size="sm" className="p-2">
              <Bell className="w-5 h-5 text-gray-400 hover:text-white transition-colors" />
            </Button>

            {/* Portfolio Balance - Desktop */}
            <div className="hidden md:block text-right">
              <div className="text-sm text-gray-400">Portfolio</div>
              <div className="text-lg font-bold text-white">
                {(profile.totalStaked + profile.totalEarnings).toFixed(2)} KDA
              </div>
            </div>

            {/* Profile Dropdown */}
            <div className="relative" ref={profileMenuRef}>
              <button
                onClick={() => setShowProfileMenu(!showProfileMenu)}
                className="flex items-center space-x-3 p-2 hover:bg-gray-800/50 rounded-lg transition-colors"
              >
                <img
                  src={profile.photoUrl || `https://api.dicebear.com/7.x/identicon/svg?seed=${profile.address}`}
                  alt="Profile"
                  className="w-8 h-8 rounded-full"
                />
                <div className="hidden md:block text-left">
                  <div className="text-sm font-medium text-white">
                    {profile.name || profile.username}
                    {profile.isLoadingProfile && (
                      <span className="ml-1 text-xs text-gray-400">Loading...</span>
                    )}
                  </div>
                  <div className="text-xs text-gray-400">
                    {profile.address ? `${profile.address.slice(0, 6)}...${profile.address.slice(-4)}` : 'Not Connected'}
                  </div>
                </div>
                <ChevronDown className={`w-4 h-4 text-gray-400 transition-transform ${showProfileMenu ? 'rotate-180' : ''}`} />
              </button>

              {/* Profile Dropdown Menu */}
              {showProfileMenu && (
                <motion.div
                  initial={{ opacity: 0, scale: 0.95, y: -10 }}
                  animate={{ opacity: 1, scale: 1, y: 0 }}
                  exit={{ opacity: 0, scale: 0.95, y: -10 }}
                  transition={{ duration: 0.2 }}
                  className="absolute right-0 top-full mt-2 w-72 bg-gray-800 border border-gray-700 rounded-lg shadow-xl overflow-hidden z-50"
                >
                  <div className="p-4 border-b border-gray-700">
                    <div className="flex items-center space-x-3">
                      <img
                        src={profile.photoUrl || `https://api.dicebear.com/7.x/identicon/svg?seed=${profile.address}`}
                        alt="Profile"
                        className="w-12 h-12 rounded-full"
                      />
                      <div>
                        <div className="font-medium text-white">
                          {profile.name || profile.username}
                          {!profile.hasFilecoinProfile && (
                            <span className="ml-2 px-2 py-1 bg-yellow-500/20 text-yellow-400 text-xs rounded">
                              Profile Incomplete
                            </span>
                          )}
                        </div>
                        <div className="text-sm text-gray-400">
                          {profile.address ? `${profile.address.slice(0, 10)}...${profile.address.slice(-6)}` : 'Not Connected'}
                        </div>
                        {profile.twitterHandle && (
                          <div className="text-xs text-blue-400">@{profile.twitterHandle}</div>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Portfolio Summary - Mobile */}
                  <div className="md:hidden p-4 border-b border-gray-700">
                    <div className="grid grid-cols-2 gap-4 text-center">
                      <div>
                        <div className="text-lg font-bold text-white">{profile.totalStaked.toFixed(2)}</div>
                        <div className="text-xs text-gray-400">KDA Staked</div>
                      </div>
                      <div>
                        <div className="text-lg font-bold text-white">{profile.totalEarnings.toFixed(2)}</div>
                        <div className="text-xs text-gray-400">Earnings</div>
                      </div>
                    </div>
                  </div>

                  <div className="p-2">
                    <button
                      onClick={() => {
                        onProfileClick();
                        setShowProfileMenu(false);
                      }}
                      className="w-full flex items-center space-x-3 p-3 text-gray-300 hover:bg-gray-700/50 rounded-lg transition-colors mb-2"
                    >
                      <User className="w-4 h-4" />
                      <span>Manage Profile</span>
                    </button>
                    <button
                      onClick={handleLogout}
                      className="w-full flex items-center space-x-3 p-3 text-red-400 hover:bg-red-500/10 rounded-lg transition-colors"
                    >
                      <LogOut className="w-4 h-4" />
                      <span>Disconnect Wallet</span>
                    </button>
                  </div>
                </motion.div>
              )}
            </div>
          </div>
        </div>
      </div>
    </motion.nav>
  );
}