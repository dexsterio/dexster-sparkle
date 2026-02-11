import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import api from '@/lib/api';

interface ApiInviteLink {
  code: string;
  url: string;
  uses: number;
  maxUses?: number;
  expiresAt?: string;
  createdBy: number;
}

export function useInviteLinks(conversationId: string) {
  const queryClient = useQueryClient();
  const queryKey = ['inviteLinks', conversationId];

  const query = useQuery({
    queryKey,
    queryFn: () => api.get<ApiInviteLink>(`/messages/conversations/${conversationId}/invite-link`),
    enabled: !!conversationId,
  });

  const generateMutation = useMutation({
    mutationFn: () =>
      api.post<ApiInviteLink>(`/messages/conversations/${conversationId}/invite-link`),
    onSuccess: () => queryClient.invalidateQueries({ queryKey }),
  });

  return {
    inviteLink: query.data,
    isLoading: query.isLoading,
    generateLink: generateMutation.mutateAsync,
  };
}

export function useJoinByInvite() {
  const queryClient = useQueryClient();

  const joinMutation = useMutation({
    mutationFn: (inviteCode: string) => api.post(`/messages/join/${inviteCode}`),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['conversations'] }),
  });

  return { join: joinMutation.mutateAsync, isJoining: joinMutation.isPending };
}
