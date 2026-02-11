import { useQuery } from '@tanstack/react-query';
import api from '@/lib/api';

interface UserProfile {
  id: number;
  walletAddress: string;
  username: string;
  displayName: string;
  bio: string | null;
  avatarUrl: string | null;
  headerUrl: string | null;
  isOnline: boolean;
  lastSeen: string | null;
  followerCount: number;
  followingCount: number;
}

interface FollowState {
  isFollowing: boolean;
  isFollowedBy: boolean;
}

export function useUserProfile(identifier: string, type: 'wallet' | 'username' = 'username') {
  const path = type === 'wallet'
    ? `/profile/user/${identifier}`
    : `/profile/username/${identifier}`;

  return useQuery({
    queryKey: ['userProfile', identifier],
    queryFn: () => api.get<UserProfile>(path),
    enabled: !!identifier,
    staleTime: 60_000,
  });
}

export function useFollowState(userId: number) {
  return useQuery({
    queryKey: ['followState', userId],
    queryFn: () => api.get<FollowState>(`/profile/${userId}/follow-state`),
    enabled: !!userId,
  });
}
