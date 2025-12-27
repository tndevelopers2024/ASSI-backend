// controllers/notificationController.js
import Notification from "../model/notification.js";
import { io } from "../server.js"; // import the shared io instance

// Get all notifications for the authenticated user
export const getNotifications = async (req, res) => {
  try {
    const notifications = await Notification.find({ user: req.user._id })
      .populate("fromUser", "fullname email profile_url")
      .populate("post", "_id title content category images")
      .populate("comment", "_id")
      .sort({ createdAt: -1 });

    res.json(notifications);
  } catch (e) {
    res.status(500).json({ message: e.message });
  }
};

// Mark a single notification as read
export const markAsRead = async (req, res) => {
  try {
    const notifId = req.params.id;

    // Update the notification if it belongs to the user
    const notif = await Notification.findOneAndUpdate(
      { _id: notifId, user: req.user._id },
      { read: true },
      { new: true }
    );

    if (!notif) {
      return res.status(404).json({ message: "Notification not found" });
    }

    // Recalculate unread count
    const count = await Notification.countDocuments({
      user: req.user._id,
      read: false
    });

    // Emit to this user's room so frontends update badge instantly
    try {
      io.to(req.user._id.toString()).emit("notification:read", { count });
    } catch (emitErr) {
      console.error("Socket emit error (markAsRead):", emitErr);
    }

    res.json({ success: true, message: "Marked as read", count });
  } catch (e) {
    res.status(500).json({ success: false, message: e.message });
  }
};

// Get unread notifications count
export const getUnreadCount = async (req, res) => {
  try {
    const count = await Notification.countDocuments({
      user: req.user._id,
      read: false
    });

    res.json({ count });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Mark all notifications as read
export const markAllRead = async (req, res) => {
  try {
    await Notification.updateMany(
      { user: req.user._id, read: false },
      { read: true }
    );

    // After marking all read, unread count is zero; emit event
    try {
      io.to(req.user._id.toString()).emit("notification:read", { count: 0 });
    } catch (emitErr) {
      console.error("Socket emit error (markAllRead):", emitErr);
    }

    res.json({ message: "All notifications marked as read", count: 0 });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};
