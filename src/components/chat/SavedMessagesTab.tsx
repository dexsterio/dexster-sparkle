import React, { useState, useEffect, useCallback } from 'react';
import { Trash2, MessageSquare, Search } from 'lucide-react';

interface SavedMessage {
  id: string;
  chatId: string;
  text: string;
  senderName: string;
  time: string;
  date: string;
  savedAt: string;
}

interface SavedMessagesTabProps {
  onNavigateToMessage?: (chatId: string, messageId: string) => void;
}

const SavedMessagesTab: React.FC<SavedMessagesTabProps> = ({ onNavigateToMessage }) => {
  const [bookmarks, setBookmarks] = useState<SavedMessage[]>([]);
  const [searchQuery, setSearchQuery] = useState('');

  const loadBookmarks = useCallback(() => {
    try {
      const stored = JSON.parse(localStorage.getItem('dexster_bookmarks') || '[]');
      setBookmarks(stored.sort((a: SavedMessage, b: SavedMessage) =>
        new Date(b.savedAt).getTime() - new Date(a.savedAt).getTime()
      ));
    } catch {
      setBookmarks([]);
    }
  }, []);

  useEffect(() => {
    loadBookmarks();
  }, [loadBookmarks]);

  const removeBookmark = useCallback((id: string) => {
    try {
      const stored = JSON.parse(localStorage.getItem('dexster_bookmarks') || '[]');
      const filtered = stored.filter((b: SavedMessage) => b.id !== id);
      localStorage.setItem('dexster_bookmarks', JSON.stringify(filtered));
      setBookmarks(filtered);
    } catch { /* ignore */ }
  }, []);

  const clearAll = useCallback(() => {
    localStorage.setItem('dexster_bookmarks', JSON.stringify([]));
    setBookmarks([]);
  }, []);

  const filtered = searchQuery
    ? bookmarks.filter(b =>
        b.text.toLowerCase().includes(searchQuery.toLowerCase()) ||
        b.senderName.toLowerCase().includes(searchQuery.toLowerCase())
      )
    : bookmarks;

  return (
    <div className="flex-1 flex flex-col overflow-hidden">
      {/* Search */}
      <div className="px-4 pt-3 pb-2">
        <div className="relative">
          <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
          <input
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
            placeholder="Search saved messages..."
            className="w-full pl-9 pr-4 py-2.5 rounded-full bg-muted border border-border/50 text-sm text-foreground placeholder:text-muted-foreground/50 focus:outline-none focus:ring-1 focus:ring-primary"
          />
        </div>
      </div>

      {/* Header with count & clear */}
      {bookmarks.length > 0 && (
        <div className="flex items-center justify-between px-4 pb-2">
          <span className="text-xs font-medium text-muted-foreground">
            {filtered.length} saved message{filtered.length !== 1 ? 's' : ''}
          </span>
          <button
            onClick={clearAll}
            className="text-xs text-destructive hover:text-destructive/80 transition-colors font-medium"
          >
            Clear all
          </button>
        </div>
      )}

      <div className="flex-1 overflow-y-auto">
        {filtered.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-16 text-muted-foreground gap-3">
            <div className="w-16 h-16 rounded-full bg-muted/50 flex items-center justify-center text-3xl">🔖</div>
            <span className="text-sm font-medium">
              {searchQuery ? 'No matching messages' : 'No saved messages'}
            </span>
            <span className="text-xs text-center px-8">
              {searchQuery ? 'Try a different search' : 'Long-press a message and tap "Bookmark" to save it here'}
            </span>
          </div>
        ) : (
          filtered.map(bookmark => (
            <div
              key={bookmark.id}
              className="flex items-start gap-3 px-4 py-3 hover:bg-dex-hover transition-colors border-b border-border/30 group"
            >
              <div className="w-9 h-9 rounded-full bg-primary/15 flex items-center justify-center flex-shrink-0 mt-0.5">
                <MessageSquare size={16} className="text-primary" />
              </div>
              <div
                className="flex-1 min-w-0 cursor-pointer"
                onClick={() => onNavigateToMessage?.(bookmark.chatId, bookmark.id)}
              >
                <div className="flex items-center gap-2">
                  <span className="text-xs font-semibold text-foreground">{bookmark.senderName}</span>
                  <span className="text-[10px] text-muted-foreground">{bookmark.date} · {bookmark.time}</span>
                </div>
                <p className="text-sm text-foreground/80 mt-0.5 line-clamp-3">{bookmark.text}</p>
              </div>
              <button
                onClick={() => removeBookmark(bookmark.id)}
                className="p-1.5 rounded-lg opacity-100 md:opacity-0 md:group-hover:opacity-100 hover:bg-destructive/10 transition-all flex-shrink-0"
              >
                <Trash2 size={14} className="text-destructive" />
              </button>
            </div>
          ))
        )}
      </div>
    </div>
  );
};

export default SavedMessagesTab;
