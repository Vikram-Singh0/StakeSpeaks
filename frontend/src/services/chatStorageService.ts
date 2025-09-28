'use client';

import { filecoinStorage } from './filecoinStorage';

export interface ChatMessage {
  id: string;
  sessionId: string;
  userId: string;
  username: string;
  avatar: string;
  content: string;
  timestamp: Date;
  type: 'text' | 'system' | 'speak_request';
  filecoinHash?: string;
}

export interface SessionParticipant {
  id: string;
  sessionId: string;
  userId: string;
  username: string;
  avatar: string;
  joinedAt: Date;
  isActive: boolean;
  isMuted: boolean;
  isVideoOn: boolean;
  isSpeaking: boolean;
  speakRequested: boolean;
  role: 'speaker' | 'participant' | 'moderator';
  filecoinHash?: string;
}

class ChatStorageService {
  private messages: Map<string, ChatMessage[]> = new Map();
  private participants: Map<string, SessionParticipant[]> = new Map();

  // Store chat message
  async storeMessage(message: Omit<ChatMessage, 'id' | 'filecoinHash'>): Promise<ChatMessage> {
    try {
      const chatMessage: ChatMessage = {
        ...message,
        id: `msg-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
        filecoinHash: undefined
      };

      // Store locally first for immediate UI update
      const sessionMessages = this.messages.get(message.sessionId) || [];
      sessionMessages.push(chatMessage);
      this.messages.set(message.sessionId, sessionMessages);

      // Store in localStorage for offline access
      const localKey = `chat_messages_${message.sessionId}`;
      const localMessages = JSON.parse(localStorage.getItem(localKey) || '[]');
      localMessages.push({
        ...chatMessage,
        timestamp: chatMessage.timestamp.toISOString()
      });
      localStorage.setItem(localKey, JSON.stringify(localMessages));

      // Store in Filecoin (async, don't wait) - TODO: Implement chat message storage
      // filecoinStorage.storeData({
      //   type: 'chat_message',
      //   sessionId: message.sessionId,
      //   message: {
      //     ...chatMessage,
      //     timestamp: chatMessage.timestamp.toISOString()
      //   }
      // }).then(filecoinHash => {
      //   chatMessage.filecoinHash = filecoinHash;
      //   console.log('💾 Chat message stored to Filecoin:', chatMessage.id);
      // }).catch(error => {
      //   console.error('❌ Error storing to Filecoin:', error);
      // });

      console.log('💾 Chat message stored locally:', chatMessage.id);
      return chatMessage;
    } catch (error) {
      console.error('❌ Error storing chat message:', error);
      throw error;
    }
  }

  // Get chat messages for a session
  async getSessionMessages(sessionId: string): Promise<ChatMessage[]> {
    try {
      // Try to get from local cache first
      let messages = this.messages.get(sessionId) || [];

      // If no local messages, try to load from localStorage
      if (messages.length === 0) {
        const localKey = `chat_messages_${sessionId}`;
        const localMessages = JSON.parse(localStorage.getItem(localKey) || '[]');
        if (localMessages.length > 0) {
          messages = localMessages.map((item: { id: string; userId: string; username: string; avatar: string; content: string; timestamp: string; type: string }) => ({
            ...item,
            timestamp: new Date(item.timestamp)
          }));
          this.messages.set(sessionId, messages);
          console.log('📱 Loaded messages from localStorage:', messages.length);
        }
      }

      // If still no messages, try to load from Filecoin - TODO: Implement chat message retrieval
      // if (messages.length === 0) {
      //   try {
      //     const storedData = await filecoinStorage.getDataByType('chat_message', sessionId);
      //     if (storedData && Array.isArray(storedData)) {
      //       messages = storedData.map((item: { message: { id: string; userId: string; username: string; avatar: string; content: string; timestamp: string; type: string } }) => ({
      //         ...item.message,
      //         timestamp: new Date(item.message.timestamp)
      //       }));
      //       this.messages.set(sessionId, messages);
      //       
      //       // Also store in localStorage for future use
      //       const localKey = `chat_messages_${sessionId}`;
      //       localStorage.setItem(localKey, JSON.stringify(messages.map(msg => ({
      //         ...msg,
      //         timestamp: msg.timestamp.toISOString()
      //       }))));
      //       
      //       console.log('☁️ Loaded messages from Filecoin:', messages.length);
      //     }
      //   } catch (error) {
      //     console.log('📝 No stored messages found for session:', sessionId);
      //   }
      // }

      return messages.sort((a, b) => a.timestamp.getTime() - b.timestamp.getTime());
    } catch (error) {
      console.error('❌ Error getting session messages:', error);
      return [];
    }
  }

  // Add participant to session
  async addParticipant(participant: Omit<SessionParticipant, 'id' | 'filecoinHash'>): Promise<SessionParticipant> {
    try {
      const sessionParticipant: SessionParticipant = {
        ...participant,
        id: `participant-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
        filecoinHash: undefined
      };

      // Store in Filecoin - TODO: Implement participant storage
      // const filecoinHash = await filecoinStorage.storeData({
      //   type: 'session_participant',
      //   sessionId: participant.sessionId,
      //   participant: sessionParticipant
      // });

      // sessionParticipant.filecoinHash = filecoinHash;

      // Store locally
      const sessionParticipants = this.participants.get(participant.sessionId) || [];
      sessionParticipants.push(sessionParticipant);
      this.participants.set(participant.sessionId, sessionParticipants);

      console.log('👤 Participant added:', sessionParticipant.id);
      return sessionParticipant;
    } catch (error) {
      console.error('❌ Error adding participant:', error);
      throw error;
    }
  }

