import React, { useState, useMemo, useEffect, useRef, useCallback } from 'react';
import { Chat, CustomFolder } from '@/types/chat';
import ContextMenu, { ContextMenuItem } from './ContextMenu';
import { Search, Menu, ChevronDown, ChevronRight, RefreshCw, User, Users, Megaphone, Phone, Bookmark, Settings, Moon } from 'lucide-react';
import { DexsterLogo } from './DexsterLogo';
import { Switch } from '@/components/ui/switch';
import MobileBottomNav, { MobileTab } from './MobileBottomNav';
import NotificationBell from './NotificationBell';
import ContactsTab from './ContactsTab';
import SavedMessagesTab from './SavedMessagesTab';
import SettingsTab from './SettingsTab';
import MyProfilePanel from './MyProfilePanel';

interface SidebarProps {
  chats: Chat[];
  archivedChats: Chat[];
  activeChat: string;
  onSelectChat: (id: string) => void;
  onPinChat: (id: string) => void;
  onMuteChat: (id: string) => void;
  onMuteWithDuration: (id: string) => void;
  onDeleteChat: (id: string) => void;
  onMarkRead: (id: string) => void;
  onMarkUnread: (id: string) => void;
  onArchiveChat: (id: string) => void;
  onUnarchiveChat: (id: string) => void;
  onBlockUser: (id: string) => void;
  onCreateChannel: () => void;
  onCreateGroup: () => void;
  onCreateFolder: () => void;
  onNewChat: () => void;
  customFolders: CustomFolder[];
  onMoveToFolder: (chatId: string, folderId: string) => void;
  chatDrafts: Record<string, string>;
  onClearHistory: (id: string) => void;
  isMobile?: boolean;
  onRefresh?: () => void;
  collapsed?: boolean;
  onExpand?: () => void;
}

const DEFAULT_FOLDERS = [
  { id: 'all', label: '💬 All' },
  { id: 'personal', label: '👤 Personal' },
  { id: 'groups', label: '👥 Groups' },
  { id: 'channels', label: '📢 Channels' },
];

