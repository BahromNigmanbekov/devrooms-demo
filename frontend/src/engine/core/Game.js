import { areaDoors, doorAllowed, doorDistance, drawDoor, doorObstacle, linkId } from "../systems/DoorSystem.js";
import { buildSeats, findAvailableSeat } from "../systems/SeatSystem.js";
import { hasLineOfSight } from "../systems/InteractionSystem.js";
import { InputManager } from "./InputManager.js";
import { Camera } from "./Camera.js";
import { Player } from "../entities/Player.js";
import { CollisionSystem } from "../systems/CollisionSystem.js";
import { InteractionSystem } from "../systems/InteractionSystem.js";
import { castLightCone } from "../systems/LightingSystem.js";
import { ArcadeRoomRenderer } from "../render/ArcadeRoomRenderer.js";
import { AIRoomRenderer } from "../render/AIRoomRenderer.js";
import { Renderer } from "../render/Renderer.js";
import { Modal } from "../../components/ui/ModalController.js";
import { AREAS } from "../../maps/areas.js";
import { runTask } from "../systems/CodeChecker.js";
import {drawCombat} from '../render/CombatRenderer.js';
import {presentPlayer} from '../../../../shared/playerPresentation.mjs';

export class Game {
  /**
   * `multiplayer` is the same shape LobbyEngine uses, plus the team-progress
   * hooks the office/park door system needs:
   *   getMySocketId(): string | null
   *   getPlayers(): Array<{ id, x, y, facing, color, nickname, area }>
   *   onLocalMove(patch): void — called ~16x/sec while this client moves
   *   getUnlockedAreas(): string[] — which area keys the team has opened
   *   getTaskProgress(): { [area]: { completed, total } }
   *   onTaskComplete(area, taskId): void — reports one solved terminal
   * All are optional — omitting them just means solo play with no doors
   * unlocking, matching the original single-player behavior.
   */
  constructor(canvas, multiplayer = {}) {
    this.canvas = canvas;
    this.ctx = canvas.getContext("2d");

    this.multiplayer = {
      getMySocketId: multiplayer.getMySocketId || (() => null),
      getPlayers: multiplayer.getPlayers || (() => []),
      getCombat: multiplayer.getCombat || (()=>({})),
      getSolvedTasks: multiplayer.getSolvedTasks || (() => ({})),
      onSeatRequest: multiplayer.onSeatRequest || null,
      onAttempt:multiplayer.onAttempt,onDoorRequest:multiplayer.onDoorRequest,getDoors:multiplayer.getDoors||(()=>({})),
      onLocalMove: multiplayer.onLocalMove || (() => {}),
      // Fired once per actual area transition (not per movement tick) so
      // the local client can mirror its own room/area into shared state —
      // the server's player:state broadcast deliberately excludes the
      // sender (see roomSocket.js), so without this the local player's own
      // entry in room.players never learns it changed rooms.
      onAreaChange: multiplayer.onAreaChange || (() => {}),
      getUnlockedAreas: multiplayer.getUnlockedAreas || (() => ["ai"]),
      getTaskProgress: multiplayer.getTaskProgress || (() => ({})),
      onTaskComplete: multiplayer.onTaskComplete || (() => {}),
    };

    this.input = new InputManager();
    this.pointer={active:false,x:0,y:0};
    this._aimMove=event=>{const rect=this.canvas.getBoundingClientRect();this.pointer={active:true,x:(event.clientX-rect.left)*this.viewW/rect.width,y:(event.clientY-rect.top)*this.viewH/rect.height};};
    this._aimLeave=()=>{this.pointer.active=false;};
    this.canvas.addEventListener('pointermove',this._aimMove);
    this.canvas.addEventListener('pointerdown',this._aimMove);
    this.canvas.addEventListener('pointerleave',this._aimLeave);
    this.renderer = new Renderer(this.ctx);
    this.aiRenderer = new AIRoomRenderer(this.ctx);
    this.arcadeRenderer = new ArcadeRoomRenderer(this.ctx);
    this._running = false;
    this._destroyed = false;

    this.player = new Player(0, 0);
    this.player.isLocal = true;
    this._lastBroadcast = 0;

    this.promptEl = document.getElementById("interaction-prompt");
    this.progressEl = document.getElementById("team-progress");
    this.flashlightHintEl = document.getElementById("flashlight-hint");
    this.unlockToastEl = document.getElementById("area-unlock-toast");
    this.energyBarEl = document.getElementById("energy-bar-fill");
    this.energyWrapEl = document.getElementById("energy-bar");

    // Game state: modal freezes player movement while open. A player who
    // has been "taken" (future ghost mechanic) is flagged here too — for
    // now this only ever stays false, but Game already checks it before
    // letting the modal open, so that mechanic slots in without touching
    // this file again.
    this.modalOpen = false;
    this._currentTask = null;
    this._currentTaskArea = null;
    this.isGhost = false;
    this.modal = new Modal({
      onRun: async (code) => {
        if(!this._currentTask||this._attemptPending||this.isGhost)return;
        const task=this._currentTask,area=this._currentTaskArea,taskId=this._currentTaskId;
        const result=runTask(task,code);
        this._attemptPending=true;this.modal.setBusy(true);
        try {
          const key=JSON.stringify([area,taskId,code]);
          if(this._submissionReceipt?.key!==key)this._submissionReceipt={key,id:crypto.randomUUID()};
          const response=await this.multiplayer.onAttempt?.({area,taskId,answer:code,passed:result.allPass,attemptId:this._submissionReceipt.id});
          if(response?.ok)this._submissionReceipt=null;
          if(this._destroyed)return;
          if(!response?.ok){this.modal.resultPanel.textContent="Aloqa tasdiqlanmadi. Quvvat panelini tekshiring va qayta urinib ko'ring.";this.modal.resultPanel.classList.remove("hidden");return;}
          this.player.energy=response.player.energy;this.isGhost=response.player.eliminated;
          if(this.modal.isOpen&&this._currentTask===task)this.modal.showResult({...result,allPass:response.allPass,energy:response.player.energy,energyDelta:response.energyDelta});
          if(this.isGhost){this.modal.setBusy(false);this.modal.close();}
        } finally {this._attemptPending=false;if(!this._destroyed)this.modal.setBusy(false);}
      },
      onClose: () => {
        this.modalOpen = false;
        this._currentTask = null;
        this._currentTaskArea = null;
      },
    });

    this._activeInteractable = null;
    this.flashlightOn = true;
    this.flashlightEnergy = 100;
    this._energyDrainTimer = 0;
    this._gateLocked = null; // forces the first _syncGate() to actually run
    this._dustParticles = [];
    this.energyGainLayerEl = document.getElementById("energy-gain-layer");

    this._loadArea("ai");

    this._resize = this._resize.bind(this);
    window.addEventListener("resize", this._resize);
    window.addEventListener("orientationchange", this._resize);

    // ResizeObserver catches cases a plain window "resize" event can miss
    // (e.g. the page being embedded in a container that changes size, or
    // the browser chrome/zoom changing without a window resize firing).
    if (typeof ResizeObserver !== "undefined") {
      this._resizeObserver = new ResizeObserver(() => this._resize());
      this._resizeObserver.observe(document.documentElement);
    }

    this._resize();
    // Re-check once more shortly after construction in case the very first
    // layout pass reported a stale viewport size.
    this._resizeFrame = requestAnimationFrame(() => { if (!this._destroyed) this._resize(); });

    this._lastTime = performance.now();
    this._loop = this._loop.bind(this);
  }

