import { COLORS } from "../../maps/OfficeMap.js";
import { shadeHexColor } from "../../utils/color.js";

const TILE_SIZE = 64;
const DEFAULT_ROBOT_COLOR = "#c24a34"; // original single-player red, used when no player color is set

export class Renderer {
  constructor(ctx) {
    this.ctx = ctx;
    this.colors = COLORS; // default palette; swapped per-area via setPalette()
  }

  /** Called whenever the active area changes so floor/furniture colors match the new room's atmosphere. */
  setPalette(colors) {
    this.colors = colors;
  }

  /**
   * Wipes the canvas before this frame's drawing. This must save/restore
   * around the transform reset — Game._resize() sets a devicePixelRatio
   * scale on the context once per resize, and every other draw call this
   * frame (camera.apply() included) depends on that scale still being
   * active. A bare `setTransform(1,0,0,1,0,0)` here would permanently wipe
   * that scale, leaving every subsequent draw this frame running in raw
   * physical-pixel space instead of CSS-pixel space — on any
   * devicePixelRatio>1 display that compresses the entire world into a
   * fraction of the canvas and leaves the rest as bare black canvas. That
   * reads exactly like "stretched walls / black edges / camera exposing
   * area outside the world," and it's a per-frame, every-room bug, not
   * something caused by world size or camera distance — hence save/restore
   * and clearing the real physical buffer size, not the CSS viewW/viewH.
   */
  clear(viewW, viewH) {
    const ctx = this.ctx;
    ctx.save();
    ctx.setTransform(1, 0, 0, 1, 0, 0);
    ctx.fillStyle = "#05070c";
    ctx.fillRect(0, 0, ctx.canvas.width, ctx.canvas.height);
    ctx.restore();
  }

  drawFloor(worldWidth, worldHeight, reflective = false) {
    const ctx = this.ctx;
    const cols = Math.ceil(worldWidth / TILE_SIZE);
    const rows = Math.ceil(worldHeight / TILE_SIZE);
    for (let r = 0; r < rows; r++) {
      // Clip the last row/col of tiles to the exact world bounds — since
      // world dimensions aren't exact multiples of TILE_SIZE, drawing
      // full-size tiles here would bleed floor past the outer walls at the
      // map's right/bottom edge, showing floor where it should be void.
      const tileH = Math.min(TILE_SIZE, worldHeight - r * TILE_SIZE);
      for (let c = 0; c < cols; c++) {
        const tileW = Math.min(TILE_SIZE, worldWidth - c * TILE_SIZE);
        ctx.fillStyle = (r + c) % 2 === 0 ? this.colors.floorA : this.colors.floorB;
        ctx.fillRect(c * TILE_SIZE, r * TILE_SIZE, tileW, tileH);
      }
    }

    // Shopping-mall tile sheen — one large diagonal gradient band drawn
    // once across the whole floor (not per-tile, so it's effectively free)
    // giving the polished/reflective look the atmosphere pass asked for.
    // Only ever used for the Park; Office's floor is untouched.
    if (reflective) {
      ctx.save();
      const sheen = ctx.createLinearGradient(0, 0, worldWidth * 0.4, worldHeight * 0.4);
      sheen.addColorStop(0, "rgba(255,255,255,0.05)");
      sheen.addColorStop(0.25, "rgba(255,255,255,0)");
      sheen.addColorStop(0.5, "rgba(255,255,255,0.035)");
      sheen.addColorStop(1, "rgba(255,255,255,0)");
      ctx.fillStyle = sheen;
      ctx.fillRect(0, 0, worldWidth, worldHeight);
      ctx.restore();
    }
  }

  drawDoorFrames(frames) {
    const ctx = this.ctx;
    for (const f of frames) {
      ctx.fillStyle = this.colors.doorFrame;
      ctx.globalAlpha = 0.55;
      ctx.fillRect(f.x, f.y, f.w, f.h);
      ctx.globalAlpha = 1;
    }
  }

  drawWalls(walls) {
    const ctx = this.ctx;
    for (const w of walls) {
      // Soft shadow beneath the wall for depth.
      ctx.fillStyle = "rgba(0,0,0,0.35)";
      ctx.fillRect(w.x, w.y + 6, w.w, w.h);

      ctx.fillStyle = this.colors.wall;
      ctx.fillRect(w.x, w.y, w.w, w.h);

      // Top highlight strip so walls read as slightly 3D from top-down.
      ctx.fillStyle = this.colors.wallTop;
      ctx.fillRect(w.x, w.y, w.w, Math.min(6, w.h));
    }
  }

