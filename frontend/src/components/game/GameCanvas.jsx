import { useEffect, useRef } from "react";
import { Game } from "../../engine/core/Game.js";
import { useRoomStore } from "../../store/roomStore.js";
import { useRoomSocket } from "../../hooks/useRoomSocket.js";
import "../../styles/aiRoom.css";
import RoomRadar from "./RoomRadar.jsx";
import RobotProfile from "./RobotProfile.jsx";
import WeaponHUD from './WeaponHUD.jsx';
import TagHUD from './TagHUD.jsx';

/**
 * Mounts the canvas + HUD + modal DOM that the vanilla game engine expects,
 * then boots a Game instance against it on mount and tears it down on
 * unmount. This wrapper's job is handing the engine a live view of room
 * state — every connected player, the team's shared task progress, and
 * which areas are unlocked — plus ways to report movement and solved
 * terminals back to the server.
 */
export default function GameCanvas() {
  const canvasRef = useRef(null);
  const gameRef = useRef(null);
  const { sendPlayerState, completeTask, requestSeat, submitAttempt, requestDoor, leaveRoom } = useRoomSocket();
  const patchPlayer = useRoomStore((s) => s.patchPlayer);

  // Same pattern as LobbyCanvas: refs kept fresh by a store subscription so
  // the render loop always sees the latest room state without the Game
  // instance being torn down and rebuilt on every room:state update.
  const roomRef = useRef(useRoomStore.getState().room);
  const mySocketIdRef = useRef(useRoomStore.getState().mySocketId);

  useEffect(
    () =>
      useRoomStore.subscribe((s) => {
        roomRef.current = s.room;
        mySocketIdRef.current = s.mySocketId;
      }),
    []
  );

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const game = new Game(canvas, {
      getMySocketId: () => mySocketIdRef.current,
      getPlayers: () => roomRef.current?.players || [],
      getCombat: () => roomRef.current || {},
      getSolvedTasks: () => roomRef.current?.solvedTasks || {},
      onLocalMove: patch => {sendPlayerState(patch);patchPlayer(mySocketIdRef.current,patch);},
      onSeatRequest: requestSeat,
      onAttempt:submitAttempt,onDoorRequest:requestDoor,getDoors:()=>roomRef.current?.doors||{},
      // Optimistic local update — see the matching comment in Lobby.jsx's
      // handleColorChange — the server's own broadcast never echoes back
      // to the sender, so without this the radar's "you" row would be
      // stuck on whichever room the player spawned into.
      onAreaChange: (area) => patchPlayer(mySocketIdRef.current, { area }),
      getUnlockedAreas: () => roomRef.current?.unlockedAreas || ["ai"],
      getTaskProgress: () => roomRef.current?.taskProgress || {},
      onTaskComplete: (area, taskId, answer) => {
        const roomId = roomRef.current?.id;
        if (roomId) completeTask(roomId, area, taskId, answer);
      },
    });
    gameRef.current = game;
    game.start();

    return () => {
      game.destroy();
      gameRef.current = null;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <div id="app">
      <canvas id="game-canvas" ref={canvasRef} />
      <WeaponHUD getPlayer={()=>gameRef.current?.player} getAim={event=>gameRef.current?.getWeaponAim(event)}/>
      <TagHUD/>

      {/* HUD layer: interaction prompts, team progress, flashlight hint */}
      <div id="hud">
        <RoomRadar />
        <RobotProfile />
        <button id="door-button" className="hidden" onClick={()=>gameRef.current?._requestDoor()}>Eshikni ochish · E</button>
        <div id="game-over" className="hidden"><div><h2>Quvvat tugadi</h2><p>Robotingizning quvvati 0%. Bu o‘yin siz uchun tugadi.</p><button onClick={leaveRoom}>Yangi o‘yin</button></div></div>
        <div id="ai-room-guide"><strong>ChatGPT AI Lab</strong> · WASD / ↑↓←→ yurish · E savol · Simlarni ulang · buyumlardan savol toping · Space: o‘tirish</div>
        <div id="arcade-room-guide" className="hidden"><strong>Arcade</strong> · E: o‘ynash · Space: o‘tirish · Kirish panellaridagi boshqotirmalarni bajaring</div>
        <div id="team-progress" className="hidden"></div>
        <div id="area-unlock-toast" className="hidden"></div>
        <div id="energy-bar" className="hidden">
          <span className="energy-bar-label">🔦</span>
          <div className="battery">
            <div className="battery-body">
              <div id="energy-bar-fill" className="battery-fill"></div>
              <div className="battery-shine"></div>
            </div>
            <div className="battery-cap"></div>
          </div>
          <div id="energy-gain-layer" className="energy-gain-layer"></div>
        </div>
        <div id="flashlight-hint" className="hidden">
          <span className="key">F</span>
          <span className="label">Yoritgich</span>
        </div>
        <div id="interaction-prompt" className="hidden">
          <span className="key">E</span>
          <span className="label">Interact</span>
        </div>
      </div>

      {/* Modal layer: a small VS Code-like editor for the terminal's task.
          Markup is kept 1:1 across areas so ModalController's
          getElementById calls keep working — only the theme-* class and
          the task content (JS vs CSS) change per area. */}
      <div id="modal-backdrop" className="hidden">
        <div id="modal" className="modal editor-modal">
          <div className="modal-header">
            <span className="modal-icon">&lt;/&gt;</span>
            <h2 id="modal-title" className="modal-title">
              Programming Terminal
            </h2>
            <button id="btn-close-modal" className="modal-close" aria-label="Close">
              &times;
            </button>
          </div>
          <div className="modal-body editor-body">
            <p id="task-prompt" className="task-prompt"></p>

            <div id="arcade-board" aria-label="Arcade o‘yini"></div>
            <div id="wire-board" aria-label="Sim ulash boshqotirmasi"></div>
            <div id="quiz-options" role="group" aria-label="Javob variantlari"></div>
            <div className="editor-shell">
              <div className="editor-topbar">
                <span className="editor-dot dot-red"></span>
                <span className="editor-dot dot-yellow"></span>
                <span className="editor-dot dot-green"></span>
                <span className="editor-filename">solution.js</span>
              </div>
              <div className="editor-wrap">
                <pre id="editor-gutter" className="editor-gutter">
                  1
                </pre>
                <textarea
                  id="code-input"
                  className="code-input"
                  spellCheck="false"
                  autoCapitalize="off"
                  autoComplete="off"
                ></textarea>
              </div>
            </div>

            <div className="editor-actions">
              <button id="btn-run-code" className="btn btn-primary">
                Run <span className="kbd">Ctrl+Enter</span>
              </button>
              <button id="btn-reset-code" className="btn btn-ghost">
                Reset
              </button>
            </div>

            <div id="result-panel" className="result-panel hidden" role="status" aria-live="polite"></div>
          </div>
        </div>
      </div>
    </div>
  );
}
