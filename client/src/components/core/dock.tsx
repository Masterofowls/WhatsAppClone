'use client';

import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
} from 'react';
import { motion, MotionConfig } from 'motion/react';
import { cn } from '@/lib/utils';

// Constants for the dock animation
const SCALE_FACTOR = 0.5;
const INITIAL_ITEM_SIZE = 40;

// Context for the Dock component
interface DockContext {
  hovered: boolean;
  hoveredIndex: number | null;
  mousePosition: { x: number; y: number };
}

const DockContext = createContext<DockContext>({
  hovered: false,
  hoveredIndex: null,
  mousePosition: { x: 0, y: 0 },
});

// Utils
const clamp = (value: number, min: number, max: number) =>
  Math.min(Math.max(value, min), max);

// Calculated the size of each item based on distance to mouse
function calculateItemSize(
  index: number,
  hoveredIndex: number | null,
  hovered: boolean,
  mouseX: number,
  itemRef: React.RefObject<HTMLDivElement>,
) {
  if (!hovered) return INITIAL_ITEM_SIZE;
  
  const itemRect = itemRef.current?.getBoundingClientRect();
  
  if (!itemRect) return INITIAL_ITEM_SIZE;
  
  const itemCenter = itemRect.left + itemRect.width / 2;
  const distanceToMouse = Math.abs(mouseX - itemCenter);
  const distance = hoveredIndex !== null ? Math.abs(index - hoveredIndex) : distanceToMouse / 50;
  
  const maxDistance = 3;
  const clampedDistance = clamp(distance, 0, maxDistance);
  
  const scale = 1 - (clampedDistance / maxDistance) * SCALE_FACTOR;
  
  return INITIAL_ITEM_SIZE * scale;
}

// Dock component
interface DockProps extends React.HTMLAttributes<HTMLDivElement> {}

export const Dock = ({ children, className, ...props }: DockProps) => {
  const [hovered, setHovered] = useState(false);
  const [hoveredIndex, setHoveredIndex] = useState<number | null>(null);
  const [mousePosition, setMousePosition] = useState({ x: 0, y: 0 });
  const dockRef = useRef<HTMLDivElement>(null);

  const handleMouseMove = useCallback(
    (event: React.MouseEvent<HTMLDivElement>) => {
      const { clientX, clientY } = event;
      setMousePosition({ x: clientX, y: clientY });
    },
    [],
  );

  const contextValue = useMemo(
    () => ({
      hovered,
      hoveredIndex,
      mousePosition,
    }),
    [hovered, hoveredIndex, mousePosition],
  );

  return (
    <MotionConfig transition={{ type: 'spring', stiffness: 400, damping: 25 }}>
      <DockContext.Provider value={contextValue}>
        <motion.div
          ref={dockRef}
          className={cn('flex items-center justify-center', className)}
          onMouseEnter={() => setHovered(true)}
          onMouseLeave={() => {
            setHovered(false);
            setHoveredIndex(null);
          }}
          onMouseMove={handleMouseMove}
          {...props}
        >
          {React.Children.map(children, (child, index) => {
            if (React.isValidElement(child)) {
              return React.cloneElement(child, {
                onMouseEnter: () => setHoveredIndex(index),
                onMouseLeave: () => setHoveredIndex(null),
                'data-index': index,
              });
            }
            return child;
          })}
        </motion.div>
      </DockContext.Provider>
    </MotionConfig>
  );
};

// Dock Item component
interface DockItemProps extends React.HTMLAttributes<HTMLDivElement> {
  'data-index'?: number;
}

export const DockItem = ({ 
  children, 
  className, 
  'data-index': index, 
  ...props 
}: DockItemProps) => {
  const itemRef = useRef<HTMLDivElement>(null);
  const { hovered, hoveredIndex, mousePosition } = useContext(DockContext);
  const itemIndex = index !== undefined ? index : -1;
  
  const size = calculateItemSize(
    itemIndex, 
    hoveredIndex, 
    hovered, 
    mousePosition.x,
    itemRef,
  );

  return (
    <motion.div
      ref={itemRef}
      className={cn('relative mx-1', className)}
      animate={{
        width: size,
        height: size,
      }}
      {...props}
    >
      {children}
    </motion.div>
  );
};

// Dock Label component
interface DockLabelProps extends React.HTMLAttributes<HTMLDivElement> {}

export const DockLabel = ({ children, className, ...props }: DockLabelProps) => {
  const { hovered, hoveredIndex } = useContext(DockContext);
  const dockItemElement = useRef<HTMLElement | null>(null);
  const [show, setShow] = useState(false);
  const [index, setIndex] = useState<number | null>(null);

  // Find the parent dock item and get its index
  useEffect(() => {
    if (typeof window === 'undefined') return;
    
    let parent = dockItemElement.current?.parentElement;
    while (parent && !parent.hasAttribute('data-index')) {
      parent = parent.parentElement;
    }
    
    if (parent && parent.hasAttribute('data-index')) {
      const dataIndexAttr = parent.getAttribute('data-index');
      if (dataIndexAttr !== null) {
        setIndex(parseInt(dataIndexAttr, 10));
      }
    }
    
    dockItemElement.current = parent as HTMLElement;
  }, []);

  // Show the label when the parent dock item is hovered
  useEffect(() => {
    if (hoveredIndex === index) {
      setShow(true);
    } else {
      setShow(false);
    }
  }, [hoveredIndex, index]);

  return (
    <motion.div
      className={cn(
        'absolute -top-9 left-1/2 -translate-x-1/2 whitespace-nowrap rounded bg-black px-3 py-1 text-sm text-white',
        className,
      )}
      ref={(el) => {
        if (el && !dockItemElement.current) {
          dockItemElement.current = el;
        }
      }}
      initial={{ opacity: 0, y: 10, scale: 0.8 }}
      animate={{ 
        opacity: show ? 1 : 0, 
        y: show ? 0 : 10,
        scale: show ? 1 : 0.8,
      }}
      transition={{ duration: 0.1 }}
      {...props}
    >
      {children}
      <div className="absolute left-1/2 top-full -mt-[1px] h-0 w-0 -translate-x-1/2 border-x-4 border-t-4 border-x-transparent border-t-black" />
    </motion.div>
  );
};

// Dock Icon component
interface DockIconProps extends React.HTMLAttributes<HTMLDivElement> {}

export const DockIcon = ({ children, className, ...props }: DockIconProps) => {
  return (
    <div 
      className={cn('flex h-full w-full items-center justify-center', className)}
      {...props}
    >
      {children}
    </div>
  );
};