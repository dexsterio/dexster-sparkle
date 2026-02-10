import React, { useState } from 'react';
import { Message, Chat } from '@/types/chat';
import ContextMenu, { ContextMenuItem } from './ContextMenu';
import PollMessage from './PollMessage';

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
  onBookmark: (msg: Message) => void;
  onTranslate: (msgId: string) => void;
  onCopyLink: (msg: Message) => void;
  onSelect: (msgId: string) => void;
  onVotePoll: (msgId: string, optionIndex: number) => void;
  onOpenComments: (msgId: string) => void;
  selectMode: boolean;
  isSelected: boolean;
  onToggleSelect: (msgId: string) => void;
  searchHighlight: string;
  isSearchMatch: boolean;
  isCurrentSearchMatch: boolean;
}

// Enhanced text formatter — now accepts isOwn for contrast-aware inline styles
const formatText = (text: string, highlight?: string, isOwn?: boolean): React.ReactNode[] => {
  const parts: React.ReactNode[] = [];
  let key = 0;

  // Contrast-aware classes
  const codeBg = isOwn ? 'bg-black/30' : 'bg-white/[0.08]';
  const codeBlockBg = isOwn ? 'bg-black/40' : 'bg-white/[0.06]';
  const hashtagColor = isOwn ? 'text-white/80' : 'text-primary';
  const mentionColor = isOwn ? 'text-white font-semibold' : 'text-primary font-semibold';
  const linkColor = isOwn ? 'text-white/90 underline' : 'text-primary hover:underline';
  const bqBorder = isOwn ? 'border-white/30' : 'border-primary/50';
  const bqBg = isOwn ? 'bg-white/[0.06]' : 'bg-primary/[0.05]';
  const bqText = isOwn ? 'text-white/70' : 'text-muted-foreground';

  const processInline = (line: string): React.ReactNode[] => {
    const inlineParts: React.ReactNode[] = [];
    const regex = /(\*\*(.+?)\*\*|\*(.+?)\*|__(.+?)__|`(.+?)`|~~(.+?)~~|\|\|(.+?)\|\||#(\w+)|@(\w+)|(https?:\/\/[^\s]+))/g;
    let lastIdx = 0;
    let m;
    while ((m = regex.exec(line)) !== null) {
      if (m.index > lastIdx) {
        inlineParts.push(highlightText(line.slice(lastIdx, m.index), highlight, key++));
      }
      if (m[2]) inlineParts.push(<strong key={key++}>{highlightText(m[2], highlight, key)}</strong>);
      else if (m[3]) inlineParts.push(<em key={key++}>{highlightText(m[3], highlight, key)}</em>);
      else if (m[4]) inlineParts.push(<u key={key++}>{highlightText(m[4], highlight, key)}</u>);
      else if (m[5]) inlineParts.push(<code key={key++} className={`${codeBg} px-1.5 py-0.5 rounded text-[0.88em] font-mono`}>{m[5]}</code>);
      else if (m[6]) inlineParts.push(<s key={key++}>{highlightText(m[6], highlight, key)}</s>);
      else if (m[7]) inlineParts.push(<SpoilerText key={key++} text={m[7]} isOwn={isOwn} />);
      else if (m[8]) inlineParts.push(<span key={key++} className={`${hashtagColor} cursor-pointer hover:underline`}>#{m[8]}</span>);
      else if (m[9]) inlineParts.push(<span key={key++} className={`${mentionColor} cursor-pointer hover:underline`}>@{m[9]}</span>);
      else if (m[10]) inlineParts.push(<a key={key++} href={m[10]} target="_blank" rel="noopener noreferrer" className={`${linkColor} break-all`}>{m[10]}</a>);
      lastIdx = m.index + m[0].length;
    }
    if (lastIdx < line.length) inlineParts.push(highlightText(line.slice(lastIdx), highlight, key++));
    return inlineParts;
  };

  // Check for code blocks
  const codeBlockRegex = /```([\s\S]*?)```/g;
  let lastCodeIdx = 0;
  let codeMatch;
  const segments: { type: 'text' | 'code'; content: string }[] = [];
  while ((codeMatch = codeBlockRegex.exec(text)) !== null) {
    if (codeMatch.index > lastCodeIdx) segments.push({ type: 'text', content: text.slice(lastCodeIdx, codeMatch.index) });
    segments.push({ type: 'code', content: codeMatch[1] });
    lastCodeIdx = codeMatch.index + codeMatch[0].length;
  }
  if (lastCodeIdx < text.length) segments.push({ type: 'text', content: text.slice(lastCodeIdx) });
  if (segments.length === 0) segments.push({ type: 'text', content: text });

  segments.forEach((seg, si) => {
    if (seg.type === 'code') {
      parts.push(
        <pre key={`code-${si}`} className={`${codeBlockBg} rounded-lg p-3 my-1.5 text-xs font-mono overflow-x-auto`}>
          <code>{seg.content.trim()}</code>
        </pre>
      );
    } else {
      const textLines = seg.content.split('\n');
      textLines.forEach((line, li) => {
        if (li > 0) parts.push(<br key={`br-${si}-${li}`} />);
        if (line.startsWith('> ')) {
          parts.push(
            <div key={`bq-${si}-${li}`} className={`border-l-2 ${bqBorder} pl-2 py-0.5 my-1 ${bqText} italic ${bqBg} rounded-r`}>
              {processInline(line.slice(2))}
            </div>
          );
        } else {
          parts.push(<React.Fragment key={`line-${si}-${li}`}>{processInline(line)}</React.Fragment>);
        }
      });
    }
  });

  return parts;
};

const highlightText = (text: string, highlight: string | undefined, key: number): React.ReactNode => {
  if (!highlight || !text) return text;
  const idx = text.toLowerCase().indexOf(highlight.toLowerCase());
  if (idx === -1) return text;
  return (
    <React.Fragment key={`hl-${key}`}>
      {text.slice(0, idx)}
      <mark className="bg-dex-warning/40 text-foreground rounded px-0.5">{text.slice(idx, idx + highlight.length)}</mark>
      {text.slice(idx + highlight.length)}
    </React.Fragment>
  );
};

const SpoilerText: React.FC<{ text: string; isOwn?: boolean }> = ({ text, isOwn }) => {
  const [revealed, setRevealed] = useState(false);
  const spoilerBg = isOwn ? 'bg-white/30' : 'bg-muted-foreground/40';
  return (
    <span onClick={() => setRevealed(true)}
      className={`cursor-pointer transition-all duration-300 rounded px-0.5 ${revealed ? '' : `${spoilerBg} text-transparent select-none`}`}
      style={!revealed ? { textShadow: isOwn ? '0 0 8px rgba(255,255,255,0.4)' : '0 0 8px hsla(240, 20%, 85%, 0.7)' } : {}}>
      {text}
    </span>
  );
};

// Deterministic color from senderId
const getSenderColor = (senderId: string): string => {
  let hash = 0;
  for (let i = 0; i < senderId.length; i++) {
    hash = senderId.charCodeAt(i) + ((hash << 5) - hash);
  }
  const hue = ((hash % 360) + 360) % 360;
  return `${hue} 70% 60%`;
};

const MessageBubble: React.FC<MessageBubbleProps> = ({
  message, chat, onReply, onEdit, onDelete, onForward, onPin, onReaction,
  onBookmark, onTranslate, onCopyLink, onSelect, onVotePoll, onOpenComments,
  selectMode, isSelected, onToggleSelect, searchHighlight, isSearchMatch, isCurrentSearchMatch,
}) => {
  const [hovered, setHovered] = useState(false);
  const [contextMenu, setContextMenu] = useState<{ x: number; y: number } | null>(null);
  const [showReactionPicker, setShowReactionPicker] = useState(false);
  const [burst, setBurst] = useState<{ emoji: string; particles: { tx: number; ty: number; rot: number; scale: number }[] } | null>(null);
  const [showReactedBy, setShowReactedBy] = useState<string | null>(null);

  if (message.type === 'service') {
    return (
      <div id={`msg-${message.id}`} className="flex justify-center my-3 animate-[msgIn_0.2s_ease-out]">
        <span className="text-xs text-muted-foreground bg-dex-surface/60 px-3.5 py-1.5 rounded-xl">{message.serviceText}</span>
      </div>
    );
  }

  // Dice message
  if (message.type === 'dice' && message.diceResult) {
    return (
      <div id={`msg-${message.id}`} className={`flex ${message.isOwn ? 'justify-end' : 'justify-start'} mb-1 animate-[msgIn_0.2s_ease-out]`}>
        <div className={`px-4 py-3 rounded-2xl ${message.isOwn ? 'bg-gradient-to-br from-primary to-[hsl(252,60%,48%)]' : 'bg-dex-bubble-other'}`}>
          <div className="text-4xl text-center animate-[diceRoll_0.5s_ease-out]">{message.diceResult.emoji}</div>
          <div className="text-center text-2xl font-bold mt-1">{message.diceResult.value}</div>
          <div className={`text-[11px] text-center mt-1 ${message.isOwn ? 'text-white/55' : 'text-muted-foreground'}`}>{message.time}</div>
        </div>
      </div>
    );
  }

  const isChannel = chat.type === 'channel';
  const isGroup = chat.type === 'group';
  const isOwn = message.isOwn;

  // ── Contrast-aware color tokens (HIGH CONTRAST for own bubbles) ──
  // Apply high-contrast tokens to ALL own messages (including channel posts)
  const ownBubble = isOwn;
  const metaColor = ownBubble ? 'text-white/60' : 'text-muted-foreground';
  const replyBg = ownBubble ? 'bg-white/[0.22]' : 'bg-primary/[0.08]';
  const replyBorder = ownBubble ? 'border-white/70' : 'border-primary';
  const replyName = ownBubble ? 'text-white font-bold' : 'text-primary';
  const replyText = ownBubble ? 'text-white/85' : 'text-muted-foreground';
  const fwdColor = ownBubble ? 'text-white/80' : 'text-primary/70';
  const fwdBorder = ownBubble ? 'border-white/50' : 'border-primary/30';
  const pinColor = ownBubble ? 'text-white/80' : 'text-primary';
  const indicatorColor = ownBubble ? 'text-white/65' : 'text-primary/60';
  const channelFooterColor = ownBubble ? 'text-white/60' : 'text-muted-foreground';

  const handleContextMenu = (e: React.MouseEvent) => {
    e.preventDefault();
    if (selectMode) { onToggleSelect(message.id); return; }
    setContextMenu({ x: e.clientX, y: e.clientY });
  };

  const handleDoubleClick = () => {
    if (selectMode) return;
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
    { label: message.pinned ? 'Unpin' : 'Pin', icon: '📌', onClick: () => onPin(message) },
    { label: 'Forward', icon: '↗️', onClick: () => onForward(message) },
    { label: 'Save', icon: '🔖', onClick: () => onBookmark(message) },
    ...(isChannel ? [{ label: 'Copy Link', icon: '🔗', onClick: () => onCopyLink(message) }] : []),
    { label: message.translated ? 'Show Original' : 'Translate', icon: '🌐', onClick: () => onTranslate(message.id) },
    { label: 'Select', icon: '✅', onClick: () => onSelect(message.id), dividerAfter: true },
    { label: 'Delete', icon: '🗑️', shortcut: 'Del', danger: true, onClick: () => onDelete(message) },
  ];

  const displayText = message.translated || message.text;

  return (
    <div
      id={`msg-${message.id}`}
      className={`flex ${isOwn && !isChannel ? 'justify-end' : 'justify-start'} mb-1.5 relative group animate-[msgIn_0.2s_ease-out] ${isCurrentSearchMatch ? 'bg-dex-warning/10 rounded-lg' : isSearchMatch ? 'bg-primary/[0.05] rounded-lg' : ''}`}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => { setHovered(false); setShowReactionPicker(false); setShowReactedBy(null); }}
      onContextMenu={handleContextMenu}
      onDoubleClick={handleDoubleClick}
      onClick={selectMode ? () => onToggleSelect(message.id) : undefined}
    >
      {/* Select checkbox */}
      {selectMode && (
        <div className="flex items-center mr-2 flex-shrink-0">
          <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center transition-colors ${isSelected ? 'border-primary bg-primary' : 'border-muted-foreground/40'}`}>
            {isSelected && <span className="text-white text-xs">✓</span>}
          </div>
        </div>
      )}

      <div
        className={`relative px-3 py-2 ${isChannel ? 'w-full max-w-full rounded-xl bg-dex-bubble-other py-4' : isOwn ? 'max-w-[480px] rounded-[18px_18px_4px_18px] bg-gradient-to-br from-primary to-[hsl(252,60%,48%)]' : 'max-w-[480px] rounded-[18px_18px_18px_4px] bg-dex-bubble-other'} ${message.pinned ? `border ${isOwn ? 'border-white/20' : 'border-primary/30'}` : ''} ${isSelected ? 'ring-2 ring-primary/50' : ''}`}
      >
        {/* Scheduled indicator */}
        {message.scheduled && (
          <div className={`flex items-center gap-1 text-[10px] ${indicatorColor} mb-1`}>🕐 Scheduled: {message.scheduledTime}</div>
        )}

        {message.pinned && <div className={`flex items-center gap-1 text-[10px] ${pinColor} mb-1`}>📌 Pinned</div>}

        {message.forwarded && (
          <div className={`flex items-center gap-1 text-xs ${fwdColor} italic mb-1 border-l-2 ${fwdBorder} pl-2`}>
            ↗️ Forwarded from {message.forwarded.from}
          </div>
        )}

        {message.replyTo && (
          <div className={`border-l-2 ${replyBorder} pl-2 mb-1.5 rounded ${replyBg} px-2 py-1`}>
            <div className={`text-xs font-semibold ${replyName}`}>{message.replyTo.senderName}</div>
            <div className={`text-xs ${replyText} truncate max-w-[300px]`}>{message.replyTo.text}</div>
          </div>
        )}

        {isGroup && !isOwn && (
          <div className="text-xs font-semibold mb-0.5" style={{ color: `hsl(${chat.members?.find(m => m.id === message.senderId)?.color || '252 75% 64%'})` }}>
            {message.senderName}
            {chat.members?.find(m => m.id === message.senderId) && message.senderId === chat.members[0]?.id && (
              <span className="ml-1 text-[10px] text-muted-foreground bg-muted/50 px-1 rounded">admin</span>
            )}
          </div>
        )}

        {/* Channel sender name with unique color */}
        {isChannel && (
          <div className="text-xs font-semibold mb-1" style={{ color: `hsl(${getSenderColor(message.senderId)})` }}>
            {message.senderName || chat.name}
            {chat.admins?.find(a => a.userId === message.senderId) && (
              <span className="ml-1.5 text-[10px] text-muted-foreground bg-muted/50 px-1 rounded">
                {chat.admins.find(a => a.userId === message.senderId)?.title || 'admin'}
              </span>
            )}
          </div>
        )}

        {/* Poll */}
        {message.type === 'poll' && message.pollData && (
          <PollMessage pollData={message.pollData} onVote={(idx) => onVotePoll(message.id, idx)} isOwn={isOwn && !isChannel} />
        )}

        {/* GIF content */}
        {message.type === 'gif' && message.gifUrl && (
          <div className="rounded-lg overflow-hidden max-w-[280px]">
            <img src={message.gifUrl} alt="GIF" className="w-full h-auto rounded-lg" loading="lazy" />
          </div>
        )}

        {/* Text content */}
        {message.type === 'message' && (
          <div className="text-sm leading-relaxed whitespace-pre-wrap break-words">
            {formatText(displayText, searchHighlight || undefined, isOwn && !isChannel)}
          </div>
        )}

        {/* Translated indicator */}
        {message.translated && (
          <div className={`text-[10px] ${indicatorColor} mt-1`}>🌐 Translated</div>
        )}

        {/* Effect indicator */}
        {message.effect && (
          <div className={`text-[10px] mt-0.5 ${isOwn && !isChannel ? 'text-white/50' : 'opacity-60'}`}>
            {message.effect === 'confetti' ? '🎊' : message.effect === 'fireworks' ? '🎆' : '❤️'} Sent with {message.effect}
          </div>
        )}

        {/* Silent indicator */}
        {message.silentSend && (
          <div className={`text-[10px] mt-0.5 ${isOwn && !isChannel ? 'text-white/45' : 'opacity-50'}`}>🔕 Sent silently</div>
        )}

        {/* Channel footer */}
        {isChannel && message.type === 'message' && (
          <div className={`flex items-center gap-3 mt-2.5 text-xs ${channelFooterColor}`}>
            {message.views !== undefined && <span>👁 {message.views >= 1000 ? `${(message.views / 1000).toFixed(1)}K` : message.views}</span>}
            {message.comments !== undefined && (
              <button onClick={(e) => { e.stopPropagation(); onOpenComments(message.id); }} className="hover:text-primary transition-colors">
                💬 {message.comments}
              </button>
            )}
            {message.shares !== undefined && <span>↗️ {message.shares}</span>}
            <span className="ml-auto">{message.time}</span>
          </div>
        )}

        {/* Non-channel footer */}
        {!isChannel && message.type !== 'poll' && (
          <div className={`flex items-center justify-end gap-1 mt-0.5 text-[11px] flex-shrink-0 whitespace-nowrap ${metaColor}`}>
            {message.edited && <span>edited</span>}
            <span>{message.time}</span>
            {isOwn && !message.scheduled && (
              <span className="ml-0.5">
                {message.read ? (
                  <svg width="16" height="11" viewBox="0 0 16 11" fill="none"><path d="M1 5.5L4.5 9L11 2" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" opacity="0.7"/><path d="M5 5.5L8.5 9L15 2" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" opacity="0.7"/></svg>
                ) : (
                  <svg width="12" height="11" viewBox="0 0 12 11" fill="none"><path d="M1 5.5L4.5 9L11 2" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" opacity="0.45"/></svg>
                )}
              </span>
            )}
            {message.scheduled && <span className="ml-0.5">🕐</span>}
          </div>
        )}

        {/* Reactions */}
        {message.reactions && message.reactions.length > 0 && (
          <div className="flex flex-wrap gap-1 mt-1.5 relative">
            {message.reactions.map((r, i) => {
              const isMine = r.users.includes('me');
              return (
                <button key={i} onClick={() => handleReaction(r.emoji)}
                  onMouseEnter={() => setShowReactedBy(r.emoji)}
                  onMouseLeave={() => setShowReactedBy(null)}
                  className={`relative flex items-center gap-1 px-2 py-0.5 rounded-xl text-[11.5px] font-semibold transition-transform duration-150 hover:scale-110 ${isMine ? 'bg-primary/25 border border-primary/40' : 'bg-white/[0.07] border border-white/[0.08]'}`}>
                  {r.emoji} {r.users.length}
                  {/* Who reacted tooltip */}
                  {showReactedBy === r.emoji && (
                    <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-1 px-2 py-1 rounded-lg bg-popover border border-border shadow-lg text-[10px] text-foreground whitespace-nowrap z-20 animate-[fadeIn_0.1s_ease]">
                      {r.users.map(u => u === 'me' ? 'You' : u).join(', ')}
                    </div>
                  )}
                </button>
              );
            })}
          </div>
        )}

        {/* Burst animation */}
        {burst && (
          <div className="absolute inset-0 pointer-events-none flex items-center justify-center">
            {burst.particles.map((p, i) => (
              <span key={i} className="absolute text-lg"
                style={{ '--tx': `${p.tx}px`, '--ty': `${p.ty}px`, animation: `reactionBurst 0.7s ease-out forwards`, animationDelay: `${i * 0.05}s` } as React.CSSProperties}>
                {burst.emoji}
              </span>
            ))}
          </div>
        )}
      </div>

      {/* Hover actions — position left of own bubbles, right of others */}
      {hovered && !contextMenu && !selectMode && (
        <div className={`absolute ${isOwn && !isChannel ? 'right-auto left-0 -translate-x-[calc(100%+4px)]' : 'left-auto right-0 translate-x-[calc(100%+4px)]'} top-0 flex items-center gap-0.5 px-1.5 py-1 rounded-lg bg-popover border border-border shadow-lg animate-[fadeIn_0.12s_ease] z-10`}>
          <button onClick={() => setShowReactionPicker(!showReactionPicker)} className="p-1 hover:bg-dex-hover rounded text-sm">😊</button>
          <button onClick={() => onReply(message)} className="p-1 hover:bg-dex-hover rounded text-sm">↩️</button>
          <button onClick={() => onForward(message)} className="p-1 hover:bg-dex-hover rounded text-sm">↗️</button>
          <button onClick={(e) => setContextMenu({ x: e.clientX, y: e.clientY })} className="p-1 hover:bg-dex-hover rounded text-sm">⋮</button>
        </div>
      )}

      {/* Reaction picker */}
      {showReactionPicker && (
        <div className={`absolute ${isOwn && !isChannel ? 'right-0' : 'left-0'} -top-12 flex gap-1 px-2 py-1.5 rounded-full bg-popover border border-border shadow-lg animate-[reactionPickerIn_0.2s_cubic-bezier(0.34,1.56,0.64,1)] z-20`}>
          {QUICK_REACTIONS.map(emoji => (
            <button key={emoji} onClick={() => handleReaction(emoji)} className="text-lg hover:scale-[1.35] transition-transform duration-150 p-0.5">{emoji}</button>
          ))}
        </div>
      )}

      {contextMenu && (
        <ContextMenu x={contextMenu.x} y={contextMenu.y} items={contextItems}
          quickReactions={QUICK_REACTIONS} onReaction={(emoji) => { handleReaction(emoji); setContextMenu(null); }}
          onClose={() => setContextMenu(null)} />
      )}
    </div>
  );
};

export default MessageBubble;
