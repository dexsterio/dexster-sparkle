import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import api from '@/lib/api';
import signalManager from '@/lib/signal/signalManager';
import type { Message } from '@/types/chat';

interface ApiMessage {
  id: number;
  conversationId: number;
  senderId: number;
  senderName?: string;
  encryptedContent: string;
  nonce: string;
  senderKeyVersion: number;
  signalMessageType: 2 | 3;
  seqId: number;
  clientMsgId: string;
  entities?: Array<{ type: string; offset: number; length: number; userId?: number; url?: string }>;
  imageUrl?: string;
  sharedPostId?: number;
  replyToId?: number;
  isForwarded: boolean;
  isDeleted: boolean;
  isSystem: boolean;
  expiresAt?: string;
  scheduledAt?: string;
  isPinned: boolean;
  pinnedAt?: string;
  pinnedBy?: number;
  viewCount?: number;
  editedAt?: string;
  createdAt: string;
}

interface SendMessagePayload {
  encryptedContent: string;
  nonce?: string;
  senderKeyVersion?: number;
  signalMessageType?: 2 | 3;
  replyToId?: number;
  isForwarded?: boolean;
  scheduledAt?: string;
  clientMsgId?: string;
}

/**
 * Decrypt and map an API message to our frontend Message type.
 */
async function mapApiMessage(msg: ApiMessage, currentUserId: number): Promise<Message> {
  let decryptedText = '';

  if (msg.isSystem) {
    decryptedText = '';
  } else if (msg.encryptedContent) {
    try {
      decryptedText = await signalManager.decrypt(
        msg.senderId,
        msg.encryptedContent,
        msg.nonce,
        msg.senderKeyVersion,
        msg.signalMessageType,
      );
    } catch {
      decryptedText = '[Unable to decrypt]';
    }
  }

  const date = new Date(msg.createdAt);

  return {
    id: String(msg.id),
    chatId: String(msg.conversationId),
    senderId: String(msg.senderId),
    senderName: msg.senderName || 'Unknown',
    text: decryptedText,
    time: date.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', hour12: false }),
    date: date.toISOString().split('T')[0],
    isOwn: msg.senderId === currentUserId,
    read: true, // Will be updated via WS chat:read events
    edited: !!msg.editedAt,
    pinned: msg.isPinned,
    type: msg.isSystem ? 'service' : 'message',
    serviceText: msg.isSystem ? decryptedText : undefined,
    views: msg.viewCount,
    replyTo: msg.replyToId ? { messageId: String(msg.replyToId), senderName: '', text: '' } : undefined,
    forwarded: msg.isForwarded ? { from: msg.senderName || 'Unknown' } : undefined,
    scheduled: !!msg.scheduledAt,
    scheduledTime: msg.scheduledAt,
    autoDeleteAt: msg.expiresAt ? new Date(msg.expiresAt).getTime() : undefined,
  };
}

export function useMessages(conversationId: string, currentUserId: number) {
  const queryClient = useQueryClient();
  const queryKey = ['messages', conversationId];

  const query = useQuery({
    queryKey,
    queryFn: async () => {
      const data = await api.get<ApiMessage[]>(
        `/messages/conversations/${conversationId}/messages?limit=50`
      );
      const messages = await Promise.all(
        data.map(msg => mapApiMessage(msg, currentUserId))
      );
      return messages;
    },
    enabled: !!conversationId && !!currentUserId,
    staleTime: 10_000,
  });

  // ── Send E2E message ──
  const sendMutation = useMutation({
    mutationFn: async (payload: SendMessagePayload) => {
      return api.post<ApiMessage>(
        `/messages/conversations/${conversationId}/messages/e2e`,
        payload
      );
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey });
    },
  });

  // ── Pin message ──
  const pinMutation = useMutation({
    mutationFn: async ({ messageId, pin }: { messageId: string; pin: boolean }) => {
      if (pin) {
        await api.put(`/messages/${messageId}/pin`);
      } else {
        await api.delete(`/messages/${messageId}/pin`);
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey });
    },
  });

  // ── Edit message ──
  const editMutation = useMutation({
    mutationFn: async ({ messageId, encryptedContent, nonce, senderKeyVersion, signalMessageType }: {
      messageId: string;
      encryptedContent: string;
      nonce: string;
      senderKeyVersion: number;
      signalMessageType: 2 | 3;
    }) => {
      await api.put(`/messages/${messageId}`, { encryptedContent, nonce, senderKeyVersion, signalMessageType });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey });
    },
  });

  // ── Delete message ──
  const deleteMutation = useMutation({
    mutationFn: async ({ messageId, forMe }: { messageId: string; forMe: boolean }) => {
      if (forMe) {
        await api.delete(`/messages/${messageId}/for-me`);
      } else {
        await api.delete(`/messages/${messageId}`);
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey });
    },
  });

  // ── Reactions ──
  const addReactionMutation = useMutation({
    mutationFn: async ({ messageId, emoji }: { messageId: string; emoji: string }) => {
      await api.post(`/messages/${messageId}/reactions`, { emoji });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey });
    },
  });

  const removeReactionMutation = useMutation({
    mutationFn: async ({ messageId, emoji }: { messageId: string; emoji: string }) => {
      await api.delete(`/messages/${messageId}/reactions/${encodeURIComponent(emoji)}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey });
    },
  });

  // ── Typing indicator ──
  const sendTyping = async () => {
    try {
      await api.post(`/messages/conversations/${conversationId}/typing`);
    } catch {
      // ignore
    }
  };

  return {
    messages: query.data ?? [],
    isLoading: query.isLoading,
    error: query.error,
    refetch: query.refetch,
    // Mutations
    sendMessage: sendMutation.mutateAsync,
    isSending: sendMutation.isPending,
    pinMessage: pinMutation.mutate,
    editMessage: editMutation.mutateAsync,
    deleteMessage: deleteMutation.mutate,
    addReaction: addReactionMutation.mutate,
    removeReaction: removeReactionMutation.mutate,
    sendTyping,
  };
}
