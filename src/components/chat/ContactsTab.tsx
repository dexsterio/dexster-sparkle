import React, { useState, useMemo } from 'react';
import { Search, UserPlus } from 'lucide-react';
import { useUserSearch } from '@/hooks/useUserSearch';
import { Chat } from '@/types/chat';

interface ContactsTabProps {
  chats: Chat[];
  onSelectChat: (id: string) => void;
  onNewChat: () => void;
}

const ContactsTab: React.FC<ContactsTabProps> = ({ chats, onSelectChat, onNewChat }) => {
  const [searchQuery, setSearchQuery] = useState('');
  const { data: searchResults, isLoading } = useUserSearch(searchQuery);

  // Extract personal contacts from existing chats
  const contacts = useMemo(() => {
    return chats
      .filter(c => c.type === 'personal' && c.id !== 'saved')
      .sort((a, b) => {
        // Online first, then alphabetical
        if (a.online && !b.online) return -1;
        if (!a.online && b.online) return 1;
        return a.name.localeCompare(b.name);
      });
  }, [chats]);

  const onlineCount = contacts.filter(c => c.online).length;

  const showSearch = searchQuery.length >= 2;

  return (
    <div className="flex-1 flex flex-col overflow-hidden">
      {/* Search bar */}
      <div className="px-4 pt-3 pb-2">
        <div className="relative">
          <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
          <input
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
            placeholder="Search contacts or find users..."
            className="w-full pl-9 pr-4 py-2.5 rounded-full bg-muted border border-border/50 text-sm text-foreground placeholder:text-muted-foreground/50 focus:outline-none focus:ring-1 focus:ring-primary"
          />
        </div>
      </div>

      {/* Add contact button */}
      <button
        onClick={onNewChat}
        className="mx-4 mb-2 flex items-center gap-3 px-4 py-3 rounded-xl bg-primary/10 hover:bg-primary/20 transition-colors"
      >
        <div className="w-10 h-10 rounded-full bg-primary/20 flex items-center justify-center">
          <UserPlus size={18} className="text-primary" />
        </div>
        <span className="text-sm font-medium text-primary">Find new contacts</span>
      </button>

      <div className="flex-1 overflow-y-auto">
        {/* Search results */}
        {showSearch && (
          <div className="px-4 pb-2">
            <span className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
              {isLoading ? 'Searching...' : `${searchResults?.length || 0} users found`}
            </span>
          </div>
        )}

        {showSearch && searchResults?.map(user => (
          <button
            key={user.id}
            onClick={() => {
              // Try to find existing chat, otherwise trigger new chat
              const existingChat = chats.find(c => c.type === 'personal' && c.username === user.username);
              if (existingChat) {
                onSelectChat(existingChat.id);
              } else {
                onNewChat();
              }
            }}
            className="w-full flex items-center gap-3 px-4 py-3 hover:bg-dex-hover transition-colors text-left"
          >
            <div className="relative flex-shrink-0">
              <div className="w-11 h-11 rounded-full bg-primary/20 flex items-center justify-center text-sm font-semibold text-primary">
                {user.avatarUrl ? (
                  <img src={user.avatarUrl} alt="" className="w-full h-full rounded-full object-cover" />
                ) : (
                  user.displayName.slice(0, 2).toUpperCase()
                )}
              </div>
              {user.isOnline && (
                <div className="absolute bottom-0 right-0 w-3 h-3 rounded-full bg-dex-online border-2 border-card" />
              )}
            </div>
            <div className="flex-1 min-w-0">
              <span className="text-sm font-semibold text-foreground truncate block">{user.displayName}</span>
              <span className="text-xs text-muted-foreground truncate block">@{user.username}</span>
            </div>
          </button>
        ))}

        {/* Contacts list */}
        {!showSearch && (
          <>
            {/* Online section */}
            {onlineCount > 0 && (
              <div className="px-4 pt-2 pb-1">
                <span className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
                  Online — {onlineCount}
                </span>
              </div>
            )}
            {contacts.filter(c => c.online).map(contact => (
              <ContactItem key={contact.id} contact={contact} onSelect={onSelectChat} />
            ))}

            {/* Offline section */}
            {contacts.filter(c => !c.online).length > 0 && (
              <div className="px-4 pt-3 pb-1">
                <span className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
                  Offline — {contacts.filter(c => !c.online).length}
                </span>
              </div>
            )}
            {contacts.filter(c => !c.online).map(contact => (
              <ContactItem key={contact.id} contact={contact} onSelect={onSelectChat} />
            ))}

            {contacts.length === 0 && (
              <div className="flex flex-col items-center justify-center py-12 text-muted-foreground gap-2">
                <span className="text-3xl">👤</span>
                <span className="text-sm">No contacts yet</span>
                <span className="text-xs text-center px-8">Start a conversation to add contacts</span>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
};

const ContactItem: React.FC<{ contact: Chat; onSelect: (id: string) => void }> = ({ contact, onSelect }) => (
  <button
    onClick={() => onSelect(contact.id)}
    className="w-full flex items-center gap-3 px-4 py-3 hover:bg-dex-hover transition-colors text-left active:bg-primary/[0.1]"
  >
    <div className="relative flex-shrink-0">
      <div
        className="w-11 h-11 rounded-full flex items-center justify-center text-sm font-semibold text-white"
        style={{ background: `hsl(${contact.avatarColor})` }}
      >
        {contact.avatar}
      </div>
      {contact.online && (
        <div className="absolute bottom-0 right-0 w-3 h-3 rounded-full bg-dex-online border-2 border-card" style={{ animation: 'pulseOnline 2s infinite' }} />
      )}
    </div>
    <div className="flex-1 min-w-0">
      <span className="text-sm font-semibold text-foreground truncate block">{contact.name}</span>
      <span className="text-xs text-muted-foreground truncate block">
        {contact.online ? 'online' : contact.lastSeen ? `last seen ${contact.lastSeen}` : 'offline'}
      </span>
    </div>
  </button>
);

export default ContactsTab;
