import { useRoomStore } from "../../store/roomStore.js";
import { AREA_SEQUENCE } from "../../maps/areas.js";
const labels={ai:"AI Lab",office:"Ofis",park:"Arcade"};
export default function RoomRadar() {
 const room=useRoomStore(s=>s.room),myId=useRoomStore(s=>s.mySocketId);
 if(!room)return null;
 const me=room.players.find(p=>p.id===myId),current=me?.area||"ai";
 return <section id="room-radar" className="mini-radar area-radar" aria-label="Hududlar radari">
  <div className="mini-radar-heading"><span><i/> RADAR</span><span>{room.players.length} ROBOT</span></div>
  <svg className="radar-map" viewBox="0 0 192 66" role="img" aria-label="AI Lab, Ofis va Arcade hududlari">
   {[0,1].map(i=><rect key={"hall"+i} x={54+i*67} y="31" width="17" height="9" fill="#566268"/>)}
   {AREA_SEQUENCE.map((key,index)=>{
    const x=4+index*67,active=key===current,unlocked=room.unlockedAreas?.includes(key);
    const players=room.players.filter(p=>(p.area||"ai")===key);
    return <g key={key} className="radar-area" data-area={key} aria-label={labels[key]+": "+players.length+" robot"}>
     <rect x={x} y="8" width="50" height="52" rx="3" fill={active?"#3b4b4b":"#293238"} stroke={active?"#a7bdb0":"#626e73"} strokeWidth={active?1.5:1} strokeDasharray={unlocked||active?undefined:"3 2"}/>
     <text x={x+25} y="21" textAnchor="middle" fill={active?"#e0e9e3":"#a1adb2"} fontSize="8" fontFamily="Courier New" fontWeight="bold">{labels[key]}</text>
     {players.map((p,i)=><g key={p.id} className={p.id===myId?"radar-player radar-self":"radar-player"} data-player-id={p.id} transform={`translate(${x+11+(i%4)*9} ${30+Math.floor(i/4)*7})`} opacity={p.eliminated?0.4:1}>
      <title>{room.tag?.active&&room.tag.hunterId===p.id?'Ovchi':p.nickname} · {labels[key]}{p.id===myId?" · Siz":""}</title>
      {p.id===myId&&<circle r="3.8" fill="none" stroke="#edf2ee" strokeWidth=".8"/>}
      <circle r={room.tag?.active&&room.tag.hunterId===p.id?3.2:2.4} fill={room.tag?.active&&room.tag.hunterId===p.id?'#ff965f':p.color||"#8ab5a0"}/>
     </g>)}
    </g>;
   })}
  </svg>
  <div className="radar-map-caption"><span>{labels[current]||"AI Lab"}</span><span className="radar-self-key">◎ Siz</span></div>
 </section>;
}
