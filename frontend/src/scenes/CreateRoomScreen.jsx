import { useState } from "react";
import styles from "./scenes.module.css";
import ColorPicker from "../components/ui/ColorPicker.jsx";
import { usePlayerStore } from "../store/playerStore.js";
import { useRoomSocket } from "../hooks/useRoomSocket.js";
import { MIN_ROOM_PLAYERS, MAX_ROOM_PLAYERS } from "../config/constants.js";

export default function CreateRoomScreen({ onCreated, onCancel }) {
  const nickname = usePlayerStore((s) => s.nickname);
  const color = usePlayerStore((s) => s.color);
  const setNickname = usePlayerStore((s) => s.setNickname);
  const setColor = usePlayerStore((s) => s.setColor);
  const { createRoom } = useRoomSocket();

  const [roomName, setRoomName] = useState("");
  const [maxPlayers, setMaxPlayers] = useState(8);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState(null);

  const canCreate = nickname.trim().length > 0 && !busy;

  async function handleCreate(e) {
    e.preventDefault();
    if (!canCreate) return;
    setBusy(true);
    setError(null);
    try {
      const room = await createRoom({
        hostNickname: nickname.trim(),
        hostColor: color,
        maxPlayers,
        roomName: roomName.trim(),
      });
      onCreated(room);
    } catch {
      setError("Couldn't create a room right now. Try again.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className={styles.screen}>
      <div className={`${styles.blob} ${styles.blobA}`} />
      <div className={`${styles.blob} ${styles.blobB}`} />
      <div className={`${styles.blob} ${styles.blobC}`} />

      <form className={styles.panel} onSubmit={handleCreate}>
        <h1 className={styles.title}>Create Room</h1>
        <p className={styles.subtitle}>Set it up, then share the room code with your team.</p>

        <div className={styles.field}>
          <label className={styles.label} htmlFor="hostNickname">
            Nickname
          </label>
          <input
            id="hostNickname"
            className={styles.input}
            placeholder="e.g. Byte"
            maxLength={16}
            value={nickname}
            onChange={(e) => setNickname(e.target.value)}
            autoComplete="off"
          />
        </div>

        <div className={styles.field}>
          <label className={styles.label}>Robot Color</label>
          <ColorPicker value={color} onChange={setColor} />
        </div>

        <div className={styles.field}>
          <label className={styles.label} htmlFor="roomName">
            Room Name
          </label>
          <input
            id="roomName"
            className={styles.input}
            placeholder="e.g. Night Shift"
            maxLength={24}
            value={roomName}
            onChange={(e) => setRoomName(e.target.value)}
            autoComplete="off"
          />
        </div>

        <div className={styles.field}>
          <label className={styles.label}>
            Maximum Players — <span style={{ color: "#eef2ff" }}>{maxPlayers}</span>
          </label>
          <div className={styles.sliderRow}>
            <input
              type="range"
              min={MIN_ROOM_PLAYERS}
              max={MAX_ROOM_PLAYERS}
              value={maxPlayers}
              onChange={(e) => setMaxPlayers(Number(e.target.value))}
              className={styles.slider}
            />
          </div>
        </div>

        {error && <div className={styles.errorText}>{error}</div>}

        <div className={styles.actions}>
          <button type="button" className={`${styles.btn} ${styles.btnGhost}`} onClick={onCancel}>
            Cancel
          </button>
          <button type="submit" className={`${styles.btn} ${styles.btnPrimary}`} disabled={!canCreate}>
            {busy ? "Creating…" : "Create Room"}
          </button>
        </div>
      </form>
    </div>
  );
}
