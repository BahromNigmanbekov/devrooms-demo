import express from "express";
import http from "http";
import cors from "cors";
import { Server } from "socket.io";
import { PORT, CLIENT_ORIGIN } from "./config/env.js";
import { registerRoomSocket } from "./sockets/roomSocket.js";

const app = express();
app.use(cors({ origin: CLIENT_ORIGIN }));
app.use(express.json());

app.get("/health", (_req, res) => {
  res.json({ ok: true, service: "office-game-backend" });
});

const httpServer = http.createServer(app);
const io = new Server(httpServer, {
  cors: { origin: CLIENT_ORIGIN, methods: ["GET", "POST"] },
});

io.on("connection", (socket) => {
  registerRoomSocket(io, socket);
});

httpServer.listen(PORT, () => {
  console.log(`office-game backend listening on :${PORT}`);
});

import { roomManager } from "./rooms/roomManager.js";
setInterval(()=>{for(const update of roomManager.tickDoors())io.to(update.roomId).emit("room:doors",update.doors);},150).unref();
