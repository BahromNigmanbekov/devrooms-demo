/**
 * Fully original office layout — no copied assets, geometry, or artwork.
 * The building is now made of real enclosed rooms (four solid walls each,
 * with a doorway gap) instead of one open hall — every computer sits inside
 * a room, and the player walks through doorways to reach them.
 */

export const WORLD_WIDTH = 1800;
export const WORLD_HEIGHT = 1100;

const WALL_THICKNESS = 24;
const DOOR_SIZE = 120; // wide enough for the player (radius 16) to pass comfortably

// ---- Palette --------------------------------------------------------------
export const COLORS = {
  floorA: "#232a3d",
  floorB: "#1f2536",
  wall: "#aeb6c9",
  wallTop: "#f3f6fb",
  desk: "#8a6a4e",
  deskEdge: "#6f5540",
  monitor: "#12161f",
  monitorGlowOff: "#2a3550",
  monitorGlowOn: "#5b8cff",
  chair: "#394058",
  chairSeat: "#4a5375",
  plantPot: "#6b4a35",
  plantLeaf: "#4fae6d",
  plantLeafDark: "#3c8c56",
  printer: "#d7dbe6",
  printerDark: "#9aa2b8",
  server: "#232838",
  serverLight: "#7ee0c3",
  shelf: "#5a4632",
  shelfItem: "#c98f4a",
  table: "#7a5a3f",
  tableTop: "#96714c",
  doorFrame: "#c9a24a",
  sofa: "#4a5b7a",
  sofaEdge: "#39475f",
  sofaCushion: "#5d7194",
  coolerBody: "#dfe3ec",
  coolerBottle: "#8fd3e8",
  rug: "#33405c",
  rugBorder: "#4a5b82",
  whiteboard: "#f4f7fb",
  whiteboardFrame: "#9aa2b8",
  whiteboardInk: "#5b8cff",
  clockFace: "#f4f7fb",
  clockRim: "#3a4359",
  windowFrame: "#9aa2b8",
  windowGlass: "#7fb8e0",
};

function rect(x, y, w, h) {
  return { x, y, w, h };
}

/**
 * Builds the four walls of a rectangular room, cutting a doorway gap into
 * one side. `door.at` is the offset (from that wall's start) to the gap.
 */
function buildRoom(x, y, w, h, door) {
  const t = WALL_THICKNESS;
  const walls = [];

  // top
  if (door.side === "top") {
    walls.push(rect(x, y, door.at, t));
    walls.push(rect(x + door.at + DOOR_SIZE, y, w - door.at - DOOR_SIZE, t));
  } else {
    walls.push(rect(x, y, w, t));
  }
  // bottom
  if (door.side === "bottom") {
    walls.push(rect(x, y + h - t, door.at, t));
    walls.push(rect(x + door.at + DOOR_SIZE, y + h - t, w - door.at - DOOR_SIZE, t));
  } else {
    walls.push(rect(x, y + h - t, w, t));
  }
  // left
  if (door.side === "left") {
    walls.push(rect(x, y, t, door.at));
    walls.push(rect(x, y + door.at + DOOR_SIZE, t, h - door.at - DOOR_SIZE));
  } else {
    walls.push(rect(x, y, t, h));
  }
  // right
  if (door.side === "right") {
    walls.push(rect(x + w - t, y, t, door.at));
    walls.push(rect(x + w - t, y + door.at + DOOR_SIZE, t, h - door.at - DOOR_SIZE));
  } else {
    walls.push(rect(x + w - t, y, t, h));
  }
  return walls;
}

// ---- Room definitions -------------------------------------------------
// Four rooms in a 2x2 layout, each opening onto the shared hallway space
// between them so the player can walk from any room to any other.
export const ROOMS = {
  openOffice: { x: 60, y: 60, w: 760, h: 400, door: { side: "right", at: 160 } },
  serverRoom: { x: 1000, y: 60, w: 740, h: 400, door: { side: "left", at: 160 } },
  meetingRoom: { x: 60, y: 660, w: 760, h: 380, door: { side: "right", at: 130 } },
  breakRoom: { x: 1000, y: 660, w: 740, h: 380, door: { side: "left", at: 130 } },
};

/** Small decorative arch drawn over each doorway gap (purely visual). */
export function buildDoorFrames() {
  const frames = [];
  const t = WALL_THICKNESS;
  for (const room of Object.values(ROOMS)) {
    const { x, y, w, h, door } = room;
    if (door.side === "right") {
      frames.push(rect(x + w - t, y + door.at, t, DOOR_SIZE));
    } else if (door.side === "left") {
      frames.push(rect(x, y + door.at, t, DOOR_SIZE));
    } else if (door.side === "top") {
      frames.push(rect(x + door.at, y, DOOR_SIZE, t));
    } else if (door.side === "bottom") {
      frames.push(rect(x + door.at, y + h - t, DOOR_SIZE, t));
    }
  }
  frames.push(rect(EXIT_GATE.x, EXIT_GATE.y, EXIT_GATE.w, EXIT_GATE.h));
  return frames;
}

