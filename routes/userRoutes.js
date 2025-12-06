import express from "express";
import { loginUser, updateProfileImage, getUserById } from "../controllers/userController.js";
import { protect } from "../middlewares/authMiddleware.js";
import uploadProfile from "../middlewares/profileUpload.js";

const router = express.Router();

// LOGIN ONLY
router.post("/login", loginUser);

// GET MY PROFILE (protected)
router.get("/profile", protect, (req, res) => {
  res.json({ user: req.user });
});

// UPDATE PROFILE IMAGE
router.put(
  "/update-profile-image",
  protect,
  uploadProfile.single("profile"),
  updateProfileImage
);




// GET USER BY ID
router.get("/:id", protect, getUserById);

export default router;
