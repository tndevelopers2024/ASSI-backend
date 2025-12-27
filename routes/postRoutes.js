import express from "express";
import { protect } from "../middlewares/authMiddleware.js";
import upload from "../middlewares/upload.js";

import {
  createPost,
  deletePost,
  getAllPosts,
  getPostsByUser,
  updatePost,
  toggleSavePost,
  getSavedPosts,
  getPostById,
  toggleLikePost
} from "../controllers/postController.js";

const router = express.Router();

// ➤ Create
router.post("/", protect, upload.array("images", 10), createPost);

// ➤ Read All
router.get("/", protect, getAllPosts);

// ➤ Get posts by user
router.get("/user/:userId", protect, getPostsByUser);

// ➤ Save/Unsave post
router.put("/save/:id", protect, toggleSavePost);

// ➤ Like/Unlike post
router.put("/like/:id", protect, toggleLikePost);

// ➤ Get saved posts
router.get("/saved/all", protect, getSavedPosts);

// ➤ Update post
router.put("/:id", protect, upload.array("images", 10), updatePost);

// ➤ Delete post
router.delete("/:id", protect, deletePost);

// ⭐ MUST ALWAYS BE LAST ⭐
router.get("/:id", protect, getPostById);

export default router;
