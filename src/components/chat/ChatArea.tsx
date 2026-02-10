import React, { useState, useRef, useEffect, useCallback } from 'react';
import { Chat, Message } from '@/types/chat';
import MessageBubble from './MessageBubble';
import { Search, MoreVertical, ArrowDown, X, Paperclip, Smile, Mic, Send, Check, Type } from 'lucide-react';

interface ChatAreaProps {
  chat: Chat;
  messages: Message[];
  onSendMessage: (text: string) => void;
  onReply: (msg: Message) => void;
  onEdit: (msg: Message) => void;
  onDelete: (msg: Message) => void;
  onForward: (msg: Message) => void;
  onPin: (msg: Message) => void;
  onReaction: (msgId: string, emoji: string) => void;
  replyTo: Message | null;
  editMsg: Message | null;
  onCancelReply: () => void;
  onCancelEdit: () => void;
  onSaveEdit: (text: string) => void;
  onHeaderClick: () => void;
  typingUsers: string[];
}

const ChatArea: React.FC<ChatAreaProps> = ({
  chat, messages, onSendMessage, onReply, onEdit, onDelete, onForward, onPin, onReaction,
  replyTo, editMsg, onCancelReply, onCancelEdit, onSaveEdit, onHeaderClick, typingUsers,
}) => {
  const [inputText, setInputText] = useState('');
  const [showFormatBar, setShowFormatBar] = useState(false);
  const [showScrollBtn, setShowScrollBtn] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages.length]);

  useEffect(() => {
    if (editMsg) {
      setInputText(editMsg.text);
      textareaRef.current?.focus();
    }
  }, [editMsg]);

  const handleScroll = useCallback(() => {
    if (!containerRef.current) return;
    const { scrollTop, scrollHeight, clientHeight } = containerRef.current;
    setShowScrollBtn(scrollHeight - scrollTop - clientHeight > 200);
  }, []);

  const handleSend = () => {
    const text = inputText.trim();
    if (!text) return;
    if (editMsg) {
      onSaveEdit(text);
    } else {
      onSendMessage(text);
    }
    setInputText('');
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  // Auto-resize textarea
  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.style.height = '20px';
      textareaRef.current.style.height = Math.min(textareaRef.current.scrollHeight, 120) + 'px';
    }
  }, [inputText]);

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

  const pinnedMessages = messages.filter(m => m.pinned);

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

  return (
    <div className="flex-1 flex flex-col min-w-0 bg-background">
      {/* Chat Header */}
      <div className="flex items-center gap-3 px-4 py-3 border-b border-border cursor-pointer hover:bg-dex-hover/50 transition-colors" onClick={onHeaderClick}>
        <div className="relative">
          <div className="w-10 h-10 rounded-full flex items-center justify-center text-sm font-semibold text-white" style={{ background: `hsl(${chat.avatarColor})` }}>
            {chat.avatar}
          </div>
          {chat.online && <div className="absolute bottom-0 right-0 w-2.5 h-2.5 rounded-full bg-dex-online border-2 border-background" />}
        </div>
        <div className="flex-1 min-w-0">
          <h2 className="text-sm font-semibold text-foreground truncate">{chat.name}</h2>
          <p className="text-xs text-muted-foreground">
            {typingText ? (
              <span className="text-primary">
                {typingText}
                <span className="inline-flex ml-1 gap-0.5">
                  {[0, 1, 2].map(i => (
                    <span key={i} className="w-1 h-1 rounded-full bg-primary inline-block" style={{ animation: `typing 1.4s infinite`, animationDelay: `${i * 0.2}s` }} />
                  ))}
                </span>
              </span>
            ) : statusText}
          </p>
        </div>
        <div className="flex items-center gap-1">
          <button className="p-2 rounded-lg hover:bg-dex-hover transition-colors text-muted-foreground" onClick={e => e.stopPropagation()}>
            <Search size={18} />
          </button>
          <button className="p-2 rounded-lg hover:bg-dex-hover transition-colors text-muted-foreground" onClick={e => e.stopPropagation()}>
            <MoreVertical size={18} />
          </button>
        </div>
      </div>

      {/* Pin Banner */}
      {pinnedMessages.length > 0 && (
        <div className="flex items-center gap-2 px-4 py-2 bg-primary/[0.08] border-b border-primary/20 animate-[slideDown_0.2s_ease-out]">
          <div className="w-0.5 h-8 bg-primary rounded-full" />
          <div className="flex-1 min-w-0">
            <div className="text-[11px] font-semibold text-primary">📌 Pinned Message</div>
            <div className="text-xs text-muted-foreground truncate">{pinnedMessages[0].text}</div>
          </div>
          {pinnedMessages.length > 1 && <span className="text-[10px] text-muted-foreground">1 of {pinnedMessages.length}</span>}
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
              <span className="text-xs text-muted-foreground bg-dex-surface/80 backdrop-blur px-3.5 py-1 rounded-xl">{group.label}</span>
            </div>
            {group.msgs.map(msg => (
              <MessageBubble
                key={msg.id}
                message={msg}
                chat={chat}
                onReply={onReply}
                onEdit={onEdit}
                onDelete={onDelete}
                onForward={onForward}
                onPin={onPin}
                onReaction={onReaction}
              />
            ))}
          </React.Fragment>
        ))}
        <div ref={messagesEndRef} />
      </div>

      {/* Scroll to bottom FAB */}
      {showScrollBtn && (
        <button
          onClick={() => messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })}
          className="absolute bottom-24 right-6 w-10 h-10 rounded-full bg-card border border-border shadow-lg flex items-center justify-center text-muted-foreground hover:bg-dex-hover transition-colors animate-[fadeIn_0.2s_ease-out]"
        >
          <ArrowDown size={18} />
        </button>
      )}

      {/* Reply/Edit Preview */}
      {(replyTo || editMsg) && (
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
      {showFormatBar && (
        <div className="flex items-center gap-1 px-4 py-1.5 border-t border-border animate-[slideDown_0.15s_ease-out]">
          {[{ label: 'B', wrap: '**' }, { label: 'I', wrap: '*' }, { label: 'U', wrap: '__' }, { label: 'S', wrap: '~~' }, { label: '<>', wrap: '`' }, { label: '● Spoiler', wrap: '||' }].map(f => (
            <button
              key={f.label}
              onClick={() => setInputText(prev => `${prev}${f.wrap}text${f.wrap}`)}
              className="px-2.5 py-1 rounded text-xs font-semibold bg-muted/50 hover:bg-muted text-foreground transition-colors"
            >
              {f.label}
            </button>
          ))}
        </div>
      )}

      {/* Input Area */}
      <div className="flex items-end gap-2 px-4 py-3 border-t border-border">
        <button onClick={() => setShowFormatBar(!showFormatBar)} className="p-2 rounded-lg hover:bg-dex-hover text-muted-foreground flex-shrink-0">
          <Type size={18} />
        </button>
        <button className="p-2 rounded-lg hover:bg-dex-hover text-muted-foreground flex-shrink-0">
          <Paperclip size={18} />
        </button>
        <div className="flex-1 flex items-end bg-muted rounded-[20px] px-3 py-1.5">
          <textarea
            ref={textareaRef}
            value={inputText}
            onChange={e => setInputText(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder={chat.type === 'channel' ? 'Broadcast a message...' : 'Message...'}
            rows={1}
            className="flex-1 bg-transparent text-sm text-foreground placeholder:text-muted-foreground/50 resize-none focus:outline-none leading-5"
            style={{ minHeight: '20px', maxHeight: '120px' }}
          />
          <button className="p-1 text-muted-foreground hover:text-foreground ml-1 flex-shrink-0">
            <Smile size={18} />
          </button>
        </div>
        <button
          onClick={handleSend}
          className={`p-2.5 rounded-full flex-shrink-0 transition-all ${inputText.trim() ? 'bg-gradient-to-br from-primary to-[hsl(252,60%,48%)] text-primary-foreground scale-100' : 'text-muted-foreground scale-95'}`}
        >
          {editMsg ? <Check size={18} /> : inputText.trim() ? <Send size={18} /> : <Mic size={18} />}
        </button>
      </div>
    </div>
  );
};

export default ChatArea;
