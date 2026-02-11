import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import api from '@/lib/api';

interface ApiMember {
  id: number;
  userId: number;
  username: string;
  displayName: string;
  avatarUrl: string | null;
  isOnline: boolean;
  role: 'owner' | 'admin' | 'member';
  joinedAt: string;
}

export function useMembers(conversationId: string) {
  const queryClient = useQueryClient();
  const queryKey = ['members', conversationId];

  const query = useQuery({
    queryKey,
    queryFn: () => api.get<ApiMember[]>(`/messages/conversations/${conversationId}/members`),
    enabled: !!conversationId,
    staleTime: 60_000,
  });

  const addMemberMutation = useMutation({
    mutationFn: (userIds: number[]) =>
      api.post(`/messages/conversations/${conversationId}/members`, { userIds }),
    onSuccess: () => queryClient.invalidateQueries({ queryKey }),
  });

  const removeMemberMutation = useMutation({
    mutationFn: (userId: number) =>
      api.delete(`/messages/conversations/${conversationId}/members/${userId}`),
    onSuccess: () => queryClient.invalidateQueries({ queryKey }),
  });

  const changeRoleMutation = useMutation({
    mutationFn: ({ userId, role }: { userId: number; role: 'owner' | 'admin' | 'member' }) =>
      api.put(`/messages/conversations/${conversationId}/members/${userId}/role`, { role }),
    onSuccess: () => queryClient.invalidateQueries({ queryKey }),
  });

  const banMutation = useMutation({
    mutationFn: (userId: number) =>
      api.post(`/messages/conversations/${conversationId}/members/${userId}/ban`),
    onSuccess: () => queryClient.invalidateQueries({ queryKey }),
  });

  const unbanMutation = useMutation({
    mutationFn: (userId: number) =>
      api.delete(`/messages/conversations/${conversationId}/members/${userId}/ban`),
    onSuccess: () => queryClient.invalidateQueries({ queryKey }),
  });

  return {
    members: query.data ?? [],
    isLoading: query.isLoading,
    addMembers: addMemberMutation.mutate,
    removeMember: removeMemberMutation.mutate,
    changeRole: changeRoleMutation.mutate,
    banMember: banMutation.mutate,
    unbanMember: unbanMutation.mutate,
  };
}
