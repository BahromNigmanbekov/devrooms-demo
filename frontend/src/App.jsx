import { useEffect, useState } from "react";
import GameCanvas from "./components/game/GameCanvas.jsx";
import JoinScreen from "./scenes/JoinScreen.jsx";
import CreateRoomScreen from "./scenes/CreateRoomScreen.jsx";
import Lobby from "./scenes/Lobby.jsx";
import { useRoomStore } from "./store/roomStore.js";
import "./styles/style.css";

/**
 * Scene machine for Stage 2: join -> create -> lobby -> game.
 * The room's `started` flag (synced from the server via room:state) is the
 * single source of truth for entering the game — both the host (whose
 * room:start ack resolves) and joiners (who receive the same room:state
 * broadcast) transition the same way, so there's no separate "I'm the
 * host, skip ahead" code path to drift out of sync.
 */
export default function App() {
  const room = useRoomStore((s) => s.room);
  const [scene, setScene] = useState("join"); // "join" | "create" | "lobby"

  useEffect(() => {
    if (!room) {
      // Room cleared (left, or server dropped it) — back to entry screens.
      setScene((s) => (s === "join" || s === "create" ? s : "join"));
    } else if (scene !== "lobby" && !room.started) {
      setScene("lobby");
    }
  }, [room, scene]);

  if (room?.started) {
    // Stage 4 adds the door-opening sequence between lobby and here.
    return <GameCanvas />;
  }

  if (scene === "lobby" && room) {
    return <Lobby onLeft={() => setScene("join")} />;
  }

  if (scene === "create") {
    return <CreateRoomScreen onCreated={() => setScene("lobby")} onCancel={() => setScene("join")} />;
  }

  return <JoinScreen onJoined={() => setScene("lobby")} onGoToCreate={() => setScene("create")} />;
}
