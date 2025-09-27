import lighthouse from '@lighthouse-web3/sdk';

export interface UserProfile {
  walletAddress: string;
  name: string;
  bio: string;
  photoUrl: string;
  twitterHandle?: string;
  linkedinHandle?: string;
  websiteUrl?: string;
  expertise: string[];
  joinedDate: string;
  totalStaked: number;
  totalEarnings: number;
  sessionsJoined: number;
  reputation: number;
  isExpert: boolean;
  lastUpdated: string;
}

export interface SpeakerSession {
  id: string;
  title: string;
  description: string;
  speaker: string;
  speakerAddress: string;
  speakerAvatar: string;
  category: string;
  topics: string[];
  startTime: string;
  endTime?: string;
  duration: number;
  totalStaked: number;
  maxParticipants: number;
  participants: string[];
  status: 'scheduled' | 'live' | 'completed' | 'cancelled';
  isLive: boolean;
  viewers: number;
  likes: number;
  comments: number;
  entryFee: number;
  requirements: string;
  isPrivate: boolean;
  recordingEnabled: boolean;
  // Rating system
  averageRating: number; // Average rating from participant feedback (1-5 stars)
  totalRatings: number; // Number of people who rated this session
  speakerRating: number; // Overall speaker rating (calculated from all their sessions)
  engagementScore: number; // Calculated from likes, comments, participation rate
  // Feedback and reviews
  reviews: SessionReview[];
  // Performance metrics
  completionRate: number; // Percentage of participants who stayed until the end
  recommendationScore: number; // Percentage who would recommend this session
  createdAt: string;
  updatedAt: string;
  filecoinHash?: string;
}

export interface SessionReview {
  id: string;
  sessionId: string;
  reviewerAddress: string;
  rating: number; // 1-5 stars
  comment: string;
  helpful: number; // Number of people who found this review helpful
  createdAt: string;
}

export class FilecoinStorage {
  private apiKey: string;
  private isDemoMode: boolean;

  constructor() {
    this.apiKey = process.env.NEXT_PUBLIC_LIGHTHOUSE_API_KEY || '';
    this.isDemoMode = !this.apiKey || this.apiKey === 'your-lighthouse-api-key-here';
    
    if (this.isDemoMode) {
      console.log('🔧 Running in DEMO mode - profile data will be stored locally');
      console.log('📝 To use real Filecoin storage, get an API key from https://files.lighthouse.storage/');
    }
  }

  /**
   * Store user profile data on Filecoin via Lighthouse (or localStorage in demo mode)
   */
  async storeUserProfile(profile: UserProfile): Promise<string> {
    try {
      console.log('💾 Storing user profile...', { address: profile.walletAddress, name: profile.name });

      // Demo mode - store locally
      if (this.isDemoMode) {
        const demoHash = `demo-hash-${Date.now()}-${profile.walletAddress.slice(-6)}`;
        const storageData = {
          ...profile,
          filecoinHash: demoHash,
          storedAt: new Date().toISOString(),
          storageMode: 'demo'
        };
        
        localStorage.setItem(`talkstake-profile-${profile.walletAddress}`, JSON.stringify(storageData));
        console.log('✅ Demo mode: Profile stored locally with hash:', demoHash);
        return demoHash;
      }

      // Real Filecoin storage via Lighthouse
      const profileJson = JSON.stringify(profile, null, 2);
      const blob = new Blob([profileJson], { type: 'application/json' });
      const file = new File([blob], `talkstake-profile-${profile.walletAddress}.json`, { 
        type: 'application/json' 
      });

      console.log('🚀 Uploading to Filecoin via Lighthouse...');
      const uploadResponse = await lighthouse.upload([file], this.apiKey);
      
      if (uploadResponse?.data?.Hash) {
        const hash = uploadResponse.data.Hash;
        console.log('✅ Profile stored on Filecoin with hash:', hash);
        
        // Also store hash locally for quick access
        localStorage.setItem(`talkstake-hash-${profile.walletAddress}`, hash);
        
        return hash;
      } else {
        throw new Error('Failed to get hash from Lighthouse upload response');
      }
    } catch (error) {
      console.error('❌ Error storing profile:', error);
      
      // Fallback to demo mode if Lighthouse fails
      console.log('🔄 Falling back to demo mode...');
      const demoHash = `fallback-${Date.now()}-${profile.walletAddress.slice(-6)}`;
      localStorage.setItem(`talkstake-profile-${profile.walletAddress}`, JSON.stringify({
        ...profile,
        filecoinHash: demoHash,
        storedAt: new Date().toISOString(),
        storageMode: 'fallback'
      }));
      
      return demoHash;
    }
  }