// The gate to the Park — on the RIGHT side of the office, sitting in the
// existing hallway band between serverRoom and breakRoom (y 460-660) where
// it dead-ends at the outer wall. It's always physically open (no wall
// segment there); the gate itself is a *separate* collidable rectangle
// Game.js adds to the obstacle list only while "park" isn't in the room's
// unlocked areas, so unlocking it is just "stop adding that one obstacle,"
// not a map rebuild.
export const EXIT_GATE = {
  x: WORLD_WIDTH - WALL_THICKNESS,
  y: WORLD_HEIGHT / 2 - DOOR_SIZE / 2,
  w: WALL_THICKNESS,
  h: DOOR_SIZE,
  targetArea: "park",
};

// Trigger zone just inside the gate — stepping into this (once unlocked)
// is what actually sends the player to the Park, rather than requiring
// them to touch the wall pixel-perfectly.
export const EXIT_GATE_TRIGGER = {
  x: WORLD_WIDTH - WALL_THICKNESS - 50,
  y: WORLD_HEIGHT / 2 - DOOR_SIZE / 2,
  w: 50,
  h: DOOR_SIZE,
};

export const SPAWN = { x: WORLD_WIDTH / 2, y: WORLD_HEIGHT / 2 };

export function buildWalls() {
  const t = WALL_THICKNESS;
  const gateHalf = DOOR_SIZE / 2;
  const gy = WORLD_HEIGHT / 2 - gateHalf;
  const walls = [
    rect(0, 0, WORLD_WIDTH, t), // top
    rect(0, WORLD_HEIGHT - t, WORLD_WIDTH, t), // bottom
    rect(0, 0, t, WORLD_HEIGHT), // left
    // right, with a permanent gap for EXIT_GATE
    rect(WORLD_WIDTH - t, 0, t, gy),
    rect(WORLD_WIDTH - t, gy + DOOR_SIZE, t, WORLD_HEIGHT - (gy + DOOR_SIZE)),
  ];
  for (const room of Object.values(ROOMS)) {
    walls.push(...buildRoom(room.x, room.y, room.w, room.h, room.door));
  }
  return walls;
}

/**
 * Furniture split into two lists:
 *  - blocking: solid, participates in collision
 *  - interactables: computers the player can walk up to and interact with
 * Everything below is placed inside one of the four rooms above.
 */
