import { useCallback } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import api from '@/lib/api';
import type { Chat } from '@/types/chat';

// API response types (subset — expand as needed)
interface ApiConversation {
  id: number;
  type: 'dm' | 'group' | 'channel';
  name: string | null;
  description: string | null;
  avatarUrl: string | null;
  isPublic: boolean;
  memberCount: number;
  unreadCount: number;
  isPinned: boolean;
  isMuted: boolean;
  muteUntil: string | null;
  isArchived: boolean;
  lastMessage: {
    encryptedContent: string;
    senderId: number;
    senderName: string;
    createdAt: string;
  } | null;
  createdAt: string;
  updatedAt: string;
  // DM-specific
  otherUser?: {
    id: number;
    username: string;
    displayName: string;
    avatarUrl: string | null;
    isOnline: boolean;
    lastSeen: string | null;
    walletAddress: string;
    bio: string | null;
  };
  // Group/Channel
  role?: 'owner' | 'admin' | 'member';
  slowMode?: number;
  commentsEnabled?: boolean;
  reactionsEnabled?: boolean;
  signMessages?: boolean;
}

/**
 * Map an API conversation to our existing Chat type.
 * This bridge lets us keep the current UI unchanged while using real data.
 */
function mapConversationToChat(conv: ApiConversation): Chat {
  const isDM = conv.type === 'dm';
  const chatType = isDM ? 'personal' : conv.type === 'group' ? 'group' : 'channel';

  // Generate avatar initials from name
  const name = isDM
    ? conv.otherUser?.displayName || conv.otherUser?.username || 'Unknown'
    : conv.name || 'Unnamed';
  const avatar = name.split(' ').map(w => w[0]).join('').slice(0, 2).toUpperCase();

  // Deterministic color from conversation id
  const hue = (conv.id * 137) % 360;
  const avatarColor = `${hue} 65% 55%`;

  return {
    id: String(conv.id),
    name,
    type: chatType,
    avatar: conv.avatarUrl || avatar,
    avatarColor,
    online: isDM ? conv.otherUser?.isOnline : undefined,
    lastSeen: isDM ? conv.otherUser?.lastSeen || undefined : undefined,
    muted: conv.isMuted,
    pinned: conv.isPinned,
    unread: conv.unreadCount,
    lastMessage: conv.lastMessage ? '[Encrypted]' : '',
    lastMessageSender: conv.lastMessage?.senderName,
    lastTime: conv.lastMessage ? formatTime(conv.lastMessage.createdAt) : '',
    isPublic: conv.isPublic,
    description: conv.description || undefined,
    subscriberCount: chatType === 'channel' ? conv.memberCount : undefined,
    memberCount: chatType === 'group' ? conv.memberCount : undefined,
    archived: conv.isArchived,
    role: conv.role,
    commentsEnabled: conv.commentsEnabled,
    reactionsEnabled: conv.reactionsEnabled,
    signMessages: conv.signMessages,
    slowMode: conv.slowMode,
    // DM-specific fields
    phone: undefined,
    username: isDM ? (conv.otherUser?.username ? `@${conv.otherUser.username}` : undefined) : undefined,
    bio: isDM ? conv.otherUser?.bio || undefined : conv.description || undefined,
  };
}

function formatTime(isoString: string): string {
  try {
    const d = new Date(isoString);
    const now = new Date();
    const diffMs = now.getTime() - d.getTime();
    const diffDays = Math.floor(diffMs / 86400000);

    if (diffDays === 0) {
      return d.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', hour12: false });
    }
    if (diffDays === 1) return 'Yesterday';
    if (diffDays < 7) return d.toLocaleDateString('en-US', { weekday: 'short' });
    return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
  } catch {
    return '';
  }
}

