'use client';

import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import {
  User,
  Edit3,
  Save,
  X,
  Upload,
  Twitter,
  Linkedin,
  Globe,
  Camera,
  Loader
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { filecoinStorage, UserProfile } from '@/services/filecoinStorage';
import { useWallet } from '@/contexts/WalletContext';

interface ProfileManagerProps {
  isOpen: boolean;
  onClose: () => void;
  onProfileUpdate: (profile: UserProfile) => void;
}

export default function ProfileManager({ isOpen, onClose, onProfileUpdate }: ProfileManagerProps) {
  const { userProfile } = useWallet();
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [isEditing, setIsEditing] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  // Form state
  const [formData, setFormData] = useState({
    name: '',
    bio: '',
    photoUrl: '',
    twitterHandle: '',
    linkedinHandle: '',
    websiteUrl: '',
    expertise: [] as string[]
  });

  // Load user profile when component mounts or wallet changes
  useEffect(() => {
    if (isOpen && userProfile?.address) {
      loadUserProfile();
    }
  }, [isOpen, userProfile?.address]);

  const loadUserProfile = async () => {
    if (!userProfile?.address) return;
    
    setIsLoading(true);
    setError(null);
    
    try {
      // Try to load existing profile directly by wallet address
      const storedProfile = await filecoinStorage.getUserProfile(userProfile.address);
      
      if (storedProfile) {
        setProfile(storedProfile);
        setFormData({
          name: storedProfile.name,
          bio: storedProfile.bio,
          photoUrl: storedProfile.photoUrl,
          twitterHandle: storedProfile.twitterHandle || '',
          linkedinHandle: storedProfile.linkedinHandle || '',
          websiteUrl: storedProfile.websiteUrl || '',
          expertise: storedProfile.expertise
        });
      } else {
        // No existing profile, create default
        createDefaultProfile();
      }
    } catch (error) {
      console.error('Error loading profile:', error);
      setError('Failed to load profile from Filecoin');
      createDefaultProfile();
    } finally {
      setIsLoading(false);
    }
  };

  const createDefaultProfile = () => {
    if (!userProfile?.address) return;
    
    const defaultProfile = filecoinStorage.createDefaultProfile(userProfile.address);
    setProfile(defaultProfile);
    setFormData({
      name: defaultProfile.name,
      bio: defaultProfile.bio,
      photoUrl: defaultProfile.photoUrl,
      twitterHandle: defaultProfile.twitterHandle || '',
      linkedinHandle: defaultProfile.linkedinHandle || '',
      websiteUrl: defaultProfile.websiteUrl || '',
      expertise: defaultProfile.expertise
    });
    setIsEditing(true); // Auto-edit mode for new profiles
  };

  const handleSave = async () => {
    if (!profile || !userProfile?.address) return;
    
    setIsSaving(true);
    setError(null);
    
    try {
      // Update profile with form data
      const updatedProfile: UserProfile = {
        ...profile,
        name: formData.name,
        bio: formData.bio,
        photoUrl: formData.photoUrl || profile.photoUrl,
        twitterHandle: formData.twitterHandle,
        linkedinHandle: formData.linkedinHandle,
        websiteUrl: formData.websiteUrl,
        expertise: formData.expertise,
        lastUpdated: new Date().toISOString()
      };

      // Store on Filecoin via Lighthouse
      const ipfsHash = await filecoinStorage.updateUserProfile(updatedProfile);
      
      setProfile(updatedProfile);
      setIsEditing(false);
      
      // Notify parent component about profile update
      onProfileUpdate(updatedProfile);
      
      console.log('Profile saved to Filecoin with hash:', ipfsHash);
    } catch (error) {
      console.error('Error saving profile:', error);
      setError('Failed to save profile to Filecoin. Please try again.');
    } finally {
      setIsSaving(false);
    }
  };

  const handleInputChange = (field: string, value: string) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const addExpertise = (skill: string) => {
    if (skill.trim() && !formData.expertise.includes(skill.trim())) {
      setFormData(prev => ({
        ...prev,
        expertise: [...prev.expertise, skill.trim()]
      }));
    }
  };

  const removeExpertise = (skill: string) => {
    setFormData(prev => ({
      ...prev,
      expertise: prev.expertise.filter(s => s !== skill)
    }));
  };

  if (!isOpen) return null;

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4"
    >
      <motion.div
        initial={{ scale: 0.95, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        exit={{ scale: 0.95, opacity: 0 }}
        className="bg-gray-800 rounded-2xl shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto"
      >
        <Card className="bg-transparent border-0">
          <CardHeader className="flex flex-row items-center justify-between pb-6">
            <CardTitle className="flex items-center space-x-2">
              <User className="w-6 h-6 text-violet-400" />
              <span className="text-xl text-white">Profile Manager</span>
            </CardTitle>
            <Button
              variant="ghost"
              size="sm"
              onClick={onClose}
              className="text-gray-400 hover:text-white"
            >
              <X className="w-5 h-5" />
            </Button>
          </CardHeader>

          <CardContent className="space-y-6">
            {isLoading ? (
              <div className="flex items-center justify-center py-12">
                <Loader className="w-8 h-8 text-violet-400 animate-spin" />
                <span className="ml-2 text-gray-300">Loading profile from Filecoin...</span>
              </div>
            ) : (
              <>
                {error && (
                  <div className="bg-red-500/10 border border-red-500/20 rounded-lg p-4">
                    <p className="text-red-400 text-sm">{error}</p>
                  </div>
                )}

                {/* Profile Photo */}
                <div className="flex items-center space-x-4">
                  <div className="relative">
                    <img
                      src={formData.photoUrl || `https://api.dicebear.com/7.x/identicon/svg?seed=${userProfile?.address}`}
                      alt="Profile"
                      className="w-20 h-20 rounded-full border-2 border-gray-600"
                    />
                    {isEditing && (
                      <button className="absolute -bottom-2 -right-2 bg-violet-600 rounded-full p-1.5 hover:bg-violet-700 transition-colors">
                        <Camera className="w-4 h-4 text-white" />
                      </button>
                    )}
                  </div>
                  <div className="flex-1">
                    <h3 className="text-lg font-semibold text-white">
                      {profile?.name || 'Anonymous User'}
                    </h3>
                    <p className="text-gray-400 text-sm">
                      {userProfile?.address?.slice(0, 8)}...{userProfile?.address?.slice(-6)}
                    </p>
                  </div>
                  {!isEditing && (
                    <Button
                      onClick={() => setIsEditing(true)}
                      className="bg-violet-600 hover:bg-violet-700"
                    >
                      <Edit3 className="w-4 h-4 mr-2" />
                      Edit Profile
                    </Button>
                  )}
                </div>

                {/* Form Fields */}
                <div className="grid grid-cols-1 gap-4">
                  {/* Name */}
                  <div>
                    <label className="block text-sm font-medium text-gray-300 mb-2">Name</label>
                    <input
                      type="text"
                      value={formData.name}
                      onChange={(e) => handleInputChange('name', e.target.value)}
                      disabled={!isEditing}
                      className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-violet-500 disabled:opacity-50"
                      placeholder="Your display name"
                    />
                  </div>

                  {/* Bio */}
                  <div>
                    <label className="block text-sm font-medium text-gray-300 mb-2">Bio</label>
                    <textarea
                      value={formData.bio}
                      onChange={(e) => handleInputChange('bio', e.target.value)}
                      disabled={!isEditing}
                      rows={3}
                      className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-violet-500 disabled:opacity-50 resize-none"
                      placeholder="Tell us about yourself..."
                    />
                  </div>

                  {/* Photo URL */}
                  {isEditing && (
                    <div>
                      <label className="block text-sm font-medium text-gray-300 mb-2">Photo URL</label>
                      <input
                        type="url"
                        value={formData.photoUrl}
                        onChange={(e) => handleInputChange('photoUrl', e.target.value)}
                        className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-violet-500"
                        placeholder="https://example.com/photo.jpg"
                      />
                    </div>
                  )}

                  {/* Social Links */}
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-300 mb-2 flex items-center">
                        <Twitter className="w-4 h-4 mr-1" />
                        Twitter
                      </label>
                      <input
                        type="text"
                        value={formData.twitterHandle}
                        onChange={(e) => handleInputChange('twitterHandle', e.target.value)}
                        disabled={!isEditing}
                        className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-violet-500 disabled:opacity-50"
                        placeholder="@username"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-300 mb-2 flex items-center">
                        <Linkedin className="w-4 h-4 mr-1" />
                        LinkedIn
                      </label>
                      <input
                        type="text"
                        value={formData.linkedinHandle}
                        onChange={(e) => handleInputChange('linkedinHandle', e.target.value)}
                        disabled={!isEditing}
                        className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-violet-500 disabled:opacity-50"
                        placeholder="username"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-300 mb-2 flex items-center">
                        <Globe className="w-4 h-4 mr-1" />
                        Website
                      </label>
                      <input
                        type="url"
                        value={formData.websiteUrl}
                        onChange={(e) => handleInputChange('websiteUrl', e.target.value)}
                        disabled={!isEditing}
                        className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-violet-500 disabled:opacity-50"
                        placeholder="https://yourwebsite.com"
                      />
                    </div>
                  </div>

                  {/* Expertise Tags */}
                  <div>
                    <label className="block text-sm font-medium text-gray-300 mb-2">Expertise</label>
                    <div className="flex flex-wrap gap-2 mb-2">
                      {formData.expertise.map((skill, index) => (
                        <span
                          key={index}
                          className="inline-flex items-center px-3 py-1 bg-violet-600/20 text-violet-300 text-sm rounded-full"
                        >
                          {skill}
                          {isEditing && (
                            <button
                              onClick={() => removeExpertise(skill)}
                              className="ml-2 text-violet-300 hover:text-white"
                            >
                              <X className="w-3 h-3" />
                            </button>
                          )}
                        </span>
                      ))}
                    </div>
                    {isEditing && (
                      <input
                        type="text"
                        placeholder="Add expertise (press Enter)"
                        className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-violet-500"
                        onKeyPress={(e) => {
                          if (e.key === 'Enter') {
                            addExpertise(e.currentTarget.value);
                            e.currentTarget.value = '';
                          }
                        }}
                      />
                    )}
                  </div>
                </div>

                {/* Action Buttons */}
                {isEditing && (
                  <div className="flex items-center justify-end space-x-3 pt-4 border-t border-gray-700">
                    <Button
                      variant="outline"
                      onClick={() => setIsEditing(false)}
                      disabled={isSaving}
                      className="border-gray-600 text-gray-300 hover:bg-gray-700"
                    >
                      Cancel
                    </Button>
                    <Button
                      onClick={handleSave}
                      disabled={isSaving}
                      className="bg-violet-600 hover:bg-violet-700"
                    >
                      {isSaving ? (
                        <>
                          <Loader className="w-4 h-4 mr-2 animate-spin" />
                          Saving to Filecoin...
                        </>
                      ) : (
                        <>
                          <Save className="w-4 h-4 mr-2" />
                          Save Profile
                        </>
                      )}
                    </Button>
                  </div>
                )}

                {/* Filecoin Storage Info */}
                <div className="bg-blue-500/10 border border-blue-500/20 rounded-lg p-4">
                  <div className="flex items-center space-x-2 mb-2">
                    <div className="w-4 h-4 bg-blue-500 rounded-full"></div>
                    <span className="text-blue-300 text-sm font-medium">Stored on Filecoin</span>
                  </div>
                  <p className="text-blue-200/80 text-xs">
                    Your profile data is stored securely on the Filecoin network via Lighthouse. 
                    All changes are permanently stored and decentralized.
                  </p>
                </div>
              </>
            )}
          </CardContent>
        </Card>
      </motion.div>
    </motion.div>
  );
}