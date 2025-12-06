import multer from "multer";
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

// Fix dirname in ES module
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// ROOT folder of project (ASSI-Backend)
const rootDir = path.join(__dirname, "..");

// uploads/profile folder (ABSOLUTE PATH)
const uploadDir = path.join(rootDir, "uploads", "profile");

// Auto-create folder if not exists
if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir, { recursive: true });
  console.log("📁 Created folder:", uploadDir);
}

const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, uploadDir);
  },
  filename: (req, file, cb) => {
    const safeName = file.originalname.replace(/\s+/g, "_").toLowerCase();
    cb(null, `profile_${req.user._id}_${Date.now()}_${safeName}`);
  },
});

const uploadProfile = multer({
  storage,
  limits: { fileSize: 5 * 1024 * 1024 }, // 5MB
});

export default uploadProfile;
