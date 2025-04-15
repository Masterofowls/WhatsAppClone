import { 
  User, InsertUser, 
  Chat, InsertChat, 
  ChatMember, InsertChatMember, 
  Message, InsertMessage,
  ChatWithLastMessage,
  users, chats, chatMembers, messages
} from "@shared/schema";
import { db, pool } from "./db";
import { eq, and, or, asc, desc, inArray, sql } from "drizzle-orm";
import * as session from "express-session";
import connectPg from "connect-pg-simple";
import { IStorage } from "./storage";

const PostgresSessionStore = connectPg(session);

export class DatabaseStorage implements IStorage {
  sessionStore: session.Store;

  constructor() {
    this.sessionStore = new PostgresSessionStore({ 
      pool, 
      createTableIfMissing: true
    });
  }

  // User operations
  async getUser(id: number): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.id, id));
    return user;
  }

  async getUserByUsername(username: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.username, username));
    return user;
  }

  async createUser(insertUser: InsertUser): Promise<User> {
    const [user] = await db.insert(users).values({
      ...insertUser,
      status: "Available",
      isOnline: false,
      lastSeen: new Date()
    }).returning();
    
    return user;
  }

  async updateUserStatus(id: number, status: string): Promise<User> {
    const [updatedUser] = await db.update(users)
      .set({ status })
      .where(eq(users.id, id))
      .returning();
    
    if (!updatedUser) throw new Error("User not found");
    return updatedUser;
  }

  async updateUserProfileImage(id: number, imageUrl: string): Promise<User> {
    const [updatedUser] = await db.update(users)
      .set({ profileImage: imageUrl })
      .where(eq(users.id, id))
      .returning();
    
    if (!updatedUser) throw new Error("User not found");
    return updatedUser;
  }

  async getAllUsers(excludeId?: number): Promise<User[]> {
    if (excludeId) {
      return await db.select().from(users).where(sql`${users.id} != ${excludeId}`);
    }
    return await db.select().from(users);
  }

  async updateUserOnlineStatus(id: number, isOnline: boolean): Promise<User> {
    const lastSeen = isOnline ? sql`${users.lastSeen}` : sql`NOW()`;
    
    const [updatedUser] = await db.update(users)
      .set({ 
        isOnline,
        lastSeen: isOnline ? undefined : new Date()
      })
      .where(eq(users.id, id))
      .returning();
    
    if (!updatedUser) throw new Error("User not found");
    return updatedUser;
  }

  // Chat operations
  async getChat(id: number): Promise<Chat | undefined> {
    const [chat] = await db.select().from(chats).where(eq(chats.id, id));
    return chat;
  }

  async getUserChats(userId: number): Promise<ChatWithLastMessage[]> {
    // Get chat IDs where user is a member
    const members = await db.select()
      .from(chatMembers)
      .where(eq(chatMembers.userId, userId));
    
    if (members.length === 0) {
      return [];
    }
    
    const chatIds = members.map(member => member.chatId);
    
    // Get all chats
    const userChats = await db.select()
      .from(chats)
      .where(inArray(chats.id, chatIds));
    
    // For each chat, get members, last message, and unread count
    const enhancedChats = await Promise.all(
      userChats.map(async chat => {
        // Get chat members
        const members = await this.getChatMembers(chat.id);
        
        // Get last message
        const [lastMessage] = await db.select()
          .from(messages)
          .where(eq(messages.chatId, chat.id))
          .orderBy(desc(messages.sentAt))
          .limit(1);
        
        // Count unread messages
        const [unreadResult] = await db
          .select({ count: sql<number>`count(*)` })
          .from(messages)
          .where(
            and(
              eq(messages.chatId, chat.id),
              eq(messages.isRead, false),
              sql`${messages.senderId} != ${userId}`
            )
          );
        
        const unreadCount = unreadResult?.count || 0;
        
        return {
          ...chat,
          lastMessage,
          unreadCount,
          members
        };
      })
    );
    
    // Sort by last message time (most recent first)
    return enhancedChats.sort((a, b) => {
      const timeA = a.lastMessage ? new Date(a.lastMessage.sentAt).getTime() : 0;
      const timeB = b.lastMessage ? new Date(b.lastMessage.sentAt).getTime() : 0;
      return timeB - timeA;
    });
  }

  async createChat(insertChat: InsertChat): Promise<Chat> {
    const [chat] = await db.insert(chats)
      .values({
        name: insertChat.name,
        isGroup: insertChat.isGroup,
        createdBy: insertChat.createdBy,
        image: insertChat.image,
        createdAt: new Date()
      })
      .returning();
    
    return chat;
  }

  // Chat member operations
  async getChatMembers(chatId: number): Promise<User[]> {
    const result = await db
      .select({ user: users })
      .from(chatMembers)
      .innerJoin(users, eq(chatMembers.userId, users.id))
      .where(eq(chatMembers.chatId, chatId));
    
    return result.map(r => r.user);
  }

  async addChatMember(insertMember: InsertChatMember): Promise<ChatMember> {
    const [member] = await db.insert(chatMembers)
      .values({
        chatId: insertMember.chatId,
        userId: insertMember.userId,
        isAdmin: insertMember.isAdmin,
        joinedAt: new Date()
      })
      .returning();
    
    return member;
  }

  async isUserChatMember(userId: number, chatId: number): Promise<boolean> {
    const [member] = await db.select()
      .from(chatMembers)
      .where(
        and(
          eq(chatMembers.userId, userId),
          eq(chatMembers.chatId, chatId)
        )
      );
    
    return !!member;
  }

  async isUserChatAdmin(userId: number, chatId: number): Promise<boolean> {
    const [member] = await db.select()
      .from(chatMembers)
      .where(
        and(
          eq(chatMembers.userId, userId),
          eq(chatMembers.chatId, chatId),
          eq(chatMembers.isAdmin, true)
        )
      );
    
    return !!member;
  }

  // Message operations
  async getMessage(id: number): Promise<Message | undefined> {
    const [message] = await db.select()
      .from(messages)
      .where(eq(messages.id, id));
    
    return message;
  }

  async getChatMessages(chatId: number): Promise<Message[]> {
    return await db.select()
      .from(messages)
      .where(eq(messages.chatId, chatId))
      .orderBy(asc(messages.sentAt));
  }

  async createMessage(insertMessage: InsertMessage): Promise<Message> {
    const [message] = await db.insert(messages)
      .values({
        chatId: insertMessage.chatId,
        senderId: insertMessage.senderId,
        content: insertMessage.content,
        mediaUrl: insertMessage.mediaUrl,
        replyToId: insertMessage.replyToId,
        sentAt: new Date(),
        isRead: false,
        isDelivered: false,
        reactions: {}
      })
      .returning();
    
    return message;
  }

  async markMessageAsRead(messageId: number, userId: number): Promise<Message> {
    const message = await this.getMessage(messageId);
    if (!message) throw new Error("Message not found");
    
    // Only mark as read if not the sender
    if (message.senderId !== userId) {
      const [updatedMessage] = await db.update(messages)
        .set({ isRead: true })
        .where(eq(messages.id, messageId))
        .returning();
      
      return updatedMessage;
    }
    
    return message;
  }

  async markMessageAsDelivered(messageId: number): Promise<Message> {
    const [updatedMessage] = await db.update(messages)
      .set({ isDelivered: true })
      .where(eq(messages.id, messageId))
      .returning();
    
    if (!updatedMessage) throw new Error("Message not found");
    return updatedMessage;
  }

  async addMessageReaction(messageId: number, userId: number, reaction: string): Promise<Message> {
    const message = await this.getMessage(messageId);
    if (!message) throw new Error("Message not found");
    
    // Get existing reactions or initialize empty object
    const reactions = message.reactions || {};
    
    // Update the reaction for this user
    const userIdStr = userId.toString();
    reactions[userIdStr] = reaction;
    
    // Save updated reactions
    const [updatedMessage] = await db.update(messages)
      .set({ reactions })
      .where(eq(messages.id, messageId))
      .returning();
    
    return updatedMessage;
  }
}