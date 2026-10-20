import {useEffect,useRef,useState} from 'react';
import {useRoomStore} from '../../store/roomStore.js';
import {getSocket} from '../../network/socketClient.js';
import {getWeapon} from '../../../../shared/equipment.mjs';
export default function WeaponHUD({getPlayer,getAim}){
 const me=useRoomStore(s=>s.room?.players.find(p=>p.id===s.mySocketId));
 const item=getWeapon(me?.equipment?.weapon),pending=useRef(false);
 const [now,setNow]=useState(Date.now()),[notice,setNotice]=useState('');
 const useRefAction=useRef(null);
 function use(event){
  if(!item||pending.current||Date.now()<(me?.weaponReadyAt||0)||me?.eliminated||me?.seated||document.querySelector('.arcade-overlay,#modal-backdrop.open'))return;
  pending.current=true;const socket=getSocket(),player=getPlayer();
  const facing=getAim?.(event)||player?.facing;
  if(player){player.facing=facing;socket.emit('player:state',{x:player.x,y:player.y,facing,moving:player.moving,aiming:player.aiming});}
  socket.timeout(3000).emit('weapon:use',{},(error,result)=>{
   pending.current=false;
   if(error){setNotice('Aloqa uzildi. Qayta urinib ko‘ring.');return;}
   if(!result?.ok){if(result?.error!=='COOLDOWN')setNotice('Hozir ishlatib bo‘lmaydi.');return;}
   setNotice(result.effect.hits?.length?result.effect.hits.some(h=>h.destroyed)?'DRON YENGILDI · +10 MASHQ':'NISHONGA TEGDI':{heal:'JAMOA QUVVATI +15',shield:'6 SONIYA HIMOYA',scan:'6 SONIYA SKANER',pulse:'ENERGIYA TO‘LQINI',melee:'QILICH ZARBASI',ranged:'ENERGIYA O‘QI'}[item.type]);
  });
 }
 useRefAction.current=use;
 useEffect(()=>{
  let held=false;const canvas=document.getElementById('game-canvas');
  const down=e=>{if(e.button!==0)return;held=true;useRefAction.current?.(e)},up=()=>{held=false};
  const tick=setInterval(()=>{setNow(Date.now());if(held)useRefAction.current?.()},60);
  const key=e=>{if(e.code==='KeyQ'&&!/INPUT|TEXTAREA/.test(e.target?.tagName)&&!e.target?.isContentEditable){e.preventDefault();useRefAction.current?.()}};
  canvas?.addEventListener('pointerdown',down);window.addEventListener('pointerup',up);window.addEventListener('pointercancel',up);window.addEventListener('blur',up);window.addEventListener('keydown',key);
  return()=>{clearInterval(tick);canvas?.removeEventListener('pointerdown',down);window.removeEventListener('pointerup',up);window.removeEventListener('pointercancel',up);window.removeEventListener('blur',up);window.removeEventListener('keydown',key)};
 },[]);
 useEffect(()=>{if(!notice)return;const t=setTimeout(()=>setNotice(''),1700);return()=>clearTimeout(t)},[notice]);
 if(!item)return <div className="weapon-hud weapon-empty">Aslahani INVENTORY → Aslahalar bo‘limidan tanlang.</div>;
 const remaining=Math.max(0,(me.weaponReadyAt||0)-now);
 return <section className="weapon-hud" aria-label="Aslaha boshqaruvi"><div className="weapon-hud-info"><strong style={{color:item.color}}>{item.name}</strong><small>{item.description}</small><small>Sichqoncha: nishon / chap tugma: ishlatish</small><small>{me.area==='ai'?'Mashq dronlari: o‘ngdagi yo‘lakda →':'Yurish tomoningizga qarab ishlatiladi'}</small><span>{item.damage?`${item.damage} ZARBA · ${item.range} MASOFA`:'JAMOA YORDAMI'} · {me.practiceScore||0} MASHQ</span></div><button onClick={()=>use()} disabled={remaining>0||me.eliminated||!!me.seated} style={{'--weapon-color':item.color}}><kbd>Q</kbd>{remaining>0?(remaining/1000).toFixed(1)+'s':'ISHLATISH'}</button><div className="weapon-cooldown"><i style={{width:(remaining?Math.max(0,1-remaining/item.cooldown)*100:100)+'%',background:item.color}}/></div>{notice&&<div className="weapon-notice" role="status">{notice}</div>}{me.shieldUntil>now&&<div className="weapon-buff">HIMOYA · {Math.ceil((me.shieldUntil-now)/1000)}s</div>}{me.scanUntil>now&&<div className="weapon-buff">SKANER · {Math.ceil((me.scanUntil-now)/1000)}s</div>}</section>;
}
