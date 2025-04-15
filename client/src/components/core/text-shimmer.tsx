'use client';

import { FC, ReactNode } from 'react';
import { motion } from 'motion/react';
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
    <motion.div
      className={cn('relative overflow-hidden', className)}
      initial={{ opacity: 0.5 }}
      animate={{
        opacity: [0.5, 0.7, 0.5],
      }}
      transition={{
        repeat: Infinity,
        duration,
        ease: 'easeInOut',
      }}
    >
      {children}
    </motion.div>
  );
};