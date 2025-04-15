'use client';

import React, { FC, ReactNode, useEffect, useState } from 'react';
import { cn } from '@/lib/utils';

interface TextScrambleProps {
  children: ReactNode;
  className?: string;
  characters?: string;
  speed?: number;
}

export const TextScramble: FC<TextScrambleProps> = ({
  children,
  className,
  characters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789!@#$%^&*()_+-={}[]|;:,.<>?/',
  speed = 50,
}) => {
  const [displayText, setDisplayText] = useState('');
  const [originalText, setOriginalText] = useState('');
  const [isComplete, setIsComplete] = useState(false);

  useEffect(() => {
    // Convert to string if it's a React element
    if (typeof children !== 'string') {
      const childrenAsString = React.Children.toArray(children)
        .map((child) => {
          if (typeof child === 'string') return child;
          if (typeof child === 'number') return child.toString();
          return '';
        })
        .join('');
      setOriginalText(childrenAsString);
      scrambleText(childrenAsString);
    } else {
      setOriginalText(children);
      scrambleText(children);
    }
  }, [children]);

  const scrambleText = (text: string) => {
    let iteration = 0;
    const maxIterations = text.length * 3;
    const finalText = text;
    let scrambled = '';

    // Fill with initial random characters
    for (let i = 0; i < finalText.length; i++) {
      scrambled += characters.charAt(Math.floor(Math.random() * characters.length));
    }
    setDisplayText(scrambled);

    const interval = setInterval(() => {
      iteration++;
      
      // Gradually reveal the original characters
      let result = '';
      for (let i = 0; i < finalText.length; i++) {
        // If we've completed a character, use the original
        if (i < iteration / 3) {
          result += finalText[i];
        } else {
          // Otherwise, use a random character
          result += characters.charAt(Math.floor(Math.random() * characters.length));
        }
      }
      
      setDisplayText(result);
      
      // Stop when we've gone through enough iterations
      if (iteration >= maxIterations) {
        clearInterval(interval);
        setDisplayText(finalText);
        setIsComplete(true);
      }
    }, speed);

    return () => clearInterval(interval);
  };

  return (
    <span className={cn('inline-block', className, isComplete && 'transition-all duration-500')}>
      {displayText}
    </span>
  );
};