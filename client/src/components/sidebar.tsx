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
      {filteredChats.map((chat) => (
        <motion.div
          key={chat.id}
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.2 }}
          className="flex items-center px-3 py-3 hover:bg-[#F5F6F6] cursor-pointer border-b border-[#E9EDEF]"
          onClick={() => onSelectChat(chat)}
        >
          <div className="relative h-12 w-12 mr-3 flex-shrink-0">
            <Avatar className="h-12 w-12">
              {getAvatarForChat(chat)}
            </Avatar>
            {chat.members?.find(m => m.id !== user?.id && m.isOnline) && (
              <div className="absolute bottom-0 right-0 h-3 w-3 bg-[#25D366] rounded-full"></div>
            )}
          </div>
          
          <div className="flex-1 min-w-0">
            <div className="flex justify-between items-center mb-1">
              <h3 className="text-[#111B21] font-medium text-base truncate">
                {getChatName(chat)}
              </h3>
              <span className={`text-xs ${chat.unreadCount > 0 ? 'text-[#25D366]' : 'text-[#8696A0]'}`}>
                {formatChatTime(chat)}
              </span>
            </div>
            
            <div className="flex items-center">
              <div className="flex-1 text-sm text-[#8696A0] truncate">
                {getMessageStatusIcon(chat) && (
                  <span className="mr-1">{getMessageStatusIcon(chat)}</span>
                )}
                {getLastMessagePreview(chat)}
              </div>
              
              {chat.unreadCount > 0 && (
                <div className="bg-[#25D366] text-white rounded-full h-5 w-5 flex items-center justify-center text-xs ml-1">
                  {chat.unreadCount}
                </div>
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
      <div className="flex items-center justify-between bg-[#F0F2F5] p-3 h-16">
        <Button 
          variant="ghost" 
          className="p-0 h-10 w-10 rounded-full"
          onClick={onShowProfile}
        >
          <Avatar className="h-10 w-10">
            {user?.profileImage ? (
              <AvatarImage src={user.profileImage} alt={user.displayName} />
            ) : (
              <AvatarFallback>{user?.displayName.substring(0, 2) || 'U'}</AvatarFallback>
            )}
          </Avatar>
        </Button>
        
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="icon" className="text-[#8696A0] hover:text-[#111B21] hover:bg-[#F5F6F6]">
            <Users className="h-5 w-5" />
          </Button>
          
          <Button variant="ghost" size="icon" className="text-[#8696A0] hover:text-[#111B21] hover:bg-[#F5F6F6]">
            <Circle className="h-5 w-5" />
          </Button>
          
          <Button variant="ghost" size="icon" className="text-[#8696A0] hover:text-[#111B21] hover:bg-[#F5F6F6]">
            <MessageCircle className="h-5 w-5" />
          </Button>
          
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="icon" className="text-[#8696A0] hover:text-[#111B21] hover:bg-[#F5F6F6]">
                <MoreVertical className="h-5 w-5" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem onClick={onShowProfile}>Profile</DropdownMenuItem>
              <DropdownMenuItem onClick={() => setShowNewChatDialog(true)}>New chat</DropdownMenuItem>
              <DropdownMenuItem onClick={() => logoutMutation.mutate()}>Log out</DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>
      
      {/* Search bar */}
      <div className="p-2 bg-[#FFFFFF]">
        <div className="relative">
          <Input 
            placeholder="Search or start new chat" 
            className="w-full py-2 px-10 bg-[#F0F2F5] rounded-lg text-[#111B21] border-0 focus-visible:ring-0 focus-visible:ring-offset-0"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
          <Search className="h-5 w-5 absolute left-3 top-2.5 text-[#8696A0]" />
          <Filter className="h-5 w-5 absolute right-3 top-2.5 text-[#8696A0]" />
        </div>
      </div>
      
      {/* New chat button for mobile */}
      {isMobileView && (
        <Button 
          className="fixed right-4 bottom-4 bg-[#25D366] hover:bg-[#1da951] text-white rounded-full h-14 w-14 shadow-lg z-10"
          onClick={() => setShowNewChatDialog(true)}
        >
          <MessageCircle className="h-6 w-6" />
        </Button>
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
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>{isGroupChat ? 'New Group' : 'New Chat'}</DialogTitle>
          </DialogHeader>
          
          <div className="space-y-4 py-4">
            <div className="flex gap-2">
              <Button 
                variant={isGroupChat ? "outline" : "default"} 
                className={!isGroupChat ? "bg-[#25D366] hover:bg-[#1da951]" : ""}
                onClick={() => setIsGroupChat(false)}
              >
                Private Chat
              </Button>
              <Button 
                variant={!isGroupChat ? "outline" : "default"} 
                className={isGroupChat ? "bg-[#25D366] hover:bg-[#1da951]" : ""}
                onClick={() => setIsGroupChat(true)}
              >
                Group Chat
              </Button>
            </div>
            
            {isGroupChat && (
              <div className="space-y-2">
                <label className="text-sm font-medium">Group Name</label>
                <Input 
                  value={newChatName} 
                  onChange={(e) => setNewChatName(e.target.value)} 
                  placeholder="Enter group name"
                />
              </div>
            )}
            
            <div className="space-y-2">
              <label className="text-sm font-medium">Select {isGroupChat ? 'Members' : 'Contact'}</label>
              <div className="max-h-60 overflow-y-auto border rounded-md p-1">
                {users.map(u => (
                  <div 
                    key={u.id} 
                    className={`flex items-center p-2 rounded-md cursor-pointer ${
                      selectedUsers.includes(u.id) ? 'bg-[#F0F2F5]' : 'hover:bg-[#F5F6F6]'
                    }`}
                    onClick={() => toggleUserSelection(u.id)}
                  >
                    <Avatar className="h-8 w-8 mr-3">
                      {u.profileImage ? (
                        <AvatarImage src={u.profileImage} alt={u.displayName} />
                      ) : (
                        <AvatarFallback>{u.displayName.substring(0, 2)}</AvatarFallback>
                      )}
                    </Avatar>
                    <span className="text-[#111B21]">{u.displayName}</span>
                    
                    {selectedUsers.includes(u.id) && (
                      <Check className="ml-auto text-[#25D366]" />
                    )}
                  </div>
                ))}
                
                {users.length === 0 && (
                  <div className="p-4 text-center text-[#8696A0]">
                    No users found
                  </div>
                )}
              </div>
            </div>
            
            <div className="flex justify-end gap-2">
              <Button variant="outline" onClick={() => setShowNewChatDialog(false)}>
                Cancel
              </Button>
              <Button 
                className="bg-[#25D366] hover:bg-[#1da951]"
                onClick={handleCreateChat}
                disabled={createChatMutation.isPending || selectedUsers.length === 0 || (isGroupChat && !newChatName)}
              >
                {createChatMutation.isPending ? 'Creating...' : 'Create Chat'}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}