'use client';

import React, { useEffect, useState, FC, ReactNode } from 'react';
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
  characters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789',
  speed = 40,
}) => {
  const [output, setOutput] = useState('');
  const [phase, setPhase] = useState(0);
  const text = React.Children.toArray(children)
    .map((child) => {
      if (typeof child === 'string') return child;
      if (React.isValidElement(child) && typeof child.props.children === 'string')
        return child.props.children;
      return '';
    })
    .join('');

  useEffect(() => {
    let timeout: NodeJS.Timeout;
    
    const next = () => {
      if (phase === 0) {
        // Start
        const newOutput = [];
        for (let i = 0; i < text.length; i++) {
          newOutput.push(
            text.charAt(i) === ' '
              ? ' '
              : characters.charAt(Math.floor(Math.random() * characters.length))
          );
        }
        setOutput(newOutput.join(''));
        setPhase(1);
      } else if (phase === 1) {
        // Scramble
        const newOutput = [];
        let complete = true;
        for (let i = 0; i < text.length; i++) {
          if (text.charAt(i) === output.charAt(i)) {
            newOutput.push(text.charAt(i));
          } else {
            complete = false;
            newOutput.push(
              text.charAt(i) === ' '
                ? ' '
                : characters.charAt(Math.floor(Math.random() * characters.length))
            );
          }
        }
        setOutput(newOutput.join(''));
        if (complete) {
          setPhase(2);
        }
      } else if (phase === 2) {
        // Reveal
        let reveal = 0;
        const newOutput = output.split('');
        for (let i = 0; i < text.length; i++) {
          if (output.charAt(i) !== text.charAt(i)) {
            reveal = i;
            newOutput[i] = text.charAt(i);
            break;
          }
        }
        setOutput(newOutput.join(''));
        if (reveal === 0) {
          setPhase(3);
        }
      }

      if (phase < 3) {
        timeout = setTimeout(next, speed);
      }
    };

    timeout = setTimeout(next, speed);
    return () => clearTimeout(timeout);
  }, [phase, output, speed, text, characters]);

  return <div className={cn(className)}>{output}</div>;
};