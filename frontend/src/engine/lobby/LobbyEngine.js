import { Renderer } from "../render/Renderer.js";
import { InputManager } from "../core/InputManager.js";

export const LOBBY_WORLD = { width: 900, height: 560, padding: 60 };
const MOVE_SPEED = 260; // px/sec
const BROADCAST_INTERVAL_MS = 60; // ~16Hz вЂ” enough to feel live, cheap on sockets
const PLAYER_RADIUS = 20;

/**
 * Runs the waiting-room render/update loop. Reads live room state through
 * getters (not a snapshot) so React can update `players` every time a
 * room:state event arrives without the engine needing to be recreated.
 */
export class LobbyEngine {
  constructor(canvas, { getMySocketId, getPlayers, onLocalMove }) {
    this.canvas = canvas;
    this.ctx = canvas.getContext("2d");
    this.getMySocketId = getMySocketId;
    this.getPlayers = getPlayers;
    this.onLocalMove = onLocalMove;

    this.input = new InputManager();
    this.local = { x: null, y: null, facing: { x: 0, y: 1 }, moving: false, initialized: false };
    this._lastBroadcast = 0;
    this._lastTime = performance.now();
    this._raf = null;
    this._running = false;

    this._resize = this._resize.bind(this);
    window.addEventListener("resize", this._resize);
    this._resize();
  }

  start() {
    this._running = true;
    this._lastTime = performance.now();
    const loop = (t) => {
      if (!this._running) return;
      const dt = Math.min((t - this._lastTime) / 1000, 0.05);
      this._lastTime = t;
      this._update(dt, t);
      this._render();
      this._raf = requestAnimationFrame(loop);
    };
    this._raf = requestAnimationFrame(loop);
  }

  destroy() {
    this._running = false;
    if (this._raf) cancelAnimationFrame(this._raf);
    window.removeEventListener("resize", this._resize);
    this.input.destroy();
  }

  _resize() {
    const dpr = window.devicePixelRatio || 1;
    this.canvas.width = window.innerWidth * dpr;
    this.canvas.height = window.innerHeight * dpr;
    this.canvas.style.width = window.innerWidth + "px";
    this.canvas.style.height = window.innerHeight + "px";
    this.ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
  }

  _update(dt, now) {
    const players = this.getPlayers();
    const mySocketId = this.getMySocketId();
    const me = players.find((p) => p.id === mySocketId);

    // Seed local position from the server's initial spawn point once вЂ”
    // after that, this client is authoritative over its own movement and
    // just tells the server where it is (classic client-predicted movement).
    if (!this.local.initialized && me) {
      this.local.x = me.x;
      this.local.y = me.y;
      this.local.initialized = true;
    }
    if (!this.local.initialized) return;

    const move = this.input.getMoveVector();
    this.local.moving = move.x !== 0 || move.y !== 0;
    if (this.local.moving) {
      this.local.facing = move;
      this.local.x += move.x * MOVE_SPEED * dt;
      this.local.y += move.y * MOVE_SPEED * dt;
    }

    const { width, height, padding } = LOBBY_WORLD;
    this.local.x = clamp(this.local.x, padding, width - padding);
    this.local.y = clamp(this.local.y, padding, height - padding);

    if (now - this._lastBroadcast > BROADCAST_INTERVAL_MS) {
      this._lastBroadcast = now;
      this.onLocalMove({
        x: this.local.x,
        y: this.local.y,
        facing: this.local.facing,
        moving: this.local.moving,
      });
    }

    this.input.endFrame();
  }

  _render() {
    const { ctx, canvas } = this;
    const w = canvas.width / (window.devicePixelRatio || 1);
    const h = canvas.height / (window.devicePixelRatio || 1);

    ctx.clearRect(0, 0, w, h);
    ctx.fillStyle = "#0a0e17";
    ctx.fillRect(0, 0, w, h);

    const offsetX = (w - LOBBY_WORLD.width) / 2;
    const offsetY = (h - LOBBY_WORLD.height) / 2;

    this._drawRoom(offsetX, offsetY);

    const players = this.getPlayers();
    const mySocketId = this.getMySocketId();

    for (const p of players) {
      if (p.id === mySocketId) continue;
      this._drawPlayer(offsetX + p.x, offsetY + p.y, p.color, p.nickname, false, p.facing, p.equipment);
    }
    if (this.local.initialized) {
      const me = players.find((p) => p.id === mySocketId);
      this._drawPlayer(
        offsetX + this.local.x,
        offsetY + this.local.y,
        me?.color || "#5b8cff",
        me?.nickname || "You",
        true,
        this.local.facing,
        me?.equipment
      );
    }
  }

  _drawRoom(ox, oy) {
    const { ctx } = this;
    const { width, height } = LOBBY_WORLD;

    ctx.save();
    ctx.translate(ox, oy);

    // Floor
    const floorGrad = ctx.createLinearGradient(0, 0, 0, height);
    floorGrad.addColorStop(0, "#161d2c");
    floorGrad.addColorStop(1, "#11151f");
    ctx.fillStyle = floorGrad;
    roundRect(ctx, 0, 0, width, height, 28);
    ctx.fill();

    // Floor grid
    ctx.strokeStyle = "rgba(255,255,255,0.04)";
    ctx.lineWidth = 1;
    for (let x = 0; x <= width; x += 40) {
      ctx.beginPath();
      ctx.moveTo(x, 0);
      ctx.lineTo(x, height);
      ctx.stroke();
    }
    for (let y = 0; y <= height; y += 40) {
      ctx.beginPath();
      ctx.moveTo(0, y);
      ctx.lineTo(width, y);
      ctx.stroke();
    }

    // Wall border
    ctx.strokeStyle = "#3a4258";
    ctx.lineWidth = 6;
    roundRect(ctx, 3, 3, width - 6, height - 6, 26);
    ctx.stroke();

    ctx.restore();
  }

  _drawPlayer(x, y, color, nickname, isMe, facing, equipment) {
    new Renderer(this.ctx).drawPlayer({x,y,color,nickname,equipment,isLocal:isMe,facing:facing||{x:0,y:1},radius:20,moving:false});
  }
}

function roundRect(ctx, x, y, w, h, r) {
  ctx.beginPath();
  ctx.moveTo(x + r, y);
  ctx.arcTo(x + w, y, x + w, y + h, r);
  ctx.arcTo(x + w, y + h, x, y + h, r);
  ctx.arcTo(x, y + h, x, y, r);
  ctx.arcTo(x, y, x + w, y, r);
  ctx.closePath();
}

function clamp(v, min, max) {
  return Math.max(min, Math.min(max, v));
}
