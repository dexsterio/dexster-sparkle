import React, { useState, useMemo } from 'react';
import { X, Search } from 'lucide-react';

interface GifPickerProps {
  onSelect: (gifUrl: string) => void;
  onClose: () => void;
  isMobile?: boolean;
}

// Curated GIFs using public Giphy embed URLs (these are publicly accessible)
const GIF_CATEGORIES: Record<string, { label: string; gifs: { url: string; thumb: string; alt: string }[] }> = {
  trending: {
    label: '🔥 Trending',
    gifs: [
      { url: 'https://media.giphy.com/media/l0MYt5jPR6QX5pnqM/giphy.gif', thumb: 'https://media.giphy.com/media/l0MYt5jPR6QX5pnqM/200w.gif', alt: 'Thumbs up' },
      { url: 'https://media.giphy.com/media/3o7abKhOpu0NwenH3O/giphy.gif', thumb: 'https://media.giphy.com/media/3o7abKhOpu0NwenH3O/200w.gif', alt: 'Mind blown' },
      { url: 'https://media.giphy.com/media/xT9IgG50Fb7Mi0prBC/giphy.gif', thumb: 'https://media.giphy.com/media/xT9IgG50Fb7Mi0prBC/200w.gif', alt: 'Dancing' },
      { url: 'https://media.giphy.com/media/5GoVLqeAOo6PK/giphy.gif', thumb: 'https://media.giphy.com/media/5GoVLqeAOo6PK/200w.gif', alt: 'Excited' },
      { url: 'https://media.giphy.com/media/l3q2K5jinAlChoCLS/giphy.gif', thumb: 'https://media.giphy.com/media/l3q2K5jinAlChoCLS/200w.gif', alt: 'Wow' },
      { url: 'https://media.giphy.com/media/26ufdipQqU2lhNA4g/giphy.gif', thumb: 'https://media.giphy.com/media/26ufdipQqU2lhNA4g/200w.gif', alt: 'Laughing' },
    ],
  },
  reactions: {
    label: '😂 Reactions',
    gifs: [
      { url: 'https://media.giphy.com/media/3oEjI6SIIHBdRxXI40/giphy.gif', thumb: 'https://media.giphy.com/media/3oEjI6SIIHBdRxXI40/200w.gif', alt: 'LOL' },
      { url: 'https://media.giphy.com/media/l4FGuhL4U2WyjdkaY/giphy.gif', thumb: 'https://media.giphy.com/media/l4FGuhL4U2WyjdkaY/200w.gif', alt: 'Facepalm' },
      { url: 'https://media.giphy.com/media/cFkiFMDg3iFoI/giphy.gif', thumb: 'https://media.giphy.com/media/cFkiFMDg3iFoI/200w.gif', alt: 'Eye roll' },
      { url: 'https://media.giphy.com/media/l0HlvtIPdijJCbM4g/giphy.gif', thumb: 'https://media.giphy.com/media/l0HlvtIPdijJCbM4g/200w.gif', alt: 'Shocked' },
      { url: 'https://media.giphy.com/media/3o7TKTDn976rzVgky4/giphy.gif', thumb: 'https://media.giphy.com/media/3o7TKTDn976rzVgky4/200w.gif', alt: 'Thinking' },
      { url: 'https://media.giphy.com/media/3oEdva9BUHPIs2SkGk/giphy.gif', thumb: 'https://media.giphy.com/media/3oEdva9BUHPIs2SkGk/200w.gif', alt: 'Applause' },
    ],
  },
  love: {
    label: '❤️ Love',
    gifs: [
      { url: 'https://media.giphy.com/media/26BRv0ThflsHCqDrG/giphy.gif', thumb: 'https://media.giphy.com/media/26BRv0ThflsHCqDrG/200w.gif', alt: 'Hearts' },
      { url: 'https://media.giphy.com/media/l0ExhcMymdL2TKgKY/giphy.gif', thumb: 'https://media.giphy.com/media/l0ExhcMymdL2TKgKY/200w.gif', alt: 'Hug' },
      { url: 'https://media.giphy.com/media/M90mJvfWfd5mbUuULX/giphy.gif', thumb: 'https://media.giphy.com/media/M90mJvfWfd5mbUuULX/200w.gif', alt: 'Heart eyes' },
      { url: 'https://media.giphy.com/media/3oEjHV0z8S7WM4MwnK/giphy.gif', thumb: 'https://media.giphy.com/media/3oEjHV0z8S7WM4MwnK/200w.gif', alt: 'Kiss' },
      { url: 'https://media.giphy.com/media/l2Sq29cFXoF80ADlK/giphy.gif', thumb: 'https://media.giphy.com/media/l2Sq29cFXoF80ADlK/200w.gif', alt: 'Love you' },
      { url: 'https://media.giphy.com/media/xUPGcMzwkOY01nj6hi/giphy.gif', thumb: 'https://media.giphy.com/media/xUPGcMzwkOY01nj6hi/200w.gif', alt: 'Cute' },
    ],
  },
  celebrate: {
    label: '🎉 Celebrate',
    gifs: [
      { url: 'https://media.giphy.com/media/26tOZ42Mg6r3AOfKg/giphy.gif', thumb: 'https://media.giphy.com/media/26tOZ42Mg6r3AOfKg/200w.gif', alt: 'Celebrate' },
      { url: 'https://media.giphy.com/media/l0MYJnJQ4EiYLxvQ4/giphy.gif', thumb: 'https://media.giphy.com/media/l0MYJnJQ4EiYLxvQ4/200w.gif', alt: 'Party' },
      { url: 'https://media.giphy.com/media/26u4cqiYI30juCOGY/giphy.gif', thumb: 'https://media.giphy.com/media/26u4cqiYI30juCOGY/200w.gif', alt: 'Fireworks' },
      { url: 'https://media.giphy.com/media/26gsjCZpPolPr3sBy/giphy.gif', thumb: 'https://media.giphy.com/media/26gsjCZpPolPr3sBy/200w.gif', alt: 'Confetti' },
      { url: 'https://media.giphy.com/media/g9582DNuQppxC/giphy.gif', thumb: 'https://media.giphy.com/media/g9582DNuQppxC/200w.gif', alt: 'Dance party' },
      { url: 'https://media.giphy.com/media/l0HlHFRbmaZtBRhXG/giphy.gif', thumb: 'https://media.giphy.com/media/l0HlHFRbmaZtBRhXG/200w.gif', alt: 'High five' },
    ],
  },
  coding: {
    label: '💻 Coding',
    gifs: [
      { url: 'https://media.giphy.com/media/ZVik7pBtu9dNS/giphy.gif', thumb: 'https://media.giphy.com/media/ZVik7pBtu9dNS/200w.gif', alt: 'Hacking' },
      { url: 'https://media.giphy.com/media/13HgwGsXF0aiGY/giphy.gif', thumb: 'https://media.giphy.com/media/13HgwGsXF0aiGY/200w.gif', alt: 'Typing fast' },
      { url: 'https://media.giphy.com/media/LmNwrBhejkK9EFP504/giphy.gif', thumb: 'https://media.giphy.com/media/LmNwrBhejkK9EFP504/200w.gif', alt: 'Coding' },
      { url: 'https://media.giphy.com/media/3o7btNhMBytxAM6YBa/giphy.gif', thumb: 'https://media.giphy.com/media/3o7btNhMBytxAM6YBa/200w.gif', alt: 'Bug found' },
      { url: 'https://media.giphy.com/media/yYSSBtDgbbRzq/giphy.gif', thumb: 'https://media.giphy.com/media/yYSSBtDgbbRzq/200w.gif', alt: 'It works' },
      { url: 'https://media.giphy.com/media/unQ3IJU2RG7DO/giphy.gif', thumb: 'https://media.giphy.com/media/unQ3IJU2RG7DO/200w.gif', alt: 'Deploy' },
    ],
  },
  animals: {
    label: '🐱 Animals',
    gifs: [
      { url: 'https://media.giphy.com/media/JIX9t2j0ZTN9S/giphy.gif', thumb: 'https://media.giphy.com/media/JIX9t2j0ZTN9S/200w.gif', alt: 'Cat typing' },
      { url: 'https://media.giphy.com/media/mlvseq9yvZhba/giphy.gif', thumb: 'https://media.giphy.com/media/mlvseq9yvZhba/200w.gif', alt: 'Dog' },
      { url: 'https://media.giphy.com/media/ICOgUNjpvO0PC/giphy.gif', thumb: 'https://media.giphy.com/media/ICOgUNjpvO0PC/200w.gif', alt: 'Cute cat' },
      { url: 'https://media.giphy.com/media/mCRJDo24UvJMA/giphy.gif', thumb: 'https://media.giphy.com/media/mCRJDo24UvJMA/200w.gif', alt: 'Puppy' },
      { url: 'https://media.giphy.com/media/3oEdv6sy3ulljPMGdy/giphy.gif', thumb: 'https://media.giphy.com/media/3oEdv6sy3ulljPMGdy/200w.gif', alt: 'Panda' },
      { url: 'https://media.giphy.com/media/VbnUQpnihPSIgIXuZv/giphy.gif', thumb: 'https://media.giphy.com/media/VbnUQpnihPSIgIXuZv/200w.gif', alt: 'Cat' },
    ],
  },
};

