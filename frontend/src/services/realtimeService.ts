'use client';

export interface Message {
  id: string;
  userId: string;
  username: string;
  avatar: string;
  content: string;
  timestamp: Date;
  type: 'text' | 'system' | 'speak_request';
}

export interface Participant {
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

class SimpleRealtimeService {
  private callbacks: {
    onMessage?: (message: Message) => void;
    onParticipantUpdate?: (participant: Participant) => void;
    onParticipantJoin?: (participant: Participant) => void;
    onParticipantLeave?: (participantId: string) => void;
    onSpeakRequest?: (participantId: string, requested: boolean) => void;
    onConnectionStatus?: (connected: boolean) => void;
  } = {};

  connect(sessionId: string, userProfile: { address: string; username: string; photoUrl: string }) {
    console.log(`🔌 Connecting to session room: ${sessionId}`);
    
    // Simulate connection
    setTimeout(() => {
      this.callbacks.onConnectionStatus?.(true);
      console.log('✅ Connected to session room');
    }, 1000);
  }

  disconnect() {
    this.callbacks.onConnectionStatus?.(false);
    console.log('🔌 Disconnected from session room');
  }

  sendMessage(content: string, userProfile: { address: string; username: string; photoUrl: string }) {
    const message: Message = {
      id: `msg-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      userId: userProfile.address,
      username: userProfile.username,
      avatar: userProfile.photoUrl,
      content,
      timestamp: new Date(),
      type: 'text'
    };

    // Store in localStorage
    const localKey = `chat_messages_${userProfile.address}`;
    const localMessages = JSON.parse(localStorage.getItem(localKey) || '[]');
    localMessages.push({
      ...message,
      timestamp: message.timestamp.toISOString()
    });
    localStorage.setItem(localKey, JSON.stringify(localMessages));

    console.log('📤 Message sent:', content);
  }

  requestSpeak(userProfile: { address: string; username: string; photoUrl: string }) {
    console.log('✋ Speak request sent');
  }

  cancelSpeakRequest(userProfile: { address: string; username: string; photoUrl: string }) {
    console.log('❌ Speak request canceled');
  }

  updateParticipantStatus(updates: Partial<Participant>, userProfile: { address: string; username: string; photoUrl: string }) {
    console.log('👤 Participant status updated:', updates);
  }

  // Event listeners
  onMessage(callback: (message: Message) => void) {
    this.callbacks.onMessage = callback;
  }

  onParticipantUpdate(callback: (participant: Participant) => void) {
    this.callbacks.onParticipantUpdate = callback;
  }

  onParticipantJoin(callback: (participant: Participant) => void) {
    this.callbacks.onParticipantJoin = callback;
  }

  onParticipantLeave(callback: (participantId: string) => void) {
    this.callbacks.onParticipantLeave = callback;
  }

  onSpeakRequest(callback: (participantId: string, requested: boolean) => void) {
    this.callbacks.onSpeakRequest = callback;
  }

  onConnectionStatus(callback: (connected: boolean) => void) {
    this.callbacks.onConnectionStatus = callback;
  }
}

// Export singleton instance
export const realtimeService = new SimpleRealtimeService();