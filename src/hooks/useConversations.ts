import { useState, useCallback } from 'react';
import type { Chat } from '@/types/chat';
import { MOCK_CHATS } from '@/data/mockData';

export function useConversations() {
  const [conversations, setConversations] = useState<Chat[]>(MOCK_CHATS);

  const pinConversation = useCallback(({ id, pinned }: { id: string; pinned: boolean }) => {
    setConversations(prev => prev.map(c => c.id === id ? { ...c, pinned } : c));
  }, []);

  const muteConversation = useCallback(({ id }: { id: string; muteUntil?: number }) => {
    setConversations(prev => prev.map(c => c.id === id ? { ...c, muted: !c.muted } : c));
  }, []);

  const archiveConversation = useCallback(({ id, archived }: { id: string; archived: boolean }) => {
    setConversations(prev => prev.map(c => c.id === id ? { ...c, archived } : c));
  }, []);

  const markRead = useCallback((id: string) => {
    setConversations(prev => prev.map(c => c.id === id ? { ...c, unread: 0 } : c));
  }, []);

  const leaveConversation = useCallback((id: string) => {
    setConversations(prev => prev.filter(c => c.id !== id));
  }, []);

  const deleteConversation = useCallback((id: string) => {
    setConversations(prev => prev.filter(c => c.id !== id));
  }, []);

  const createGroup = useCallback(async (data: { name: string; description?: string; memberIds: number[] }) => {
    const newChat: Chat = {
      id: `g_${Date.now()}`,
      name: data.name,
      type: 'group',
      avatar: data.name.split(' ').map(w => w[0]).join('').slice(0, 2).toUpperCase(),
      avatarColor: `${Math.floor(Math.random() * 360)} 65% 55%`,
      muted: false,
      pinned: false,
      unread: 0,
      lastMessage: 'Group created',
      lastTime: 'now',
      memberCount: data.memberIds.length + 1,
      role: 'owner',
      description: data.description,
    };
    setConversations(prev => [newChat, ...prev]);
    return newChat as any;
  }, []);

  const createChannel = useCallback(async (data: { name: string; description?: string; isPublic: boolean }) => {
    const newChat: Chat = {
      id: `ch_${Date.now()}`,
      name: data.name,
      type: 'channel',
      avatar: data.name.split(' ').map(w => w[0]).join('').slice(0, 2).toUpperCase(),
      avatarColor: `${Math.floor(Math.random() * 360)} 65% 55%`,
      muted: false,
      pinned: false,
      unread: 0,
      lastMessage: 'Channel created',
      lastTime: 'now',
      isPublic: data.isPublic,
      subscriberCount: 1,
      role: 'owner',
      description: data.description,
      commentsEnabled: true,
      reactionsEnabled: true,
    };
    setConversations(prev => [newChat, ...prev]);
    return newChat as any;
  }, []);

  const createDM = useCallback(async (_data: any) => {
    return {} as any;
  }, []);

  return {
    conversations,
    isLoading: false,
    error: null,
    refetch: () => {},
    pinConversation,
    muteConversation,
    archiveConversation,
    markRead,
    leaveConversation,
    deleteConversation,
    createGroup,
    createChannel,
    createDM,
  };
}
