import React, { useState, useEffect, useCallback } from 'react';
import ReactionBurst from './ReactionBurst';

interface ReactionPillProps {
  emoji: string;
  count: number;
  isActive: boolean;
  onReact: (emoji: string) => void;
  triggerBurst?: boolean;
  onBurstDone?: () => void;
  onMouseEnter?: () => void;
  onMouseLeave?: () => void;
  tooltipContent?: React.ReactNode;
}

const ReactionPill: React.FC<ReactionPillProps> = ({
  emoji,
  count,
  isActive,
  onReact,
  triggerBurst,
  onBurstDone,
  onMouseEnter,
  onMouseLeave,
  tooltipContent,
}) => {
  const [burst, setBurst] = useState(false);

  // Trigger burst from parent (picker-initiated)
  useEffect(() => {
    if (triggerBurst) {
      setBurst(true);
      const t = setTimeout(() => {
        setBurst(false);
        onBurstDone?.();
      }, 700);
      return () => clearTimeout(t);
    }
  }, [triggerBurst, onBurstDone]);

  const handleBurstDone = useCallback(() => {
    setBurst(false);
  }, []);

  const handleClick = () => {
    onReact(emoji);
    setBurst(true);
    setTimeout(() => setBurst(false), 700);
  };

  return (
    <button
      onClick={handleClick}
      onMouseEnter={onMouseEnter}
      onMouseLeave={onMouseLeave}
      className={`relative flex items-center gap-1 px-2 py-0.5 rounded-xl text-[11.5px] font-semibold transition-transform duration-150 hover:scale-110 ${
        isActive
          ? 'bg-primary/25 border border-primary/40'
          : 'bg-white/[0.07] border border-white/[0.08]'
      }`}
      style={{ overflow: 'visible' }}
    >
      <span style={{ fontSize: 15, lineHeight: 1 }}>{emoji}</span>
      <span>{count}</span>

      {burst && <ReactionBurst emoji={emoji} onDone={handleBurstDone} />}
      {tooltipContent}
    </button>
  );
};

export default ReactionPill;
