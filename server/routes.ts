import express, { type Express } from "express";
import { createServer, type Server } from "http";
import { setupAuth } from "./auth";
import { setupWebSocketServer } from "./websocket";
import { storage } from "./storage";
import multer from "multer";
import path from "path";
import fs from "fs";
import { insertChatSchema, insertMessageSchema, insertChatMemberSchema } from "@shared/schema";

// Configure multer for file uploads
const uploadsDir = path.join(process.cwd(), "uploads");
if (!fs.existsSync(uploadsDir)) {
  fs.mkdirSync(uploadsDir, { recursive: true });
}

const storage2 = multer.diskStorage({
  destination: (_req, _file, cb) => {
    cb(null, uploadsDir);
  },
  filename: (_req, file, cb) => {
    const uniqueSuffix = Date.now() + "-" + Math.round(Math.random() * 1e9);
    cb(null, uniqueSuffix + path.extname(file.originalname));
  },
});

const upload = multer({ storage: storage2 });

export async function registerRoutes(app: Express): Promise<Server> {
  // Set up authentication routes
  setupAuth(app);

  // Set up static file serving for uploads
  app.use("/uploads", express.static(uploadsDir));

  // Users endpoints
  app.get("/api/users", async (req, res) => {
    if (!req.isAuthenticated()) return res.status(401).send("Unauthorized");
    const users = await storage.getAllUsers(req.user.id);
    res.json(users);
  });

  app.get("/api/users/:id", async (req, res) => {
    if (!req.isAuthenticated()) return res.status(401).send("Unauthorized");
    const user = await storage.getUser(parseInt(req.params.id));
    if (!user) return res.status(404).send("User not found");
    res.json(user);
  });

  app.post("/api/users/status", async (req, res) => {
    if (!req.isAuthenticated()) return res.status(401).send("Unauthorized");
    const { status } = req.body;
    if (!status) return res.status(400).send("Status is required");
    
    const updatedUser = await storage.updateUserStatus(req.user.id, status);
    res.json(updatedUser);
  });

  app.post("/api/users/profile-image", upload.single("profileImage"), async (req, res) => {
    if (!req.isAuthenticated()) return res.status(401).send("Unauthorized");
    if (!req.file) return res.status(400).send("No image uploaded");
    
    const profileImageUrl = `/uploads/${req.file.filename}`;
    const updatedUser = await storage.updateUserProfileImage(req.user.id, profileImageUrl);
    res.json(updatedUser);
  });

  // Chats endpoints
  app.get("/api/chats", async (req, res) => {
    if (!req.isAuthenticated()) return res.status(401).send("Unauthorized");
    const chats = await storage.getUserChats(req.user.id);
    res.json(chats);
  });

  app.get("/api/chats/:id", async (req, res) => {
    if (!req.isAuthenticated()) return res.status(401).send("Unauthorized");
    const chatId = parseInt(req.params.id);
    const chat = await storage.getChat(chatId);
    
    if (!chat) return res.status(404).send("Chat not found");
    
    // Check if user is member of the chat
    const isMember = await storage.isUserChatMember(req.user.id, chatId);
    if (!isMember) return res.status(403).send("Forbidden");
    
    res.json(chat);
  });

  app.post("/api/chats", async (req, res) => {
    if (!req.isAuthenticated()) return res.status(401).send("Unauthorized");

    try {
      const chatData = insertChatSchema.parse({
        ...req.body,
        createdBy: req.user.id
      });
      
      const chat = await storage.createChat(chatData);
      
      // Add creator to chat members
      await storage.addChatMember({
        chatId: chat.id,
        userId: req.user.id,
        isAdmin: true
      });
      
      // Add other members if provided
      if (req.body.memberIds && Array.isArray(req.body.memberIds)) {
        for (const memberId of req.body.memberIds) {
          if (memberId !== req.user.id) {
            await storage.addChatMember({
              chatId: chat.id,
              userId: memberId,
              isAdmin: false
            });
          }
        }
      }
      
      res.status(201).json(chat);
    } catch (error) {
      res.status(400).json({ error: error.message });
    }
  });

  app.post("/api/chats/:id/members", async (req, res) => {
    if (!req.isAuthenticated()) return res.status(401).send("Unauthorized");
    
    const chatId = parseInt(req.params.id);
    
    // Check if user is admin of the chat
    const isAdmin = await storage.isUserChatAdmin(req.user.id, chatId);
    if (!isAdmin) return res.status(403).send("Only admins can add members");

    try {
      const memberData = insertChatMemberSchema.parse({
        ...req.body,
        chatId
      });
      
      const member = await storage.addChatMember(memberData);
      res.status(201).json(member);
    } catch (error) {
      res.status(400).json({ error: error.message });
    }
  });

  // Messages endpoints
  app.get("/api/chats/:id/messages", async (req, res) => {
    if (!req.isAuthenticated()) return res.status(401).send("Unauthorized");
    
    const chatId = parseInt(req.params.id);
    
    // Check if user is member of the chat
    const isMember = await storage.isUserChatMember(req.user.id, chatId);
    if (!isMember) return res.status(403).send("Forbidden");
    
    const messages = await storage.getChatMessages(chatId);
    res.json(messages);
  });

  app.post("/api/chats/:id/messages", async (req, res) => {
    if (!req.isAuthenticated()) return res.status(401).send("Unauthorized");
    
    const chatId = parseInt(req.params.id);
    
    // Check if user is member of the chat
    const isMember = await storage.isUserChatMember(req.user.id, chatId);
    if (!isMember) return res.status(403).send("Forbidden");

    try {
      const messageData = insertMessageSchema.parse({
        ...req.body,
        chatId,
        senderId: req.user.id
      });
      
      const message = await storage.createMessage(messageData);
      res.status(201).json(message);
    } catch (error) {
      res.status(400).json({ error: error.message });
    }
  });

  app.post("/api/chats/:chatId/messages/:messageId/react", async (req, res) => {
    if (!req.isAuthenticated()) return res.status(401).send("Unauthorized");
    
    const chatId = parseInt(req.params.chatId);
    const messageId = parseInt(req.params.messageId);
    const { reaction } = req.body;
    
    if (!reaction) return res.status(400).send("Reaction is required");
    
    // Check if user is member of the chat
    const isMember = await storage.isUserChatMember(req.user.id, chatId);
    if (!isMember) return res.status(403).send("Forbidden");
    
    const message = await storage.addMessageReaction(messageId, req.user.id, reaction);
    res.json(message);
  });

  app.post("/api/messages/:id/read", async (req, res) => {
    if (!req.isAuthenticated()) return res.status(401).send("Unauthorized");
    
    const messageId = parseInt(req.params.id);
    const message = await storage.markMessageAsRead(messageId, req.user.id);
    res.json(message);
  });

  app.post("/api/media-upload", upload.single("media"), async (req, res) => {
    if (!req.isAuthenticated()) return res.status(401).send("Unauthorized");
    if (!req.file) return res.status(400).send("No file uploaded");
    
    const mediaUrl = `/uploads/${req.file.filename}`;
    res.json({ mediaUrl });
  });

  // Create HTTP server
  const httpServer = createServer(app);
  
  // Set up WebSocket server
  setupWebSocketServer(httpServer);

  return httpServer;
}