  /**
   * Swaps the active area's map, collision, camera, and render palette.
   * Called once at startup ("office") and again whenever the player walks
   * through an unlocked exit gate. Player position resets to the new
   * area's spawn point — areas are separate spaces, not one shared world.
   */
  _loadArea(areaKey) {
    const fromArea=this.currentArea;
    const area = AREAS[areaKey];
    this.area = area;
    this.currentArea = areaKey;
    this.multiplayer.onAreaChange(areaKey);

    const walls = area.buildWalls();
    const { blocking, interactables, decor } = area.buildFurniture();
    this._wallList = walls;
    this._blockingList = blocking;
    this._decorList = decor;
    this._doorFrames = area.buildDoorFrames();
    this._baseObstacles = [...walls, ...blocking];
    this._seats = buildSeats(blocking, areaKey);
    this.player.seated = false; this.player.seatId = null;
    this._nearestSeat = null; this._seatPending = false;
    this._interiorSignature = null;
    this.interactables = interactables;

    this.camera = new Camera(area.WORLD_WIDTH, area.WORLD_HEIGHT);
    this.renderer.setPalette(area.COLORS);
    this.interaction = new InteractionSystem(this.interactables);

    this._doors=areaDoors(area,areaKey); this._doorAnimation={};
    this.player.x = area.spawn.x;
    this.player.y = area.spawn.y;
    if (areaKey === "ai" && !fromArea) {
      const peers = this.multiplayer.getPlayers();
      const index = Math.max(0, peers.findIndex(p => p.id === this.multiplayer.getMySocketId()));
      const columns = Math.min(6, Math.max(1, peers.length));
      this.player.x += (index % 6 - (columns - 1) / 2) * 84;
      this.player.y += Math.floor(index / 6) * 60 - Math.floor(Math.max(0, peers.length - 1) / 6) * 30;
    }
    const arrivals={office:{ai:{x:140,y:550},park:{x:1640,y:550}},ai:{office:{x:2690,y:900}},park:{office:{x:220,y:650}}};
    Object.assign(this.player,arrivals[areaKey]?.[fromArea]||{});
    this.camera.x = this.player.x;
    this.camera.y = this.player.y;
    this._activeInteractable = null;
    const guide = document.getElementById("ai-room-guide");
    if (guide) guide.classList.toggle("hidden", areaKey !== "ai");
    document.getElementById("arcade-room-guide")?.classList.toggle("hidden",areaKey!=="park");
    this.flashlightOn = true;
    this._flashlightIntensity = area.flashlightCapable ? 0 : 1; // fades in on entry rather than snapping on
    if (area.flashlightCapable) {
      this.flashlightEnergy = 100;
      this._energyDrainTimer = 0;
    }

    this._gateLocked = null;
    this._syncGate();

    if (this.flashlightHintEl) {
      this.flashlightHintEl.classList.toggle("hidden", !area.flashlightCapable);
    }
    this._updateProgressHud();
    this._updateEnergyHud();
  }

