import { useEffect, useRef } from "react";
import { useRoomStore } from "../../store/roomStore.js";
import { Renderer } from "../../engine/render/Renderer.js";
export default function RobotProfile() {
 const room=useRoomStore(s=>s.room),id=useRoomStore(s=>s.mySocketId);
 const me=room?.players.find(p=>p.id===id),portrait=useRef(null);
 const energy=me?.energy??100,color=me?.color||"#5b8cff";
 useEffect(()=>{
  const ctx=portrait.current?.getContext("2d");if(!ctx)return;
  ctx.setTransform(1,0,0,1,0,0);ctx.clearRect(0,0,128,128);ctx.setTransform(2,0,0,2,0,0);
  new Renderer(ctx).drawPlayer({x:32,y:35,radius:15,color,facing:{x:0,y:1},moving:false,nickname:""});
 },[color]);
 return <section id="robot-power" className="robot-profile" aria-label="Robot profili va quvvati" style={{"--robot-color":color,"--charge-color":energy<=25?"#c7776b":energy<=50?"#c2a46d":"#8ab5a0"}}>
  <div className="robot-portrait-frame"><canvas ref={portrait} width="128" height="128" className="robot-portrait" role="img" aria-label={me?.nickname+" tanlagan robot"}/><span className="profile-status-dot"/></div>
  <div className="profile-details">
   <div className="profile-name">{me?.nickname||"Robot"}<span>SIZ</span></div>
   <div className="profile-energy-label"><span>QUVVAT</span><strong id="power-value">{energy}%</strong></div>
   <div className="profile-battery" title="Xato: -25%. To'g'ri: +10%. Maksimum: 100%." role="meter" aria-label="Robot quvvati" aria-valuemin={0} aria-valuemax={100} aria-valuenow={energy}>
    {[0,1,2,3].map(i=><span className="charge-cell" key={i}><i style={{width:Math.max(0,Math.min(100,(energy-i*25)*4))+"%"}}/></span>)}
   </div>
  </div>
 </section>;
}
