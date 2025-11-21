import User from "../model/user.js";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";

// ===============================
// REGISTER (Only new users)
// ===============================
export const registerUser = async (req, res) => {
  try {
    const { name, email, password } = req.body;

    let user = await User.findOne({ email });
    if (user) return res.status(400).json({ message: "Email already exists" });

    // Hash password for new users
    const hashed = await bcrypt.hash(password, 10);

    user = await User.create({ name, email, password: hashed });

    res.json({ message: "User Registered Successfully", user });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// ===============================
// LOGIN (Works for seeded + new users)
// ===============================
export const loginUser = async (req, res) => {
  try {
    const { email, password } = req.body;

    const user = await User.findOne({ email });
    if (!user)
      return res.status(400).json({ message: "Invalid Email" });

    let isMatch = false;

    // CASE 1 — Password is hashed (new users)
    if (user.password.startsWith("$2a$") || user.password.startsWith("$2b$")) {
      isMatch = await bcrypt.compare(password, user.password);
    } 
    // CASE 2 — Password is plain text (seeded users)
    else {
      isMatch = password === user.password;
    }

    if (!isMatch)
      return res.status(400).json({ message: "Wrong Password" });

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
