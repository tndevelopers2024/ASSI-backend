import Post from "../model/post.js";
import User from "../model/user.js";
import { io } from "../server.js";   // ⭐ REQUIRED for socket
import Comment from "../model/comment.js";
import Notification from "../model/notification.js";
import sharp from "sharp";
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const uploadDir = path.join(__dirname, "..", "uploads", "post");

// ... existing code ...

export const toggleLikePost = async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user._id;

    const post = await Post.findById(id);
    if (!post) {
      return res.status(404).json({ message: "Post not found" });
    }

    const isLiked = post.likes.includes(userId);

    if (isLiked) {
      // Unlike
      post.likes = post.likes.filter((like) => like.toString() !== userId.toString());
      await post.save();

      // 🔥 Broadcast the update to everyone
      const updatedPost = await Post.findById(id).populate("user", "fullname email profile_url user_id createdAt");
      io.emit("post:updated", updatedPost);

      return res.json({ message: "Post unliked", isLiked: false, likesCount: post.likes.length });
    } else {
      // Like
      post.likes.push(userId);
      await post.save();

      // Create Notification if not self-like
      if (post.user.toString() !== userId.toString()) {
        const newNotif = await Notification.create({
          user: post.user,
          fromUser: userId,
          type: "like",
          post: post._id,
          message: `${req.user.fullname} liked your post.`,
        });

        // 1. Populate fromUser for immediate frontend display
        const populatedNotif = await Notification.findById(newNotif._id)
          .populate("fromUser", "fullname profile_url")
          .populate("post", "title");

        // 2. Count unread notifications for the recipient
        const unreadCount = await Notification.countDocuments({
          user: post.user,
          read: false,
        });

        // 3. Emit matching frontend Topbar's expectation (data.count)
        io.to(post.user.toString()).emit("notification:new", {
          ...populatedNotif._doc,
          count: unreadCount,
        });
      }

      // 🔥 4. Emit to ALL users so the like count updates in real-time on everyone's screen
      const updatedPost = await Post.findById(post._id).populate("user", "fullname email profile_url user_id createdAt");
      io.emit("post:updated", updatedPost);

      return res.json({ message: "Post liked", isLiked: true, likesCount: post.likes.length });
    }
  } catch (error) {
    console.error("Toggle like error:", error);
    res.status(500).json({ message: error.message });
  }
};