const allGifs = Object.values(GIF_CATEGORIES).flatMap(c => c.gifs);

const GifPicker: React.FC<GifPickerProps> = ({ onSelect, onClose, isMobile }) => {
  const [search, setSearch] = useState('');
  const [activeCategory, setActiveCategory] = useState('trending');

  const filteredGifs = useMemo(() => {
    if (search.trim()) {
      return allGifs.filter(g => g.alt.toLowerCase().includes(search.toLowerCase()));
    }
    return GIF_CATEGORIES[activeCategory]?.gifs || [];
  }, [search, activeCategory]);

  if (isMobile) {
    return (
      <>
        <div className="fixed inset-0 z-[39]" onClick={onClose} />
        <div className="fixed bottom-0 left-0 right-0 z-40 bg-popover border-t border-border rounded-t-2xl shadow-2xl flex flex-col animate-[slideUp_0.25s_ease-out] overflow-hidden" style={{ maxHeight: '65vh', paddingBottom: 'env(safe-area-inset-bottom)' }}>
          <div className="w-10 h-1 bg-muted-foreground/30 rounded-full mx-auto my-2" />
          <div className="flex items-center gap-2 px-3 py-2 border-b border-border">
            <span className="text-sm font-semibold text-foreground">GIFs</span>
            <div className="flex-1" />
            <button onClick={onClose} className="p-1 rounded active:bg-dex-hover text-muted-foreground"><X size={16} /></button>
          </div>
          <div className="px-3 py-2">
            <div className="flex items-center gap-2 bg-muted rounded-lg px-2.5 py-2">
              <Search size={14} className="text-muted-foreground flex-shrink-0" />
              <input autoFocus value={search} onChange={e => setSearch(e.target.value)} placeholder="Search GIFs..."
                className="flex-1 bg-transparent text-sm text-foreground placeholder:text-muted-foreground/50 focus:outline-none" />
              {search && <button onClick={() => setSearch('')} className="text-muted-foreground active:text-foreground"><X size={12} /></button>}
            </div>
          </div>
          {!search && (
            <div className="flex gap-1 px-2 pb-1.5 overflow-x-auto scrollbar-hide" style={{ WebkitOverflowScrolling: 'touch' }}>
              {Object.entries(GIF_CATEGORIES).map(([key, cat]) => (
                <button key={key} onClick={() => setActiveCategory(key)}
                  className={`px-3 py-1.5 rounded-lg text-xs font-medium whitespace-nowrap transition-colors ${activeCategory === key ? 'bg-primary/20 text-primary' : 'text-muted-foreground active:bg-dex-hover'}`}>
                  {cat.label}
                </button>
              ))}
            </div>
          )}
          <div className="flex-1 overflow-y-auto px-2 pb-2">
            {filteredGifs.length === 0 ? (
              <div className="flex items-center justify-center h-32 text-sm text-muted-foreground">{search ? 'No GIFs found' : 'No GIFs'}</div>
            ) : (
              <div className="grid grid-cols-2 gap-1.5">
                {filteredGifs.map((gif, i) => (
                  <button key={`${gif.url}-${i}`} onClick={() => onSelect(gif.url)}
                    className="relative rounded-lg overflow-hidden aspect-square active:ring-2 active:ring-primary transition-all">
                    <img src={gif.thumb} alt={gif.alt} loading="lazy" className="w-full h-full object-cover" />
                  </button>
                ))}
              </div>
            )}
          </div>
          <div className="px-3 py-1.5 border-t border-border text-center">
            <span className="text-[10px] text-muted-foreground">Powered by GIPHY</span>
          </div>
        </div>
      </>
    );
  }

  return (
    <div className="absolute bottom-full right-0 mb-2 w-[340px] h-[420px] bg-popover border border-border rounded-2xl shadow-2xl z-40 flex flex-col animate-[contextIn_0.15s_ease-out] overflow-hidden">
      {/* Header */}
      <div className="flex items-center gap-2 px-3 py-2.5 border-b border-border">
        <span className="text-sm font-semibold text-foreground">GIFs</span>
        <div className="flex-1" />
        <button onClick={onClose} className="p-1 rounded hover:bg-dex-hover text-muted-foreground">
          <X size={16} />
        </button>
      </div>

      {/* Search */}
      <div className="px-3 py-2">
        <div className="flex items-center gap-2 bg-muted rounded-lg px-2.5 py-1.5">
          <Search size={14} className="text-muted-foreground flex-shrink-0" />
          <input
            autoFocus
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder="Search GIFs..."
            className="flex-1 bg-transparent text-sm text-foreground placeholder:text-muted-foreground/50 focus:outline-none"
          />
          {search && (
            <button onClick={() => setSearch('')} className="text-muted-foreground hover:text-foreground">
              <X size={12} />
            </button>
          )}
        </div>
      </div>

      {/* Category tabs */}
      {!search && (
        <div className="flex gap-0.5 px-2 pb-1.5 overflow-x-auto scrollbar-hide">
          {Object.entries(GIF_CATEGORIES).map(([key, cat]) => (
            <button
              key={key}
              onClick={() => setActiveCategory(key)}
              className={`px-2.5 py-1 rounded-lg text-[11px] font-medium whitespace-nowrap transition-colors ${
                activeCategory === key
                  ? 'bg-primary/20 text-primary'
                  : 'text-muted-foreground hover:bg-dex-hover hover:text-foreground'
              }`}
            >
              {cat.label}
            </button>
          ))}
        </div>
      )}

      {/* GIF grid */}
      <div className="flex-1 overflow-y-auto px-2 pb-2">
        {filteredGifs.length === 0 ? (
          <div className="flex items-center justify-center h-full text-sm text-muted-foreground">
            {search ? 'No GIFs found' : 'No GIFs in this category'}
          </div>
        ) : (
          <div className="grid grid-cols-2 gap-1.5">
            {filteredGifs.map((gif, i) => (
              <button
                key={`${gif.url}-${i}`}
                onClick={() => onSelect(gif.url)}
                className="relative rounded-lg overflow-hidden aspect-square hover:ring-2 hover:ring-primary transition-all group"
              >
                <img
                  src={gif.thumb}
                  alt={gif.alt}
                  loading="lazy"
                  className="w-full h-full object-cover"
                />
                <div className="absolute inset-0 bg-black/0 group-hover:bg-black/20 transition-colors" />
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Footer */}
      <div className="px-3 py-1.5 border-t border-border text-center">
        <span className="text-[10px] text-muted-foreground">Powered by GIPHY</span>
      </div>
    </div>
  );
};

export default GifPicker;
