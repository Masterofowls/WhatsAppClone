import { 
  User, InsertUser, 
  Chat, InsertChat, 
  ChatMember, InsertChatMember, 
  Message, InsertMessage,
  ChatWithLastMessage
} from "@shared/schema";
import * as session from "express-session";
import createMemoryStore from "memorystore";

const MemoryStore = createMemoryStore(session);

// Interface for storage operations
export interface IStorage {
  // User operations
  getUser(id: number): Promise<User | undefined>;
  getUserByUsername(username: string): Promise<User | undefined>;
  createUser(user: InsertUser): Promise<User>;
  updateUserStatus(id: number, status: string): Promise<User>;
  updateUserProfileImage(id: number, imageUrl: string): Promise<User>;
  getAllUsers(excludeId?: number): Promise<User[]>;
  updateUserOnlineStatus(id: number, isOnline: boolean): Promise<User>;
  
  // Chat operations
  getChat(id: number): Promise<Chat | undefined>;
  getUserChats(userId: number): Promise<ChatWithLastMessage[]>;
  createChat(chat: InsertChat): Promise<Chat>;
  
  // Chat member operations
  getChatMembers(chatId: number): Promise<User[]>;
  addChatMember(member: InsertChatMember): Promise<ChatMember>;
  isUserChatMember(userId: number, chatId: number): Promise<boolean>;
  isUserChatAdmin(userId: number, chatId: number): Promise<boolean>;
  
  // Message operations
  getMessage(id: number): Promise<Message | undefined>;
  getChatMessages(chatId: number): Promise<Message[]>;
  createMessage(message: InsertMessage): Promise<Message>;
  markMessageAsRead(messageId: number, userId: number): Promise<Message>;
  markMessageAsDelivered(messageId: number): Promise<Message>;
  addMessageReaction(messageId: number, userId: number, reaction: string): Promise<Message>;
  
  // Session store
  sessionStore: session.Store;
}

export class MemStorage implements IStorage {
  private users: Map<number, User>;
  private chats: Map<number, Chat>;
  private chatMembers: Map<number, ChatMember>;
  private messages: Map<number, Message>;
  private userIdCounter: number;
  private chatIdCounter: number;
  private chatMemberIdCounter: number;
  private messageIdCounter: number;
  sessionStore: session.Store;

  constructor() {
    this.users = new Map();
    this.chats = new Map();
    this.chatMembers = new Map();
    this.messages = new Map();
    this.userIdCounter = 1;
    this.chatIdCounter = 1;
    this.chatMemberIdCounter = 1;
    this.messageIdCounter = 1;
    this.sessionStore = new MemoryStore({
      checkPeriod: 86400000 // prune expired entries every 24h
    });
  }

  // User operations
  async getUser(id: number): Promise<User | undefined> {
    return this.users.get(id);
  }

  async getUserByUsername(username: string): Promise<User | undefined> {
    return Array.from(this.users.values()).find(
      (user) => user.username === username,
    );
  }

  async createUser(insertUser: InsertUser): Promise<User> {
    const id = this.userIdCounter++;
    const timestamp = new Date();
    const user: User = { 
      ...insertUser, 
      id,
      profileImage: null,
      status: "Available",
      lastSeen: timestamp,
      isOnline: false
    };
    this.users.set(id, user);
    return user;
  }

  async updateUserStatus(id: number, status: string): Promise<User> {
    const user = await this.getUser(id);
    if (!user) throw new Error("User not found");
    
    const updatedUser = { ...user, status };
    this.users.set(id, updatedUser);
    return updatedUser;
  }

  async updateUserProfileImage(id: number, imageUrl: string): Promise<User> {
    const user = await this.getUser(id);
    if (!user) throw new Error("User not found");
    
    const updatedUser = { ...user, profileImage: imageUrl };
    this.users.set(id, updatedUser);
    return updatedUser;
  }

  async getAllUsers(excludeId?: number): Promise<User[]> {
    const users = Array.from(this.users.values());
    return excludeId ? users.filter(user => user.id !== excludeId) : users;
  }

  async updateUserOnlineStatus(id: number, isOnline: boolean): Promise<User> {
    const user = await this.getUser(id);
    if (!user) throw new Error("User not found");
    
    const lastSeen = isOnline ? user.lastSeen : new Date();
    const updatedUser = { ...user, isOnline, lastSeen };
    this.users.set(id, updatedUser);
    return updatedUser;
  }

  // Chat operations
  async getChat(id: number): Promise<Chat | undefined> {
    return this.chats.get(id);
  }