  /**
   * Adds/removes the exit-gate obstacle from collision based on whether the
   * team has unlocked it yet — cheap enough to check every frame, so a
   * `room:areaUnlocked` event landing mid-walk opens the door immediately
   * without needing the area to reload.
   */
  _syncGate() {
    const locked=!this.multiplayer.getUnlockedAreas().includes(this.area.exitGate?.targetArea);
    const wasLocked=this._gateLocked;this._gateLocked=locked;
    this._lockedInteriorDoors=this._doors.filter(d=>(this._doorAnimation[d.id]||0)<1).map(doorObstacle);
    const signature=this._lockedInteriorDoors.map(d=>d.id).join(",");
    if(signature!==this._interiorSignature){this._interiorSignature=signature;this.collision=new CollisionSystem([...this._baseObstacles,...this._lockedInteriorDoors]);}
    if(wasLocked===true&&!locked&&!this.multiplayer.getCombat().tag?.active)this._showUnlockToast();
  }

  _showUnlockToast() {
    if (!this.unlockToastEl) return;
    const target = AREAS[this.area.exitGate.targetArea];
    this.unlockToastEl.textContent = `🎉 ${target ? target.label : "Keyingi hona"} ochildi!`;
    this.unlockToastEl.classList.remove("hidden");
    requestAnimationFrame(() => this.unlockToastEl.classList.add("visible"));
    clearTimeout(this._unlockToastTimeout);
    this._unlockToastTimeout = setTimeout(() => {
      this.unlockToastEl.classList.remove("visible");
      this._unlockHideTimeout = setTimeout(() => this.unlockToastEl.classList.add("hidden"), 400);
    }, 3200);
  }

  _updateProgressHud() {
    if (!this.progressEl) return;
    const progress = this.multiplayer.getTaskProgress()[this.currentArea];
    if (!progress) {
      this.progressEl.classList.add("hidden");
      return;
    }
    this.progressEl.classList.remove("hidden");
    this.progressEl.textContent = `Jamoa: ${progress.completed}/${progress.total} — ${this.area.label}${this.currentArea==="park"&&progress.completed===progress.total?" · Barcha o‘yinlar bajarildi!":""}`;
  }

