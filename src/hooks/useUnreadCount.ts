import { useQuery } from '@tanstack/react-query';
import api from '@/lib/api';

export function useUnreadCount() {
  const query = useQuery({
    queryKey: ['unreadCount'],
    queryFn: () => api.get<{ count: number }>('/messages/unread-count'),
    staleTime: 15_000,
    refetchInterval: 30_000, // Poll every 30s as fallback (WS handles real-time)
  });

  return {
    totalUnread: query.data?.count ?? 0,
    refetch: query.refetch,
  };
}
