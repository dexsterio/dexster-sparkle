import { useCallback } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import api from '@/lib/api';
import type { Chat } from '@/types/chat';
import { MOCK_CHATS } from '@/data/mockData';

// ── API response shape ──
interface ApiConversation {
  id: number;
  type: 'dm' | 'group' | 'channel';
  name: string | null;
  description: string | null;
  avatarUrl: string | null;
  isPublic: boolean;
  memberCount: number;
  subscriberCount: number;
  createdAt: string;
  updatedAt: string;
  // Participant-level fields
  isPinned: boolean;
  isMuted: boolean;
  muteUntil: string | null;
  isArchived: boolean;
  isBlocked: boolean;
  unreadCount: number;
  role: 'owner' | 'admin' | 'member';
  // Derived
  lastMessage: string | null;
  lastMessageSender: string | null;
  lastMessageAt: string | null;
  // DM-specific
  otherUser?: {
    id: number;
    username: string;
    displayName: string;
    avatarUrl: string | null;
    isOnline: boolean;
    lastSeen: string | null;
    bio: string | null;
  };
  // Channel-specific
  commentsEnabled?: boolean;
  reactionsEnabled?: boolean;
  // Group-specific
  slowMode?: number;
  autoDeleteTimer?: number;
}

// ── Map API → local Chat type ──
function mapConversation(c: ApiConversation): Chat {
  const isDM = c.type === 'dm';
  const name = isDM ? (c.otherUser?.displayName || c.otherUser?.username || 'Unknown') : (c.name || 'Unnamed');
  const initials = name.split(' ').map(w => w[0]).join('').slice(0, 2).toUpperCase();
  const hue = (c.id * 137) % 360;

  return {
    id: String(c.id),
    name,
    type: c.type === 'dm' ? 'personal' : c.type,
    avatar: initials,
    avatarColor: `${hue} 65% 55%`,
    online: isDM ? c.otherUser?.isOnline : undefined,
    lastSeen: isDM ? (c.otherUser?.lastSeen ? `last seen ${formatRelativeTime(c.otherUser.lastSeen)}` : undefined) : undefined,
    muted: c.isMuted,
    pinned: c.isPinned,
    unread: c.unreadCount,
    lastMessage: c.lastMessage || '',
    lastMessageSender: c.lastMessageSender || undefined,
    lastTime: c.lastMessageAt ? formatTime(c.lastMessageAt) : '',
    username: isDM ? `@${c.otherUser?.username}` : undefined,
    bio: isDM ? c.otherUser?.bio || undefined : undefined,
    archived: c.isArchived,
    blocked: c.isBlocked,
    isPublic: c.isPublic,
    description: c.description || undefined,
    subscriberCount: c.subscriberCount || undefined,
    memberCount: c.memberCount || undefined,
    role: c.role,
    commentsEnabled: c.commentsEnabled,
    reactionsEnabled: c.reactionsEnabled,
    slowMode: c.slowMode,
    autoDeleteTimer: c.autoDeleteTimer,
  };
}

function formatTime(iso: string): string {
  const d = new Date(iso);
  const now = new Date();
  const diffMs = now.getTime() - d.getTime();
  const diffDays = Math.floor(diffMs / 86400000);

  if (diffDays === 0) return d.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', hour12: false });
  if (diffDays === 1) return 'Yesterday';
  if (diffDays < 7) return d.toLocaleDateString('en-US', { weekday: 'short' });
  return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
}

function formatRelativeTime(iso: string): string {
  const d = new Date(iso);
  const now = new Date();
  const diffMin = Math.floor((now.getTime() - d.getTime()) / 60000);
  if (diffMin < 1) return 'just now';
  if (diffMin < 60) return `${diffMin} min ago`;
  const diffH = Math.floor(diffMin / 60);
  if (diffH < 24) return `${diffH}h ago`;
  return `${Math.floor(diffH / 24)}d ago`;
}

