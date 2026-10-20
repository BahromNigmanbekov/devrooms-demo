import {useEffect,useState} from 'react';
import {useRoomStore} from '../../store/roomStore.js';
import {getSocket} from '../../network/socketClient.js';
export default function TagHUD(){
 const room=useRoomStore(s=>s.room),id=useRoomStore(s=>s.mySocketId);
 const [busy,setBusy]=useState(false),[error,setError]=useState(''),[now,setNow]=useState(Date.now());
 useEffect(()=>{const timer=setInterval(()=>setNow(Date.now()),200);return()=>clearInterval(timer)},[]);
 if(!room)return null;
 const active=room.tag?.active,host=room.hostId===id,hunter=room.tag?.hunterId===id;
 const enough=room.players.filter(p=>!p.eliminated).length>=2;
 async function toggle(){setBusy(true);setError('');getSocket().timeout(4000).emit('tag:set',{active:!active},(err,result)=>{setBusy(false);if(err||!result?.ok)setError(result?.error==='NEED_PLAYERS'?'Kamida 2 ta o‘yinchi kerak.':'Hozir o‘zgartirib bo‘lmadi.');});}
 const waiting=active?Math.max(0,Math.ceil(((room.tag.readyAt||0)-now)/1000)):0;
 return <section className={'tag-hud '+(active?'tag-active ':'')+(hunter?'tag-hunter':'')} aria-label="Quvlashmachoq">
  <div><strong>{active?hunter?'SIZ OVCHISIZ':'OVCHIDAN QOCHING':'QUVLASHMACHOQ'}</strong>{active?<small>{waiting?`${waiting}s · tayyorlaning`:'Tegish bilan Ovchi boshqa robotga o‘tadi'} · Barcha xonalar ochiq</small>:<small>{!enough?'Boshlash uchun kamida 2 ta o‘yinchi kerak.':host?'Tasodifiy Ovchi tanlanadi. Tegish bilan rol almashadi.':'Admin quvlashmachoqni boshlashi mumkin.'}</small>}</div>
  {host&&<button disabled={busy||(!active&&room.players.filter(p=>!p.eliminated).length<2)} onClick={toggle}>{busy?'...':active?'TO‘XTATISH':'BOSHLASH'}</button>}
  {active&&<span className="tag-transfers">{room.tag.transfers||0} ALMASHUV</span>}{error&&<p role="status">{error}</p>}
 </section>;
}
