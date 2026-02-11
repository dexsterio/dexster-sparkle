import { useState, useCallback } from 'react';
import type { CustomFolder } from '@/types/chat';
import { MOCK_FOLDERS } from '@/data/mockData';

export function useFolders() {
  const [folders, setFolders] = useState<CustomFolder[]>(MOCK_FOLDERS);

  const createFolder = useCallback(async (data: { name: string; emoji: string; chatIds: number[] }) => {
    const newFolder: CustomFolder = {
      id: `f_${Date.now()}`,
      name: data.name,
      emoji: data.emoji,
      includedChatIds: data.chatIds.map(String),
    };
    setFolders(prev => [...prev, newFolder]);
    return newFolder;
  }, []);

  const updateFolder = useCallback(({ id, ...data }: { id: string; name?: string; emoji?: string; chatIds?: number[] }) => {
    setFolders(prev => prev.map(f => {
      if (f.id !== id) return f;
      return {
        ...f,
        ...(data.name && { name: data.name }),
        ...(data.emoji && { emoji: data.emoji }),
        ...(data.chatIds && { includedChatIds: data.chatIds.map(String) }),
      };
    }));
  }, []);

  const deleteFolder = useCallback((id: string) => {
    setFolders(prev => prev.filter(f => f.id !== id));
  }, []);

  return {
    folders,
    isLoading: false,
    createFolder,
    updateFolder,
    deleteFolder,
  };
}
