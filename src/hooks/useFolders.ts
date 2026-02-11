import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import api from '@/lib/api';
import type { CustomFolder } from '@/types/chat';

interface ApiFolder {
  id: number;
  name: string;
  emoji: string;
  chatIds: number[];
}

function mapToCustomFolder(f: ApiFolder): CustomFolder {
  return {
    id: String(f.id),
    name: f.name,
    emoji: f.emoji,
    includedChatIds: f.chatIds.map(String),
  };
}

export function useFolders() {
  const queryClient = useQueryClient();
  const queryKey = ['folders'];

  const query = useQuery({
    queryKey,
    queryFn: async () => {
      const data = await api.get<ApiFolder[]>('/messages/folders');
      return data.map(mapToCustomFolder);
    },
    staleTime: 60_000,
  });

  const createMutation = useMutation({
    mutationFn: (data: { name: string; emoji: string; chatIds: number[] }) =>
      api.post('/messages/folders', data),
    onSuccess: () => queryClient.invalidateQueries({ queryKey }),
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, ...data }: { id: string; name?: string; emoji?: string; chatIds?: number[] }) =>
      api.put(`/messages/folders/${id}`, data),
    onSuccess: () => queryClient.invalidateQueries({ queryKey }),
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => api.delete(`/messages/folders/${id}`),
    onSuccess: () => queryClient.invalidateQueries({ queryKey }),
  });

  return {
    folders: query.data ?? [],
    isLoading: query.isLoading,
    createFolder: createMutation.mutateAsync,
    updateFolder: updateMutation.mutate,
    deleteFolder: deleteMutation.mutate,
  };
}
