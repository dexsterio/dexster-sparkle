import { useCallback } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import api from '@/lib/api';
import type { Chat } from '@/types/chat';

// ══════════════════════════════════════════════════════════════
// BACKEND: GET /messages/conversations
// Returns: ApiConversation[]
// Notes: All conversations for the authenticated user.
//        Falls back to empty array [] on error.
// ══════════════════════════════════════════════════════════════

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
  // Message request status
  requestStatus?: 'none' | 'pending_sent' | 'pending_received' | 'accepted' | 'rejected';
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
    requestStatus: c.requestStatus || 'none',
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
        console.warn('[useConversations] API failed:', err);
        return [];
      }
    },
    staleTime: 30_000,
    refetchInterval: 60_000,
  });

  const conversations = query.data ?? [];

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
  // ══════════════════════════════════════════════════════════════
  // BACKEND: POST /messages/conversations
  // Request: { type: 'group', name: string, description?: string, memberIds: number[] }
  // Response: ApiConversation
  // ══════════════════════════════════════════════════════════════
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
  // ══════════════════════════════════════════════════════════════
  // BACKEND: POST /messages/conversations
  // Request: { type: 'channel', name: string, description?: string, isPublic: boolean }
  // Response: ApiConversation
  // ══════════════════════════════════════════════════════════════
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
  // ══════════════════════════════════════════════════════════════
  // BACKEND: POST /messages/conversations
  // Request: { type: 'dm', recipientId: number }
  // Response: ApiConversation
  // ══════════════════════════════════════════════════════════════
  const createDMMutation = useMutation({
    mutationFn: (data: { recipientId: number }) =>
      api.post<ApiConversation>('/messages/conversations', {
        type: 'dm',
        recipientId: data.recipientId,
      }),
    onSuccess: (data) => {
      const chat = mapConversation(data);
      if (!chat.requestStatus || chat.requestStatus === 'none') {
        chat.requestStatus = 'pending_sent';
      }
      queryClient.setQueryData<Chat[]>(['conversations'], old => {
        const exists = (old ?? []).find(c => c.id === chat.id);
        if (exists) return old ?? [];
        return [chat, ...(old ?? [])];
      });
    },
  });

  // ── Accept message request ──
  const acceptRequestMutation = useMutation({
    mutationFn: (id: string) =>
      api.post(`/messages/conversations/${id}/accept`),
    onMutate: async (id) => {
      await queryClient.cancelQueries({ queryKey: ['conversations'] });
      queryClient.setQueryData<Chat[]>(['conversations'], old =>
        (old ?? []).map(c => c.id === id ? { ...c, requestStatus: 'accepted' as const } : c)
      );
    },
    onSettled: () => queryClient.invalidateQueries({ queryKey: ['conversations'] }),
  });

  // ── Reject message request ──
  const rejectRequestMutation = useMutation({
    mutationFn: (id: string) =>
      api.post(`/messages/conversations/${id}/reject`),
    onMutate: async (id) => {
      await queryClient.cancelQueries({ queryKey: ['conversations'] });
      queryClient.setQueryData<Chat[]>(['conversations'], old =>
        (old ?? []).map(c => c.id === id ? { ...c, requestStatus: 'rejected' as const } : c)
      );
    },
    onSettled: () => queryClient.invalidateQueries({ queryKey: ['conversations'] }),
  });

  // ── Block ──
  const blockMutation = useMutation({
    mutationFn: (id: string) =>
      api.post(`/messages/conversations/${id}/block`),
    onMutate: async (id) => {
      await queryClient.cancelQueries({ queryKey: ['conversations'] });
      queryClient.setQueryData<Chat[]>(['conversations'], old =>
        (old ?? []).map(c => c.id === id ? { ...c, blocked: true } : c)
      );
    },
    onSettled: () => queryClient.invalidateQueries({ queryKey: ['conversations'] }),
  });

  // ── Unblock ──
  const unblockMutation = useMutation({
    mutationFn: (id: string) =>
      api.delete(`/messages/conversations/${id}/block`),
    onMutate: async (id) => {
      await queryClient.cancelQueries({ queryKey: ['conversations'] });
      queryClient.setQueryData<Chat[]>(['conversations'], old =>
        (old ?? []).map(c => c.id === id ? { ...c, blocked: false } : c)
      );
    },
    onSettled: () => queryClient.invalidateQueries({ queryKey: ['conversations'] }),
  });

  // ── Clear history ──
  const clearHistoryMutation = useMutation({
    mutationFn: ({ id, forAll }: { id: string; forAll: boolean }) =>
      api.delete(`/messages/conversations/${id}/history`, { forAll }),
    onSuccess: (_data, { id }) => {
      queryClient.setQueryData(['messages', id], []);
      queryClient.invalidateQueries({ queryKey: ['conversations'] });
    },
  });

  // ── Update settings ──
  const updateSettingsMutation = useMutation({
    mutationFn: ({ id, settings }: { id: string; settings: Record<string, unknown> }) =>
      api.put(`/messages/conversations/${id}/settings`, settings),
    onSettled: () => queryClient.invalidateQueries({ queryKey: ['conversations'] }),
  });

  // ── Set auto-delete ──
  const setAutoDeleteMutation = useMutation({
    mutationFn: ({ id, timer }: { id: string; timer: number }) =>
      api.put(`/messages/conversations/${id}/auto-delete`, { timer }),
    onMutate: async ({ id, timer }) => {
      queryClient.setQueryData<Chat[]>(['conversations'], old =>
        (old ?? []).map(c => c.id === id ? { ...c, autoDeleteTimer: timer } : c)
      );
    },
    onSettled: () => queryClient.invalidateQueries({ queryKey: ['conversations'] }),
  });

  // ── Report ──
  const reportMutation = useMutation({
    mutationFn: ({ conversationId, reason }: { conversationId: string; reason: string }) =>
      api.post('/messages/report', { conversationId: Number(conversationId), reason }),
  });

  // ── Mark unread ──
  const markUnreadMutation = useMutation({
    mutationFn: (id: string) =>
      api.post(`/messages/conversations/${id}/mark-unread`),
    onMutate: async (id) => {
      queryClient.setQueryData<Chat[]>(['conversations'], old =>
        (old ?? []).map(c => c.id === id ? { ...c, markedUnread: true, unread: Math.max(c.unread, 1) } : c)
      );
    },
    onSettled: () => queryClient.invalidateQueries({ queryKey: ['conversations'] }),
  });

  // ── Move to folder ──
  const moveToFolderMutation = useMutation({
    mutationFn: ({ chatId, folderId }: { chatId: string; folderId: string }) =>
      api.put(`/messages/conversations/${chatId}/folder`, { folderId: Number(folderId) }),
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: ['conversations'] });
      queryClient.invalidateQueries({ queryKey: ['folders'] });
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

  const acceptRequest = useCallback(
    (id: string) => acceptRequestMutation.mutate(id),
    [acceptRequestMutation]
  );

  const rejectRequest = useCallback(
    (id: string) => rejectRequestMutation.mutate(id),
    [rejectRequestMutation]
  );

  const blockConversation = useCallback(
    (id: string) => blockMutation.mutate(id),
    [blockMutation]
  );

  const unblockConversation = useCallback(
    (id: string) => unblockMutation.mutate(id),
    [unblockMutation]
  );

  const clearHistory = useCallback(
    (args: { id: string; forAll: boolean }) => clearHistoryMutation.mutate(args),
    [clearHistoryMutation]
  );

  const updateSettings = useCallback(
    (args: { id: string; settings: Record<string, unknown> }) => updateSettingsMutation.mutateAsync(args),
    [updateSettingsMutation]
  );

  const setAutoDelete = useCallback(
    (args: { id: string; timer: number }) => setAutoDeleteMutation.mutate(args),
    [setAutoDeleteMutation]
  );

  const reportConversation = useCallback(
    (args: { conversationId: string; reason: string }) => reportMutation.mutateAsync(args),
    [reportMutation]
  );

  const markUnread = useCallback(
    (id: string) => markUnreadMutation.mutate(id),
    [markUnreadMutation]
  );

  const moveToFolder = useCallback(
    (args: { chatId: string; folderId: string }) => moveToFolderMutation.mutate(args),
    [moveToFolderMutation]
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
    acceptRequest,
    rejectRequest,
    blockConversation,
    unblockConversation,
    clearHistory,
    updateSettings,
    setAutoDelete,
    reportConversation,
    markUnread,
    moveToFolder,
  };
}
