import { useState, useEffect, useRef } from 'react';
import { useQuery } from '@tanstack/react-query';
import { ChatWithLastMessage, Message, User } from '@shared/schema';
import { useAuth } from '@/hooks/use-auth';
import { useWebSocket } from '@/hooks/use-websocket';
import { motion } from 'motion/react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Avatar, AvatarImage, AvatarFallback } from '@/components/ui/avatar';
import MessageItem from '@/components/message-item';
import EmojiPicker from '@/components/emoji-picker';
import { TextShimmer } from '@/components/core/text-shimmer';
import { TextShimmerWave } from '@/components/core/text-shimmer-wave';
import { TextScramble } from '@/components/core/text-scramble';
import { 
  ArrowLeft, 
  Search, 
  MoreVertical, 
  Smile, 
  Paperclip, 
  Mic, 
  Send, 
  Image
} from 'lucide-react';
import { format } from 'date-fns';

interface ChatAreaProps {
  chat: ChatWithLastMessage;
  onBackClick: () => void;
  onContactInfoClick: () => void;
  isMobileView: boolean;
}

export default function ChatArea({ chat, onBackClick, onContactInfoClick, isMobileView }: ChatAreaProps) {
  const { user } = useAuth();
  const { sendMessage, sendTypingStatus, markMessageAsRead } = useWebSocket();
  const [messageInput, setMessageInput] = useState('');
  const [showEmojiPicker, setShowEmojiPicker] = useState(false);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [typingUsers, setTypingUsers] = useState<Map<number, NodeJS.Timeout>>(new Map());
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  
  // Query for messages
  const { data: messages = [], isLoading } = useQuery<Message[]>({
    queryKey: [`/api/chats/${chat.id}/messages`],
    enabled: !!chat.id,
  });
  
  // Chat members excluding current user
  const otherMembers = chat.members?.filter(m => m.id !== user?.id) || [];
  
  // For private chat, get the other user
  const otherUser = !chat.isGroup && otherMembers.length > 0 ? otherMembers[0] : null;
  
  // Scroll to bottom when messages change
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);
  
  // Listen for typing events
  useEffect(() => {
    const handleTyping = (event: CustomEvent<{ chatId: number, userId: number }>) => {
      const { chatId, userId } = event.detail;
      
      if (chatId !== chat.id || userId === user?.id) return;
      
      // Clear any existing timeout for this user
      if (typingUsers.has(userId)) {
        clearTimeout(typingUsers.get(userId));
      }
      
      // Set a new timeout to remove the typing indicator after 3 seconds
      const timeout = setTimeout(() => {
        setTypingUsers(prev => {
          const newMap = new Map(prev);
          newMap.delete(userId);
          return newMap;
        });
      }, 3000);
      
      // Add the user to typing users
      setTypingUsers(prev => {
        const newMap = new Map(prev);
        newMap.set(userId, timeout);
        return newMap;
      });
    };
    
    window.addEventListener('user-typing', handleTyping as EventListener);
    
    return () => {
      window.removeEventListener('user-typing', handleTyping as EventListener);
      
      // Clear all timeouts
      typingUsers.forEach(timeout => clearTimeout(timeout));
    };
  }, [chat.id, user?.id, typingUsers]);
  
  // Mark messages as read
  useEffect(() => {
    messages.forEach(message => {
      if (message.senderId !== user?.id && !message.isRead) {
        markMessageAsRead(message.id);
      }
    });
  }, [messages, user?.id, markMessageAsRead]);
  
  // Handle message input changes
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setMessageInput(e.target.value);
    
    // Send typing indicator
    if (e.target.value.length > 0) {
      sendTypingStatus(chat.id);
    }
  };
  
  // Handle message sending
  const handleSendMessage = async () => {
    if ((!messageInput || messageInput.trim() === '') && !selectedFile) return;
    
    let mediaUrl: string | undefined;
    
    // Upload image if selected
    if (selectedFile) {
      const formData = new FormData();
      formData.append('media', selectedFile);
      
      try {
        const response = await fetch('/api/media-upload', {
          method: 'POST',
          body: formData,
          credentials: 'include',
        });
        
        if (response.ok) {
          const data = await response.json();
          mediaUrl = data.mediaUrl;
        }
      } catch (error) {
        console.error('Failed to upload media:', error);
      }
    }
    
    // Send message
    sendMessage(
      chat.id,
      messageInput.trim(),
      mediaUrl
    );
    
    // Clear input and file selection
    setMessageInput('');
    setSelectedFile(null);
    setImagePreview(null);
    setShowEmojiPicker(false);
  };
  
  // Handle file selection
  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    
    setSelectedFile(file);
    
    // Create preview for images
    if (file.type.startsWith('image/')) {
      const reader = new FileReader();
      reader.onload = (e) => {
        setImagePreview(e.target?.result as string);
      };
      reader.readAsDataURL(file);
    }
  };
  
  // Handle emoji selection
  const handleEmojiSelect = (emoji: string) => {
    setMessageInput(prev => prev + emoji);
  };
  
  // Group messages by date
  const groupedMessages: { [date: string]: Message[] } = {};
  messages.forEach(message => {
    const date = new Date(message.sentAt).toDateString();
    if (!groupedMessages[date]) {
      groupedMessages[date] = [];
    }
    groupedMessages[date].push(message);
  });
  
  // Find typing users
  const typingUserIds = Array.from(typingUsers.keys());
  const typingMemberNames = chat.members
    ?.filter(m => typingUserIds.includes(m.id))
    .map(m => m.displayName) || [];
  
  // Generate chat name and avatar
  const chatDisplayName = chat.isGroup
    ? chat.name
    : otherUser?.displayName || 'Unknown';
  
  const chatOnlineStatus = !chat.isGroup && otherUser?.isOnline 
    ? 'Online'
    : chat.isGroup
      ? `${chat.members?.length || 0} members`
      : 'Offline';
  
  return (
    <div className="flex-1 flex flex-col h-full bg-[#F0F2F5]">
      {/* Chat header */}
      <div className="flex items-center justify-between bg-[#F0F2F5] p-3 border-l border-[#E9EDEF] h-16">
        {isMobileView && (
          <Button variant="ghost" size="icon" className="mr-2" onClick={onBackClick}>
            <ArrowLeft className="h-5 w-5" />
          </Button>
        )}
        
        <div className="flex items-center cursor-pointer" onClick={onContactInfoClick}>
          <Avatar className="h-10 w-10 mr-3">
            {chat.image ? (
              <AvatarImage src={chat.image} alt={chatDisplayName} />
            ) : chat.isGroup ? (
              <AvatarFallback className="bg-[#34B7F1] text-white">
                {(chat.name || 'G').substring(0, 2)}
              </AvatarFallback>
            ) : otherUser?.profileImage ? (
              <AvatarImage src={otherUser.profileImage} alt={otherUser.displayName} />
            ) : (
              <AvatarFallback>
                {(otherUser?.displayName || 'U').substring(0, 2)}
              </AvatarFallback>
            )}
            {!chat.isGroup && otherUser?.isOnline && (
              <div className="absolute bottom-0 right-0 h-3 w-3 bg-[#25D366] rounded-full"></div>
            )}
          </Avatar>
          
          <div>
            <h2 className="text-[#111B21] font-medium">{chatDisplayName}</h2>
            {typingMemberNames.length > 0 ? (
              <p className="text-xs text-[#25D366]">
                {typingMemberNames.join(', ')} {typingMemberNames.length === 1 ? 'is' : 'are'} typing...
              </p>
            ) : (
              <p className="text-xs text-[#8696A0]">{chatOnlineStatus}</p>
            )}
          </div>
        </div>
        
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="icon" className="text-[#8696A0] hover:text-[#111B21] hover:bg-[#F5F6F6]">
            <Search className="h-5 w-5" />
          </Button>
          
          <Button variant="ghost" size="icon" className="text-[#8696A0] hover:text-[#111B21] hover:bg-[#F5F6F6]">
            <MoreVertical className="h-5 w-5" />
          </Button>
        </div>
      </div>
      
      {/* Messages area with chat background pattern */}
      <div 
        className="flex-1 overflow-y-auto p-3 bg-[#E5DDD5] bg-opacity-40"
        style={{
          backgroundImage: `url('https://web.whatsapp.com/img/bg-chat-tile-light_a4be8c74ff1ee9ba2ba3.png')`,
          backgroundRepeat: 'repeat'
        }}
      >
        <div className="flex flex-col space-y-2 max-w-4xl mx-auto">
          {/* Loading state */}
          {isLoading && (
            <motion.div 
              className="flex justify-center my-4"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 0.3 }}
            >
              <motion.div 
                className="bg-white px-6 py-4 rounded-lg text-sm text-[#8696A0] shadow-sm"
                animate={{ 
                  boxShadow: [
                    "0 1px 3px rgba(0,0,0,0.1)",
                    "0 3px 6px rgba(0,0,0,0.15)",
                    "0 1px 3px rgba(0,0,0,0.1)"
                  ]
                }}
                transition={{ 
                  duration: 1.5, 
                  repeat: Infinity,
                  ease: "easeInOut" 
                }}
              >
                <div className="flex items-center space-x-2">
                  <motion.div
                    className="w-3 h-3 rounded-full bg-[#25D366]"
                    animate={{ scale: [1, 1.2, 1] }}
                    transition={{ duration: 1.5, repeat: Infinity, delay: 0 }}
                  />
                  <motion.div
                    className="w-3 h-3 rounded-full bg-[#25D366]"
                    animate={{ scale: [1, 1.2, 1] }}
                    transition={{ duration: 1.5, repeat: Infinity, delay: 0.2 }}
                  />
                  <motion.div
                    className="w-3 h-3 rounded-full bg-[#25D366]"
                    animate={{ scale: [1, 1.2, 1] }}
                    transition={{ duration: 1.5, repeat: Infinity, delay: 0.4 }}
                  />
                  <TextShimmer className="font-medium ml-2" duration={1.5}>
                    Loading messages...
                  </TextShimmer>
                </div>
              </motion.div>
            </motion.div>
          )}
          
          {/* Empty state */}
          {!isLoading && Object.keys(groupedMessages).length === 0 && (
            <motion.div 
              className="flex justify-center my-4"
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ 
                duration: 0.5,
                type: "spring",
                stiffness: 120,
                damping: 20
              }}
            >
              <div className="bg-white px-6 py-4 rounded-lg text-sm shadow-sm">
                <TextScramble className="text-[#25D366] font-medium text-center block mb-3">
                  No messages yet. Start the conversation!
                </TextScramble>
                <motion.div
                  className="flex justify-center text-3xl"
                  initial={{ y: 10 }}
                  animate={{ y: [0, -5, 0] }}
                  transition={{ 
                    repeat: Infinity,
                    duration: 1.5,
                    ease: "easeInOut"
                  }}
                >
                  💬
                </motion.div>
              </div>
            </motion.div>
          )}
          
          {/* Messages grouped by date */}
          {Object.entries(groupedMessages).map(([date, dateMessages]) => (
            <div key={date}>
              {/* Date divider */}
              <div className="flex justify-center my-4">
                <div className="bg-white px-3 py-1 rounded-lg text-xs text-[#8696A0]">
                  {new Date(date).toDateString() === new Date().toDateString()
                    ? 'TODAY'
                    : format(new Date(date), 'MMM d, yyyy').toUpperCase()}
                </div>
              </div>
              
              {/* Messages for this date */}
              {dateMessages.map((message, index) => (
                <motion.div
                  key={message.id}
                  initial={{ opacity: 0, y: 20, scale: 0.95 }}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  transition={{ 
                    duration: 0.35, 
                    delay: Math.min(index * 0.05, 0.3),
                    ease: [0.25, 0.1, 0.25, 1.0]
                  }}
                >
                  <MessageItem 
                    message={message}
                    isOwnMessage={message.senderId === user?.id}
                    sender={chat.members?.find(m => m.id === message.senderId)}
                  />
                </motion.div>
              ))}
            </div>
          ))}
          
          {/* Typing indicator */}
          {typingMemberNames.length > 0 && (
            <div className="flex items-end">
              <div className="max-w-[75%] bg-white rounded-lg p-2 shadow-sm">
                <motion.div
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.3, type: 'spring' }}
                >
                  <TextShimmerWave className="font-medium text-sm text-[#25D366]" duration={1}>
                    {typingMemberNames.join(', ')} {typingMemberNames.length === 1 ? 'is' : 'are'} typing...
                  </TextShimmerWave>
                </motion.div>
              </div>
            </div>
          )}
          
          {/* Dummy div for auto-scrolling */}
          <div ref={messagesEndRef}></div>
        </div>
      </div>
      
      {/* Image preview (if file selected) */}
      {imagePreview && (
        <div className="bg-[#F0F2F5] p-2 border-t border-[#E9EDEF]">
          <div className="relative inline-block">
            <img src={imagePreview} alt="Preview" className="h-20 rounded-md" />
            <Button 
              variant="destructive" 
              size="icon" 
              className="absolute top-0 right-0 h-5 w-5 rounded-full"
              onClick={() => {
                setSelectedFile(null);
                setImagePreview(null);
              }}
            >
              ×
            </Button>
          </div>
        </div>
      )}
      
      {/* Message input area */}
      <motion.div 
        className="bg-[#F0F2F5] p-3 flex items-center gap-2"
        initial={{ y: 20, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ duration: 0.3 }}
      >
        <motion.div className="relative">
          <motion.div whileHover={{ scale: 1.1 }} whileTap={{ scale: 0.9 }}>
            <Button 
              variant="ghost" 
              size="icon" 
              className="text-[#8696A0] hover:text-[#111B21] rounded-full"
              onClick={() => setShowEmojiPicker(!showEmojiPicker)}
            >
              <Smile className="h-6 w-6" />
            </Button>
          </motion.div>
          
          {showEmojiPicker && (
            <motion.div
              initial={{ opacity: 0, scale: 0.9, y: 10 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.9, y: 10 }}
              transition={{ type: "spring", stiffness: 500, damping: 30 }}
            >
              <EmojiPicker 
                onSelect={handleEmojiSelect} 
                onClose={() => setShowEmojiPicker(false)} 
              />
            </motion.div>
          )}
        </motion.div>
        
        <motion.div whileHover={{ scale: 1.1 }} whileTap={{ scale: 0.9 }}>
          <Button 
            variant="ghost" 
            size="icon" 
            className="text-[#8696A0] hover:text-[#111B21] rounded-full"
            onClick={() => fileInputRef.current?.click()}
          >
            <Paperclip className="h-6 w-6" />
            <input 
              type="file" 
              ref={fileInputRef} 
              className="hidden" 
              accept="image/*"
              onChange={handleFileSelect}
            />
          </Button>
        </motion.div>
        
        <motion.div 
          className="flex-1"
          whileHover={{ scale: 1.01 }}
          transition={{ type: "spring", stiffness: 500, damping: 30 }}
        >
          <Input 
            type="text" 
            placeholder="Type a message" 
            className="w-full rounded-xl py-3 px-4 bg-white border-0 focus-visible:ring-0 focus-visible:ring-offset-0 shadow-sm transition-shadow duration-300 hover:shadow-md"
            value={messageInput}
            onChange={handleInputChange}
            onKeyDown={(e) => {
              if (e.key === 'Enter' && !e.shiftKey) {
                e.preventDefault();
                handleSendMessage();
              }
            }}
          />
        </motion.div>
        
        <motion.div 
          whileHover={{ scale: 1.1 }} 
          whileTap={{ scale: 0.9 }}
          animate={messageInput || selectedFile ? { rotate: [0, 5, -5, 0] } : {}}
          transition={{
            duration: 0.5,
            ease: "easeInOut",
            times: [0, 0.3, 0.6, 1],
            repeat: messageInput || selectedFile ? 0 : 0
          }}
        >
          <Button 
            variant="ghost" 
            size="icon" 
            className={`${
              messageInput || selectedFile 
                ? "bg-[#25D366] text-white hover:bg-[#22c55e]" 
                : "text-[#8696A0] hover:text-[#111B21]"
            } rounded-full`}
            onClick={handleSendMessage}
          >
            {messageInput || selectedFile ? (
              <Send className="h-6 w-6" />
            ) : (
              <Mic className="h-6 w-6" />
            )}
          </Button>
        </motion.div>
      </motion.div>
    </div>
  );
}