  /**
   * Retrieve user profile data from Filecoin via Lighthouse (or localStorage in demo mode)
   */
  async getUserProfile(walletAddress: string): Promise<UserProfile | null> {
    try {
      console.log('🔍 Loading user profile for:', walletAddress);

      // Check localStorage first (for demo mode or cached data)
      const localData = localStorage.getItem(`talkstake-profile-${walletAddress}`);
      if (localData) {
        const parsed = JSON.parse(localData);
        console.log('📱 Profile loaded from local storage');
        return parsed;
      }

      // If not in demo mode, try to fetch from Filecoin
      if (!this.isDemoMode) {
        const hash = localStorage.getItem(`talkstake-hash-${walletAddress}`);
        if (hash && hash !== 'demo-mode') {
          try {
            console.log('🌐 Fetching from Filecoin with hash:', hash);
            const response = await fetch(`https://gateway.lighthouse.storage/ipfs/${hash}`);
            
            if (response.ok) {
              const profileData = await response.json();
              console.log('✅ Profile loaded from Filecoin');
              return profileData;
            }
          } catch (error) {
            console.warn('⚠️ Failed to fetch from Filecoin, checking local storage');
          }
        }
      }

      console.log('❌ No profile found for wallet:', walletAddress);
      return null;
    } catch (error) {
      console.error('❌ Error loading profile:', error);
      return null;
    }
  }

  /**
   * Update user profile (stores new version on Filecoin)
   */
  async updateUserProfile(profile: UserProfile): Promise<string> {
    profile.lastUpdated = new Date().toISOString();
    return await this.storeUserProfile(profile);
  }

  /**
   * Delete user profile data
   */
  async deleteUserProfile(walletAddress: string): Promise<boolean> {
    try {
      // Remove from localStorage
      localStorage.removeItem(`talkstake-profile-${walletAddress}`);
      localStorage.removeItem(`talkstake-hash-${walletAddress}`);
      
      console.log('🗑️ Profile deleted for:', walletAddress);
      return true;
    } catch (error) {
      console.error('❌ Error deleting profile:', error);
      return false;
    }
  }

  /**
   * Check if user has a profile
   */
  async hasProfile(walletAddress: string): Promise<boolean> {
    const profile = await this.getUserProfile(walletAddress);
    return profile !== null;
  }

  /**
   * Get storage statistics
   */
  getStorageInfo() {
    return {
      isDemoMode: this.isDemoMode,
      apiKeyConfigured: !!this.apiKey && this.apiKey !== 'your-lighthouse-api-key-here',
      storageType: this.isDemoMode ? 'localStorage (Demo)' : 'Filecoin via Lighthouse'
    };
  }

  /**
   * Get profile hash for a wallet address (for backward compatibility)
   */
  getProfileHash(walletAddress: string): string | null {
    try {
      // Check if we have a hash stored locally
      const hash = localStorage.getItem(`talkstake-hash-${walletAddress}`);
      if (hash) {
        return hash;
      }

      // Check if we have profile data stored locally (demo mode)
      const profileData = localStorage.getItem(`talkstake-profile-${walletAddress}`);
      if (profileData) {
        const parsed = JSON.parse(profileData);
        return parsed.filecoinHash || null;
      }

      return null;
    } catch (error) {
      console.error('Error getting profile hash:', error);
      return null;
    }
  }