  _updateEnergyHud() {
    const value=this.player.energy??100;
    const text=document.getElementById("power-value"),fill=document.getElementById("power-fill");
    if(text)text.textContent=value+"%";
    if(fill){fill.style.width=value+"%";fill.style.background=value<=25?"#b96657":value<=60?"#b39c64":"#759889";}
    document.getElementById("game-over")?.classList.toggle("hidden",!this.isGhost);
    this.energyWrapEl?.classList.add("hidden");
  }

  /** A "+25" that rises and fades over the battery HUD — visual feedback for a correct answer recharging the flashlight. */
  _spawnEnergyGainText() {
    if (!this.energyGainLayerEl) return;
    const el = document.createElement("span");
    el.className = "energy-gain-float";
    el.textContent = "+25";
    this.energyGainLayerEl.appendChild(el);
    setTimeout(() => el.remove(), 1200);
    if (this.energyWrapEl) {
      this.energyWrapEl.classList.remove("energy-charging");
      // Force reflow so re-adding the class restarts the CSS animation
      // even if a previous charge pulse is still finishing.
      void this.energyWrapEl.offsetWidth;
      this.energyWrapEl.classList.add("energy-charging");
    }
  }

  _resize() {
    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    this.viewW = window.innerWidth;
    this.viewH = window.innerHeight;
    this.canvas.width = this.viewW * dpr;
    this.canvas.height = this.viewH * dpr;
    this.canvas.style.width = this.viewW + "px";
    this.canvas.style.height = this.viewH + "px";
    this.ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
  }

  start() {
    if (this._running || this._destroyed) return;
    this._running = true;
    this._lastTime = performance.now();
    this._raf = requestAnimationFrame(this._loop);
  }

  destroy() {
    this._running = false;
    this._destroyed = true;
    cancelAnimationFrame(this._raf);
    cancelAnimationFrame(this._resizeFrame);
    clearTimeout(this._unlockToastTimeout);
    clearTimeout(this._unlockHideTimeout);
    window.removeEventListener("resize", this._resize);
    window.removeEventListener("orientationchange", this._resize);
    this._resizeObserver?.disconnect();
    this.input.destroy();
    this.canvas.removeEventListener('pointermove',this._aimMove);
    this.canvas.removeEventListener('pointerdown',this._aimMove);
    this.canvas.removeEventListener('pointerleave',this._aimLeave);
    this.modal.destroy();
  }

  _loop(now) {
    if (!this._running) return;
    const dt = Math.min((now - this._lastTime) / 1000, 1 / 30);
    this._lastTime = now;

    this._update(dt, now);
    try {
      this._render();
      this._drawAim();
    } catch (err) {
      // A single bad frame (e.g. a transient lighting-calculation edge
      // case) must never freeze the game on a stuck black screen — log it
      // once and keep the loop alive so the very next frame just tries
      // again with fresh state.
      if (!this._loggedRenderError) {
        console.error("Game render error:", err);
        this._loggedRenderError = true;
      }
    }

    this.input.endFrame();
    this._raf = requestAnimationFrame(this._loop);
  }

