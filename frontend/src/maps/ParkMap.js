/**
 * Indoor Amusement Park — a mall arcade, NOT an outdoor park. Built with a
 * completely different structure from the office (one open hall with
 * partial dividers carving out themed bays, instead of enclosed rooms with
 * doorway gaps) and a completely different palette (pastel pink floor,
 * neon-toned walls) so it reads as a different place, not a re-skinned
 * office. This is the game's dark room — see COLORS.darkness usage via
 * areas.js and Game.js's flashlight system.
 */

export const WORLD_WIDTH = 2000;
export const WORLD_HEIGHT = 1300;

const WALL_THICKNESS = 24;
const GATE_SIZE = 140;

export const COLORS = {
  // Dark pink/purple/magenta/violet, per the retro-arcade redesign — a
  // premium, colorful checkerboard, not the earlier near-black flashlight
  // floor. Fully readable under this area's own (now much softer) ambient
  // darkness, no flashlight required.
  floorA: "#5c2a5e",
  floorB: "#3f1c48",
  wall: "#4a3a5c",
  wallTop: "#6c5488",
  doorFrame: "#ff4fd8", // neon magenta frame — distinct from the office's gold and reads as "mall," not "rusty gate"
  columnBody: "#7a4fd6",
  columnTop: "#a97cff",
  benchWood: "#5c4630",
  benchLeg: "#2c2419",
  fence: "#c9457a",
  neonPink: "#ff5fc7",
  neonCyan: "#4fe0ff",
  neonYellow: "#ffe14f",
  arcadeBody: "#3a2f52",
  arcadeScreenOff: "#241c36",
  clawMachineBody: "#2f4a5c",
  clawMachineGlass: "rgba(180,230,255,0.18)",
  vendingBody: "#37324a",
  vendingGlow: "#4fe0ff",
  ticketBody: "#5c3a52",
  counter: "#8a5fd6",
  counterTop: "#b18fff",
  oldComputerBody: "#454a3f",
  monitor: "#182a1c",
  monitorGlowOff: "#2c4530",
  monitorGlowOn: "#4fe07a",
  posterFrame: "#1a1420",
  posterBody: "#7a3fa0",
  posterAccent: "#ffe14f",
  // Stylized "neon plant" — teal leaves instead of natural green, so it
  // reads as part of this room's palette rather than an office plant.
  plantPot: "#3a1a42",
  plantLeafDark: "#0f6e5e",
  plantLeaf: "#4fe0c8",
};

function rect(x, y, w, h) {
  return { x, y, w, h };
}

// Where a player arrives when the office's exit gate sends them here.
export const SPAWN = { x: 220, y: WORLD_HEIGHT / 2 };

// The gap in the east wall for a future third area — present and visibly
// locked (a bright neon gate, distinct from the office's clean gold frame
// and from a rusty outdoor gate) so the world reads as "this continues
// somewhere," even though nothing is behind it yet.
export const NEXT_AREA_GATE = {
  x: WORLD_WIDTH - WALL_THICKNESS,
  y: WORLD_HEIGHT / 2 - GATE_SIZE / 2,
  w: WALL_THICKNESS,
  h: GATE_SIZE,
  targetArea: "vault", // doesn't exist yet — completeTask() on the backend simply won't unlock past "park" until it does
};

// The office's exit gate lands players on the LEFT side of this hall (its
// own left wall has a matching permanent gap, mirroring the office's right
// wall — see buildWalls()). Walking back into that same gap returns them.
export const RETURN_GATE = {
  x: 0,
  y: WORLD_HEIGHT / 2 - GATE_SIZE / 2,
  w: WALL_THICKNESS,
  h: GATE_SIZE,
  targetArea: "office",
};
export const RETURN_GATE_TRIGGER = {
  x: WALL_THICKNESS,
  y: WORLD_HEIGHT / 2 - GATE_SIZE / 2,
  w: 50,
  h: GATE_SIZE,
};