export function buildFurniture() {
  const blocking = [];
  const interactables = [];
  const decor = [];

  const pod = (x, y, id) => {
    const deskW = 130;
    const deskH = 60;
    blocking.push({ type: "desk", x, y, w: deskW, h: deskH });
    const monitor = {
      type: "computer",
      id,
      x: x + deskW / 2 - 18,
      y: y + deskH - 14,
      w: 36,
      h: 20,
      interactRadius: 78,
      label: "Programming Terminal",
    };
    interactables.push(monitor);
    blocking.push({ type: "chair", x: x + deskW / 2 - 18, y: y + deskH + 8, w: 36, h: 36 });
    return monitor;
  };

  // ---- Room 1: Open Office — 6 workstations in a 2x3 grid -----------------
  // Each workstation gets a stable, unique id (instead of a coordinate-based
  // one) so every terminal can be wired to its own distinct question.
  const o = ROOMS.openOffice;
  [
    [o.x + 60, o.y + 50, "terminal-openoffice-1"],
    [o.x + 260, o.y + 50, "terminal-openoffice-2"],
    [o.x + 460, o.y + 50, "terminal-openoffice-3"],
    [o.x + 60, o.y + 230, "terminal-openoffice-4"],
    [o.x + 260, o.y + 230, "terminal-openoffice-5"],
    [o.x + 460, o.y + 230, "terminal-openoffice-6"],
  ].forEach(([x, y, id]) => pod(x, y, id));
  decor.push({ type: "rug", x: o.x + 40, y: o.y + 150, w: 480, h: 200 });
  decor.push({ type: "clock", x: o.x + o.w - 60, y: o.y + 14, w: 30, h: 30 });
  blocking.push({ type: "watercooler", x: o.x + o.w - 60, y: o.y + o.h - 90, w: 34, h: 60 });

  // ---- Room 2: Server Room — racks, a shelf, and a control terminal -------
  const s = ROOMS.serverRoom;
  [s.x + 60, s.x + 130, s.x + 200].forEach((x) => {
    blocking.push({ type: "server", x, y: s.y + 50, w: 46, h: 90 });
  });
  blocking.push({ type: "shelf", x: s.x + 60, y: s.y + 200, w: 260, h: 34 });
  {
    const deskW = 130;
    const deskH = 60;
    const dx = s.x + s.w - 220;
    const dy = s.y + s.h - 130;
    blocking.push({ type: "desk", x: dx, y: dy, w: deskW, h: deskH });
    interactables.push({
      type: "computer",
      id: "terminal-server-control",
      x: dx + deskW / 2 - 18,
      y: dy + deskH - 14,
      w: 36,
      h: 20,
      interactRadius: 78,
      label: "Server Control Terminal",
    });
    blocking.push({ type: "chair", x: dx + deskW / 2 - 18, y: dy + deskH + 8, w: 36, h: 36 });
  }
  decor.push({ type: "whiteboard", x: s.x + 340, y: s.y + 50, w: 160, h: 90 });
  decor.push({ type: "rug", x: s.x + s.w - 260, y: s.y + s.h - 160, w: 200, h: 100 });
  pod(s.x + 420, s.y + 230, "terminal-server-2");

  // ---- Room 3: Meeting Room — round table + a wall presentation screen ----
  const m = ROOMS.meetingRoom;
  const tableCx = m.x + m.w / 2 - 40;
  const tableCy = m.y + m.h / 2 + 10;
  decor.push({ type: "rug", x: tableCx - 130, y: tableCy - 110, w: 260, h: 220 });
  decor.push({ type: "window", x: m.x + m.w - 50, y: m.y + 290, w: 26, h: 70 });
  blocking.push({ type: "table", x: tableCx - 70, y: tableCy - 50, w: 140, h: 100 });
  [
    [tableCx - 10, tableCy - 100],
    [tableCx - 10, tableCy + 60],
    [tableCx - 120, tableCy - 20],
    [tableCx + 100, tableCy - 20],
  ].forEach(([x, y]) => blocking.push({ type: "chair", x, y, w: 34, h: 34 }));
  {
    const dx = m.x + 70;
    const dy = m.y + 40;
    interactables.push({
      type: "computer",
      id: "terminal-meeting-screen",
      x: dx,
      y: dy,
      w: 60,
      h: 24,
      interactRadius: 84,
      label: "Meeting Room Terminal",
    });
  }
  pod(m.x + 90, m.y + m.h - 160, "terminal-meeting-2");

  // ---- Room 4: Break Room — printers, shelf, and a small kiosk terminal ---
  const b = ROOMS.breakRoom;
  blocking.push({ type: "shelf", x: b.x + 60, y: b.y + 40, w: 220, h: 36 });
  blocking.push({ type: "printer", x: b.x + 60, y: b.y + 120, w: 70, h: 60 });
  blocking.push({ type: "printer", x: b.x + 160, y: b.y + 120, w: 70, h: 60 });
  blocking.push({ type: "sofa", x: b.x + 60, y: b.y + 230, w: 150, h: 60 });
  decor.push({ type: "rug", x: b.x + 40, y: b.y + 210, w: 210, h: 110 });
  {
    const deskW = 110;
    const deskH = 56;
    const dx = b.x + b.w - 220;
    const dy = b.y + b.h - 130;
    blocking.push({ type: "desk", x: dx, y: dy, w: deskW, h: deskH });
    interactables.push({
      type: "computer",
      id: "terminal-break-kiosk",
      x: dx + deskW / 2 - 18,
      y: dy + deskH - 14,
      w: 36,
      h: 20,
      interactRadius: 78,
      label: "Break Room Kiosk",
    });
    blocking.push({ type: "chair", x: dx + deskW / 2 - 18, y: dy + deskH + 8, w: 36, h: 36 });
  }
  pod(b.x + 400, b.y + 40, "terminal-break-2");

  // ---- Decorative plants: hallway + room corners, never on a doorway -----
  const plants = [
    [o.x + 690, o.y + 40],
    [m.x + 690, m.y + 40],
    [s.x + 40, s.y + 40],
    [b.x + 660, b.y + 320],
    [WORLD_WIDTH / 2 - 20, 40],
    [WORLD_WIDTH / 2 - 220, WORLD_HEIGHT - 70],
    [WORLD_WIDTH / 2 + 190, WORLD_HEIGHT - 70],
    [40, WORLD_HEIGHT / 2 - 20],
  ];
  plants.forEach(([x, y]) => blocking.push({ type: "plant", x, y, w: 34, h: 34 }));

  return { blocking, interactables, decor };
}
