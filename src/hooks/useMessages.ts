import { useCallback } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import api from '@/lib/api';
import type { Message } from '@/types/chat';

// ══════════════════════════════════════════════════════════════
// BACKEND: GET /messages/conversations/:id/messages?limit=100
// Returns: ApiMessage[]
// Notes: Messages are E2E encrypted. Content must be decrypted
//        locally via Signal Protocol (see signalManager.ts).
//        Falls back to empty array [] on error.
// ══════════════════════════════════════════════════════════════

// ── API response shapes ──
interface ApiMessage {
  id: number;
  conversationId: number;
  senderId: number;
  senderUsername: string;
  senderDisplayName: string;
  encryptedContent: string;
  nonce: string;
  senderKeyVersion: number;
  signalMessageType: number;
  replyToId: number | null;
  replyToPreview?: {
    senderName: string;
    text: string;
  };
  forwardedFrom?: {
    senderName: string;
    hiddenSender?: boolean;
  };
  isPinned: boolean;
  isEdited: boolean;
  isDeleted: boolean;
  reactions: { emoji: string; userIds: number[] }[];
  type: 'text' | 'image' | 'video' | 'file' | 'gif' | 'poll' | 'dice' | 'service';
  mediaUrl?: string;
  gifUrl?: string;
  pollData?: any;
  diceResult?: any;
  views?: number;
  comments?: number;
  createdAt: string;
  clientMsgId?: string;
}

// ── Map API → local Message type ──
function mapMessage(m: ApiMessage, currentUserId: number): Message {
  const d = new Date(m.createdAt);
  return {
    id: String(m.id),
    chatId: String(m.conversationId),
    senderId: String(m.senderId),
    senderName: m.senderDisplayName || m.senderUsername,
    // Content is E2E encrypted — decrypted locally via Signal Protocol
    // For now we show the encrypted content as-is (decryption handled by signalManager)
    text: m.encryptedContent || '',
    time: d.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', hour12: false }),
    date: d.toISOString().split('T')[0],
    isOwn: m.senderId === currentUserId,
    read: true, // Server marks read via separate endpoint
    edited: m.isEdited,
    pinned: m.isPinned,
    replyTo: m.replyToPreview ? {
      messageId: String(m.replyToId),
      senderName: m.replyToPreview.senderName,
      text: m.replyToPreview.text,
    } : undefined,
    forwarded: m.forwardedFrom ? {
      from: m.forwardedFrom.senderName,
      hiddenSender: m.forwardedFrom.hiddenSender,
    } : undefined,
    reactions: m.reactions?.map(r => ({
      emoji: r.emoji,
      users: r.userIds.map(String),
    })) ?? [],
    type: m.type === 'text' ? 'message'
      : m.type === 'service' ? 'service'
      : m.type === 'poll' ? 'poll'
      : m.type === 'dice' ? 'dice'
      : m.type === 'gif' ? 'gif'
      : 'message',
    gifUrl: m.gifUrl,
    pollData: m.pollData,
    diceResult: m.diceResult,
    views: m.views,
    comments: m.comments,
  };
}

