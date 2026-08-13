import { useRoomStore } from "../../store/roomStore.js";
import { AREAS, AREA_SEQUENCE } from "../../maps/areas.js";

/**
 * Team status panel shown for the whole game session (mounted alongside the
 * canvas in GameCanvas, so it's visible from the moment the match starts):
 * every teammate's color + nickname next to which top-level room (Office vs
 * Park — the only granularity the server actually tracks per player) they're
 * currently walking around in. Backed by the same room.players[].area field
 * Game.js already uses to decide which remote players to draw.
 */
export default function RoomRadar() {
  const room = useRoomStore((s) => s.room);
  const mySocketId = useRoomStore((s) => s.mySocketId);

  if (!room) return null;

  return (
    <div id="room-radar" className="hud-panel">
      <div className="radar-title">Radar</div>
      <div className="radar-list">
        {room.players.map((p) => {
          const area = AREAS[p.area] || AREAS[AREA_SEQUENCE[0]];
          return (
            <div className="radar-row" key={p.id}>
              <span className="radar-dot" style={{ background: p.color }} />
              <span className="radar-name">{p.nickname}</span>
              {p.id === mySocketId && <span className="radar-you">Siz</span>}
              <span className="radar-room">{area.label}</span>
            </div>
          );
        })}
      </div>
    </div>
  );
}
