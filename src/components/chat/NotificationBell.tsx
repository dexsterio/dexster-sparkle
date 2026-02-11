import React, { useState, useRef, useEffect } from 'react';
import { Bell } from 'lucide-react';
import { useNotifications } from '@/hooks/useNotifications';

const NotificationBell: React.FC = () => {
  const { notifications, unreadCount, markRead } = useNotifications();
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    const handler = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, [open]);

  const handleOpen = () => {
    setOpen(!open);
    if (!open && unreadCount > 0) markRead();
  };

  return (
    <div className="relative" ref={ref}>
      <button onClick={handleOpen} className="p-2 rounded-lg hover:bg-dex-hover text-muted-foreground relative transition-colors">
        <Bell size={20} />
        {unreadCount > 0 && (
          <span className="absolute -top-0.5 -right-0.5 bg-primary text-primary-foreground text-[10px] font-bold px-1.5 min-w-[18px] text-center rounded-full">
            {unreadCount > 99 ? '99+' : unreadCount}
          </span>
        )}
      </button>
      {open && (
        <div className="absolute right-0 top-full mt-1 w-[320px] max-h-[400px] bg-popover border border-border rounded-xl shadow-xl z-50 animate-[contextIn_0.15s_ease-out] flex flex-col">
          <div className="flex items-center justify-between px-4 py-3 border-b border-border">
            <span className="text-sm font-semibold text-foreground">Notifications</span>
            {notifications.length > 0 && (
              <button onClick={() => markRead()} className="text-xs text-primary hover:underline">Mark all read</button>
            )}
          </div>
          <div className="flex-1 overflow-y-auto">
            {notifications.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-8 text-muted-foreground">
                <Bell size={24} className="mb-2 opacity-40" />
                <span className="text-sm">No notifications yet</span>
              </div>
            ) : (
              notifications.slice(0, 20).map(n => (
                <div key={n.id} className={`px-4 py-3 border-b border-border/50 hover:bg-dex-hover transition-colors cursor-pointer ${!n.read ? 'bg-primary/5' : ''}`}>
                  <p className="text-sm text-foreground">{n.message}</p>
                  <span className="text-[10px] text-muted-foreground">
                    {new Date(n.createdAt).toLocaleString('sv-SE', { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })}
                  </span>
                </div>
              ))
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default NotificationBell;