  /**
   * Create a default profile for a wallet address
   */
  createDefaultProfile(walletAddress: string): UserProfile {
    const defaultProfile: UserProfile = {
      walletAddress,
      name: 'Anonymous User',
      bio: 'Tell us about yourself!',
      photoUrl: `https://api.dicebear.com/7.x/identicon/svg?seed=${walletAddress}`,
      twitterHandle: '',
      linkedinHandle: '',
      websiteUrl: '',
      expertise: [],
      joinedDate: new Date().toISOString(),
      totalStaked: 0,
      totalEarnings: 0,
      sessionsJoined: 0,
      reputation: 0,
      isExpert: false,
      lastUpdated: new Date().toISOString()
    };

    console.log('🆕 Created default profile for:', walletAddress);
    return defaultProfile;
  }

  // ==================== SESSION MANAGEMENT ====================

  /**
   * Create and store a new speaker session on Filecoin
   */
  async createSpeakerSession(sessionData: Omit<SpeakerSession, 'id' | 'createdAt' | 'updatedAt' | 'filecoinHash' | 'averageRating' | 'totalRatings' | 'speakerRating' | 'engagementScore' | 'reviews' | 'completionRate' | 'recommendationScore'>): Promise<SpeakerSession> {
    try {
      const sessionId = `session-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
      const now = new Date().toISOString();

      // Calculate initial speaker rating
      const speakerRating = await this.calculateSpeakerRating(sessionData.speakerAddress);

      const session: SpeakerSession = {
        ...sessionData,
        id: sessionId,
        createdAt: now,
        updatedAt: now,
        participants: [],
        viewers: 0,
        likes: 0,
        comments: 0,
        totalStaked: 0,
        ...this.getDefaultRatingValues(),
        speakerRating // Override with calculated speaker rating
      };

      console.log('📅 Creating new speaker session...', { title: session.title, speaker: session.speaker });

      const hash = await this.storeSpeakerSession(session);
      session.filecoinHash = hash;

      console.log('✅ Speaker session created with ID:', sessionId);
      return session;

    } catch (error) {
      console.error('❌ Error creating speaker session:', error);
      throw error;
    }
  }

  /**
   * Store speaker session data on Filecoin
   */
  async storeSpeakerSession(session: SpeakerSession): Promise<string> {
    try {
      console.log('💾 Storing session on Filecoin...', { id: session.id, title: session.title });

      // Demo mode - store locally
      if (this.isDemoMode) {
        const demoHash = `session-hash-${Date.now()}-${session.id.slice(-6)}`;
        const storageData = {
          ...session,
          filecoinHash: demoHash,
          storedAt: new Date().toISOString(),
          storageMode: 'demo'
        };
        
        // Store in localStorage for demo
        localStorage.setItem(`talkstake-session-${session.id}`, JSON.stringify(storageData));
        
        // Also store in sessions index for easy retrieval
        const sessionsIndex = this.getSessionsIndex();
        sessionsIndex.push(session.id);
        localStorage.setItem('talkstake-sessions-index', JSON.stringify(sessionsIndex));
        
        console.log('✅ Demo: Session stored locally with hash:', demoHash);
        return demoHash;
      }

      // Real Filecoin storage via Lighthouse
      const sessionJson = JSON.stringify(session, null, 2);
      const blob = new Blob([sessionJson], { type: 'application/json' });
      const file = new File([blob], `talkstake-session-${session.id}.json`, { 
        type: 'application/json' 
      });

      console.log('🚀 Uploading session to Filecoin via Lighthouse...');
      const uploadResponse = await lighthouse.upload([file], this.apiKey);
      
      if (uploadResponse?.data?.Hash) {
        const hash = uploadResponse.data.Hash;
        console.log('✅ Session stored on Filecoin with hash:', hash);
        
        // Store hash locally for quick access
        localStorage.setItem(`talkstake-session-hash-${session.id}`, hash);
        
        // Update sessions index
        const sessionsIndex = this.getSessionsIndex();
        sessionsIndex.push(session.id);
        localStorage.setItem('talkstake-sessions-index', JSON.stringify(sessionsIndex));
        
        return hash;
      } else {
        throw new Error('Failed to get hash from Lighthouse upload response');
      }
    } catch (error) {
      console.error('❌ Error storing session:', error);
      
      // Fallback to demo mode if Lighthouse fails
      console.log('🔄 Falling back to demo mode...');
      const demoHash = `fallback-${Date.now()}-${session.id.slice(-6)}`;
      localStorage.setItem(`talkstake-session-${session.id}`, JSON.stringify({
        ...session,
        filecoinHash: demoHash,
        storedAt: new Date().toISOString(),
        storageMode: 'fallback'
      }));
      
      return demoHash;
    }
  }

  /**
   * Get all sessions from Filecoin storage
   */
  async getAllSessions(): Promise<SpeakerSession[]> {
    try {
      console.log('📥 Loading all sessions from storage...');
      
      const sessionsIndex = this.getSessionsIndex();
      const sessions: SpeakerSession[] = [];

      for (const sessionId of sessionsIndex) {
        try {
          const session = await this.getSpeakerSession(sessionId);
          if (session) {
            sessions.push(session);
          }
        } catch (error) {
          console.warn(`⚠️ Failed to load session ${sessionId}:`, error);
        }
      }

      // Sort by creation date (newest first)
      sessions.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());

      console.log(`✅ Loaded ${sessions.length} sessions from storage`);
      return sessions;

    } catch (error) {
      console.error('❌ Error loading sessions:', error);
      return [];
    }
  }

  /**
   * Get a specific speaker session by ID
   */
  async getSpeakerSession(sessionId: string): Promise<SpeakerSession | null> {
    try {
      // Check localStorage first (for demo mode or cached data)
      const localData = localStorage.getItem(`talkstake-session-${sessionId}`);
      if (localData) {
        const parsed = JSON.parse(localData);
        return parsed;
      }

      // If not in demo mode, try to fetch from Filecoin
      if (!this.isDemoMode) {
        const hash = localStorage.getItem(`talkstake-session-hash-${sessionId}`);
        if (hash && hash !== 'demo-mode') {
          try {
            console.log('🌐 Fetching session from Filecoin with hash:', hash);
            const response = await fetch(`https://gateway.lighthouse.storage/ipfs/${hash}`);
            
            if (response.ok) {
              const sessionData = await response.json();
              console.log('✅ Session loaded from Filecoin');
              return sessionData;
            }
          } catch (error) {
            console.warn('⚠️ Failed to fetch from Filecoin, checking local storage');
          }
        }
      }

      return null;
    } catch (error) {
      console.error('❌ Error loading session:', error);
      return null;
    }
  }

  /**
   * Update an existing session
   */
  async updateSpeakerSession(sessionId: string, updates: Partial<SpeakerSession>): Promise<SpeakerSession | null> {
    try {
      const existingSession = await this.getSpeakerSession(sessionId);
      if (!existingSession) {
        throw new Error('Session not found');
      }

      const updatedSession: SpeakerSession = {
        ...existingSession,
        ...updates,
        id: sessionId, // Ensure ID doesn't change
        updatedAt: new Date().toISOString()
      };

      await this.storeSpeakerSession(updatedSession);
      return updatedSession;

    } catch (error) {
      console.error('❌ Error updating session:', error);
      return null;
    }
  }

  /**
   * Filter sessions by status/time
   */
  async getFilteredSessions(filter: 'all' | 'live' | 'upcoming' | 'past'): Promise<SpeakerSession[]> {
    const allSessions = await this.getAllSessions();
    const now = new Date();

    switch (filter) {
      case 'live':
        return allSessions.filter(session => session.status === 'live' || session.isLive);
      
      case 'upcoming':
        return allSessions.filter(session => {
          const startTime = new Date(session.startTime);
          return startTime > now && session.status === 'scheduled';
        });
      
      case 'past':
        return allSessions.filter(session => {
          if (session.status === 'completed' || session.status === 'cancelled') {
            return true;
          }
          const startTime = new Date(session.startTime);
          const endTime = session.endTime ? new Date(session.endTime) : new Date(startTime.getTime() + (session.duration * 60 * 1000));
          return endTime < now;
        });
      
      case 'all':
      default:
        return allSessions;
    }
  }

  /**
   * Get sessions by speaker address
   */
  async getSessionsBySpeaker(speakerAddress: string): Promise<SpeakerSession[]> {
    const allSessions = await this.getAllSessions();
    return allSessions.filter(session => session.speakerAddress === speakerAddress);
  }

  /**
   * Join a session (add participant)
   */
  async joinSession(sessionId: string, participantAddress: string): Promise<boolean> {
    try {
      const session = await this.getSpeakerSession(sessionId);
      if (!session) {
        throw new Error('Session not found');
      }

      if (!session.participants.includes(participantAddress)) {
        session.participants.push(participantAddress);
        session.viewers = session.participants.length;
        
        await this.storeSpeakerSession(session);
        console.log('✅ User joined session:', sessionId);
        return true;
      }

      return false;
    } catch (error) {
      console.error('❌ Error joining session:', error);
      return false;
    }
  }

  /**
   * Get sessions index for quick lookups
   */
  private getSessionsIndex(): string[] {
    try {
      const index = localStorage.getItem('talkstake-sessions-index');
      return index ? JSON.parse(index) : [];
    } catch (error) {
      console.error('Error reading sessions index:', error);
      return [];
    }
  }

  /**
   * Delete a session
   */
  async deleteSession(sessionId: string): Promise<boolean> {
    try {
      // Remove from localStorage
      localStorage.removeItem(`talkstake-session-${sessionId}`);
      localStorage.removeItem(`talkstake-session-hash-${sessionId}`);
      
      // Update sessions index
      const sessionsIndex = this.getSessionsIndex();
      const updatedIndex = sessionsIndex.filter(id => id !== sessionId);
      localStorage.setItem('talkstake-sessions-index', JSON.stringify(updatedIndex));
      
      console.log('🗑️ Session deleted:', sessionId);
      return true;
    } catch (error) {
      console.error('❌ Error deleting session:', error);
      return false;
    }
  }

  // ==================== RATING SYSTEM ====================

  /**
   * Calculate speaker rating based on all their sessions
   */
  async calculateSpeakerRating(speakerAddress: string): Promise<number> {
    try {
      const speakerSessions = await this.getSessionsBySpeaker(speakerAddress);
      
      if (speakerSessions.length === 0) {
        return 4.5; // Default rating for new speakers (instead of 0)
      }

      // Calculate weighted average based on session ratings and engagement
      let totalWeightedScore = 0;
      let totalWeight = 0;

      for (const session of speakerSessions) {
        if (session.status === 'completed' && session.totalRatings > 0) {
          // Weight by number of participants and ratings
          const weight = Math.sqrt(session.totalRatings) * Math.sqrt(session.participants.length);
          const sessionScore = (
            session.averageRating * 0.6 + // 60% from direct ratings
            (session.engagementScore / 100) * 5 * 0.2 + // 20% from engagement (normalized to 5-star scale)
            (session.completionRate / 100) * 5 * 0.2 // 20% from completion rate
          );
          
          totalWeightedScore += sessionScore * weight;
          totalWeight += weight;
        }
      }

      const rating = totalWeight > 0 ? totalWeightedScore / totalWeight : 0;
      return Math.min(5, Math.max(0, rating)); // Clamp between 0-5
    } catch (error) {
      console.error('❌ Error calculating speaker rating:', error);
      return 0;
    }
  }

  /**
   * Calculate engagement score based on likes, comments, and participation
   */
  calculateEngagementScore(session: SpeakerSession): number {
    if (session.participants.length === 0) return 0;

    const likesRatio = session.likes / session.participants.length;
    const commentsRatio = session.comments / session.participants.length;
    const viewerRetention = session.viewers / session.maxParticipants;

    // Normalize and combine metrics (scale 0-100)
    const engagementScore = (
      Math.min(likesRatio, 1) * 40 + // Up to 40 points for likes
      Math.min(commentsRatio, 0.5) * 2 * 30 + // Up to 30 points for comments
      Math.min(viewerRetention, 1) * 30 // Up to 30 points for retention
    );

    return Math.min(100, Math.max(0, engagementScore));
  }

  /**
   * Add a review to a session
   */
  async addSessionReview(sessionId: string, reviewerAddress: string, rating: number, comment: string): Promise<boolean> {
    try {
      if (rating < 1 || rating > 5) {
        throw new Error('Rating must be between 1 and 5');
      }

      const session = await this.getSpeakerSession(sessionId);
      if (!session) {
        throw new Error('Session not found');
      }

      // Check if user already reviewed this session
      const existingReview = session.reviews.find(review => review.reviewerAddress === reviewerAddress);
      if (existingReview) {
        throw new Error('User has already reviewed this session');
      }

      // Create new review
      const review: SessionReview = {
        id: `review-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
        sessionId,
        reviewerAddress,
        rating,
        comment,
        helpful: 0,
        createdAt: new Date().toISOString()
      };

      // Add review to session
      session.reviews.push(review);

      // Recalculate session rating
      const totalRating = session.reviews.reduce((sum, r) => sum + r.rating, 0);
      session.averageRating = totalRating / session.reviews.length;
      session.totalRatings = session.reviews.length;

      // Recalculate engagement score
      session.engagementScore = this.calculateEngagementScore(session);

      // Recalculate speaker rating
      session.speakerRating = await this.calculateSpeakerRating(session.speakerAddress);

      // Save updated session
      await this.storeSpeakerSession(session);

      console.log('✅ Review added successfully');
      return true;
    } catch (error) {
      console.error('❌ Error adding review:', error);
      throw error;
    }
  }

  /**
   * Get session reviews
   */
  async getSessionReviews(sessionId: string): Promise<SessionReview[]> {
    try {
      const session = await this.getSpeakerSession(sessionId);
      return session?.reviews || [];
    } catch (error) {
      console.error('❌ Error getting reviews:', error);
      return [];
    }
  }

  /**
   * Mark review as helpful
   */
  async markReviewHelpful(sessionId: string, reviewId: string): Promise<boolean> {
    try {
      const session = await this.getSpeakerSession(sessionId);
      if (!session) return false;

      const review = session.reviews.find(r => r.id === reviewId);
      if (!review) return false;

      review.helpful += 1;
      await this.storeSpeakerSession(session);

      return true;
    } catch (error) {
      console.error('❌ Error marking review helpful:', error);
      return false;
    }
  }

  /**
   * Update session completion metrics (called when session ends)
   */
  async updateSessionCompletionMetrics(sessionId: string, completedParticipants: string[]): Promise<boolean> {
    try {
      const session = await this.getSpeakerSession(sessionId);
      if (!session) return false;

      // Calculate completion rate
      session.completionRate = session.participants.length > 0 
        ? (completedParticipants.length / session.participants.length) * 100 
        : 0;

      // Update engagement score
      session.engagementScore = this.calculateEngagementScore(session);

      // Recalculate speaker rating
      session.speakerRating = await this.calculateSpeakerRating(session.speakerAddress);

      await this.storeSpeakerSession(session);
      return true;
    } catch (error) {
      console.error('❌ Error updating completion metrics:', error);
      return false;
    }
  }

  /**
   * Get default rating values for new sessions
   */
  getDefaultRatingValues(): {
    averageRating: number;
    totalRatings: number;
    speakerRating: number;
    engagementScore: number;
    reviews: SessionReview[];
    completionRate: number;
    recommendationScore: number;
  } {
    return {
      averageRating: 0, // No ratings yet
      totalRatings: 0,
      speakerRating: 4.5, // Default rating for new speakers
      engagementScore: 0,
      reviews: [],
      completionRate: 0,
      recommendationScore: 4.5 // Default recommendation score
    };
  }
}

// Export singleton instance
export const filecoinStorage = new FilecoinStorage();