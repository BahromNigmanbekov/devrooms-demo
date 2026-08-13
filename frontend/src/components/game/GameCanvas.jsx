import { useEffect, useRef } from "react";
import { Game } from "../../engine/core/Game.js";
import { useRoomStore } from "../../store/roomStore.js";
import { useRoomSocket } from "../../hooks/useRoomSocket.js";
import RoomRadar from "./RoomRadar.jsx";

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
  const { sendPlayerState, completeTask } = useRoomSocket();
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
      onLocalMove: sendPlayerState,
      // Optimistic local update — see the matching comment in Lobby.jsx's
      // handleColorChange — the server's own broadcast never echoes back
      // to the sender, so without this the radar's "you" row would be
      // stuck on whichever room the player spawned into.
      onAreaChange: (area) => patchPlayer(mySocketIdRef.current, { area }),
      getUnlockedAreas: () => roomRef.current?.unlockedAreas || ["office"],
      getTaskProgress: () => roomRef.current?.taskProgress || {},
      onTaskComplete: (area, taskId) => {
        const roomId = roomRef.current?.id;
        if (roomId) completeTask(roomId, area, taskId);
      },
    });
    gameRef.current = game;
    game.start();

    return () => {
      // Game has no explicit destroy() yet (Stage 1 parity with the
      // original main.js, which never tore it down either) — resize
      // listeners are cleaned up defensively here so React StrictMode's
      // double-mount in dev doesn't stack duplicate listeners.
      window.removeEventListener("resize", game._resize);
      window.removeEventListener("orientationchange", game._resize);
      if (game._resizeObserver) game._resizeObserver.disconnect();
      gameRef.current = null;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <div id="app">
      <canvas id="game-canvas" ref={canvasRef} />

      {/* HUD layer: interaction prompts, team progress, flashlight hint */}
      <div id="hud">
        <RoomRadar />
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

            <div id="result-panel" className="result-panel hidden"></div>
          </div>
        </div>
      </div>
    </div>
  );
}