const Sidebar: React.FC<SidebarProps> = ({
  chats, archivedChats, activeChat, onSelectChat, onPinChat, onMuteChat, onMuteWithDuration,
  onDeleteChat, onMarkRead, onMarkUnread, onArchiveChat, onUnarchiveChat, onBlockUser,
  onCreateChannel, onCreateGroup, onCreateFolder, onNewChat, customFolders, onMoveToFolder, chatDrafts,
  onClearHistory, isMobile, onRefresh, collapsed, onExpand,
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [showSearch, setShowSearch] = useState(false);
  const [activeFolder, setActiveFolder] = useState('all');
  const [contextMenu, setContextMenu] = useState<{ x: number; y: number; chatId: string } | null>(null);
  const [showNewMenu, setShowNewMenu] = useState(false);
  const [showArchived, setShowArchived] = useState(false);
  const [mobileTab, setMobileTab] = useState<MobileTab>('chats');
  const [showHamburger, setShowHamburger] = useState(false);
  const [showProfile, setShowProfile] = useState(false);
  const [darkMode, setDarkMode] = useState(() => document.documentElement.classList.contains('dark'));
  const newMenuRef = useRef<HTMLDivElement>(null);
  const chatListRef = useRef<HTMLDivElement>(null);

  // Pull-to-refresh state
  const [pullDistance, setPullDistance] = useState(0);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const pullStartY = useRef<number | null>(null);

  const handlePullStart = useCallback((e: React.TouchEvent) => {
    if (!isMobile || !chatListRef.current) return;
    if (chatListRef.current.scrollTop <= 0) {
      pullStartY.current = e.touches[0].clientY;
    }
  }, [isMobile]);

  const handlePullMove = useCallback((e: React.TouchEvent) => {
    if (pullStartY.current === null || isRefreshing) return;
    const deltaY = e.touches[0].clientY - pullStartY.current;
    if (deltaY > 0) {
      // Rubber-band resistance
      setPullDistance(Math.min(deltaY * 0.5, 100));
    }
  }, [isRefreshing]);

  const handlePullEnd = useCallback(() => {
    if (pullDistance > 70 && onRefresh) {
      setIsRefreshing(true);
      if (navigator.vibrate) navigator.vibrate(15);
      onRefresh();
      setTimeout(() => {
        setIsRefreshing(false);
        setPullDistance(0);
      }, 1000);
    } else {
      setPullDistance(0);
    }
    pullStartY.current = null;
  }, [pullDistance, onRefresh]);

  // Click-outside for new chat dropdown
  useEffect(() => {
    if (!showNewMenu) return;
    const handler = (e: MouseEvent) => {
      if (newMenuRef.current && !newMenuRef.current.contains(e.target as Node)) setShowNewMenu(false);
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, [showNewMenu]);

  const allFolders = [...DEFAULT_FOLDERS, ...(customFolders || []).map(f => ({ id: f.id, label: `${f.emoji} ${f.name}` }))];

  const filteredChats = useMemo(() => {
    let filtered = chats;
    if (activeFolder === 'personal') filtered = filtered.filter(c => c.type === 'personal');
    else if (activeFolder === 'groups') filtered = filtered.filter(c => c.type === 'group');
    else if (activeFolder === 'channels') filtered = filtered.filter(c => c.type === 'channel');
    else if (activeFolder !== 'all') {
      const folder = customFolders.find(f => f.id === activeFolder);
      if (folder) filtered = filtered.filter(c => folder.includedChatIds.includes(c.id));
    }
    if (searchQuery) filtered = filtered.filter(c => c.name.toLowerCase().includes(searchQuery.toLowerCase()));
    return [...filtered].sort((a, b) => {
      if (a.pinned && !b.pinned) return -1;
      if (!a.pinned && b.pinned) return 1;
      return 0;
    });
  }, [chats, activeFolder, searchQuery, customFolders]);

  const folderUnread = (folderId: string) => {
    if (folderId === 'all') return chats.reduce((s, c) => s + c.unread, 0);
    if (folderId === 'personal') return chats.filter(c => c.type === 'personal').reduce((s, c) => s + c.unread, 0);
    if (folderId === 'groups') return chats.filter(c => c.type === 'group').reduce((s, c) => s + c.unread, 0);
    if (folderId === 'channels') return chats.filter(c => c.type === 'channel').reduce((s, c) => s + c.unread, 0);
    const folder = customFolders.find(f => f.id === folderId);
    if (folder) return chats.filter(c => folder.includedChatIds.includes(c.id)).reduce((s, c) => s + c.unread, 0);
    return 0;
  };

  const handleContextMenu = (e: React.MouseEvent, chatId: string) => {
    e.preventDefault();
    setContextMenu({ x: e.clientX, y: e.clientY, chatId });
  };

  const contextChat = contextMenu ? chats.find(c => c.id === contextMenu.chatId) || archivedChats.find(c => c.id === contextMenu.chatId) : null;
  const isArchived = contextChat?.archived;

  const contextItems: ContextMenuItem[] = contextChat ? [
    { label: contextChat.pinned ? 'Unpin' : 'Pin to top', icon: '📌', onClick: () => onPinChat(contextChat.id) },
    { label: contextChat.muted ? 'Unmute' : 'Mute', icon: contextChat.muted ? '🔔' : '🔕', onClick: () => onMuteChat(contextChat.id) },
    ...(contextChat.muted ? [] : [{ label: 'Mute for...', icon: '⏱️', onClick: () => onMuteWithDuration(contextChat.id) }]),
    { label: contextChat.unread > 0 ? 'Mark as read' : 'Mark as unread', icon: '✅', onClick: () => contextChat.unread > 0 ? onMarkRead(contextChat.id) : onMarkUnread(contextChat.id), dividerAfter: true },
    ...(isArchived
      ? [{ label: 'Unarchive', icon: '📂', onClick: () => onUnarchiveChat(contextChat.id) }]
      : [{ label: 'Archive chat', icon: '📁', onClick: () => onArchiveChat(contextChat.id) }]),
    { label: 'Clear history', icon: '🧹', onClick: () => onClearHistory(contextChat.id) },
    ...(customFolders.length > 0 ? [{ label: 'Move to folder...', icon: '📂', onClick: () => {} }] : []),
    ...(contextChat.type === 'personal' ? [{ label: 'Block user', icon: '🚫', danger: true, onClick: () => onBlockUser(contextChat.id) }] : []),
    { label: contextChat.type === 'group' || contextChat.type === 'channel' ? 'Leave' : 'Delete chat', icon: '🗑️', danger: true, onClick: () => onDeleteChat(contextChat.id) },
  ] : [];

  // ========= COLLAPSED MINI MODE =========
  if (collapsed && !isMobile) {
    return (
      <div className="w-full h-screen flex flex-col border-r border-border bg-card">
        {/* Expand button */}
        <div className="px-2 py-3 flex justify-center">
          <button onClick={onExpand} className="p-2 rounded-lg hover:bg-dex-hover transition-colors text-muted-foreground">
            <Menu size={20} />
          </button>
        </div>

        {/* Mini avatar list */}
        <div className="flex-1 overflow-y-auto px-1 py-1 space-y-1">
          {filteredChats.map(chat => {
            const isActive = activeChat === chat.id;
            const isSaved = chat.id === 'saved';
            return (
              <button
                key={chat.id}
                onClick={() => onSelectChat(chat.id)}
                onContextMenu={e => handleContextMenu(e, chat.id)}
                className={`w-full flex items-center justify-center py-1.5 rounded-lg transition-colors ${isActive ? 'bg-primary/[0.15]' : 'hover:bg-dex-hover'}`}
                title={chat.name}
              >
                <div className="relative">
                  <div
                    className={`w-10 h-10 rounded-full flex items-center justify-center text-xs font-semibold text-white ${isSaved ? 'bg-primary/20 text-lg' : ''}`}
                    style={isSaved ? {} : { background: `hsl(${chat.avatarColor})` }}
                  >
                    {isSaved ? '🔖' : chat.avatar}
                  </div>
                  {chat.online && !isSaved && (
                    <div className="absolute bottom-0 right-0 w-2.5 h-2.5 rounded-full bg-dex-online border-2 border-card" />
                  )}
                  {(chat.unread > 0 || chat.markedUnread) && (
                    <span className="absolute -top-1 -right-1 text-[9px] font-bold px-1 min-w-[16px] h-4 flex items-center justify-center rounded-full bg-primary text-primary-foreground">
                      {chat.unread > 0 ? chat.unread : ''}
                    </span>
                  )}
                </div>
              </button>
            );
          })}
        </div>

        {contextMenu && (
          <ContextMenu x={contextMenu.x} y={contextMenu.y} items={contextItems} onClose={() => setContextMenu(null)} />
        )}
      </div>
    );
  }

  return (
    <div className={`${isMobile ? 'w-full' : 'w-full'} h-screen flex flex-col border-r border-border bg-card flex-shrink-0`} style={isMobile ? { paddingTop: 'env(safe-area-inset-top)' } : undefined}>
      {/* Header */}
      <div className="px-4 py-3 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <button onClick={() => setShowHamburger(true)} className="p-2 rounded-lg hover:bg-dex-hover transition-colors text-muted-foreground">
            <Menu size={20} />
          </button>
          <DexsterLogo size="sm" />
        </div>
        <div className="flex items-center gap-0.5">
          <NotificationBell />
          <button onClick={() => setShowSearch(!showSearch)} className="p-2 rounded-lg hover:bg-dex-hover transition-colors text-muted-foreground">
            <Search size={18} />
          </button>
        </div>
      </div>

      {/* Hamburger Drawer */}
      {showHamburger && (
        <>
          <div className="fixed inset-0 bg-black/40 z-[100]" onClick={() => setShowHamburger(false)} />
          <div className="fixed top-0 left-0 bottom-0 w-[280px] bg-card z-[101] flex flex-col animate-[slideInLeft_0.2s_ease-out] shadow-2xl">
            {/* Profile section */}
            <div className="p-5 pb-3 bg-dex-surface">
              <div className="mb-3">
                <DexsterLogo size="md" />
              </div>
              <p className="text-foreground font-semibold text-base">Dexster User</p>
              <p className="text-muted-foreground text-xs mt-0.5">Set Emoji Status ›</p>
            </div>

            {/* Menu items */}
            <div className="flex-1 overflow-y-auto py-2">
              {[
                { icon: <User size={20} />, label: 'My Profile', action: () => { setShowHamburger(false); setShowProfile(true); } },
                { icon: <Users size={20} />, label: 'New Group', action: () => { setShowHamburger(false); onCreateGroup(); } },
                { icon: <Megaphone size={20} />, label: 'New Channel', action: () => { setShowHamburger(false); onCreateChannel(); } },
                { icon: <User size={20} />, label: 'Contacts', action: () => { setShowHamburger(false); if (isMobile) setMobileTab('contacts'); } },
                { icon: <Phone size={20} />, label: 'Calls', action: () => { setShowHamburger(false); } },
                { icon: <Bookmark size={20} />, label: 'Saved Messages', action: () => { setShowHamburger(false); onSelectChat('saved'); } },
                { icon: <Settings size={20} />, label: 'Settings', action: () => { setShowHamburger(false); if (isMobile) setMobileTab('settings'); } },
              ].map((item) => (
                <button
                  key={item.label}
                  onClick={item.action}
                  className="flex items-center gap-4 w-full px-5 py-3 text-sm text-foreground hover:bg-dex-hover transition-colors"
                >
                  <span className="text-muted-foreground">{item.icon}</span>
                  {item.label}
                </button>
              ))}
            </div>

            {/* Night Mode */}
            <div className="border-t border-border px-5 py-3 flex items-center justify-between">
              <div className="flex items-center gap-4 text-sm text-foreground">
                <Moon size={20} className="text-muted-foreground" />
                Night Mode
              </div>
              <Switch
                checked={darkMode}
                onCheckedChange={(val) => {
                  setDarkMode(val);
                  document.documentElement.classList.toggle('dark', val);
                }}
              />
            </div>
          </div>
        </>
      )}

      {/* Search */}
      {showSearch && (
        <div className="px-4 pb-2 animate-[slideDown_0.2s_ease-out]">
          <input autoFocus value={searchQuery} onChange={e => setSearchQuery(e.target.value)} placeholder="Search..."
            className="w-full px-4 py-2 rounded-full bg-muted border border-border/50 text-sm text-foreground placeholder:text-muted-foreground/50 focus:outline-none focus:ring-1 focus:ring-primary" />
        </div>
      )}

      {/* Show chat content only on 'chats' tab (mobile) or always (desktop) */}
      {(!isMobile || mobileTab === 'chats') && (
        <>
          {/* Folder Tabs */}
          <div className="flex gap-1 px-4 pb-2 overflow-x-auto scrollbar-none" style={isMobile ? { WebkitOverflowScrolling: 'touch' } : undefined}>
            {allFolders.map(f => {
              const unread = folderUnread(f.id);
              const isFolderActive = activeFolder === f.id;
              return (
                <button key={f.id} onClick={() => setActiveFolder(f.id)}
                  className={`flex items-center gap-1.5 ${isMobile ? 'px-4 py-2 text-sm' : 'px-3 py-1.5 text-xs'} rounded-full font-medium whitespace-nowrap transition-colors ${isFolderActive ? 'bg-primary text-primary-foreground' : 'bg-muted/50 text-muted-foreground hover:bg-muted'}`}>
                  {f.label}
                  {unread > 0 && (
                    <span className={`text-[10px] px-1.5 rounded-full ${isFolderActive ? 'bg-white/30 text-white' : 'bg-primary-foreground/20'}`}>{unread}</span>
                  )}
                </button>
              );
            })}
            <button onClick={onCreateFolder} className="flex items-center px-2 py-1.5 rounded-full text-xs font-medium text-muted-foreground hover:bg-muted/50 transition-colors">+</button>
          </div>

          {/* Chat List */}
          <div
            ref={chatListRef}
            className="flex-1 overflow-y-auto relative"
            onTouchStart={isMobile ? handlePullStart : undefined}
            onTouchMove={isMobile ? handlePullMove : undefined}
            onTouchEnd={isMobile ? handlePullEnd : undefined}
          >
            {/* Pull-to-refresh indicator */}
            {isMobile && (pullDistance > 0 || isRefreshing) && (
              <div
                className="flex items-center justify-center transition-all duration-200"
                style={{ height: isRefreshing ? 48 : pullDistance, opacity: Math.min(pullDistance / 70, 1) }}
              >
                <RefreshCw
                  size={20}
                  className={`text-primary ${isRefreshing ? 'animate-spin' : ''}`}
                  style={!isRefreshing ? { transform: `rotate(${pullDistance * 3}deg)` } : undefined}
                />
              </div>
            )}

            {/* Empty state when no conversations */}
            {filteredChats.length === 0 && archivedChats.length === 0 && (
              <div className="flex flex-col items-center justify-center h-full px-8 text-center py-16">
                <div className="text-5xl mb-4">💬</div>
                <h3 className="text-base font-semibold text-foreground mb-2">No conversations yet</h3>
                <p className="text-sm text-muted-foreground mb-5">
                  Start a new chat, create a group, or join a channel to get started.
                </p>
                <button
                  onClick={onNewChat}
                  className="px-5 py-2.5 rounded-xl bg-primary text-primary-foreground text-sm font-medium hover:opacity-90 transition-opacity"
                >
                  Start a conversation
                </button>
              </div>
            )}

            {/* Archived section */}
            {archivedChats.length > 0 && (
              <button onClick={() => setShowArchived(!showArchived)}
                className="w-full flex items-center gap-3 px-4 py-2.5 hover:bg-dex-hover transition-colors text-left border-b border-border">
                <div className="w-12 h-12 rounded-full bg-primary/20 flex items-center justify-center text-primary text-lg">📁</div>
                <div className="flex-1 min-w-0">
                  <span className="text-sm font-semibold text-foreground">Archived Chats</span>
                  <p className="text-xs text-muted-foreground">{archivedChats.length} chat{archivedChats.length !== 1 ? 's' : ''}</p>
                </div>
                {showArchived ? <ChevronDown size={16} className="text-muted-foreground" /> : <ChevronRight size={16} className="text-muted-foreground" />}
              </button>
            )}
            {showArchived && archivedChats.map(chat => (
              <button key={chat.id} onClick={() => { onSelectChat(chat.id); }}
                onContextMenu={e => handleContextMenu(e, chat.id)}
                className="w-full flex items-center gap-3 px-4 py-2.5 hover:bg-dex-hover transition-colors text-left bg-muted/20">
                <div className="w-12 h-12 rounded-full flex items-center justify-center text-sm font-semibold text-white" style={{ background: `hsl(${chat.avatarColor})` }}>{chat.avatar}</div>
                <div className="flex-1 min-w-0">
                  <span className="text-sm font-semibold text-foreground">{chat.name}</span>
                  <p className="text-xs text-muted-foreground truncate max-w-[60vw] md:max-w-[200px]">{chat.lastMessage}</p>
                </div>
                <span className="text-[11px] text-muted-foreground flex-shrink-0">{chat.lastTime}</span>
              </button>
            ))}

            {filteredChats.map((chat, i) => {
              const isPinned = chat.pinned;
              const nextIsPinned = filteredChats[i + 1]?.pinned;
              const draft = chatDrafts[chat.id];
              const isSaved = chat.id === 'saved';
              const isActive = activeChat === chat.id;
              return (
                <React.Fragment key={chat.id}>
                  <button onClick={() => onSelectChat(chat.id)} onContextMenu={(e) => handleContextMenu(e, chat.id)}
                    className={`w-full flex items-center gap-3 px-4 ${isMobile ? 'py-3.5' : 'py-2.5'} transition-colors text-left active:bg-primary/[0.1] ${isActive ? 'bg-primary/[0.15] border-l-[3px] border-l-primary' : 'hover:bg-dex-hover border-l-[3px] border-l-transparent'}`}>
                    <div className="relative flex-shrink-0">
                      <div className={`w-12 h-12 rounded-full flex items-center justify-center text-sm font-semibold text-white ${isSaved ? 'bg-primary/20 text-2xl' : ''}`}
                        style={isSaved ? {} : { background: `hsl(${chat.avatarColor})` }}>
                        {isSaved ? '🔖' : chat.avatar}
                      </div>
                      {chat.online && !isSaved && (
                        <div className="absolute bottom-0 right-0 w-3 h-3 rounded-full bg-dex-online border-2 border-card" style={{ animation: 'pulseOnline 2s infinite' }} />
                      )}
                    </div>
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
                        <p className="text-xs text-muted-foreground truncate max-w-[60vw] md:max-w-[200px]">
                          {chat.typing ? (
                            <span className="text-primary">typing...</span>
                          ) : draft ? (
                            <><span className="text-destructive font-medium">[Draft]</span> {draft.slice(0, 30)}</>
                          ) : (
                            <>
                              {chat.lastMessageSender && <span className="font-medium text-foreground/70">{chat.lastMessageSender}: </span>}
                              {chat.lastMessage}
                            </>
                          )}
                        </p>
                        {(chat.unread > 0 || chat.markedUnread) && (
                          chat.markedUnread && chat.unread === 0 ? (
                            <span className="w-3 h-3 rounded-full bg-primary flex-shrink-0 ml-2" />
                          ) : (
                            <span className={`text-[11px] font-bold px-1.5 min-w-[20px] h-5 flex items-center justify-center rounded-full flex-shrink-0 ml-2 ${chat.muted ? 'bg-muted-foreground/40' : 'bg-primary'} text-primary-foreground`}>
                              {chat.unread}
                            </span>
                          )
                        )}
                      </div>
                    </div>
                  </button>
                  {isPinned && !nextIsPinned && <div className="h-px bg-border/60 mx-4 my-0.5" />}
                </React.Fragment>
              );
            })}
          </div>
        </>
      )}

      {/* Contacts tab */}
      {isMobile && mobileTab === 'contacts' && (
        <ContactsTab chats={chats} onSelectChat={onSelectChat} onNewChat={onNewChat} />
      )}

      {/* Saved Messages tab */}
      {isMobile && mobileTab === 'saved' && (
        <SavedMessagesTab onNavigateToMessage={(chatId) => onSelectChat(chatId)} />
      )}

      {/* Settings tab */}
      {isMobile && mobileTab === 'settings' && (
        <SettingsTab />
      )}

      {contextMenu && (
        <ContextMenu x={contextMenu.x} y={contextMenu.y} items={contextItems} onClose={() => setContextMenu(null)} />
      )}

      {/* Mobile bottom navigation */}
      {isMobile && (
        <MobileBottomNav
          activeTab={mobileTab}
          onTabChange={setMobileTab}
          unreadCount={chats.reduce((s, c) => s + c.unread, 0)}
        />
      )}

      {/* My Profile Panel */}
      {showProfile && <MyProfilePanel onClose={() => setShowProfile(false)} />}
    </div>
  );
};

export default Sidebar;
