import React, { useState, useMemo } from 'react';
import { Chat } from '@/types/chat';
import ContextMenu, { ContextMenuItem } from './ContextMenu';
import { Search, Edit3 } from 'lucide-react';

interface SidebarProps {
  chats: Chat[];
  activeChat: string;
  onSelectChat: (id: string) => void;
  onPinChat: (id: string) => void;
  onMuteChat: (id: string) => void;
  onDeleteChat: (id: string) => void;
  onMarkRead: (id: string) => void;
  onCreateChannel: () => void;
}

const FOLDERS = [
  { id: 'all', label: '💬 All' },
  { id: 'personal', label: '👤 Personal' },
  { id: 'groups', label: '👥 Groups' },
  { id: 'channels', label: '📢 Channels' },
];

const Sidebar: React.FC<SidebarProps> = ({ chats, activeChat, onSelectChat, onPinChat, onMuteChat, onDeleteChat, onMarkRead, onCreateChannel }) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [showSearch, setShowSearch] = useState(false);
  const [activeFolder, setActiveFolder] = useState('all');
  const [contextMenu, setContextMenu] = useState<{ x: number; y: number; chatId: string } | null>(null);
  const [showNewMenu, setShowNewMenu] = useState(false);

  const filteredChats = useMemo(() => {
    let filtered = chats;
    if (activeFolder === 'personal') filtered = filtered.filter(c => c.type === 'personal');
    else if (activeFolder === 'groups') filtered = filtered.filter(c => c.type === 'group');
    else if (activeFolder === 'channels') filtered = filtered.filter(c => c.type === 'channel');
    if (searchQuery) filtered = filtered.filter(c => c.name.toLowerCase().includes(searchQuery.toLowerCase()));
    return [...filtered].sort((a, b) => {
      if (a.pinned && !b.pinned) return -1;
      if (!a.pinned && b.pinned) return 1;
      return 0;
    });
  }, [chats, activeFolder, searchQuery]);

  const folderUnread = (folderId: string) => {
    const relevant = folderId === 'all' ? chats : chats.filter(c => c.type === (folderId === 'personal' ? 'personal' : folderId === 'groups' ? 'group' : 'channel'));
    return relevant.reduce((s, c) => s + c.unread, 0);
  };

  const handleContextMenu = (e: React.MouseEvent, chatId: string) => {
    e.preventDefault();
    setContextMenu({ x: e.clientX, y: e.clientY, chatId });
  };

  const contextChat = contextMenu ? chats.find(c => c.id === contextMenu.chatId) : null;
  const contextItems: ContextMenuItem[] = contextChat ? [
    { label: contextChat.pinned ? 'Unpin' : 'Pin to top', icon: '📌', onClick: () => onPinChat(contextChat.id) },
    { label: contextChat.muted ? 'Unmute' : 'Mute', icon: contextChat.muted ? '🔔' : '🔕', onClick: () => onMuteChat(contextChat.id) },
    { label: contextChat.unread > 0 ? 'Mark as read' : 'Mark as unread', icon: '✅', onClick: () => onMarkRead(contextChat.id), dividerAfter: true },
    { label: 'Archive chat', icon: '📁', onClick: () => {} },
    { label: 'Delete chat', icon: '🗑️', danger: true, onClick: () => onDeleteChat(contextChat.id) },
  ] : [];

  return (
    <div className="w-[340px] h-screen flex flex-col border-r border-border bg-card flex-shrink-0">
      {/* Header */}
      <div className="px-4 py-3 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-primary to-secondary flex items-center justify-center text-primary-foreground font-bold text-sm">D</div>
          <span className="text-lg font-bold bg-gradient-to-r from-primary to-secondary bg-clip-text text-transparent">Dexster</span>
        </div>
        <div className="flex items-center gap-1">
          <button onClick={() => setShowSearch(!showSearch)} className="p-2 rounded-lg hover:bg-dex-hover transition-colors text-muted-foreground">
            <Search size={18} />
          </button>
          <div className="relative">
            <button onClick={() => setShowNewMenu(!showNewMenu)} className="p-2 rounded-lg hover:bg-dex-hover transition-colors text-muted-foreground">
              <Edit3 size={18} />
            </button>
            {showNewMenu && (
              <div className="absolute right-0 top-full mt-1 bg-popover/95 backdrop-blur-xl border border-border rounded-xl shadow-lg z-50 min-w-[180px] animate-[contextIn_0.15s_ease-out]">
                <button onClick={() => { setShowNewMenu(false); }} className="flex items-center gap-3 w-full px-4 py-2.5 text-sm hover:bg-dex-hover text-foreground">💬 New Chat</button>
                <button onClick={() => { setShowNewMenu(false); }} className="flex items-center gap-3 w-full px-4 py-2.5 text-sm hover:bg-dex-hover text-foreground">👥 New Group</button>
                <button onClick={() => { setShowNewMenu(false); onCreateChannel(); }} className="flex items-center gap-3 w-full px-4 py-2.5 text-sm hover:bg-dex-hover text-foreground">📢 New Channel</button>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Search */}
      {showSearch && (
        <div className="px-4 pb-2 animate-[slideDown_0.2s_ease-out]">
          <input
            autoFocus
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
            placeholder="Search..."
            className="w-full px-4 py-2 rounded-full bg-muted border-none text-sm text-foreground placeholder:text-muted-foreground/50 focus:outline-none focus:ring-1 focus:ring-primary"
          />
        </div>
      )}

      {/* Folder Tabs */}
      <div className="flex gap-1 px-4 pb-2 overflow-x-auto scrollbar-none">
        {FOLDERS.map(f => {
          const unread = folderUnread(f.id);
          return (
            <button
              key={f.id}
              onClick={() => setActiveFolder(f.id)}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium whitespace-nowrap transition-colors ${activeFolder === f.id ? 'bg-primary text-primary-foreground' : 'bg-muted/50 text-muted-foreground hover:bg-muted'}`}
            >
              {f.label}
              {unread > 0 && <span className="bg-primary-foreground/20 text-[10px] px-1.5 rounded-full">{unread}</span>}
            </button>
          );
        })}
      </div>

      {/* Chat List */}
      <div className="flex-1 overflow-y-auto">
        {filteredChats.map((chat, i) => {
          const isPinned = chat.pinned;
          const nextIsPinned = filteredChats[i + 1]?.pinned;
          return (
            <React.Fragment key={chat.id}>
              <button
                onClick={() => onSelectChat(chat.id)}
                onContextMenu={(e) => handleContextMenu(e, chat.id)}
                className={`w-full flex items-center gap-3 px-4 py-2.5 transition-colors text-left ${activeChat === chat.id ? 'bg-primary/[0.18]' : 'hover:bg-dex-hover'}`}
              >
                {/* Avatar */}
                <div className="relative flex-shrink-0">
                  <div className="w-12 h-12 rounded-full flex items-center justify-center text-sm font-semibold text-white" style={{ background: `hsl(${chat.avatarColor})` }}>
                    {chat.avatar}
                  </div>
                  {chat.online && (
                    <div className="absolute bottom-0 right-0 w-3 h-3 rounded-full bg-dex-online border-2 border-card" style={{ animation: 'pulseOnline 2s infinite' }} />
                  )}
                </div>

                {/* Content */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-1 truncate">
                      {chat.type === 'channel' && <span className="text-xs">📢</span>}
                      {chat.type === 'group' && <span className="text-xs">👥</span>}
                      <span className="text-sm font-semibold text-foreground truncate">{chat.name}</span>
                      {chat.pinned && <span className="text-xs text-muted-foreground">📌</span>}
                      {chat.muted && <span className="text-xs text-muted-foreground">🔕</span>}
                    </div>
                    <span className="text-[11px] text-muted-foreground flex-shrink-0">{chat.lastTime}</span>
                  </div>
                  <div className="flex items-center justify-between mt-0.5">
                    <p className="text-xs text-muted-foreground truncate">
                      {chat.typing ? (
                        <span className="text-primary">typing...</span>
                      ) : (
                        <>
                          {chat.lastMessageSender && <span className="font-medium text-foreground/70">{chat.lastMessageSender}: </span>}
                          {chat.lastMessage}
                        </>
                      )}
                    </p>
                    {chat.unread > 0 && (
                      <span className={`text-[11px] font-bold px-1.5 min-w-[20px] h-5 flex items-center justify-center rounded-full ${chat.muted ? 'bg-muted-foreground/40' : 'bg-primary'} text-primary-foreground`}>
                        {chat.unread}
                      </span>
                    )}
                  </div>
                </div>
              </button>
              {isPinned && !nextIsPinned && <div className="h-px bg-border mx-4" />}
            </React.Fragment>
          );
        })}
      </div>

      {contextMenu && (
        <ContextMenu x={contextMenu.x} y={contextMenu.y} items={contextItems} onClose={() => setContextMenu(null)} />
      )}
    </div>
  );
};

export default Sidebar;
