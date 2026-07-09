import type { HTMLAttributes, ReactNode } from 'react';
import { cn } from '@/lib/utils';

interface CardProps extends HTMLAttributes<HTMLDivElement> {
  interactive?: boolean;
  children: ReactNode;
}

export function Card({ interactive, className, children, ...props }: CardProps) {
  return (
    <div
      className={cn(
        'rounded-3xl border border-base-700/80 bg-base-850/70 shadow-soft',
        interactive &&
          'cursor-pointer transition-all duration-300 hover:border-accent-500/40 hover:shadow-glow hover:-translate-y-0.5 active:translate-y-0 active:scale-[0.99]',
        className,
      )}
      {...props}
    >
      {children}
    </div>
  );
}