  _update(dt, now) {
    for(const d of this._doors) {const target=this.multiplayer.getDoors()[d.id]?.open?1:0;const p=this._doorAnimation[d.id]||0;this._doorAnimation[d.id]=Math.max(0,Math.min(1,p+Math.sign(target-p)*Math.min(Math.abs(target-p),dt/0.6)));}
    this._syncGate();

    const move = this.input.getMoveVector();
    if (!this.modalOpen && this.player.seated && (this.input.wasJustPressed("Space") || (this.input.wasJustPressed("KeyE")&&!this._activeInteractable))) this._requestSeat(null);
    this.player.update(dt, move, this.collision, this.modalOpen || this.player.seated || this._seatPending || this.isGhost);
    this.player.aiming=this.pointer.active&&!this.modalOpen&&!document.querySelector('.arcade-overlay');
    if(this.player.aiming)this.player.facing=this.getWeaponAim();
    this.camera.follow(this.player.x, this.player.y, dt);
    this.camera.updateZoom(this.viewW, this.viewH);
    this.camera.clamp(this.viewW, this.viewH);

    // Color can change live (lobby color picker carries over) — cheap to
    // resync every frame given typical room sizes.
    const me = this.multiplayer.getPlayers().find((p) => p.id === this.multiplayer.getMySocketId());
    if (me) {
      this.player.seated=!!me.seated;this.player.seatId=me.seatId;
      if(me.relocationId&&me.relocationId!==this._relocationId){this._relocationId=me.relocationId;this._loadArea(me.area);this.player.x=me.x;this.player.y=me.y;}
      this.player.color = me.color;
      this.player.equipment = me.equipment;
      this.player.weaponAction = me.weaponAction;
      this.player.nickname = me.nickname;
      this.player.energy=me.energy??100;this.isGhost=!!me.eliminated;
      if(this.isGhost&&this.modalOpen)this.modal.close();
    }

    if (now - this._lastBroadcast > 60) {
      this._lastBroadcast = now;
      this.multiplayer.onLocalMove({
        x: this.player.x,
        y: this.player.y,
        facing: this.player.facing,
        aiming:this.player.aiming,
        moving: this.player.moving,
        area: this.currentArea,
        flashlightOn: this.flashlightOn,
        flashlightEnergy: this.flashlightEnergy,
      });
    }

    // Walking into an unlocked exit gate's trigger zone sends the player
    // to the next area. Only the office has a forward trigger zone right
    // now — the park's forward gate is permanently locked (no third area
    // to walk into yet).
    const trigger = this.area.exitTrigger;
    if (!this.isGhost && !this.player.seated && !this.modalOpen && trigger && this._doorAnimation[linkId(this.currentArea,this.area.exitGate.targetArea)]>=1 && !this._gateLocked && aabbOverlap(this.player, 16, trigger)) {
      this._loadArea(this.area.exitGate.targetArea);
      return;
    }

    // The return gate (e.g. Park -> Office) is never progress-gated —
    // going backward is always available.
    const returnTrigger = this.area.returnTrigger;
    if (!this.isGhost && !this.player.seated && !this.modalOpen && returnTrigger && this._doorAnimation[linkId(this.currentArea,this.area.returnGate.targetArea)]>=1 && aabbOverlap(this.player, 16, returnTrigger)) {
      this._loadArea(this.area.returnGate.targetArea);
      return;
    }

    // Interaction prompt.
    const solved=this.multiplayer.getSolvedTasks()[this.currentArea] || [];
    const walls=[...this._wallList, ...this._lockedInteriorDoors];
    this._activeInteractable = this.isGhost ? null : this.interaction.findNearest(this.player.x, this.player.y,
      item => (!item.requires || solved.includes(item.requires)) && hasLineOfSight(this.player, item, walls));
    this._nearestSeat = this.player.seated ? null : findAvailableSeat(this._seats, this.player.x, this.player.y, this.multiplayer.getPlayers(), this.multiplayer.getMySocketId());
    if (this._nearestSeat && !hasLineOfSight(this.player, { x:this._nearestSeat.x-1,y:this._nearestSeat.y-1,w:2,h:2 },walls)) this._nearestSeat=null;
    this._nearestDoor=this._doors.filter(d=>doorDistance(this.player,d)<105 && this._doorAnimation[d.id]<1).sort((a,b)=>doorDistance(this.player,a)-doorDistance(this.player,b))[0];
    const doorButton=document.getElementById('door-button');
    doorButton?.classList.toggle('hidden',!this._nearestDoor||this.modalOpen||this.isGhost);
    if(doorButton&&this._nearestDoor)doorButton.textContent=(this.multiplayer.getCombat().tag?.active||doorAllowed(this._nearestDoor,solved,this.multiplayer.getUnlockedAreas()))?'Eshikni ochish · E':this._nearestDoor.requires?(this.currentArea==='park'?'Kirish boshqotirmasini bajaring':'Avval simlarni ulang'):'Avval vazifalarni bajaring';
    if(!this.modalOpen&&!this.isGhost&&!this._activeInteractable&&this._nearestDoor&&this.input.wasJustPressed('KeyE'))this._requestDoor();
    this._updatePrompt();

    // Flashlight energy — drains automatically while inside a
    // flashlight-capable area, independent of whether it's currently on.
    if (this.area.flashlightCapable) {
      this._energyDrainTimer += dt;
      if (this._energyDrainTimer >= 60) {
        this._energyDrainTimer -= 60;
        this.flashlightEnergy = Math.max(0, this.flashlightEnergy - 25);
      }
    }

    // Flashlight toggle (Park only) — can't switch on with an empty tank,
    // and hitting zero while on forces it off immediately.
    if (this.area.flashlightCapable && this.input.wasJustPressed("KeyF")) {
      if (this.flashlightOn) {
        this.flashlightOn = false;
      } else if (this.flashlightEnergy > 0) {
        this.flashlightOn = true;
      }
    }
    if (this.flashlightEnergy <= 0) this.flashlightOn = false;
    // Smooth fade rather than an instant on/off snap — reads as a real
    // flashlight warming up/dimming down instead of a hard cut.
    const flashlightTarget = this.area.flashlightCapable && this.flashlightOn ? 1 : 0;
    this._flashlightIntensity += (flashlightTarget - this._flashlightIntensity) * Math.min(1, dt * 7);

    // E opens the modal for whichever terminal is currently in range.
    if (!this.modalOpen && !this.player.seated && !this._seatPending && this._nearestSeat && (this.input.wasJustPressed("Space") || (!this._activeInteractable && !this._nearestDoor && this.input.wasJustPressed("KeyE")))) this._requestSeat(this._nearestSeat);
    if (!this.isGhost && !this.modalOpen && !this._seatPending && this._activeInteractable && this.input.wasJustPressed("KeyE")) {
      this.modalOpen = true;
      this._currentTaskArea = this.currentArea;
      this._currentTaskId = this._activeInteractable.id;
      this._currentTask = this.area.getTask(this._currentTaskId);
      this.modal.open(this._activeInteractable.label, this._currentTask);
    }

    this._updateProgressHud();
    this._updateEnergyHud();
    this._updateDustParticles(dt);
  }

