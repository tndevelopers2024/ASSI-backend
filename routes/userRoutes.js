import express from "express";
import { registerUser, loginUser } from "../controllers/userController.js";
import { protect } from "../middlewares/authMiddleware.js";

const router = express.Router();

router.post("/register", registerUser);
router.post("/login", loginUser);

// Example protected route
router.get("/profile", protect, (req, res) => {
  res.json({ user: req.user });
});

export default router;
