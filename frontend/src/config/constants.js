export const SERVER_URL = import.meta.env.VITE_SERVER_URL || "http://localhost:4000";

export const CANVAS_ELEMENT_ID = "game-canvas";

// Room config bounds — used by the Create Room screen in Stage 2 and
// validated again server-side in backend/src/rooms/roomManager.js.
export const MIN_ROOM_PLAYERS = 2;
export const MAX_ROOM_PLAYERS = 12;

// Match timer, in seconds. Stage 3 wires this to the top-center HUD timer.
export const MATCH_DURATION_SECONDS = 10 * 60;
export const TIMER_WARNING_AT_SECONDS = 5 * 60;
