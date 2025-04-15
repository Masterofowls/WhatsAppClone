import { createContext, ReactNode, useContext, useEffect, useState, useCallback, useRef } from 'react';
import { useAuth } from './use-auth';
import { Message, WebSocketEvent } from '@shared/schema';
import { useToast } from '@/hooks/use-toast';
import { queryClient } from '@/lib/queryClient';

interface WebSocketContextType {
  isConnected: boolean;
  sendMessage: (chatId: number, content: string, mediaUrl?: string, replyToId?: number) => void;
  sendTypingStatus: (chatId: number) => void;
  markMessageAsRead: (messageId: number) => void;
  addReaction: (messageId: number, reaction: string) => void;
}

const WebSocketContext = createContext<WebSocketContextType | null>(null);

export const WebSocketProvider = ({ children }: { children: ReactNode }) => {
  const { user } = useAuth();
  const { toast } = useToast();
  const [isConnected, setIsConnected] = useState(false);
  const wsRef = useRef<WebSocket | null>(null);
  const reconnectTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  const connect = useCallback(() => {
    if (!user || wsRef.current) return;

    const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
    const wsUrl = `${protocol}//${window.location.host}/ws`;
    
    const ws = new WebSocket(wsUrl);
    wsRef.current = ws;

    ws.onopen = () => {
      setIsConnected(true);
      // Authenticate the WebSocket connection
      ws.send(JSON.stringify({
        type: 'authenticate',
        payload: { userId: user.id }
      }));
    };

    ws.onclose = () => {
      setIsConnected(false);
      wsRef.current = null;
      
      // Attempt to reconnect
      if (reconnectTimeoutRef.current) {
        clearTimeout(reconnectTimeoutRef.current);
      }
      
      reconnectTimeoutRef.current = setTimeout(() => {
        connect();
      }, 3000);
    };

    ws.onerror = () => {
      toast({
        title: 'Connection Error',
        description: 'Failed to connect to the chat server',
        variant: 'destructive',
      });
      ws.close();
    };

    ws.onmessage = (event) => {
      try {
        const message: WebSocketEvent = JSON.parse(event.data);
        
        switch (message.type) {
          case 'new_message':
            // Update the chat messages cache
            const newMessage: Message = message.payload;
            queryClient.invalidateQueries({ queryKey: [`/api/chats/${newMessage.chatId}/messages`] });
            queryClient.invalidateQueries({ queryKey: ['/api/chats'] });
            break;
            
          case 'typing':
            // Handle typing indicator
            // This will be managed by the ChatArea component state
            const { chatId, userId } = message.payload;
            const typingEvent = new CustomEvent('user-typing', { 
              detail: { chatId, userId } 
            });
            window.dispatchEvent(typingEvent);
            break;
            
          case 'message_read':
            // Update message read status
            queryClient.invalidateQueries({ queryKey: [`/api/chats/${message.payload.messageId}`] });
            break;
            
          case 'message_reaction':
            // Update message reactions
            queryClient.invalidateQueries({ queryKey: [`/api/chats/${message.payload.messageId}`] });
            break;
            
          case 'user_status':
            // Update user status
            queryClient.invalidateQueries({ queryKey: ['/api/users'] });
            break;
            
          case 'heartbeat':
            // Do nothing, this is just to keep the connection alive
            break;
            
          default:
            console.log('Unknown message type:', message.type);
        }
      } catch (err) {
        console.error('Failed to parse WebSocket message:', err);
      }
    };

    return () => {
      if (ws) {
        ws.close();
      }
      if (reconnectTimeoutRef.current) {
        clearTimeout(reconnectTimeoutRef.current);
      }
    };
  }, [user, toast]);

  // Connect when the user is authenticated
  useEffect(() => {
    if (user) {
      connect();
    } else if (wsRef.current) {
      wsRef.current.close();
      wsRef.current = null;
      setIsConnected(false);
    }
    
    return () => {
      if (wsRef.current) {
        wsRef.current.close();
        wsRef.current = null;
      }
      if (reconnectTimeoutRef.current) {
        clearTimeout(reconnectTimeoutRef.current);
      }
    };
  }, [user, connect]);

  // Send a chat message
  const sendMessage = useCallback((chatId: number, content: string, mediaUrl?: string, replyToId?: number) => {
    if (!wsRef.current || wsRef.current.readyState !== WebSocket.OPEN) {
      toast({
        title: 'Connection Error',
        description: 'Not connected to the chat server',
        variant: 'destructive',
      });
      return;
    }
    
    wsRef.current.send(JSON.stringify({
      type: 'message',
      payload: {
        chatId,
        content,
        mediaUrl,
        replyToId,
      }
    }));
  }, [toast]);

  // Send typing status
  const sendTypingStatus = useCallback((chatId: number) => {
    if (!wsRef.current || wsRef.current.readyState !== WebSocket.OPEN) return;
    
    wsRef.current.send(JSON.stringify({
      type: 'typing',
      payload: {
        chatId,
      }
    }));
  }, []);

  // Mark message as read
  const markMessageAsRead = useCallback((messageId: number) => {
    if (!wsRef.current || wsRef.current.readyState !== WebSocket.OPEN) return;
    
    wsRef.current.send(JSON.stringify({
      type: 'read',
      payload: {
        messageId,
      }
    }));
  }, []);

  // Add reaction to message
  const addReaction = useCallback((messageId: number, reaction: string) => {
    if (!wsRef.current || wsRef.current.readyState !== WebSocket.OPEN) {
      toast({
        title: 'Connection Error',
        description: 'Not connected to the chat server',
        variant: 'destructive',
      });
      return;
    }
    
    wsRef.current.send(JSON.stringify({
      type: 'reaction',
      payload: {
        messageId,
        reaction,
      }
    }));
  }, [toast]);

  return (
    <WebSocketContext.Provider
      value={{
        isConnected,
        sendMessage,
        sendTypingStatus,
        markMessageAsRead,
        addReaction,
      }}
    >
      {children}
    </WebSocketContext.Provider>
  );
};

export const useWebSocket = () => {
  const context = useContext(WebSocketContext);
  if (!context) {
    throw new Error('useWebSocket must be used within a WebSocketProvider');
  }
  return context;
};
