import { useQuery } from '@tanstack/react-query';
import api from '@/lib/api';

interface UserSearchResult {
  id: number;
  username: string;
  displayName: string;
  avatarUrl: string | null;
  isOnline: boolean;
  bio: string | null;
}

export function useUserSearch(query: string, enabled = true) {
  return useQuery({
    queryKey: ['userSearch', query],
    queryFn: () =>
      api.get<UserSearchResult[]>(`/social/users/search?q=${encodeURIComponent(query)}&limit=20`),
    enabled: enabled && query.length >= 2,
    staleTime: 10_000,
  });
}
