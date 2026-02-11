import { useCallback } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import api from '@/lib/api';
import type { CustomFolder } from '@/types/chat';

// ══════════════════════════════════════════════════════════════
// BACKEND: GET /messages/folders
// Returns: ApiFolder[]
// Notes: Custom chat folders for the authenticated user.
//        Falls back to empty array [] on error.
// ══════════════════════════════════════════════════════════════

// ── API response shape ──
interface ApiFolder {
  id: number;
  name: string;
  emoji: string;
  chatIds: number[];
  createdAt: string;
}

function mapFolder(f: ApiFolder): CustomFolder {
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

  // ── Fetch folders ──
  const query = useQuery({
    queryKey,
    queryFn: async () => {
      try {
        const data = await api.get<ApiFolder[]>('/messages/folders');
        return data.map(mapFolder);
      } catch (err) {
        console.warn('[useFolders] API failed:', err);
        return [];
      }
    },
    staleTime: 60_000,
  });

  const folders = query.data ?? [];

  // ── Create folder ──
  const createMutation = useMutation({
    mutationFn: (data: { name: string; emoji: string; chatIds: number[] }) =>
      api.post<ApiFolder>('/messages/folders', data),
    onSuccess: (data) => {
      const folder = mapFolder(data);
      queryClient.setQueryData<CustomFolder[]>(queryKey, old => [...(old ?? []), folder]);
    },
  });

  // ── Update folder ──
  const updateMutation = useMutation({
    mutationFn: ({ id, ...data }: { id: string; name?: string; emoji?: string; chatIds?: number[] }) =>
      api.put<ApiFolder>(`/messages/folders/${id}`, data),
    onMutate: async ({ id, ...data }) => {
      queryClient.setQueryData<CustomFolder[]>(queryKey, old =>
        (old ?? []).map(f => {
          if (f.id !== id) return f;
          return {
            ...f,
            ...(data.name && { name: data.name }),
            ...(data.emoji && { emoji: data.emoji }),
            ...(data.chatIds && { includedChatIds: data.chatIds.map(String) }),
          };
        })
      );
    },
    onSettled: () => queryClient.invalidateQueries({ queryKey }),
  });

  // ── Delete folder ──
  const deleteMutation = useMutation({
    mutationFn: (id: string) =>
      api.delete(`/messages/folders/${id}`),
    onMutate: async (id) => {
      queryClient.setQueryData<CustomFolder[]>(queryKey, old =>
        (old ?? []).filter(f => f.id !== id)
      );
    },
    onSettled: () => queryClient.invalidateQueries({ queryKey }),
  });

  // ── Stable callbacks ──
  const createFolder = useCallback(
    async (data: { name: string; emoji: string; chatIds: number[] }) =>
      createMutation.mutateAsync(data).then(mapFolder),
    [createMutation]
  );

  const updateFolder = useCallback(
    (args: { id: string; name?: string; emoji?: string; chatIds?: number[] }) =>
      updateMutation.mutate(args),
    [updateMutation]
  );

  const deleteFolder = useCallback(
    (id: string) => deleteMutation.mutate(id),
    [deleteMutation]
  );

  return {
    folders,
    isLoading: query.isLoading,
    createFolder,
    updateFolder,
    deleteFolder,
  };
}
