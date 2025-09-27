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
}

// Export singleton instance
export const filecoinStorage = new FilecoinStorage();