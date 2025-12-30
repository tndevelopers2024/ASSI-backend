// server.js
import express from "express";
import dotenv from "dotenv";
dotenv.config();
import cors from "cors";
import morgan from "morgan";
import connectDB from "./config/db.js";

// Routes
import userRoutes from "./routes/userRoutes.js";
import postRoutes from "./routes/postRoutes.js";
import commentRoutes from "./routes/commentRoutes.js";
import notificationRoutes from "./routes/notificationRoutes.js";

import { createServer } from "http";
import { Server } from "socket.io";

connectDB();

const app = express();

// Middlewares
app.use(cors());
app.use(express.json());
app.use(morgan("dev"));

// Static uploads folder
app.use("/uploads", express.static("uploads"));

// Root test route
app.get("/", (req, res) => {
  res.send("API Running...");
});

// API v1 routes
app.use("/api/v1/users", userRoutes);
app.use("/api/v1/posts", postRoutes);
app.use("/api/v1/comments", commentRoutes);
app.use("/api/v1/notifications", notificationRoutes);

// HTTP + Socket Server
const httpServer = createServer(app);

export const io = new Server(httpServer, {
  cors: {
    origin: [
      process.env.CLIENT_URL || "http://localhost:3000",
      "http://localhost:5173"
    ],
    methods: ["GET", "POST", "PUT"],
  },
});

// SOCKET.IO LISTENERS
io.on("connection", (socket) => {
  console.log("🔥 User connected:", socket.id);

  // If the client passed userId as query param, join a room for that user
  const userId = socket.handshake.query?.userId;
  if (userId) {
    socket.join(userId.toString());
    console.log(`Socket ${socket.id} joined room ${userId}`);
  }

  socket.on("disconnect", () => {
    console.log("❌ User disconnected:", socket.id);
  });
});

// Start server
const PORT = process.env.PORT || 5000;
httpServer.listen(PORT, () => console.log(`🚀 Server running on port ${PORT}`));
