import React, { useState, useRef, useEffect, useCallback } from 'react';
import { Chat, Message, MessageEffect } from '@/types/chat';
import MessageBubble from './MessageBubble';
import EmojiPicker from './EmojiPicker';
import GifPicker from './GifPicker';
import { Sheet, SheetContent } from '@/components/ui/sheet';
import { Search, MoreVertical, ArrowDown, ArrowUp, ArrowLeft, X, Paperclip, Smile, Mic, Send, Check, Type, Clock, Sparkles, Bell, BellOff, Settings, BarChart3, Trash2, LogOut, Ban, UserPlus, Image } from 'lucide-react';
import VoiceRecorder from './VoiceRecorder';

interface ChatAreaProps {
  chat: Chat;
  messages: Message[];
  onSendMessage: (text: string, options?: { silent?: boolean; effect?: MessageEffect }) => void;
  onSendGif: (gifUrl: string) => void;
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
  onMuteChat: () => void;
  onClearHistory: () => void;
  onLeaveChat: () => void;
  onBlockUser: () => void;
  onDeleteChat: () => void;
  onManageChannel: () => void;
  onManageGroup: () => void;
  onReport: () => void;
  slowMode?: number;
  slowModeRemaining?: number;
  isMobile?: boolean;
  onBack?: () => void;
  requestStatus?: 'none' | 'pending_sent' | 'pending_received' | 'accepted' | 'rejected';
  onAcceptRequest?: () => void;
  onRejectRequest?: () => void;
  requestRecipientName?: string;
  onImageSelect?: (file: File) => void;
  onVideoSelect?: (file: File) => void;
  onFileSelect?: (file: File) => void;
  isUploading?: boolean;
  uploadProgress?: number;
  onSendTyping?: () => void;
  activeEffect?: { effect: MessageEffect; id: string } | null;
  onVoiceSend?: (blob: Blob, duration: number) => void;
}

const DICE_EMOJIS = ['🎲', '🎯', '🏀', '⚽', '🎰', '🎳'];

