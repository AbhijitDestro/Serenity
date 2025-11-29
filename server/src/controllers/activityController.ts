import { Request, Response, NextFunction } from "express";
import { Activity } from "../models/Activity";
import { logger } from "../utils/logger";
import { sendActivityCompletionEvent } from "../utils/inngestEvents";

// Log a new activity
export const logActivity = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const { type, name, description, duration, difficulty, feedback, moodScore } =
      req.body;
    const userId = req.user?._id;

    if (!userId) {
      return res.status(401).json({ message: "User not authenticated" });
    }

    // Debounce: Check if a similar activity was logged in the last 5 seconds
    const fiveSecondsAgo = new Date(Date.now() - 5000);
    const existingActivity = await Activity.findOne({
      userId,
      type,
      name,
      timestamp: { $gte: fiveSecondsAgo },
    });

    if (existingActivity) {
      logger.info(`Duplicate activity detected for user ${userId}, skipping.`);
      return res.status(200).json({
        success: true,
        data: existingActivity,
        message: "Duplicate activity detected, returning existing one.",
      });
    }

    const activity = new Activity({
      userId,
      type,
      name,
      description,
      duration,
      difficulty,
      feedback,
      moodScore,
      timestamp: new Date(),
    });

    await activity.save();
    logger.info(`Activity logged for user ${userId}`, {
      type,
      name,
      moodScore
    });

    // Send activity completion event to Inngest
    await sendActivityCompletionEvent({
      userId,
      id: activity._id,
      type,
      name,
      duration,
      difficulty,
      feedback,
      timestamp: activity.timestamp,
    });

    return res.status(201).json({
      success: true,
      data: activity,
    });
  } catch (error) {
    logger.error("Error logging activity:", error);
    return next(error);
  }
};

// Get today's activities
export const getTodayActivities = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const userId = req.user?._id;

    if (!userId) {
      return res.status(401).json({ message: "User not authenticated" });
    }

    const start = new Date();
    start.setHours(0, 0, 0, 0);

    const end = new Date();
    end.setHours(23, 59, 59, 999);

    logger.info(`Fetching today's activities for user ${userId}`, {
      start: start.toISOString(),
      end: end.toISOString(),
      userId: userId.toString()
    });

    const activities = await Activity.find({
      userId,
      timestamp: { $gte: start, $lte: end },
    }).sort({ timestamp: -1 });

    logger.info(`Found ${activities.length} activities for today`, {
      activities: activities.map(a => ({ type: a.type, name: a.name, timestamp: a.timestamp }))
    });

    return res.status(200).json(activities);
  } catch (error) {
    logger.error("Error fetching today's activities:", error);
    return next(error);
  }
};

// Get activity history
export const getActivityHistory = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const userId = req.user?._id;

    if (!userId) {
      return res.status(401).json({ message: "User not authenticated" });
    }

    const activities = await Activity.find({ userId }).sort({ timestamp: -1 });

    logger.info(`Found ${activities.length} total activities for user ${userId}`);

    return res.status(200).json(activities);
  } catch (error) {
    logger.error("Error fetching activity history:", error);
    return next(error);
  }
};