export const createPost = async (req, res) => {
  try {
    if (!req.body.title) {
      return res.status(400).json({ message: "Title is required" });
    }

    const imageUrls = [];

    if (req.files && req.files.length > 0) {
      for (const file of req.files) {
        const fileName = `${Date.now()}-${file.originalname.split(".")[0]}.webp`;
        const filePath = path.join(uploadDir, fileName);

        // Compression logic: Convert to webp and try to hit 200kb-500kb
        // Webp at 80 quality is usually very efficient.
        await sharp(file.buffer)
          .webp({ quality: 80 })
          .toFile(filePath);

        imageUrls.push(`uploads/post/${fileName}`);
      }
    }

    const post = await Post.create({
      user: req.user._id,
      title: req.body.title,
      content: req.body.content,
      category: req.body.category,
      images: imageUrls,
    });

    // -------------------------------------------
    // ⭐🔥 SEND REAL-TIME EVENT TO ALL USERS
    // -------------------------------------------
    io.emit("post:new", {
      ...post._doc,
      user: {
        _id: req.user._id,
        fullname: req.user.fullname,
        profile_url: req.user.profile_url,
        email: req.user.email,
        user_id: req.user.user_id,
      }
    });

    console.log("🔥 New post broadcasted:", post._id);
    // -------------------------------------------

    res.json({ message: "Post created", post });

  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};





export const getAllPosts = async (req, res) => {
  try {
    const posts = await Post.find()
      .populate("user", "fullname email profile_url user_id createdAt")
      .sort({ createdAt: -1 });

    // Add commentsCount to each post
    const postsWithCounts = await Promise.all(
      posts.map(async (post) => {
        const commentsCount = await Comment.countDocuments({ post: post._id });
        return {
          ...post._doc,
          commentsCount,
          likesCount: post.likes.length,
        };
      })
    );

    res.json(postsWithCounts);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};




export const deletePost = async (req, res) => {
  try {
    const { id } = req.params;

    const post = await Post.findById(id);
    if (!post) return res.status(404).json({ message: "Post not found" });

    // Check ownership
    if (post.user.toString() !== req.user._id.toString()) {
      return res.status(403).json({ message: "Unauthorized" });
    }

    // 🔥 DELETE ALL COMMENTS OF THIS POST
    await Comment.deleteMany({ post: id });

    // Delete the post
    await Post.findByIdAndDelete(id);

    res.json({ message: "Post and its comments deleted" });
  } catch (error) {
    console.error("Delete post error:", error);
    res.status(500).json({ message: error.message });
  }
};


export const getPostsByUser = async (req, res) => {
  try {
    const { userId } = req.params;
    const posts = await Post.find({ user: userId })
      .populate("user", "fullname email profile_url user_id")
      .sort({ createdAt: -1 });

    const postsWithCounts = await Promise.all(
      posts.map(async (post) => {
        const commentsCount = await Comment.countDocuments({ post: post._id });
        return {
          ...post._doc,
          commentsCount,
          likesCount: post.likes.length,
        };
      })
    );

    res.json(postsWithCounts);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

export const updatePost = async (req, res) => {
  try {
    const { id } = req.params;
    const post = await Post.findById(id);

    if (!post) {
      return res.status(404).json({ message: "Post not found" });
    }

    // Check authorization
    if (post.user.toString() !== req.user._id.toString()) {
      return res.status(403).json({ message: "Not authorized to update this post" });
    }

    // Update text fields
    post.title = req.body.title || post.title;
    post.content = req.body.content || post.content;
    post.category = req.body.category || post.category;

    // ⬅️ Extract existingImages from frontend
    let existingImages = [];
    if (req.body.existingImages) {
      try {
        existingImages = JSON.parse(req.body.existingImages);
      } catch (error) {
        console.log("JSON parse error:", error);
      }
    }

    // ⬅️ Extract newly uploaded image URLs
    let newImageUrls = [];
    if (req.files && req.files.length > 0) {
      for (const file of req.files) {
        const fileName = `${Date.now()}-${file.originalname.split(".")[0]}.webp`;
        const filePath = path.join(uploadDir, fileName);

        await sharp(file.buffer)
          .webp({ quality: 80 })
          .toFile(filePath);

        newImageUrls.push(`uploads/post/${fileName}`);
      }
    }

    // ⬅️ MERGE: existingImages (kept) + newImageUrls (uploaded)
    post.images = [...existingImages, ...newImageUrls];

    const updatedPost = await post.save();
    res.json({ message: "Post updated", post: updatedPost });

  } catch (error) {
    console.log(error);
    res.status(500).json({ message: error.message });
  }
};


export const toggleSavePost = async (req, res) => {
  try {
    const { id } = req.params;
    const user = await User.findById(req.user._id);

    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    const isSaved = user.savedPosts.includes(id);

    if (isSaved) {
      // Unsave
      user.savedPosts = user.savedPosts.filter((postId) => postId.toString() !== id);
      await user.save();
      return res.json({ message: "Post unsaved", isSaved: false });
    } else {
      // Save
      user.savedPosts.push(id);
      await user.save();
      return res.json({ message: "Post saved", isSaved: true });
    }
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

export const getSavedPosts = async (req, res) => {
  try {
    const user = await User.findById(req.user._id)
      .populate({
        path: "savedPosts",
        populate: { path: "user", select: "fullname email profile_url " } // populate post owner
      });

    if (!user) return res.status(404).json({ message: "User not found" });

    const savedPostsWithCounts = await Promise.all(
      user.savedPosts.map(async (post) => {
        const commentsCount = await Comment.countDocuments({ post: post._id });
        return {
          ...post._doc,
          commentsCount,
          likesCount: post.likes ? post.likes.length : 0,
        };
      })
    );

    res.json(savedPostsWithCounts);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

export const getPostById = async (req, res) => {
  try {
    const post = await Post.findById(req.params.id)
      .populate("user", "fullname email profile_url user_id");

    if (!post) {
      return res.status(404).json({ message: "Post not found" });
    }

    const commentsCount = await Comment.countDocuments({ post: post._id });

    res.json({
      ...post._doc,
      commentsCount,
      likesCount: post.likes.length,
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: error.message });
  }
};

