import { useState } from "react";
import styles from "./scenes.module.css";
import LobbyCanvas from "../components/game/LobbyCanvas.jsx";
import { useRoomStore, isHost } from "../store/roomStore.js";
import { usePlayerStore } from "../store/playerStore.js";
import { useRoomSocket } from "../hooks/useRoomSocket.js";
import { ROBOT_COLORS } from "../services/robotColors.js";

export default function Lobby({ onLeft }) {
  const room = useRoomStore((s) => s.room);
  const mySocketId = useRoomStore((s) => s.mySocketId);
  const patchPlayer = useRoomStore((s) => s.patchPlayer);
  const setPlayerColor = usePlayerStore((s) => s.setColor);
  const { startGame, leaveRoom, sendPlayerState } = useRoomSocket();
  const [starting, setStarting] = useState(false);
  const [error, setError] = useState(null);

  if (!room) return null;

  const amHost = isHost(room, mySocketId);
  const me = room.players.find((p) => p.id === mySocketId);

  async function handleStart() {
    setStarting(true);
    setError(null);
    try {
      await startGame(room.id);
    } catch {
      setError("Couldn't start the match. Try again.");
      setStarting(false);
    }
  }

  function handleLeave() {
    leaveRoom();
    onLeft();
  }

  function handleColorChange(color) {
    setPlayerColor(color);
    // Optimistic local update — the server broadcast (below) excludes the
    // sender, so without this the player's own avatar wouldn't repaint.
    patchPlayer(mySocketId, { color });
    sendPlayerState({ color });
  }

  return (
    <div className={styles.lobbyRoot}>
      <LobbyCanvas />

      <div className={styles.lobbyTopBar}>
        <div>
          <div className={styles.roomCodeLabel}>Room Code</div>
          <div className={styles.roomCode}>{room.id}</div>
        </div>
        <div className={styles.lobbyDivider} />
        {amHost && <span className={styles.badge}>Host</span>}
        <span className={styles.lobbyHint}>WASD / Arrows to walk</span>
      </div>

      <div className={styles.lobbySidePanel}>
        <div className={styles.playerList}>
          {room.players.map((p) => (
            <div className={styles.playerRow} key={p.id}>
              <span className={styles.dot} style={{ background: p.color }} />
              <span className={styles.playerName}>{p.nickname}</span>
              {p.isHost && <span className={styles.hostTag}>Host</span>}
              {p.id === mySocketId && <span className={styles.youTag}>You</span>}
            </div>
          ))}
        </div>
        <div className={styles.countRow}>
          <span>Players</span>
          <span>
            {room.players.length} / {room.maxPlayers}
          </span>
        </div>
        {error && <div className={styles.errorText}>{error}</div>}
      </div>

      <div className={styles.lobbyBottomBar}>
        <div>
          <div className={styles.lobbyColorLabel}>Your Color</div>
          <div className={styles.lobbySwatchRow}>
            {ROBOT_COLORS.map((c) => (
              <button
                key={c}
                type="button"
                aria-label={`Robot color ${c}`}
                className={`${styles.lobbySwatch} ${me?.color === c ? styles.lobbySwatchActive : ""}`}
                style={{ background: c }}
                onClick={() => handleColorChange(c)}
              />
            ))}
          </div>
        </div>

        <button className={`${styles.smallBtn} ${styles.btnGhost}`} onClick={handleLeave}>
          Leave
        </button>

        {amHost ? (
          <button
            className={`${styles.smallBtn} ${styles.btnPrimary}`}
            onClick={handleStart}
            disabled={starting || room.players.length < 1}
          >
            {starting ? "Starting…" : "Start Game"}
          </button>
        ) : (
          <span className={styles.waitingNote} style={{ marginTop: 0 }}>
            Waiting for host to start…
          </span>
        )}
      </div>
    </div>
  );
}
