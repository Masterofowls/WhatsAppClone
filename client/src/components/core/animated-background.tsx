'use client';

import React, { useCallback, useEffect, useState } from 'react';
import { motion, type MotionProps } from 'motion/react';
import { cn } from '@/lib/utils';

interface AnimatedBackgroundProps extends React.HTMLAttributes<HTMLDivElement> {
  defaultValue?: string;
  enableHover?: boolean;
  transition?: MotionProps['transition'];
  backgroundClassName?: string;
}

export const AnimatedBackground = ({
  children,
  className,
  defaultValue,
  enableHover = false,
  transition = {
    type: 'spring',
    stiffness: 500,
    damping: 30,
  },
  backgroundClassName,
  ...props
}: AnimatedBackgroundProps) => {
  const [activeId, setActiveId] = useState<string | null>(defaultValue || null);
  const [bounds, setBounds] = useState<DOMRect | null>(null);

  // Find the active element and update bounds
  const updateBounds = useCallback(() => {
    if (!activeId) return null;
    
    const activeElement = document.querySelector(`[data-id="${activeId}"]`);
    if (!activeElement) return null;
    
    const rect = activeElement.getBoundingClientRect();
    setBounds(rect);
  }, [activeId]);

  // Track window resize
  useEffect(() => {
    if (!activeId) return;
    
    updateBounds();
    window.addEventListener('resize', updateBounds);
    
    return () => {
      window.removeEventListener('resize', updateBounds);
    };
  }, [activeId, updateBounds]);

  // Initial setup
  useEffect(() => {
    updateBounds();
  }, [activeId, updateBounds]);

  // Event handlers
  const handleClick = (e: React.MouseEvent<HTMLDivElement>) => {
    const target = e.target as HTMLElement;
    const id = findDataId(target);
    
    if (id) {
      setActiveId(id);
    }
  };

  const handleHover = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!enableHover) return;
    
    const target = e.target as HTMLElement;
    const id = findDataId(target);
    
    if (id) {
      setActiveId(id);
    }
  };

  // Helper to find the data-id attribute on the element or its parents
  const findDataId = (element: HTMLElement | null): string | null => {
    if (!element) return null;
    
    if (element.hasAttribute('data-id')) {
      return element.getAttribute('data-id');
    }
    
    if (element.parentElement) {
      return findDataId(element.parentElement);
    }
    
    return null;
  };

  return (
    <div
      className={cn('relative', className)}
      onClick={handleClick}
      onMouseOver={handleHover}
      {...props}
    >
      {bounds && (
        <motion.div
          className={cn('absolute z-0 rounded', backgroundClassName)}
          style={{
            left: 0,
            top: 0,
          }}
          animate={{
            width: bounds.width,
            height: bounds.height,
            x: bounds.left - (bounds?.parentElement?.getBoundingClientRect().left || 0),
            y: bounds.top - (bounds?.parentElement?.getBoundingClientRect().top || 0),
          }}
          transition={transition}
          layoutId="background"
        />
      )}
      {children}
    </div>
  );
};