export function useMessages(conversationId: string, currentUserId: number) {
  const queryClient = useQueryClient();
  const queryKey = ['messages', conversationId];

  // ── Fetch messages ──
  const query = useQuery({
    queryKey,
    queryFn: async () => {
      if (!conversationId) return [];
      try {
        const data = await api.get<ApiMessage[]>(
          `/messages/conversations/${conversationId}/messages?limit=100`
        );
        return data.map(m => mapMessage(m, currentUserId));
      } catch (err) {
        console.warn('[useMessages] API failed:', err);
        return [];
      }
    },
    enabled: !!conversationId,
    staleTime: 15_000,
  });

  const messages = query.data ?? [];

  // ── Send message (E2E) ──
  // ══════════════════════════════════════════════════════════════
  // BACKEND: POST /messages/e2e/send
  // Request: { conversationId, encryptedContent, replyToId?, clientMsgId,
  //            nonce, senderKeyVersion, signalMessageType }
  // Response: ApiMessage
  // Notes: Content must be encrypted via Signal Protocol before sending.
  // ══════════════════════════════════════════════════════════════
  const sendMutation = useMutation({
    mutationFn: (payload: {
      encryptedContent: string;
      replyToId?: number;
      clientMsgId: string;
      nonce?: string;
      senderKeyVersion?: number;
      signalMessageType?: number;
      type?: string;
    }) =>
      api.post<ApiMessage>(`/messages/e2e/send`, {
        conversationId: Number(conversationId),
        ...payload,
        nonce: payload.nonce || '',
        senderKeyVersion: payload.senderKeyVersion || 0,
        signalMessageType: payload.signalMessageType || 2,
      }),
    onMutate: async (payload) => {
      // Optimistic message
      const optimistic: Message = {
        id: payload.clientMsgId,
        chatId: conversationId,
        senderId: String(currentUserId),
        senderName: 'You',
        text: payload.encryptedContent,
        time: new Date().toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', hour12: false }),
        date: new Date().toISOString().split('T')[0],
        isOwn: true,
        read: true,
        type: 'message',
      };
      queryClient.setQueryData<Message[]>(queryKey, old => [...(old ?? []), optimistic]);
    },
    onSuccess: (data) => {
      // Replace optimistic with real message
      const real = mapMessage(data, currentUserId);
      queryClient.setQueryData<Message[]>(queryKey, old =>
        (old ?? []).map(m => m.id === data.clientMsgId ? real : m)
      );
    },
    onError: (_err, payload) => {
      // Remove optimistic on error
      queryClient.setQueryData<Message[]>(queryKey, old =>
        (old ?? []).filter(m => m.id !== payload.clientMsgId)
      );
    },
  });

  // ── Pin message ──
  const pinMutation = useMutation({
    mutationFn: ({ messageId, pin }: { messageId: string; pin: boolean }) =>
      api.put(`/messages/${messageId}/pin`, { pinned: pin }),
    onMutate: async ({ messageId, pin }) => {
      queryClient.setQueryData<Message[]>(queryKey, old =>
        (old ?? []).map(m => m.id === messageId ? { ...m, pinned: pin } : m)
      );
    },
    onSettled: () => queryClient.invalidateQueries({ queryKey }),
  });

  // ── Edit message (E2E) ──
  // ══════════════════════════════════════════════════════════════
  // BACKEND: PUT /messages/e2e/:messageId
  // Request: { encryptedContent, nonce, senderKeyVersion, signalMessageType }
  // Response: ApiMessage
  // ══════════════════════════════════════════════════════════════
  const editMutation = useMutation({
    mutationFn: (payload: {
      messageId: string;
      encryptedContent: string;
      nonce: string;
      senderKeyVersion: number;
      signalMessageType: 2 | 3;
    }) =>
      api.put(`/messages/e2e/${payload.messageId}`, {
        encryptedContent: payload.encryptedContent,
        nonce: payload.nonce,
        senderKeyVersion: payload.senderKeyVersion,
        signalMessageType: payload.signalMessageType,
      }),
    onMutate: async (payload) => {
      queryClient.setQueryData<Message[]>(queryKey, old =>
        (old ?? []).map(m =>
          m.id === payload.messageId ? { ...m, text: payload.encryptedContent, edited: true } : m
        )
      );
    },
    onSettled: () => queryClient.invalidateQueries({ queryKey }),
  });

  // ── Delete message ──
  const deleteMutation = useMutation({
    mutationFn: ({ messageId, forMe }: { messageId: string; forMe: boolean }) =>
      api.delete(`/messages/${messageId}`, { forMe }),
    onMutate: async ({ messageId }) => {
      queryClient.setQueryData<Message[]>(queryKey, old =>
        (old ?? []).filter(m => m.id !== messageId)
      );
    },
    onSettled: () => queryClient.invalidateQueries({ queryKey }),
  });

  // ── Add reaction ──
  const addReactionMutation = useMutation({
    mutationFn: ({ messageId, emoji }: { messageId: string; emoji: string }) =>
      api.post(`/messages/${messageId}/reactions`, { emoji }),
    onMutate: async ({ messageId, emoji }) => {
      await queryClient.cancelQueries({ queryKey });
      queryClient.setQueryData<Message[]>(queryKey, old =>
        (old ?? []).map(m => {
          if (m.id !== messageId) return m;
          const reactions = [...(m.reactions || [])];
          const existing = reactions.find(r => r.emoji === emoji);
          if (existing) {
            existing.users = [...existing.users, String(currentUserId)];
          } else {
            reactions.push({ emoji, users: [String(currentUserId)] });
          }
          return { ...m, reactions };
        })
      );
    },
  });

  // ── Remove reaction ──
  const removeReactionMutation = useMutation({
    mutationFn: ({ messageId, emoji }: { messageId: string; emoji: string }) =>
      api.delete(`/messages/${messageId}/reactions`, { emoji }),
    onMutate: async ({ messageId, emoji }) => {
      await queryClient.cancelQueries({ queryKey });
      queryClient.setQueryData<Message[]>(queryKey, old =>
        (old ?? []).map(m => {
          if (m.id !== messageId) return m;
          const reactions = (m.reactions || [])
            .map(r => r.emoji !== emoji ? r : { ...r, users: r.users.filter(u => u !== String(currentUserId)) })
            .filter(r => r.users.length > 0);
          return { ...m, reactions };
        })
      );
    },
  });

  // ── Send typing indicator ──
  const sendTyping = useCallback(async () => {
    try {
      await api.post(`/messages/conversations/${conversationId}/typing`);
    } catch {
      // Typing is non-critical
    }
  }, [conversationId]);

  // ── Stable callbacks ──
  const sendMessage = useCallback(
    async (payload: any) => sendMutation.mutateAsync(payload),
    [sendMutation]
  );

  const pinMessage = useCallback(
    (args: { messageId: string; pin: boolean }) => pinMutation.mutate(args),
    [pinMutation]
  );

  const editMessage = useCallback(
    async (payload: any) => editMutation.mutateAsync(payload),
    [editMutation]
  );

  const deleteMessage = useCallback(
    (args: { messageId: string; forMe: boolean }) => deleteMutation.mutate(args),
    [deleteMutation]
  );

  const addReaction = useCallback(
    (args: { messageId: string; emoji: string }) => addReactionMutation.mutate(args),
    [addReactionMutation]
  );

  const removeReaction = useCallback(
    (args: { messageId: string; emoji: string }) => removeReactionMutation.mutate(args),
    [removeReactionMutation]
  );

  return {
    messages,
    isLoading: query.isLoading,
    error: query.error,
    refetch: query.refetch,
    sendMessage,
    isSending: sendMutation.isPending,
    pinMessage,
    editMessage,
    deleteMessage,
    addReaction,
    removeReaction,
    sendTyping,
  };
}
