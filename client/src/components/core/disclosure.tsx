'use client';

import React, { createContext, useContext, useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { cn } from '@/lib/utils';

// Context
interface DisclosureContextType {
  open: boolean;
  setOpen: (open: boolean) => void;
}

const DisclosureContext = createContext<DisclosureContextType | undefined>(undefined);

// Hook
function useDisclosure() {
  const context = useContext(DisclosureContext);
  if (!context) {
    throw new Error('useDisclosure must be used within a Disclosure component');
  }
  return context;
}

// Main Disclosure component
interface DisclosureProps extends React.HTMLAttributes<HTMLDivElement> {
  defaultOpen?: boolean;
}

export function Disclosure({ 
  children, 
  className,
  defaultOpen = false,
  ...props
}: DisclosureProps) {
  const [open, setOpen] = useState(defaultOpen);

  return (
    <DisclosureContext.Provider value={{ open, setOpen }}>
      <div
        className={cn('', className)}
        {...props}
      >
        {children}
      </div>
    </DisclosureContext.Provider>
  );
}

// Disclosure Trigger
interface DisclosureTriggerProps extends React.HTMLAttributes<HTMLDivElement> {}

export function DisclosureTrigger({ 
  children, 
  className, 
  ...props 
}: DisclosureTriggerProps) {
  const { open, setOpen } = useDisclosure();

  return (
    <div
      className={cn('cursor-pointer', className)}
      onClick={() => setOpen(!open)}
      role="button"
      tabIndex={0}
      aria-expanded={open}
      onKeyDown={(e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault();
          setOpen(!open);
        }
      }}
      {...props}
    >
      {children}
    </div>
  );
}

// Disclosure Content
interface DisclosureContentProps extends React.HTMLAttributes<HTMLDivElement> {
  transition?: {
    duration?: number;
    ease?: string | number[];
  };
}

export function DisclosureContent({ 
  children, 
  className,
  transition = {
    duration: 0.2,
    ease: 'easeInOut',
  },
  ...props 
}: DisclosureContentProps) {
  const { open } = useDisclosure();

  return (
    <AnimatePresence initial={false}>
      {open && (
        <motion.div
          initial={{ height: 0, opacity: 0 }}
          animate={{ 
            height: 'auto', 
            opacity: 1,
            transition: {
              height: {
                duration: transition.duration || 0.2,
                ease: transition.ease || 'easeInOut',
              },
              opacity: {
                duration: (transition.duration || 0.2) * 0.75,
                ease: transition.ease || 'easeInOut',
              }
            }
          }}
          exit={{ 
            height: 0, 
            opacity: 0,
            transition: {
              height: {
                duration: transition.duration || 0.2,
                ease: transition.ease || 'easeInOut',
              },
              opacity: {
                duration: (transition.duration || 0.2) * 0.5,
                ease: transition.ease || 'easeInOut',
              }
            }
          }}
          className={cn('overflow-hidden', className)}
          {...props}
        >
          {children}
        </motion.div>
      )}
    </AnimatePresence>
  );
}