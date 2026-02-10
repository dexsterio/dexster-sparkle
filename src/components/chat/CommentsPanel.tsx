import React, { useState, useRef, useEffect } from 'react';
import { Comment } from '@/types/chat';
import { ArrowLeft, Send } from 'lucide-react';

interface CommentsPanelProps {
  comments: Comment[];
  postPreview: string;
  onAddComment: (text: string, replyTo?: { senderName: string; text: string }) => void;
  onClose: () => void;
}

const CommentsPanel: React.FC<CommentsPanelProps> = ({ comments, postPreview, onAddComment, onClose }) => {
  const [text, setText] = useState('');
  const [replyTo, setReplyTo] = useState<{ senderName: string; text: string } | null>(null);
  const bottomRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [comments.length]);

  useEffect(() => {
    if (replyTo) inputRef.current?.focus();
  }, [replyTo]);

  const handleSend = () => {
    const t = text.trim();
    if (!t) return;
    onAddComment(t, replyTo || undefined);
    setText('');
    setReplyTo(null);
  };

  return (
    <div className="absolute inset-0 z-40 flex flex-col bg-background animate-[slideUp_0.3s_ease-out]">
      {/* Header */}
      <div className="flex items-center gap-3 px-4 py-3 border-b border-border">
        <button onClick={onClose} className="p-1.5 rounded-lg hover:bg-dex-hover text-muted-foreground transition-colors">
          <ArrowLeft size={18} />
        </button>
        <div className="flex-1 min-w-0">
          <h3 className="text-sm font-semibold text-foreground">Comments ({comments.length})</h3>
          <p className="text-xs text-muted-foreground truncate">{postPreview}</p>
        </div>
      </div>

      {/* Comments List */}
      <div className="flex-1 overflow-y-auto px-4 py-3 space-y-3">
        {comments.map(c => (
          <div key={c.id} className="animate-[msgIn_0.2s_ease-out]">
            {c.replyTo && (
              <div className="ml-10 mb-1 border-l-2 border-primary/30 pl-2 text-xs text-muted-foreground">
                <span className="font-semibold text-primary">{c.replyTo.senderName}</span>: {c.replyTo.text.slice(0, 60)}
              </div>
            )}
            <div className="flex items-start gap-2.5">
              <div className="w-8 h-8 rounded-full flex items-center justify-center text-xs font-semibold text-white flex-shrink-0" style={{ background: `hsl(${c.senderColor})` }}>
                {c.senderName.split(' ').map(w => w[0]).join('').slice(0, 2)}
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <span className="text-xs font-semibold" style={{ color: `hsl(${c.senderColor})` }}>{c.senderName}</span>
                  <span className="text-[10px] text-muted-foreground">{c.time}</span>
                </div>
                <p className="text-sm text-foreground mt-0.5">{c.text}</p>
                <button
                  onClick={() => setReplyTo({ senderName: c.senderName, text: c.text })}
                  className="text-[10px] text-primary hover:underline mt-1"
                >
                  Reply
                </button>
              </div>
            </div>
          </div>
        ))}
        <div ref={bottomRef} />
      </div>

      {/* Reply preview */}
      {replyTo && (
        <div className="flex items-center gap-2 px-4 py-2 border-t border-primary/30">
          <div className="w-0.5 h-6 bg-primary rounded-full" />
          <div className="flex-1 min-w-0">
            <div className="text-[11px] font-semibold text-primary">Reply to {replyTo.senderName}</div>
            <div className="text-xs text-muted-foreground truncate">{replyTo.text}</div>
          </div>
          <button onClick={() => setReplyTo(null)} className="text-xs text-muted-foreground hover:text-foreground transition-colors">✕</button>
        </div>
      )}

      {/* Input */}
      <div className="flex items-center gap-2 px-4 py-3 border-t border-border">
        <input
          ref={inputRef}
          value={text}
          onChange={e => setText(e.target.value)}
          onKeyDown={e => e.key === 'Enter' && handleSend()}
          placeholder="Write a comment..."
          className="flex-1 px-4 py-2 rounded-full bg-muted border border-border/50 text-sm text-foreground placeholder:text-muted-foreground/50 focus:outline-none focus:ring-1 focus:ring-primary"
        />
        <button
          onClick={handleSend}
          className={`p-2.5 rounded-full transition-all duration-200 ${text.trim() ? 'bg-primary text-primary-foreground' : 'text-muted-foreground'}`}
        >
          <Send size={16} />
        </button>
      </div>
    </div>
  );
};

export default CommentsPanel;
