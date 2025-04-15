import { useState, useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import { ChatWithLastMessage } from '@shared/schema';
import { useAuth } from '@/hooks/use-auth';
import { WebSocketProvider } from '@/hooks/use-websocket';
import Sidebar from '@/components/sidebar';
import ChatArea from '@/components/chat-area';
import ContactInfo from '@/components/contact-info';
import ProfileModal from '@/components/profile-modal';
import { Loader2, MessageCircle } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { TextShimmer } from '@/components/core/text-shimmer';

export default function ChatPage() {
  const { user } = useAuth();
  const [selectedChat, setSelectedChat] = useState<ChatWithLastMessage | null>(null);
  const [showContactInfo, setShowContactInfo] = useState(false);
  const [showProfileModal, setShowProfileModal] = useState(false);
  const [isMobileView, setIsMobileView] = useState(window.innerWidth < 768);
  const [showSidebar, setShowSidebar] = useState(true);
  
  const { data: chats, isLoading } = useQuery<ChatWithLastMessage[]>({
    queryKey: ['/api/chats'],
    enabled: !!user,
  });

  // Handle window resize to manage responsive behavior
  useEffect(() => {
    const handleResize = () => {
      const mobile = window.innerWidth < 768;
      setIsMobileView(mobile);
      
      // On mobile, show either sidebar or chat, not both
      if (mobile && selectedChat) {
        setShowSidebar(false);
      } else {
        setShowSidebar(true);
      }
    };
    
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, [selectedChat]);
  
  // Handle chat selection
  const handleChatSelect = (chat: ChatWithLastMessage) => {
    setSelectedChat(chat);
    
    // On mobile, hide sidebar when a chat is selected
    if (isMobileView) {
      setShowSidebar(false);
    }
  };
  
  // Handle back button on mobile
  const handleBackToSidebar = () => {
    setShowSidebar(true);
    if (isMobileView) {
      setSelectedChat(null);
    }
  };
  
  // Toggle contact info panel
  const toggleContactInfo = () => {
    setShowContactInfo(!showContactInfo);
  };
  
  // Toggle profile modal
  const toggleProfileModal = () => {
    setShowProfileModal(!showProfileModal);
  };

  if (isLoading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen bg-[#F0F2F5] gap-4">
        <Loader2 className="h-12 w-12 animate-spin text-[#25D366]" />
        <TextShimmer className="font-medium text-[#8696A0]" duration={1.5}>
          Loading your conversations...
        </TextShimmer>
      </div>
    );
  }

  return (
    <WebSocketProvider>
      <div className="flex h-screen bg-[#E5DDD5] overflow-hidden">
        {/* Mobile Navigation Bar (only visible on mobile) */}
        {isMobileView && !showSidebar && (
          <div className="fixed top-0 left-0 right-0 bg-[#25D366] text-white w-full h-14 flex items-center justify-between px-4 z-10">
            <h1 className="text-lg font-semibold">WhatsApp</h1>
          </div>
        )}
        
        {/* Sidebar (Contact List) */}
        {showSidebar && (
          <Sidebar 
            chats={chats || []} 
            onSelectChat={handleChatSelect} 
            onShowProfile={toggleProfileModal}
            isMobileView={isMobileView}
          />
        )}
        
        {/* Main Chat Area */}
        {selectedChat ? (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.3 }}
            className="flex-1"
          >
            <ChatArea 
              chat={selectedChat}
              onBackClick={handleBackToSidebar}
              onContactInfoClick={toggleContactInfo}
              isMobileView={isMobileView}
            />
          </motion.div>
        ) : (
          !isMobileView && (
            <div className="flex-1 flex items-center justify-center bg-[#F0F2F5]">
              <motion.div 
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ 
                  type: 'spring',
                  damping: 25, 
                  stiffness: 300,
                  delay: 0.2
                }}
                className="text-center p-6"
              >
                <motion.div 
                  className="w-16 h-16 mx-auto bg-[#25D366] rounded-full flex items-center justify-center mb-4"
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                >
                  <MessageCircle className="h-8 w-8 text-white" />
                </motion.div>
                <motion.h2 
                  className="text-xl font-medium text-[#111B21] mb-2"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ delay: 0.3 }}
                >
                  WhatsApp Web
                </motion.h2>
                <motion.p 
                  className="text-[#8696A0] max-w-md"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ delay: 0.4 }}
                >
                  Select a chat from the sidebar to start messaging.
                </motion.p>
              </motion.div>
            </div>
          )
        )}
        
        {/* Contact Info Panel */}
        <AnimatePresence>
          {showContactInfo && selectedChat && (
            <motion.div
              initial={{ x: 300, opacity: 0 }}
              animate={{ x: 0, opacity: 1 }}
              exit={{ x: 300, opacity: 0 }}
              transition={{ type: 'spring', damping: 25, stiffness: 300 }}
            >
              <ContactInfo 
                chat={selectedChat} 
                onClose={() => setShowContactInfo(false)}
              />
            </motion.div>
          )}
        </AnimatePresence>
        
        {/* Profile Modal */}
        <AnimatePresence>
          {showProfileModal && (
            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.9 }}
              transition={{ type: 'spring', damping: 25, stiffness: 300 }}
            >
              <ProfileModal onClose={toggleProfileModal} />
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </WebSocketProvider>
  );
}
