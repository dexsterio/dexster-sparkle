import React, { useState, useRef, useEffect, useCallback } from 'react';
import { Chat, Message, MessageEffect } from '@/types/chat';
import MessageBubble from './MessageBubble';
import EmojiPicker from './EmojiPicker';
import { Search, MoreVertical, ArrowDown, ArrowUp, X, Paperclip, Smile, Mic, Send, Check, Type, Clock, Sparkles } from 'lucide-react';

interface ChatAreaProps {
  chat: Chat;
  messages: Message[];
  onSendMessage: (text: string, options?: { silent?: boolean; effect?: MessageEffect }) => void;
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
  replyTo: Message | null;
  editMsg: Message | null;
  onCancelReply: () => void;
  onCancelEdit: () => void;
  onSaveEdit: (text: string) => void;
  onHeaderClick: () => void;
  typingUsers: string[];
  selectMode: boolean;
  selectedMessages: Set<string>;
  onToggleSelect: (msgId: string) => void;
  onSelectAll: () => void;
  onExitSelect: () => void;
  onBulkDelete: () => void;
  onBulkForward: () => void;
  onBulkCopy: () => void;
  showSearch: boolean;
  onToggleSearch: () => void;
  searchQuery: string;
  onSearchChange: (q: string) => void;
  searchResults: string[];
  searchIndex: number;
  onNavigateSearch: (dir: 'up' | 'down') => void;
  recentEmojis: string[];
  pinnedIndex: number;
  onCyclePinned: () => string | undefined;
  draft?: string;
  onCreatePoll: () => void;
  onRollDice: (emoji: string) => void;
  onSchedule: (text: string) => void;
  pendingEffect: MessageEffect | null;
  onSetEffect: (effect: MessageEffect | null) => void;
  onToggleEffectPicker: () => void;
  showEffectPicker: boolean;
}

const DICE_EMOJIS = ['🎲', '🎯', '🏀', '⚽', '🎰', '🎳'];

