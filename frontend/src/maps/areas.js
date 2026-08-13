import * as OfficeMap from "./OfficeMap.js";
import * as ParkMap from "./ParkMap.js";
import { getTaskForId } from "../data/CodeTasks.js";
import { getParkTaskForId } from "../data/ParkTasks.js";

// The order rooms unlock in — mirrors backend/src/rooms/roomManager.js's
// AREA_SEQUENCE. Adding a third area is adding one entry here plus its own
// map module; nothing else in Game.js needs to know area keys by name.
export const AREA_SEQUENCE = ["office", "park"];

export const AREAS = {
  office: {
    key: "office",
    label: "Ofis",
    theme: "office",
    WORLD_WIDTH: OfficeMap.WORLD_WIDTH,
    WORLD_HEIGHT: OfficeMap.WORLD_HEIGHT,
    COLORS: OfficeMap.COLORS,
    buildWalls: OfficeMap.buildWalls,
    buildFurniture: OfficeMap.buildFurniture,
    buildDoorFrames: OfficeMap.buildDoorFrames,
    spawn: OfficeMap.SPAWN,
    getTask: getTaskForId,
    exitGate: OfficeMap.EXIT_GATE, // targetArea: "park"
    exitTrigger: OfficeMap.EXIT_GATE_TRIGGER,
    darkness: 0.45,
    flashlightCapable: false,
  },
  park: {
    key: "park",
    label: "Pixel O'yin Markazi", // Retro Pixel Arcade
    theme: "park",
    WORLD_WIDTH: ParkMap.WORLD_WIDTH,
    WORLD_HEIGHT: ParkMap.WORLD_HEIGHT,
    COLORS: ParkMap.COLORS,
    buildWalls: ParkMap.buildWalls,
    buildFurniture: ParkMap.buildFurniture,
    buildDoorFrames: ParkMap.buildDoorFrames,
    spawn: ParkMap.SPAWN,
    getTask: getParkTaskForId,
    // Always-locked gate to a third area that doesn't exist yet — present so
    // the world reads as "continues somewhere" without needing a real room3.
    exitGate: ParkMap.NEXT_AREA_GATE,
    exitTrigger: null,
    // Always-open gate straight back to the office — no progress gating,
    // going backward is never locked.
    returnGate: ParkMap.RETURN_GATE,
    returnTrigger: ParkMap.RETURN_GATE_TRIGGER,
    // Flashlight system fully removed for this area per the retro-arcade
    // redesign — it's a normal (if colorful) lit room now, not a dark one.
    // A low, moody-but-fully-visible ambient darkness value gives it a
    // bit of arcade atmosphere without ever hiding anything.
    darkness: 0.18,
    flashlightCapable: false,
  },
};

export function nextAreaKey(areaKey) {
  const idx = AREA_SEQUENCE.indexOf(areaKey);
  return AREA_SEQUENCE[idx + 1] || null;
}
