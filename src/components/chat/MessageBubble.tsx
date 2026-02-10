import React, { useState } from 'react';
import { Message, Chat } from '@/types/chat';
import ContextMenu, { ContextMenuItem } from './ContextMenu';

const QUICK_REACTIONS = ['👍', '❤️', '🔥', '😂', '😮', '😢', '🎉', '💯'];

interface MessageBubbleProps {
  message: Message;
  chat: Chat;
  onReply: (msg: Message) => void;
  onEdit: (msg: Message) => void;
  onDelete: (msg: Message) => void;
  onForward: (msg: Message) => void;
  onPin: (msg: Message) => void;
  onReaction: (msgId: string, emoji: string) => void;
}

const formatText = (text: string): React.ReactNode[] => {
  const parts: React.ReactNode[] = [];
  // Simple parser for **bold**, *italic*, `code`, ~~strike~~, ||spoiler||
  const regex = /(\*\*(.+?)\*\*|\*(.+?)\*|`(.+?)`|~~(.+?)~~|\|\|(.+?)\|\|)/g;
  let lastIndex = 0;
  let match;
  let key = 0;

  while ((match = regex.exec(text)) !== null) {
    if (match.index > lastIndex) {
      parts.push(text.slice(lastIndex, match.index));
    }
    if (match[2]) parts.push(<strong key={key++}>{match[2]}</strong>);
    else if (match[3]) parts.push(<em key={key++}>{match[3]}</em>);
    else if (match[4]) parts.push(<code key={key++} className="bg-black/30 px-1.5 py-0.5 rounded text-[0.88em] font-mono">{match[4]}</code>);
    else if (match[5]) parts.push(<s key={key++}>{match[5]}</s>);
    else if (match[6]) parts.push(<SpoilerText key={key++} text={match[6]} />);
    lastIndex = match.index + match[0].length;
  }
  if (lastIndex < text.length) parts.push(text.slice(lastIndex));
  return parts;
};

const SpoilerText: React.FC<{ text: string }> = ({ text }) => {
  const [revealed, setRevealed] = useState(false);
  return (
    <span
      onClick={() => setRevealed(true)}
      className={`cursor-pointer transition-all duration-300 rounded px-0.5 ${revealed ? '' : 'bg-muted-foreground/40 text-transparent select-none'}`}
      style={!revealed ? { textShadow: '0 0 8px hsla(240, 20%, 85%, 0.7)' } : {}}
    >
      {text}
    </span>
  );
};

