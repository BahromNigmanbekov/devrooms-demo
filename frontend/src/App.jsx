import {useState} from 'react';
import ArcadeHome from './scenes/ArcadeHome.jsx';
import Inventory from './components/game/Inventory.jsx';
import GameCanvas from './components/game/GameCanvas.jsx';
import Lobby from './scenes/Lobby.jsx';
import {useRoomStore} from './store/roomStore.js';
import './styles/style.css';
import './styles/arcadeHome.css';
export default function App() {
 const room=useRoomStore(s=>s.room);
 const [inventory,setInventory]=useState(false);
 if(!room)return <ArcadeHome onJoined={()=>setInventory(false)}/>;
 return <>{room.started?<GameCanvas/>:<Lobby onLeft={()=>setInventory(false)}/>}<button className={'in-game-inventory '+(!room.started?'lobby-inventory':'')} onClick={()=>setInventory(true)}>{"\u25a3"} INVENTORY</button>{inventory&&<Inventory onClose={()=>setInventory(false)}/>}</>;
}
