import { useQuery } from '@tanstack/react-query';
import api from '@/lib/api';

interface SearchResult {
  messageId: number;
  conversationId: number;
  conversationName: string;
  senderId: number;
  senderName: string;
  encryptedContent: string;
  createdAt: string;
  // These would need decryption to display
}

export function useMessageSearch(query: string) {
  return useQuery({
    queryKey: ['messageSearch', query],
    queryFn: () => api.get<SearchResult[]>(`/messages/search?q=${encodeURIComponent(query)}`),
    enabled: query.length >= 2,
    staleTime: 30_000,
  });
}
