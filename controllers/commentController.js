import Comment from "../model/comment.js";
import Post from "../model/post.js";
import Notification from "../model/notification.js";

export const createComment = async (req, res) => {
  try {
    const { postId, content, parentCommentId } = req.body;

    if (!postId || !content) {
      return res.status(400).json({ message: "postId and content required" });
    }

    const post = await Post.findById(postId).populate("user", "fullname email profile_url user_id");

    if (!post) return res.status(404).json({ message: "Post not found" });

    // If this is a reply to a comment, validate the parent comment
    let parentComment = null;
    if (parentCommentId) {
      parentComment = await Comment.findById(parentCommentId).populate("user", "fullname");

      if (!parentComment) {
        return res.status(404).json({ message: "Parent comment not found" });
      }

      // Ensure parent comment belongs to the same post
      if (parentComment.post.toString() !== postId) {
        return res.status(400).json({ message: "Parent comment does not belong to this post" });
      }
    }

    const comment = await Comment.create({
      post: postId,
      user: req.user._id,
      content,
      files: req.files?.map((file) => file.path.replace(/\\/g, "/").replace(/^.*uploads[\\/]/, "uploads/")) || [],
      parentComment: parentCommentId || null,
      mentionedUser: parentComment ? parentComment.user._id : null
    });

    // Create notifications
    if (parentComment) {
      // If replying to a comment, notify the parent comment author (not self)
      if (parentComment.user._id.toString() !== req.user._id.toString()) {
        await Notification.create({
          user: parentComment.user._id,
          fromUser: req.user._id,
          type: "comment",
          post: post._id,
          comment: comment._id,  // ⭐ ADD THIS
          message: `${req.user.fullname} replied to your comment`,
        });
      }
    } else {
      // If commenting on a post, notify the post owner (not self)
      if (post.user._id.toString() !== req.user._id.toString()) {
        await Notification.create({
          user: post.user._id,
          fromUser: req.user._id,
          type: "comment",
          post: post._id,
          comment: comment._id,  // ⭐ ADD THIS
          message: `${req.user.fullname} commented on your post`,
        });
      }
    }

    res.json({ message: "Comment added", comment });
  } catch (error) {
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
        populate: { path: "user", select: "fullname email" }
      })
      .sort({ createdAt: -1 });

    res.json(comments);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

export const getCommentsByUser = async (req, res) => {
  try {
    const { userId } = req.params;
    const comments = await Comment.find({ user: userId })
      .populate("post", "content images") // Populate post details so we know what they commented on
      .populate("user", "fullname email profile_url")
      .sort({ createdAt: -1 });

    res.json(comments);
  } catch (error) {
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

    // Allow only owner or admin
    if (comment.user.toString() !== req.user._id.toString()) {
      return res.status(403).json({ message: "Unauthorized" });
    }

    // Delete the comment and its replies
    await Comment.deleteMany({
      $or: [
        { _id: id },
        { parentComment: id }
      ]
    });

    res.json({ message: "Comment deleted" });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};
