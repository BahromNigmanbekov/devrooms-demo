import { useState } from "react";
import styles from "./scenes.module.css";
import ColorPicker from "../components/ui/ColorPicker.jsx";
import { usePlayerStore } from "../store/playerStore.js";
import { useRoomSocket } from "../hooks/useRoomSocket.js";

export default function JoinScreen({ onJoined, onGoToCreate }) {
  const nickname = usePlayerStore((s) => s.nickname);
  const color = usePlayerStore((s) => s.color);
  const setNickname = usePlayerStore((s) => s.setNickname);
  const setColor = usePlayerStore((s) => s.setColor);
  const { joinRoom } = useRoomSocket();

  const [roomId, setRoomId] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState(null);

  const canJoin = nickname.trim().length > 0 && roomId.trim().length > 0 && !busy;

  async function handleJoin(e) {
    e.preventDefault();
    if (!canJoin) return;
    setBusy(true);
    setError(null);
    try {
      const room = await joinRoom({ roomId: roomId.trim(), nickname: nickname.trim(), color });
      onJoined(room);
    } catch (err) {
      setError(readableError(err));
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className={styles.screen}>
      <div className={`${styles.blob} ${styles.blobA}`} />
      <div className={`${styles.blob} ${styles.blobB}`} />
      <div className={`${styles.blob} ${styles.blobC}`} />

      <form className={styles.panel} onSubmit={handleJoin}>
        <h1 className={styles.title}>Office Grid</h1>
        <p className={styles.subtitle}>Enter your details and a room code to join a match.</p>

        <div className={styles.field}>
          <label className={styles.label} htmlFor="nickname">
            Nickname
          </label>
          <input
            id="nickname"
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
          <label className={styles.label} htmlFor="roomId">
            Room Code
          </label>
          <input
            id="roomId"
            className={`${styles.input} ${styles.inputWide}`}
            placeholder="ABCDE"
            maxLength={8}
            value={roomId}
            onChange={(e) => setRoomId(e.target.value.toUpperCase())}
            autoComplete="off"
          />
        </div>

        {error && <div className={styles.errorText}>{error}</div>}

        <div className={styles.actions}>
          <button type="submit" className={`${styles.btn} ${styles.btnPrimary}`} disabled={!canJoin}>
            {busy ? "Joining…" : "Join Room"}
          </button>
        </div>

        <div className={styles.linkRow}>
          Don't have a room?{" "}
          <button type="button" className={styles.link} onClick={onGoToCreate}>
            Create one instead
          </button>
        </div>
      </form>
    </div>
  );
}

function readableError(err) {
  switch (err) {
    case "ROOM_NOT_FOUND":
      return "No room with that code exists.";
    case "ROOM_FULL":
      return "That room is already full.";
    case "ROOM_ALREADY_STARTED":
      return "That match has already started.";
    default:
      return "Couldn't join that room. Try again.";
  }
}
