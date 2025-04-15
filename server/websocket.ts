import { WebSocketServer } from "ws";
import { Server } from "http";
import { WebSocket } from "ws";
import { storage } from "./storage";
import { WebSocketEvent } from "@shared/schema";

// Map to store active connections by user ID
const activeConnections = new Map<number, WebSocket>();

export function setupWebSocketServer(server: Server) {
  const wss = new WebSocketServer({ server, path: "/ws" });

  wss.on("connection", (ws: WebSocket) => {
    let userId: number | null = null;

    ws.on("message", async (message: string) => {
      try {
        const event: WebSocketEvent = JSON.parse(message);

        switch (event.type) {
          case "authenticate":
            // Authenticate the WebSocket connection with user ID
            userId = event.payload.userId;
            if (userId) {
              activeConnections.set(userId, ws);
              await storage.updateUserOnlineStatus(userId, true);
              
              // Broadcast user online status to others
              broadcastUserStatus(userId, true);
            }
            break;

          case "message":
            // Handle new message
            if (!userId) return; // Not authenticated
            
            const { chatId, content, mediaUrl, replyToId } = event.payload;
            
            // Check if user is a member of the chat
            const isMember = await storage.isUserChatMember(userId, chatId);
            if (!isMember) return; // Not authorized
            
            // Create the message in storage
            const message = await storage.createMessage({
              chatId,
              senderId: userId,
              content,
              mediaUrl,
              replyToId,
            });
            
            // Get members of the chat
            const members = await storage.getChatMembers(chatId);
            
            // Broadcast message to all chat members who are online
            members.forEach(member => {
              if (member.id !== userId) {
                const connection = activeConnections.get(member.id);
                if (connection && connection.readyState === WebSocket.OPEN) {
                  connection.send(JSON.stringify({
                    type: "new_message",
                    payload: message,
                  }));
                  
                  // Mark as delivered for the online users
                  storage.markMessageAsDelivered(message.id);
                }
              }
            });
            break;

          case "typing":
            // Handle typing indicator
            if (!userId) return; // Not authenticated
            
            const { chatId: typingChatId } = event.payload;
            
            // Get members of the chat
            const chatMembers = await storage.getChatMembers(typingChatId);
            
            // Broadcast typing status to all chat members except the sender
            chatMembers.forEach(member => {
              if (member.id !== userId) {
                const connection = activeConnections.get(member.id);
                if (connection && connection.readyState === WebSocket.OPEN) {
                  connection.send(JSON.stringify({
                    type: "typing",
                    payload: {
                      chatId: typingChatId,
                      userId,
                    },
                  }));
                }
              }
            });
            break;

          case "read":
            // Handle message read status
            if (!userId) return; // Not authenticated
            
            const { messageId } = event.payload;
            const readMessage = await storage.getMessage(messageId);
            if (!readMessage) return; // Message doesn't exist
            
            // Mark as read
            const updatedMessage = await storage.markMessageAsRead(messageId, userId);
            
            // Notify sender if they are online
            const senderConnection = activeConnections.get(readMessage.senderId);
            if (senderConnection && senderConnection.readyState === WebSocket.OPEN) {
              senderConnection.send(JSON.stringify({
                type: "message_read",
                payload: {
                  messageId,
                  readBy: userId,
                },
              }));
            }
            break;

          case "reaction":
            // Handle message reaction
            if (!userId) return; // Not authenticated
            
            const { messageId: reactionMessageId, reaction } = event.payload;
            const targetMessage = await storage.getMessage(reactionMessageId);
            if (!targetMessage) return; // Message doesn't exist
            
            // Add reaction
            const messageWithReaction = await storage.addMessageReaction(reactionMessageId, userId, reaction);
            
            // Get members of the chat
            const targetChatMembers = await storage.getChatMembers(targetMessage.chatId);
            
            // Broadcast reaction to all chat members who are online
            targetChatMembers.forEach(member => {
              const connection = activeConnections.get(member.id);
              if (connection && connection.readyState === WebSocket.OPEN) {
                connection.send(JSON.stringify({
                  type: "message_reaction",
                  payload: {
                    messageId: reactionMessageId,
                    userId,
                    reaction,
                  },
                }));
              }
            });
            break;
        }
      } catch (error) {
        console.error("WebSocket message processing error:", error);
      }
    });

    ws.on("close", async () => {
      if (userId) {
        // Remove from active connections
        activeConnections.delete(userId);
        
        // Update user's online status and last seen timestamp
        await storage.updateUserOnlineStatus(userId, false);
        
        // Broadcast user offline status to others
        broadcastUserStatus(userId, false);
      }
    });

    // Send heartbeat to keep connection alive
    const heartbeatInterval = setInterval(() => {
      if (ws.readyState === WebSocket.OPEN) {
        ws.send(JSON.stringify({ type: "heartbeat" }));
      } else {
        clearInterval(heartbeatInterval);
      }
    }, 30000);
  });

  return wss;
}

// Broadcast user status change to all connections
function broadcastUserStatus(userId: number, isOnline: boolean) {
  activeConnections.forEach((connection, connectionUserId) => {
    if (connectionUserId !== userId && connection.readyState === WebSocket.OPEN) {
      connection.send(JSON.stringify({
        type: "user_status",
        payload: {
          userId,
          isOnline,
          timestamp: new Date().toISOString(),
        },
      }));
    }
  });
}