const ChatArea: React.FC<ChatAreaProps> = ({
  chat, messages, onSendMessage, onReply, onEdit, onDelete, onForward, onPin, onReaction,
  onBookmark, onTranslate, onCopyLink, onSelect, onVotePoll, onOpenComments,
  replyTo, editMsg, onCancelReply, onCancelEdit, onSaveEdit, onHeaderClick, typingUsers,
  selectMode, selectedMessages, onToggleSelect, onSelectAll, onExitSelect, onBulkDelete, onBulkForward, onBulkCopy,
  showSearch, onToggleSearch, searchQuery, onSearchChange, searchResults, searchIndex, onNavigateSearch,
  recentEmojis, pinnedIndex, onCyclePinned, draft,
  onCreatePoll, onRollDice, onSchedule,
  pendingEffect, onSetEffect, onToggleEffectPicker, showEffectPicker,
}) => {
  const [inputText, setInputText] = useState('');
  const [showFormatBar, setShowFormatBar] = useState(false);
  const [showScrollBtn, setShowScrollBtn] = useState(false);
  const [showEmojiPicker, setShowEmojiPicker] = useState(false);
  const [showAttachMenu, setShowAttachMenu] = useState(false);
  const [newMsgCount, setNewMsgCount] = useState(0);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const prevMsgCountRef = useRef(messages.length);
  const prevHeightRef = useRef(20);

  // Restore draft
  useEffect(() => {
    if (draft && !editMsg) setInputText(draft);
    else if (!editMsg) setInputText('');
  }, [chat.id]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages.length]);

  useEffect(() => {
    if (editMsg) {
      setInputText(editMsg.text);
      textareaRef.current?.focus();
    }
  }, [editMsg]);

  // Track new messages for badge
  useEffect(() => {
    if (showScrollBtn && messages.length > prevMsgCountRef.current) {
      setNewMsgCount(prev => prev + (messages.length - prevMsgCountRef.current));
    } else if (!showScrollBtn) {
      setNewMsgCount(0);
    }
    prevMsgCountRef.current = messages.length;
  }, [messages.length, showScrollBtn]);

  const handleScroll = useCallback(() => {
    if (!containerRef.current) return;
    const { scrollTop, scrollHeight, clientHeight } = containerRef.current;
    const atBottom = scrollHeight - scrollTop - clientHeight < 200;
    setShowScrollBtn(!atBottom);
    if (atBottom) setNewMsgCount(0);
  }, []);

  const handleSend = (silent?: boolean) => {
    const text = inputText.trim();
    if (!text) return;
    if (editMsg) {
      onSaveEdit(text);
    } else {
      onSendMessage(text, { silent, effect: pendingEffect || undefined });
    }
    setInputText('');
    onSetEffect(null);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      if (e.ctrlKey) {
        handleSend(true);
      } else {
        handleSend();
      }
    }
  };

  // Textarea auto-expand — only reset when content actually changes
  useEffect(() => {
    if (textareaRef.current) {
      const ta = textareaRef.current;
      ta.style.height = '20px';
      const newHeight = Math.min(ta.scrollHeight, 120);
      if (newHeight !== prevHeightRef.current) {
        prevHeightRef.current = newHeight;
      }
      ta.style.height = newHeight + 'px';
    }
  }, [inputText]);

  const insertEmoji = (emoji: string) => {
    setInputText(prev => prev + emoji);
    textareaRef.current?.focus();
  };

  const insertFormat = (wrap: string) => {
    const ta = textareaRef.current;
    if (!ta) return;
    const start = ta.selectionStart;
    const end = ta.selectionEnd;
    const selected = inputText.slice(start, end);
    const newText = inputText.slice(0, start) + wrap + (selected || 'text') + wrap + inputText.slice(end);
    setInputText(newText);
    setTimeout(() => {
      ta.focus();
      const pos = start + wrap.length;
      ta.setSelectionRange(pos, pos + (selected || 'text').length);
    }, 0);
  };

  // Group messages by date
  const groupedMessages: { date: string; label: string; msgs: Message[] }[] = [];
  let currentDate = '';
  for (const msg of messages) {
    if (msg.date !== currentDate) {
      currentDate = msg.date;
      const d = new Date(msg.date);
      const today = new Date('2026-02-10');
      const yesterday = new Date('2026-02-09');
      let label = d.toLocaleDateString('en-US', { month: 'long', day: 'numeric' });
      if (d.toDateString() === today.toDateString()) label = 'Today';
      else if (d.toDateString() === yesterday.toDateString()) label = 'Yesterday';
      groupedMessages.push({ date: msg.date, label, msgs: [] });
    }
    groupedMessages[groupedMessages.length - 1].msgs.push(msg);
  }

  // Find first unread message
  const firstUnreadId = messages.find(m => !m.read && !m.isOwn)?.id;

  const pinnedMessages = messages.filter(m => m.pinned);
  const currentPinned = pinnedMessages[pinnedIndex] || pinnedMessages[0];

  const typingText = typingUsers.length === 1
    ? `${typingUsers[0]} is typing`
    : typingUsers.length === 2
    ? `${typingUsers[0]} and ${typingUsers[1]} are typing`
    : typingUsers.length > 2
    ? `${typingUsers.length} users are typing`
    : null;

  const statusText = chat.online
    ? 'online'
    : chat.type === 'group'
    ? `${chat.memberCount} members`
    : chat.type === 'channel'
    ? `${chat.subscriberCount?.toLocaleString()} subscribers`
    : chat.lastSeen || 'offline';

  const scrollToMessage = (msgId: string) => {
    const el = document.getElementById(`msg-${msgId}`);
    if (el) {
      el.scrollIntoView({ behavior: 'smooth', block: 'center' });
      el.classList.add('animate-[highlight_1.5s_ease]');
      setTimeout(() => el.classList.remove('animate-[highlight_1.5s_ease]'), 1500);
    }
  };

  return (
    <div className="flex-1 flex flex-col min-w-0 bg-background relative">
      {/* Chat Header */}
      <div className="flex items-center gap-3 px-4 py-3 border-b border-border cursor-pointer hover:bg-dex-hover/50 transition-colors" onClick={onHeaderClick}>
        <div className="relative">
          <div className="w-10 h-10 rounded-full flex items-center justify-center text-sm font-semibold text-white" style={{ background: `hsl(${chat.avatarColor})` }}>
            {chat.avatar}
          </div>
          {chat.online && <div className="absolute bottom-0 right-0 w-3 h-3 rounded-full bg-dex-online border-2 border-background" />}
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2">
            <h2 className="text-sm font-semibold text-foreground truncate">{chat.name}</h2>
            {chat.autoDeleteTimer && <Clock size={12} className="text-muted-foreground" />}
          </div>
          <p className="text-xs text-muted-foreground">
            {typingText ? (
              <span className="text-primary">
                {typingText}
                <span className="inline-flex ml-1 gap-0.5">
                  {[0, 1, 2].map(i => (
                    <span key={i} className="w-1.5 h-1.5 rounded-full bg-primary inline-block" style={{ animation: `typing 1.4s infinite`, animationDelay: `${i * 0.2}s` }} />
                  ))}
                </span>
              </span>
            ) : statusText}
          </p>
        </div>
        <div className="flex items-center gap-2">
          <button className="p-2 rounded-lg hover:bg-dex-hover transition-colors text-muted-foreground" onClick={e => { e.stopPropagation(); onToggleSearch(); }}>
            <Search size={18} />
          </button>
          <button className="p-2 rounded-lg hover:bg-dex-hover transition-colors text-muted-foreground" onClick={e => e.stopPropagation()}>
            <MoreVertical size={18} />
          </button>
        </div>
      </div>

      {/* In-chat Search Bar */}
      {showSearch && (
        <div className="flex items-center gap-2 px-4 py-2 bg-card border-b border-border animate-[slideDown_0.2s_ease-out]">
          <Search size={16} className="text-muted-foreground" />
          <input autoFocus value={searchQuery} onChange={e => onSearchChange(e.target.value)} placeholder="Search in chat..."
            className="flex-1 bg-transparent text-sm text-foreground placeholder:text-muted-foreground/50 focus:outline-none" />
          {searchResults.length > 0 && (
            <span className="text-xs text-muted-foreground">{searchIndex + 1} of {searchResults.length}</span>
          )}
          <button onClick={() => onNavigateSearch('up')} className="p-1 rounded hover:bg-dex-hover text-muted-foreground"><ArrowUp size={14} /></button>
          <button onClick={() => onNavigateSearch('down')} className="p-1 rounded hover:bg-dex-hover text-muted-foreground"><ArrowDown size={14} /></button>
          <button onClick={onToggleSearch} className="p-1 rounded hover:bg-dex-hover text-muted-foreground"><X size={14} /></button>
        </div>
      )}

      {/* Pin Banner */}
      {pinnedMessages.length > 0 && !showSearch && (
        <div className="flex items-center gap-2 px-4 py-2 bg-primary/[0.12] border-b border-primary/25 animate-[slideDown_0.2s_ease-out] cursor-pointer"
          onClick={() => { const id = onCyclePinned(); if (id) scrollToMessage(id); }}>
          <div className="w-0.5 h-8 bg-primary rounded-full" />
          <div className="flex-1 min-w-0">
            <div className="text-[11px] font-semibold text-primary">📌 Pinned Message</div>
            <div className="text-xs text-muted-foreground truncate">{currentPinned?.text}</div>
          </div>
          {pinnedMessages.length > 1 && <span className="text-[10px] text-muted-foreground">{(pinnedIndex % pinnedMessages.length) + 1} of {pinnedMessages.length}</span>}
        </div>
      )}

      {/* Channel info banner */}
      {chat.type === 'channel' && chat.description && (
        <div className="px-4 py-2 border-b border-border text-xs text-muted-foreground">
          {chat.isPublic ? 'Public' : 'Private'} Channel · {chat.description}
        </div>
      )}

      {/* Messages */}
      <div ref={containerRef} onScroll={handleScroll} className="flex-1 overflow-y-auto px-4 py-2">
        {groupedMessages.map(group => (
          <React.Fragment key={group.date}>
            <div className="flex justify-center my-3 sticky top-0 z-10">
              <span className="text-xs text-muted-foreground bg-dex-surface/90 backdrop-blur-sm px-3.5 py-1 rounded-xl shadow-sm">{group.label}</span>
            </div>
            {group.msgs.map(msg => (
              <React.Fragment key={msg.id}>
                {msg.id === firstUnreadId && (
                  <div className="flex items-center gap-3 my-3 py-1">
                    <div className="flex-1 h-px bg-primary/40" />
                    <span className="text-[11px] font-bold text-primary uppercase tracking-wider">Unread Messages</span>
                    <div className="flex-1 h-px bg-primary/40" />
                  </div>
                )}
                <MessageBubble
                  message={msg}
                  chat={chat}
                  onReply={onReply}
                  onEdit={onEdit}
                  onDelete={onDelete}
                  onForward={onForward}
                  onPin={onPin}
                  onReaction={onReaction}
                  onBookmark={onBookmark}
                  onTranslate={onTranslate}
                  onCopyLink={onCopyLink}
                  onSelect={onSelect}
                  onVotePoll={onVotePoll}
                  onOpenComments={onOpenComments}
                  selectMode={selectMode}
                  isSelected={selectedMessages?.has(msg.id) ?? false}
                  onToggleSelect={onToggleSelect}
                  searchHighlight={searchQuery}
                  isSearchMatch={(searchResults || []).includes(msg.id)}
                  isCurrentSearchMatch={(searchResults || [])[searchIndex] === msg.id}
                />
              </React.Fragment>
            ))}
          </React.Fragment>
        ))}
        <div ref={messagesEndRef} />
      </div>

      {/* Scroll to bottom FAB — smooth transition */}
      <div
        className={`absolute bottom-24 right-6 z-10 transition-all duration-200 ${showScrollBtn ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4 pointer-events-none'}`}
      >
        <button
          onClick={() => { messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' }); setNewMsgCount(0); }}
          className="w-10 h-10 rounded-full bg-card border border-border shadow-lg flex items-center justify-center text-muted-foreground hover:bg-dex-hover transition-colors"
        >
          <ArrowDown size={18} />
          {newMsgCount > 0 && (
            <span className="absolute -top-2 -right-1 bg-primary text-primary-foreground text-[10px] font-bold px-1.5 rounded-full min-w-[18px] text-center">{newMsgCount}</span>
          )}
        </button>
      </div>

      {/* Select Mode Toolbar */}
      {selectMode && (
        <div className="flex items-center gap-2 px-4 py-2.5 bg-card border-t border-border animate-[slideUp_0.2s_ease-out]">
          <button onClick={onExitSelect} className="p-1.5 rounded-lg hover:bg-dex-hover text-muted-foreground"><X size={16} /></button>
          <span className="text-sm text-foreground font-medium flex-1">{selectedMessages.size} selected</span>
          <button onClick={onSelectAll} className="px-3 py-1.5 rounded-lg text-xs font-medium bg-muted hover:bg-muted/80 text-foreground h-8">Select All</button>
          <button onClick={onBulkCopy} disabled={selectedMessages.size === 0} className="px-3 py-1.5 rounded-lg text-xs font-medium bg-muted hover:bg-muted/80 text-foreground disabled:opacity-40 h-8">📋 Copy</button>
          <button onClick={onBulkForward} disabled={selectedMessages.size === 0} className="px-3 py-1.5 rounded-lg text-xs font-medium bg-muted hover:bg-muted/80 text-foreground disabled:opacity-40 h-8">↗️ Forward</button>
          <button onClick={onBulkDelete} disabled={selectedMessages.size === 0} className="px-3 py-1.5 rounded-lg text-xs font-medium bg-destructive/20 hover:bg-destructive/30 text-destructive disabled:opacity-40 h-8">🗑️ Delete</button>
        </div>
      )}

      {/* Reply/Edit Preview */}
      {(replyTo || editMsg) && !selectMode && (
        <div className={`flex items-center gap-2 px-4 py-2 border-t ${editMsg ? 'border-dex-warning/30' : 'border-primary/30'}`}>
          <div className={`w-0.5 h-8 rounded-full ${editMsg ? 'bg-dex-warning' : 'bg-primary'}`} />
          <div className="flex-1 min-w-0">
            <div className={`text-[11px] font-semibold ${editMsg ? 'text-dex-warning' : 'text-primary'}`}>
              {editMsg ? 'Edit Message' : `Reply to ${replyTo?.senderName}`}
            </div>
            <div className="text-xs text-muted-foreground truncate">{editMsg?.text || replyTo?.text}</div>
          </div>
          <button onClick={editMsg ? onCancelEdit : onCancelReply} className="p-1 rounded hover:bg-dex-hover text-muted-foreground">
            <X size={16} />
          </button>
        </div>
      )}

      {/* Format Toolbar */}
      {showFormatBar && !selectMode && (
        <div className="flex items-center gap-1 px-4 py-1.5 border-t border-border animate-[slideDown_0.15s_ease-out]">
          {[
            { label: 'B', wrap: '**' }, { label: 'I', wrap: '*' }, { label: 'U', wrap: '__' },
            { label: 'S', wrap: '~~' }, { label: '<>', wrap: '`' }, { label: '||Spoiler||', wrap: '||' },
            { label: '> Quote', wrap: '> ' },
          ].map(f => (
            <button key={f.label} onClick={() => insertFormat(f.wrap)}
              className="px-2.5 py-1 rounded text-xs font-semibold bg-muted/50 hover:bg-primary/20 active:bg-primary/30 text-foreground transition-colors">
              {f.label}
            </button>
          ))}
        </div>
      )}

      {/* Input Area */}
      {!selectMode && (
        <div className="flex items-end gap-2 px-4 py-3 border-t border-border relative">
          <button onClick={() => setShowFormatBar(!showFormatBar)} className="p-2 rounded-lg hover:bg-dex-hover text-muted-foreground flex-shrink-0">
            <Type size={18} />
          </button>

          {/* Attach Menu */}
          <div className="relative">
            <button onClick={() => setShowAttachMenu(!showAttachMenu)} className="p-2 rounded-lg hover:bg-dex-hover text-muted-foreground flex-shrink-0">
              <Paperclip size={18} />
            </button>
            {showAttachMenu && (
              <div className="absolute bottom-full left-0 mb-2 bg-popover border border-border rounded-xl shadow-xl z-30 min-w-[180px] animate-[contextIn_0.15s_ease-out]">
                {[
                  { label: '📷 Photo/Video', action: () => {} },
                  { label: '📄 Document', action: () => {} },
                  { label: '📊 Poll', action: () => { setShowAttachMenu(false); onCreatePoll(); } },
                  { label: '📍 Location', action: () => {} },
                  { label: '👤 Contact', action: () => {} },
                ].map(item => (
                  <button key={item.label} onClick={() => { item.action(); setShowAttachMenu(false); }}
                    className="flex items-center gap-3 w-full px-4 py-2.5 text-sm hover:bg-dex-hover text-foreground transition-colors">{item.label}</button>
                ))}
                <div className="h-px bg-border mx-3 my-1" />
                <div className="px-4 py-1.5 text-[10px] text-muted-foreground uppercase tracking-wider font-semibold">Roll Dice</div>
                <div className="flex gap-1.5 px-3 pb-2.5">
                  {DICE_EMOJIS.map(emoji => (
                    <button key={emoji} onClick={() => { onRollDice(emoji); setShowAttachMenu(false); }}
                      className="text-xl p-1.5 hover:scale-125 transition-transform rounded-lg hover:bg-dex-hover">{emoji}</button>
                  ))}
                </div>
              </div>
            )}
          </div>

          <div className="flex-1 flex items-end bg-muted rounded-[20px] px-3 py-1.5 relative border border-border/50">
            <textarea ref={textareaRef} value={inputText} onChange={e => setInputText(e.target.value)} onKeyDown={handleKeyDown}
              placeholder={chat.type === 'channel' ? 'Broadcast a message...' : 'Message...'} rows={1}
              className="flex-1 bg-transparent text-sm text-foreground placeholder:text-muted-foreground/50 resize-none focus:outline-none leading-5"
              style={{ minHeight: '20px', maxHeight: '120px' }} />
            <button onClick={() => setShowEmojiPicker(!showEmojiPicker)} className="p-1 text-muted-foreground hover:text-foreground ml-1 flex-shrink-0 transition-colors">
              <Smile size={18} />
            </button>
            {showEmojiPicker && (
              <EmojiPicker onSelect={insertEmoji} onClose={() => setShowEmojiPicker(false)} recentEmojis={recentEmojis} />
            )}
          </div>

          {/* Send with effect / schedule */}
          {inputText.trim() && (
            <div className="relative">
              <button onClick={() => onToggleEffectPicker()} className="p-2 rounded-lg hover:bg-dex-hover text-muted-foreground flex-shrink-0">
                <Sparkles size={16} />
              </button>
              {showEffectPicker && (
                <div className="absolute bottom-full right-0 mb-2 bg-popover border border-border rounded-xl shadow-xl z-30 min-w-[150px] animate-[contextIn_0.15s_ease-out]">
                  {([['🎊 Confetti', 'confetti'], ['🎆 Fireworks', 'fireworks'], ['❤️ Hearts', 'hearts']] as const).map(([label, effect]) => (
                    <button key={effect} onClick={() => { onSetEffect(pendingEffect === effect ? null : effect); onToggleEffectPicker(); }}
                      className={`flex items-center gap-2 w-full px-4 py-2.5 text-sm hover:bg-dex-hover text-foreground transition-colors ${pendingEffect === effect ? 'bg-primary/10' : ''}`}>{label}</button>
                  ))}
                  <div className="h-px bg-border mx-3 my-1" />
                  <button onClick={() => { onSchedule(inputText); onToggleEffectPicker(); }}
                    className="flex items-center gap-2 w-full px-4 py-2.5 text-sm hover:bg-dex-hover text-foreground transition-colors">
                    <Clock size={14} /> Schedule
                  </button>
                </div>
              )}
            </div>
          )}

          <button onClick={() => handleSend()}
            className={`p-2.5 rounded-full flex-shrink-0 transition-all duration-200 ease-out ${inputText.trim() ? 'bg-gradient-to-br from-primary to-[hsl(252,60%,48%)] text-primary-foreground scale-100' : 'text-muted-foreground scale-95'}`}>
            {editMsg ? <Check size={18} /> : inputText.trim() ? <Send size={18} /> : <Mic size={18} />}
          </button>

          {pendingEffect && (
            <div className="flex items-center gap-1 text-xs bg-primary/20 text-primary px-2 py-0.5 rounded-full ml-1 flex-shrink-0">
              {pendingEffect === 'confetti' ? '🎊' : pendingEffect === 'fireworks' ? '🎆' : '❤️'} {pendingEffect}
              <button onClick={() => onSetEffect(null)} className="ml-0.5 hover:text-destructive">✕</button>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default ChatArea;
