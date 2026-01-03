// controllers/notificationController.js
import Notification from "../model/notification.js";
import { io } from "../server.js"; // import the shared io instance

// Get all notifications for the authenticated user
export const getNotifications = async (req, res) => {
  try {
    const notifications = await Notification.find({
      user: req.user._id
    })
      .populate("fromUser", "fullname email profile_url")
      .populate("post", "_id title content category images")
      .populate("comment", "_id")
      .sort({ createdAt: -1 });

    const valid = notifications.filter(
      (n) =>
        n.post?._id &&
        (n.type === "like" || n.comment?._id)
    );

    res.json(valid);

  } catch (e) {
    res.status(500).json({ message: e.message });
  }
};


// Mark a single notification as read
export const markAsRead = async (req, res) => {
  try {
    const notif = await Notification.findOneAndUpdate(
      { _id: req.params.id, user: req.user._id },
      { read: true },
      { new: true }
    );

    if (!notif) {
      return res.status(404).json({ message: "Notification not found" });
    }

    // Recalculate unread count (VALID notifications only)
    const unread = await Notification.find({
      user: req.user._id,
      read: false
    })
      .populate("post", "_id")
      .populate("comment", "_id");

    const unreadCount = unread.filter(
      (n) =>
        n.post?._id &&
        (n.type === "like" || n.comment?._id)
    ).length;


    // ✅ ONLY emit read event (DO NOT emit notification:new here)
    io.to(req.user._id.toString()).emit("notification:read", { count: unreadCount });

    res.json({
      success: true,
      message: "Marked as read",
      count: unreadCount
    });
  } catch (e) {
    res.status(500).json({ message: e.message });
  }
};


// Get unread notifications count
export const getUnreadCount = async (req, res) => {
  try {
    const unread = await Notification.find({
      user: req.user._id,
      read: false
    })
      .populate("post", "_id")
      .populate("comment", "_id");

    const count = unread.filter(
      (n) =>
        n.post?._id &&
        (n.type === "like" || n.comment?._id)
    ).length;

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

    io.to(req.user._id.toString()).emit("notification:read", { count: 0 });

    res.json({
      message: "All notifications marked as read",
      count: 0
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};
