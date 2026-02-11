import { useState, useCallback } from 'react';
import api from '@/lib/api';

interface UploadResult {
  url: string;
  thumbnailUrl?: string;
  blurHash?: string;
}

export function useMediaUpload() {
  const [isUploading, setIsUploading] = useState(false);
  const [progress, setProgress] = useState(0);

  const uploadImage = useCallback(async (file: File): Promise<UploadResult> => {
    setIsUploading(true);
    setProgress(0);
    try {
      const formData = new FormData();
      formData.append('image', file);
      const result = await api.upload<UploadResult>('/messages/upload-image', formData);
      setProgress(100);
      return result;
    } finally {
      setIsUploading(false);
    }
  }, []);

  const uploadVideo = useCallback(async (file: File): Promise<UploadResult> => {
    setIsUploading(true);
    setProgress(0);
    try {
      const formData = new FormData();
      formData.append('video', file);
      const result = await api.upload<UploadResult>('/messages/upload-video', formData);
      setProgress(100);
      return result;
    } finally {
      setIsUploading(false);
    }
  }, []);

  const uploadFile = useCallback(async (file: File): Promise<UploadResult> => {
    setIsUploading(true);
    setProgress(0);
    try {
      const formData = new FormData();
      formData.append('file', file);
      const result = await api.upload<UploadResult>('/messages/upload-file', formData);
      setProgress(100);
      return result;
    } finally {
      setIsUploading(false);
    }
  }, []);

  const uploadEncryptedMedia = useCallback(async (file: File): Promise<UploadResult> => {
    setIsUploading(true);
    setProgress(0);
    try {
      const formData = new FormData();
      formData.append('media', file);
      const result = await api.upload<UploadResult>('/messages/upload-encrypted-media', formData);
      setProgress(100);
      return result;
    } finally {
      setIsUploading(false);
    }
  }, []);

  const getSignedUrl = useCallback(async (key: string): Promise<string> => {
    const result = await api.get<{ url: string }>(`/messages/media/signed-url?key=${encodeURIComponent(key)}`);
    return result.url;
  }, []);

  return {
    isUploading,
    progress,
    uploadImage,
    uploadVideo,
    uploadFile,
    uploadEncryptedMedia,
    getSignedUrl,
  };
}