  _shadow(x, y, w, h, offset = 6) {
    const ctx = this.ctx;
    ctx.save();
    ctx.fillStyle = "rgba(0,0,0,0.3)";
    ctx.beginPath();
    ctx.ellipse(x + w / 2, y + h + offset * 0.4, w * 0.55, h * 0.28, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();
  }

  _roundRect(x, y, w, h, r) {
    const ctx = this.ctx;
    ctx.beginPath();
    ctx.moveTo(x + r, y);
    ctx.arcTo(x + w, y, x + w, y + h, r);
    ctx.arcTo(x + w, y + h, x, y + h, r);
    ctx.arcTo(x, y + h, x, y, r);
    ctx.arcTo(x, y, x + w, y, r);
    ctx.closePath();
  }

  /**
   * Purely visual, non-blocking decoration (rugs, whiteboards, wall clocks,
   * windows). Drawn after the floor but before solid furniture, so rugs sit
   * under desks/chairs and wall decor reads as flat against the wall.
   */
  drawDecor(decor) {
    const ctx = this.ctx;
    for (const d of decor) {
      switch (d.type) {
        case "areaLabel":
          ctx.fillStyle=d.ink||"#b9c6cc";ctx.font="700 17px 'Courier New'";ctx.textAlign="center";ctx.fillText(d.label,d.x,d.y);break;
        case "rug":
          ctx.save();
          ctx.globalAlpha = 0.9;
          ctx.fillStyle = this.colors.rug;
          this._roundRect(d.x, d.y, d.w, d.h, 16);
          ctx.fill();
          ctx.strokeStyle = this.colors.rugBorder;
          ctx.lineWidth = 4;
          this._roundRect(d.x + 8, d.y + 8, d.w - 16, d.h - 16, 12);
          ctx.stroke();
          ctx.restore();
          break;
        case "whiteboard":
          ctx.fillStyle = this.colors.whiteboardFrame;
          this._roundRect(d.x - 3, d.y - 3, d.w + 6, d.h + 6, 4);
          ctx.fill();
          ctx.fillStyle = this.colors.whiteboard;
          this._roundRect(d.x, d.y, d.w, d.h, 3);
          ctx.fill();
          ctx.strokeStyle = this.colors.whiteboardInk;
          ctx.lineWidth = 2;
          ctx.beginPath();
          ctx.moveTo(d.x + d.w * 0.12, d.y + d.h * 0.35);
          ctx.lineTo(d.x + d.w * 0.5, d.y + d.h * 0.35);
          ctx.moveTo(d.x + d.w * 0.12, d.y + d.h * 0.6);
          ctx.lineTo(d.x + d.w * 0.75, d.y + d.h * 0.6);
          ctx.stroke();
          break;
        case "clock":
          ctx.fillStyle = this.colors.clockFace;
          ctx.beginPath();
          ctx.arc(d.x + d.w / 2, d.y + d.h / 2, d.w / 2, 0, Math.PI * 2);
          ctx.fill();
          ctx.strokeStyle = this.colors.clockRim;
          ctx.lineWidth = 2.5;
          ctx.stroke();
          ctx.strokeStyle = this.colors.clockRim;
          ctx.lineWidth = 2;
          ctx.beginPath();
          ctx.moveTo(d.x + d.w / 2, d.y + d.h / 2);
          ctx.lineTo(d.x + d.w / 2, d.y + d.h * 0.28);
          ctx.moveTo(d.x + d.w / 2, d.y + d.h / 2);
          ctx.lineTo(d.x + d.w * 0.68, d.y + d.h / 2);
          ctx.stroke();
          break;
        case "window":
          ctx.fillStyle = this.colors.windowFrame;
          this._roundRect(d.x - 4, d.y - 4, d.w + 8, d.h + 8, 4);
          ctx.fill();
          ctx.fillStyle = this.colors.windowGlass;
          this._roundRect(d.x, d.y, d.w, d.h, 2);
          ctx.fill();
          ctx.strokeStyle = this.colors.windowFrame;
          ctx.lineWidth = 3;
          ctx.beginPath();
          ctx.moveTo(d.x + d.w / 2, d.y);
          ctx.lineTo(d.x + d.w / 2, d.y + d.h);
          ctx.stroke();
          break;
        case "lamp":
          ctx.save();
          ctx.shadowColor = this.colors.lampGlow;
          ctx.shadowBlur = 26;
          ctx.fillStyle = this.colors.lampPost;
          ctx.fillRect(d.x + d.w / 2 - 2, d.y, 4, d.h * 2.4);
          ctx.fillStyle = this.colors.lampGlow;
          ctx.beginPath();
          ctx.arc(d.x + d.w / 2, d.y, d.w / 2, 0, Math.PI * 2);
          ctx.fill();
          ctx.restore();
          break;
        case "neonSign": {
          const glowColor = this.colors[d.color] || this.colors.neonPink;
          ctx.save();
          ctx.shadowColor = glowColor;
          ctx.shadowBlur = 18;
          ctx.strokeStyle = glowColor;
          ctx.lineWidth = 3;
          this._roundRect(d.x, d.y, d.w, d.h, d.h / 2);
          ctx.stroke();
          ctx.globalAlpha = 0.25;
          ctx.fillStyle = glowColor;
          this._roundRect(d.x, d.y, d.w, d.h, d.h / 2);
          ctx.fill();
          ctx.restore();
          break;
        }
        case "poster":
          ctx.fillStyle = this.colors.posterFrame || "#1a1420";
          this._roundRect(d.x - 3, d.y - 3, d.w + 6, d.h + 6, 3);
          ctx.fill();
          ctx.fillStyle = this.colors.posterBody || "#7a3fa0";
          this._roundRect(d.x, d.y, d.w, d.h, 2);
          ctx.fill();
          // A couple of simple blocky "print" shapes — reads as a retro
          // programming poster without needing an actual image asset.
          ctx.fillStyle = this.colors.posterAccent || "#ffe14f";
          ctx.fillRect(d.x + d.w * 0.18, d.y + d.h * 0.16, d.w * 0.64, d.h * 0.1);
          ctx.fillRect(d.x + d.w * 0.18, d.y + d.h * 0.34, d.w * 0.42, d.h * 0.1);
          ctx.globalAlpha = 0.7;
          ctx.fillRect(d.x + d.w * 0.18, d.y + d.h * 0.52, d.w * 0.64, d.h * 0.3);
          ctx.globalAlpha = 1;
          break;
        case "neonStripV": {
          const glowColor = this.colors[d.color] || this.colors.neonCyan;
          ctx.save();
          ctx.shadowColor = glowColor;
          ctx.shadowBlur = 14;
          ctx.fillStyle = glowColor;
          this._roundRect(d.x, d.y, d.w, d.h, d.w / 2);
          ctx.fill();
          ctx.globalAlpha = 0.3;
          ctx.fillRect(d.x - d.w, d.y, d.w * 3, d.h);
          ctx.globalAlpha = 1;
          ctx.restore();
          break;
        }
        default:
          break;
      }
    }
  }

  drawFurniture(blocking, interactables, activeInteractableId) {
    const ctx = this.ctx;

    for (const f of blocking) {
      this._shadow(f.x, f.y, f.w, f.h);
      switch (f.type) {
        case 'gameCabinet':case 'gameTable':case 'puzzleConsole':case 'prizeShelf':case 'toolCart':case 'snackCounter':case 'poolTable':
          this._drawArcadeProp(f,interactables.some(t=>t.id===f.taskId&&t.id===activeInteractableId));break;
        case "desk":
          ctx.fillStyle = this.colors.deskEdge;
          this._roundRect(f.x - 2, f.y - 2, f.w + 4, f.h + 4, 8);
          ctx.fill();
          ctx.fillStyle = this.colors.desk;
          this._roundRect(f.x, f.y, f.w, f.h, 7);
          ctx.fill();
          break;
        case "chair":
          ctx.fillStyle = this.colors.chair;
          this._roundRect(f.x, f.y, f.w, f.h, 10);
          ctx.fill();
          ctx.fillStyle = this.colors.chairSeat;
          this._roundRect(f.x + 5, f.y + 5, f.w - 10, f.h - 10, 7);
          ctx.fill();
          break;
        case "plant":
          ctx.fillStyle = this.colors.plantPot;
          this._roundRect(f.x + f.w * 0.22, f.y + f.h * 0.55, f.w * 0.56, f.h * 0.4, 4);
          ctx.fill();
          ctx.fillStyle = this.colors.plantLeafDark;
          ctx.beginPath();
          ctx.ellipse(f.x + f.w / 2, f.y + f.h * 0.38, f.w * 0.42, f.h * 0.42, 0, 0, Math.PI * 2);
          ctx.fill();
          ctx.fillStyle = this.colors.plantLeaf;
          ctx.beginPath();
          ctx.ellipse(f.x + f.w * 0.42, f.y + f.h * 0.3, f.w * 0.3, f.h * 0.32, 0, 0, Math.PI * 2);
          ctx.fill();
          break;
        case "printer":
          ctx.fillStyle = this.colors.printerDark;
          this._roundRect(f.x, f.y, f.w, f.h, 6);
          ctx.fill();
          ctx.fillStyle = this.colors.printer;
          this._roundRect(f.x + 4, f.y + 4, f.w - 8, f.h * 0.5, 5);
          ctx.fill();
          ctx.fillStyle = "#4c576f";
          ctx.fillRect(f.x + f.w * 0.3, f.y + f.h - 12, f.w * 0.4, 6);
          break;
        case "shelf":
          ctx.fillStyle = this.colors.shelf;
          this._roundRect(f.x, f.y, f.w, f.h, 5);
          ctx.fill();
          ctx.fillStyle = this.colors.shelfItem;
          for (let i = 0; i < Math.floor(f.w / 26); i++) {
            ctx.fillRect(f.x + 6 + i * 26, f.y + 6, 14, f.h - 12);
          }
          break;
        case "server":
          ctx.fillStyle = this.colors.server;
          this._roundRect(f.x, f.y, f.w, f.h, 6);
          ctx.fill();
          for (let i = 0; i < 4; i++) {
            ctx.fillStyle = i % 2 === 0 ? this.colors.serverLight : "#3a4359";
            ctx.fillRect(f.x + 6, f.y + 8 + i * 18, f.w - 12, 8);
          }
          break;
        case "sofa":
          ctx.fillStyle = this.colors.sofaEdge;
          this._roundRect(f.x - 2, f.y - 2, f.w + 4, f.h + 4, 12);
          ctx.fill();
          ctx.fillStyle = this.colors.sofa;
          this._roundRect(f.x, f.y, f.w, f.h, 10);
          ctx.fill();
          // Two seat cushions.
          ctx.fillStyle = this.colors.sofaCushion;
          this._roundRect(f.x + 6, f.y + 6, f.w / 2 - 9, f.h - 12, 7);
          ctx.fill();
          this._roundRect(f.x + f.w / 2 + 3, f.y + 6, f.w / 2 - 9, f.h - 12, 7);
          ctx.fill();
          break;
        case "watercooler":
          ctx.fillStyle = this.colors.coolerBody;
          this._roundRect(f.x, f.y + f.h * 0.3, f.w, f.h * 0.7, 5);
          ctx.fill();
          ctx.fillStyle = this.colors.coolerBottle;
          ctx.beginPath();
          ctx.ellipse(f.x + f.w / 2, f.y + f.h * 0.28, f.w * 0.44, f.h * 0.28, 0, 0, Math.PI * 2);
          ctx.fill();
          ctx.fillStyle = "rgba(255,255,255,0.25)";
          ctx.fillRect(f.x + f.w * 0.2, f.y + f.h * 0.5, f.w * 0.15, f.h * 0.35);
          break;
        case "table":
          ctx.fillStyle = this.colors.table;
          ctx.beginPath();
          ctx.ellipse(f.x + f.w / 2, f.y + f.h / 2, f.w / 2 + 4, f.h / 2 + 4, 0, 0, Math.PI * 2);
          ctx.fill();
          ctx.fillStyle = this.colors.tableTop;
          ctx.beginPath();
          ctx.ellipse(f.x + f.w / 2, f.y + f.h / 2, f.w / 2 - 4, f.h / 2 - 4, 0, 0, Math.PI * 2);
          ctx.fill();
          break;
        case "tree": {
          const cx = f.x + f.w / 2;
          const cy = f.y + f.h / 2;
          ctx.fillStyle = this.colors.treeTrunk;
          this._roundRect(cx - f.w * 0.09, cy, f.w * 0.18, f.h * 0.45, 3);
          ctx.fill();
          ctx.fillStyle = this.colors.treeCanopyDark;
          ctx.beginPath();
          ctx.arc(cx, cy - f.h * 0.05, f.w * 0.56, 0, Math.PI * 2);
          ctx.fill();
          ctx.fillStyle = this.colors.treeCanopy;
          ctx.beginPath();
          ctx.arc(cx - f.w * 0.12, cy - f.h * 0.22, f.w * 0.44, 0, Math.PI * 2);
          ctx.fill();
          break;
        }
        case "bench":
          ctx.fillStyle = this.colors.benchLeg;
          ctx.fillRect(f.x + 4, f.y + f.h - 8, f.w - 8, 8);
          ctx.fillStyle = this.colors.benchWood;
          this._roundRect(f.x, f.y, f.w, f.h * 0.55, 3);
          ctx.fill();
          break;
        case "fountain":
          ctx.fillStyle = this.colors.fountainRim;
          ctx.beginPath();
          ctx.arc(f.x + f.w / 2, f.y + f.h / 2, f.w / 2, 0, Math.PI * 2);
          ctx.fill();
          ctx.fillStyle = this.colors.fountainWater;
          ctx.beginPath();
          ctx.arc(f.x + f.w / 2, f.y + f.h / 2, f.w / 2 - 12, 0, Math.PI * 2);
          ctx.fill();
          ctx.fillStyle = this.colors.fountainRim;
          ctx.beginPath();
          ctx.arc(f.x + f.w / 2, f.y + f.h / 2, f.w * 0.16, 0, Math.PI * 2);
          ctx.fill();
          break;
        case "oldComputerDesk":
          ctx.fillStyle = this.colors.oldComputerBody;
          this._roundRect(f.x, f.y, f.w, f.h, 5);
          ctx.fill();
          break;
        case "arcadeCabinetBody": {
          const w = f.w;
          const h = f.h;
          this._shadow(f.x, f.y, w, h, 4);

          // Glowing marquee header — alternates color per cabinet via f.accent.
          const accent = this.colors[f.accent] || this.colors.neonPink;
          ctx.save();
          ctx.shadowColor = accent;
          ctx.shadowBlur = 10;
          ctx.fillStyle = accent;
          this._roundRect(f.x, f.y, w, h * 0.13, 3);
          ctx.fill();
          ctx.restore();

          // Cabinet body.
          const bodyGrad = ctx.createLinearGradient(0, f.y, 0, f.y + h);
          bodyGrad.addColorStop(0, shadeHexColor(this.colors.arcadeBody, 18));
          bodyGrad.addColorStop(1, shadeHexColor(this.colors.arcadeBody, -22));
          ctx.fillStyle = bodyGrad;
          this._roundRect(f.x, f.y + h * 0.1, w, h * 0.9, 4);
          ctx.fill();
          ctx.strokeStyle = shadeHexColor(this.colors.arcadeBody, -45);
          ctx.lineWidth = 1.5;
          this._roundRect(f.x, f.y + h * 0.1, w, h * 0.9, 4);
          ctx.stroke();

          // Screen recess — deliberately plain/dark here; Renderer draws the
          // actual glowing screen as a separate interactable on top of this
          // exact spot, so it can brighten independently when a player is near.
          ctx.fillStyle = "#0a0812";
          this._roundRect(f.x + w * 0.12, f.y + h * 0.2, w * 0.76, h * 0.32, 3);
          ctx.fill();

          // Control panel.
          ctx.fillStyle = shadeHexColor(this.colors.arcadeBody, -30);
          this._roundRect(f.x + w * 0.08, f.y + h * 0.58, w * 0.84, h * 0.16, 3);
          ctx.fill();

          // Joystick.
          ctx.strokeStyle = "#8a8a9a";
          ctx.lineWidth = 2.5;
          ctx.beginPath();
          ctx.moveTo(f.x + w * 0.28, f.y + h * 0.66);
          ctx.lineTo(f.x + w * 0.28, f.y + h * 0.58);
          ctx.stroke();
          ctx.fillStyle = "#2a2a34";
          ctx.beginPath();
          ctx.arc(f.x + w * 0.28, f.y + h * 0.66, w * 0.07, 0, Math.PI * 2);
          ctx.fill();

          // Buttons.
          ["neonCyan", "neonYellow"].forEach((c, i) => {
            ctx.fillStyle = this.colors[c];
            ctx.beginPath();
            ctx.arc(f.x + w * (0.55 + i * 0.16), f.y + h * 0.66, w * 0.055, 0, Math.PI * 2);
            ctx.fill();
          });

          // Coin slot.
          ctx.fillStyle = "#12101a";
          this._roundRect(f.x + w * 0.32, f.y + h * 0.84, w * 0.36, h * 0.07, 2);
          ctx.fill();
          break;
        }
        case "column":
          ctx.fillStyle = this.colors.columnBody;
          ctx.beginPath();
          ctx.arc(f.x + f.w / 2, f.y + f.h / 2, f.w / 2, 0, Math.PI * 2);
          ctx.fill();
          ctx.fillStyle = this.colors.columnTop;
          ctx.beginPath();
          ctx.arc(f.x + f.w / 2, f.y + f.h / 2, f.w / 2 - 7, 0, Math.PI * 2);
          ctx.fill();
          break;
        case "fence":
          ctx.save();
          ctx.globalAlpha = 0.85;
          ctx.fillStyle = this.colors.fence;
          this._roundRect(f.x, f.y, f.w, f.h, Math.min(f.w, f.h) / 2);
          ctx.fill();
          ctx.restore();
          break;
        case "arcadeMachine":
          ctx.fillStyle = this.colors.arcadeBody;
          this._roundRect(f.x, f.y, f.w, f.h, 5);
          ctx.fill();
          ctx.save();
          ctx.shadowColor = this.colors.neonCyan;
          ctx.shadowBlur = 12;
          ctx.fillStyle = this.colors.neonCyan;
          this._roundRect(f.x + f.w * 0.14, f.y + f.h * 0.12, f.w * 0.72, f.h * 0.4, 3);
          ctx.fill();
          ctx.restore();
          ctx.fillStyle = "#1a1524";
          this._roundRect(f.x + f.w * 0.2, f.y + f.h * 0.62, f.w * 0.6, f.h * 0.22, 3);
          ctx.fill();
          break;
        case "basketballArcade":
          ctx.fillStyle = this.colors.arcadeBody;
          this._roundRect(f.x, f.y, f.w, f.h, 6);
          ctx.fill();
          ctx.save();
          ctx.shadowColor = this.colors.neonYellow;
          ctx.shadowBlur = 10;
          ctx.fillStyle = this.colors.neonYellow;
          ctx.beginPath();
          ctx.arc(f.x + f.w / 2, f.y + f.h * 0.16, f.w * 0.26, 0, Math.PI * 2);
          ctx.fill();
          ctx.restore();
          break;
        case "airHockey":
          ctx.fillStyle = this.colors.arcadeBody;
          this._roundRect(f.x, f.y, f.w, f.h, 6);
          ctx.fill();
          ctx.fillStyle = this.colors.neonCyan;
          this._roundRect(f.x + 6, f.y + 6, f.w - 12, f.h - 12, 4);
          ctx.globalAlpha = 0.5;
          ctx.fill();
          ctx.globalAlpha = 1;
          break;
        case "clawMachine":
          ctx.fillStyle = this.colors.clawMachineBody;
          this._roundRect(f.x, f.y, f.w, f.h, 6);
          ctx.fill();
          ctx.fillStyle = this.colors.clawMachineGlass;
          this._roundRect(f.x + 4, f.y + 6, f.w - 8, f.h * 0.6, 3);
          ctx.fill();
          ctx.save();
          ctx.shadowColor = this.colors.neonPink;
          ctx.shadowBlur = 10;
          ctx.fillStyle = this.colors.neonPink;
          ctx.fillRect(f.x + f.w * 0.3, f.y - 4, f.w * 0.4, 5);
          ctx.restore();
          break;
        case "vendingMachine":
          ctx.fillStyle = this.colors.vendingBody;
          this._roundRect(f.x, f.y, f.w, f.h, 4);
          ctx.fill();
          ctx.save();
          ctx.shadowColor = this.colors.vendingGlow;
          ctx.shadowBlur = 10;
          ctx.fillStyle = this.colors.vendingGlow;
          ctx.globalAlpha = 0.75;
          this._roundRect(f.x + 4, f.y + 4, f.w - 8, f.h * 0.55, 3);
          ctx.fill();
          ctx.restore();
          break;
        case "ticketMachine":
          ctx.fillStyle = this.colors.ticketBody;
          this._roundRect(f.x, f.y, f.w, f.h, 5);
          ctx.fill();
          ctx.fillStyle = this.colors.neonYellow;
          this._roundRect(f.x + 5, f.y + 5, f.w - 10, 10, 2);
          ctx.fill();
          break;
        case "prizeCounter":
          ctx.fillStyle = this.colors.counter;
          this._roundRect(f.x, f.y, f.w, f.h, 8);
          ctx.fill();
          ctx.fillStyle = this.colors.counterTop;
          this._roundRect(f.x, f.y, f.w, f.h * 0.3, 8);
          ctx.fill();
          break;
        default:
          ctx.fillStyle = "#666";
          ctx.fillRect(f.x, f.y, f.w, f.h);
      }
    }

    // Computers/terminals — drawn on top of their desk, glow if in range.
    for (const term of interactables) {
      if(term.type==='arcadeActivity')continue;
      const active = term.id === activeInteractableId;

      if (term.type === "arcadeScreen") {
        // The cabinet body (with its dark screen recess) was already drawn
        // in the blocking-furniture pass at this same spot — this only
        // draws the glowing screen content on top of it, so the glow can
        // brighten independently as the player approaches without redrawing
        // the whole cabinet.
        const glow = active ? this.colors.monitorGlowOn : this.colors.monitorGlowOff;
        ctx.fillStyle = glow;
        this._roundRect(term.x, term.y, term.w, term.h, 2);
        ctx.fill();
        if (active) {
          ctx.save();
          ctx.shadowColor = this.colors.monitorGlowOn;
          ctx.shadowBlur = 22;
          ctx.fillStyle = this.colors.monitorGlowOn;
          this._roundRect(term.x, term.y, term.w, term.h, 2);
          ctx.fill();
          ctx.restore();
        }
        // A couple of thin scanlines — reads as "screen," not just a glowing box.
        ctx.strokeStyle = "rgba(0,0,0,0.35)";
        ctx.lineWidth = 1;
        for (let i = 1; i < 3; i++) {
          const ly = term.y + (term.h * i) / 3;
          ctx.beginPath();
          ctx.moveTo(term.x + 2, ly);
          ctx.lineTo(term.x + term.w - 2, ly);
          ctx.stroke();
        }
        continue;
      }

      this._shadow(term.x, term.y, term.w, term.h, 3);
      ctx.fillStyle = this.colors.monitor;
      this._roundRect(term.x - 3, term.y - 3, term.w + 6, term.h + 6, 4);
      ctx.fill();

      const glow = active ? this.colors.monitorGlowOn : this.colors.monitorGlowOff;
      ctx.fillStyle = glow;
      this._roundRect(term.x, term.y, term.w, term.h, 3);
      ctx.fill();

      if (active) {
        ctx.save();
        ctx.shadowColor = this.colors.monitorGlowOn;
        ctx.shadowBlur = 22;
        ctx.fillStyle = this.colors.monitorGlowOn;
        this._roundRect(term.x, term.y, term.w, term.h, 3);
        ctx.fill();
        ctx.restore();
      }
    }
  }


  _drawArcadeProp(f,active) {
    const c=this.ctx,{x,y,w,h}=f;
    const box=(dx,dy,bw,bh,color)=>{c.fillStyle=color;this._roundRect(x+dx,y+dy,bw,bh,3);c.fill();};
    if(['gameCabinet','puzzleConsole','gameTable'].includes(f.type)){
      box(0,0,w,h,f.type==='gameTable'?'#86674c':'#465366');
      box(4,4,w-8,f.type==='gameCabinet'?h*.6:h*.65,active?'#59737c':'#2b3c4a');
      const symbols={memory:'1 2 3',maze:'→ ⚑',lights:'○ ● ○',pairs:'A ? A'};
      c.fillStyle='#ccd8c6';c.font='bold '+(w>90?13:10)+'px "Courier New"';c.textAlign='center';
      c.fillText(symbols[f.kind]||'PLAY',x+w/2,y+h*.3);
      box(8,h*.73,w-16,7,'#9d9c88');
      for(let i=0;i<3;i++)box(10+i*(w-20)/3,h*.74,5,5,['#b78271','#95a78c','#a29c78'][i]);
      if(f.type==='gameTable'){box(8,h-3,9,13,'#4a3e34');box(w-17,h-3,9,13,'#4a3e34');}
    }else if(f.type==='poolTable'){
      box(0,0,w,h,'#795d43');box(7,7,w-14,h-14,'#4b7567');
      c.strokeStyle='#a1b0a0';c.lineWidth=1;c.strokeRect(x+12,y+12,w-24,h-24);
      for(let i=0;i<5;i++){c.fillStyle=['#d7cfb2','#9e695c','#7b9ab6'][i%3];c.beginPath();c.arc(x+30+i*18,y+25+i%2*20,4,0,Math.PI*2);c.fill();}
      c.strokeStyle='#c3ab79';c.lineWidth=3;c.beginPath();c.moveTo(x+w-25,y+12);c.lineTo(x+20,y+h-12);c.stroke();
    }else if(f.type==='prizeShelf'){
      box(0,0,w,h,'#6b5644');box(4,4,w-8,h-8,'#b09471');
      for(let i=0;i<Math.floor(w/28);i++){box(8+i*28,10,16,20,['#829a85','#aa8390','#879db4','#c3ac75'][i%4]);box(11+i*28,7,10,6,'#d0c7a4');}
    }else if(f.type==='toolCart'){
      box(0,0,w,h,'#536570');box(4,4,w-8,15,'#8d989b');box(10,25,w-20,5,'#303e4b');box(10,39,w-20,5,'#303e4b');
      for(let i=0;i<3;i++)box(9+i*18,6,8,9,['#a8806e','#a99d77','#7196a2'][i]);
    }else{
      box(0,0,w,h,'#7b6552');box(0,0,w,16,'#b79b76');
      for(let i=0;i<3;i++){box(14+i*30,22,16,18,'#d1ccb7');box(17+i*30,24,10,5,'#665246');}
      box(w-36,22,24,h-28,'#627885');
    }
    if(f.taskId){c.fillStyle=active?'#d8e6d6':'#aebdb7';c.font='bold 10px "Courier New"';c.textAlign='center';c.fillText(f.type==='puzzleConsole'?'KIRISH':'E · PLAY',x+w/2,y-9);}
  }

  drawPlayer(player) {
    const ctx = this.ctx;
    const r = player.radius;
    const color = player.color || DEFAULT_ROBOT_COLOR;

    // Ground shadow.
    ctx.save();
    ctx.fillStyle = "rgba(0,0,0,0.4)";
    ctx.beginPath();
    ctx.ellipse(player.x, player.y + r * 0.95, r * 1.05, r * 0.42, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();

    // Pick a discrete view from the last movement direction: walking toward
    // the bottom of the room shows the robot's face, walking toward the top
    // shows its back, and left/right shows a mirrored side profile.
    const facing = player.facing;
    let view = "front";
    let mirror = 1;
    if (Math.abs(facing.y) >= Math.abs(facing.x)) {
      view = facing.y < 0 ? "back" : "front";
    } else {
      view = "side";
      mirror = facing.x < 0 ? -1 : 1;
    }

    ctx.save();
    ctx.translate(player.x, player.y);
    ctx.scale(mirror, 1);

    const w = r * 2.3;
    const h = r * 2.4;

    if (view === "side") {
      this._drawRobotSide(w, h, color, player.moving);
    } else if (view === "back") {
      this._drawRobotBack(w, h, color, player.moving);
    } else {
      this._drawRobotFront(w, h, color, player.moving);
    }

    ctx.restore();

    if (player.nickname) {
      this._drawNicknamePill(player.x, player.y - h / 2 - 14, player.nickname, player.isLocal);
    }
  }

  /** Nickname label floating above a robot's head, matching the lobby's pill style. */
  _drawNicknamePill(x, y, nickname, isLocal) {
    const ctx = this.ctx;
    ctx.save();
    ctx.font = "600 13px 'Segoe UI', Inter, sans-serif";
    const textWidth = ctx.measureText(nickname).width;
    const pillW = textWidth + 18;
    const pillH = 22;
    ctx.fillStyle = "rgba(10,14,23,0.78)";
    this._roundRect(x - pillW / 2, y - pillH, pillW, pillH, 10);
    ctx.fill();
    if (isLocal) {
      ctx.lineWidth = 1.5;
      ctx.strokeStyle = "rgba(255,255,255,0.4)";
      ctx.stroke();
    }
    ctx.fillStyle = "#eef2ff";
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    ctx.fillText(nickname, x, y - pillH / 2);
    ctx.restore();
  }

  /** Two small stepping feet — alternate lift/slide while moving, still when idle. */
  _drawRobotFeet(w, h, moving) {
    const ctx = this.ctx;
    const t = performance.now();
    const swing = moving ? Math.sin(t / 110) : 0;
    const liftL = moving ? Math.max(0, swing) * h * 0.055 : 0;
    const liftR = moving ? Math.max(0, -swing) * h * 0.055 : 0;
    const slide = moving ? swing * w * 0.05 : 0;

    ctx.fillStyle = "#2a2e38";
    this._roundRect(-w * 0.28 + slide, h * 0.4 - liftL, w * 0.2, h * 0.16, 6);
    ctx.fill();
    this._roundRect(w * 0.08 - slide, h * 0.4 - liftR, w * 0.2, h * 0.16, 6);
    ctx.fill();
  }

  /** Small rounded nub standing in for an arm — a stub bump on one flank, matching the reference sheet. */
  _drawRobotArmNub(side, w, h) {
    const ctx = this.ctx;
    const nx = side * w * 0.53;
    const ny = h * 0.02;
    const nw = w * 0.16;
    const nh = h * 0.3;

    ctx.fillStyle = "#2c313d";
    this._roundRect(nx - nw / 2, ny - nh / 2, nw, nh, nw * 0.45);
    ctx.fill();
    ctx.save();
    ctx.globalAlpha = 0.12;
    ctx.fillStyle = "#ffffff";
    this._roundRect(nx - nw / 2 + nw * 0.15, ny - nh / 2 + nh * 0.1, nw * 0.3, nh * 0.35, 3);
    ctx.fill();
    ctx.restore();
  }

  /** Two antenna stalks with glowing, color-matched tips. */
  _drawRobotAntennas(w, h, color) {
    const ctx = this.ctx;
    const tipColor = shadeHexColor(color, 90);
    ctx.strokeStyle = "#aab2c2";
    ctx.lineCap = "round";
    [-w * 0.14, w * 0.14].forEach((ax) => {
      const baseY = -h / 2 + h * 0.05;
      const tipY = baseY - h * 0.2;
      ctx.lineWidth = Math.max(1.4, w * 0.045);
      ctx.beginPath();
      ctx.moveTo(ax, baseY);
      ctx.lineTo(ax, tipY);
      ctx.stroke();

      ctx.save();
      ctx.shadowColor = tipColor;
      ctx.shadowBlur = w * 0.14;
      ctx.fillStyle = tipColor;
      ctx.beginPath();
      ctx.arc(ax, tipY, w * 0.06, 0, Math.PI * 2);
      ctx.fill();
      ctx.restore();
    });
  }

  /** The soft rounded-square body shared by every view, tinted per-player. */
  _drawRobotShell(w, h, color) {
    const ctx = this.ctx;
    const radius = Math.min(w, h) * 0.4;
    const shellGrad = ctx.createLinearGradient(0, -h / 2, 0, h / 2);
    shellGrad.addColorStop(0, shadeHexColor(color, 40));
    shellGrad.addColorStop(0.55, color);
    shellGrad.addColorStop(1, shadeHexColor(color, -30));
    this._roundRect(-w / 2, -h / 2, w, h, radius);
    ctx.fillStyle = shellGrad;
    ctx.fill();
    ctx.lineWidth = Math.max(1, w * 0.035);
    ctx.strokeStyle = shadeHexColor(color, -55);
    ctx.stroke();

    // Soft top gloss highlight, like the reference sheet's glossy plastic look.
    ctx.save();
    ctx.globalAlpha = 0.16;
    ctx.fillStyle = "#ffffff";
    ctx.beginPath();
    ctx.ellipse(-w * 0.08, -h * 0.3, w * 0.3, h * 0.13, -0.15, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();
  }

  /** Small back-panel greeble — status lines and a warning light, seen from the side/back. */
  _drawRobotSidePanel(w, h, color) {
    const ctx = this.ctx;
    const px = w * 0.4;
    const py = -h * 0.14;
    const pw = w * 0.18;
    const ph = h * 0.3;
    ctx.fillStyle = shadeHexColor(color, -55);
    this._roundRect(px - 2, py - 2, pw + 4, ph + 4, 3);
    ctx.fill();
    ctx.fillStyle = "#2c4a56";
    this._roundRect(px, py, pw, ph, 2);
    ctx.fill();
    ctx.strokeStyle = "#5ee2ff";
    ctx.lineWidth = 1.4;
    for (let i = 1; i < 3; i++) {
      ctx.beginPath();
      ctx.moveTo(px + pw * 0.12, py + (ph * i) / 3);
      ctx.lineTo(px + pw * 0.88, py + (ph * i) / 3);
      ctx.stroke();
    }
    ctx.fillStyle = "#ff7a45";
    ctx.beginPath();
    ctx.arc(px + pw / 2, py + ph + 7, w * 0.025, 0, Math.PI * 2);
    ctx.fill();
  }

  /** Two small dark eyebrow marks above the eye — the reference sheet's "surprised" expression. */
  _drawRobotEyebrows(w, h) {
    const ctx = this.ctx;
    ctx.fillStyle = "#181b22";
    [-1, 1].forEach((side) => {
      ctx.save();
      ctx.translate(side * w * 0.17, -h * 0.27);
      ctx.rotate(side * 0.35);
      ctx.beginPath();
      ctx.ellipse(0, 0, w * 0.06, w * 0.022, 0, 0, Math.PI * 2);
      ctx.fill();
      ctx.restore();
    });
  }

  /** The big single eye that dominates the front view. */
  _drawRobotEye(w, h) {
    const ctx = this.ctx;
    const cy = h * 0.06;
    const rOuter = w * 0.3;

    ctx.fillStyle = "#12151c";
    ctx.beginPath();
    ctx.arc(0, cy, rOuter, 0, Math.PI * 2);
    ctx.fill();

    ctx.fillStyle = "#f4f8ff";
    ctx.beginPath();
    ctx.arc(0, cy, rOuter * 0.8, 0, Math.PI * 2);
    ctx.fill();

    ctx.fillStyle = "#12151c";
    ctx.beginPath();
    ctx.arc(0, cy, rOuter * 0.46, 0, Math.PI * 2);
    ctx.fill();

    ctx.fillStyle = "rgba(255,255,255,0.9)";
    ctx.beginPath();
    ctx.arc(-rOuter * 0.16, cy - rOuter * 0.16, rOuter * 0.13, 0, Math.PI * 2);
    ctx.fill();
  }

  /** Front view: full face — eyebrows, big eye, antennas, side panel. Matches the reference sheet's FRONT pose. */
  _drawRobotFront(w, h, color, moving) {
    this._drawRobotArmNub(-1, w, h);
    this._drawRobotArmNub(1, w, h);
    this._drawRobotFeet(w, h, moving);
    this._drawRobotShell(w, h, color);
    this._drawRobotAntennas(w, h, color);
    this._drawRobotSidePanel(w, h, color);
    this._drawRobotEyebrows(w, h);
    this._drawRobotEye(w, h);
  }

  /** Back view: plain shell, antennas, a faint seam — no face, matching the reference sheet's flat BACK pose. */
  _drawRobotBack(w, h, color, moving) {
    const ctx = this.ctx;

    this._drawRobotArmNub(-1, w, h);
    this._drawRobotArmNub(1, w, h);
    this._drawRobotFeet(w, h, moving);
    this._drawRobotShell(w, h, color);
    this._drawRobotAntennas(w, h, color);

    ctx.fillStyle='#1c262c';ctx.fillRect(-w*.24,-h*.2,w*.48,h*.48);
    ctx.fillStyle='#64737c';ctx.fillRect(-w*.19,-h*.15,w*.38,h*.37);
    ctx.fillStyle='#8aa88f';for(let i=0;i<3;i++)ctx.fillRect(-w*.12,-h*.1+i*h*.09,w*.24,h*.055);
    // Faint centre seam — the only back-of-head detail on the reference sheet.
    ctx.strokeStyle = shadeHexColor(color, -35);
    ctx.lineWidth = Math.max(1, w * 0.02);
    ctx.beginPath();
    ctx.moveTo(0, -h * 0.32);
    ctx.lineTo(0, h * 0.3);
    ctx.stroke();
  }

  /** Side view: narrower silhouette, one antenna set, one arm nub, side panel prominent. */
  _drawRobotSide(w, h, color, moving) {
    const sw = w * 0.68;

    this._drawRobotArmNub(1, sw, h);
    this._drawRobotFeet(sw, h, moving);
    this._drawRobotShell(sw, h, color);
    this._drawRobotAntennas(sw, h, color);
    this._drawRobotSidePanel(sw, h, color);
  }

  /** Soft radial vignette centred on the player for atmosphere/depth. */
  /** Draws a gate's frame plus a locked (padlock + progress) or unlocked (glowing) state. */
  drawGateStatus(gate, locked, completed, total) {
    const ctx = this.ctx;
    const cx = gate.x + gate.w / 2;
    const cy = gate.y + gate.h / 2;

    ctx.save();
    if (locked) {
      ctx.fillStyle = "rgba(255,90,90,0.16)";
      ctx.fillRect(gate.x, gate.y, gate.w, gate.h);
      ctx.strokeStyle = "rgba(255,120,120,0.5)";
      ctx.lineWidth = 2;
      ctx.strokeRect(gate.x, gate.y, gate.w, gate.h);

      // Small padlock glyph.
      ctx.fillStyle = "#ffdada";
      this._roundRect(cx - 9, cy - 2, 18, 14, 3);
      ctx.fill();
      ctx.strokeStyle = "#ffdada";
      ctx.lineWidth = 2.5;
      ctx.beginPath();
      ctx.arc(cx, cy - 6, 7, Math.PI, 0);
      ctx.stroke();

      ctx.font = "700 13px 'Segoe UI', Inter, sans-serif";
      ctx.textAlign = "center";
      ctx.fillStyle = "#ffdada";
      ctx.fillText(`${completed}/${total}`, cx, cy + 30);
    } else {
      ctx.save();
      ctx.shadowColor = "#7ee0c3";
      ctx.shadowBlur = 30;
      ctx.fillStyle = "rgba(126,224,195,0.25)";
      ctx.fillRect(gate.x, gate.y, gate.w, gate.h);
      ctx.restore();
      ctx.strokeStyle = "rgba(126,224,195,0.7)";
      ctx.lineWidth = 2;
      ctx.strokeRect(gate.x, gate.y, gate.w, gate.h);
    }
    ctx.restore();
  }

  /**
   * Builds the fill path for a light polygon: the origin point plus every
   * ray-cast rim point returned by castLightCone, in order — this is what
   * makes it a true forward-only pie shape (never a circle/ellipse) that
   * also stops dead at any wall it hits.
   */
  _tracePolygonPath(ctx, ox, oy, points) {
    ctx.beginPath();
    ctx.moveTo(ox, oy);
    for (const p of points) ctx.lineTo(p.x, p.y);
    ctx.closePath();
  }

  /**
   * A real light source living in the world (unlike drawAmbientLighting's
   * screen-space cutout, which only ever affects the *local* player's own
   * view). This is how other players' flashlights become visible to you in
   * the dark. Additive ("lighter") blending means two overlapping beams
   * brighten each other naturally instead of one just painting over the
   * other. `points` is a pre-cast wall-occluded polygon (see
   * LightingSystem.castLightCone) — computed once per beam per frame in
   * Game.js and reused here and (for the local player) in
   * drawAmbientLighting, rather than raycasting twice for the same beam.
   */
  drawFlashlightGlow(ox, oy, points, range) {
    const ctx = this.ctx;
    ctx.save();
    ctx.globalCompositeOperation = "lighter";
    this._tracePolygonPath(ctx, ox, oy, points);
    const grad = ctx.createRadialGradient(ox, oy, 0, ox, oy, Math.max(1, range));
    grad.addColorStop(0, "rgba(255,250,235,0.15)");
    grad.addColorStop(0.3, "rgba(255,230,180,0.1)");
    grad.addColorStop(0.6, "rgba(255,200,120,0.05)");
    grad.addColorStop(0.85, "rgba(255,160,80,0.02)");
    grad.addColorStop(1, "rgba(255,140,60,0)");
    ctx.fillStyle = grad;
    ctx.fill();
    ctx.restore();
  }

  /** Faint drifting motes, only ever meaningfully visible once revealed inside a flashlight beam. */
  drawDustParticles(particles) {
    if (!particles || particles.length === 0) return;
    const ctx = this.ctx;
    ctx.save();
    ctx.globalCompositeOperation = "lighter";
    for (const p of particles) {
      ctx.fillStyle = `rgba(255,244,222,${p.alpha})`;
      ctx.beginPath();
      ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
      ctx.fill();
    }
    ctx.restore();
  }

  /**
   * Builds the current frame's darkness+flashlight-holes on an isolated
   * offscreen canvas, then composites the finished result onto the main
   * canvas as a single image. This indirection is required, not
   * decorative: a single shared 2D canvas buffer has no concept of
   * "layers" to reveal later. Drawing an opaque darkness rect straight
   * onto the canvas the world was just drawn on overwrites those pixels
   * outright, and a later destination-out "erase" can only reveal the
   * canvas element's own transparent/CSS background — never restore the
   * floor/wall/furniture colors that were already destroyed. Building the
   * fog on its own buffer keeps the world canvas untouched underneath the
   * whole time; drawImage() is what actually blends the two correctly.
   */
  _getFogLayer(viewW, viewH, dpr) {
    if (!this._fogCanvas) {
      this._fogCanvas = document.createElement("canvas");
      this._fogCtx = this._fogCanvas.getContext("2d");
    }
    const pixelW = Math.round(viewW * dpr);
    const pixelH = Math.round(viewH * dpr);
    if (this._fogCanvas.width !== pixelW || this._fogCanvas.height !== pixelH) {
      this._fogCanvas.width = pixelW;
      this._fogCanvas.height = pixelH;
    }
    const fogCtx = this._fogCtx;
    fogCtx.setTransform(dpr, 0, 0, dpr, 0, 0);
    fogCtx.globalCompositeOperation = "source-over";
    fogCtx.clearRect(0, 0, viewW, viewH);
    return fogCtx;
  }

  drawAmbientLighting(player, viewW, viewH, camera, options = {}) {
    const ctx = this.ctx;
    const darkness = options.darkness ?? 0.45;

    // Office keeps its original soft, viewport-scaled vignette untouched —
    // this branch is the ONLY thing that room ever sees. It never needs to
    // "reveal" anything (nothing is ever fully opaque here), so it can
    // stay a single direct draw straight onto the main canvas.
    if (!options.flashlightCapable) {
      const outerRadius = Math.max(viewW, viewH) * (0.55 + darkness * 0.3);
      const innerRadius = outerRadius * 0.22;
      const screenX = viewW / 2 + (player.x - camera.x) * camera.zoom;
      const screenY = viewH / 2 + (player.y - camera.y) * camera.zoom;
      ctx.save();
      const grad = ctx.createRadialGradient(screenX, screenY, innerRadius, screenX, screenY, outerRadius);
      grad.addColorStop(0, "rgba(0,0,0,0)");
      grad.addColorStop(1, `rgba(0,0,0,${darkness})`);
      ctx.fillStyle = grad;
      ctx.fillRect(0, 0, viewW, viewH);
      ctx.restore();
      return;
    }

    // Indoor Amusement Park: everything below draws onto an isolated fog
    // canvas (see _getFogLayer) — never the main `ctx` — until the final
    // drawImage composite. The world drawn earlier this frame on `ctx`
    // stays fully intact underneath the entire time.
    const transform = ctx.getTransform();
    const dpr = transform.a || 1;
    const fogCtx = this._getFogLayer(viewW, viewH, dpr);

    fogCtx.save();
    fogCtx.fillStyle = `rgba(3,4,8,${darkness})`;
    fogCtx.fillRect(0, 0, viewW, viewH);

    const toScreen = (p) => ({
      x: viewW / 2 + (p.x - camera.x) * camera.zoom,
      y: viewH / 2 + (p.y - camera.y) * camera.zoom,
    });

    const cutBeamHole = (originWorld, points) => {
      const o = toScreen(originWorld);
      const screenPts = points.map(toScreen);
      const range = Math.max(1, (options.flashlightRangeWorld ?? 320) * camera.zoom);
      fogCtx.globalCompositeOperation = "destination-out";
      this._tracePolygonPath(fogCtx, o.x, o.y, screenPts);
      const grad = fogCtx.createRadialGradient(o.x, o.y, 0, o.x, o.y, range);
      grad.addColorStop(0, "rgba(0,0,0,1)");
      grad.addColorStop(0.55, "rgba(0,0,0,0.95)");
      grad.addColorStop(0.82, "rgba(0,0,0,0.6)");
      grad.addColorStop(1, "rgba(0,0,0,0)");
      fogCtx.fillStyle = grad;
      fogCtx.fill();
    };

    const tintBeam = (originWorld, points) => {
      const o = toScreen(originWorld);
      const screenPts = points.map(toScreen);
      const range = Math.max(1, (options.flashlightRangeWorld ?? 320) * camera.zoom);
      fogCtx.globalCompositeOperation = "lighter";
      this._tracePolygonPath(fogCtx, o.x, o.y, screenPts);
      // cutBeamHole() already fully cleared the fog layer here (down to
      // alpha 0, i.e. "show 100% of the real world underneath") — this is
      // only a faint warm color cast added on top of that, not a second
      // light source competing with it.
      const grad = fogCtx.createRadialGradient(o.x, o.y, 0, o.x, o.y, range);
      grad.addColorStop(0, "rgba(255,250,235,0.12)");
      grad.addColorStop(0.3, "rgba(255,230,180,0.08)");
      grad.addColorStop(0.6, "rgba(255,200,120,0.04)");
      grad.addColorStop(0.85, "rgba(255,160,80,0.015)");
      grad.addColorStop(1, "rgba(255,140,60,0)");
      fogCtx.fillStyle = grad;
      fogCtx.fill();
    };

    // The local player's own beam — the only light this method is
    // responsible for actually casting (other players' beams are already
    // cast/tinted in-scene by drawFlashlightGlow during the main draw pass;
    // this only needs to punch their matching hole so the fog layer above
    // doesn't re-cover them).
    if (options.flashlightOn && options.facing && options.localBeamPoints) {
      cutBeamHole(player, options.localBeamPoints);
      tintBeam(player, options.localBeamPoints);
    }

    if (options.otherBeams) {
      for (const beam of options.otherBeams) {
        cutBeamHole({ x: beam.x, y: beam.y }, beam.points);
      }
    }

    fogCtx.restore();

    // Composite the finished fog layer onto the real game canvas as one
    // image — this is the step that actually blends "darkness where the
    // fog is opaque" with "the untouched world where the fog was erased,"
    // which drawing straight onto the shared canvas could never do.
    ctx.save();
    ctx.setTransform(1, 0, 0, 1, 0, 0);
    ctx.drawImage(this._fogCanvas, 0, 0);
    ctx.restore();

    // The player must always be able to see their own character — redrawn
    // fully undimmed as the very last step, with no surrounding light
    // shape of its own (that's what caused the old "grey halo").
    ctx.save();
    ctx.translate(viewW / 2, viewH / 2);
    ctx.scale(camera.zoom, camera.zoom);
    ctx.translate(-camera.x, -camera.y);
    this.drawPlayer(player);
    ctx.restore();
  }
}
