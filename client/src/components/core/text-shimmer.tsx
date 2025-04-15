'use client';

import React, { FC, ReactNode } from 'react';
import { cn } from '@/lib/utils';

interface TextShimmerProps {
  children: ReactNode;
  className?: string;
  duration?: number;
}

export const TextShimmer: FC<TextShimmerProps> = ({
  children,
  className,
  duration = 2,
}) => {
  return (
    <span className={cn(
      'inline-block relative bg-clip-text text-transparent',
      'bg-gradient-to-r from-transparent via-current to-transparent',
      'bg-[length:200%_100%]',
      className
    )}
    style={{
      animation: `textGradient ${duration}s linear infinite`,
    }}
    >
      <span className="invisible">{children}</span>
      <span className="absolute inset-0">{children}</span>
      <style jsx>{`
        @keyframes textGradient {
          0% { background-position: 0% 50%; }
          100% { background-position: 200% 50%; }
        }
      `}</style>
    </span>
  );
};