export function useConversations() {
  const queryClient = useQueryClient();

  const query = useQuery({
    queryKey: ['conversations'],
    queryFn: async () => {
      const data = await api.get<ApiConversation[]>('/messages/conversations');
      return data.map(mapConversationToChat);
    },
    staleTime: 30_000,
  });

  // ── Mutations ──

  const pinMutation = useMutation({
    mutationFn: async ({ id, pinned }: { id: string; pinned: boolean }) => {
      if (pinned) {
        await api.put(`/messages/conversations/${id}/pin`);
      } else {
        await api.delete(`/messages/conversations/${id}/pin`);
      }
    },
    onMutate: async ({ id, pinned }) => {
      await queryClient.cancelQueries({ queryKey: ['conversations'] });
      const prev = queryClient.getQueryData<Chat[]>(['conversations']);
      queryClient.setQueryData<Chat[]>(['conversations'], old =>
        old?.map(c => c.id === id ? { ...c, pinned } : c)
      );
      return { prev };
    },
    onError: (_err, _vars, ctx) => {
      if (ctx?.prev) queryClient.setQueryData(['conversations'], ctx.prev);
    },
  });

  const muteMutation = useMutation({
    mutationFn: async ({ id, muteUntil }: { id: string; muteUntil?: number }) => {
      await api.put(`/messages/conversations/${id}/mute`, { muteUntil });
    },
    onMutate: async ({ id }) => {
      await queryClient.cancelQueries({ queryKey: ['conversations'] });
      const prev = queryClient.getQueryData<Chat[]>(['conversations']);
      queryClient.setQueryData<Chat[]>(['conversations'], old =>
        old?.map(c => c.id === id ? { ...c, muted: !c.muted } : c)
      );
      return { prev };
    },
    onError: (_err, _vars, ctx) => {
      if (ctx?.prev) queryClient.setQueryData(['conversations'], ctx.prev);
    },
  });

  const archiveMutation = useMutation({
    mutationFn: async ({ id, archived }: { id: string; archived: boolean }) => {
      if (archived) {
        await api.put(`/messages/conversations/${id}/archive`);
      } else {
        await api.put(`/messages/conversations/${id}/unarchive`);
      }
    },
    onMutate: async ({ id, archived }) => {
      await queryClient.cancelQueries({ queryKey: ['conversations'] });
      const prev = queryClient.getQueryData<Chat[]>(['conversations']);
      queryClient.setQueryData<Chat[]>(['conversations'], old =>
        old?.map(c => c.id === id ? { ...c, archived } : c)
      );
      return { prev };
    },
    onError: (_err, _vars, ctx) => {
      if (ctx?.prev) queryClient.setQueryData(['conversations'], ctx.prev);
    },
  });

  const markReadMutation = useMutation({
    mutationFn: async (id: string) => {
      await api.post(`/messages/conversations/${id}/read`);
    },
    onMutate: async (id) => {
      await queryClient.cancelQueries({ queryKey: ['conversations'] });
      const prev = queryClient.getQueryData<Chat[]>(['conversations']);
      queryClient.setQueryData<Chat[]>(['conversations'], old =>
        old?.map(c => c.id === id ? { ...c, unread: 0 } : c)
      );
      return { prev };
    },
    onError: (_err, _vars, ctx) => {
      if (ctx?.prev) queryClient.setQueryData(['conversations'], ctx.prev);
    },
  });

  const leaveMutation = useMutation({
    mutationFn: async (id: string) => {
      await api.post(`/messages/conversations/${id}/leave`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['conversations'] });
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      await api.delete(`/messages/conversations/${id}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['conversations'] });
    },
  });

  const createGroupMutation = useMutation({
    mutationFn: async (data: { name: string; description?: string; memberIds: number[] }) => {
      return api.post<ApiConversation>('/messages/conversations/group', data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['conversations'] });
    },
  });

  const createChannelMutation = useMutation({
    mutationFn: async (data: { name: string; description?: string; isPublic: boolean }) => {
      return api.post<ApiConversation>('/messages/conversations/channel', data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['conversations'] });
    },
  });

  const createDMMutation = useMutation({
    mutationFn: async (data: {
      recipientId: number;
      encryptedContent?: string;
      nonce?: string;
      senderKeyVersion?: number;
      signalMessageType?: 2 | 3;
    }) => {
      return api.post<ApiConversation>('/messages/conversations/e2e', data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['conversations'] });
    },
  });

  return {
    conversations: query.data ?? [],
    isLoading: query.isLoading,
    error: query.error,
    refetch: query.refetch,
    // Mutations
    pinConversation: pinMutation.mutate,
    muteConversation: muteMutation.mutate,
    archiveConversation: archiveMutation.mutate,
    markRead: markReadMutation.mutate,
    leaveConversation: leaveMutation.mutate,
    deleteConversation: deleteMutation.mutate,
    createGroup: createGroupMutation.mutateAsync,
    createChannel: createChannelMutation.mutateAsync,
    createDM: createDMMutation.mutateAsync,
  };
}
