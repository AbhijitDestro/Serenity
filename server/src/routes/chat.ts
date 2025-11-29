import express from "express";
import {
  createChatSession,
  getAllChatSessions,
  getChatSession,
  sendMessage,
  getChatHistory,
  deleteChatSession,
} from "../controllers/chat";
import { auth } from "../middleware/auth";

const router = express.Router();

// Apply auth middleware to all routes
router.use(auth);

// Create a new chat session
router.post("/sessions", createChatSession);

// Get all chat sessions for the user
router.get("/sessions", getAllChatSessions);

// Get a specific chat session
router.get("/sessions/:sessionId", getChatSession);

// Delete a chat session
router.delete("/sessions/:sessionId", deleteChatSession);

// Send a message in a chat session
router.post("/sessions/:sessionId/messages", sendMessage);

// Get chat history for a session
router.get("/sessions/:sessionId/history", getChatHistory);

export default router;

// let response = pm.response.json()
// pm.globals.set("access_token", response.access_token)