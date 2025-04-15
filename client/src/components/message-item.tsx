import { useState, useRef } from 'react';
import { Message, User } from '@shared/schema';
import { format } from 'date-fns';
import { CheckCheck, Check, Image, Heart, ThumbsUp, Laugh, Zap } from 'lucide-react';
import { useAuth } from '@/hooks/use-auth';
import { useWebSocket } from '@/hooks/use-websocket';
import { motion } from 'motion/react';
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
  
  // Get reaction icon based on emoji
  const getReactionIcon = (emoji: string) => {
    switch(emoji) {
      case '👍': return <ThumbsUp className="h-4 w-4 text-blue-500" />;
      case '❤️': return <Heart className="h-4 w-4 text-red-500" />;
      case '😂': return <Laugh className="h-4 w-4 text-yellow-500" />;
      default: return <span className="text-sm">{emoji}</span>;
    }
  };

  return (
    <ContextMenu>
      <ContextMenuTrigger>
        <div className={`flex items-end ${isOwnMessage ? 'justify-end' : ''} group`}>
          <motion.div 
            className={`max-w-[75%] ${
              isOwnMessage ? 'bg-[#D9FDD3]' : 'bg-white'
            } rounded-xl p-3 pb-1.5 shadow-sm relative transition-all duration-200 group-hover:shadow-md`}
            whileHover={{ scale: 1.01 }}
            transition={{ type: "spring", stiffness: 500, damping: 30 }}
          >
            {/* Display reaction (if any) */}
            {hasReactions && (
              <motion.div 
                className="absolute -top-3 -right-1 bg-white rounded-full px-2 py-1 shadow-md"
                initial={{ scale: 0, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                transition={{ type: "spring", stiffness: 500, damping: 30 }}
              >
                {getReactionIcon(Object.values(reactions)[0])}
              </motion.div>
            )}
            
            {/* Show sender name in group chats */}
            {!isOwnMessage && sender && message.chatId && (
              <p className="text-xs font-medium text-[#34B7F1] mb-1">
                {sender.displayName}
              </p>
            )}
            
            {/* Message content */}
            {message.mediaUrl && (
              <motion.div 
                className="mb-1 rounded-md overflow-hidden"
                whileHover={{ scale: 1.02 }}
                transition={{ duration: 0.2 }}
              >
                <img 
                  src={message.mediaUrl} 
                  alt="Shared media" 
                  className="w-full h-auto rounded-md"
                />
              </motion.div>
            )}
            
            {message.content && (
              <p className="text-[#111B21] leading-relaxed">{message.content}</p>
            )}
            
            {/* Message info */}
            <div className="flex justify-end items-center mt-1 gap-1">
              <span className="text-xs text-[#8696A0]">{formattedTime}</span>
              
              {isOwnMessage && (
                <motion.div
                  initial={{ scale: 0.8 }}
                  animate={{ scale: 1 }}
                  transition={{ duration: 0.2 }}
                >
                  {message.isRead ? (
                    <CheckCheck className="h-3.5 w-3.5 text-[#34B7F1]" />
                  ) : message.isDelivered ? (
                    <CheckCheck className="h-3.5 w-3.5 text-[#8696A0]" />
                  ) : (
                    <Check className="h-3.5 w-3.5 text-[#8696A0]" />
                  )}
                </motion.div>
              )}
            </div>
          </motion.div>
          
          {/* Reaction picker */}
          <Popover open={showReactionPicker} onOpenChange={setShowReactionPicker}>
            <PopoverTrigger asChild>
              <motion.div 
                className={`cursor-pointer opacity-0 group-hover:opacity-100 focus:opacity-100 ml-2 ${
                  isOwnMessage ? 'order-first mr-2' : ''
                }`}
                onClick={(e) => {
                  e.stopPropagation();
                  setShowReactionPicker(true);
                }}
                whileHover={{ scale: 1.2 }}
                whileTap={{ scale: 0.9 }}
              >
                <motion.span 
                  className="bg-white text-[#8696A0] text-lg h-8 w-8 flex items-center justify-center rounded-full shadow-sm"
                  whileHover={{ 
                    backgroundColor: ["#ffffff", "#f0f8ff", "#ffffff"],
                    transition: { duration: 2, repeat: Infinity }
                  }}
                >
                  😊
                </motion.span>
              </motion.div>
            </PopoverTrigger>
            <PopoverContent 
              ref={popoverRef}
              className="p-2 flex gap-1 rounded-xl"
              align={isOwnMessage ? "end" : "start"}
              side="top"
            >
              {popularEmojis.map((emoji, index) => (
                <motion.button
                  key={emoji}
                  className="hover:bg-gray-100 rounded-full p-1.5 text-xl"
                  onClick={() => handleAddReaction(emoji)}
                  whileHover={{ scale: 1.2, y: -2 }}
                  whileTap={{ scale: 0.9 }}
                  initial={{ scale: 0, y: 10 }}
                  animate={{ scale: 1, y: 0 }}
                  transition={{ 
                    duration: 0.2, 
                    delay: index * 0.05,
                    type: "spring"
                  }}
                >
                  {emoji}
                </motion.button>
              ))}
            </PopoverContent>
          </Popover>
        </div>
      </ContextMenuTrigger>
      
      <ContextMenuContent className="rounded-xl border border-gray-100 shadow-lg">
        <ContextMenuItem 
          onClick={() => setShowReactionPicker(true)}
          className="hover:bg-gray-50 focus:bg-gray-50 rounded-md"
        >
          Add Reaction
        </ContextMenuItem>
        <ContextMenuItem className="hover:bg-gray-50 focus:bg-gray-50 rounded-md">Reply</ContextMenuItem>
        <ContextMenuItem className="hover:bg-gray-50 focus:bg-gray-50 rounded-md">Forward</ContextMenuItem>
        <ContextMenuItem className="hover:bg-gray-50 focus:bg-gray-50 rounded-md">Star</ContextMenuItem>
        <ContextMenuItem className="hover:bg-gray-50 focus:bg-gray-50 rounded-md text-red-500">Delete</ContextMenuItem>
      </ContextMenuContent>
    </ContextMenu>
  );
}
