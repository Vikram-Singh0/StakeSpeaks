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
    this.isDemoMode = !this.apiKey || this.apiKey === 'your-lighthouse-api-key-here' || this.apiKey.length < 10;
    
    if (this.isDemoMode) {
      console.log('🔧 Running in DEMO mode - data will be stored locally');
      console.log('📝 To use real Filecoin storage, get an API key from https://files.lighthouse.storage/');
      console.log('🔑 Current API key status:', this.apiKey ? 'Present but invalid' : 'Not provided');
    } else {
      console.log('🚀 Running in PRODUCTION mode with Lighthouse API');
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
      console.log('📊 File size:', file.size, 'bytes');
      console.log('🔑 Using API key:', this.apiKey.substring(0, 8) + '...');
      
      const uploadResponse = await this.uploadToLighthouseWithRetry([file], 3);
      
      if (uploadResponse && typeof uploadResponse === 'object' && 'data' in uploadResponse) {
        const responseData = uploadResponse.data as { Hash?: string };
        if (responseData?.Hash) {
          const hash = responseData.Hash;
          console.log('✅ Profile stored on Filecoin with hash:', hash);
          
          // Also store hash locally for quick access
          localStorage.setItem(`talkstake-hash-${profile.walletAddress}`, hash);
          
          return hash;
        }
      }
      
      console.error('❌ Upload response structure:', uploadResponse);
      throw new Error('Failed to get hash from Lighthouse upload response');
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

      // In demo mode, check localStorage first
      if (this.isDemoMode) {
        const localData = localStorage.getItem(`talkstake-profile-${walletAddress}`);
        if (localData) {
          const parsed = JSON.parse(localData);
          console.log('📱 Profile loaded from localStorage (demo mode)');
          return parsed;
        }
        return null;
      }

      // Try to find profile in database using getUploads
      try {
        console.log('🌐 Searching for profile in Lighthouse database...');
        const profile = await this.findProfileInDatabase(walletAddress);
        if (profile) {
          console.log('✅ Profile loaded from Lighthouse database');
          return profile;
        }
      } catch (error) {
        console.warn('⚠️ Failed to search profile in database:', error);
      }

      // Fallback to localStorage hash method
      const hash = localStorage.getItem(`talkstake-hash-${walletAddress}`);
      if (hash && hash !== 'demo-mode' && !hash.startsWith('demo-hash-') && !hash.startsWith('fallback-')) {
        try {
          console.log('🌐 Fetching profile from Filecoin database with hash:', hash);
          const profileData = await this.fetchFromLighthouseWithRetry(hash);
          console.log('✅ Profile loaded from Filecoin database');
          return profileData as UserProfile;
        } catch (error) {
          console.warn('⚠️ Failed to fetch from Filecoin database:', error);
        }
      }

      // Fallback to localStorage if database fetch fails
      const localData = localStorage.getItem(`talkstake-profile-${walletAddress}`);
      if (localData) {
        const parsed = JSON.parse(localData);
        console.log('📱 Profile loaded from localStorage (fallback)');
        return parsed;
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
      apiKeyConfigured: !!this.apiKey && this.apiKey !== 'your-lighthouse-api-key-here' && this.apiKey.length >= 10,
      storageType: this.isDemoMode ? 'localStorage (Demo)' : 'Filecoin via Lighthouse',
      apiKeyLength: this.apiKey.length,
      apiKeyPreview: this.apiKey ? this.apiKey.substring(0, 8) + '...' : 'Not set'
    };
  }

  /**
   * Get all uploads from Lighthouse (for debugging)
   */
  async getAllUploads(): Promise<{ success: boolean; data?: unknown; error?: string }> {
    try {
      console.log('📥 Fetching all uploads from Lighthouse...');
      
      if (this.isDemoMode) {
        return {
          success: false,
          error: 'Running in demo mode - no API key configured'
        };
      }

      const allUploads: unknown[] = [];
      let lastKey: string | null = null;
      let requestCount = 0;
      const maxRequests = 5; // Limit for debugging

      do {
        console.log(`📥 Fetching uploads batch ${requestCount + 1}${lastKey ? ` (from key: ${lastKey})` : ''}...`);
        
        const response = await lighthouse.getUploads(this.apiKey, lastKey);
        
        if (!response?.data?.fileList) {
          console.warn('⚠️ Invalid response structure from getUploads:', response);
          break;
        }

        const fileList = response.data.fileList;
        console.log(`📋 Received ${fileList.length} files from Lighthouse`);
        
        allUploads.push(...fileList);

        // Check if we should continue fetching
        if (fileList.length === 0 || requestCount >= maxRequests - 1) {
          console.log('🏁 No more files to fetch or reached max requests');
          break;
        }

        // Set lastKey for next request
        lastKey = fileList[fileList.length - 1]?.id || null;
        requestCount++;

      } while (lastKey && requestCount < maxRequests);

      console.log(`✅ Retrieved ${allUploads.length} total uploads from Lighthouse`);
      
      // Filter and categorize files
      const typedUploads = allUploads as { fileName?: string }[];
      const sessionFiles = typedUploads.filter(file => 
        file.fileName && file.fileName.startsWith('talkstake-session-') && file.fileName.endsWith('.json')
      );
      
      const profileFiles = typedUploads.filter(file => 
        file.fileName && file.fileName.startsWith('talkstake-profile-') && file.fileName.endsWith('.json')
      );

      return {
        success: true,
        data: {
          totalFiles: allUploads.length,
          sessionFiles: sessionFiles.length,
          profileFiles: profileFiles.length,
          allFiles: allUploads,
          sessionFileList: sessionFiles,
          profileFileList: profileFiles
        }
      };
    } catch (error) {
      console.error('❌ Error fetching uploads:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error'
      };
    }
  }

  /**
   * Debug session data structure
   */
  async debugSessionData(): Promise<{ success: boolean; data?: unknown; error?: string }> {
    try {
      console.log('🔍 Debugging session data structure...');
      
      if (this.isDemoMode) {
        return {
          success: false,
          error: 'Running in demo mode - no API key configured'
        };
      }

      // Get all uploads to see what's in the database
      const uploads = await this.getAllUploads();
      
      if (!uploads.success) {
        return uploads;
      }

      const uploadsData = uploads.data as any;
      const sessionFiles = uploadsData.sessionFileList;
      console.log(`📊 Found ${sessionFiles.length} session files in database`);

      if (sessionFiles.length === 0) {
        return {
          success: true,
          data: {
            message: 'No session files found in database',
            totalFiles: uploadsData.totalFiles,
            allFiles: uploadsData.allFiles.slice(0, 5) // Show first 5 files for debugging
          }
        };
      }

      // Try to fetch the first session file to see its structure
      const firstSessionFile = sessionFiles[0];
      console.log(`🔍 Analyzing first session file: ${firstSessionFile.fileName}`);
      
      try {
        const sessionData = await this.fetchFromLighthouseWithRetry(firstSessionFile.cid);
        
        return {
          success: true,
          data: {
            totalSessionFiles: sessionFiles.length,
            firstSessionFile: {
              fileName: firstSessionFile.fileName,
              cid: firstSessionFile.cid,
              fileSizeInBytes: firstSessionFile.fileSizeInBytes,
              createdAt: firstSessionFile.createdAt,
              rawData: sessionData,
              normalizedData: this.ensureSessionHasRatingFields(sessionData)
            },
            allSessionFiles: sessionFiles.map((file: { fileName: string; cid: string; size: number; uploadDate: string }) => ({
              fileName: file.fileName,
              cid: file.cid,
              fileSizeInBytes: file.fileSizeInBytes,
              createdAt: file.createdAt
            }))
          }
        };
      } catch (error) {
        return {
          success: false,
          error: `Failed to fetch session data: ${error instanceof Error ? error.message : 'Unknown error'}`,
          data: {
            sessionFile: firstSessionFile,
            error: error
          }
        };
      }
    } catch (error) {
      console.error('❌ Error debugging session data:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error'
      };
    }
  }

  /**
   * Test different IPFS gateways to find the best one
   */
  async testGateways(testHash: string): Promise<{ success: boolean; workingGateways?: string[]; error?: string }> {
    try {
      console.log('🧪 Testing different IPFS gateways...');
      
      const gateways = [
        'https://gateway.lighthouse.storage/ipfs/',
        'https://ipfs.io/ipfs/',
        'https://gateway.pinata.cloud/ipfs/',
        'https://cloudflare-ipfs.com/ipfs/',
        'https://dweb.link/ipfs/'
      ];
      
      const workingGateways: string[] = [];
      
      for (const gateway of gateways) {
        try {
          console.log(`🔍 Testing gateway: ${gateway}`);
          const response = await fetch(`${gateway}${testHash}`, {
            method: 'GET',
            mode: 'cors'
          });
          
          if (response.ok) {
            workingGateways.push(gateway);
            console.log(`✅ Gateway working: ${gateway}`);
          } else {
            console.log(`❌ Gateway failed: ${gateway} (${response.status})`);
          }
        } catch (error) {
          console.log(`❌ Gateway error: ${gateway}`, error);
        }
      }
      
      return {
        success: workingGateways.length > 0,
        workingGateways,
        error: workingGateways.length === 0 ? 'No working gateways found' : undefined
      };
    } catch (error) {
      console.error('❌ Gateway testing failed:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error'
      };
    }
  }

  /**
   * Test Lighthouse connection
   */
  async testLighthouseConnection(): Promise<{ success: boolean; error?: string; details?: unknown }> {
    try {
      console.log('🧪 Testing Lighthouse connection...');
      
      if (this.isDemoMode) {
        return {
          success: false,
          error: 'Running in demo mode - no API key configured',
          details: { mode: 'demo', apiKey: this.apiKey }
        };
      }

      // Create a small test file
      const testData = {
        test: true,
        timestamp: new Date().toISOString(),
        message: 'Lighthouse connection test'
      };
      
      const testJson = JSON.stringify(testData, null, 2);
      const blob = new Blob([testJson], { type: 'application/json' });
      const file = new File([blob], 'lighthouse-test.json', { type: 'application/json' });

      console.log('🚀 Uploading test file to Lighthouse...');
      const uploadResponse = await this.uploadToLighthouseWithRetry([file], 2);
      
      if (uploadResponse?.data?.Hash) {
        const hash = uploadResponse.data.Hash;
        console.log('✅ Test upload successful, hash:', hash);
        
        // Test gateways first
        const gatewayTest = await this.testGateways(hash);
        
        // Try to fetch it back
        console.log('🌐 Testing fetch from Lighthouse...');
        const fetchData = await this.fetchFromLighthouseWithRetry(hash, 2);
        
        if (fetchData && fetchData.test === true) {
          console.log('✅ Lighthouse connection test successful!');
          return {
            success: true,
            details: {
              uploadHash: hash,
              fetchData: fetchData,
              apiKeyPreview: this.apiKey.substring(0, 8) + '...',
              workingGateways: gatewayTest.workingGateways
            }
          };
        } else {
          return {
            success: false,
            error: 'Fetch test failed - data mismatch',
            details: { hash, fetchData, workingGateways: gatewayTest.workingGateways }
          };
        }
      } else {
        return {
          success: false,
          error: 'Upload test failed - no hash returned',
          details: uploadResponse
        };
      }
    } catch (error) {
      console.error('❌ Lighthouse connection test failed:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
        details: { error }
      };
    }
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
        
        // Also store in sessions index for easy retrieval (prevent duplicates)
        const sessionsIndex = this.getSessionsIndex();
        if (!sessionsIndex.includes(session.id)) {
          sessionsIndex.push(session.id);
          localStorage.setItem('talkstake-sessions-index', JSON.stringify(sessionsIndex));
        }
        
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
      console.log('📊 Session file size:', file.size, 'bytes');
      console.log('🔑 Using API key:', this.apiKey.substring(0, 8) + '...');
      
      const uploadResponse = await this.uploadToLighthouseWithRetry([file], 3);
      
      if (uploadResponse?.data?.Hash) {
        const hash = uploadResponse.data.Hash;
        console.log('✅ Session stored on Filecoin with hash:', hash);
        
        // Store hash locally for quick access
        localStorage.setItem(`talkstake-session-hash-${session.id}`, hash);
        
        // Update sessions index (prevent duplicates)
        const sessionsIndex = this.getSessionsIndex();
        if (!sessionsIndex.includes(session.id)) {
          sessionsIndex.push(session.id);
          localStorage.setItem('talkstake-sessions-index', JSON.stringify(sessionsIndex));
        }
        
        return hash;
      } else {
        console.error('❌ Session upload response structure:', uploadResponse);
        throw new Error('Failed to get hash from Lighthouse upload response');
      }
    } catch (error) {
      console.error('❌ Error storing session:', error);
      
      // Fallback to demo mode if Lighthouse fails
      console.log('🔄 Falling back to demo mode...');
      const demoHash = `fallback-${Date.now()}-${session.id.slice(-6)}`;
      const fallbackData = {
        ...session,
        filecoinHash: demoHash,
        storedAt: new Date().toISOString(),
        storageMode: 'fallback'
      };
      
      localStorage.setItem(`talkstake-session-${session.id}`, JSON.stringify(fallbackData));
      
      // Update sessions index (prevent duplicates)
      const sessionsIndex = this.getSessionsIndex();
      if (!sessionsIndex.includes(session.id)) {
        sessionsIndex.push(session.id);
        localStorage.setItem('talkstake-sessions-index', JSON.stringify(sessionsIndex));
      }
      
      return demoHash;
    }
  }

  /**
   * Load sessions from localStorage (for demo mode only)
   */
  private loadSessionsFromLocalStorage(): SpeakerSession[] {
    try {
      console.log('📥 Loading sessions from localStorage...');
      const sessionsIndex = this.getSessionsIndex();
      const sessions: SpeakerSession[] = [];
      const seenSessionIds = new Set<string>();

      for (const sessionId of sessionsIndex) {
        if (seenSessionIds.has(sessionId)) continue;
        
        try {
          const sessionData = localStorage.getItem(`talkstake-session-${sessionId}`);
          if (sessionData) {
            const session = this.ensureSessionHasRatingFields(JSON.parse(sessionData));
            sessions.push(session);
            seenSessionIds.add(sessionId);
          }
        } catch (error) {
          console.warn(`⚠️ Failed to load session ${sessionId}:`, error);
        }
      }

      // Sort by creation date (newest first)
      sessions.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());

      console.log(`✅ Loaded ${sessions.length} unique sessions from localStorage`);
      return sessions;
    } catch (error) {
      console.error('❌ Error loading sessions from localStorage:', error);
      return [];
    }
  }

  /**
   * Fetch sessions from Lighthouse database using getUploads method
   */
  private async fetchSessionsFromDatabaseSafe(): Promise<SpeakerSession[]> {
    try {
      console.log('🌐 Fetching all sessions from Lighthouse database using getUploads...');
      
      if (this.isDemoMode) {
        console.log('🔧 Demo mode: Using localStorage fallback');
        return this.loadSessionsFromLocalStorage();
      }

      const sessions: SpeakerSession[] = [];
      const seenSessionIds = new Set<string>(); // Track unique session IDs
      let lastKey: string | null = null;
      let totalFetched = 0;
      const maxRequests = 10; // Prevent infinite loops
      let requestCount = 0;

      do {
        try {
          console.log(`📥 Fetching uploads batch ${requestCount + 1}${lastKey ? ` (from key: ${lastKey})` : ''}...`);
          
          const response = await lighthouse.getUploads(this.apiKey, lastKey);
          
          if (!response?.data?.fileList) {
            console.warn('⚠️ Invalid response structure from getUploads:', response);
            break;
          }

          const fileList = response.data.fileList;
          console.log(`📋 Received ${fileList.length} files from Lighthouse`);
          
          // Filter for session files
          const sessionFiles = fileList.filter(file => 
            file.fileName && file.fileName.startsWith('talkstake-session-') && file.fileName.endsWith('.json')
          );
          
          console.log(`🎯 Found ${sessionFiles.length} session files in this batch`);

          // Fetch each session file content
          for (const file of sessionFiles) {
            try {
              console.log(`🔍 Fetching session file: ${file.fileName} (CID: ${file.cid})`);
              console.log(`📊 File info: Size ${file.fileSizeInBytes} bytes, Created ${file.createdAt}`);
              
              const sessionData = await this.fetchFromLighthouseWithRetry(file.cid);
              
              // Validate that we got valid session data
              if (!sessionData || typeof sessionData !== 'object') {
                console.warn(`⚠️ Invalid session data for ${file.fileName}:`, sessionData);
                continue;
              }

              // Add file metadata to session data
              const enrichedSessionData = {
                ...sessionData,
                filecoinHash: file.cid,
                fileSizeInBytes: file.fileSizeInBytes,
                fileCreatedAt: file.createdAt,
                fileLastUpdate: file.lastUpdate
              };

              const session = this.ensureSessionHasRatingFields(enrichedSessionData);
              
              // Check for duplicate session IDs
              if (seenSessionIds.has(session.id)) {
                console.warn(`⚠️ Duplicate session ID detected: ${session.id} - skipping`);
                continue;
              }
              
              // Add to seen set and sessions array
              seenSessionIds.add(session.id);
              sessions.push(session);
              
              console.log(`✅ Loaded session from database: ${session.title} (${session.status})`);
              console.log(`📅 Session time: ${session.startTime} - ${session.endTime}`);
              totalFetched++;
            } catch (error) {
              console.warn(`⚠️ Failed to fetch session file ${file.fileName}:`, error);
              
              // Try to get more details about the error
              if (error instanceof Error) {
                console.warn(`   Error message: ${error.message}`);
                console.warn(`   Error stack: ${error.stack}`);
              }
            }
          }

          // Check if we should continue fetching
          const totalFiles = response.data.totalFiles || 0;
          console.log(`📊 Total files in database: ${totalFiles}, fetched so far: ${totalFetched}`);
          
          if (fileList.length === 0 || requestCount >= maxRequests - 1) {
            console.log('🏁 No more files to fetch or reached max requests');
            break;
          }

          // Set lastKey for next request
          lastKey = fileList[fileList.length - 1]?.id || null;
          requestCount++;

        } catch (error) {
          console.error(`❌ Error fetching uploads batch ${requestCount + 1}:`, error);
          break;
        }
      } while (lastKey && requestCount < maxRequests);

      // Final deduplication check (in case of any edge cases)
      const uniqueSessions = sessions.filter((session, index, self) => 
        index === self.findIndex(s => s.id === session.id)
      );

      if (uniqueSessions.length !== sessions.length) {
        console.warn(`🧹 Removed ${sessions.length - uniqueSessions.length} duplicate sessions`);
      }

      // Sort by creation date (newest first)
      uniqueSessions.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());

      console.log(`✅ Loaded ${uniqueSessions.length} unique sessions from Lighthouse database`);
      return uniqueSessions;
    } catch (error) {
      console.error('❌ Error fetching sessions from database:', error);
      
      // Fallback to localStorage if database fetch fails completely
      console.log('🔄 Falling back to localStorage...');
      return this.loadSessionsFromLocalStorage();
    }
  }

  /**
   * Get a specific speaker session by ID
   */
  async getSpeakerSession(sessionId: string): Promise<SpeakerSession | null> {
    try {
      console.log('🔍 Loading session:', sessionId);

      // In demo mode, check localStorage first
      if (this.isDemoMode) {
        const localData = localStorage.getItem(`talkstake-session-${sessionId}`);
        if (localData) {
          const parsed = JSON.parse(localData);
          console.log('📱 Session loaded from localStorage (demo mode)');
          return this.ensureSessionHasRatingFields(parsed);
        }
        return null;
      }

      // In production mode, always fetch from database first
      const hash = localStorage.getItem(`talkstake-session-hash-${sessionId}`);
      if (hash && hash !== 'demo-mode' && !hash.startsWith('demo-hash-') && !hash.startsWith('fallback-')) {
        try {
          console.log('🌐 Fetching session from Filecoin database with hash:', hash);
          const sessionData = await this.fetchFromLighthouseWithRetry(hash);
          console.log('✅ Session loaded from Filecoin database');
          return this.ensureSessionHasRatingFields(sessionData);
        } catch (error) {
          console.warn('⚠️ Failed to fetch from Filecoin database:', error);
        }
      }

      // Fallback to localStorage if database fetch fails
      const localData = localStorage.getItem(`talkstake-session-${sessionId}`);
      if (localData) {
        const parsed = JSON.parse(localData);
        console.log('📱 Session loaded from localStorage (fallback)');
        return this.ensureSessionHasRatingFields(parsed);
      }

      console.log('❌ Session not found:', sessionId);
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
   * Get all sessions from storage (Lighthouse database or localStorage in demo mode)
   */
  async getAllSessions(): Promise<SpeakerSession[]> {
    try {
      console.log('📥 Loading all sessions from storage...');
      
      if (this.isDemoMode) {
        console.log('🔧 Demo mode: Loading from localStorage');
        return this.loadSessionsFromLocalStorage();
      }
      
      // Always fetch from database in production mode
      console.log('🌐 Production mode: Fetching from Lighthouse database');
      return await this.fetchSessionsFromDatabaseSafe();
      
    } catch (error) {
      console.error('❌ Error loading sessions:', error);
      return [];
    }
  }

  /**
   * Filter sessions by status/time
   */
  async getFilteredSessions(filter: 'all' | 'live' | 'upcoming' | 'past'): Promise<SpeakerSession[]> {
    const allSessions = await this.getAllSessions();
    const now = new Date();

    // Update session statuses but batch the storage operations
    const updatedSessions: SpeakerSession[] = [];
    const sessionsToUpdate: SpeakerSession[] = [];

    for (const session of allSessions) {
      const updatedSession = this.updateSessionStatus(session, now);
      
      // Collect sessions that need status updates
      if (updatedSession.status !== session.status || updatedSession.isLive !== session.isLive) {
        sessionsToUpdate.push(updatedSession);
      }
      
      updatedSessions.push(updatedSession);
    }

    // Batch update sessions that changed status (async but don't wait)
    if (sessionsToUpdate.length > 0) {
      this.batchUpdateSessions(sessionsToUpdate).catch(error => {
        console.error('❌ Error batch updating sessions:', error);
      });
    }

    switch (filter) {
      case 'live':
        return updatedSessions.filter(session => 
          session.status === 'live' || session.isLive
        );
      
      case 'upcoming':
        return updatedSessions.filter(session => {
          const startTime = new Date(session.startTime);
          return startTime > now && session.status === 'scheduled';
        });
      
      case 'past':
        return updatedSessions.filter(session => {
          return session.status === 'completed' || session.status === 'cancelled';
        });
      
      case 'all':
      default:
        return updatedSessions;
    }
  }

  /**
   * Batch update multiple sessions (to avoid excessive storage calls)
   */
  private async batchUpdateSessions(sessions: SpeakerSession[]): Promise<void> {
    console.log(`🔄 Batch updating ${sessions.length} sessions...`);
    
    for (const session of sessions) {
      try {
        await this.storeSpeakerSession(session);
        console.log(`📊 Updated session "${session.title}" status: ${session.status}`);
      } catch (error) {
        console.error(`❌ Failed to update session ${session.id}:`, error);
      }
    }
  }

  /**
   * Update session status based on current time
   */
  private updateSessionStatus(session: SpeakerSession, now: Date): SpeakerSession {
    const startTime = new Date(session.startTime);
    const endTime = session.endTime 
      ? new Date(session.endTime) 
      : new Date(startTime.getTime() + (session.duration * 60 * 1000));

    let newStatus = session.status;
    let newIsLive = session.isLive;

    // Don't change manually cancelled sessions
    if (session.status === 'cancelled') {
      return { ...session };
    }

    // Allow a 5-minute grace period for sessions to be considered live
    const gracePeriod = 5 * 60 * 1000; // 5 minutes in milliseconds
    const adjustedStartTime = new Date(startTime.getTime() - gracePeriod);

    // Check if session should be live (with grace period)
    if (now >= adjustedStartTime && now <= endTime) {
      newStatus = 'live';
      newIsLive = true;
    }
    // Check if session should be completed
    else if (now > endTime) {
      newStatus = 'completed';
      newIsLive = false;
    }
    // Session is upcoming
    else if (now < adjustedStartTime) {
      newStatus = 'scheduled';
      newIsLive = false;
    }

    return {
      ...session,
      status: newStatus,
      isLive: newIsLive,
      updatedAt: new Date().toISOString()
    };
  }

  /**
   * Manually update all session statuses based on current time
   */
  async updateAllSessionStatuses(): Promise<void> {
    try {
      console.log('🔄 Updating all session statuses...');
      const allSessions = await this.getAllSessions();
      const now = new Date();

      for (const session of allSessions) {
        const updatedSession = this.updateSessionStatus(session, now);
        
        // If status changed, save the updated session
        if (updatedSession.status !== session.status || updatedSession.isLive !== session.isLive) {
          await this.storeSpeakerSession(updatedSession);
          console.log(`📊 Updated session "${session.title}" status: ${session.status} → ${updatedSession.status}`);
        }
      }

      console.log('✅ All session statuses updated');
    } catch (error) {
      console.error('❌ Error updating session statuses:', error);
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
   * Clean up duplicate sessions from index and database
   */
  async cleanupDuplicateSessions(): Promise<void> {
    try {
      console.log('🧹 Starting duplicate session cleanup...');
      
      // Clean up localStorage index
      const sessionsIndex = this.getSessionsIndex();
      const uniqueSessionIds = [...new Set(sessionsIndex)]; // Remove duplicates
      
      if (uniqueSessionIds.length !== sessionsIndex.length) {
        console.log(`🧹 Cleaning up ${sessionsIndex.length - uniqueSessionIds.length} duplicate session entries in index...`);
        localStorage.setItem('talkstake-sessions-index', JSON.stringify(uniqueSessionIds));
        console.log('✅ Session index cleaned up');
      }

      // Clean up localStorage data
      const allKeys = Object.keys(localStorage);
      const sessionKeys = allKeys.filter(key => key.startsWith('talkstake-session-'));
      const sessionHashKeys = allKeys.filter(key => key.startsWith('talkstake-session-hash-'));
      
      console.log(`📊 Found ${sessionKeys.length} session data entries and ${sessionHashKeys.length} session hash entries`);
      
      // Remove orphaned entries (data without hash or hash without data)
      let removedCount = 0;
      for (const sessionId of uniqueSessionIds) {
        const hasData = sessionKeys.includes(`talkstake-session-${sessionId}`);
        const hasHash = sessionHashKeys.includes(`talkstake-session-hash-${sessionId}`);
        
        if (!hasData && hasHash) {
          localStorage.removeItem(`talkstake-session-hash-${sessionId}`);
          removedCount++;
          console.log(`🗑️ Removed orphaned hash for session: ${sessionId}`);
        }
        
        if (hasData && !hasHash) {
          // This is okay - might be demo mode data
        }
      }
      
      if (removedCount > 0) {
        console.log(`✅ Removed ${removedCount} orphaned entries`);
      }
      
      console.log('✅ Duplicate session cleanup completed');
    } catch (error) {
      console.error('❌ Error cleaning up sessions:', error);
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

  // ==================== LIGHTHOUSE UTILITIES ====================

  /**
   * Find profile in database using getUploads
   */
  private async findProfileInDatabase(walletAddress: string): Promise<UserProfile | null> {
    try {
      let lastKey: string | null = null;
      const maxRequests = 5; // Limit search to prevent excessive requests
      let requestCount = 0;

      do {
        console.log(`🔍 Searching for profile batch ${requestCount + 1}${lastKey ? ` (from key: ${lastKey})` : ''}...`);
        
        const response = await lighthouse.getUploads(this.apiKey, lastKey);
        
        if (!response?.data?.fileList) {
          console.warn('⚠️ Invalid response structure from getUploads:', response);
          break;
        }

        const fileList = response.data.fileList;
        
        // Filter for profile files matching the wallet address
        const profileFiles = fileList.filter(file => 
          file.fileName && 
          file.fileName.startsWith('talkstake-profile-') && 
          file.fileName.includes(walletAddress) &&
          file.fileName.endsWith('.json')
        );
        
        console.log(`🎯 Found ${profileFiles.length} profile files for wallet ${walletAddress}`);

        // Fetch the profile file content
        for (const file of profileFiles) {
          try {
            console.log(`🔍 Fetching profile file: ${file.fileName} (CID: ${file.cid})`);
            
            const profileData = await this.fetchFromLighthouseWithRetry(file.cid);
            
            // Verify this is the correct profile
            if (profileData.walletAddress === walletAddress) {
              console.log(`✅ Found matching profile for wallet: ${walletAddress}`);
              return profileData;
            }
          } catch (error) {
            console.warn(`⚠️ Failed to fetch profile file ${file.fileName}:`, error);
          }
        }

        // Check if we should continue searching
        if (fileList.length === 0 || requestCount >= maxRequests - 1) {
          console.log('🏁 No more files to search or reached max requests');
          break;
        }

        // Set lastKey for next request
        lastKey = fileList[fileList.length - 1]?.id || null;
        requestCount++;

      } while (lastKey && requestCount < maxRequests);

      console.log(`❌ Profile not found for wallet: ${walletAddress}`);
      return null;
    } catch (error) {
      console.error('❌ Error searching for profile in database:', error);
      return null;
    }
  }

  /**
   * Upload to Lighthouse with retry mechanism
   */
  private async uploadToLighthouseWithRetry(files: File[], maxRetries: number = 3): Promise<unknown> {
    let lastError: unknown;
    
    for (let attempt = 1; attempt <= maxRetries; attempt++) {
      try {
        console.log(`🚀 Lighthouse upload attempt ${attempt}/${maxRetries}...`);
        
        const response = await lighthouse.upload(files, this.apiKey);
        
        if (response && response.data && response.data.Hash) {
          console.log(`✅ Lighthouse upload successful on attempt ${attempt}`);
          return response;
        } else {
          throw new Error(`Invalid response structure: ${JSON.stringify(response)}`);
        }
      } catch (error) {
        lastError = error;
        console.warn(`⚠️ Lighthouse upload attempt ${attempt} failed:`, error);
        
        if (attempt < maxRetries) {
          const delay = Math.pow(2, attempt) * 1000; // Exponential backoff
          console.log(`⏳ Waiting ${delay}ms before retry...`);
          await new Promise(resolve => setTimeout(resolve, delay));
        }
      }
    }
    
    throw new Error(`Lighthouse upload failed after ${maxRetries} attempts. Last error: ${lastError?.message || lastError}`);
  }

  /**
   * Fetch from Lighthouse gateway with retry mechanism
   */
  private async fetchFromLighthouseWithRetry(hash: string, maxRetries: number = 3): Promise<unknown> {
    let lastError: unknown;
    
    for (let attempt = 1; attempt <= maxRetries; attempt++) {
      try {
        console.log(`🌐 Lighthouse fetch attempt ${attempt}/${maxRetries} for hash: ${hash}`);
        
        // Use simple fetch without problematic headers to avoid CORS issues
        const response = await fetch(`https://gateway.lighthouse.storage/ipfs/${hash}`, {
          method: 'GET',
          mode: 'cors',
          headers: {
            'Accept': 'application/json'
            // Removed Cache-Control header that was causing CORS issues
          }
        });
        
        if (response.ok) {
          const data = await response.json();
          console.log(`✅ Lighthouse fetch successful on attempt ${attempt}`);
          return data;
        } else {
          throw new Error(`HTTP ${response.status}: ${response.statusText}`);
        }
      } catch (error) {
        lastError = error;
        console.warn(`⚠️ Lighthouse fetch attempt ${attempt} failed:`, error);
        
        // If it's a CORS error or network error, try alternative gateways
        if (error instanceof Error && (error.message.includes('CORS') || error.message.includes('Failed to fetch'))) {
          console.log('🔄 CORS/Network error detected, trying alternative gateways...');
          
          const alternativeGateways = [
            'https://ipfs.io/ipfs/',
            'https://gateway.pinata.cloud/ipfs/',
            'https://cloudflare-ipfs.com/ipfs/',
            'https://dweb.link/ipfs/'
          ];
          
          for (const gateway of alternativeGateways) {
            try {
              console.log(`🔄 Trying alternative gateway: ${gateway}`);
              const altResponse = await fetch(`${gateway}${hash}`, {
                method: 'GET',
                mode: 'cors'
              });
              
              if (altResponse.ok) {
                const data = await altResponse.json();
                console.log(`✅ Alternative gateway fetch successful: ${gateway}`);
                return data;
              }
            } catch (altError) {
              console.warn(`⚠️ Alternative gateway failed: ${gateway}`, altError);
            }
          }
        }
        
        if (attempt < maxRetries) {
          const delay = Math.pow(2, attempt) * 1000; // Exponential backoff
          console.log(`⏳ Waiting ${delay}ms before retry...`);
          await new Promise(resolve => setTimeout(resolve, delay));
        }
      }
    }
    
    throw new Error(`Lighthouse fetch failed after ${maxRetries} attempts. Last error: ${lastError?.message || lastError}`);
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

  /**
   * Create test sessions for development (with different timings)
   */
  async createTestSessions(): Promise<void> {
    const now = new Date();
    
    const testSessions = [
      {
        title: "Live Demo Session - Blockchain Basics",
        description: "Currently running session about blockchain fundamentals",
        speaker: "John Developer",
        speakerAddress: "0x1234567890123456789012345678901234567890",
        speakerAvatar: "https://api.dicebear.com/7.x/avataaars/svg?seed=john",
        startTime: new Date(now.getTime() - 10 * 60 * 1000).toISOString(), // Started 10 minutes ago
        duration: 60, // 1 hour session
        category: "Technology",
        topics: ["blockchain", "basics", "fundamentals"],
        entryFee: 0.02,
        requirements: "Basic understanding of technology",
        isPrivate: false,
        recordingEnabled: true,
        maxParticipants: 100
      },
      {
        title: "Upcoming Session - DeFi Strategies",
        description: "Advanced DeFi strategies starting in 30 minutes",
        speaker: "Sarah Crypto",
        speakerAddress: "0x2345678901234567890123456789012345678901",
        speakerAvatar: "https://api.dicebear.com/7.x/avataaars/svg?seed=sarah",
        startTime: new Date(now.getTime() + 30 * 60 * 1000).toISOString(), // Starts in 30 minutes
        duration: 90,
        category: "Finance",
        topics: ["defi", "strategies", "yield"],
        entryFee: 0.05,
        requirements: "Understanding of DeFi basics",
        isPrivate: false,
        recordingEnabled: true,
        maxParticipants: 50
      },
      {
        title: "Past Session - NFT Marketplace Tutorial",
        description: "Completed session about building NFT marketplaces",
        speaker: "Alex Artist",
        speakerAddress: "0x3456789012345678901234567890123456789012",
        speakerAvatar: "https://api.dicebear.com/7.x/avataaars/svg?seed=alex",
        startTime: new Date(now.getTime() - 2 * 60 * 60 * 1000).toISOString(), // Started 2 hours ago
        duration: 90, // Ended 30 minutes ago
        category: "Arts",
        topics: ["nft", "marketplace", "tutorial"],
        entryFee: 0.03,
        requirements: "Basic programming knowledge",
        isPrivate: false,
        recordingEnabled: true,
        maxParticipants: 75
      }
    ];

    console.log('🧪 Creating test sessions...');
    for (const sessionData of testSessions) {
      try {
        await this.createSpeakerSession(sessionData as SpeakerSession);
        console.log(`✅ Created test session: ${sessionData.title}`);
      } catch (error) {
        console.error(`❌ Failed to create test session: ${sessionData.title}`, error);
      }
    }
    console.log('🎉 Test sessions created successfully!');
  }

  /**
   * Initialize with test data if no sessions exist
   */
  async initializeWithTestData(): Promise<void> {
    try {
      const existingSessions = await this.getAllSessions();
      
      if (existingSessions.length === 0) {
        console.log('🚀 No sessions found, initializing with test data...');
        await this.createTestSessions();
      } else {
        console.log(`📊 Found ${existingSessions.length} existing sessions, skipping test data creation`);
      }
    } catch (error) {
      console.error('❌ Error initializing test data:', error);
    }
  }

  /**
   * Clear all sessions (for development/testing)
   */
  async clearAllSessions(): Promise<void> {
    try {
      console.log('🗑️ Clearing all sessions...');
      
      const sessionsIndex = this.getSessionsIndex();
      
      // Remove all session data
      for (const sessionId of sessionsIndex) {
        localStorage.removeItem(`talkstake-session-${sessionId}`);
        localStorage.removeItem(`talkstake-session-hash-${sessionId}`);
      }
      
      // Clear the sessions index
      localStorage.removeItem('talkstake-sessions-index');
      
      console.log('✅ All sessions cleared');
    } catch (error) {
      console.error('❌ Error clearing sessions:', error);
    }
  }

  /**
   * Ensure session has all required fields and normalize data structure
   */
  private ensureSessionHasRatingFields(session: unknown): SpeakerSession {
    const defaults = this.getDefaultRatingValues();
    
    // Normalize and validate session data
    const normalizedSession: SpeakerSession = {
      // Required fields with validation
      id: session.id || `session-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      title: session.title || 'Untitled Session',
      description: session.description || 'No description provided',
      speaker: session.speaker || 'Anonymous User',
      speakerAddress: session.speakerAddress || '',
      speakerAvatar: session.speakerAvatar || `https://api.dicebear.com/7.x/identicon/svg?seed=${session.speakerAddress || 'default'}`,
      category: session.category || 'General',
      topics: Array.isArray(session.topics) ? session.topics : [],
      startTime: session.startTime || new Date().toISOString(),
      endTime: session.endTime || null,
      duration: typeof session.duration === 'number' ? session.duration : 60,
      status: session.status || 'scheduled',
      isLive: Boolean(session.isLive),
      maxParticipants: typeof session.maxParticipants === 'number' ? session.maxParticipants : 50,
      participants: Array.isArray(session.participants) ? session.participants : [],
      viewers: typeof session.viewers === 'number' ? session.viewers : 0,
      likes: typeof session.likes === 'number' ? session.likes : 0,
      comments: typeof session.comments === 'number' ? session.comments : 0,
      totalStaked: typeof session.totalStaked === 'number' ? session.totalStaked : 0,
      entryFee: typeof session.entryFee === 'number' ? session.entryFee : 0,
      requirements: session.requirements || '',
      isPrivate: Boolean(session.isPrivate),
      recordingEnabled: Boolean(session.recordingEnabled),
      createdAt: session.createdAt || new Date().toISOString(),
      updatedAt: session.updatedAt || new Date().toISOString(),
      
      // Rating fields with defaults
      averageRating: typeof session.averageRating === 'number' ? session.averageRating : defaults.averageRating,
      totalRatings: typeof session.totalRatings === 'number' ? session.totalRatings : defaults.totalRatings,
      speakerRating: typeof session.speakerRating === 'number' ? session.speakerRating : defaults.speakerRating,
      engagementScore: typeof session.engagementScore === 'number' ? session.engagementScore : defaults.engagementScore,
      reviews: Array.isArray(session.reviews) ? session.reviews : defaults.reviews,
      completionRate: typeof session.completionRate === 'number' ? session.completionRate : defaults.completionRate,
      recommendationScore: typeof session.recommendationScore === 'number' ? session.recommendationScore : defaults.recommendationScore,
      
      // Optional fields
      filecoinHash: session.filecoinHash || null
    };

    // Validate and fix date formats
    try {
      // Handle the specific format "2025-09-30T01:21" by adding seconds if missing
      let startTimeStr = normalizedSession.startTime;
      if (typeof startTimeStr === 'string' && startTimeStr.match(/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}$/)) {
        startTimeStr = startTimeStr + ':00.000Z';
        console.log(`🔧 Fixed startTime format: ${session.startTime} → ${startTimeStr}`);
      }
      normalizedSession.startTime = new Date(startTimeStr).toISOString();
    } catch (error) {
      console.warn('⚠️ Invalid startTime format, using current time:', session.startTime);
      normalizedSession.startTime = new Date().toISOString();
    }

    try {
      normalizedSession.createdAt = new Date(normalizedSession.createdAt).toISOString();
    } catch (error) {
      console.warn('⚠️ Invalid createdAt format, using current time:', session.createdAt);
      normalizedSession.createdAt = new Date().toISOString();
    }

    try {
      normalizedSession.updatedAt = new Date(normalizedSession.updatedAt).toISOString();
    } catch (error) {
      console.warn('⚠️ Invalid updatedAt format, using current time:', session.updatedAt);
      normalizedSession.updatedAt = new Date().toISOString();
    }

    // Calculate endTime if not provided
    if (!normalizedSession.endTime) {
      const startTime = new Date(normalizedSession.startTime);
      const endTime = new Date(startTime.getTime() + (normalizedSession.duration * 60 * 1000));
      normalizedSession.endTime = endTime.toISOString();
    }

    // Update status based on current time with grace period
    const now = new Date();
    const startTime = new Date(normalizedSession.startTime);
    const endTime = new Date(normalizedSession.endTime);
    
    // Allow a 5-minute grace period for sessions to be considered live
    const gracePeriod = 5 * 60 * 1000; // 5 minutes in milliseconds
    const adjustedStartTime = new Date(startTime.getTime() - gracePeriod);

    if (now >= adjustedStartTime && now <= endTime) {
      normalizedSession.status = 'live';
      normalizedSession.isLive = true;
    } else if (now > endTime) {
      normalizedSession.status = 'completed';
      normalizedSession.isLive = false;
    } else {
      normalizedSession.status = 'scheduled';
      normalizedSession.isLive = false;
    }

    console.log(`✅ Normalized session: ${normalizedSession.title} (${normalizedSession.status})`);
    return normalizedSession;
  }
}

// Export singleton instance
export const filecoinStorage = new FilecoinStorage();