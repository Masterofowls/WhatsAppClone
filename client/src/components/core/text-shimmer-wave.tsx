'use client';

import { FC, ReactNode } from 'react';
import { motion } from 'motion/react';
import { cn } from '@/lib/utils';

interface TextShimmerWaveProps {
  children: ReactNode;
  className?: string;
  duration?: number;
}

export const TextShimmerWave: FC<TextShimmerWaveProps> = ({
  children,
  className,
  duration = 2,
}) => {
  return (
    <div className={cn('relative overflow-hidden', className)}>
      <motion.div
        className="absolute inset-0 -z-10"
        style={{
          background:
            'linear-gradient(90deg, transparent, rgba(255, 255, 255, 0.5), transparent)',
        }}
        animate={{
          x: ['calc(-100% - 50px)', 'calc(100% + 50px)'],
        }}
        transition={{
          repeat: Infinity,
          duration,
          ease: 'linear',
        }}
      />
      {children}
    </div>
  );
};