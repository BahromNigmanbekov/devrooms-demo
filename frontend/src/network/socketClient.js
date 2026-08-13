import { io } from "socket.io-client";
import { SERVER_URL } from "../config/constants.js";

/**
 * Lazily-created singleton Socket.io connection. Not imported anywhere yet
 * in Stage 1 — this is the seam Stage 2 (room create/join) and Stage 3
 * (in-room player sync) connect through, so all socket wiring lives in one
 * place instead of scattered `io()` calls across components.
 */
let socket = null;

export function getSocket() {
  if (!socket) {
    socket = io(SERVER_URL, {
      autoConnect: false,
      transports: ["websocket"],
    });
  }
  return socket;
}

export function connectSocket() {
  const s = getSocket();
  if (!s.connected) s.connect();
  return s;
}

export function disconnectSocket() {
  if (socket && socket.connected) socket.disconnect();
}
