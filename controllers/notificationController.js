import Notification from "../model/notification.js";

export const getNotifications = async (req, res) => {
  try {
    const notifications = await Notification.find({ user: req.user._id })
      .populate("fromUser", "fullname email")
      .populate("post", "_id")
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
