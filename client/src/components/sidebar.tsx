import { useState, useEffect } from 'react';
import { User, ChatWithLastMessage } from '@shared/schema';
import { useAuth } from '@/hooks/use-auth';
import { useMutation, useQueryClient, useQuery } from '@tanstack/react-query';
import { apiRequest } from '@/lib/queryClient';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { TransitionPanel } from '@/components/core/transition-panel';
import { motion } from 'motion/react';
import { 
  Users, 
  Circle, 
  MessageCircle, 
  MoreVertical, 
  Search, 
  Filter, 
  Check, 
  CheckCheck, 
  Image,
  UserPlus,
  Plus
} from 'lucide-react';
import { format } from 'date-fns';

interface SidebarProps {
  chats: ChatWithLastMessage[];
  onSelectChat: (chat: ChatWithLastMessage) => void;
  onShowProfile: () => void;
  isMobileView: boolean;
}

export default function Sidebar({ chats, onSelectChat, onShowProfile, isMobileView }: SidebarProps) {
  const { user, logoutMutation } = useAuth();
  const [searchTerm, setSearchTerm] = useState('');
  const [showNewChatDialog, setShowNewChatDialog] = useState(false);
  const [newChatName, setNewChatName] = useState('');
  const [selectedUsers, setSelectedUsers] = useState<number[]>([]);
  const [isGroupChat, setIsGroupChat] = useState(false);
  const [activeView, setActiveView] = useState(0);
  
  const queryClient = useQueryClient();
  
  const filteredChats = chats.filter(chat => {
    const chatName = chat.name || chat.members?.find(m => m.id !== user?.id)?.displayName || '';
    return chatName.toLowerCase().includes(searchTerm.toLowerCase());
  });
  
  // Effect to update active view based on search results
  useEffect(() => {
    // If search term is empty, show all chats (index 0)
    // If filtering and results found, show search results (index 0)
    // If filtering but no results, show empty state (index 1)
    setActiveView(searchTerm !== '' && filteredChats.length === 0 ? 1 : 0);
  }, [searchTerm, filteredChats.length]);
  
  // Users query for new chat dialog
  const { data: users = [] } = useQuery<User[]>({
    queryKey: ['/api/users'],
    enabled: showNewChatDialog,
  });
  
  // Create new chat mutation
  const createChatMutation = useMutation({
    mutationFn: async (data: { name?: string, isGroup: boolean, memberIds: number[] }) => {
      const res = await apiRequest('POST', '/api/chats', data);
      return await res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/chats'] });
      setShowNewChatDialog(false);
      setNewChatName('');
      setSelectedUsers([]);
      setIsGroupChat(false);
    }
  });
  
  const handleCreateChat = () => {
    if (isGroupChat && !newChatName) {
      return; // Group chat needs a name
    }
    
    if (selectedUsers.length === 0) {
      return; // Need at least one selected user
    }
    
    createChatMutation.mutate({
      name: isGroupChat ? newChatName : undefined,
      isGroup: isGroupChat,
      memberIds: selectedUsers
    });
  };
  
  const toggleUserSelection = (userId: number) => {
    if (selectedUsers.includes(userId)) {
      setSelectedUsers(selectedUsers.filter(id => id !== userId));
    } else {
      setSelectedUsers([...selectedUsers, userId]);
    }
  };
  
  const getAvatarForChat = (chat: ChatWithLastMessage) => {
    if (chat.image) {
      return <AvatarImage src={chat.image} alt={chat.name || 'Chat'} />;
    }
    
    if (chat.isGroup) {
      return <AvatarFallback className="bg-[#34B7F1] text-white">{(chat.name || 'G').substring(0, 2)}</AvatarFallback>;
    }
    
    // For private chats, show the other user's avatar
    const otherUser = chat.members?.find(m => m.id !== user?.id);
    if (otherUser?.profileImage) {
      return <AvatarImage src={otherUser.profileImage} alt={otherUser.displayName} />;
    }
    
    return <AvatarFallback>{(otherUser?.displayName || 'U').substring(0, 2)}</AvatarFallback>;
  };
  
  const getChatName = (chat: ChatWithLastMessage) => {
    if (chat.name) return chat.name;
    
    // For private chats, show the other user's name
    const otherUser = chat.members?.find(m => m.id !== user?.id);
    return otherUser?.displayName || 'Unknown';
  };
  
  const getLastMessagePreview = (chat: ChatWithLastMessage) => {
    if (!chat.lastMessage) return 'No messages yet';
    
    if (chat.lastMessage.mediaUrl) {
      return (
        <span className="flex items-center">
          <Image className="inline h-4 w-4 mr-1" />
          Photo
        </span>
      );
    }
    
    if (chat.isGroup && chat.lastMessage.senderId !== user?.id) {
      const sender = chat.members?.find(m => m.id === chat.lastMessage?.senderId);
      return (
        <span>
          <span className="font-medium text-[#111B21]">{sender?.displayName}: </span>
          {chat.lastMessage.content}
        </span>
      );
    }
    
    return chat.lastMessage.content;
  };
  
  const getMessageStatusIcon = (chat: ChatWithLastMessage) => {
    if (!chat.lastMessage || chat.lastMessage.senderId !== user?.id) return null;
    
    if (chat.lastMessage.isRead) {
      return <CheckCheck className="inline h-4 w-4 text-[#25D366]" />;
    }
    
    if (chat.lastMessage.isDelivered) {
      return <CheckCheck className="inline h-4 w-4 text-[#8696A0]" />;
    }
    
    return <Check className="inline h-4 w-4 text-[#8696A0]" />;
  };
  
  const formatChatTime = (chat: ChatWithLastMessage) => {
    if (!chat.lastMessage || !chat.lastMessage.sentAt) return '';
    
    const messageDate = new Date(chat.lastMessage.sentAt);
    const today = new Date();
    const yesterday = new Date(today);
    yesterday.setDate(yesterday.getDate() - 1);
    
    if (messageDate.toDateString() === today.toDateString()) {
      return format(messageDate, 'h:mm a');
    }
    
    if (messageDate.toDateString() === yesterday.toDateString()) {
      return 'Yesterday';
    }
    
    return format(messageDate, 'MM/dd/yy');
  };
  
  // Chat list renderer
  const ChatList = () => (
    <>
      {filteredChats.map((chat, index) => (
        <motion.div
          key={chat.id}
          initial={{ opacity: 0, y: 10, scale: 0.97 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          transition={{ 
            duration: 0.3, 
            delay: index * 0.05, 
            type: "spring",
            stiffness: 500,
            damping: 30
          }}
          whileHover={{ 
            scale: 1.01, 
            backgroundColor: "#F5F6F6",
            transition: { duration: 0.2 } 
          }}
          className="flex items-center px-4 py-3.5 rounded-xl mx-2 my-1 cursor-pointer border-b border-[#E9EDEF] transition-all duration-200"
          onClick={() => onSelectChat(chat)}
        >
          <motion.div 
            className="relative h-12 w-12 mr-4 flex-shrink-0"
            whileHover={{ scale: 1.05 }}
            transition={{ duration: 0.2 }}
          >
            <Avatar className="h-12 w-12 border-2 border-transparent shadow-sm">
              {getAvatarForChat(chat)}
            </Avatar>
            {chat.members?.find(m => m.id !== user?.id && m.isOnline) && (
              <motion.div 
                className="absolute bottom-0 right-0 h-3.5 w-3.5 bg-[#25D366] rounded-full border-2 border-white"
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                transition={{ 
                  delay: index * 0.05 + 0.2,
                  type: "spring"
                }}
              />
            )}
          </motion.div>
          
          <div className="flex-1 min-w-0">
            <div className="flex justify-between items-center mb-1">
              <motion.h3 
                className="text-[#111B21] font-medium text-base truncate"
                initial={{ opacity: 0, x: -5 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: index * 0.05 + 0.1, duration: 0.3 }}
              >
                {getChatName(chat)}
              </motion.h3>
              <motion.span 
                className={`text-xs font-medium px-1.5 py-0.5 rounded-full ${
                  chat.unreadCount > 0 
                    ? 'text-[#25D366] bg-[#e7f8ee]' 
                    : 'text-[#8696A0]'
                }`}
                initial={{ opacity: 0, x: 5 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: index * 0.05 + 0.1, duration: 0.3 }}
              >
                {formatChatTime(chat)}
              </motion.span>
            </div>
            
            <div className="flex items-center">
              <motion.div 
                className="flex-1 text-sm text-[#8696A0] truncate"
                initial={{ opacity: 0, y: 5 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.05 + 0.2, duration: 0.3 }}
              >
                {getMessageStatusIcon(chat) && (
                  <motion.span 
                    className="mr-1"
                    whileHover={{ scale: 1.2 }}
                  >
                    {getMessageStatusIcon(chat)}
                  </motion.span>
                )}
                {getLastMessagePreview(chat)}
              </motion.div>
              
              {chat.unreadCount > 0 && (
                <motion.div 
                  className="bg-[#25D366] text-white rounded-full h-5 w-5 flex items-center justify-center text-xs ml-1.5 shadow-sm"
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  whileHover={{ scale: 1.1 }}
                  transition={{ 
                    type: "spring",
                    stiffness: 500,
                    damping: 30,
                    delay: index * 0.05 + 0.3
                  }}
                >
                  {chat.unreadCount}
                </motion.div>
              )}
            </div>
          </div>
        </motion.div>
      ))}
    </>
  );
  
  // Empty state component
  const EmptyState = () => (
    <div className="flex flex-col items-center justify-center h-full p-4 text-[#8696A0]">
      <motion.div 
        initial={{ scale: 0.8, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={{ duration: 0.3, type: 'spring' }}
      >
        <MessageCircle className="h-12 w-12 mb-2 text-[#25D366]" />
      </motion.div>
      <motion.p
        initial={{ y: 10, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ duration: 0.3, delay: 0.1 }}
      >
        No chats found
      </motion.p>
      <motion.div
        initial={{ y: 10, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ duration: 0.3, delay: 0.2 }}
      >
        <Button 
          className="mt-4 bg-[#25D366] hover:bg-[#1da951] text-white"
          onClick={() => setShowNewChatDialog(true)}
        >
          Start a new chat
        </Button>
      </motion.div>
    </div>
  );
  
  // Search empty state
  const SearchEmptyState = () => (
    <div className="flex flex-col items-center justify-center h-full p-4 text-[#8696A0]">
      <motion.div 
        initial={{ scale: 0.8, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={{ duration: 0.3, type: 'spring' }}
      >
        <Search className="h-12 w-12 mb-2 text-[#25D366]" />
      </motion.div>
      <motion.p
        initial={{ y: 10, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ duration: 0.3, delay: 0.1 }}
      >
        No chats found for "{searchTerm}"
      </motion.p>
      <motion.div
        initial={{ y: 10, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ duration: 0.3, delay: 0.2 }}
      >
        <Button 
          className="mt-4 bg-[#25D366] hover:bg-[#1da951] text-white"
          onClick={() => setSearchTerm('')}
        >
          Clear search
        </Button>
      </motion.div>
    </div>
  );
  
  return (
    <div className="w-full md:w-96 flex-shrink-0 bg-[#FFFFFF] border-r border-[#E9EDEF] flex flex-col h-full">
      {/* Profile header */}
      <motion.div 
        className="flex items-center justify-between bg-[#F0F2F5] p-3 h-16"
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3, type: "spring" }}
      >
        <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
          <Button 
            variant="ghost" 
            className="p-0 h-10 w-10 rounded-full hover:bg-[#e5e7eb] overflow-hidden"
            onClick={onShowProfile}
          >
            <Avatar className="h-10 w-10 border-2 border-transparent hover:border-[#25D366] transition-all duration-200">
              {user?.profileImage ? (
                <AvatarImage src={user.profileImage} alt={user.displayName} />
              ) : (
                <AvatarFallback className="bg-[#25D366] text-white">{user?.displayName.substring(0, 2) || 'U'}</AvatarFallback>
              )}
            </Avatar>
          </Button>
        </motion.div>
        
        <motion.div 
          className="flex items-center gap-3"
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.3, delay: 0.1 }}
        >
          <motion.div whileHover={{ scale: 1.1 }} whileTap={{ scale: 0.9 }}>
            <Button 
              variant="ghost" 
              size="icon" 
              className="text-[#8696A0] hover:text-[#111B21] hover:bg-[#F5F6F6] rounded-full"
            >
              <Users className="h-5 w-5" />
            </Button>
          </motion.div>
          
          <motion.div whileHover={{ scale: 1.1 }} whileTap={{ scale: 0.9 }}>
            <Button 
              variant="ghost" 
              size="icon" 
              className="text-[#8696A0] hover:text-[#111B21] hover:bg-[#F5F6F6] rounded-full"
            >
              <Circle className="h-5 w-5" />
            </Button>
          </motion.div>
          
          <motion.div whileHover={{ scale: 1.1 }} whileTap={{ scale: 0.9 }}>
            <Button 
              variant="ghost" 
              size="icon" 
              className="text-[#8696A0] hover:text-[#111B21] hover:bg-[#F5F6F6] rounded-full"
            >
              <MessageCircle className="h-5 w-5" />
            </Button>
          </motion.div>
          
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <motion.div whileHover={{ scale: 1.1 }} whileTap={{ scale: 0.9 }}>
                <Button 
                  variant="ghost" 
                  size="icon" 
                  className="text-[#8696A0] hover:text-[#111B21] hover:bg-[#F5F6F6] rounded-full"
                >
                  <MoreVertical className="h-5 w-5" />
                </Button>
              </motion.div>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="rounded-xl shadow-lg border border-gray-100">
              <DropdownMenuItem 
                onClick={onShowProfile}
                className="rounded-md hover:bg-gray-50 focus:bg-gray-50"
              >
                Profile
              </DropdownMenuItem>
              <DropdownMenuItem 
                onClick={() => setShowNewChatDialog(true)}
                className="rounded-md hover:bg-gray-50 focus:bg-gray-50"
              >
                New chat
              </DropdownMenuItem>
              <DropdownMenuItem 
                onClick={() => logoutMutation.mutate()}
                className="rounded-md hover:bg-gray-50 focus:bg-gray-50 text-red-500"
              >
                Log out
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </motion.div>
      </motion.div>
      
      {/* Search bar */}
      <motion.div 
        className="p-2 bg-[#FFFFFF]"
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3, delay: 0.2 }}
      >
        <motion.div 
          className="relative"
          whileHover={{ scale: 1.01 }}
          transition={{ duration: 0.2 }}
        >
          <Input 
            placeholder="Search or start new chat" 
            className="w-full py-2.5 px-10 bg-[#F0F2F5] rounded-xl text-[#111B21] border-0 focus-visible:ring-0 focus-visible:ring-offset-0 shadow-sm hover:shadow-md transition-all duration-200"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
          <motion.span 
            className="absolute left-3 top-2.5 text-[#8696A0]"
            whileHover={{ scale: 1.1, color: "#25D366" }}
          >
            <Search className="h-5 w-5" />
          </motion.span>
          <motion.span 
            className="absolute right-3 top-2.5 text-[#8696A0]"
            whileHover={{ scale: 1.1, color: "#25D366" }}
          >
            <Filter className="h-5 w-5" />
          </motion.span>
        </motion.div>
      </motion.div>
      
      {/* New chat button for mobile */}
      {isMobileView && (
        <motion.div
          initial={{ scale: 0, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ 
            type: "spring",
            stiffness: 500,
            damping: 30,
            delay: 0.5
          }}
          whileHover={{ scale: 1.1 }}
          whileTap={{ scale: 0.9 }}
          className="fixed right-4 bottom-4 z-10"
        >
          <Button 
            className="bg-[#25D366] hover:bg-[#1da951] text-white rounded-full h-14 w-14 shadow-lg overflow-hidden"
            onClick={() => setShowNewChatDialog(true)}
          >
            <motion.div
              animate={{ 
                rotate: [0, 10, -10, 0],
              }}
              transition={{ 
                duration: 1.5, 
                repeat: Infinity,
                repeatDelay: 3
              }}
            >
              <Plus className="h-7 w-7 absolute opacity-0 animate-ping" />
              <MessageCircle className="h-6 w-6" />
            </motion.div>
          </Button>
        </motion.div>
      )}
      
      {/* Chat list with transitions */}
      <div className="flex-1 overflow-y-auto relative">
        <TransitionPanel
          activeIndex={activeView}
          variants={{
            enter: { opacity: 0, y: 20 },
            center: { opacity: 1, y: 0 },
            exit: { opacity: 0, y: -20 },
          }}
          transition={{ duration: 0.3, ease: 'easeInOut' }}
          className="h-full"
        >
          {[
            // First view: Chat list
            <div key="chatList" className="h-full">
              {filteredChats.length > 0 ? <ChatList /> : <EmptyState />}
            </div>,
            // Second view: Empty search results
            <SearchEmptyState key="emptySearch" />
          ]}
        </TransitionPanel>
      </div>
      
      {/* New chat dialog */}
      <Dialog open={showNewChatDialog} onOpenChange={setShowNewChatDialog}>
        <DialogContent className="sm:max-w-md rounded-xl overflow-hidden border-0 shadow-lg">
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3 }}
          >
            <DialogHeader className="pb-2">
              <DialogTitle className="text-xl font-semibold text-[#111B21]">
                {isGroupChat ? 'Create New Group' : 'Start New Chat'}
              </DialogTitle>
            </DialogHeader>
          </motion.div>
          
          <div className="space-y-4 py-4">
            <motion.div 
              className="flex gap-2"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.3, delay: 0.1 }}
            >
              <motion.div whileHover={{ scale: 1.03 }} whileTap={{ scale: 0.97 }}>
                <Button 
                  variant={isGroupChat ? "outline" : "default"} 
                  className={`rounded-xl px-5 py-2 ${!isGroupChat ? "bg-[#25D366] hover:bg-[#1da951]" : ""}`}
                  onClick={() => setIsGroupChat(false)}
                >
                  <UserPlus className="mr-2 h-4 w-4" />
                  Private Chat
                </Button>
              </motion.div>
              <motion.div whileHover={{ scale: 1.03 }} whileTap={{ scale: 0.97 }}>
                <Button 
                  variant={!isGroupChat ? "outline" : "default"} 
                  className={`rounded-xl px-5 py-2 ${isGroupChat ? "bg-[#25D366] hover:bg-[#1da951]" : ""}`}
                  onClick={() => setIsGroupChat(true)}
                >
                  <Users className="mr-2 h-4 w-4" />
                  Group Chat
                </Button>
              </motion.div>
            </motion.div>
            
            {isGroupChat && (
              <motion.div 
                className="space-y-2"
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                transition={{ duration: 0.3 }}
              >
                <label className="text-sm font-medium text-[#111B21]">Group Name</label>
                <Input 
                  value={newChatName} 
                  onChange={(e) => setNewChatName(e.target.value)} 
                  placeholder="Enter group name"
                  className="rounded-xl border-gray-200 focus-visible:ring-[#25D366] focus-visible:ring-offset-1"
                />
              </motion.div>
            )}
            
            <motion.div 
              className="space-y-2"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.3, delay: 0.2 }}
            >
              <label className="text-sm font-medium text-[#111B21]">
                Select {isGroupChat ? 'Members' : 'Contact'}
              </label>
              <div className="max-h-60 overflow-y-auto border border-gray-200 rounded-xl p-2">
                {users.map((u, index) => (
                  <motion.div 
                    key={u.id} 
                    className={`flex items-center p-3 rounded-xl cursor-pointer transition-all duration-200 ${
                      selectedUsers.includes(u.id) 
                        ? 'bg-[#e7f8ee] border border-[#25D366]' 
                        : 'hover:bg-[#F5F6F6] border border-transparent'
                    }`}
                    onClick={() => toggleUserSelection(u.id)}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ 
                      duration: 0.2, 
                      delay: 0.3 + index * 0.05
                    }}
                    whileHover={{ scale: 1.01, x: 2 }}
                  >
                    <motion.div whileHover={{ scale: 1.1 }} className="mr-3">
                      <Avatar className="h-9 w-9 border-2 border-transparent">
                        {u.profileImage ? (
                          <AvatarImage src={u.profileImage} alt={u.displayName} />
                        ) : (
                          <AvatarFallback className="bg-[#F0F2F5] text-[#111B21]">
                            {u.displayName.substring(0, 2)}
                          </AvatarFallback>
                        )}
                      </Avatar>
                    </motion.div>
                    <span className="text-[#111B21] font-medium">{u.displayName}</span>
                    
                    {selectedUsers.includes(u.id) && (
                      <motion.div 
                        className="ml-auto"
                        initial={{ scale: 0 }}
                        animate={{ scale: 1 }}
                        transition={{ type: "spring", stiffness: 500, damping: 30 }}
                      >
                        <Check className="text-[#25D366] h-5 w-5" />
                      </motion.div>
                    )}
                  </motion.div>
                ))}
                
                {users.length === 0 && (
                  <motion.div 
                    className="p-6 text-center text-[#8696A0] flex flex-col items-center"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ duration: 0.3, delay: 0.3 }}
                  >
                    <Users className="h-10 w-10 mb-2 text-[#8696A0] opacity-50" />
                    <p>No users found</p>
                  </motion.div>
                )}
              </div>
            </motion.div>
            
            <motion.div 
              className="flex justify-end gap-2 pt-2"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.3, delay: 0.4 }}
            >
              <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
                <Button 
                  variant="outline" 
                  onClick={() => setShowNewChatDialog(false)}
                  className="rounded-xl border-gray-200"
                >
                  Cancel
                </Button>
              </motion.div>
              <motion.div 
                whileHover={{ scale: 1.05 }} 
                whileTap={{ scale: 0.95 }}
                animate={selectedUsers.length > 0 ? { y: [0, -2, 0] } : {}}
                transition={{ 
                  y: { repeat: 3, duration: 0.3, repeatDelay: 2 },
                  type: "spring"
                }}
              >
                <Button 
                  className="bg-[#25D366] hover:bg-[#1da951] rounded-xl shadow-md"
                  onClick={handleCreateChat}
                  disabled={createChatMutation.isPending || selectedUsers.length === 0 || (isGroupChat && !newChatName)}
                >
                  {createChatMutation.isPending ? (
                    <motion.div 
                      animate={{ rotate: 360 }}
                      transition={{ repeat: Infinity, duration: 1, ease: "linear" }}
                      className="mr-2 h-4 w-4 border-2 border-white border-t-transparent rounded-full"
                    />
                  ) : (
                    <MessageCircle className="mr-2 h-4 w-4" />
                  )}
                  {createChatMutation.isPending ? 'Creating...' : 'Create Chat'}
                </Button>
              </motion.div>
            </motion.div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}