import { useEffect, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { X } from 'lucide-react';

interface EmojiPickerProps {
  onSelect: (emoji: string) => void;
  onClose: () => void;
}

export default function EmojiPicker({ onSelect, onClose }: EmojiPickerProps) {
  const emojiPickerRef = useRef<HTMLDivElement>(null);
  
  // Common emoji categories
  const emojis = {
    smileys: [
      '😀', '😁', '😂', '🤣', '😃', '😄', '😅', '😆', '😉', '😊', 
      '😋', '😎', '😍', '🥰', '😘', '😗', '😙', '😚', '🙂', '🤗',
      '🤔', '🤨', '😐', '😑', '😶', '🙄', '😏', '😣', '😥', '😮',
      '🤐', '😯', '😪', '😫', '😴', '😌', '😛', '😜', '😝', '🤤'
    ],
    gestures: [
      '👍', '👎', '👌', '✌️', '🤞', '🤟', '🤘', '🤙', '👈', '👉',
      '👆', '👇', '☝️', '👋', '🤚', '🖐️', '✋', '🖖', '👏', '🙌',
      '👐', '🤲', '🙏', '✍️', '💅', '🤳', '💪', '👨‍💻', '👩‍💻', '🧘‍♀️'
    ],
    animals: [
      '🐶', '🐱', '🐭', '🐹', '🐰', '🦊', '🐻', '🐼', '🐨', '🐯',
      '🦁', '🐮', '🐷', '🐸', '🐵', '🙈', '🙉', '🙊', '🐒', '🦍'
    ],
    food: [
      '🍎', '🍐', '🍊', '🍋', '🍌', '🍉', '🍇', '🍓', '🍈', '🍒',
      '🍑', '🥭', '🍍', '🥥', '🥝', '🍅', '🥑', '🍆', '🥦', '🥬'
    ],
    activity: [
      '⚽', '🏀', '🏈', '⚾', '🥎', '🎾', '🏐', '🏉', '🎱', '🏓',
      '🏸', '🥅', '⛳', '🏹', '🎣', '🥊', '🥋', '⛸️', '🎿', '⛷️'
    ],
    travel: [
      '🚗', '🚕', '🚙', '🚌', '🚎', '🏎️', '🚓', '🚑', '🚒', '🚐',
      '🚚', '🚛', '🚜', '🛴', '🚲', '🛵', '🏍️', '🚨', '🚖', '🚡'
    ],
    objects: [
      '⌚', '📱', '💻', '⌨️', '🖥️', '🖨️', '🖱️', '🖲️', '🕹️', '🗜️',
      '💽', '💾', '💿', '📀', '📼', '📷', '📸', '📹', '🎥', '📽️'
    ],
    symbols: [
      '❤️', '🧡', '💛', '💚', '💙', '💜', '🖤', '♥️', '💘', '💝',
      '💖', '💗', '💓', '💞', '💕', '❣️', '💔', '✨', '🔥', '💯'
    ]
  };

  // Handle click outside to close the picker
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (emojiPickerRef.current && !emojiPickerRef.current.contains(event.target as Node)) {
        onClose();
      }
    }

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [onClose]);

  return (
    <div 
      ref={emojiPickerRef}
      className="fixed bottom-20 left-5 bg-white rounded-lg shadow-xl p-4 w-80 h-96 overflow-y-auto z-50"
    >
      <div className="flex justify-between items-center border-b border-[#E9EDEF] pb-2 mb-2">
        <h3 className="text-[#111B21] font-medium">Emoji</h3>
        <Button variant="ghost" size="icon" onClick={onClose} className="h-7 w-7">
          <X className="h-4 w-4" />
        </Button>
      </div>
      
      <Tabs defaultValue="smileys">
        <TabsList className="grid grid-cols-8 h-auto">
          <TabsTrigger value="smileys" className="px-2 py-1 text-lg">😀</TabsTrigger>
          <TabsTrigger value="gestures" className="px-2 py-1 text-lg">👍</TabsTrigger>
          <TabsTrigger value="animals" className="px-2 py-1 text-lg">🐱</TabsTrigger>
          <TabsTrigger value="food" className="px-2 py-1 text-lg">🍎</TabsTrigger>
          <TabsTrigger value="activity" className="px-2 py-1 text-lg">⚽</TabsTrigger>
          <TabsTrigger value="travel" className="px-2 py-1 text-lg">🚗</TabsTrigger>
          <TabsTrigger value="objects" className="px-2 py-1 text-lg">📱</TabsTrigger>
          <TabsTrigger value="symbols" className="px-2 py-1 text-lg">❤️</TabsTrigger>
        </TabsList>
        
        {Object.entries(emojis).map(([category, categoryEmojis]) => (
          <TabsContent key={category} value={category} className="mt-2">
            <div className="grid grid-cols-8 gap-1">
              {categoryEmojis.map((emoji, index) => (
                <Button
                  key={index}
                  variant="ghost"
                  className="h-8 w-8 flex items-center justify-center hover:bg-gray-100 rounded-md p-0"
                  onClick={() => onSelect(emoji)}
                >
                  <span className="text-xl">{emoji}</span>
                </Button>
              ))}
            </div>
          </TabsContent>
        ))}
      </Tabs>
      
      <div className="mt-3 pt-2 border-t border-[#E9EDEF] text-xs text-[#8696A0]">
        <p>Recently used</p>
        <div className="grid grid-cols-8 gap-1 mt-1">
          {['👍', '❤️', '😂', '🙏', '😊', '🔥', '😍', '😘'].map((emoji, index) => (
            <Button
              key={index}
              variant="ghost"
              className="h-8 w-8 flex items-center justify-center hover:bg-gray-100 rounded-md p-0"
              onClick={() => onSelect(emoji)}
            >
              <span className="text-xl">{emoji}</span>
            </Button>
          ))}
        </div>
      </div>
    </div>
  );
}
