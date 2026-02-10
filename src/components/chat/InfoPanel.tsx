import React from 'react';
import { Chat } from '@/types/chat';
import { X, Bell, BellOff, Ban, AlertTriangle, Trash2 } from 'lucide-react';

interface InfoPanelProps {
  chat: Chat;
  open: boolean;
  onClose: () => void;
  onMute: () => void;
}

const InfoPanel: React.FC<InfoPanelProps> = ({ chat, open, onClose, onMute }) => {
  if (!open) return null;

  const isChannel = chat.type === 'channel';
  const isGroup = chat.type === 'group';

  return (
    <div
      className="w-[360px] h-screen flex-shrink-0 border-l border-border bg-card overflow-y-auto animate-[slideInRight_0.3s_cubic-bezier(0.25,1,0.5,1)]"
    >
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3 border-b border-border">
        <span className="text-sm font-semibold text-foreground">
          {isChannel ? 'Channel Info' : isGroup ? 'Group Info' : 'Chat Info'}
        </span>
        <button onClick={onClose} className="p-1.5 rounded-lg hover:bg-dex-hover text-muted-foreground"><X size={18} /></button>
      </div>

      {/* Profile */}
      <div className="flex flex-col items-center py-6 px-4">
        <div className="w-20 h-20 rounded-full flex items-center justify-center text-2xl font-bold text-white mb-3" style={{ background: `hsl(${chat.avatarColor})` }}>
          {chat.avatar}
        </div>
        <h3 className="text-lg font-bold text-foreground">{chat.name}</h3>
        {chat.username && <p className="text-xs text-muted-foreground">{chat.username}</p>}
        <p className="text-xs text-muted-foreground mt-0.5">
          {chat.online ? 'online' : isChannel ? `${chat.subscriberCount?.toLocaleString()} subscribers` : isGroup ? `${chat.memberCount} members` : chat.lastSeen || 'offline'}
        </p>
      </div>

      {/* Info Fields */}
      <div className="px-4 space-y-0.5">
        {chat.phone && (
          <div className="flex items-center gap-3 py-2.5 text-sm">
            <span className="text-base">📱</span>
            <div><div className="text-foreground">{chat.phone}</div><div className="text-[11px] text-muted-foreground">Phone</div></div>
          </div>
        )}
        {chat.username && (
          <div className="flex items-center gap-3 py-2.5 text-sm">
            <span className="text-base">@</span>
            <div><div className="text-foreground">{chat.username}</div><div className="text-[11px] text-muted-foreground">Username</div></div>
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

      <div className="h-px bg-border mx-4 my-3" />

      {/* Shared Media placeholder */}
      <div className="px-4">
        <h4 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2">Shared Media</h4>
        <div className="grid grid-cols-3 gap-1">
          {Array.from({ length: 6 }).map((_, i) => (
            <div key={i} className="aspect-square rounded-lg bg-muted/50 flex items-center justify-center text-muted-foreground/30 text-2xl">🖼</div>
          ))}
        </div>
        <div className="mt-3 space-y-1 text-sm text-muted-foreground">
          {['📷 Photos (42)', '📹 Videos (8)', '📄 Files (15)', '🔗 Links (23)'].map(s => (
            <div key={s} className="py-1.5 hover:text-foreground cursor-pointer transition-colors">{s}</div>
          ))}
        </div>
      </div>

      <div className="h-px bg-border mx-4 my-3" />

      {/* Members for groups */}
      {isGroup && chat.members && (
        <div className="px-4 mb-3">
          <h4 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2">Members ({chat.members.length})</h4>
          {chat.members.map(m => (
            <div key={m.id} className="flex items-center gap-2 py-2">
              <div className="w-8 h-8 rounded-full flex items-center justify-center text-xs font-semibold text-white" style={{ background: `hsl(${m.color})` }}>{m.avatar}</div>
              <span className="text-sm text-foreground">{m.name}</span>
              {m.online && <span className="w-2 h-2 rounded-full bg-dex-online" />}
            </div>
          ))}
        </div>
      )}

      {/* Danger Zone */}
      <div className="px-4 pb-6 space-y-1">
        <button className="flex items-center gap-3 w-full py-2.5 text-sm text-destructive hover:bg-destructive/10 rounded-lg px-2 transition-colors">
          <Ban size={16} /> Block user
        </button>
        <button className="flex items-center gap-3 w-full py-2.5 text-sm text-destructive hover:bg-destructive/10 rounded-lg px-2 transition-colors">
          <AlertTriangle size={16} /> Report
        </button>
        <button className="flex items-center gap-3 w-full py-2.5 text-sm text-destructive hover:bg-destructive/10 rounded-lg px-2 transition-colors">
          <Trash2 size={16} /> {isChannel || isGroup ? 'Leave' : 'Delete chat'}
        </button>
      </div>
    </div>
  );
};

export default InfoPanel;
