import { useCallback, useEffect } from "react";
import { connectSocket, disconnectSocket, getSocket } from "../network/socketClient.js";
import { useRoomStore } from "../store/roomStore.js";

/**
 * Single seam between React and Socket.io for the room/lobby domain.
 * Mount once near the app root — scenes call the returned actions and read
 * state from useRoomStore() directly rather than holding their own copies.
 */
export function useRoomSocket() {
  const setRoom = useRoomStore((s) => s.setRoom);
  const setMySocketId = useRoomStore((s) => s.setMySocketId);
  const setError = useRoomStore((s) => s.setError);
  const patchPlayer = useRoomStore((s) => s.patchPlayer);
  const patchTaskProgress = useRoomStore((s) => s.patchTaskProgress);
  const unlockArea = useRoomStore((s) => s.unlockArea);
  const reset = useRoomStore((s) => s.reset);

  useEffect(() => {
    const socket = connectSocket();

    const onConnect = () => setMySocketId(socket.id);
    const onRoomState = (room) => setRoom(room);
    const onRoomStarted = () => {
      // room:state follows separately with started:true — nothing to do
      // here yet beyond letting scenes react to the room.started flag.
    };
    // Hot path: every other player's movement tick lands here. Patch just
    // that player instead of taking a full room:state broadcast for it.
    const onPlayerState = ({ id, ...patch }) => patchPlayer(id, patch);
    const onTaskProgress = ({ area, completed, total }) => patchTaskProgress(area, completed, total);
    const onAreaUnlocked = ({ area }) => unlockArea(area);
    const onDisconnect = () => setMySocketId(null);

    socket.on("connect", onConnect);
    socket.on("room:state", onRoomState);
    socket.on("room:started", onRoomStarted);
    socket.on("player:state", onPlayerState);
    socket.on("room:taskProgress", onTaskProgress);
    socket.on("room:areaUnlocked", onAreaUnlocked);
    socket.on("disconnect", onDisconnect);

    if (socket.connected) onConnect();

    return () => {
      socket.off("connect", onConnect);
      socket.off("room:state", onRoomState);
      socket.off("room:started", onRoomStarted);
      socket.off("player:state", onPlayerState);
      socket.off("room:taskProgress", onTaskProgress);
      socket.off("room:areaUnlocked", onAreaUnlocked);
      socket.off("disconnect", onDisconnect);
    };
  }, [setRoom, setMySocketId, patchPlayer, patchTaskProgress, unlockArea]);

  const createRoom = useCallback(
    ({ hostNickname, hostColor, maxPlayers, roomName }) =>
      new Promise((resolve, reject) => {
        getSocket().emit(
          "room:create",
          { hostNickname, hostColor, maxPlayers, roomName },
          (res) => {
            if (!res?.ok) {
              setError(res?.error || "CREATE_FAILED");
              reject(res?.error || "CREATE_FAILED");
              return;
            }
            setRoom(res.room);
            resolve(res.room);
          }
        );
      }),
    [setRoom, setError]
  );

  const joinRoom = useCallback(
    ({ roomId, nickname, color }) =>
      new Promise((resolve, reject) => {
        getSocket().emit("room:join", { roomId, nickname, color }, (res) => {
          if (!res?.ok) {
            setError(res?.error || "JOIN_FAILED");
            reject(res?.error || "JOIN_FAILED");
            return;
          }
          setRoom(res.room);
          resolve(res.room);
        });
      }),
    [setRoom, setError]
  );

  const startGame = useCallback(
    (roomId) =>
      new Promise((resolve, reject) => {
        getSocket().emit("room:start", { roomId }, (res) => {
          if (!res?.ok) {
            reject(res?.error || "START_FAILED");
            return;
          }
          resolve();
        });
      }),
    []
  );

  const leaveRoom = useCallback(() => {
    disconnectSocket();
    reset();
    // Reconnect immediately so the next create/join has a fresh socket id
    // ready to go without the player noticing a connection gap.
    connectSocket();
  }, [reset]);

  // No ack, no reject — this fires ~16x/sec while moving, a dropped packet
  // just means the next tick corrects it.
  const sendPlayerState = useCallback((patch) => {
    getSocket().emit("player:state", patch);
  }, []);

  // Reports one solved terminal. Fire-and-forget is fine here too — the
  // server dedupes by task id, so a dropped ack just means this client's
  // own optimistic UI doesn't confirm, not that the solve is lost (the
  // team-wide room:taskProgress broadcast still lands from other players'
  // solves, or a reconnect's room:state carries the true count).
  const completeTask = useCallback((roomId, area, taskId) => {
    getSocket().emit("task:complete", { roomId, area, taskId });
  }, []);

  return { createRoom, joinRoom, startGame, leaveRoom, sendPlayerState, completeTask };
}
