import express from "express";
import { protect } from "../middlewares/authMiddleware.js";
import { createComment, getComments } from "../controllers/commentController.js";

const router = express.Router();

// Create comment
router.post("/", protect, createComment);

// Get comments for a post
router.get("/:postId", protect, getComments);

export default router;