const MessageBubble: React.FC<MessageBubbleProps> = ({ message, chat, onReply, onEdit, onDelete, onForward, onPin, onReaction }) => {
  const [hovered, setHovered] = useState(false);
  const [contextMenu, setContextMenu] = useState<{ x: number; y: number } | null>(null);
  const [showReactionPicker, setShowReactionPicker] = useState(false);
  const [burst, setBurst] = useState<{ emoji: string; particles: { tx: number; ty: number; rot: number; scale: number }[] } | null>(null);

  if (message.type === 'service') {
    return (
      <div className="flex justify-center my-2 animate-[msgIn_0.2s_ease-out]">
        <span className="text-xs text-muted-foreground bg-dex-surface/60 px-3.5 py-1 rounded-xl">{message.serviceText}</span>
      </div>
    );
  }

  const isChannel = chat.type === 'channel';
  const isGroup = chat.type === 'group';
  const isOwn = message.isOwn;

  const handleContextMenu = (e: React.MouseEvent) => {
    e.preventDefault();
    setContextMenu({ x: e.clientX, y: e.clientY });
  };

  const handleDoubleClick = () => {
    onReaction(message.id, '👍');
    triggerBurst('👍');
  };

  const triggerBurst = (emoji: string) => {
    const particles = Array.from({ length: 6 }, () => ({
      tx: (Math.random() - 0.5) * 80,
      ty: -(Math.random() * 60 + 20),
      rot: (Math.random() - 0.5) * 60,
      scale: 0.5 + Math.random() * 0.8,
    }));
    setBurst({ emoji, particles });
    setTimeout(() => setBurst(null), 800);
  };

  const handleReaction = (emoji: string) => {
    onReaction(message.id, emoji);
    triggerBurst(emoji);
    setShowReactionPicker(false);
  };

  const contextItems: ContextMenuItem[] = [
    { label: 'Reply', icon: '↩️', shortcut: 'Ctrl+R', onClick: () => onReply(message) },
    ...(isOwn ? [{ label: 'Edit', icon: '✏️', shortcut: 'Ctrl+E', onClick: () => onEdit(message) }] : []),
    { label: 'Copy Text', icon: '📋', shortcut: 'Ctrl+C', onClick: () => navigator.clipboard.writeText(message.text) },
    { label: message.pinned ? 'Unpin' : 'Pin', icon: '📌', onClick: () => onPin(message), dividerAfter: true },
    { label: 'Forward', icon: '↗️', onClick: () => onForward(message) },
    { label: 'Select', icon: '✅', onClick: () => {} },
    { label: 'Delete', icon: '🗑️', shortcut: 'Del', danger: true, onClick: () => onDelete(message) },
  ];

  return (
    <div
      className={`flex ${isOwn && !isChannel ? 'justify-end' : 'justify-start'} mb-1 relative group animate-[msgIn_0.2s_ease-out]`}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => { setHovered(false); setShowReactionPicker(false); }}
      onContextMenu={handleContextMenu}
      onDoubleClick={handleDoubleClick}
    >
      <div
        className={`relative px-3 py-2 ${isChannel ? 'w-full max-w-full rounded-xl bg-dex-bubble-other' : isOwn ? 'max-w-[480px] rounded-[18px_18px_4px_18px] bg-gradient-to-br from-primary to-[hsl(252,60%,48%)]' : 'max-w-[480px] rounded-[18px_18px_18px_4px] bg-dex-bubble-other'} ${message.pinned ? 'border border-primary/30' : ''}`}
      >
        {message.pinned && (
          <div className="flex items-center gap-1 text-[10px] text-primary mb-1">📌 Pinned</div>
        )}

        {message.forwarded && (
          <div className="flex items-center gap-1 text-xs text-primary/70 italic mb-1 border-l-2 border-primary/30 pl-2">
            ↗️ Forwarded from {message.forwarded.from}
          </div>
        )}

        {message.replyTo && (
          <div className="border-l-2 border-primary pl-2 mb-1.5 rounded bg-primary/[0.08] px-2 py-1">
            <div className="text-xs font-semibold text-primary">{message.replyTo.senderName}</div>
            <div className="text-xs text-muted-foreground truncate max-w-[300px]">{message.replyTo.text}</div>
          </div>
        )}

        {isGroup && !isOwn && (
          <div className="text-xs font-semibold mb-0.5" style={{ color: `hsl(${chat.members?.find(m => m.id === message.senderId)?.color || '252 75% 64%'})` }}>
            {message.senderName}
          </div>
        )}

        <div className="text-sm leading-relaxed whitespace-pre-wrap break-words">
          {message.text.split('\n').map((line, i) => (
            <React.Fragment key={i}>
              {i > 0 && <br />}
              {formatText(line)}
            </React.Fragment>
          ))}
        </div>

        {isChannel && (
          <div className="flex items-center gap-3 mt-2 text-xs text-muted-foreground">
            {message.views !== undefined && <span>👁 {message.views >= 1000 ? `${(message.views / 1000).toFixed(1)}K` : message.views}</span>}
            {message.comments !== undefined && <span>💬 {message.comments}</span>}
            {message.shares !== undefined && <span>↗️ {message.shares}</span>}
            <span className="ml-auto">{message.time}</span>
          </div>
        )}

        {!isChannel && (
          <div className={`flex items-center justify-end gap-1 mt-0.5 text-[11px] ${isOwn ? 'text-white/55' : 'text-muted-foreground'}`}>
            {message.edited && <span>edited</span>}
            <span>{message.time}</span>
            {isOwn && (
              <span className="ml-0.5">
                {message.read ? (
                  <svg width="16" height="11" viewBox="0 0 16 11" fill="none"><path d="M1 5.5L4.5 9L11 2" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" opacity="0.7"/><path d="M5 5.5L8.5 9L15 2" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" opacity="0.7"/></svg>
                ) : (
                  <svg width="12" height="11" viewBox="0 0 12 11" fill="none"><path d="M1 5.5L4.5 9L11 2" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" opacity="0.45"/></svg>
                )}
              </span>
            )}
          </div>
        )}

        {message.reactions && message.reactions.length > 0 && (
          <div className="flex flex-wrap gap-1 mt-1.5">
            {message.reactions.map((r, i) => {
              const isMine = r.users.includes('me');
              return (
                <button
                  key={i}
                  onClick={() => handleReaction(r.emoji)}
                  className={`flex items-center gap-1 px-2 py-0.5 rounded-xl text-[11.5px] font-semibold transition-transform duration-150 hover:scale-110 ${isMine ? 'bg-primary/25 border border-primary/40' : 'bg-white/[0.07] border border-white/[0.08]'}`}
                >
                  {r.emoji} {r.users.length}
                </button>
              );
            })}
          </div>
        )}

        {/* Burst animation */}
        {burst && (
          <div className="absolute inset-0 pointer-events-none flex items-center justify-center">
            {burst.particles.map((p, i) => (
              <span
                key={i}
                className="absolute text-lg"
                style={{
                  '--tx': `${p.tx}px`,
                  '--ty': `${p.ty}px`,
                  animation: `reactionBurst 0.7s ease-out forwards`,
                  animationDelay: `${i * 0.05}s`,
                } as React.CSSProperties}
              >
                {burst.emoji}
              </span>
            ))}
          </div>
        )}
      </div>

      {/* Hover actions */}
      {hovered && !contextMenu && (
        <div className={`absolute ${isOwn && !isChannel ? 'left-0 -translate-x-full' : 'right-0 translate-x-full'} top-0 flex items-center gap-0.5 px-1.5 py-1 rounded-lg bg-popover/95 border border-border shadow-lg animate-[fadeIn_0.12s_ease] z-10`}>
          <button onClick={() => setShowReactionPicker(!showReactionPicker)} className="p-1 hover:bg-dex-hover rounded text-sm">😊</button>
          <button onClick={() => onReply(message)} className="p-1 hover:bg-dex-hover rounded text-sm">↩️</button>
          <button onClick={() => onForward(message)} className="p-1 hover:bg-dex-hover rounded text-sm">↗️</button>
          <button onClick={(e) => setContextMenu({ x: e.clientX, y: e.clientY })} className="p-1 hover:bg-dex-hover rounded text-sm">⋮</button>
        </div>
      )}

      {/* Reaction picker */}
      {showReactionPicker && (
        <div className={`absolute ${isOwn && !isChannel ? 'right-0' : 'left-0'} -top-12 flex gap-1 px-2 py-1.5 rounded-full bg-popover/95 backdrop-blur-xl border border-border shadow-lg animate-[reactionPickerIn_0.2s_cubic-bezier(0.34,1.56,0.64,1)] z-20`}>
          {QUICK_REACTIONS.map(emoji => (
            <button key={emoji} onClick={() => handleReaction(emoji)} className="text-lg hover:scale-[1.35] transition-transform duration-150 p-0.5">{emoji}</button>
          ))}
        </div>
      )}

      {contextMenu && (
        <ContextMenu
          x={contextMenu.x}
          y={contextMenu.y}
          items={contextItems}
          quickReactions={QUICK_REACTIONS}
          onReaction={(emoji) => { handleReaction(emoji); setContextMenu(null); }}
          onClose={() => setContextMenu(null)}
        />
      )}
    </div>
  );
};

export default MessageBubble;
