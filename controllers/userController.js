import User from "../model/user.js";
import bcrypt from "bcryptjs";
import crypto from "crypto";
import jwt from "jsonwebtoken";
import sendEmail from "../utils/sendEmail.js";

// ===============================
// LOGIN (Works for existing seeded users + new hashed users)
// ===============================
export const loginUser = async (req, res) => {
  try {
    const { email, password } = req.body;

    const user = await User.findOne({
      $or: [{ email: email }, { user_id: email }],
    });
    if (!user) {
      return res.status(400).json({ message: "Invalid Email or User ID" });
    }

    let isMatch = false;

    // Hashed password (new users)
    if (user.password.startsWith("$2a$") || user.password.startsWith("$2b$")) {
      isMatch = await bcrypt.compare(password, user.password);
    }
    // Plain password (old data from seed)
    else {
      isMatch = password === user.password;
    }

    if (!isMatch) {
      return res.status(400).json({ message: "Wrong Password" });
    }

    const token = jwt.sign({ id: user._id }, process.env.JWT_SECRET, {
      expiresIn: "7d",
    });

    res.json({
      message: "Login Success",
      token,
      user,
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// ===============================
// UPDATE PROFILE IMAGE
// ===============================
export const updateProfileImage = async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ message: "No image uploaded" });
    }

    const imagePath = req.file.path.replace(/\\/g, "/").replace(/^.*uploads/, "uploads"); // Fix Windows slashes

    const updatedUser = await User.findByIdAndUpdate(
      req.user._id,
      { profile_url: imagePath },
      { new: true }
    ).select("-password");

    res.json({
      message: "Profile picture updated",
      user: updatedUser,
    });
  } catch (error) {
    console.error("UPLOAD ERROR:", error);
    res.status(500).json({ message: error.message });
  }
};


// ===============================
// GET USER BY ID
// ===============================
export const getUserById = async (req, res) => {
  try {
    const user = await User.findById(req.params.id).select("-password");
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }
    res.json(user);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// ===============================
// FORGOT PASSWORD (OTP)
// ===============================
export const forgotPassword = async (req, res) => {
  try {
    const user = await User.findOne({ email: req.body.email });

    if (!user) {
      return res.status(404).json({ message: "User not found with this email" });
    }

    // Generate 6-digit OTP
    const resetToken = Math.floor(100000 + Math.random() * 900000).toString();

    // Hash and set to resetPasswordToken field
    user.resetPasswordToken = crypto
      .createHash("sha256")
      .update(resetToken)
      .digest("hex");

    // Set expire (10 minutes)
    user.resetPasswordExpire = Date.now() + 10 * 60 * 1000;

    await user.save();

    const message = `
      <h1>Password Reset OTP</h1>
      <p>Your OTP (One Time Password) for password reset is:</p>
      <h2 style="color: #4F46E5; letter-spacing: 5px;">${resetToken}</h2>
      <p>This code expires in 10 minutes.</p>
    `;

    try {
      await sendEmail({
        email: user.email,
        subject: "Password Reset OTP",
        html: message,
      });

      res.status(200).json({ success: true, data: "OTP sent to email" });
    } catch (error) {
      console.error(error);
      user.resetPasswordToken = undefined;
      user.resetPasswordExpire = undefined;
      await user.save();

      return res.status(500).json({ message: "Email could not be sent" });
    }
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// ===============================
// RESET PASSWORD (Verify OTP)
// ===============================
export const resetPassword = async (req, res) => {
  try {
    const { email, otp, password } = req.body;

    // Get hashed token
    const resetPasswordToken = crypto
      .createHash("sha256")
      .update(otp)
      .digest("hex");

    const user = await User.findOne({
      email,
      resetPasswordToken,
      resetPasswordExpire: { $gt: Date.now() },
    });

    if (!user) {
      return res.status(400).json({ message: "Invalid OTP or Email" });
    }

    // Set new password
    const salt = await bcrypt.genSalt(10);
    user.password = await bcrypt.hash(password, salt);

    user.resetPasswordToken = undefined;
    user.resetPasswordExpire = undefined;

    await user.save();

    res.status(200).json({ success: true, data: "Password Updated Success" });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};