  async getUserChats(userId: number): Promise<ChatWithLastMessage[]> {
    // Get chat IDs where user is a member
    const userChatIds = Array.from(this.chatMembers.values())
      .filter(member => member.userId === userId)
      .map(member => member.chatId);
    
    // Get chat objects
    const userChats = userChatIds
      .map(chatId => this.chats.get(chatId))
      .filter(Boolean) as Chat[];
    
    // Enhance chats with last message, unread count, and members
    const enhancedChats = await Promise.all(
      userChats.map(async chat => {
        // Get messages for this chat
        const chatMessages = Array.from(this.messages.values())
          .filter(message => message.chatId === chat.id)
          .sort((a, b) => new Date(b.sentAt).getTime() - new Date(a.sentAt).getTime());
        
        // Get last message if any
        const lastMessage = chatMessages.length > 0 ? chatMessages[0] : undefined;
        
        // Count unread messages
        const unreadCount = chatMessages.filter(
          message => !message.isRead && message.senderId !== userId
        ).length;
        
        // Get chat members
        const members = await this.getChatMembers(chat.id);
        
        return {
          ...chat,
          lastMessage,
          unreadCount,
          members
        };
      })
    );
    
    // Sort by last message time (newest first)
    return enhancedChats.sort((a, b) => {
      const timeA = a.lastMessage ? new Date(a.lastMessage.sentAt).getTime() : 0;
      const timeB = b.lastMessage ? new Date(b.lastMessage.sentAt).getTime() : 0;
      return timeB - timeA;
    });
  }

  async createChat(insertChat: InsertChat): Promise<Chat> {
    const id = this.chatIdCounter++;
    const timestamp = new Date();
    const chat: Chat = {
      ...insertChat,
      id,
      createdAt: timestamp
    };
    this.chats.set(id, chat);
    return chat;
  }

  // Chat member operations
  async getChatMembers(chatId: number): Promise<User[]> {
    const memberIds = Array.from(this.chatMembers.values())
      .filter(member => member.chatId === chatId)
      .map(member => member.userId);
    
    return memberIds
      .map(userId => this.users.get(userId))
      .filter(Boolean) as User[];
  }

  async addChatMember(insertMember: InsertChatMember): Promise<ChatMember> {
    const id = this.chatMemberIdCounter++;
    const timestamp = new Date();
    const member: ChatMember = {
      ...insertMember,
      id,
      joinedAt: timestamp
    };
    this.chatMembers.set(id, member);
    return member;
  }

  async isUserChatMember(userId: number, chatId: number): Promise<boolean> {
    return Array.from(this.chatMembers.values()).some(
      member => member.userId === userId && member.chatId === chatId
    );
  }

  async isUserChatAdmin(userId: number, chatId: number): Promise<boolean> {
    return Array.from(this.chatMembers.values()).some(
      member => member.userId === userId && member.chatId === chatId && member.isAdmin
    );
  }

  // Message operations
  async getMessage(id: number): Promise<Message | undefined> {
    return this.messages.get(id);
  }

  async getChatMessages(chatId: number): Promise<Message[]> {
    return Array.from(this.messages.values())
      .filter(message => message.chatId === chatId)
      .sort((a, b) => new Date(a.sentAt).getTime() - new Date(b.sentAt).getTime());
  }

  async createMessage(insertMessage: InsertMessage): Promise<Message> {
    const id = this.messageIdCounter++;
    const timestamp = new Date();
    const message: Message = {
      ...insertMessage,
      id,
      sentAt: timestamp,
      reactions: {},
      isRead: false,
      isDelivered: false
    };
    this.messages.set(id, message);
    return message;
  }

  async markMessageAsRead(messageId: number, userId: number): Promise<Message> {
    const message = await this.getMessage(messageId);
    if (!message) throw new Error("Message not found");
    
    // Only mark as read if not the sender
    if (message.senderId !== userId) {
      const updatedMessage = { ...message, isRead: true };
      this.messages.set(messageId, updatedMessage);
      return updatedMessage;
    }
    
    return message;
  }

  async markMessageAsDelivered(messageId: number): Promise<Message> {
    const message = await this.getMessage(messageId);
    if (!message) throw new Error("Message not found");
    
    const updatedMessage = { ...message, isDelivered: true };
    this.messages.set(messageId, updatedMessage);
    return updatedMessage;
  }

  async addMessageReaction(messageId: number, userId: number, reaction: string): Promise<Message> {
    const message = await this.getMessage(messageId);
    if (!message) throw new Error("Message not found");
    
    const userIdStr = userId.toString();
    const reactions = { ...message.reactions };
    
    // Set or update reaction for the user
    reactions[userIdStr] = reaction;
    
    const updatedMessage = { ...message, reactions };
    this.messages.set(messageId, updatedMessage);
    return updatedMessage;
  }
}

// Import and use DatabaseStorage
import { DatabaseStorage } from './database-storage';
// export const storage = new MemStorage();
export const storage = new DatabaseStorage();
