import {useEffect,useRef,useState} from 'react';
import {usePlayerStore} from '../../store/playerStore.js';
import {useRoomStore} from '../../store/roomStore.js';
import {getSocket} from '../../network/socketClient.js';
import {ROBOT_COLORS} from '../../services/robotColors.js';
import {ArcadeIcon} from '../ui/ArcadeArt.jsx';
import {EQUIPMENT} from '../../../../shared/equipment.mjs';
import RobotPreview from './RobotPreview.jsx';

const items=Object.fromEntries(Object.entries(EQUIPMENT).map(([slot,rows])=>[slot,[['none',slot==='head'?'Original':slot==='back'?'No backpack':'Unarmed',slot==='head'?'Bosh kiyimsiz':slot==='back'?'Ryukzaksiz':'Aslahasiz'],...rows.map(i=>[i.id,i.name,i.description])]]));
const tabs=[['head','Bosh kiyimlar'],['back','Ryukzaklar'],['weapon','Aslahalar'],['color','Ranglar']];
const descriptions={head:'30 xil bosh kiyim va shlem. Robotga tanlab taqing.',back:'30 xil orqa jihoz. Orqa ko`rinishda tekshiring.',weapon:'Qilich, avtomat va skipetrlar. Q yoki ISHLATISH tugmasi bilan foydalaning.',color:'30 xil tana rangi. Aksessuarlar saqlanadi.'};
export default function Inventory({onClose}) {
 const [search,setSearch]=useState('');
 const [category,setCategory]=useState('head'),[back,setBack]=useState(false);
 const dialog=useRef(null);
 const {color,equipment,setEquipment,setColor,nickname}=usePlayerStore();
 useEffect(()=>{
  const previous=document.activeElement,node=dialog.current;
  node.querySelector('button').focus();
  const key=e=>{if(e.key==='Escape')onClose();if(e.key==='Tab'){const b=[...node.querySelectorAll('button:not(:disabled),input')];if(e.shiftKey&&document.activeElement===b[0]){e.preventDefault();b.at(-1).focus()}else if(!e.shiftKey&&document.activeElement===b.at(-1)){e.preventDefault();b[0].focus()}}};
  node.addEventListener('keydown',key);return()=>{node.removeEventListener('keydown',key);previous?.focus()};
 },[]);
 function sync(patch){const {room,mySocketId,patchPlayer}=useRoomStore.getState();if(room){patchPlayer(mySocketId,patch);getSocket().emit('player:state',patch)}}
 function equip(slot,id){const next={...equipment,[slot]:id};setEquipment(next);sync({equipment:next})}
 function changeColor(next){setColor(next);sync({color:next})}
 function changeCategory(next){setCategory(next);setSearch('');setBack(next==='back')}
 const selectedCount=['head','back','weapon'].filter(slot=>equipment[slot]&&equipment[slot]!=='none').length;
 const visible=(items[category]||[]).filter(row=>row.join(' ').toLowerCase().includes(search.toLowerCase()));
 return <div className="arcade-overlay" onClick={onClose}>
  <section ref={dialog} className="inventory-window" role="dialog" aria-modal="true" aria-labelledby="inventory-title" onClick={e=>e.stopPropagation()}>
   <button className="arcade-close" onClick={onClose} aria-label="Yopish">×</button>
   <header className="inventory-heading"><ArcadeIcon name="inventory"/><div><small>YOUR ROBOT. YOUR STYLE.</small><h2 id="inventory-title">INVENTORY</h2></div></header>
   <div className="inventory-layout">
    <aside className="inventory-preview"><small>CHARACTER PREVIEW</small><div className="preview-orbit"><RobotPreview color={color} equipment={equipment} back={back}/></div><div className="preview-views" role="group" aria-label="Robot ko‘rinishi"><button aria-pressed={!back} onClick={()=>setBack(false)}>OLD TOMON</button><button aria-pressed={back} onClick={()=>setBack(true)}>ORQA TOMON</button></div><h3>{nickname||'Your robot'}</h3><div className="loadout-summary"><p><span>Bosh kiyim</span>{items.head.find(i=>i[0]===equipment.head)?.[1]||'Original'}</p><p><span>Ryukzak</span>{items.back.find(i=>i[0]===equipment.back)?.[1]||'None'}</p><p><span>Aslaha</span>{items.weapon.find(i=>i[0]===equipment.weapon)?.[1]||'Unarmed'}</p></div></aside>
    <div className="inventory-content"><div className="inventory-tabs" role="tablist" aria-label="Inventory bo‘limlari">{tabs.map(([id,label])=><button key={id} role="tab" id={'inventory-tab-'+id} aria-controls="inventory-category" aria-selected={category===id} onClick={()=>changeCategory(id)}>{label}</button>)}</div><p className="category-description">{descriptions[category]}</p><div className="inventory-tools"><input className="inventory-search" aria-label="Inventory qidirish" placeholder="Nom bilan qidirish..." value={search} onChange={e=>setSearch(e.target.value)}/><span className="inventory-count">{category==='color'?ROBOT_COLORS.length:EQUIPMENT[category].length} TA</span></div><div id="inventory-category" role="tabpanel" aria-labelledby={'inventory-tab-'+category}>
     {category==='color'?<div className="color-inventory">{ROBOT_COLORS.map(c=><button key={c} aria-label={'Robot color '+c} aria-pressed={color===c} style={{background:c}} onClick={()=>changeColor(c)}>{color===c?'✓':''}</button>)}</div>:<div className="inventory-grid">{visible.map(([id,name,description])=><button key={id} className={'inventory-item '+(equipment[category]===id?'equipped':'')} onClick={()=>equip(category,id)} aria-pressed={equipment[category]===id}><RobotPreview color={color} equipment={{...equipment,[category]:id}} back={category==='back'}/><strong>{name}</strong><small className="item-function">{description}</small><b>{equipment[category]===id?'✓ TAQILGAN':'TAQISH'}</b></button>)}</div>}
    </div><footer className="inventory-free"><span>Barcha aksessuarlar bepul</span><b>{selectedCount}/3 JIHOZ TAQILGAN</b></footer></div>
   </div>
  </section>
 </div>;
}
