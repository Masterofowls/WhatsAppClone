'use client';

import React, { FC, ReactNode } from 'react';
import { AnimatePresence, motion, type MotionProps } from 'motion/react';

interface TransitionPanelProps {
  children: ReactNode[];
  activeIndex: number;
  transition?: MotionProps['transition'];
  variants?: {
    enter: any;
    center: any;
    exit: any;
  };
}

export const TransitionPanel: FC<TransitionPanelProps> = ({
  children,
  activeIndex,
  transition = { duration: 0.5, ease: 'easeInOut' },
  variants = {
    enter: { opacity: 0, x: 20 },
    center: { opacity: 1, x: 0 },
    exit: { opacity: 0, x: -20 },
  },
}) => {
  return (
    <AnimatePresence mode="wait" initial={false}>
      <motion.div
        key={activeIndex}
        initial="enter"
        animate="center"
        exit="exit"
        variants={variants}
        transition={transition}
      >
        {children[activeIndex]}
      </motion.div>
    </AnimatePresence>
  );
};