  /**
   * A handful of slow-drifting motes near the player, in world space — they
   * naturally only read as visible once the darkness layer reveals the
   * ground under them, so no separate "only inside the beam" clipping logic
   * is needed here at all.
   */
  _updateDustParticles(dt) {
    if (!this.area.flashlightCapable || !this.flashlightOn) {
      this._dustParticles.length = 0;
      return;
    }
    const target = 16;
    while (this._dustParticles.length < target) {
      this._dustParticles.push(this._newDustParticle());
    }
    for (const p of this._dustParticles) {
      p.x += p.vx * dt;
      p.y += p.vy * dt;
      p.life -= dt;
      if (p.life <= 0 || Math.hypot(p.x - this.player.x, p.y - this.player.y) > 260) {
        Object.assign(p, this._newDustParticle());
      }
    }
  }

  _newDustParticle() {
    const angle = Math.random() * Math.PI * 2;
    const dist = 20 + Math.random() * 200;
    return {
      x: this.player.x + Math.cos(angle) * dist,
      y: this.player.y + Math.sin(angle) * dist,
      vx: (Math.random() - 0.5) * 10,
      vy: (Math.random() - 0.5) * 10 - 4,
      size: 0.6 + Math.random() * 1.4,
      alpha: 0.08 + Math.random() * 0.14,
      life: 3 + Math.random() * 4,
    };
  }

