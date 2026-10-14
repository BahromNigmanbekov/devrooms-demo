import { create } from "zustand";

export const useRoomStore = create((set) => ({
  room: null, // { id, name, hostId, maxPlayers, started, players[] }
  mySocketId: null,
  status: "idle", // idle | connecting | in-room | error
  error: null,

  patchDoors: (doors) => set(s=>s.room?{room:{...s.room,doors}}:s),
  setRoom: (room) => set({ room, status: room ? "in-room" : "idle" }),
  setMySocketId: (mySocketId) => set({ mySocketId }),
  setStatus: (status) => set({ status }),
  setError: (error) => set({ error, status: error ? "error" : "idle" }),
  reset: () => set({ room: null, status: "idle", error: null }),

  // Cheap per-player patch for the high-frequency movement broadcast —
  // avoids replacing the whole room object (and re-rendering the player
  // list) on every position update.
  patchPlayer: (id, patch) =>
    set((s) => {
      if (!s.room) return s;
      let changed = false;
      const players = s.room.players.map((p) => {
        if (p.id !== id) return p;
        changed = true;
        return { ...p, ...patch };
      });
      if (!changed) return s;
      return { room: { ...s.room, players } };
    }),

  // room:taskProgress lands as its own event (not a full room:state), so
  // it's patched in the same lightweight way as player position.
  patchTaskProgress: (area, completed, total, solvedTaskIds) =>
    set((s) => {
      if (!s.room) return s;
      return {
        room: {
          ...s.room,
          taskProgress: { ...s.room.taskProgress, [area]: { completed, total } },
          solvedTasks: { ...s.room.solvedTasks, [area]: solvedTaskIds || s.room.solvedTasks?.[area] || [] },
        },
      };
    }),

  unlockArea: (area) =>
    set((s) => {
      if (!s.room || s.room.unlockedAreas?.includes(area)) return s;
      return { room: { ...s.room, unlockedAreas: [...(s.room.unlockedAreas || []), area] } };
    }),
}));

export function isHost(room, socketId) {
  return !!room && !!socketId && room.hostId === socketId;
}
