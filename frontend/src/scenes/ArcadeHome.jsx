import {useEffect,useRef,useState} from 'react';
import JoinScreen from './JoinScreen.jsx';
import CreateRoomScreen from './CreateRoomScreen.jsx';
import Inventory from '../components/game/Inventory.jsx';
import RobotPreview from '../components/game/RobotPreview.jsx';
import {PixelLogo,ArcadeIcon} from '../components/ui/ArcadeArt.jsx';
import {usePlayerStore} from '../store/playerStore.js';
import {useRoomStore} from '../store/roomStore.js';
import {useRoomSocket} from '../hooks/useRoomSocket.js';
import '../styles/arcadeHome.css';

export default function ArcadeHome({onJoined}) {
 const [panel,setPanel]=useState(null);
 const [motion,setMotion]=useState(()=>localStorage.getItem('devrooms-motion')?localStorage.getItem('devrooms-motion')!=='off':!matchMedia('(prefers-reduced-motion: reduce)').matches);
 const [videoError,setVideoError]=useState(false);
 const video=useRef(null),dialog=useRef(null);
 const {nickname,color,equipment}=usePlayerStore();
 const connected=useRoomStore(s=>s.mySocketId);
 useRoomSocket();
 useEffect(()=>{if(motion)video.current?.play().catch(()=>{});else video.current?.pause();localStorage.setItem('devrooms-motion',motion?'on':'off')},[motion]);
 useEffect(()=>{
  if(!panel||panel==='inventory')return;
  const previous=document.activeElement,node=dialog.current;
  node?.querySelector('button,input')?.focus();
  const key=e=>{if(e.key==='Escape')setPanel(null);if(e.key==='Tab'&&node){const a=[...node.querySelectorAll('button:not(:disabled),input:not(:disabled),a[href]')];if(e.shiftKey&&document.activeElement===a[0]){e.preventDefault();a.at(-1)?.focus()}else if(!e.shiftKey&&document.activeElement===a.at(-1)){e.preventDefault();a[0]?.focus()}}};
  document.addEventListener('keydown',key);return()=>{document.removeEventListener('keydown',key);previous?.focus()};
 },[panel]);
 return <main className="arcade-home">
  <header className="arcade-brand"><h1><PixelLogo/></h1><p><b>LEARN.</b> <i>CODE.</i> <span>EXPLORE.</span> <strong>TOGETHER.</strong></p></header>
  <aside className="arcade-sidebar">
   <nav aria-label="Asosiy menyu">{[['play','PLAY'],['inventory','INVENTORY'],['leaderboard','LEADERBOARD'],['settings','SETTINGS'],['exit','EXIT']].map(([id,label])=><button key={id} className={'menu-button '+(id==='play'?'play-button':'')} onClick={()=>setPanel(id)}><ArcadeIcon name={id}/><span>{label}</span></button>)}</nav>
   <div className="home-profile"><div className="profile-avatar"><RobotPreview color={color} equipment={equipment}/></div><div><strong>{nickname||'CodeMaster'}</strong><span>READY TO PLAY</span><div className="profile-bar"><i/></div><small>YOUR NEXT ADVENTURE AWAITS</small></div></div>
   <footer>© 2026 DevRooms Team <span>v1.0.0</span></footer>
  </aside>
  <section className="arcade-main">
   <div className="arcade-topbar"><span className={connected?'connected':''}><i/>{connected?'ONLINE':'CONNECTING'}<ArcadeIcon name="people"/></span><button aria-label="Play together" onClick={()=>setPanel('play')}><ArcadeIcon name="community"/></button><button aria-label="Settings" onClick={()=>setPanel('settings')}><ArcadeIcon name="settings"/></button><button aria-label="Inventory" onClick={()=>setPanel('inventory')}><ArcadeIcon name="star"/></button></div>
   <div className="arcade-video-stage">
    <div className="video-frame"><video ref={video} autoPlay={motion} muted loop playsInline preload="auto" onError={()=>setVideoError(true)} src="/media/devrooms.mp4"/><div className="watermark-cover" aria-hidden="true"/></div>
    <button className="scene-title" onClick={()=>setPanel('play')}>CHOOSE YOUR PATH</button>
    {videoError&&<div className="video-error">Video yuklanmadi.<button onClick={()=>setPanel('play')}>PLAY</button></div>}
    <button className="video-motion" onClick={()=>setMotion(!motion)} aria-label={motion?'Videoni to‘xtatish':'Videoni yoqish'}>{motion?'Ⅱ':'▶'}</button>
   </div>
   <div className="arcade-benefits">{[['leaderboard','SOLVE','TASKS'],['code','LEARN','SKILLS'],['people','PLAY','TOGETHER'],['star','LEVEL','UP']].map(([icon,a,b])=><button key={a} onClick={()=>setPanel('play')}><ArcadeIcon name={icon}/><span>{a}<br/>{b}</span></button>)}</div>
  </section>
  {panel==='inventory'&&<Inventory onClose={()=>setPanel(null)}/>}
  {['play','create'].includes(panel)&&<div className="arcade-overlay entry-overlay" onClick={()=>setPanel(null)}><section ref={dialog} className="entry-window" role="dialog" aria-modal="true" aria-label="Create or join a room" onClick={e=>e.stopPropagation()}><button className="arcade-close" onClick={()=>setPanel(null)} aria-label="Yopish">×</button><div className="entry-tabs" role="tablist" aria-label="O‘yin rejimi"><button role="tab" aria-selected={panel==='play'} onClick={()=>setPanel('play')}>JOIN ROOM</button><button role="tab" aria-selected={panel==='create'} onClick={()=>setPanel('create')}>CREATE ROOM</button></div>{panel==='create'?<CreateRoomScreen onCreated={onJoined} onCancel={()=>setPanel('play')}/>:<JoinScreen onJoined={onJoined} onGoToCreate={()=>setPanel('create')}/>}</section></div>}
  {['settings','leaderboard','exit'].includes(panel)&&<div className="arcade-overlay" onClick={()=>setPanel(null)}><section ref={dialog} className="info-window" role="dialog" aria-modal="true" aria-label={panel} onClick={e=>e.stopPropagation()}><button className="arcade-close" onClick={()=>setPanel(null)} aria-label="Yopish">×</button><ArcadeIcon name={panel}/><h2>{panel.toUpperCase()}</h2>{panel==='settings'?<><p>Ko‘rinish sozlamalari</p><label className="setting-toggle"><span>Animatsiyali fon<small>Asl sifatdagi video, ovozsiz takrorlanadi</small></span><input type="checkbox" checked={motion} onChange={e=>setMotion(e.target.checked)}/></label></>:panel==='leaderboard'?<div className="empty-state"><ArcadeIcon name="leaderboard"/><h3>Hali natijalar yo‘q</h3><p>Do‘stlaringiz bilan o‘ynang va topshiriqlarni bajaring.</p><button className="small-arcade-button" onClick={()=>setPanel('play')}>LET’S PLAY</button></div>:<><p>Yana bir sarguzasht kutmoqda. Menyuga qaytishingiz yoki ushbu brauzer oynasini yopishingiz mumkin.</p><button className="small-arcade-button" onClick={()=>setPanel(null)}>BACK TO MENU</button></>}</section></div>}
 </main>;
}