export function buildWalls() {
  const t = WALL_THICKNESS;
  const gy = WORLD_HEIGHT / 2 - GATE_SIZE / 2;
  const walls = [
    rect(0, 0, WORLD_WIDTH, t), // top
    rect(0, WORLD_HEIGHT - t, WORLD_WIDTH, t), // bottom
    // left wall, with a permanent gap for RETURN_GATE (back to the office)
    rect(0, 0, t, gy),
    rect(0, gy + GATE_SIZE, t, WORLD_HEIGHT - (gy + GATE_SIZE)),
    // right wall, with a permanent gap for NEXT_AREA_GATE
    rect(WORLD_WIDTH - t, 0, t, NEXT_AREA_GATE.y),
    rect(WORLD_WIDTH - t, NEXT_AREA_GATE.y + NEXT_AREA_GATE.h, t, WORLD_HEIGHT - (NEXT_AREA_GATE.y + NEXT_AREA_GATE.h)),
  ];

  // Partial dividers carving the one big hall into themed bays without
  // fully enclosing them — this is the "different structure, interesting
  // paths" the office's grid-of-rooms doesn't have: players weave around
  // stub walls instead of walking through doorways.
  const stubW = 26;
  const stub = (x, y, h) => walls.push(rect(x, y, stubW, h));
  stub(560, 0, 340); // splits the arcade bay from the claw-machine bay (from the top)
  stub(1180, WORLD_HEIGHT - 340, 340); // splits the vending bay from the ticket-counter bay (from the bottom)
  stub(560, WORLD_HEIGHT - 460, 460); // second half of the arcade/claw split, offset for a zigzag path
  stub(1180, 0, 460); // second half of the vending/ticket split, offset for a zigzag path

  return walls;
}

/** Purely visual — the neon frames drawn around both gates. */
export function buildDoorFrames() {
  return [
    rect(NEXT_AREA_GATE.x, NEXT_AREA_GATE.y, NEXT_AREA_GATE.w, NEXT_AREA_GATE.h),
    rect(RETURN_GATE.x, RETURN_GATE.y, RETURN_GATE.w, RETURN_GATE.h),
  ];
}