  _requestDoor() {
    if(!this._nearestDoor||this.isGhost||this.player.seated||!this.multiplayer.onDoorRequest)return;
    this.multiplayer.onDoorRequest({area:this.currentArea,id:this._nearestDoor.id});
  }
  _drawDoor(d) {drawDoor(this.ctx,d,this._doorAnimation[d.id]||0,this.multiplayer.getCombat().tag?.active||doorAllowed(d,this.multiplayer.getSolvedTasks()[this.currentArea]||[],this.multiplayer.getUnlockedAreas()));}
  _drawDoors() {for(const d of this._doors)this._drawDoor(d);}
  _requestSeat(seat) {
    if(this._seatPending || !this.multiplayer.onSeatRequest) return;
    this._seatPending=true;
    const area=this.currentArea;
    this.multiplayer.onSeatRequest(seat?.id || null).then(result=>{
      if(this._destroyed || this.currentArea!==area) return;
      this._seatPending=false;
      if(!result?.ok) return;
      Object.assign(this.player, {
        x:result.player.x,y:result.player.y,seated:result.player.seated,
        seatId:result.player.seatId,moving:false,facing:{x:0,y:1}
      });
    }).catch(()=>{this._seatPending=false;});
  }
  _drawGamePlayer(player) {
    const id=player.isLocal?this.multiplayer.getMySocketId():player.id;
    const shown=presentPlayer({...player,id},this.multiplayer.getCombat().tag);
    this.renderer.drawPlayer({...shown, y:player.y-(player.seated?10:0),moving:player.seated?false:player.moving});
  }
  getWeaponAim(event){
    if(event?.clientX!==undefined)this._aimMove(event);
    if(!this.pointer.active||!this.camera)return this.player.facing;
    const dx=this.camera.x+(this.pointer.x-this.viewW/2)/this.camera.zoom-this.player.x;
    const dy=this.camera.y+(this.pointer.y-this.viewH/2)/this.camera.zoom-this.player.y;
    const length=Math.hypot(dx,dy);return length>1?{x:dx/length,y:dy/length}:this.player.facing;
  }
  _drawAim(){
    if(!this.player.aiming||this.isGhost||document.querySelector('.arcade-overlay'))return;
    const c=this.ctx,{x,y}=this.pointer;c.save();c.strokeStyle='#d4f5ed';c.lineWidth=1.5;c.shadowColor='#62dce2';c.shadowBlur=4;
    c.beginPath();c.arc(x,y,7,0,Math.PI*2);c.moveTo(x-14,y);c.lineTo(x-9,y);c.moveTo(x+9,y);c.lineTo(x+14,y);c.moveTo(x,y-14);c.lineTo(x,y-9);c.moveTo(x,y+9);c.lineTo(x,y+14);c.stroke();c.restore();
  }
  _drawCombat(){drawCombat(this.ctx,this.multiplayer.getCombat(),this.currentArea,{...this.player,id:this.multiplayer.getMySocketId()},this.interactables);}
  _updatePrompt() {
    const label=this.promptEl.querySelector(".label");
    const key=this.promptEl.querySelector(".key");
    key.textContent=this._activeInteractable || this.player.seated ? "E" : "Space";
    label.textContent=this.player.seated && !this._activeInteractable ? "Turish · E / Space" : this._activeInteractable ? this._activeInteractable.label + (this.player.seated ? " · Space: turish" : "") + (this._nearestSeat ? " · Space: o‘tirish" : "") : this._nearestSeat?.label || "";
    if ((this._activeInteractable || this._nearestSeat || this.player.seated) && !this.modalOpen && !this.isGhost) {
      this.promptEl.classList.remove("hidden");
      requestAnimationFrame(() => this.promptEl.classList.add("visible"));
    } else {
      this.promptEl.classList.remove("visible");
      this.promptEl.classList.add("hidden");
    }
  }

