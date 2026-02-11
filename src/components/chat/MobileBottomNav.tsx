import React from 'react';
import { MessageSquare, Users, Bookmark, Settings } from 'lucide-react';

export type MobileTab = 'chats' | 'contacts' | 'saved' | 'settings';

interface MobileBottomNavProps {
  activeTab: MobileTab;
  onTabChange: (tab: MobileTab) => void;
  unreadCount?: number;
}

const tabs: { id: MobileTab; label: string; icon: React.ElementType }[] = [
  { id: 'chats', label: 'Chats', icon: MessageSquare },
  { id: 'contacts', label: 'Contacts', icon: Users },
  { id: 'saved', label: 'Saved', icon: Bookmark },
  { id: 'settings', label: 'Settings', icon: Settings },
];

const MobileBottomNav: React.FC<MobileBottomNavProps> = ({ activeTab, onTabChange, unreadCount = 0 }) => {
  return (
    <nav
      className="flex items-stretch border-t border-border bg-card"
      style={{ paddingBottom: 'env(safe-area-inset-bottom)' }}
    >
      {tabs.map(({ id, label, icon: Icon }) => {
        const isActive = activeTab === id;
        return (
          <button
            key={id}
            onClick={() => onTabChange(id)}
            className={`flex-1 flex flex-col items-center justify-center gap-0.5 py-2.5 transition-colors relative ${
              isActive ? 'text-primary' : 'text-muted-foreground'
            }`}
          >
            <div className="relative">
              <Icon size={22} strokeWidth={isActive ? 2.2 : 1.8} />
              {id === 'chats' && unreadCount > 0 && (
                <span className="absolute -top-1.5 -right-2.5 text-[10px] font-bold px-1.5 min-w-[18px] h-[18px] flex items-center justify-center rounded-full bg-primary text-primary-foreground">
                  {unreadCount > 99 ? '99+' : unreadCount}
                </span>
              )}
            </div>
            <span className={`text-[10px] font-medium ${isActive ? 'text-primary' : ''}`}>{label}</span>
            {isActive && (
              <div className="absolute top-0 left-1/2 -translate-x-1/2 w-8 h-0.5 rounded-full bg-primary" />
            )}
          </button>
        );
      })}
    </nav>
  );
};

export default MobileBottomNav;
