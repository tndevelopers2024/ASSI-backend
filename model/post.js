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
      type: [String],
      validate: {
        validator: function (arr) {
          // Must have at least 1 category
          if (!arr || arr.length === 0) return false;

          // All values must be from the enum
          const validCategories = [
            "Diagnostic Dilemma",
            "Cranioverterbal",
            "Cervical",
            "Thoracic",
            "Lumbar",
            "Sacral",
            "Degenerative",
            "Trauma",
            "Tumours",
            "Metastasis",
            "Infections",
            "Tuberculosis",
            "Adult deformity",
            "Pediatric Deformity",
            "Osteoporosis",
            "Inflammatory",
            "Metabolic",
            "Complications",
            "Minimally invasive surgery",
            "Other",
          ];
          return arr.every(cat => validCategories.includes(cat));
        },
        message: "Please select at least 1 valid category"
      },
      required: true,
    },

    likes: [{ type: mongoose.Schema.Types.ObjectId, ref: "User" }],
  },
  { timestamps: true }
);

export default mongoose.model("Post", postSchema);
