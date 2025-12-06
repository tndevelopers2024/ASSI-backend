import multer from "multer";
import fs from "fs";
import path from "path";

// Folder path
const uploadPath = path.join("uploads", "comments");

// Create folder if it doesn't exist
if (!fs.existsSync(uploadPath)) {
  fs.mkdirSync(uploadPath, { recursive: true });
}

const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, uploadPath);
  },
  filename: (req, file, cb) => {
    cb(null, Date.now() + "-" + file.originalname);
  }
});

export const uploadCommentFiles = multer({
  storage,
  limits: { files: 10 }
}).array("files", 10);
