import Comment from "../model/comment.js";
import Post from "../model/post.js";
import Notification from "../model/notification.js";
import { io } from "../server.js";  // ⭐ REQUIRED for socket emit
import sharp from "sharp";
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const uploadDir = path.join(__dirname, "..", "uploads", "post");

export const createComment = async (req, res) => {
  try {
    const { postId, content, parentCommentId } = req.body;

    if (!postId || !content) {
      return res.status(400).json({ message: "postId and content required" });
    }

    const post = await Post.findById(postId).populate("user", "fullname email profile_url user_id");

    if (!post) return res.status(404).json({ message: "Post not found" });

    // If replying to another comment
    let parentComment = null;
    if (parentCommentId) {
      parentComment = await Comment.findById(parentCommentId).populate("user", "fullname");

      if (!parentComment) {
        return res.status(404).json({ message: "Parent comment not found" });
      }

      if (parentComment.post.toString() !== postId) {
        return res.status(400).json({ message: "Parent comment does not belong to this post" });
      }
    }

    // Process files with compression
    const imageFiles = [];
    if (req.files && req.files.length > 0) {
      for (const file of req.files) {
        const fileName = `${Date.now()}-${file.originalname.split(".")[0]}.webp`;
        const filePath = path.join(uploadDir, fileName);

        await sharp(file.buffer)
          .webp({ quality: 80 })
          .toFile(filePath);

        imageFiles.push(`uploads/post/${fileName}`);
      }
    }

    // Create the new comment
    const comment = await Comment.create({
      post: postId,
      user: req.user._id,
      content,
      files: imageFiles,
      parentComment: parentCommentId || null,
      mentionedUser: parentComment ? parentComment.user._id : null,
    });

    // ---------------------------------------
    // 🔥 NOTIFICATION GENERATION LOGIC
    // ---------------------------------------

    let notifyUserId = null;
    let message = "";

    if (parentComment) {
      // Reply notification
      if (parentComment.user._id.toString() !== req.user._id.toString()) {
        notifyUserId = parentComment.user._id;
        message = `${req.user.fullname} replied to your comment`;
      }
    } else {
      // Comment on post notification
      if (post.user._id.toString() !== req.user._id.toString()) {
        notifyUserId = post.user._id;
        message = `${req.user.fullname} commented on your post`;
      }
    }

    if (notifyUserId) {
      const newNotif = await Notification.create({
        user: notifyUserId,
        fromUser: req.user._id,
        type: "comment",
        post: post._id,
        comment: comment._id,
        message,
      });

      // 1. Populate fromUser and post for immediate frontend display
      const populatedNotif = await Notification.findById(newNotif._id)
        .populate("fromUser", "fullname profile_url")
        .populate("post", "title");

      // 2. Count unread notifications for that user
      const unreadCount = await Notification.countDocuments({
        user: notifyUserId,
        read: false,
      });

      // 3. Emit real-time notification with ALL info
      io.to(notifyUserId.toString()).emit("notification:new", {
        ...populatedNotif._doc,
        count: unreadCount,
      });

      console.log(`📢 Sent notification to user ${notifyUserId}:`, message);
    }

    // ---------------------------------------

    res.json({ message: "Comment added", comment });
  } catch (error) {
    console.error("Comment creation error:", error);
    res.status(500).json({ message: error.message });
  }
};

export const getComments = async (req, res) => {
  try {
    const { postId } = req.params;

    const comments = await Comment.find({ post: postId })
      .populate("user", "fullname email profile_url")
      .populate("mentionedUser", "fullname email")
      .populate({
        path: "parentComment",
        populate: { path: "user", select: "fullname email" },
      })
      .sort({ createdAt: -1 });

    res.json(comments);
  } catch (error) {
    console.error("Get comments error:", error);
    res.status(500).json({ message: error.message });
  }
};

export const getCommentsByUser = async (req, res) => {
  try {
    const userId = req.user._id;  // ⭐ logged-in user

    const comments = await Comment.find({ user: userId })
      .populate("post", "title content  createdAt")
      .populate("user", "fullname email profile_url")
      .sort({ createdAt: -1 });

    res.json(comments);
  } catch (error) {
    console.error("Get user comments error:", error);
    res.status(500).json({ message: error.message });
  }
};


export const deleteCommentById = async (req, res) => {
  try {
    const { id } = req.params;

    const comment = await Comment.findById(id);
    if (!comment) {
      return res.status(404).json({ message: "Comment not found" });
    }

    // Allow comment owner OR admin OR superadmin to delete the comment
    if (
      comment.user.toString() !== req.user._id.toString() &&
      req.user.role !== "admin" &&
      req.user.role !== "superadmin"
    ) {
      return res.status(403).json({ message: "Unauthorized" });
    }


    await Comment.deleteMany({
      $or: [{ _id: id }, { parentComment: id }],
    });

    res.json({ message: "Comment deleted" });
  } catch (error) {
    console.error("Delete comment error:", error);
    res.status(500).json({ message: error.message });
  }
};
