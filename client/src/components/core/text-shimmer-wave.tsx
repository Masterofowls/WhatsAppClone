'use client';

import React, { FC, ReactNode, useEffect, useState } from 'react';
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
  const [text, setText] = useState<string>('');
  const [visibleCharCount, setVisibleCharCount] = useState<number>(0);
  const [isAnimating, setIsAnimating] = useState<boolean>(true);

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
      setText(childrenAsString);
    } else {
      setText(children);
    }
  }, [children]);

  useEffect(() => {
    if (!text || visibleCharCount >= text.length) {
      setIsAnimating(false);
      return;
    }

    const intervalTime = (duration * 1000) / (text.length * 2);
    
    const interval = setInterval(() => {
      setVisibleCharCount((prev) => {
        if (prev >= text.length) {
          clearInterval(interval);
          setIsAnimating(false);
          return prev;
        }
        return prev + 1;
      });
    }, intervalTime);

    return () => clearInterval(interval);
  }, [text, duration, visibleCharCount]);

  const visibleText = text.substring(0, visibleCharCount);
  const hiddenText = text.substring(visibleCharCount);

  return (
    <span className={cn('inline-block relative', className)}>
      <span className="relative inline-block">
        {visibleText}
        {isAnimating && hiddenText && (
          <span
            className="absolute left-0 top-0 inline-block text-transparent bg-clip-text bg-gradient-to-r from-transparent via-current to-transparent animate-pulse"
            style={{
              width: '100%',
              backgroundSize: '200% 100%',
              animationDuration: `${duration}s`,
              animationIterationCount: 'infinite',
            }}
          >
            {hiddenText}
          </span>
        )}
      </span>
    </span>
  );
};