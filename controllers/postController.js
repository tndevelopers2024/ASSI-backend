import Post from "../model/post.js";
import User from "../model/user.js";

export const createPost = async (req, res) => {
  try {
    const imageUrls =
      req.files?.map((file) =>
        file.path
          .replace(/\\/g, "/")
          .replace(/^.*uploads[\\/]/, "uploads/")
      ) || [];

    if (!req.body.title) {
      return res.status(400).json({ message: "Title is required" });
    }

    const post = await Post.create({
      user: req.user._id,
      title: req.body.title,
      content: req.body.content,
      category: req.body.category,
      images: imageUrls,
    });

    res.json({ message: "Post created", post });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};




export const getAllPosts = async (req, res) => {
  try {
    const posts = await Post.find()
      .populate("user", "fullname email profile_url user_id")   // ← FIXED
      .sort({ createdAt: -1 });

    res.json(posts);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};




export const deletePost = async (req, res) => {
  try {
    const post = await Post.findById(req.params.id);

    if (!post) return res.status(404).json({ message: "Post not found" });

    // If superadmin → delete any post
    if (req.user.role === "superadmin") {
      await post.deleteOne();
      return res.json({ message: "Post deleted by superadmin" });
    }

    // Normal user → delete only own post
    if (post.user.toString() !== req.user._id.toString()) {
      return res.status(403).json({ message: "Not allowed" });
    }

    await post.deleteOne();
    res.json({ message: "Post deleted" });

  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

export const getPostsByUser = async (req, res) => {
  try {
    const { userId } = req.params;
    const posts = await Post.find({ user: userId })
      .populate("user", "fullname email profile_url user_id")
      .sort({ createdAt: -1 });

    res.json(posts);
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

    // Update fields
    post.title = req.body.title || post.title;
    post.content = req.body.content || post.content;
    post.category = req.body.category || post.category;

    // Handle image updates
    if (req.files && req.files.length > 0) {
      const imageUrls = req.files.map((file) =>
        file.path
          .replace(/\\/g, "/")
          .replace(/^.*uploads[\\/]/, "uploads/")
      );
      post.images = imageUrls;
    }

    const updatedPost = await post.save();
    res.json({ message: "Post updated", post: updatedPost });
  } catch (error) {
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

    res.json(user.savedPosts);
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

    res.json(post);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: error.message });
  }
};

