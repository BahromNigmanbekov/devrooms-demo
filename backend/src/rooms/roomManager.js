import { customAlphabet } from "nanoid";

// Room codes: short, unambiguous (no 0/O/1/I), easy to read aloud/type.
const generateRoomId = customAlphabet("ABCDEFGHJKMNPQRSTUVWXYZ23456789", 5);

// The order rooms unlock in. Adding a third area later is just adding its
// key here — completeTask() unlocks "the next one in the list" generically,
// nothing hardcodes "park" as the last stop.
const AREA_SEQUENCE = ["office", "park"];
const TASKS_TO_UNLOCK_NEXT = 12;

/**
 * All state here is in-memory and process-local — fine for a single
 * backend instance. If this ever needs to run behind multiple server
 * processes, swap the Map for a Redis-backed store keyed the same way.
 */
const rooms = new Map(); // roomId -> Room
const socketToRoom = new Map(); // socketId -> roomId

function createRoom({ hostSocketId, hostNickname, hostColor, maxPlayers, roomName }) {
  let roomId = generateRoomId();
  while (rooms.has(roomId)) roomId = generateRoomId();

  const room = {
    id: roomId,
    name: roomName?.trim() || `Room ${roomId}`,
    hostId: hostSocketId,
    maxPlayers: clampMaxPlayers(maxPlayers),
    started: false,
    createdAt: Date.now(),
    players: new Map(),
    // area -> Set of unique task ids the team has solved in that area.
    areaProgress: Object.fromEntries(AREA_SEQUENCE.map((a) => [a, new Set()])),
    unlockedAreas: new Set([AREA_SEQUENCE[0]]),
  };

  room.players.set(hostSocketId, makePlayer(hostSocketId, hostNickname, hostColor, true));
  rooms.set(roomId, room);
  socketToRoom.set(hostSocketId, roomId);

  return room;
}

function joinRoom(roomId, { socketId, nickname, color }) {
  const room = rooms.get(roomId);
  if (!room) return { error: "ROOM_NOT_FOUND" };
  if (room.started) return { error: "ROOM_ALREADY_STARTED" };
  if (room.players.size >= room.maxPlayers) return { error: "ROOM_FULL" };

  room.players.set(socketId, makePlayer(socketId, nickname, color, false));
  socketToRoom.set(socketId, roomId);
  return { room };
}

function leaveRoom(socketId) {
  const roomId = socketToRoom.get(socketId);
  if (!roomId) return null;
  const room = rooms.get(roomId);
  socketToRoom.delete(socketId);
  if (!room) return null;

  room.players.delete(socketId);

  if (room.players.size === 0) {
    rooms.delete(roomId);
    return { roomId, room: null };
  }

  // Host left — promote the longest-connected remaining player.
  if (room.hostId === socketId) {
    const next = room.players.values().next().value;
    if (next) {
      next.isHost = true;
      room.hostId = next.id;
    }
  }

  return { roomId, room };
}

function startRoom(roomId, requesterId) {
  const room = rooms.get(roomId);
  if (!room) return { error: "ROOM_NOT_FOUND" };
  if (room.hostId !== requesterId) return { error: "NOT_HOST" };
  room.started = true;
  room.startedAt = Date.now();
  return { room };
}

function updatePlayerState(socketId, patch) {
  const roomId = socketToRoom.get(socketId);
  if (!roomId) return null;
  const room = rooms.get(roomId);
  if (!room) return null;
  const player = room.players.get(socketId);
  if (!player) return null;

  Object.assign(player, patch);
  return room;
}

/**
 * Records one player's solved task against the team's shared counter for
 * that area. Idempotent per task id — running the same terminal's task
 * twice (or two players solving the same one) only counts once, so the
 * count always means "distinct terminals solved," matching what the team
 * can see walking around the room.
 *
 * Returns null if the room/area don't exist or the area isn't unlocked
 * yet (defends against a stale client still holding a `park` task id
 * after being bounced back to `office`, or similar). Otherwise returns
 * `{ completed, total, justUnlocked, nextArea }` — `nextArea` is set only
 * on the exact call that crosses the threshold, so the caller can tell
 * "this broadcast is the one that opens the door" from "still counting."
 */
function completeTask(roomId, area, taskId) {
  const room = rooms.get(roomId);
  if (!room || !room.areaProgress[area]) return null;
  if (!room.unlockedAreas.has(area)) return null;

  const progress = room.areaProgress[area];
  const before = progress.size;
  progress.add(taskId);
  const completed = progress.size;
  const total = TASKS_TO_UNLOCK_NEXT;

  let justUnlocked = false;
  let nextArea = null;
  if (before < total && completed >= total) {
    const idx = AREA_SEQUENCE.indexOf(area);
    const candidate = AREA_SEQUENCE[idx + 1];
    if (candidate && !room.unlockedAreas.has(candidate)) {
      room.unlockedAreas.add(candidate);
      justUnlocked = true;
      nextArea = candidate;
    }
  }

  return { completed, total, justUnlocked, nextArea };
}

function getRoom(roomId) {
  return rooms.get(roomId) || null;
}

function getRoomForSocket(socketId) {
  const roomId = socketToRoom.get(socketId);
  return roomId ? rooms.get(roomId) : null;
}

/** Serializes a Room (with its players Map and per-area Sets) into a plain JSON-safe object. */
function serializeRoom(room) {
  return {
    id: room.id,
    name: room.name,
    hostId: room.hostId,
    maxPlayers: room.maxPlayers,
    started: room.started,
    players: Array.from(room.players.values()),
    unlockedAreas: Array.from(room.unlockedAreas),
    taskProgress: Object.fromEntries(
      Object.entries(room.areaProgress).map(([area, set]) => [
        area,
        { completed: set.size, total: TASKS_TO_UNLOCK_NEXT },
      ])
    ),
  };
}

// Keep in sync with frontend/src/engine/lobby/LobbyEngine.js LOBBY_WORLD.
const LOBBY_WORLD = { width: 900, height: 560, padding: 100 };

function makePlayer(id, nickname, color, isHost) {
  return {
    id,
    nickname: (nickname || "Player").slice(0, 16),
    color: color || "#4f8cff",
    isHost,
    ...randomSpawnPoint(),
    facing: { x: 0, y: 1 },
    moving: false,
    connectedAt: Date.now(),
  };
}

function randomSpawnPoint() {
  const { width, height, padding } = LOBBY_WORLD;
  return {
    x: padding + Math.random() * (width - padding * 2),
    y: padding + Math.random() * (height - padding * 2),
  };
}

function clampMaxPlayers(n) {
  const parsed = Number.parseInt(n, 10);
  if (Number.isNaN(parsed)) return 8;
  return Math.max(2, Math.min(16, parsed));
}

export const roomManager = {
  createRoom,
  joinRoom,
  leaveRoom,
  startRoom,
  updatePlayerState,
  completeTask,
  getRoom,
  getRoomForSocket,
  serializeRoom,
};
