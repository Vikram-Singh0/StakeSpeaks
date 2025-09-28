'use client';

class SimpleAudioService {
  private localStream: MediaStream | null = null;
  private isInitialized = false;

  async initializeAudio(): Promise<boolean> {
    try {
      // Request microphone access
      this.localStream = await navigator.mediaDevices.getUserMedia({
        audio: {
          echoCancellation: true,
          noiseSuppression: true,
          autoGainControl: true,
        },
        video: false
      });

      this.isInitialized = true;
      console.log('🎤 Audio service initialized');
      return true;
    } catch (error) {
      console.error('❌ Error initializing audio:', error);
      return false;
    }
  }

  async getAudioStream(): Promise<MediaStream | null> {
    if (!this.isInitialized) {
      const success = await this.initializeAudio();
      if (!success) return null;
    }
    return this.localStream;
  }

  muteAudio(): void {
    if (this.localStream) {
      this.localStream.getAudioTracks().forEach(track => {
        track.enabled = false;
      });
      console.log('🔇 Audio muted');
    }
  }

  unmuteAudio(): void {
    if (this.localStream) {
      this.localStream.getAudioTracks().forEach(track => {
        track.enabled = true;
      });
      console.log('🔊 Audio unmuted');
    }
  }

  isAudioMuted(): boolean {
    if (!this.localStream) return true;
    return this.localStream.getAudioTracks().some(track => !track.enabled);
  }

  async stopAudio(): Promise<void> {
    if (this.localStream) {
      this.localStream.getTracks().forEach(track => track.stop());
      this.localStream = null;
    }

    this.isInitialized = false;
    console.log('🔇 Audio service stopped');
  }
}

// Export singleton instance
export const audioService = new SimpleAudioService();