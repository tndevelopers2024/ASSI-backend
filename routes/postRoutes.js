import express from "express";
import { protect } from "../middlewares/authMiddleware.js";
import upload from "../middlewares/upload.js";
import {
  createPost,
  deletePost,
  getAllPosts
} from "../controllers/postController.js";

const router = express.Router();

// Create a post (with images)
router.post("/", protect, upload.array("images", 10), createPost);

// Get all posts
router.get("/", protect, getAllPosts);

// Delete post
router.delete("/:id", protect, deletePost);

export default router;
