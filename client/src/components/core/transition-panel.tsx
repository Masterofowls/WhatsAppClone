'use client';

import React, { ReactNode } from 'react';
import { AnimatePresence, motion, MotionProps, Variants } from 'motion/react';

interface TransitionPanelProps {
  activeIndex: number;
  children: ReactNode[];
  transition?: MotionProps['transition'];
  variants?: Variants;
  className?: string;
}

export const TransitionPanel = ({
  activeIndex,
  children,
  transition = { duration: 0.3, ease: 'easeInOut' },
  variants = {
    enter: { opacity: 0, x: 20 },
    center: { opacity: 1, x: 0 },
    exit: { opacity: 0, x: -20 },
  },
  className = '',
}: TransitionPanelProps) => {
  const currentChild = children[activeIndex];

  return (
    <div className={`relative ${className}`}>
      <AnimatePresence mode="wait" initial={false}>
        <motion.div
          key={activeIndex}
          custom={activeIndex}
          variants={variants}
          initial="enter"
          animate="center"
          exit="exit"
          transition={transition}
        >
          {currentChild}
        </motion.div>
      </AnimatePresence>
    </div>
  );
};