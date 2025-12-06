import mongoose from "mongoose";

const postSchema = new mongoose.Schema(
  {
    user: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },

    title: { type: String, required: true },
    content: { type: String, required: true },

    images: {
      type: [String], // URLs of uploaded images
      validate: {
        validator: (arr) => arr.length <= 10,
        message: "You can upload up to 10 images only",
      },
      default: [],
    },

    category: {
      type: String,
      enum: [
        "General",
        "Education",
        "Coding",
        "Design",
        "News",
        "Technology",
        "Entertainment",
        "Other",
      ],
      required: true,
    },
  },
  { timestamps: true }
);

export default mongoose.model("Post", postSchema);
