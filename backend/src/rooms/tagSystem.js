import {randomInt} from 'node:crypto';
import {hasLineOfSight} from '../../../frontend/src/engine/systems/InteractionSystem.js';
const eligible=room=>[...room.players.values()].filter(p=>!p.eliminated);
export function startTag(room,requesterId,now=Date.now(),choose=randomInt){
 if(!room?.started)return {ok:false,error:'NOT_STARTED'};
 if(room.hostId!==requesterId)return {ok:false,error:'NOT_HOST'};
 if(room.tag?.active)return {ok:false,error:'ALREADY_ACTIVE'};
 const players=eligible(room);if(players.length<2)return {ok:false,error:'NEED_PLAYERS'};
 const hunter=players[choose(players.length)];
 room.tag={active:true,hunterId:hunter.id,startedAt:now,transferAt:now,readyAt:now+3000,transfers:0,previousHunterId:null,immuneUntil:0};
 for(const p of players){p.seated=false;p.seatId=null;}
 return {ok:true,roomId:room.id,tag:room.tag};
}
export function stopTag(room,requesterId){
 if(!room||room.hostId!==requesterId)return {ok:false,error:'NOT_HOST'};
 room.tag={...room.tag,active:false,hunterId:null,readyAt:0};return {ok:true,roomId:room.id,tag:room.tag};
}
export function tickTag(room,wallsForArea,now=Date.now(),choose=randomInt){
 if(!room.tag?.active)return false;
 const players=eligible(room);
 if(players.length<2){room.tag={...room.tag,active:false,hunterId:null,readyAt:0};return true;}
 const hunter=players.find(p=>p.id===room.tag.hunterId);
 if(!hunter){room.tag={...room.tag,hunterId:players[choose(players.length)].id,readyAt:now+3000,transferAt:now,previousHunterId:null};return true;}
 if(now<room.tag.readyAt)return false;
 const target=players.filter(p=>p.id!==hunter.id&&p.area===hunter.area&&!(p.id===room.tag.previousHunterId&&now<room.tag.immuneUntil)&&Math.hypot(p.x-hunter.x,p.y-hunter.y)<=34)
  .sort((a,b)=>Math.hypot(a.x-hunter.x,a.y-hunter.y)-Math.hypot(b.x-hunter.x,b.y-hunter.y))
  .find(p=>hasLineOfSight(hunter,{x:p.x-1,y:p.y-1,w:2,h:2},wallsForArea(hunter.area)));
 if(!target)return false;
 room.tag={...room.tag,hunterId:target.id,previousHunterId:hunter.id,immuneUntil:now+3000,transferAt:now,readyAt:now+1500,transfers:room.tag.transfers+1};
 target.seated=false;target.seatId=null;return true;
}
