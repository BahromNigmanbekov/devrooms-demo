import {getWeapon} from '../../../shared/equipment.mjs';
import {hasLineOfSight} from '../../../frontend/src/engine/systems/InteractionSystem.js';

export function createTrainingTargets(){return [
 {id:'training-1',area:'ai',x:1100,y:900,hp:100,maxHp:100,respawnAt:0},
 {id:'training-2',area:'ai',x:1260,y:900,hp:100,maxHp:100,respawnAt:0},
 {id:'training-3',area:'ai',x:1420,y:900,hp:100,maxHp:100,respawnAt:0},
];}
const visible=(a,b,walls)=>hasLineOfSight(a,{x:b.x-1,y:b.y-1,w:2,h:2},walls);
export function useWeapon(room,player,walls,now=Date.now()){
 if(!room?.started||!player||player.eliminated||player.seated)return {ok:false,error:'UNAVAILABLE'};
 const item=getWeapon(player.equipment?.weapon);
 if(!item)return {ok:false,error:'NO_WEAPON'};
 if(now<(player.weaponReadyAt||0))return {ok:false,error:'COOLDOWN',readyAt:player.weaponReadyAt};
 const facing=player.facing||{x:0,y:1},length=Math.hypot(facing.x,facing.y)||1;
 const dir={x:facing.x/length,y:facing.y/length};
 player.weaponReadyAt=now+item.cooldown;
 player.weaponAction={at:now,weapon:item.id};
 const changed=new Map([[player.id,player]]),hits=[];
 for(const t of room.trainingTargets)if(!t.hp&&now>=t.respawnAt){t.hp=t.maxHp;t.respawnAt=0;}
 const effect={id:player.id+'-'+now,at:now,area:player.area,x:player.x,y:player.y,dx:dir.x,dy:dir.y,range:item.range,color:item.color,type:item.type,weapon:item.id};
 if(['heal','shield'].includes(item.type)){
  for(const ally of room.players.values()){
   if(ally.eliminated||ally.area!==player.area||Math.hypot(ally.x-player.x,ally.y-player.y)>item.range||!visible(player,ally,walls))continue;
   if(item.type==='heal')ally.energy=Math.min(100,ally.energy+15);
   else ally.shieldUntil=now+6000;
   changed.set(ally.id,ally);
  }
 }else if(item.type==='scan'){player.scanUntil=now+6000;player.scanRange=item.range;}
 else{
  const candidates=room.trainingTargets.filter(t=>{
   if(t.area!==player.area||!t.hp)return false;
   const dx=t.x-player.x,dy=t.y-player.y,dist=Math.hypot(dx,dy);
   if(dist>item.range||!visible(player,t,walls))return false;
   if(item.type==='pulse')return true;
   const forward=dx*dir.x+dy*dir.y,side=Math.abs(dx*dir.y-dy*dir.x);
   return item.type==='ranged'?forward>0&&side<(item.id==='gun-scatter'?60:25):forward>0&&forward/Math.max(1,dist)>.25;
  }).sort((a,b)=>Math.hypot(a.x-player.x,a.y-player.y)-Math.hypot(b.x-player.x,b.y-player.y));
  const targets=item.type==='ranged'&&item.id!=='gun-scatter'?candidates.slice(0,1):candidates;
  for(const t of targets){t.hp=Math.max(0,t.hp-item.damage);hits.push({id:t.id,x:t.x,y:t.y,damage:item.damage,destroyed:!t.hp});if(!t.hp){t.respawnAt=now+8000;player.practiceScore=(player.practiceScore||0)+10;}}
  if(item.type==='ranged'){
   // Clip the visible beam at the first wall/closed door as well as hits.
   let range=targets.length?Math.hypot(targets[0].x-player.x,targets[0].y-player.y):item.range;
   for(let r=8;r<range;r+=8){const end={x:player.x+dir.x*r,y:player.y+dir.y*r};if(!visible(player,end,walls)){range=Math.max(0,r-8);break;}}
   effect.range=range;
  }
 }
 effect.hits=hits;
 return {ok:true,roomId:room.id,players:[...changed.values()].map(p=>({...p})),targets:room.trainingTargets.map(t=>({...t})),effect,readyAt:player.weaponReadyAt};
}