  // Update participant status
  async updateParticipant(sessionId: string, userId: string, updates: Partial<SessionParticipant>): Promise<SessionParticipant | null> {
    try {
      const sessionParticipants = this.participants.get(sessionId) || [];
      const participantIndex = sessionParticipants.findIndex(p => p.userId === userId);
      
      if (participantIndex === -1) {
        console.log('👤 Participant not found:', userId);
        return null;
      }

      const updatedParticipant = {
        ...sessionParticipants[participantIndex],
        ...updates
      };

      // Store updated participant in Filecoin - TODO: Implement participant update storage
      // const filecoinHash = await filecoinStorage.storeData({
      //   type: 'session_participant_update',
      //   sessionId,
      //   participantId: updatedParticipant.id,
      //   updates
      // });

      // updatedParticipant.filecoinHash = filecoinHash;

      // Update local cache
      sessionParticipants[participantIndex] = updatedParticipant;
      this.participants.set(sessionId, sessionParticipants);

      console.log('👤 Participant updated:', updatedParticipant.id);
      return updatedParticipant;
    } catch (error) {
      console.error('❌ Error updating participant:', error);
      throw error;
    }
  }

  // Get session participants
  async getSessionParticipants(sessionId: string): Promise<SessionParticipant[]> {
    try {
      // Try to get from local cache first
      const participants = this.participants.get(sessionId) || [];

      // If no local participants, try to load from Filecoin - TODO: Implement participant retrieval
      // if (participants.length === 0) {
      //   try {
      //     const storedData = await filecoinStorage.getDataByType('session_participant', sessionId);
      //     if (storedData && Array.isArray(storedData)) {
      //       participants = storedData.map((item: { participant: { id: string; sessionId: string; userId: string; username: string; avatar: string; joinedAt: string; isActive: boolean; isMuted: boolean; isVideoOn: boolean; isSpeaking: boolean; speakRequested: boolean; role: string } }) => ({
      //         ...item.participant,
      //         joinedAt: new Date(item.participant.joinedAt)
      //       }));
      //       this.participants.set(sessionId, participants);
      //     }
      //   } catch (error) {
      //     console.log('📝 No stored participants found for session:', sessionId);
      //   }
      // }

      return participants.filter(p => p.isActive);
    } catch (error) {
      console.error('❌ Error getting session participants:', error);
      return [];
    }
  }

  // Remove participant from session
  async removeParticipant(sessionId: string, userId: string): Promise<boolean> {
    try {
      const sessionParticipants = this.participants.get(sessionId) || [];
      const participantIndex = sessionParticipants.findIndex(p => p.userId === userId);
      
      if (participantIndex === -1) {
        console.log('👤 Participant not found for removal:', userId);
        return false;
      }

      // Mark as inactive instead of removing
      const participant = sessionParticipants[participantIndex];
      participant.isActive = false;

      // Store update in Filecoin - TODO: Implement participant leave storage
      // await filecoinStorage.storeData({
      //   type: 'session_participant_leave',
      //   sessionId,
      //   participantId: participant.id,
      //   userId
      // });

      // Update local cache
      sessionParticipants[participantIndex] = participant;
      this.participants.set(sessionId, sessionParticipants);

      console.log('👤 Participant removed:', participant.id);
      return true;
    } catch (error) {
      console.error('❌ Error removing participant:', error);
      return false;
    }
  }

  // Clear session data (when session ends)
  async clearSessionData(sessionId: string): Promise<void> {
    try {
      this.messages.delete(sessionId);
      this.participants.delete(sessionId);
      
      // Store session end event in Filecoin
      await filecoinStorage.storeData({
        type: 'session_end',
        sessionId,
        endedAt: new Date()
      });

      console.log('🧹 Session data cleared:', sessionId);
    } catch (error) {
      console.error('❌ Error clearing session data:', error);
    }
  }
}

// Export singleton instance
export const chatStorageService = new ChatStorageService();
