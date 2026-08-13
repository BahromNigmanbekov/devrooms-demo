import { useEffect, useRef } from "react";
import { LobbyEngine } from "../../engine/lobby/LobbyEngine.js";
import { useRoomStore } from "../../store/roomStore.js";
import { useRoomSocket } from "../../hooks/useRoomSocket.js";

export default function LobbyCanvas() {
  const canvasRef = useRef(null);
  const { sendPlayerState } = useRoomSocket();

  // The engine reads room/identity through refs (kept fresh every render)
  // instead of props, so it never needs to be torn down and rebuilt when
  // a player list update or a color change flows through the store —
  // only the render loop's next frame picks it up.
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

    const engine = new LobbyEngine(canvas, {
      getMySocketId: () => mySocketIdRef.current,
      getPlayers: () => roomRef.current?.players || [],
      onLocalMove: sendPlayerState,
    });
    engine.start();

    return () => engine.destroy();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return <canvas ref={canvasRef} style={{ position: "fixed", inset: 0, display: "block" }} />;
}
