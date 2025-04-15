import { useState, useRef } from 'react';
import { Message, User } from '@shared/schema';
import { format } from 'date-fns';
import { CheckCheck, Check, Image } from 'lucide-react';
import { useAuth } from '@/hooks/use-auth';
import { useWebSocket } from '@/hooks/use-websocket';
import {
  ContextMenu,
  ContextMenuContent,
  ContextMenuItem,
  ContextMenuTrigger,
} from "@/components/ui/context-menu";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";

interface MessageItemProps {
  message: Message;
  isOwnMessage: boolean;
  sender?: User;
}

export default function MessageItem({ message, isOwnMessage, sender }: MessageItemProps) {
  const { user } = useAuth();
  const { addReaction } = useWebSocket();
  const [showReactionPicker, setShowReactionPicker] = useState(false);
  const popoverRef = useRef<HTMLDivElement>(null);
  
  const messageDate = new Date(message.sentAt);
  const formattedTime = format(messageDate, 'h:mm a');
  
  // Get reactions for this message
  const reactions = message.reactions || {};
  const reactionsList = Object.entries(reactions);
  const hasReactions = reactionsList.length > 0;
  
  // Popular emoji reactions
  const popularEmojis = ['👍', '❤️', '😂', '😮', '😢', '🙏'];
  
  // Handle adding reaction
  const handleAddReaction = (emoji: string) => {
    addReaction(message.id, emoji);
    setShowReactionPicker(false);
  };
  
  return (
    <ContextMenu>
      <ContextMenuTrigger>
        <div className={`flex items-end ${isOwnMessage ? 'justify-end' : ''}`}>
          <div 
            className={`max-w-[75%] ${
              isOwnMessage ? 'bg-[#D9FDD3]' : 'bg-white'
            } rounded-lg p-2 pb-1 shadow-sm relative`}
          >
            {/* Display reaction (if any) */}
            {hasReactions && (
              <div className="absolute -top-3 -right-1 bg-white rounded-full px-1 shadow-md">
                <span className="text-sm">{Object.values(reactions)[0]}</span>
              </div>
            )}
            
            {/* Show sender name in group chats */}
            {!isOwnMessage && sender && message.chatId && (
              <p className="text-xs font-medium text-[#34B7F1] mb-1">
                {sender.displayName}
              </p>
            )}
            
            {/* Message content */}
            {message.mediaUrl && (
              <div className="mb-1 rounded-md overflow-hidden">
                <img 
                  src={message.mediaUrl} 
                  alt="Shared media" 
                  className="w-full h-auto rounded"
                />
              </div>
            )}
            
            {message.content && (
              <p className="text-[#111B21]">{message.content}</p>
            )}
            
            {/* Message info */}
            <div className="flex justify-end items-center mt-1 gap-1">
              <span className="text-xs text-[#8696A0]">{formattedTime}</span>
              
              {isOwnMessage && (
                message.isRead ? (
                  <CheckCheck className="h-3.5 w-3.5 text-[#34B7F1]" />
                ) : message.isDelivered ? (
                  <CheckCheck className="h-3.5 w-3.5 text-[#8696A0]" />
                ) : (
                  <Check className="h-3.5 w-3.5 text-[#8696A0]" />
                )
              )}
            </div>
          </div>
          
          {/* Reaction picker */}
          <Popover open={showReactionPicker} onOpenChange={setShowReactionPicker}>
            <PopoverTrigger asChild>
              <div 
                className={`cursor-pointer opacity-0 hover:opacity-100 focus:opacity-100 ml-2 ${
                  isOwnMessage ? 'order-first' : ''
                }`}
                onClick={(e) => {
                  e.stopPropagation();
                  setShowReactionPicker(true);
                }}
              >
                <span className="text-[#8696A0] text-lg">😊</span>
              </div>
            </PopoverTrigger>
            <PopoverContent 
              ref={popoverRef}
              className="p-2 flex gap-1"
              align={isOwnMessage ? "end" : "start"}
              side="top"
            >
              {popularEmojis.map(emoji => (
                <button
                  key={emoji}
                  className="hover:bg-gray-100 rounded-full p-1.5 text-xl"
                  onClick={() => handleAddReaction(emoji)}
                >
                  {emoji}
                </button>
              ))}
            </PopoverContent>
          </Popover>
        </div>
      </ContextMenuTrigger>
      
      <ContextMenuContent>
        <ContextMenuItem onClick={() => setShowReactionPicker(true)}>
          Add Reaction
        </ContextMenuItem>
        <ContextMenuItem>Reply</ContextMenuItem>
        <ContextMenuItem>Forward</ContextMenuItem>
        <ContextMenuItem>Star</ContextMenuItem>
        <ContextMenuItem>Delete</ContextMenuItem>
      </ContextMenuContent>
    </ContextMenu>
  );
}
