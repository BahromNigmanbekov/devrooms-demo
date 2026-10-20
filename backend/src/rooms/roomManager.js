import {validateHTMLAnswer} from "../../../shared/htmlActivities.mjs";
import {sanitizeEquipment} from "../../../shared/equipment.mjs";
import {createTrainingTargets,useWeapon} from './weaponSystem.js';
import {startTag,stopTag,tickTag} from './tagSystem.js';
import { validateArcadeAnswer } from "../../../shared/arcadeActivities.mjs";
import { runTask } from "../../../frontend/src/engine/systems/CodeChecker.js";
import { areaDoors, doorAllowed, doorDistance, doorObstacle } from "../../../frontend/src/engine/systems/DoorSystem.js";
import { AI_TASKS_BY_ID, validateAIAnswer } from "../../../shared/aiActivities.mjs";
import { AREAS } from "../../../frontend/src/maps/areas.js";
import { buildSeats, findStandingPosition } from "../../../frontend/src/engine/systems/SeatSystem.js";
import { CollisionSystem } from "../../../frontend/src/engine/systems/CollisionSystem.js";
import { hasLineOfSight } from "../../../frontend/src/engine/systems/InteractionSystem.js";
import { TASKS_BY_ID } from "../../../frontend/src/data/CodeTasks.js";
import { PARK_TASKS_BY_ID } from "../../../frontend/src/data/ParkTasks.js";
import { customAlphabet } from "nanoid";

// Room codes: short, unambiguous (no 0/O/1/I), easy to read aloud/type.
const generateRoomId = customAlphabet("ABCDEFGHJKMNPQRSTUVWXYZ23456789", 5);

// The order rooms unlock in. Adding a third area later is just adding its
// key here — completeTask() unlocks "the next one in the list" generically,
// nothing hardcodes "park" as the last stop.
const AREA_SEQUENCE = ["ai", "office", "park"];
const TASKS_BY_AREA = { ai: AI_TASKS_BY_ID, office: TASKS_BY_ID, park: PARK_TASKS_BY_ID };
const taskTotal = area => Object.keys(TASKS_BY_AREA[area]).length;

/**
 * All state here is in-memory and process-local — fine for a single
 * backend instance. If this ever needs to run behind multiple server
 * processes, swap the Map for a Redis-backed store keyed the same way.
 */
const rooms = new Map(); // roomId -> Room
const socketToRoom = new Map(); // socketId -> roomId

function createRoom({ hostSocketId, hostNickname, hostColor, maxPlayers, roomName, equipment }) {
  let roomId = generateRoomId();
  while (rooms.has(roomId)) roomId = generateRoomId();

  const room = {
    id: roomId,
    name: roomName?.trim() || `Room ${roomId}`,
    hostId: hostSocketId,
    maxPlayers: clampMaxPlayers(maxPlayers),
    started: false,
    createdAt: Date.now(),
    players: new Map(), doors:{}, attempts:new Map(), trainingTargets:createTrainingTargets(),
    // area -> Set of unique task ids the team has solved in that area.
    areaProgress: Object.fromEntries(AREA_SEQUENCE.map((a) => [a, new Set()])),
    unlockedAreas: new Set([AREA_SEQUENCE[0]]),
  };

  room.players.set(hostSocketId, makePlayer(hostSocketId, hostNickname, hostColor, true, equipment));
  rooms.set(roomId, room);
  socketToRoom.set(hostSocketId, roomId);

  return room;
}

function joinRoom(roomId, { socketId, nickname, color, equipment }) {
  const room = rooms.get(roomId);
  if (!room) return { error: "ROOM_NOT_FOUND" };
  if (room.started) return { error: "ROOM_ALREADY_STARTED" };
  if (room.players.size >= room.maxPlayers) return { error: "ROOM_FULL" };

  room.players.set(socketId, makePlayer(socketId, nickname, color, false, equipment));
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
  if (room.started) return { room };
  room.started = true;
  room.startedAt = Date.now();
  // Starting a match moves every lobby player into the new first area.
  const players = [...room.players.values()];
  const columns = Math.min(6, players.length);
  players.forEach((player, index) => {
    Object.assign(player, {
      area: "ai", x: 720 + (index % 6 - (columns - 1) / 2) * 84,
      y: 825 + Math.floor(index / 6) * 60 - Math.floor((players.length - 1) / 6) * 30, moving: false, seated:false, seatId:null
    });
  });
  return { room };
}

