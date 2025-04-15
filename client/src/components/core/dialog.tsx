'use client';

import React, { createContext, useContext, useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { cn } from '@/lib/utils';
import { X } from 'lucide-react';

// Context
interface DialogContextType {
  open: boolean;
  setOpen: (open: boolean) => void;
}

const DialogContext = createContext<DialogContextType | undefined>(undefined);

// Hook
function useDialog() {
  const context = useContext(DialogContext);
  if (!context) {
    throw new Error('useDialog must be used within a Dialog component');
  }
  return context;
}

// Main Dialog component
interface DialogProps {
  children: React.ReactNode;
  defaultOpen?: boolean;
}

export function Dialog({ 
  children, 
  defaultOpen = false 
}: DialogProps) {
  const [open, setOpen] = useState(defaultOpen);

  return (
    <DialogContext.Provider value={{ open, setOpen }}>
      {children}
    </DialogContext.Provider>
  );
}

// Dialog Trigger
interface DialogTriggerProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {}

export function DialogTrigger({ 
  children, 
  className, 
  ...props 
}: DialogTriggerProps) {
  const { setOpen } = useDialog();

  return (
    <button
      type="button"
      className={cn(
        'inline-flex items-center justify-center rounded-md text-sm font-medium transition-colors',
        className
      )}
      onClick={() => setOpen(true)}
      {...props}
    >
      {children}
    </button>
  );
}

// Dialog Content
interface DialogContentProps extends React.HTMLAttributes<HTMLDivElement> {}

export function DialogContent({ 
  children, 
  className, 
  ...props 
}: DialogContentProps) {
  const { open, setOpen } = useDialog();

  // Handle click outside
  const handleOutsideClick = (e: React.MouseEvent<HTMLDivElement>) => {
    if (e.target === e.currentTarget) {
      setOpen(false);
    }
  };

  // Handle escape key
  React.useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        setOpen(false);
      }
    };

    if (open) {
      document.addEventListener('keydown', handleEscape);
    }

    return () => {
      document.removeEventListener('keydown', handleEscape);
    };
  }, [open, setOpen]);

  return (
    <AnimatePresence>
      {open && (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/50"
            onClick={handleOutsideClick}
          />
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 10 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 10 }}
            transition={{ type: 'spring', duration: 0.3 }}
            className={cn(
              'relative z-50 rounded-lg shadow-lg',
              className
            )}
            {...props}
          >
            {children}
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}

// Dialog Header
interface DialogHeaderProps extends React.HTMLAttributes<HTMLDivElement> {}

export function DialogHeader({ 
  children, 
  className, 
  ...props 
}: DialogHeaderProps) {
  return (
    <div
      className={cn('flex flex-col space-y-1.5', className)}
      {...props}
    >
      {children}
    </div>
  );
}

// Dialog Title
interface DialogTitleProps extends React.HTMLAttributes<HTMLHeadingElement> {}

export function DialogTitle({ 
  children, 
  className, 
  ...props 
}: DialogTitleProps) {
  return (
    <h3
      className={cn('text-lg font-semibold', className)}
      {...props}
    >
      {children}
    </h3>
  );
}

// Dialog Description
interface DialogDescriptionProps extends React.HTMLAttributes<HTMLParagraphElement> {}

export function DialogDescription({ 
  children, 
  className, 
  ...props 
}: DialogDescriptionProps) {
  return (
    <p
      className={cn('text-sm', className)}
      {...props}
    >
      {children}
    </p>
  );
}

// Dialog Close
interface DialogCloseProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {}

export function DialogClose({ 
  className, 
  children, 
  ...props 
}: DialogCloseProps) {
  const { setOpen } = useDialog();

  return (
    <button
      type="button"
      className={cn(
        'absolute right-4 top-4 rounded-sm opacity-70 transition-opacity hover:opacity-100',
        className
      )}
      onClick={() => setOpen(false)}
      {...props}
    >
      {children || <X className="h-4 w-4" />}
      <span className="sr-only">Close</span>
    </button>
  );
}