const ChatArea: React.FC<ChatAreaProps> = ({
  chat, messages, onSendMessage, onSendGif, onReply, onEdit, onDelete, onForward, onPin, onReaction,
  onBookmark, onTranslate, onCopyLink, onSelect, onVotePoll, onOpenComments,
  replyTo, editMsg, onCancelReply, onCancelEdit, onSaveEdit, onHeaderClick, typingUsers,
  selectMode, selectedMessages, onToggleSelect, onSelectAll, onExitSelect, onBulkDelete, onBulkForward, onBulkCopy,
  showSearch, onToggleSearch, searchQuery, onSearchChange, searchResults, searchIndex, onNavigateSearch,
  recentEmojis, pinnedIndex, onCyclePinned, draft,
  onCreatePoll, onRollDice, onSchedule,
  pendingEffect, onSetEffect, onToggleEffectPicker, showEffectPicker,
  onMuteChat, onClearHistory, onLeaveChat, onBlockUser, onDeleteChat, onManageChannel, onManageGroup, onReport,
  slowMode, slowModeRemaining, isMobile, onBack,
  requestStatus, onAcceptRequest, onRejectRequest, requestRecipientName,
  onImageSelect, onVideoSelect, onFileSelect, isUploading, uploadProgress,
  onSendTyping, activeEffect, onVoiceSend,
}) => {
  const imageInputRef = useRef<HTMLInputElement>(null);
  const videoInputRef = useRef<HTMLInputElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [inputText, setInputText] = useState('');
  const [showFormatBar, setShowFormatBar] = useState(false);
  const [showScrollBtn, setShowScrollBtn] = useState(false);
  const [showEmojiPicker, setShowEmojiPicker] = useState(false);
  const [showGifPicker, setShowGifPicker] = useState(false);
  const [showAttachMenu, setShowAttachMenu] = useState(false);
  const [showHeaderMenu, setShowHeaderMenu] = useState(false);
  const [newMsgCount, setNewMsgCount] = useState(0);
  const [slowModeCountdown, setSlowModeCountdown] = useState(0);
  const [isRecordingVoice, setIsRecordingVoice] = useState(false);
  const headerMenuRef = useRef<HTMLDivElement>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const prevMsgCountRef = useRef(messages.length);
  const prevHeightRef = useRef(20);
  const typingTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const [keyboardOffset, setKeyboardOffset] = useState(0);

  // Keyboard-aware input positioning for mobile
  useEffect(() => {
    if (!isMobile) return;
    const vv = window.visualViewport;
    if (!vv) return;
    const onResize = () => {
      const offset = window.innerHeight - vv.height - vv.offsetTop;
      setKeyboardOffset(Math.max(0, offset));
    };
    vv.addEventListener('resize', onResize);
    vv.addEventListener('scroll', onResize);
    return () => {
      vv.removeEventListener('resize', onResize);
      vv.removeEventListener('scroll', onResize);
    };
  }, [isMobile]);

  // Slow mode countdown timer
  useEffect(() => {
    if (!slowMode || slowMode <= 0) return;
    // Start countdown after sending
    if (slowModeRemaining && slowModeRemaining > 0) {
      setSlowModeCountdown(slowModeRemaining);
    }
  }, [slowModeRemaining, slowMode]);

  useEffect(() => {
    if (slowModeCountdown <= 0) return;
    const timer = setInterval(() => {
      setSlowModeCountdown(prev => {
        if (prev <= 1) { clearInterval(timer); return 0; }
        return prev - 1;
      });
    }, 1000);
    return () => clearInterval(timer);
  }, [slowModeCountdown > 0]);

  // Restore draft
  useEffect(() => {
    if (draft && !editMsg) setInputText(draft);
    else if (!editMsg) setInputText('');
  }, [chat.id]);

  // Click outside header menu
  useEffect(() => {
    if (!showHeaderMenu) return;
    const handler = (e: MouseEvent) => {
      if (headerMenuRef.current && !headerMenuRef.current.contains(e.target as Node)) setShowHeaderMenu(false);
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, [showHeaderMenu]);

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
    if (!text || slowModeCountdown > 0) return;
    if (editMsg) {
      onSaveEdit(text);
    } else {
      onSendMessage(text, { silent, effect: pendingEffect || undefined });
      // Start slow mode countdown after sending
      if (slowMode && slowMode > 0) setSlowModeCountdown(slowMode);
    }
    setInputText('');
    onSetEffect(null);
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setInputText(e.target.value);
    // Send typing indicator (debounced)
    if (onSendTyping) {
      if (typingTimeoutRef.current) clearTimeout(typingTimeoutRef.current);
      typingTimeoutRef.current = setTimeout(() => {
        onSendTyping();
      }, 300);
    }
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
      <div className="flex items-center gap-2 md:gap-3 px-3 md:px-4 py-3 border-b border-border cursor-pointer hover:bg-dex-hover/50 transition-colors" onClick={onHeaderClick} style={isMobile ? { paddingTop: 'max(0.75rem, env(safe-area-inset-top))' } : undefined}>
        {/* Mobile back button */}
        {isMobile && onBack && (
          <button onClick={(e) => { e.stopPropagation(); onBack(); }} className="p-2 -ml-1 rounded-lg active:bg-dex-hover text-muted-foreground flex-shrink-0">
            <ArrowLeft size={22} />
          </button>
        )}
        <div className="relative flex-shrink-0">
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
          <div className="relative" ref={headerMenuRef}>
            <button className="p-2 rounded-lg hover:bg-dex-hover transition-colors text-muted-foreground" onClick={e => { e.stopPropagation(); setShowHeaderMenu(!showHeaderMenu); }}>
              <MoreVertical size={18} />
            </button>
            {showHeaderMenu && isMobile ? (
              <Sheet open={showHeaderMenu} onOpenChange={setShowHeaderMenu}>
                <SheetContent side="bottom" className="rounded-t-2xl p-0">
                  <div className="py-2" style={{ paddingBottom: 'max(0.5rem, env(safe-area-inset-bottom))' }}>
                    <button onClick={() => { onMuteChat(); setShowHeaderMenu(false); }} className="flex items-center gap-3 w-full px-5 py-3.5 text-[15px] active:bg-dex-hover text-foreground transition-colors">
                      {chat.muted ? <BellOff size={18} /> : <Bell size={18} />}
                      {chat.muted ? 'Unmute' : 'Mute notifications'}
                    </button>
                    <button onClick={() => { onHeaderClick(); setShowHeaderMenu(false); }} className="flex items-center gap-3 w-full px-5 py-3.5 text-[15px] active:bg-dex-hover text-foreground transition-colors">
                      <Search size={18} />
                      {chat.type === 'channel' ? 'View channel info' : chat.type === 'group' ? 'View group info' : 'View profile'}
                    </button>
                    {chat.type === 'channel' && (chat.role === 'owner' || chat.role === 'admin') && (
                      <button onClick={() => { onManageChannel(); setShowHeaderMenu(false); }} className="flex items-center gap-3 w-full px-5 py-3.5 text-[15px] active:bg-dex-hover text-foreground transition-colors">
                        <Settings size={18} /> Manage Channel
                      </button>
                    )}
                    {chat.type === 'group' && (chat.role === 'owner' || chat.role === 'admin') && (
                      <button onClick={() => { onManageGroup(); setShowHeaderMenu(false); }} className="flex items-center gap-3 w-full px-5 py-3.5 text-[15px] active:bg-dex-hover text-foreground transition-colors">
                        <Settings size={18} /> Manage Group
                      </button>
                    )}
                    {(chat.type === 'group' || chat.type === 'channel') && (
                      <button onClick={() => { onCreatePoll(); setShowHeaderMenu(false); }} className="flex items-center gap-3 w-full px-5 py-3.5 text-[15px] active:bg-dex-hover text-foreground transition-colors">
                        <BarChart3 size={18} /> Create poll
                      </button>
                    )}
                    <div className="h-px bg-border mx-4 my-1" />
                    <button onClick={() => { onClearHistory(); setShowHeaderMenu(false); }} className="flex items-center gap-3 w-full px-5 py-3.5 text-[15px] active:bg-dex-hover text-foreground transition-colors">
                      <Trash2 size={18} /> Clear history
                    </button>
                    {chat.type === 'personal' && chat.id !== 'saved' && (
                      <button onClick={() => { onBlockUser(); setShowHeaderMenu(false); }} className="flex items-center gap-3 w-full px-5 py-3.5 text-[15px] active:bg-dex-hover text-foreground transition-colors">
                        <Ban size={18} /> Block user
                      </button>
                    )}
                    <div className="h-px bg-border mx-4 my-1" />
                    {(chat.type === 'channel' || chat.type === 'group') ? (
                      <button onClick={() => { onLeaveChat(); setShowHeaderMenu(false); }} className="flex items-center gap-3 w-full px-5 py-3.5 text-[15px] active:bg-dex-hover text-destructive transition-colors">
                        <LogOut size={18} /> Leave {chat.type === 'channel' ? 'channel' : 'group'}
                      </button>
                    ) : chat.id !== 'saved' && (
                      <button onClick={() => { onDeleteChat(); setShowHeaderMenu(false); }} className="flex items-center gap-3 w-full px-5 py-3.5 text-[15px] active:bg-dex-hover text-destructive transition-colors">
                        <Trash2 size={18} /> Delete chat
                      </button>
                    )}
                  </div>
                </SheetContent>
              </Sheet>
            ) : showHeaderMenu && (
              <div className="absolute right-0 top-full mt-1 bg-popover border border-border rounded-xl shadow-xl z-50 min-w-[200px] animate-[contextIn_0.15s_ease-out] py-1">
                {/* Mute */}
                <button onClick={() => { onMuteChat(); setShowHeaderMenu(false); }} className="flex items-center gap-3 w-full px-4 py-2.5 text-sm hover:bg-dex-hover text-foreground transition-colors">
                  {chat.muted ? <BellOff size={16} /> : <Bell size={16} />}
                  {chat.muted ? 'Unmute' : 'Mute notifications'}
                </button>
                {/* View info */}
                <button onClick={() => { onHeaderClick(); setShowHeaderMenu(false); }} className="flex items-center gap-3 w-full px-4 py-2.5 text-sm hover:bg-dex-hover text-foreground transition-colors">
                  <Search size={16} />
                  {chat.type === 'channel' ? 'View channel info' : chat.type === 'group' ? 'View group info' : 'View profile'}
                </button>
                {/* Manage (admin/owner only) */}
                {chat.type === 'channel' && (chat.role === 'owner' || chat.role === 'admin') && (
                  <button onClick={() => { onManageChannel(); setShowHeaderMenu(false); }} className="flex items-center gap-3 w-full px-4 py-2.5 text-sm hover:bg-dex-hover text-foreground transition-colors">
                    <Settings size={16} /> Manage Channel
                  </button>
                )}
                {chat.type === 'group' && (chat.role === 'owner' || chat.role === 'admin') && (
                  <button onClick={() => { onManageGroup(); setShowHeaderMenu(false); }} className="flex items-center gap-3 w-full px-4 py-2.5 text-sm hover:bg-dex-hover text-foreground transition-colors">
                    <Settings size={16} /> Manage Group
                  </button>
                )}
                {/* Create poll */}
                {(chat.type === 'group' || chat.type === 'channel') && (
                  <button onClick={() => { onCreatePoll(); setShowHeaderMenu(false); }} className="flex items-center gap-3 w-full px-4 py-2.5 text-sm hover:bg-dex-hover text-foreground transition-colors">
                    <BarChart3 size={16} /> Create poll
                  </button>
                )}
                <div className="h-px bg-border mx-3 my-1" />
                {/* Clear history */}
                <button onClick={() => { onClearHistory(); setShowHeaderMenu(false); }} className="flex items-center gap-3 w-full px-4 py-2.5 text-sm hover:bg-dex-hover text-foreground transition-colors">
                  <Trash2 size={16} /> Clear history
                </button>
                {/* Block (personal only) */}
                {chat.type === 'personal' && chat.id !== 'saved' && (
                  <button onClick={() => { onBlockUser(); setShowHeaderMenu(false); }} className="flex items-center gap-3 w-full px-4 py-2.5 text-sm hover:bg-dex-hover text-foreground transition-colors">
                    <Ban size={16} /> Block user
                  </button>
                )}
                {/* Report */}
                {chat.id !== 'saved' && (
                  <button onClick={() => { onReport(); setShowHeaderMenu(false); }} className="flex items-center gap-3 w-full px-4 py-2.5 text-sm hover:bg-dex-hover text-destructive transition-colors">
                    ⚠️ Report
                  </button>
                )}
                <div className="h-px bg-border mx-3 my-1" />
                {/* Leave / Delete */}
                {(chat.type === 'channel' || chat.type === 'group') ? (
                  <button onClick={() => { onLeaveChat(); setShowHeaderMenu(false); }} className="flex items-center gap-3 w-full px-4 py-2.5 text-sm hover:bg-dex-hover text-destructive transition-colors">
                    <LogOut size={16} /> Leave {chat.type === 'channel' ? 'channel' : 'group'}
                  </button>
                ) : chat.id !== 'saved' && (
                  <button onClick={() => { onDeleteChat(); setShowHeaderMenu(false); }} className="flex items-center gap-3 w-full px-4 py-2.5 text-sm hover:bg-dex-hover text-destructive transition-colors">
                    <Trash2 size={16} /> Delete chat
                  </button>
                )}
              </div>
            )}
          </div>
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
      <div ref={containerRef} onScroll={handleScroll} className="flex-1 overflow-y-auto px-2 md:px-4 py-2">
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
                  isMobile={isMobile}
                />
              </React.Fragment>
            ))}
          </React.Fragment>
        ))}
        <div ref={messagesEndRef} />
      </div>

      {/* Scroll to bottom FAB — smooth transition */}
      <div
        className={`absolute ${isMobile ? 'bottom-20 right-4' : 'bottom-24 right-6'} z-10 transition-all duration-200 ${showScrollBtn ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4 pointer-events-none'}`}
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
        <div className="flex items-center gap-1.5 md:gap-2 px-3 md:px-4 py-2.5 bg-card border-t border-border animate-[slideUp_0.2s_ease-out]" style={isMobile ? { paddingBottom: 'max(0.625rem, env(safe-area-inset-bottom))' } : undefined}>
          <button onClick={onExitSelect} className="p-1.5 rounded-lg hover:bg-dex-hover active:bg-dex-hover text-muted-foreground"><X size={16} /></button>
          <span className="text-sm text-foreground font-medium flex-1">{selectedMessages.size} selected</span>
          {!isMobile && <button onClick={onSelectAll} className="px-3 py-1.5 rounded-lg text-xs font-medium bg-muted hover:bg-muted/80 text-foreground h-8">Select All</button>}
          <button onClick={onBulkCopy} disabled={selectedMessages.size === 0} className="p-2 md:px-3 md:py-1.5 rounded-lg text-xs font-medium bg-muted hover:bg-muted/80 text-foreground disabled:opacity-40 min-h-[36px]">{isMobile ? '📋' : '📋 Copy'}</button>
          <button onClick={onBulkForward} disabled={selectedMessages.size === 0} className="p-2 md:px-3 md:py-1.5 rounded-lg text-xs font-medium bg-muted hover:bg-muted/80 text-foreground disabled:opacity-40 min-h-[36px]">{isMobile ? '↗️' : '↗️ Forward'}</button>
          <button onClick={onBulkDelete} disabled={selectedMessages.size === 0} className="p-2 md:px-3 md:py-1.5 rounded-lg text-xs font-medium bg-destructive/20 hover:bg-destructive/30 text-destructive disabled:opacity-40 min-h-[36px]">{isMobile ? '🗑️' : '🗑️ Delete'}</button>
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

      {/* Message Request: Pending Sent (sender sees this) */}
      {!selectMode && requestStatus === 'pending_sent' && (
        <div className="flex flex-col items-center justify-center px-4 py-6 border-t border-border gap-2" style={isMobile ? { paddingBottom: 'max(1rem, env(safe-area-inset-bottom))' } : undefined}>
          <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center mb-1">
            <Clock size={20} className="text-primary" />
          </div>
          <p className="text-sm text-muted-foreground text-center max-w-[300px]">
            Du kan bara skicka ett meddelande tills att <span className="font-semibold text-foreground">{requestRecipientName || chat.name}</span> har accepterat din förfrågan
          </p>
        </div>
      )}

      {/* Message Request: Pending Received (recipient sees this) */}
      {!selectMode && requestStatus === 'pending_received' && (
        <div className="flex flex-col items-center justify-center px-4 py-6 border-t border-border gap-3" style={isMobile ? { paddingBottom: 'max(1rem, env(safe-area-inset-bottom))' } : undefined}>
          <p className="text-sm text-muted-foreground text-center max-w-[320px]">
            <span className="font-semibold text-foreground">{chat.name}</span> vill skicka meddelanden till dig
          </p>
          <div className="flex gap-3">
            <button onClick={onAcceptRequest} className="px-5 py-2.5 rounded-xl text-sm font-medium bg-primary text-primary-foreground hover:bg-primary/90 transition-colors">
              Godkänn förfrågan
            </button>
            <button onClick={onRejectRequest} className="px-5 py-2.5 rounded-xl text-sm font-medium bg-destructive/10 text-destructive hover:bg-destructive/20 border border-destructive/20 transition-colors">
              Neka förfrågan
            </button>
          </div>
        </div>
      )}

      {/* Blocked */}
      {!selectMode && chat.blocked && requestStatus !== 'pending_sent' && requestStatus !== 'pending_received' && (
        <div className="flex items-center justify-center px-4 py-4 border-t border-border" style={isMobile ? { paddingBottom: 'max(1rem, env(safe-area-inset-bottom))' } : undefined}>
          <span className="text-sm text-muted-foreground">🚫 User is blocked. Unblock to send messages.</span>
        </div>
      )}
      {!selectMode && !chat.blocked && requestStatus !== 'pending_sent' && requestStatus !== 'pending_received' && (
        <div className="flex items-end gap-1.5 md:gap-2 px-2 md:px-4 py-2 md:py-3 border-t border-border relative chat-input-bar" style={isMobile ? { paddingBottom: 'max(0.5rem, env(safe-area-inset-bottom))', transform: keyboardOffset > 0 ? `translateY(-${keyboardOffset}px)` : undefined } : undefined}>
          {isRecordingVoice && onVoiceSend ? (
            <VoiceRecorder
              onSend={(blob, dur) => {
                onVoiceSend(blob, dur);
                setIsRecordingVoice(false);
              }}
              onCancel={() => setIsRecordingVoice(false)}
            />
          ) : (
            <>
          {!isMobile && (
            <button onClick={() => setShowFormatBar(!showFormatBar)} className="p-2 rounded-lg hover:bg-dex-hover text-muted-foreground flex-shrink-0">
              <Type size={18} />
            </button>
          )}

          {/* Attach Menu */}
          <div className="relative">
            <button onClick={() => setShowAttachMenu(!showAttachMenu)} className="p-2 rounded-lg hover:bg-dex-hover active:bg-dex-hover text-muted-foreground flex-shrink-0">
              <Paperclip size={18} />
            </button>
            {showAttachMenu && (
              isMobile ? (
                <Sheet open={showAttachMenu} onOpenChange={setShowAttachMenu}>
                  <SheetContent side="bottom" className="rounded-t-2xl p-0">
                    <div className="py-2">
                     {[
                        { label: '📷 Photo/Video', action: () => { setShowAttachMenu(false); imageInputRef.current?.click(); } },
                        { label: '📄 Document', action: () => { setShowAttachMenu(false); fileInputRef.current?.click(); } },
                        { label: '📊 Poll', action: () => { setShowAttachMenu(false); onCreatePoll(); } },
                      ].map(item => (
                        <button key={item.label} onClick={() => { item.action(); }}
                          className="flex items-center gap-3 w-full px-5 py-3.5 text-sm active:bg-dex-hover text-foreground transition-colors">{item.label}</button>
                      ))}
                      <div className="h-px bg-border mx-4 my-1" />
                      <div className="px-5 py-1.5 text-[10px] text-muted-foreground uppercase tracking-wider font-semibold">Roll Dice</div>
                      <div className="flex gap-2 px-4 pb-3">
                        {DICE_EMOJIS.map(emoji => (
                          <button key={emoji} onClick={() => { onRollDice(emoji); setShowAttachMenu(false); }}
                            className="text-2xl p-2 active:scale-110 transition-transform rounded-lg active:bg-dex-hover">{emoji}</button>
                        ))}
                      </div>
                    </div>
                  </SheetContent>
                </Sheet>
              ) : (
              <div className="absolute bottom-full left-0 mb-2 bg-popover border border-border rounded-xl shadow-xl z-30 min-w-[180px] animate-[contextIn_0.15s_ease-out]">
                {[
                  { label: '📷 Photo/Video', action: () => { setShowAttachMenu(false); imageInputRef.current?.click(); } },
                  { label: '📄 Document', action: () => { setShowAttachMenu(false); fileInputRef.current?.click(); } },
                  { label: '📊 Poll', action: () => { setShowAttachMenu(false); onCreatePoll(); } },
                ].map(item => (
                  <button key={item.label} onClick={() => { item.action(); }}
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
              )
            )}
          </div>

          <div className="flex-1 flex items-end bg-muted rounded-[20px] px-3 py-1.5 relative border border-border/50">
            <textarea ref={textareaRef} value={inputText} onChange={handleInputChange} onKeyDown={handleKeyDown}
              placeholder={slowModeCountdown > 0 ? `Slow mode: ${slowModeCountdown}s` : chat.type === 'channel' ? 'Broadcast a message...' : 'Message...'} rows={1}
              disabled={slowModeCountdown > 0}
              className={`flex-1 bg-transparent text-sm text-foreground placeholder:text-muted-foreground/50 resize-none focus:outline-none leading-5 ${slowModeCountdown > 0 ? 'opacity-50' : ''}`}
              style={{ minHeight: '20px', maxHeight: '120px' }} />
            <button onClick={() => setShowEmojiPicker(!showEmojiPicker)} className="p-1 text-muted-foreground hover:text-foreground ml-1 flex-shrink-0 transition-colors">
              <Smile size={18} />
            </button>
            {showEmojiPicker && (
              <EmojiPicker onSelect={insertEmoji} onClose={() => setShowEmojiPicker(false)} recentEmojis={recentEmojis} isMobile={isMobile} />
            )}
          </div>

          {/* GIF Picker */}
          <div className="relative">
            <button onClick={() => setShowGifPicker(!showGifPicker)} className="p-2 rounded-lg hover:bg-dex-hover text-muted-foreground flex-shrink-0" title="Send GIF">
              <span className="text-xs font-bold leading-none">GIF</span>
            </button>
            {showGifPicker && (
              <GifPicker onSelect={(url) => { onSendGif(url); setShowGifPicker(false); }} onClose={() => setShowGifPicker(false)} isMobile={isMobile} />
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

          {/* Hidden file inputs */}
          <input ref={imageInputRef} type="file" accept="image/*,video/*" className="hidden" onChange={(e) => {
            const file = e.target.files?.[0];
            if (!file) return;
            if (file.type.startsWith('video/')) onVideoSelect?.(file);
            else onImageSelect?.(file);
            e.target.value = '';
          }} />
          <input ref={fileInputRef} type="file" className="hidden" onChange={(e) => {
            const file = e.target.files?.[0];
            if (file) onFileSelect?.(file);
            e.target.value = '';
          }} />

          {isUploading && (
            <div className="flex items-center gap-2 text-xs text-primary">
              <div className="w-16 h-1.5 bg-muted rounded-full overflow-hidden">
                <div className="h-full bg-primary rounded-full transition-all" style={{ width: `${uploadProgress || 0}%` }} />
              </div>
              <span>{uploadProgress || 0}%</span>
            </div>
          )}

          {/* Slow mode indicator */}
          {slowModeCountdown > 0 && (
            <div className="flex items-center gap-1 text-xs text-muted-foreground px-2 py-1 rounded-full bg-muted border border-border/50 flex-shrink-0">
              <Clock size={12} /> {slowModeCountdown}s
            </div>
          )}

          <button onClick={() => {
              if (inputText.trim()) {
                handleSend();
              } else if (!editMsg && onVoiceSend) {
                setIsRecordingVoice(true);
              }
            }}
            disabled={slowModeCountdown > 0}
            className={`p-2.5 rounded-full flex-shrink-0 transition-all duration-200 ease-out ${inputText.trim() && slowModeCountdown <= 0 ? 'bg-primary text-primary-foreground scale-100' : 'text-muted-foreground scale-95'} ${slowModeCountdown > 0 ? 'opacity-40' : ''}`}>
            {editMsg ? <Check size={18} /> : inputText.trim() ? <Send size={18} /> : <Mic size={18} />}
          </button>

          {pendingEffect && (
            <div className="flex items-center gap-1 text-xs bg-primary/20 text-primary px-2 py-0.5 rounded-full ml-1 flex-shrink-0">
              {pendingEffect === 'confetti' ? '🎊' : pendingEffect === 'fireworks' ? '🎆' : '❤️'} {pendingEffect}
              <button onClick={() => onSetEffect(null)} className="ml-0.5 hover:text-destructive">✕</button>
            </div>
          )}
          </>
          )}
        </div>
      )}

      {/* Message Effect Overlay */}
      {activeEffect && (
        <div className="absolute inset-0 pointer-events-none z-20 overflow-hidden">
          {activeEffect.effect === 'confetti' && (
            Array.from({ length: 40 }).map((_, i) => (
              <div key={i} className="absolute text-lg"
                style={{
                  left: `${Math.random() * 100}%`,
                  top: '-20px',
                  animation: `confettiFall ${1.5 + Math.random() * 2}s ease-in forwards`,
                  animationDelay: `${Math.random() * 0.5}s`,
                }}>
                {['🎊', '🎉', '✨', '🥳', '🎈'][Math.floor(Math.random() * 5)]}
              </div>
            ))
          )}
          {activeEffect.effect === 'fireworks' && (
            Array.from({ length: 20 }).map((_, i) => (
              <div key={i} className="absolute text-xl"
                style={{
                  left: `${20 + Math.random() * 60}%`,
                  bottom: `${20 + Math.random() * 60}%`,
                  animation: `fireworkBurst 1.5s ease-out forwards`,
                  animationDelay: `${Math.random() * 0.8}s`,
                }}>
                {['🎆', '✨', '💫', '⭐'][Math.floor(Math.random() * 4)]}
              </div>
            ))
          )}
          {activeEffect.effect === 'hearts' && (
            Array.from({ length: 25 }).map((_, i) => (
              <div key={i} className="absolute text-2xl"
                style={{
                  left: `${Math.random() * 100}%`,
                  bottom: '-30px',
                  animation: `heartFloat ${2 + Math.random() * 2}s ease-out forwards`,
                  animationDelay: `${Math.random() * 0.6}s`,
                }}>
                {['❤️', '💕', '💖', '💗', '💓'][Math.floor(Math.random() * 5)]}
              </div>
            ))
          )}
        </div>
      )}
    </div>
  );
};

export default ChatArea;
