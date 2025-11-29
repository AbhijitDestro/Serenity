// Load environment variables FIRST - before any other imports
import dotenv from "dotenv";
import path from "path";

// Try multiple paths for .env file
const possiblePaths = [
  path.resolve(__dirname, "../.env"),
  path.resolve(__dirname, "../../.env"),
  path.resolve(process.cwd(), ".env"),
  path.resolve(process.cwd(), "../.env")
];

let envLoaded = false;
for (const envPath of possiblePaths) {
  try {
    const result = dotenv.config({ path: envPath });
    if (result.parsed) {
      console.log(`Loaded .env file from: ${envPath}`);
      envLoaded = true;
      break;
    }
  } catch (error) {
    // Continue trying other paths
  }
}

if (!envLoaded) {
  console.warn("No .env file loaded, using environment variables from process.env");
}

import express from "express";
import cors from "cors";
import helmet from "helmet";
import morgan from "morgan";
import { serve } from "inngest/express";
import { inngest } from "./inngest/client";
import { functions as inngestFunctions } from "./inngest/function";
import { errorHandler } from "./middleware/errorHandler";
import { logger } from "./utils/logger";
import { connectDB } from "./utils/db";
import authRoutes from "./routes/auth";
import activityRoutes from "./routes/activity";
import chatRoutes from "./routes/chat";
import moodRoutes from "./routes/mood";

// Create Express app
const app = express();

// Middleware
app.use(helmet()); // Security headers
app.use(cors()); // Enable CORS
app.use(express.json()); // Parse JSON bodies
app.use(morgan("dev")); // HTTP request logger
app.use(errorHandler);

// API Routes
app.use("/api/auth", authRoutes);
app.use("/api/activity", activityRoutes);
app.use("/api/chat", chatRoutes);
app.use("/api/mood", moodRoutes);

// Set up Inngest endpoint
app.use(
  "/api/inngest",
  serve({ client: inngest, functions: inngestFunctions })
);

// Enhanced health check endpoint
app.get("/health", (req, res) => {
  if (isServerReady) {
    return res.status(200).json({ 
      status: "ok", 
      message: "Server is running and ready",
      timestamp: new Date().toISOString()
    });
  } else {
    return res.status(503).json({ 
      status: "error", 
      message: "Server is starting up",
      timestamp: new Date().toISOString()
    });
  }
});

// Simple readiness probe
app.get("/ready", (req, res) => {
  if (isServerReady) {
    return res.status(200).send("OK");
  } else {
    return res.status(503).send("Not ready");
  }
});

app.get("/", (req, res) => {
  res.send("Serenity AI is LIVE!!!");
});

// Track server readiness
let isServerReady = false;

const startServer = async () => {
  try {
    // Log environment variables for debugging
    console.log("Environment variables:");
    console.log("PORT:", process.env.PORT || "Not set");
    console.log("MONGODB_URI:", process.env.MONGODB_URI ? "Set" : "Not set");
    console.log("NODE_ENV:", process.env.NODE_ENV || "Not set");
    
    // Add startup timeout
    const startupTimeout = setTimeout(() => {
      console.error("Server startup timed out after 30 seconds");
      process.exit(1);
    }, 30000);
    
    // Small delay to ensure environment is fully loaded
    await new Promise(resolve => setTimeout(resolve, 1000));
    
    // Connect to MongoDB first
    await connectDB();
    console.log("Connected to MongoDB successfully");
    
    // Then start the server
    const PORT = process.env.PORT || 3001;
    const server = app.listen(PORT, () => {
      clearTimeout(startupTimeout); // Clear timeout on successful start
      logger.info(`Server is running on port ${PORT}`);
      logger.info(
        `Inngest endpoint available at http://localhost:${PORT}/api/inngest`
      );
      isServerReady = true;
      console.log("Server is ready to accept requests");
    });
    
    // Handle server errors
    server.on('error', (error) => {
      clearTimeout(startupTimeout);
      logger.error("Server error:", error);
      isServerReady = false;
      process.exit(1);
    });
    
    // Handle graceful shutdown
    process.on('SIGTERM', () => {
      console.log('SIGTERM received, shutting down gracefully');
      server.close(() => {
        console.log('Process terminated');
        process.exit(0);
      });
    });
    
  } catch (error) {
    isServerReady = false;
    logger.error("Failed to start server:", error);
    console.error("Detailed error:", JSON.stringify(error, null, 2));
    process.exit(1);
  }
};

// Add process event handlers for better debugging
process.on('unhandledRejection', (reason, promise) => {
  console.error('Unhandled Rejection at:', promise, 'reason:', reason);
  // Don't exit immediately to allow for cleanup
  setTimeout(() => process.exit(1), 1000);
});

process.on('uncaughtException', (error) => {
  console.error('Uncaught Exception:', error);
  // Don't exit immediately to allow for cleanup
  setTimeout(() => process.exit(1), 1000);
});

// Add a small delay before starting to ensure all modules are loaded
setTimeout(() => {
  startServer();
}, 1000);