import Post from "../model/post.js";

export const createPost = async (req, res) => {
  try {
    // Multer uploads → req.files
    const imageUrls = req.files?.map((file) => file.path) || [];

    const post = await Post.create({
      user: req.user._id,
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
      .populate("user", "fullname email")
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
