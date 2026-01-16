import multer from "multer";

const storage = multer.memoryStorage();

export const uploadCommentFiles = multer({
  storage,
  limits: { files: 10 }
}).array("files", 10);

