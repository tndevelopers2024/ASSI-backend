// routes/notificationRoutes.js
import express from "express";
import { protect } from "../middlewares/authMiddleware.js";
import {
  getNotifications,
  markAsRead,
  getUnreadCount,
  markAllRead
} from "../controllers/notificationController.js";
import Notification from "../model/notification.js";

const router = express.Router();

// 🔹 Get all notifications
router.get("/", protect, getNotifications);

// 🔹 Mark ONE notification as read
router.put("/mark-one-read/:id", protect, markAsRead);

// 🔹 Existing route to mark read (still works)
router.put("/:id/read", protect, markAsRead);

// 🔹 Get unread count
router.get("/unread-count", protect, getUnreadCount);

// 🔹 Mark ALL notifications as read
router.put("/mark-read", protect, markAllRead);

export default router;