function updatePlayerState(socketId, patch) {
  const roomId = socketToRoom.get(socketId);
  if (!roomId) return null;
  const room = rooms.get(roomId);
  if (!room) return null;
  const player = room.players.get(socketId);
  if (!player) return null;

  if (!patch || typeof patch !== "object") return null;
  const safe = {};
  if (patch.equipment && typeof patch.equipment === "object") safe.equipment=sanitizeEquipment(patch.equipment);
  for (const key of ["x", "y"]) if (Number.isFinite(patch[key])) safe[key] = patch[key];
  if (patch.facing && Number.isFinite(patch.facing.x) && Number.isFinite(patch.facing.y)) safe.facing = { x: patch.facing.x, y: patch.facing.y };
  if (typeof patch.moving === "boolean") safe.moving = patch.moving;
  if (typeof patch.aiming === 'boolean')safe.aiming=patch.aiming;
  if (typeof patch.color === "string" && /^#[0-9a-f]{6}$/i.test(patch.color)) safe.color = patch.color;
  if (typeof patch.nickname === "string") safe.nickname = patch.nickname.slice(0, 16);
  if (room.unlockedAreas.has(patch.area)||(room.tag?.active&&AREAS[patch.area])) safe.area = patch.area;
  if (typeof patch.flashlightOn === "boolean") safe.flashlightOn = patch.flashlightOn;
  if (Number.isFinite(patch.flashlightEnergy)) safe.flashlightEnergy = Math.max(0, Math.min(100, patch.flashlightEnergy));
  if (player.seated || player.eliminated) {
    delete safe.x; delete safe.y; delete safe.area; delete safe.facing;
    safe.moving=false;
  }
  Object.assign(player, safe);
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
function completeTask(roomId, area, taskId, answer) {
  const room = rooms.get(roomId);
  if (!room || !room.started || !AREA_SEQUENCE.includes(area)) return null;
  if (!Object.hasOwn(TASKS_BY_AREA[area], taskId)) return null;
  if(area==="office"&&!validateHTMLAnswer(TASKS_BY_AREA.office[taskId],answer))return null;
  if(area==="park"){const task=TASKS_BY_AREA.park[taskId];if(!validateArcadeAnswer(task,answer)||(task.requires&&!room.areaProgress.park.has(task.requires)))return null;}
  if (area === "ai") {
    const task=AI_TASKS_BY_ID[taskId];
    if (!validateAIAnswer(task, answer)) return null;
    if (task.requires && !room.areaProgress.ai.has(task.requires)) return null;
  }
  if (!room.unlockedAreas.has(area)) return null;

  const progress = room.areaProgress[area];
  const before = progress.size;
  progress.add(taskId);
  const completed = progress.size;
  const total = taskTotal(area);

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

  return { completed, total, justUnlocked, nextArea, solvedTaskIds: [...progress] };
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
    doors:room.doors,
    trainingTargets:room.trainingTargets,
    tag:room.tag||{active:false,hunterId:null},
    unlockedAreas: room.tag?.active?Object.keys(AREAS):Array.from(room.unlockedAreas),
    solvedTasks: Object.fromEntries(Object.entries(room.areaProgress).map(([area, set]) => [area, [...set]])),
    taskProgress: Object.fromEntries(
      Object.entries(room.areaProgress).map(([area, set]) => [
        area,
        { completed: set.size, total: taskTotal(area) },
      ])
    ),
  };
}

// Keep in sync with frontend/src/engine/lobby/LobbyEngine.js LOBBY_WORLD.
const LOBBY_WORLD = { width: 900, height: 560, padding: 100 };


function makePlayer(id, nickname, color, isHost, equipment) {
  return {
    id,
    nickname: (nickname || "Player").slice(0, 16),
    equipment: sanitizeEquipment(equipment),
    color: color || "#4f8cff",
    isHost,
    ...randomSpawnPoint(),
    facing: { x: 0, y: 1 },
    moving: false, energy:100, eliminated:false,
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
  setTag: (socketId,active) => {
    const room=getRoomForSocket(socketId);
    if(!room)return {ok:false,error:'NOT_IN_ROOM'};
    const result=active?startTag(room,socketId):stopTag(room,socketId);
    if(result.ok&&active)for(const [key,area] of Object.entries(AREAS))for(const d of areaDoors(area,key))room.doors[d.id]={open:true,holdUntil:Date.now()+3600000};
    if(result.ok&&!active)finishTag(room);
    return result;
  },
  tickTag: (now=Date.now()) => {
    const updates=[];
    for(const room of rooms.values())if(tickTag(room,area=>AREAS[area]?.buildWalls()||[],now)){
      if(!room.tag.active)finishTag(room);
      updates.push({roomId:room.id,room:serializeRoom(room)});
    }
    return updates;
  },
  useWeapon: (socketId) => {
    const room=getRoomForSocket(socketId),player=room?.players.get(socketId),area=AREAS[player?.area];
    if(!area)return {ok:false,error:'UNAVAILABLE'};
    const walls=[...area.buildWalls(),...areaDoors(area,player.area).filter(d=>!room.doors[d.id]?.open).map(doorObstacle)];
    return useWeapon(room,player,walls);
  },
  setSeat, submitAttempt, requestDoor, tickDoors,
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

function setSeat(socketId,seatId) {
  const room=getRoomForSocket(socketId),player=room?.players.get(socketId);
  if(!room?.started||!player||player.eliminated||!AREAS[player.area]) return {ok:false};
  const area=AREAS[player.area],furniture=area.buildFurniture();
  const seats=buildSeats(furniture.blocking,player.area);
  const walls=area.buildWalls();
  const doors=areaDoors(area,player.area).filter(d=>!room.doors[d.id]?.open).map(doorObstacle);
  const gate=area.exitGate&&!room.unlockedAreas.has(area.exitGate.targetArea)?[area.exitGate]:[];
  const collision=new CollisionSystem([...walls,...doors,...gate,...furniture.blocking]);
  if(seatId===null) {
    const seat=seats.find(s=>s.id===player.seatId);
    if(!seat) return {ok:false};
    const position=findStandingPosition(seat,collision);
    if(!position) return {ok:false};
    Object.assign(player,position,{seated:false,seatId:null,moving:false});
  } else {
    const seat=seats.find(s=>s.id===seatId);
    if(!seat||player.seated||Math.hypot(seat.x-player.x,seat.y-player.y)>100) return {ok:false};
    if(!hasLineOfSight(player,{x:seat.x-1,y:seat.y-1,w:2,h:2},[...walls,...doors])) return {ok:false};
    if([...room.players.values()].some(p=>p.id!==socketId&&p.seated&&p.seatId===seatId)) return {ok:false,error:"SEAT_OCCUPIED"};
    Object.assign(player,{x:seat.x,y:seat.y,seated:true,seatId:seat.id,moving:false,facing:{x:0,y:1}});
  }
  return {ok:true,roomId:room.id,player:{...player}};
}

function submitAttempt(socketId, data={}) {
 const room=getRoomForSocket(socketId),player=room?.players.get(socketId);
 if(!room?.started||!player||player.eliminated||player.area!==data.area) return {ok:false,error:"UNAVAILABLE"};
 const task=TASKS_BY_AREA[data.area]?.[data.taskId];
 if(!task||!room.unlockedAreas.has(data.area)||(task.requires&&!room.areaProgress[data.area].has(task.requires))) return {ok:false,error:"TASK_LOCKED"};
 if(typeof data.attemptId!=="string"||data.attemptId.length>100) return {ok:false,error:"INVALID_ATTEMPT"};
 const cache=room.attempts.get(socketId)||new Map();room.attempts.set(socketId,cache);
 if(cache.has(data.attemptId)) return {...cache.get(data.attemptId),player:{...player},progress:null};
 const allPass=data.area==="ai"?validateAIAnswer(task,data.answer):task.type==='quiz'?validateHTMLAnswer(task,data.answer):task.type==='arcade'?validateArcadeAnswer(task,data.answer):task.type==="css"?runTask(task,String(data.answer||"")).allPass:data.passed===true;
 const before=player.energy;
 const protectedAttempt=!allPass&&(player.shieldUntil||0)>Date.now();
 if(protectedAttempt)player.shieldUntil=0;
 player.energy=Math.max(0,Math.min(100,before+(allPass?10:protectedAttempt?0:-25)));
 player.eliminated=player.energy===0;
 if(player.eliminated) player.moving=false;
 const progress=allPass?completeTask(room.id,data.area,data.taskId,data.answer):null;
 const result={ok:true,roomId:room.id,player:{...player},allPass,energyDelta:player.energy-before,progress};
 cache.set(data.attemptId,result);
 if(cache.size>100) cache.delete(cache.keys().next().value);
 return result;
}
function requestDoor(socketId,{area,id}={}) {
 const room=getRoomForSocket(socketId),player=room?.players.get(socketId);
 if(!room?.started||!player||player.eliminated||player.area!==area) return {ok:false};
 const door=areaDoors(AREAS[area],area).find(d=>d.id===id);
 if(!door||doorDistance(player,door)>115||(!room.tag?.active&&!doorAllowed(door,[...room.areaProgress[area]],[...room.unlockedAreas]))) return {ok:false,error:"DOOR_LOCKED"};
 room.doors[id]={open:true,holdUntil:Date.now()+1800};
 return {ok:true,roomId:room.id,doors:room.doors};
}
function tickDoors(now=Date.now()) {
 const updates=[];
 for(const room of rooms.values()) {
 if(room.tag?.active)continue;
 let changed=false;
 for(const [id,state] of Object.entries(room.doors)) {
 if(!state.open||now<state.holdUntil) continue;
 const occupied=[...room.players.values()].some(p=>{
 const door=areaDoors(AREAS[p.area]||{},p.area).find(d=>d.id===id);
 if(!door) return false;
 const r=door.roomBounds;
 return doorDistance(p,door)<85||(r&&p.x>r.x&&p.x<r.x+r.w&&p.y>r.y&&p.y<r.y+r.h);
 });
 if(!occupied) {state.open=false;changed=true;}
 }
 if(changed) updates.push({roomId:room.id,doors:room.doors});
 }
 return updates;
}

function finishTag(room){
 for(const state of Object.values(room.doors))state.holdUntil=0;
 let index=0;
 for(const p of room.players.values())if(p.area&&!room.unlockedAreas.has(p.area)){
  Object.assign(p,{area:'ai',x:720+(index++%4)*70,y:825,moving:false,seated:false,seatId:null,relocationId:(p.relocationId||0)+1});
 }
}
