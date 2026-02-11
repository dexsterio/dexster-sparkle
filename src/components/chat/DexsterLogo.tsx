import { cn } from '@/lib/utils';

interface DexsterLogoProps {
  size?: 'sm' | 'md' | 'lg' | 'xl';
  className?: string;
}

export function DexsterLogo({ size = 'md', className }: DexsterLogoProps) {
  const sizes = {
    sm: 'text-lg',
    md: 'text-2xl',
    lg: 'text-4xl',
    xl: 'text-6xl',
  };

  return (
    <span className={cn('font-orbitron font-bold tracking-wider', sizes[size], className)}>
      <span className="text-brand-turquoise static-glitch" data-text="DEX">DEX</span>
      <span className="text-foreground animated-glitch" data-text="STER">STER</span>
    </span>
  );
}