export function useConversations() {
  const queryClient = useQueryClient();

  // ── Fetch conversations ──
  const query = useQuery({
    queryKey: ['conversations'],
    queryFn: async () => {
      try {
        const data = await api.get<ApiConversation[]>('/messages/conversations');
        return data.map(mapConversation);
      } catch (err) {
        console.warn('[useConversations] API failed, using mock data:', err);
        return MOCK_CHATS;
      }
    },
    staleTime: 30_000,
    refetchInterval: 60_000,
  });

  const conversations = query.data ?? MOCK_CHATS;

  // ── Pin ──
  const pinMutation = useMutation({
    mutationFn: ({ id, pinned }: { id: string; pinned: boolean }) =>
      api.put(`/messages/conversations/${id}/pin`, { pinned }),
    onMutate: async ({ id, pinned }) => {
      await queryClient.cancelQueries({ queryKey: ['conversations'] });
      queryClient.setQueryData<Chat[]>(['conversations'], old =>
        (old ?? []).map(c => c.id === id ? { ...c, pinned } : c)
      );
    },
    onSettled: () => queryClient.invalidateQueries({ queryKey: ['conversations'] }),
  });

  // ── Mute ──
  const muteMutation = useMutation({
    mutationFn: ({ id, muteUntil }: { id: string; muteUntil?: number }) =>
      api.put(`/messages/conversations/${id}/mute`, { muteUntil: muteUntil || null }),
    onMutate: async ({ id }) => {
      await queryClient.cancelQueries({ queryKey: ['conversations'] });
      queryClient.setQueryData<Chat[]>(['conversations'], old =>
        (old ?? []).map(c => c.id === id ? { ...c, muted: !c.muted } : c)
      );
    },
    onSettled: () => queryClient.invalidateQueries({ queryKey: ['conversations'] }),
  });

  // ── Archive ──
  const archiveMutation = useMutation({
    mutationFn: ({ id, archived }: { id: string; archived: boolean }) =>
      api.put(`/messages/conversations/${id}/archive`, { archived }),
    onMutate: async ({ id, archived }) => {
      await queryClient.cancelQueries({ queryKey: ['conversations'] });
      queryClient.setQueryData<Chat[]>(['conversations'], old =>
        (old ?? []).map(c => c.id === id ? { ...c, archived } : c)
      );
    },
    onSettled: () => queryClient.invalidateQueries({ queryKey: ['conversations'] }),
  });

  // ── Mark read ──
  const markReadMutation = useMutation({
    mutationFn: (id: string) =>
      api.post(`/messages/conversations/${id}/read`),
    onMutate: async (id) => {
      queryClient.setQueryData<Chat[]>(['conversations'], old =>
        (old ?? []).map(c => c.id === id ? { ...c, unread: 0, markedUnread: false } : c)
      );
    },
  });

  // ── Leave ──
  const leaveMutation = useMutation({
    mutationFn: (id: string) =>
      api.post(`/messages/conversations/${id}/leave`),
    onMutate: async (id) => {
      queryClient.setQueryData<Chat[]>(['conversations'], old =>
        (old ?? []).filter(c => c.id !== id)
      );
    },
    onSettled: () => queryClient.invalidateQueries({ queryKey: ['conversations'] }),
  });

  // ── Delete ──
  const deleteMutation = useMutation({
    mutationFn: (id: string) =>
      api.delete(`/messages/conversations/${id}`),
    onMutate: async (id) => {
      queryClient.setQueryData<Chat[]>(['conversations'], old =>
        (old ?? []).filter(c => c.id !== id)
      );
    },
    onSettled: () => queryClient.invalidateQueries({ queryKey: ['conversations'] }),
  });

  // ── Create Group ──
  const createGroupMutation = useMutation({
    mutationFn: (data: { name: string; description?: string; memberIds: number[] }) =>
      api.post<ApiConversation>('/messages/conversations', {
        type: 'group',
        name: data.name,
        description: data.description,
        memberIds: data.memberIds,
      }),
    onSuccess: (data) => {
      const chat = mapConversation(data);
      queryClient.setQueryData<Chat[]>(['conversations'], old => [chat, ...(old ?? [])]);
    },
  });

  // ── Create Channel ──
  const createChannelMutation = useMutation({
    mutationFn: (data: { name: string; description?: string; isPublic: boolean }) =>
      api.post<ApiConversation>('/messages/conversations', {
        type: 'channel',
        name: data.name,
        description: data.description,
        isPublic: data.isPublic,
      }),
    onSuccess: (data) => {
      const chat = mapConversation(data);
      queryClient.setQueryData<Chat[]>(['conversations'], old => [chat, ...(old ?? [])]);
    },
  });

  // ── Create DM ──
  const createDMMutation = useMutation({
    mutationFn: (data: { recipientId: number }) =>
      api.post<ApiConversation>('/messages/conversations', {
        type: 'dm',
        recipientId: data.recipientId,
      }),
    onSuccess: (data) => {
      const chat = mapConversation(data);
      queryClient.setQueryData<Chat[]>(['conversations'], old => {
        // Avoid duplicates
        const exists = (old ?? []).find(c => c.id === chat.id);
        if (exists) return old ?? [];
        return [chat, ...(old ?? [])];
      });
    },
  });

  // ── Stable callbacks ──
  const pinConversation = useCallback(
    (args: { id: string; pinned: boolean }) => pinMutation.mutate(args),
    [pinMutation]
  );

  const muteConversation = useCallback(
    (args: { id: string; muteUntil?: number }) => muteMutation.mutate(args),
    [muteMutation]
  );

  const archiveConversation = useCallback(
    (args: { id: string; archived: boolean }) => archiveMutation.mutate(args),
    [archiveMutation]
  );

  const markRead = useCallback(
    (id: string) => markReadMutation.mutate(id),
    [markReadMutation]
  );

  const leaveConversation = useCallback(
    (id: string) => leaveMutation.mutate(id),
    [leaveMutation]
  );

  const deleteConversation = useCallback(
    (id: string) => deleteMutation.mutate(id),
    [deleteMutation]
  );

  const createGroup = useCallback(
    async (data: { name: string; description?: string; memberIds: number[] }) => {
      return createGroupMutation.mutateAsync(data).then(mapConversation);
    },
    [createGroupMutation]
  );

  const createChannel = useCallback(
    async (data: { name: string; description?: string; isPublic: boolean }) => {
      return createChannelMutation.mutateAsync(data).then(mapConversation);
    },
    [createChannelMutation]
  );

  const createDM = useCallback(
    async (data: { recipientId: number }) => {
      return createDMMutation.mutateAsync(data).then(mapConversation);
    },
    [createDMMutation]
  );

  return {
    conversations,
    isLoading: query.isLoading,
    error: query.error,
    refetch: query.refetch,
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
