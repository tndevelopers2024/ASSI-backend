import express from "express";
import { protect } from "../middlewares/authMiddleware.js";
import { createComment, getComments, getCommentsByUser } from "../controllers/commentController.js";
import { uploadCommentFiles } from "../middlewares/uploadCommentFiles.js";
import { deleteCommentById } from "../controllers/commentController.js";

const router = express.Router();

// Create comment
router.post("/", protect, uploadCommentFiles, createComment);

// Get comments for a post
router.get("/:postId", protect, getComments);

// Get comments by user
router.get("/user/:userId", protect, getCommentsByUser);

// Delete comment by ID
router.delete("/:id", protect, deleteCommentById);

export default router;
