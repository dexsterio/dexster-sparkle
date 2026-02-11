import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import api from '@/lib/api';

interface Notification {
  id: number;
  type: string;
  message: string;
  read: boolean;
  createdAt: string;
  data?: Record<string, unknown>;
}

export function useNotifications() {
  const queryClient = useQueryClient();

  const query = useQuery({
    queryKey: ['notifications'],
    queryFn: () => api.get<Notification[]>('/notifications'),
    staleTime: 30_000,
  });

  const unreadQuery = useQuery({
    queryKey: ['notificationsUnread'],
    queryFn: () => api.get<{ count: number }>('/notifications/unread-count'),
    staleTime: 15_000,
  });

  const markReadMutation = useMutation({
    mutationFn: () => api.post('/notifications/mark-read'),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['notifications'] });
      queryClient.invalidateQueries({ queryKey: ['notificationsUnread'] });
    },
  });

  return {
    notifications: query.data ?? [],
    unreadCount: unreadQuery.data?.count ?? 0,
    markRead: markReadMutation.mutate,
  };
}
