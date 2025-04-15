import { pgTable, text, serial, integer, boolean, timestamp, jsonb } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

// Users table
export const users = pgTable("users", {
  id: serial("id").primaryKey(),
  username: text("username").notNull().unique(),
  password: text("password").notNull(),
  displayName: text("display_name").notNull(),
  profileImage: text("profile_image"),
  status: text("status").default("Available"),
  lastSeen: timestamp("last_seen").defaultNow(),
  isOnline: boolean("is_online").default(false),
});

export const insertUserSchema = createInsertSchema(users).pick({
  username: true,
  password: true,
  displayName: true,
});

// Chats table (both private and group)
export const chats = pgTable("chats", {
  id: serial("id").primaryKey(),
  name: text("name"),
  isGroup: boolean("is_group").default(false),
  createdAt: timestamp("created_at").defaultNow(),
  createdBy: integer("created_by").notNull(),
  image: text("image"),
});

export const insertChatSchema = createInsertSchema(chats).pick({
  name: true,
  isGroup: true,
  createdBy: true,
  image: true,
});

// ChatMembers table
export const chatMembers = pgTable("chat_members", {
  id: serial("id").primaryKey(),
  chatId: integer("chat_id").notNull(),
  userId: integer("user_id").notNull(),
  joinedAt: timestamp("joined_at").defaultNow(),
  isAdmin: boolean("is_admin").default(false),
});

export const insertChatMemberSchema = createInsertSchema(chatMembers).pick({
  chatId: true,
  userId: true,
  isAdmin: true,
});

// Messages table
export const messages = pgTable("messages", {
  id: serial("id").primaryKey(),
  chatId: integer("chat_id").notNull(),
  senderId: integer("sender_id").notNull(),
  content: text("content"),
  mediaUrl: text("media_url"),
  sentAt: timestamp("sent_at").defaultNow(),
  replyToId: integer("reply_to_id"),
  reactions: jsonb("reactions").default({}),
  isRead: boolean("is_read").default(false),
  isDelivered: boolean("is_delivered").default(false),
});

export const insertMessageSchema = createInsertSchema(messages).pick({
  chatId: true,
  senderId: true,
  content: true,
  mediaUrl: true,
  replyToId: true,
});

// Define types
export type User = typeof users.$inferSelect;
export type InsertUser = z.infer<typeof insertUserSchema>;

export type Chat = typeof chats.$inferSelect;
export type InsertChat = z.infer<typeof insertChatSchema>;

export type ChatMember = typeof chatMembers.$inferSelect;
export type InsertChatMember = z.infer<typeof insertChatMemberSchema>;

export type Message = typeof messages.$inferSelect;
export type InsertMessage = z.infer<typeof insertMessageSchema>;

// WebSocket event types
export type WebSocketEvent = {
  type: string;
  payload: any;
};

export type ChatWithLastMessage = Chat & {
  lastMessage?: Message;
  unreadCount: number;
  members: User[];
};
