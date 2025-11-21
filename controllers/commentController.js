import Comment from "../model/comment.js";
import Post from "../model/post.js";
import Notification from "../model/notification.js";

export const createComment = async (req, res) => {
  try {
    const { postId, content } = req.body;

    if (!postId || !content) {
      return res.status(400).json({ message: "postId and content required" });
    }

    const post = await Post.findById(postId).populate("user", "fullname");

    if (!post) return res.status(404).json({ message: "Post not found" });

    const comment = await Comment.create({
      post: postId,
      user: req.user._id,
      content
    });

    // Create a notification for post owner (but not for self comments)
    if (post.user._id.toString() !== req.user._id.toString()) {
      await Notification.create({
        user: post.user._id,
        fromUser: req.user._id,
        type: "comment",
        post: post._id,
        message: `${req.user.fullname} commented on your post`,
      });
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
      .populate("user", "fullname email")
      .sort({ createdAt: -1 });

    res.json(comments);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};
