import React, { useEffect, useRef, useState } from 'react';
import { useIsMobile } from '@/hooks/use-mobile';

export interface ContextMenuItem {
  label: string;
  icon: string;
  shortcut?: string;
  danger?: boolean;
  dividerAfter?: boolean;
  onClick: () => void;
}

interface ContextMenuProps {
  x: number;
  y: number;
  items: ContextMenuItem[];
  quickReactions?: string[];
  onReaction?: (emoji: string) => void;
  onClose: () => void;
}

const ContextMenu: React.FC<ContextMenuProps> = ({ x, y, items, quickReactions, onReaction, onClose }) => {
  const isMobile = useIsMobile();
  const ref = useRef<HTMLDivElement>(null);
  const [adjustedPos, setAdjustedPos] = useState({ x, y });

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) onClose();
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, [onClose]);

  // Dynamic position clamping after render
  useEffect(() => {
    if (ref.current) {
      const rect = ref.current.getBoundingClientRect();
      const nx = Math.min(x, window.innerWidth - rect.width - 8);
      const ny = Math.min(y, window.innerHeight - rect.height - 8);
      setAdjustedPos({ x: Math.max(8, nx), y: Math.max(8, ny) });
    }
  }, [x, y]);

  const style: React.CSSProperties = {
    position: 'fixed',
    left: adjustedPos.x,
    top: adjustedPos.y,
    zIndex: 1000,
  };

  // Mobile: bottom-sheet style
  if (isMobile) {
    return (
      <>
        <div className="fixed inset-0 z-[999] bg-black/40" onClick={onClose} />
        <div ref={ref} className="fixed bottom-0 left-0 right-0 z-[1000] bg-popover rounded-t-2xl shadow-[0_-8px_32px_rgba(0,0,0,0.5)] animate-[slideUp_0.25s_ease-out] max-h-[80vh] overflow-y-auto" style={{ paddingBottom: 'max(0.5rem, env(safe-area-inset-bottom))' }}>
          <div className="w-10 h-1 bg-muted-foreground/30 rounded-full mx-auto my-2.5" />
          {quickReactions && onReaction && (
            <div className="flex gap-2 px-4 py-3 border-b border-border justify-center">
              {quickReactions.map(emoji => (
                <button key={emoji} onClick={() => { onReaction(emoji); onClose(); }} className="text-2xl active:scale-125 transition-transform duration-150 p-1">{emoji}</button>
              ))}
            </div>
          )}
          <div className="py-1">
            {items.map((item, i) => (
              <React.Fragment key={i}>
                <button
                  onClick={() => { item.onClick(); onClose(); }}
                  className={`flex items-center w-full px-5 py-3.5 text-[15px] gap-3.5 active:bg-dex-hover transition-colors ${item.danger ? 'text-destructive' : 'text-foreground'}`}
                >
                  <span className="w-6 text-center text-lg">{item.icon}</span>
                  <span className="flex-1 text-left">{item.label}</span>
                </button>
                {item.dividerAfter && <div className="h-px bg-border mx-4 my-1" />}
              </React.Fragment>
            ))}
          </div>
        </div>
      </>
    );
  }

  return (
    <div ref={ref} style={style} className="min-w-[200px] rounded-xl bg-popover backdrop-blur-xl border border-border shadow-[0_8px_32px_rgba(0,0,0,0.5)] animate-[contextIn_0.15s_ease-out]">
      {quickReactions && onReaction && (
        <div className="flex gap-1 px-3 py-2 border-b border-border">
          {quickReactions.map(emoji => (
            <button key={emoji} onClick={() => { onReaction(emoji); onClose(); }} className="text-lg hover:scale-[1.35] transition-transform duration-150 p-0.5">{emoji}</button>
          ))}
        </div>
      )}
      <div className="py-1">
        {items.map((item, i) => (
          <React.Fragment key={i}>
            <button
              onClick={() => { item.onClick(); onClose(); }}
              className={`flex items-center w-full px-4 py-2.5 text-sm gap-3 hover:bg-dex-hover transition-colors ${item.danger ? 'text-destructive' : 'text-foreground'}`}
            >
              <span className="w-5 text-center text-base">{item.icon}</span>
              <span className="flex-1 text-left">{item.label}</span>
              {item.shortcut && <span className="text-[11px] text-muted-foreground/50">{item.shortcut}</span>}
            </button>
            {item.dividerAfter && <div className="h-px bg-border mx-3 my-1" />}
          </React.Fragment>
        ))}
      </div>
    </div>
  );
};

export default ContextMenu;
