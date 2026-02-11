import React, { useEffect, useState } from 'react';

interface Particle {
  id: number;
  x: number;
  y: number;
  scale: number;
  rotation: number;
  delay: number;
}

interface ReactionBurstProps {
  emoji: string;
  onDone: () => void;
}

const ReactionBurst: React.FC<ReactionBurstProps> = ({ emoji, onDone }) => {
  const [particles, setParticles] = useState<Particle[]>([]);

  useEffect(() => {
    const count = 8;
    const p = Array.from({ length: count }, (_, i) => {
      const angle = (i / count) * Math.PI * 2 + (Math.random() - 0.5) * 0.5;
      const distance = 30 + Math.random() * 25;
      return {
        id: i,
        x: Math.cos(angle) * distance,
        y: Math.sin(angle) * distance,
        scale: 0.6 + Math.random() * 0.5,
        rotation: (Math.random() - 0.5) * 40,
        delay: i * 30,
      };
    });
    setParticles(p);

    const timer = setTimeout(onDone, 650);
    return () => clearTimeout(timer);
  }, [onDone]);

  return (
    <div
      className="absolute pointer-events-none"
      style={{
        top: '50%',
        left: '50%',
        transform: 'translate(-50%, -50%)',
        width: 0,
        height: 0,
        zIndex: 30,
      }}
    >
      {particles.map((p) => (
        <span
          key={p.id}
          className="absolute"
          style={{
            fontSize: 20,
            lineHeight: 1,
            fontFamily: 'Apple Color Emoji, Segoe UI Emoji, Noto Color Emoji, sans-serif',
            willChange: 'transform, opacity',
            pointerEvents: 'none',
            left: 0,
            top: 0,
            '--end-x': `${p.x}px`,
            '--end-y': `${p.y}px`,
            '--end-scale': p.scale,
            '--end-rotate': `${p.rotation}deg`,
            animation: `reactionParticle 600ms cubic-bezier(0.25, 0.46, 0.45, 0.94) ${p.delay}ms forwards`,
          } as React.CSSProperties}
        >
          {emoji}
        </span>
      ))}
    </div>
  );
};

export default ReactionBurst;