  _render() {
    const ctx = this.ctx;
    this.renderer.clear(this.viewW, this.viewH);

    ctx.save();
    this.camera.apply(ctx, this.viewW, this.viewH);

    if (this.currentArea === "ai") {
      const id = this.multiplayer.getMySocketId();
      const players = this.multiplayer.getPlayers()
        .filter(p => p.id !== id && (p.area || "ai") === "ai")
        .map(p => ({ ...p, radius: 16, facing: p.facing || { x: 0, y: 1 }, isLocal: false }));
      this.aiRenderer.render(this.area, this._blockingList, [...players, this.player],
        this._activeInteractable?.id, this.multiplayer.getSolvedTasks().ai || [],
        this._gateLocked !== false,
        this.multiplayer.getTaskProgress().ai || { completed: 0, total: 14 },
        p => this._drawGamePlayer(p), this._wallList.filter(w=>w.interior), this._doors, this._lockedInteriorDoors, d=>this._drawDoor(d));
      this._drawCombat();
      ctx.restore();
      this.renderer.drawAmbientLighting(this.player, this.viewW, this.viewH, this.camera, { darkness: this.area.darkness });
      return;
    }

    if (this.currentArea === "park") {
      const id = this.multiplayer.getMySocketId();
      const players = this.multiplayer.getPlayers()
        .filter(p => p.id !== id && p.area === "park")
        .map(p => ({ ...p, radius: 16, facing: p.facing || { x: 0, y: 1 }, isLocal: false }));
      this.arcadeRenderer.renderArcade(this.area, this._blockingList, [...players, this.player],
        this._activeInteractable?.id, this.multiplayer.getSolvedTasks().park || [],
        p => this._drawGamePlayer(p), this._wallList, this._doors, d => this._drawDoor(d), this._decorList);
      this._drawCombat();
      ctx.restore();
      this.renderer.drawAmbientLighting(this.player, this.viewW, this.viewH, this.camera, { darkness: this.area.darkness });
      return;
    }

    this.renderer.drawFloor(this.area.WORLD_WIDTH, this.area.WORLD_HEIGHT, this.area.flashlightCapable);
    this.renderer.drawDecor(this._decorList);
    this.renderer.drawWalls(this._wallList);
    this.renderer.drawDoorFrames(this._doorFrames);
    this.renderer.drawFurniture(
      this._blockingList,
      this.interactables,
      this._activeInteractable ? this._activeInteractable.id : null
    );

    this._drawDoors();
    const flashlightRange = FLASHLIGHT_RANGE_TILES * TILE_SIZE;
    const otherBeams = [];

    const mySocketId = this.multiplayer.getMySocketId();
    for (const p of this.multiplayer.getPlayers()) {
      if (p.id === mySocketId) continue;
      if ((p.area || "ai") !== this.currentArea) continue;
      if (this.area.flashlightCapable && p.flashlightOn) {
        const facing = p.facing || { x: 0, y: 1 };
        const angle = Math.atan2(facing.y, facing.x);
        const points = castLightCone(p.x, p.y, angle, FLASHLIGHT_HALF_ANGLE, flashlightRange, this._wallList);
        this.renderer.drawFlashlightGlow(p.x, p.y, points, flashlightRange);
        otherBeams.push({ x: p.x, y: p.y, points });
      }
      const remotePlayer = {
        id:p.id,aiming:p.aiming,
        x: p.x,
        y: p.y,
        radius: 16,
        facing: p.facing || { x: 0, y: 1 },
        moving: p.moving,
        color: p.color,
        equipment: p.equipment,
        weaponAction:p.weaponAction,
        nickname: p.nickname,
        isLocal: false,
        seated:p.seated,
      };
      this._drawGamePlayer(remotePlayer);
    }

    if (this.area.flashlightCapable) {
      this.renderer.drawDustParticles(this._dustParticles);
    }

    this._drawGamePlayer(this.player);
    this._drawCombat();

    ctx.restore();

    const localFlashlightOn = this.area.flashlightCapable && this._flashlightIntensity > 0.01;
    const localBeamPoints = localFlashlightOn
      ? castLightCone(
          this.player.x,
          this.player.y,
          Math.atan2(this.player.facing.y, this.player.facing.x),
          FLASHLIGHT_HALF_ANGLE,
          flashlightRange,
          this._wallList
        )
      : null;

    this.renderer.drawAmbientLighting(this.player, this.viewW, this.viewH, this.camera, {
      darkness: this.area.darkness,
      flashlightCapable: this.area.flashlightCapable,
      flashlightOn: localFlashlightOn,
      facing: this.player.facing,
      localBeamPoints,
      otherBeams,
      // ~5.5 floor tiles — a short, deliberately limited beam, independent
      // of screen size (world units, converted to screen pixels by the
      // renderer via camera.zoom).
      flashlightRangeWorld: flashlightRange,
    });
  }
}

const TILE_SIZE = 64; // matches Renderer.js's TILE_SIZE — floor tile size in world units
const FLASHLIGHT_RANGE_TILES = 5.5;
const FLASHLIGHT_HALF_ANGLE = 0.5; // radians (~29°) — a believable handheld-torch spread, not a searchlight

/** Circle (player) vs axis-aligned rect overlap, used for the exit-gate trigger zone. */
function aabbOverlap(player, radius, rect) {
  const closestX = Math.max(rect.x, Math.min(player.x, rect.x + rect.w));
  const closestY = Math.max(rect.y, Math.min(player.y, rect.y + rect.h));
  const dx = player.x - closestX;
  const dy = player.y - closestY;
  return dx * dx + dy * dy < radius * radius;
}
