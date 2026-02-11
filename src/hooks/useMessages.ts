import { useState, useCallback } from 'react';
import type { Message } from '@/types/chat';
import { MOCK_MESSAGES } from '@/data/mockData';

export function useMessages(conversationId: string, currentUserId: number) {
  const [allMessages, setAllMessages] = useState<Record<string, Message[]>>(MOCK_MESSAGES);

  const messages = allMessages[conversationId] ?? [];

  const sendMessage = useCallback(async (payload: any) => {
    const newMsg: Message = {
      id: `msg_${Date.now()}`,
      chatId: conversationId,
      senderId: String(currentUserId),
      senderName: 'Eljas',
      text: payload.encryptedContent || 'Message',
      time: new Date().toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', hour12: false }),
      date: new Date().toISOString().split('T')[0],
      isOwn: true,
      read: true,
      type: 'message',
    };
    setAllMessages(prev => ({
      ...prev,
      [conversationId]: [...(prev[conversationId] || []), newMsg],
    }));
    return newMsg as any;
  }, [conversationId, currentUserId]);

  const pinMessage = useCallback(({ messageId, pin }: { messageId: string; pin: boolean }) => {
    setAllMessages(prev => ({
      ...prev,
      [conversationId]: (prev[conversationId] || []).map(m =>
        m.id === messageId ? { ...m, pinned: pin } : m
      ),
    }));
  }, [conversationId]);

  const editMessage = useCallback(async (payload: any) => {
    setAllMessages(prev => ({
      ...prev,
      [conversationId]: (prev[conversationId] || []).map(m =>
        m.id === payload.messageId ? { ...m, text: payload.encryptedContent, edited: true } : m
      ),
    }));
  }, [conversationId]);

  const deleteMessage = useCallback(({ messageId }: { messageId: string; forMe: boolean }) => {
    setAllMessages(prev => ({
      ...prev,
      [conversationId]: (prev[conversationId] || []).filter(m => m.id !== messageId),
    }));
  }, [conversationId]);

  const addReaction = useCallback(({ messageId, emoji }: { messageId: string; emoji: string }) => {
    setAllMessages(prev => ({
      ...prev,
      [conversationId]: (prev[conversationId] || []).map(m => {
        if (m.id !== messageId) return m;
        const reactions = [...(m.reactions || [])];
        const existing = reactions.find(r => r.emoji === emoji);
        if (existing) {
          existing.users = [...existing.users, String(currentUserId)];
        } else {
          reactions.push({ emoji, users: [String(currentUserId)] });
        }
        return { ...m, reactions };
      }),
    }));
  }, [conversationId, currentUserId]);

  const removeReaction = useCallback(({ messageId, emoji }: { messageId: string; emoji: string }) => {
    setAllMessages(prev => ({
      ...prev,
      [conversationId]: (prev[conversationId] || []).map(m => {
        if (m.id !== messageId) return m;
        const reactions = (m.reactions || []).map(r => {
          if (r.emoji !== emoji) return r;
          return { ...r, users: r.users.filter(u => u !== String(currentUserId)) };
        }).filter(r => r.users.length > 0);
        return { ...m, reactions };
      }),
    }));
  }, [conversationId, currentUserId]);

  const sendTyping = useCallback(async () => {}, []);

  return {
    messages,
    isLoading: false,
    error: null,
    refetch: () => {},
    sendMessage,
    isSending: false,
    pinMessage,
    editMessage,
    deleteMessage,
    addReaction,
    removeReaction,
    sendTyping,
  };
}
