import express from "express";
import dotenv from "dotenv";
import cors from "cors";
import cookieParser from "cookie-parser";
import http from "http";
import { Server } from "socket.io";
import { WebSocketServer } from "ws";

import { connectDB } from "./src/lib/db.js";
import authRoutes from "./src/routes/auth.route.js";
import sensorDataRoutes from "./src/routes/sensorData.route.js";
import deviceRoutes from "./src/routes/device.route.js";
import averageRoutes from "./src/routes/average.route.js";
import userRoutes from "./src/routes/user.route.js";
import { authenticate } from "./src/middlewares/authenticate.js";

dotenv.config();

const app = express();
const PORT = process.env.PORT || 7000;

// HTTP server for Socket.IO and WebSocket
const server = http.createServer(app);

// Socket.IO server setup
const io = new Server(server, {
  cors: {
    origin: "*", // Allow all origins (adjust for production)
    methods: ["GET", "POST"],
  },
});

// WebSocket server setup
const wsServer = new WebSocketServer({ server, path: "/esp32" });

let esp32Socket = null;

wsServer.on("connection", (ws) => {
  console.log("ESP32 connected");
  esp32Socket = ws; // Store the WebSocket instance for ESP32

  ws.on("message", (message) => {
    console.log(`Message from ESP32: ${message}`);
  });

  ws.on("close", () => {
    console.log("ESP32 disconnected");
    esp32Socket = null; // Clear the reference when ESP32 disconnects
  });
});

export { esp32Socket };

// Real-Time Communication via Socket.IO
io.on("connection", (socket) => {
  console.log("New client connected");

  socket.on("disconnect", () => {
    console.log("Client disconnected");
  });
});

// Socket.IO instance to every request for controllers to use
app.use((req, res, next) => {
  req.io = io; // Socket.IO instance to the request object
  next();
});

server.listen(PORT, () => {
  console.log(`Server is running on port: ${PORT}`);
  connectDB();
});

app.use(cors({ origin: "*", credentials: true }));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());

app.get("/api/test", (req, res) => {
  res.send({ success: true, message: "Hello World" });
});

app.use("/api/auth", authRoutes);
app.use("/api/sensorData", sensorDataRoutes);
app.use("/api/device", authenticate, deviceRoutes);
app.use("/api/average", averageRoutes);
app.use("/api/users", userRoutes);
