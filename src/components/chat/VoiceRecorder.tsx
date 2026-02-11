import React, { useState, useRef, useCallback, useEffect } from 'react';
import { Mic, Square, Send, X } from 'lucide-react';

interface VoiceRecorderProps {
  onSend: (blob: Blob, duration: number) => void;
  onCancel: () => void;
}

const VoiceRecorder: React.FC<VoiceRecorderProps> = ({ onSend, onCancel }) => {
  const [isRecording, setIsRecording] = useState(true);
  const [duration, setDuration] = useState(0);
  const [audioBlob, setAudioBlob] = useState<Blob | null>(null);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const chunksRef = useRef<Blob[]>([]);
  const timerRef = useRef<NodeJS.Timeout | null>(null);
  const startTimeRef = useRef(Date.now());

  useEffect(() => {
    let stream: MediaStream | null = null;

    const startRecording = async () => {
      try {
        stream = await navigator.mediaDevices.getUserMedia({ audio: true });
        const mediaRecorder = new MediaRecorder(stream, { mimeType: 'audio/webm;codecs=opus' });
        mediaRecorderRef.current = mediaRecorder;
        chunksRef.current = [];
        startTimeRef.current = Date.now();

        mediaRecorder.ondataavailable = (e) => {
          if (e.data.size > 0) chunksRef.current.push(e.data);
        };

        mediaRecorder.onstop = () => {
          const blob = new Blob(chunksRef.current, { type: 'audio/webm' });
          setAudioBlob(blob);
          stream?.getTracks().forEach(t => t.stop());
        };

        mediaRecorder.start(100);
        setIsRecording(true);

        timerRef.current = setInterval(() => {
          setDuration(Math.floor((Date.now() - startTimeRef.current) / 1000));
        }, 200);
      } catch {
        onCancel();
      }
    };

    startRecording();

    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
      stream?.getTracks().forEach(t => t.stop());
    };
  }, []);

  const stopRecording = useCallback(() => {
    if (mediaRecorderRef.current?.state === 'recording') {
      mediaRecorderRef.current.stop();
      setIsRecording(false);
      if (timerRef.current) clearInterval(timerRef.current);
    }
  }, []);

  const handleSend = useCallback(() => {
    if (audioBlob) {
      onSend(audioBlob, duration);
    }
  }, [audioBlob, duration, onSend]);

  const handleCancel = useCallback(() => {
    if (mediaRecorderRef.current?.state === 'recording') {
      mediaRecorderRef.current.stop();
    }
    if (timerRef.current) clearInterval(timerRef.current);
    onCancel();
  }, [onCancel]);

  const formatTime = (s: number) => `${Math.floor(s / 60)}:${String(s % 60).padStart(2, '0')}`;

  return (
    <div className="flex items-center gap-2 flex-1 animate-[fadeIn_0.2s_ease-out]">
      <button onClick={handleCancel} className="p-2 rounded-lg hover:bg-dex-hover text-destructive flex-shrink-0">
        <X size={18} />
      </button>

      <div className="flex-1 flex items-center gap-3 bg-muted rounded-full px-4 py-2 border border-border/50">
        {isRecording && (
          <div className="w-2.5 h-2.5 rounded-full bg-destructive animate-pulse flex-shrink-0" />
        )}
        <span className="text-sm font-mono text-foreground tabular-nums">{formatTime(duration)}</span>
        {!isRecording && audioBlob && (
          <div className="flex-1 h-1 bg-border rounded-full overflow-hidden">
            <div className="h-full bg-primary rounded-full" style={{ width: '100%' }} />
          </div>
        )}
        {isRecording && (
          <div className="flex-1 flex items-center gap-0.5">
            {Array.from({ length: 20 }).map((_, i) => (
              <div
                key={i}
                className="w-1 rounded-full bg-primary"
                style={{
                  height: `${4 + Math.random() * 16}px`,
                  animation: `typing 0.8s infinite`,
                  animationDelay: `${i * 0.05}s`,
                }}
              />
            ))}
          </div>
        )}
      </div>

      {isRecording ? (
        <button onClick={stopRecording} className="p-2.5 rounded-full bg-destructive text-white flex-shrink-0">
          <Square size={16} />
        </button>
      ) : (
        <button onClick={handleSend} className="p-2.5 rounded-full bg-primary text-primary-foreground flex-shrink-0">
          <Send size={16} />
        </button>
      )}
    </div>
  );
};

export default VoiceRecorder;
