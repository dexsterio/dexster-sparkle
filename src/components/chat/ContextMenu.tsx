import React, { useEffect, useRef } from 'react';

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
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) onClose();
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, [onClose]);

  // Clamp to viewport
  const style: React.CSSProperties = {
    position: 'fixed',
    left: Math.min(x, window.innerWidth - 240),
    top: Math.min(y, window.innerHeight - 300),
    zIndex: 1000,
  };

  return (
    <div ref={ref} style={style} className="min-w-[200px] rounded-xl bg-popover/95 backdrop-blur-xl border border-border shadow-[0_8px_32px_rgba(0,0,0,0.5)] animate-[contextIn_0.15s_ease-out]">
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
              {item.shortcut && <span className="text-[11px] text-muted-foreground/40">{item.shortcut}</span>}
            </button>
            {item.dividerAfter && <div className="h-px bg-border mx-3 my-1" />}
          </React.Fragment>
        ))}
      </div>
    </div>
  );
};

export default ContextMenu;
