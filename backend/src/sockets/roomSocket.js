import { roomManager } from "../rooms/roomManager.js";

/**
 * Registers all room/player socket events on a fresh connection.
 * Event names are namespaced by domain (room:*, player:*) so Stage 3's
 * task-sync and timer events can be added the same way without collisions.
 */
export function registerRoomSocket(io, socket) {
  socket.on("room:create", ({ hostNickname, hostColor, maxPlayers, roomName } = {}, ack) => {
    const room = roomManager.createRoom({
      hostSocketId: socket.id,
      hostNickname,
      hostColor,
      maxPlayers,
      roomName,
    });
    socket.join(room.id);
    ack?.({ ok: true, room: roomManager.serializeRoom(room) });
  });

  socket.on("room:join", ({ roomId, nickname, color } = {}, ack) => {
    const result = roomManager.joinRoom(String(roomId || "").toUpperCase(), {
      socketId: socket.id,
      nickname,
      color,
    });
    if (result.error) {
      ack?.({ ok: false, error: result.error });
      return;
    }
    socket.join(result.room.id);
    ack?.({ ok: true, room: roomManager.serializeRoom(result.room) });
    socket.to(result.room.id).emit("room:state", roomManager.serializeRoom(result.room));
  });

  socket.on("room:start", ({ roomId } = {}, ack) => {
    const result = roomManager.startRoom(roomId, socket.id);
    if (result.error) {
      ack?.({ ok: false, error: result.error });
      return;
    }
    io.to(roomId).emit("room:started");
    io.to(roomId).emit("room:state", roomManager.serializeRoom(result.room));
    ack?.({ ok: true });
  });

  // Fired continuously while a player moves in the lobby or office.
  // Broadcast-only (no ack) — this is a hot path, keep it cheap.
  socket.on("player:state", (patch) => {
    const room = roomManager.updatePlayerState(socket.id, patch);
    if (!room) return;
    socket.to(room.id).emit("player:state", { id: socket.id, ...patch });
  });

  // A player solved the puzzle at one terminal. The count is team-wide and
  // deduplicated per terminal id server-side, so it's safe for the client
  // to just say "I solved this one" without tracking who solved what.
  socket.on("task:complete", ({ roomId, area, taskId } = {}, ack) => {
    const result = roomManager.completeTask(roomId, area, taskId);
    if (!result) {
      ack?.({ ok: false });
      return;
    }
    io.to(roomId).emit("room:taskProgress", { area, completed: result.completed, total: result.total });
    if (result.justUnlocked) {
      io.to(roomId).emit("room:areaUnlocked", { area: result.nextArea });
    }
    ack?.({ ok: true });
  });

  socket.on("disconnect", () => {
    const result = roomManager.leaveRoom(socket.id);
    if (!result) return;
    if (result.room) {
      io.to(result.roomId).emit("room:state", roomManager.serializeRoom(result.room));
    }
  });
}
