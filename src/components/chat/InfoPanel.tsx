import React from 'react';
import { Chat, Message } from '@/types/chat';
import { X, Bell, BellOff, Ban, AlertTriangle, Trash2, Clock, Link, LogOut, Settings, Edit3, Shield, UserPlus, Copy } from 'lucide-react';

interface InfoPanelProps {
  chat: Chat;
  open: boolean;
  onClose: () => void;
  onMute: () => void;
  onBlock: () => void;
  onUnblock: () => void;
  onReport: () => void;
  onLeave: () => void;
  onDelete: () => void;
  onSetAutoDelete: () => void;
  messages: Message[];
  onManageChannel?: () => void;
  onManageGroup?: () => void;
  isMobile?: boolean;
}

const InfoPanel: React.FC<InfoPanelProps> = ({ chat, open, onClose, onMute, onBlock, onUnblock, onReport, onLeave, onDelete, onSetAutoDelete, messages, onManageChannel, onManageGroup, isMobile }) => {
  if (!open) return null;

  const isChannel = chat.type === 'channel';
  const isGroup = chat.type === 'group';
  const isSaved = chat.id === 'saved';
  const pinnedMessages = messages.filter(m => m.pinned);
  const mediaCount = messages.filter(m => m.type === 'message' && m.text).length;

  const autoDeleteLabel = chat.autoDeleteTimer
    ? chat.autoDeleteTimer < 86400 ? `${chat.autoDeleteTimer / 3600}h`
      : chat.autoDeleteTimer < 604800 ? `${chat.autoDeleteTimer / 86400}d`
      : `${chat.autoDeleteTimer / 604800}w`
    : 'Off';

  return (
    <div className={`${isMobile ? 'w-full h-full' : 'w-[360px] h-screen'} flex-shrink-0 ${isMobile ? '' : 'border-l border-border'} bg-card overflow-y-auto ${isMobile ? '' : 'animate-[slideInRight_0.3s_cubic-bezier(0.25,1,0.5,1)]'}`}>
      <div className="flex items-center justify-between px-4 py-3 border-b border-border">
        <span className="text-sm font-semibold text-foreground">
          {isSaved ? 'Saved Messages' : isChannel ? 'Channel Info' : isGroup ? 'Group Info' : 'Chat Info'}
        </span>
        <div className="flex items-center gap-1">
          {/* Edit/Manage button for admins/owners */}
          {isChannel && (chat.role === 'owner' || chat.role === 'admin') && onManageChannel && (
            <button onClick={onManageChannel} className="p-1.5 rounded-lg hover:bg-dex-hover text-muted-foreground" title="Manage Channel">
              <Edit3 size={16} />
            </button>
          )}
          {isGroup && (chat.role === 'owner' || chat.role === 'admin') && onManageGroup && (
            <button onClick={onManageGroup} className="p-1.5 rounded-lg hover:bg-dex-hover text-muted-foreground" title="Manage Group">
              <Edit3 size={16} />
            </button>
          )}
          <button onClick={onClose} className="p-1.5 rounded-lg hover:bg-dex-hover text-muted-foreground"><X size={18} /></button>
        </div>
      </div>

      <div className="flex flex-col items-center py-6 px-4">
        <div className="w-20 h-20 rounded-full flex items-center justify-center text-2xl font-bold text-white mb-3"
          style={isSaved ? {} : { background: `hsl(${chat.avatarColor})` }}>
          {isSaved ? <span className="bg-primary/20 w-full h-full rounded-full flex items-center justify-center text-4xl">🔖</span> : chat.avatar}
        </div>
        <h3 className="text-lg font-bold text-foreground">{chat.name}</h3>
        {chat.username && <p className="text-xs text-muted-foreground">{chat.username}</p>}
        <p className="text-xs text-muted-foreground mt-0.5">
          {chat.online ? 'online' : isChannel ? `${chat.subscriberCount?.toLocaleString()} subscribers` : isGroup ? `${chat.memberCount} members` : chat.lastSeen || 'offline'}
        </p>
        {chat.blocked && <span className="mt-1 px-2 py-0.5 rounded-full bg-destructive/20 text-destructive text-xs">Blocked</span>}
      </div>

      <div className="px-4 space-y-0.5">
        {chat.phone && (
          <div className="flex items-center gap-3 py-2.5 text-sm">
            <span className="text-base">📱</span>
            <div><div className="text-foreground">{chat.phone}</div><div className="text-[11px] text-muted-foreground">Phone</div></div>
          </div>
        )}
        {chat.username && (
          <div className="flex items-center gap-3 py-2.5 text-sm cursor-pointer hover:bg-dex-hover rounded-lg px-1 -mx-1 transition-colors"
            onClick={() => { navigator.clipboard.writeText(`t.me/${chat.username?.replace('@', '')}`); }}>
            <span className="text-base">@</span>
            <div>
              <div className="text-foreground">{chat.username}</div>
              <div className="text-[11px] text-muted-foreground">{isChannel ? 'Link' : 'Username'}</div>
            </div>
            {isChannel && <Link size={12} className="text-muted-foreground ml-auto" />}
          </div>
        )}
        {chat.bio && (
          <div className="flex items-center gap-3 py-2.5 text-sm">
            <span className="text-base">ℹ️</span>
            <div><div className="text-foreground">{chat.bio}</div><div className="text-[11px] text-muted-foreground">Bio</div></div>
          </div>
        )}
        {isChannel && chat.description && (
          <div className="flex items-center gap-3 py-2.5 text-sm">
            <span className="text-base">📝</span>
            <div><div className="text-foreground">{chat.description}</div><div className="text-[11px] text-muted-foreground">Description</div></div>
          </div>
        )}
      </div>

      <div className="h-px bg-border mx-4 my-3" />

      {/* Notifications */}
      <div className="px-4">
        <button onClick={onMute} className="flex items-center justify-between w-full py-2.5 text-sm text-foreground">
          <div className="flex items-center gap-3">
            {chat.muted ? <BellOff size={16} /> : <Bell size={16} />}
            <span>Notifications</span>
          </div>
          <div className={`w-9 h-5 rounded-full transition-colors ${chat.muted ? 'bg-muted' : 'bg-primary'} flex items-center ${chat.muted ? 'justify-start' : 'justify-end'} px-0.5`}>
            <div className="w-4 h-4 rounded-full bg-white transition-all" />
          </div>
        </button>
      </div>

      {/* Auto-delete */}
      {!isSaved && (
        <>
          <div className="px-4">
            <button onClick={onSetAutoDelete} className="flex items-center justify-between w-full py-2.5 text-sm text-foreground hover:bg-dex-hover rounded-lg px-2 -mx-2 transition-colors">
              <div className="flex items-center gap-3">
                <Clock size={16} />
                <span>Auto-delete messages</span>
              </div>
              <span className="text-xs text-muted-foreground">{autoDeleteLabel}</span>
            </button>
          </div>
          <div className="h-px bg-border mx-4 my-3" />
        </>
      )}

      {/* Pinned Messages */}
      {pinnedMessages.length > 0 && (
        <>
          <div className="px-4 mb-3">
            <h4 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2">📌 Pinned Messages ({pinnedMessages.length})</h4>
            {pinnedMessages.map(m => (
              <div key={m.id} className="py-2 text-sm text-foreground border-l-2 border-primary/30 pl-2 mb-1 cursor-pointer hover:bg-dex-hover rounded-r transition-colors">
                <p className="truncate text-xs">{m.text.slice(0, 80)}</p>
                <span className="text-[10px] text-muted-foreground">{m.senderName} · {m.time}</span>
              </div>
            ))}
          </div>
          <div className="h-px bg-border mx-4 my-3" />
        </>
      )}

      {/* Shared Media */}
      <div className="px-4">
        <h4 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2">Shared Media</h4>
        <div className="grid grid-cols-3 gap-1">
          {Array.from({ length: 6 }).map((_, i) => (
            <div key={i} className="aspect-square rounded-lg bg-muted/30 border border-border/30 flex items-center justify-center text-muted-foreground/20 text-2xl">🖼</div>
          ))}
        </div>
        <div className="mt-3 space-y-0.5 text-sm text-muted-foreground">
          {[`📷 Photos (${Math.floor(mediaCount * 0.6)})`, `📹 Videos (${Math.floor(mediaCount * 0.15)})`, `📄 Files (${Math.floor(mediaCount * 0.15)})`, `🔗 Links (${Math.floor(mediaCount * 0.1)})`].map(s => (
            <div key={s} className="py-1.5 hover:text-foreground cursor-pointer transition-colors rounded-lg px-1 hover:bg-dex-hover">{s}</div>
          ))}
        </div>
      </div>

      <div className="h-px bg-border mx-4 my-3" />

      {/* Groups in Common (personal chats only) */}
      {!isChannel && !isGroup && !isSaved && (
        <>
          <div className="px-4 mb-3">
            <h4 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2">Groups in Common (1)</h4>
            <div className="flex items-center gap-2 py-2 hover:bg-dex-hover rounded-lg px-1 cursor-pointer transition-colors">
              <div className="w-8 h-8 rounded-full bg-[hsl(200,70%,50%)] flex items-center justify-center text-xs font-semibold text-white">DH</div>
              <span className="text-sm text-foreground">DevOps Hub</span>
            </div>
          </div>
          <div className="h-px bg-border mx-4 my-3" />
        </>
      )}

      {/* Members for groups */}
      {isGroup && chat.members && (
        <div className="px-4 mb-3">
          <h4 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2">Members ({chat.members.length})</h4>
          {chat.members.map((m, i) => (
            <div key={m.id} className="flex items-center gap-2 py-2 px-1 rounded-lg hover:bg-dex-hover cursor-pointer transition-colors">
              <div className="w-8 h-8 rounded-full flex items-center justify-center text-xs font-semibold text-white" style={{ background: `hsl(${m.color})` }}>{m.avatar}</div>
              <span className="text-sm text-foreground flex-1">{m.name}</span>
              {i === 0 && <span className="text-[10px] text-muted-foreground bg-muted/50 px-1.5 py-0.5 rounded">owner</span>}
              {m.online && <span className="w-2.5 h-2.5 rounded-full bg-dex-online" />}
            </div>
          ))}
        </div>
      )}

      {/* Danger Zone */}
      {!isSaved && (
        <div className="px-4 pb-6 space-y-1">
          {!isChannel && !isGroup && (
            <button onClick={chat.blocked ? onUnblock : onBlock}
              className="flex items-center gap-3 w-full py-2.5 text-sm text-destructive hover:bg-destructive/10 rounded-lg px-2 transition-colors">
              <Ban size={16} /> {chat.blocked ? 'Unblock user' : 'Block user'}
            </button>
          )}
          <button onClick={onReport}
            className="flex items-center gap-3 w-full py-2.5 text-sm text-destructive hover:bg-destructive/10 rounded-lg px-2 transition-colors">
            <AlertTriangle size={16} /> Report
          </button>
          {(isChannel || isGroup) ? (
            <button onClick={onLeave}
              className="flex items-center gap-3 w-full py-2.5 text-sm text-destructive hover:bg-destructive/10 rounded-lg px-2 transition-colors">
              <LogOut size={16} /> Leave {isChannel ? 'channel' : 'group'}
            </button>
          ) : (
            <button onClick={onDelete}
              className="flex items-center gap-3 w-full py-2.5 text-sm text-destructive hover:bg-destructive/10 rounded-lg px-2 transition-colors">
              <Trash2 size={16} /> Delete chat
            </button>
          )}
        </div>
      )}
    </div>
  );
};

export default InfoPanel;
