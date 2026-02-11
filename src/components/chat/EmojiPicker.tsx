import React, { useState, useMemo } from 'react';
import { EMOJI_DATA } from '@/data/emojiData';
import { Search, X } from 'lucide-react';

interface EmojiPickerProps {
  onSelect: (emoji: string) => void;
  onClose: () => void;
  recentEmojis: string[];
  isMobile?: boolean;
}

const CATEGORY_ICONS: Record<string, string> = {
  Recent: '🕐',
  Smileys: '😊',
  Gestures: '👋',
  Hearts: '❤️',
  Animals: '🐶',
  Food: '🍎',
  Activities: '⚽',
  Travel: '🚗',
  Objects: '💡',
  Symbols: '💯',
};

const EmojiPicker: React.FC<EmojiPickerProps> = ({ onSelect, onClose, recentEmojis, isMobile }) => {
  const [search, setSearch] = useState('');
  const [activeCategory, setActiveCategory] = useState(recentEmojis.length > 0 ? 'Recent' : 'Smileys');

  const allEmojis = useMemo(() => {
    const all: string[] = [];
    Object.values(EMOJI_DATA).forEach(arr => all.push(...arr));
    return all;
  }, []);

  const filteredEmojis = useMemo(() => {
    if (search) return allEmojis.filter(e => e.includes(search));
    if (activeCategory === 'Recent') return recentEmojis;
    return EMOJI_DATA[activeCategory] || [];
  }, [search, activeCategory, recentEmojis, allEmojis]);

  const categories = recentEmojis.length > 0
    ? ['Recent', ...Object.keys(EMOJI_DATA)]
    : Object.keys(EMOJI_DATA);

  if (isMobile) {
    return (
      <>
        <div className="fixed inset-0 z-[29]" onClick={onClose} />
        <div className="fixed bottom-0 left-0 right-0 z-30 bg-popover border-t border-border rounded-t-2xl shadow-xl animate-[slideUp_0.25s_ease-out] overflow-hidden" style={{ paddingBottom: 'env(safe-area-inset-bottom)', maxHeight: '55vh' }}>
          <div className="w-10 h-1 bg-muted-foreground/30 rounded-full mx-auto my-2" />
          {/* Search */}
          <div className="flex items-center gap-2 px-3 py-2 border-b border-border">
            <Search size={14} className="text-muted-foreground" />
            <input autoFocus value={search} onChange={e => setSearch(e.target.value)} placeholder="Search emoji..."
              className="flex-1 bg-transparent text-sm text-foreground placeholder:text-muted-foreground/50 focus:outline-none" />
            <button onClick={onClose} className="p-1 rounded active:bg-dex-hover text-muted-foreground"><X size={14} /></button>
          </div>
          {/* Category Tabs */}
          <div className="flex gap-1 px-2 py-1.5 border-b border-border overflow-x-auto scrollbar-none" style={{ WebkitOverflowScrolling: 'touch' }}>
            {categories.map(cat => (
              <button key={cat} onClick={() => { setActiveCategory(cat); setSearch(''); }}
                className={`p-2 rounded-lg text-base transition-colors flex-shrink-0 ${activeCategory === cat && !search ? 'bg-primary/20' : 'active:bg-dex-hover'}`}>
                {CATEGORY_ICONS[cat] || '❓'}
              </button>
            ))}
          </div>
          {/* Emoji Grid */}
          <div className="overflow-y-auto p-2" style={{ maxHeight: 'calc(55vh - 120px)' }}>
            {!search && <div className="text-[10px] text-muted-foreground uppercase tracking-wider mb-1 px-1">{activeCategory}</div>}
            <div className="grid grid-cols-8 gap-0.5">
              {filteredEmojis.map((emoji, i) => (
                <button key={`${emoji}-${i}`} onClick={() => onSelect(emoji)}
                  className="w-10 h-10 flex items-center justify-center text-xl active:bg-dex-hover rounded-lg transition-transform active:scale-110">
                  {emoji}
                </button>
              ))}
            </div>
            {filteredEmojis.length === 0 && <div className="text-center text-sm text-muted-foreground py-8">No emojis found</div>}
          </div>
        </div>
      </>
    );
  }

  return (
    <div className="absolute bottom-full left-0 mb-2 w-[340px] bg-popover border border-border rounded-2xl shadow-xl animate-[contextIn_0.15s_ease-out] z-30 overflow-hidden">
      {/* Header */}
      <div className="flex items-center gap-2 px-3 py-2 border-b border-border">
        <Search size={14} className="text-muted-foreground" />
        <input
          autoFocus
          value={search}
          onChange={e => setSearch(e.target.value)}
          placeholder="Search emoji..."
          className="flex-1 bg-transparent text-sm text-foreground placeholder:text-muted-foreground/50 focus:outline-none"
        />
        <button onClick={onClose} className="p-1 rounded hover:bg-dex-hover text-muted-foreground transition-colors">
          <X size={14} />
        </button>
      </div>

      {/* Category Tabs */}
      <div className="flex gap-0.5 px-2 py-1.5 border-b border-border overflow-x-auto scrollbar-none">
        {categories.map(cat => (
          <button
            key={cat}
            onClick={() => { setActiveCategory(cat); setSearch(''); }}
            className={`p-1.5 rounded-lg text-sm transition-colors flex-shrink-0 ${activeCategory === cat && !search ? 'bg-primary/20' : 'hover:bg-dex-hover'}`}
            title={cat}
          >
            {CATEGORY_ICONS[cat] || '❓'}
          </button>
        ))}
      </div>

      {/* Emoji Grid */}
      <div className="h-[240px] overflow-y-auto p-2">
        {!search && <div className="text-[10px] text-muted-foreground uppercase tracking-wider mb-1 px-1">{activeCategory}</div>}
        <div className="grid grid-cols-8 gap-0.5">
          {filteredEmojis.map((emoji, i) => (
            <button
              key={`${emoji}-${i}`}
              onClick={() => onSelect(emoji)}
              className="w-9 h-9 flex items-center justify-center text-xl hover:bg-dex-hover rounded-lg transition-transform hover:scale-125"
            >
              {emoji}
            </button>
          ))}
        </div>
        {filteredEmojis.length === 0 && (
          <div className="text-center text-sm text-muted-foreground py-8">No emojis found</div>
        )}
      </div>
    </div>
  );
};

export default EmojiPicker;
