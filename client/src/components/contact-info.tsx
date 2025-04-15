import { useState } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { ChatWithLastMessage, User } from '@shared/schema';
import { useAuth } from '@/hooks/use-auth';
import { apiRequest } from '@/lib/queryClient';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarImage, AvatarFallback } from '@/components/ui/avatar';
import { useToast } from '@/hooks/use-toast';
import { 
  X, 
  ChevronRight, 
  Trash2, 
  XCircle, 
  ThumbsDown 
} from 'lucide-react';

interface ContactInfoProps {
  chat: ChatWithLastMessage;
  onClose: () => void;
}

export default function ContactInfo({ chat, onClose }: ContactInfoProps) {
  const { user } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  
  // Chat members excluding current user
  const otherMembers = chat.members?.filter(m => m.id !== user?.id) || [];
  
  // For private chat, get the other user
  const otherUser = !chat.isGroup && otherMembers.length > 0 ? otherMembers[0] : null;
  
  // Generate shared media items from messages
  const mediaMessages = chat.lastMessage?.mediaUrl ? [chat.lastMessage] : [];
  
  // Delete chat mutation
  const deleteChatMutation = useMutation({
    mutationFn: async () => {
      await apiRequest('DELETE', `/api/chats/${chat.id}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/chats'] });
      toast({
        title: 'Chat deleted',
        description: 'The chat has been deleted successfully'
      });
      onClose();
    },
    onError: (error) => {
      toast({
        title: 'Failed to delete chat',
        description: error.message,
        variant: 'destructive'
      });
    }
  });
  
  // Block user mutation (for private chats)
  const blockUserMutation = useMutation({
    mutationFn: async () => {
      if (!otherUser) return;
      await apiRequest('POST', `/api/users/${otherUser.id}/block`);
    },
    onSuccess: () => {
      toast({
        title: 'User blocked',
        description: `You have blocked ${otherUser?.displayName}`
      });
      onClose();
    },
    onError: (error) => {
      toast({
        title: 'Failed to block user',
        description: error.message,
        variant: 'destructive'
      });
    }
  });
  
  // Report contact mutation
  const reportContactMutation = useMutation({
    mutationFn: async () => {
      await apiRequest('POST', `/api/chats/${chat.id}/report`);
    },
    onSuccess: () => {
      toast({
        title: 'Contact reported',
        description: 'Thank you for your feedback'
      });
    },
    onError: (error) => {
      toast({
        title: 'Failed to report contact',
        description: error.message,
        variant: 'destructive'
      });
    }
  });
  
  return (
    <div className="w-96 flex-shrink-0 bg-[#FFFFFF] border-l border-[#E9EDEF] flex-col h-full">
      <div className="flex items-center bg-[#F0F2F5] p-3 h-16">
        <Button variant="ghost" size="icon" className="mr-6 text-[#8696A0] hover:text-[#111B21]" onClick={onClose}>
          <X className="h-5 w-5" />
        </Button>
        <h2 className="text-[#111B21] font-medium">Contact Info</h2>
      </div>
      
      <div className="overflow-y-auto h-full">
        <div className="p-6 flex flex-col items-center justify-center bg-[#F0F2F5]">
          <Avatar className="h-32 w-32 mb-4">
            {chat.image ? (
              <AvatarImage src={chat.image} alt={chat.name || 'Chat'} />
            ) : chat.isGroup ? (
              <AvatarFallback className="bg-[#34B7F1] text-white text-3xl">
                {(chat.name || 'G').substring(0, 2)}
              </AvatarFallback>
            ) : otherUser?.profileImage ? (
              <AvatarImage src={otherUser.profileImage} alt={otherUser.displayName} />
            ) : (
              <AvatarFallback className="text-3xl">
                {(otherUser?.displayName || 'U').substring(0, 2)}
              </AvatarFallback>
            )}
          </Avatar>
          
          <h3 className="text-[#111B21] font-medium text-xl">
            {chat.isGroup ? chat.name : otherUser?.displayName || 'Unknown'}
          </h3>
          
          {!chat.isGroup && (
            <p className="text-[#8696A0]">
              {otherUser?.username || 'No username'}
            </p>
          )}
        </div>
        
        <div className="p-4 border-t border-b border-[#E9EDEF]">
          <p className="text-[#8696A0] text-sm mb-1">About</p>
          <p className="text-[#111B21]">
            {!chat.isGroup ? (otherUser?.status || 'No status') : `${chat.members?.length || 0} participants`}
          </p>
        </div>
        
        {/* Media section */}
        <div className="p-4 flex items-center justify-between border-b border-[#E9EDEF]">
          <div>
            <p className="text-[#111B21] font-medium">Media, links and docs</p>
            <p className="text-[#8696A0] text-sm">{mediaMessages.length} items</p>
          </div>
          <Button variant="ghost" size="icon" className="text-[#34B7F1]">
            <ChevronRight className="h-5 w-5" />
          </Button>
        </div>
        
        {/* Media grid */}
        {mediaMessages.length > 0 ? (
          <div className="grid grid-cols-3 gap-2 p-4 border-b border-[#E9EDEF]">
            {mediaMessages.slice(0, 6).map((message, index) => (
              <div key={index} className="aspect-square rounded-md overflow-hidden">
                <img 
                  src={message.mediaUrl} 
                  alt={`Shared media ${index + 1}`} 
                  className="h-full w-full object-cover"
                />
              </div>
            ))}
            
            {mediaMessages.length > 6 && (
              <div className="aspect-square rounded-md overflow-hidden bg-gray-100 flex items-center justify-center">
                <span className="text-[#8696A0]">+{mediaMessages.length - 6}</span>
              </div>
            )}
          </div>
        ) : (
          <div className="p-4 text-center text-[#8696A0] border-b border-[#E9EDEF]">
            No media shared yet
          </div>
        )}
        
        {/* Group members (if group chat) */}
        {chat.isGroup && (
          <div className="p-4 border-b border-[#E9EDEF]">
            <p className="text-[#111B21] font-medium mb-2">
              {chat.members?.length || 0} participants
            </p>
            
            <div className="space-y-2 max-h-40 overflow-y-auto">
              {chat.members?.map((member) => (
                <div key={member.id} className="flex items-center">
                  <Avatar className="h-10 w-10 mr-3">
                    {member.profileImage ? (
                      <AvatarImage src={member.profileImage} alt={member.displayName} />
                    ) : (
                      <AvatarFallback>
                        {member.displayName.substring(0, 2)}
                      </AvatarFallback>
                    )}
                    {member.isOnline && (
                      <div className="absolute bottom-0 right-0 h-2.5 w-2.5 bg-[#25D366] rounded-full"></div>
                    )}
                  </Avatar>
                  
                  <div>
                    <p className="text-[#111B21]">{member.displayName}</p>
                    <p className="text-xs text-[#8696A0]">
                      {member.id === user?.id ? 'You' : member.status || 'No status'}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
        
        {/* Actions section */}
        <div className="p-4 space-y-4">
          <Button 
            variant="ghost" 
            className="w-full flex items-center justify-start text-red-500 hover:bg-[#F5F6F6] hover:text-red-600"
            onClick={() => {
              if (confirm('Are you sure you want to delete this chat?')) {
                deleteChatMutation.mutate();
              }
            }}
          >
            <Trash2 className="h-5 w-5 mr-4" />
            <span>Delete chat</span>
          </Button>
          
          {!chat.isGroup && (
            <Button 
              variant="ghost" 
              className="w-full flex items-center justify-start text-red-500 hover:bg-[#F5F6F6] hover:text-red-600"
              onClick={() => {
                if (confirm(`Are you sure you want to block ${otherUser?.displayName}?`)) {
                  blockUserMutation.mutate();
                }
              }}
            >
              <XCircle className="h-5 w-5 mr-4" />
              <span>Block {otherUser?.displayName}</span>
            </Button>
          )}
          
          <Button 
            variant="ghost" 
            className="w-full flex items-center justify-start text-[#111B21] hover:bg-[#F5F6F6]"
            onClick={() => {
              if (confirm('Are you sure you want to report this contact?')) {
                reportContactMutation.mutate();
              }
            }}
          >
            <ThumbsDown className="h-5 w-5 mr-4" />
            <span>Report {chat.isGroup ? 'group' : 'contact'}</span>
          </Button>
        </div>
      </div>
    </div>
  );
}
