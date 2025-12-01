import mongoose from "mongoose";
import { logger } from "./logger";

// Set mongoose strict query mode
mongoose.set('strictQuery', false);

export const connectDB = async () => {
  try {
    const MONGODB_URI = process.env.MONGODB_URI || "";
    
    if (!MONGODB_URI) {
      throw new Error("MONGODB_URI is not defined in environment variables");
    }
    
    logger.info("Connecting to MongoDB Atlas");
    console.log("MONGODB_URI:", MONGODB_URI ? "Set (masked)" : "Not set");
    
    // Mask the URI for security in logs
    const maskedUri = MONGODB_URI.replace(/(mongodb\+srv:\/\/)([^:]+):([^@]+)(@.*)/, "$1$2:****$4");
    logger.info("Connecting to MongoDB Atlas with URI:", maskedUri);
    
    // Add connection options for better error handling
    await mongoose.connect(MONGODB_URI, {
      serverSelectionTimeoutMS: 10000, // Timeout after 10 seconds
      socketTimeoutMS: 45000, // Close sockets after 45 seconds of inactivity
      bufferCommands: false // Disable mongoose buffering
    });
    
    logger.info("Connected to MongoDB Atlas");
  } catch (error: any) {
    logger.error("MongoDB connection error:", error.message);
    console.error("MongoDB connection error details:", JSON.stringify(error, null, 2));
    
    // Check if it's a connection error
    if (error.name === 'MongoNetworkError' || error.name === 'MongooseServerSelectionError') {
      logger.error("This is likely a network connectivity issue. Please check:");
      logger.error("1. Your MONGODB_URI is correct");
      logger.error("2. Your MongoDB Atlas cluster is running");
      logger.error("3. Your IP address is whitelisted in MongoDB Atlas");
      logger.error("4. Your network connection is stable");
    }
    
    // Exit the process to prevent hanging
    process.exit(1);
  }
};