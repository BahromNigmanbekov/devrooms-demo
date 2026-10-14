import * as AIMap from "./AIMap.js";
import { AI_TASKS_BY_ID } from "../../../shared/aiActivities.mjs";
import * as OfficeMap from "./OfficeMap.js";
import * as ParkMap from "./ParkMap.js";
import { getTaskForId } from "../data/CodeTasks.js";
import { getParkTaskForId } from "../data/ParkTasks.js";

// The order rooms unlock in — mirrors backend/src/rooms/roomManager.js's
// AREA_SEQUENCE. Adding a third area is adding one entry here plus its own
// map module; nothing else in Game.js needs to know area keys by name.
export const AREA_SEQUENCE = ["ai", "office", "park"];

export const AREAS = {
  ai: {
    key: "ai", label: "ChatGPT AI Lab", theme: "ai",
    WORLD_WIDTH: AIMap.WORLD_WIDTH, WORLD_HEIGHT: AIMap.WORLD_HEIGHT,
    COLORS: AIMap.COLORS, buildWalls: AIMap.buildWalls,
    buildFurniture: AIMap.buildFurniture, buildDoorFrames: AIMap.buildDoorFrames,
    spawn: AIMap.SPAWN, getTask: id => AI_TASKS_BY_ID[id],
    interiorDoors: AIMap.INTERIOR_DOORS,
    exitGate: AIMap.EXIT_GATE, exitTrigger: AIMap.EXIT_GATE_TRIGGER,
    darkness: 0.12, flashlightCapable: false
  },
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
    interiorDoors:Object.entries(OfficeMap.ROOMS).map(([id,r])=>({id,x:r.door.side==='right'?r.x+r.w-24:r.x,y:r.y+r.door.at,w:24,h:120,roomBounds:r})),
    returnGate:OfficeMap.RETURN_GATE,returnTrigger:OfficeMap.RETURN_GATE_TRIGGER,
    getTask: getTaskForId,
    exitGate: OfficeMap.EXIT_GATE, // targetArea: "park"
    exitTrigger: OfficeMap.EXIT_GATE_TRIGGER,
    darkness: 0.45,
    flashlightCapable: false,
  },
  park: {
    key: "park",
    label: "Arcade", // Retro Pixel Arcade
    theme: "park",
    WORLD_WIDTH: ParkMap.WORLD_WIDTH,
    WORLD_HEIGHT: ParkMap.WORLD_HEIGHT,
    COLORS: ParkMap.COLORS,
    buildWalls: ParkMap.buildWalls,
    buildFurniture: ParkMap.buildFurniture,
    buildDoorFrames: ParkMap.buildDoorFrames,
    spawn: ParkMap.SPAWN,
    interiorDoors:ParkMap.INTERIOR_DOORS,
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
    darkness: 0.12,
    flashlightCapable: false,
  },
};

export function nextAreaKey(areaKey) {
  const idx = AREA_SEQUENCE.indexOf(areaKey);
  return AREA_SEQUENCE[idx + 1] || null;
}