export function buildFurniture() {
  const blocking = [];
  const interactables = [];
  const decor = [];

  const column = (x, y) => blocking.push({ type: "column", x, y, w: 46, h: 46 });
  const bench = (x, y, rotated) => blocking.push({ type: "bench", x, y, w: rotated ? 26 : 90, h: rotated ? 90 : 26 });
  const fence = (x, y, w, h) => blocking.push({ type: "fence", x, y, w, h });
  const neon = (x, y, w, h, color) => decor.push({ type: "neonSign", x, y, w, h, color });
  const poster = (x, y) => decor.push({ type: "poster", x, y, w: 46, h: 60 });
  const arcade = (x, y) => blocking.push({ type: "arcadeMachine", x, y, w: 46, h: 60 });
  const basketballArcade = (x, y) => blocking.push({ type: "basketballArcade", x, y, w: 60, h: 140 });
  const airHockey = (x, y) => blocking.push({ type: "airHockey", x, y, w: 120, h: 70 });
  const clawMachine = (x, y) => blocking.push({ type: "clawMachine", x, y, w: 56, h: 56 });
  const vendingMachine = (x, y) => blocking.push({ type: "vendingMachine", x, y, w: 44, h: 60 });
  const ticketMachine = (x, y) => blocking.push({ type: "ticketMachine", x, y, w: 44, h: 50 });

  const arcadeTerminal = (x, y, id, label, accent) => {
    const w = 48;
    const h = 76;
    blocking.push({ type: "arcadeCabinetBody", x, y, w, h, accent });
    interactables.push({
      type: "arcadeScreen",
      id,
      x: x + w * 0.12,
      y: y + h * 0.2,
      w: w * 0.76,
      h: h * 0.32,
      interactRadius: 84,
      label: label || "Arcade terminali",
    });
  };

  const vNeonStrip = (x, y, h, color) => decor.push({ type: "neonStripV", x, y, w: 6, h, color });

  // ---- Left/right outer walls: neon only on the side facing INTO the ----
  // room (never on the side facing the world boundary), split around each
  // wall's gate gap.
  const leftGateY = WORLD_HEIGHT / 2 - GATE_SIZE / 2;
  vNeonStrip(WALL_THICKNESS + 2, 24, leftGateY - 40, "neonCyan");
  vNeonStrip(WALL_THICKNESS + 2, leftGateY + GATE_SIZE + 16, WORLD_HEIGHT - (leftGateY + GATE_SIZE) - 40, "neonCyan");

  vNeonStrip(WORLD_WIDTH - WALL_THICKNESS - 8, 24, NEXT_AREA_GATE.y - 40, "neonPink");
  vNeonStrip(
    WORLD_WIDTH - WALL_THICKNESS - 8,
    NEXT_AREA_GATE.y + NEXT_AREA_GATE.h + 16,
    WORLD_HEIGHT - (NEXT_AREA_GATE.y + NEXT_AREA_GATE.h) - 40,
    "neonPink"
  );

  // ---- Interior divider (stub) walls: these have open room on BOTH -------
  // sides, so unlike the outer boundary they get a neon strip on each face.
  [
    [560, 0, 340],
    [1180, WORLD_HEIGHT - 340, 340],
    [560, WORLD_HEIGHT - 460, 460],
    [1180, 0, 460],
  ].forEach(([sx, sy, sh]) => {
    vNeonStrip(sx - 8, sy + 16, sh - 32, "neonYellow");
    vNeonStrip(sx + 26 + 2, sy + 16, sh - 32, "neonYellow");
  });

  // ---- Central landmark: ticket redemption counter ------------------------
  const cx = WORLD_WIDTH / 2;
  const cy = WORLD_HEIGHT / 2;
  blocking.push({ type: "prizeCounter", x: cx - 90, y: cy - 40, w: 180, h: 80 });
  neon(cx - 70, cy - 110, 140, 30, "neonYellow");

  // ---- Bay 1 (top-left): Arcade zone --------------------------------------
  [
    [140, 90], [210, 90], [280, 90], [350, 90],
    [140, 250], [210, 250], [280, 250], [350, 250],
  ].forEach(([x, y]) => arcade(x, y));
  basketballArcade(430, 90);
  neon(140, 40, 260, 26, "neonCyan");

  // ---- Bay 2 (top-right): Claw machines + air hockey ----------------------
  [
    [700, 90], [770, 90], [840, 90], [910, 90],
  ].forEach(([x, y]) => clawMachine(x, y));
  airHockey(700, 230);
  airHockey(860, 230);
  neon(700, 40, 260, 26, "neonPink");

  // ---- Bay 3 (bottom-left): Vending + tickets ------------------------------
  [
    [140, WORLD_HEIGHT - 200], [210, WORLD_HEIGHT - 200], [280, WORLD_HEIGHT - 200],
  ].forEach(([x, y]) => vendingMachine(x, y));
  [
    [140, WORLD_HEIGHT - 300], [210, WORLD_HEIGHT - 300],
  ].forEach(([x, y]) => ticketMachine(x, y));
  neon(140, WORLD_HEIGHT - 340, 200, 26, "neonYellow");

  // ---- Bay 4 (bottom-right): Toy/claw machines + benches ------------------
  [
    [1260, WORLD_HEIGHT - 210], [1330, WORLD_HEIGHT - 210], [1400, WORLD_HEIGHT - 210],
  ].forEach(([x, y]) => clawMachine(x, y));
  bench(1260, WORLD_HEIGHT - 320);
  bench(1400, WORLD_HEIGHT - 320);
  neon(1260, WORLD_HEIGHT - 360, 220, 26, "neonCyan");

  // ---- Terminal Row — 12 arcade cabinets are the actual task terminals ---
  // now (not desks), matching the room's own theme: walk up to an arcade
  // machine, not an office PC, to get a task. Left and right clusters are
  // deliberately DIFFERENT shapes (2x3 vs 3x2) with generous aisles, so the
  // two groups of six read as two distinct arcade banks flanking the
  // central plaza rather than one clump mirrored twice.
  //
  // The left bank's rows are also kept clear of y=600-700 on purpose: the
  // Park's SPAWN point sits at (220, 650), right where a player walks in
  // from the office gate, and a cabinet row sitting on that exact line
  // would block their very first step forward almost immediately (reads
  // as the character being stuck/frozen right after arriving).
  neon(250, 420, 280, 24, "neonCyan");
  neon(1400, 450, 360, 24, "neonPink");
  const accents = ["neonCyan", "neonPink", "neonYellow"];
  let stationNum = 1;

  // Left bank: 2 columns x 3 rows.
  const leftCols = [270, 460];
  const leftRows = [460, 720, 860];
  for (const y of leftRows) {
    for (const x of leftCols) {
      arcadeTerminal(x, y, `terminal-park-${stationNum}`, `Arcade #${stationNum}`, accents[stationNum % accents.length]);
      stationNum++;
    }
  }

  // Right bank: 3 columns x 2 rows — a different footprint from the left
  // bank so the room doesn't read as two copies of the same block.
  const rightCols = [1420, 1560, 1700];
  const rightRows = [560, 720];
  for (const y of rightRows) {
    for (const x of rightCols) {
      arcadeTerminal(x, y, `terminal-park-${stationNum}`, `Arcade #${stationNum}`, accents[stationNum % accents.length]);
      stationNum++;
    }
  }

  // ---- Decorative plants — softening the aisles around both terminal ----
  // banks and the central plaza.
  [
    [190, 570], [190, 680], [620, 590], [1350, 640], [1780, 480],
  ].forEach(([x, y]) => blocking.push({ type: "plant", x, y, w: 32, h: 32 }));

  // ---- Columns — the mall's big colorful pillars, scattered through the --
  // open floor between bays so the wide central hall isn't fully empty.
  [
    [560, 560], [560, 780], [900, 400], [900, 900],
    [1250, 560], [1250, 780], [1780, 640],
  ].forEach(([x, y]) => column(x, y));

  // ---- Decorative fences — light rails marking the edge of the central ---
  // plaza around the prize counter, purely visual/blocking, not full walls.
  fence(cx - 160, cy - 130, 320, 10);
  fence(cx - 160, cy + 120, 320, 10);
  fence(cx - 170, cy - 130, 10, 260);
  fence(cx + 160, cy - 130, 10, 260);

  // ---- Wall decoration — dense, continuous line of neon signs and -------
  // posters running the full length of the top and bottom walls (matching
  // the reference layout), not a handful of scattered pieces. Skips the
  // x-bands where a stub wall descends from the top/bottom edge so nothing
  // visually clips through a column.
  const stubBands = [
    [520, 640],
    [1140, 1260],
  ];
  const clearOfStubs = (x) => !stubBands.some(([lo, hi]) => x > lo && x < hi);

  const topSpots = [];
  for (let x = 70; x <= WORLD_WIDTH - 140; x += 155) {
    if (clearOfStubs(x)) topSpots.push(x);
  }
  const neonColors = ["neonCyan", "neonPink", "neonYellow"];
  topSpots.forEach((x, i) => {
    if (i % 2 === 0) {
      neon(x, 36, 128, 26, neonColors[i % neonColors.length]);
    } else {
      poster(x, 30);
    }
  });
  const bottomSpots = [];
  for (let x = 70; x <= WORLD_WIDTH - 140; x += 155) {
    if (clearOfStubs(x)) bottomSpots.push(x);
  }
  bottomSpots.forEach((x, i) => {
    if (i % 2 === 0) {
      poster(x, WORLD_HEIGHT - 158);
    } else {
      neon(x, WORLD_HEIGHT - 100, 128, 26, neonColors[(i + 1) % neonColors.length]);
    }
  });

  return { blocking, interactables, decor };
}
