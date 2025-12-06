import Notification from "../model/notification.js";

export const getNotifications = async (req, res) => {
  try {
    const notifications = await Notification.find({ user: req.user._id })
      .populate("fromUser", "fullname email profile_url")
      .populate("post", "_id")
      .populate("comment", "_id")
      .sort({ createdAt: -1 });

    res.json(notifications);
  } catch (e) {
    res.status(500).json({ message: e.message });
  }
};

export const markAsRead = async (req, res) => {
  try {
    await Notification.findByIdAndUpdate(req.params.id, { read: true });

    res.json({ message: "Marked as read" });
  } catch (e) {
    res.status(500).json({ message: e.message });
  }
};

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

// -------------------------
// MARK ALL AS READ
// -------------------------
export const markAllRead = async (req, res) => {
  try {
    await Notification.updateMany(
      { user: req.user._id, read: false },
      { read: true }
    );

    res.json({ message: "All notifications marked as read" });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};