import express from "express";
import { protect } from "../middlewares/authMiddleware.js";
import {
  getNotifications,
  markAsRead,
  getUnreadCount,
  markAllRead
} from "../controllers/notificationController.js";

const router = express.Router();

router.get("/", protect, getNotifications);
router.put("/:id/read", protect, markAsRead);

// NEW — get unread count
router.get("/unread-count", protect, getUnreadCount);

// NEW — mark all as read
router.put("/mark-read", protect, markAllRead);

export default router;
