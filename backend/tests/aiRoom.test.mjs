import test from "node:test";
import assert from "node:assert/strict";
import {roomManager as rm} from "../src/rooms/roomManager.js";
import {AI_ACTIVITIES,validateAIAnswer} from "../../shared/aiActivities.mjs";
import {AREAS} from "../../frontend/src/maps/areas.js";
import {CollisionSystem} from "../../frontend/src/engine/systems/CollisionSystem.js";
import {buildSeats,findStandingPosition} from "../../frontend/src/engine/systems/SeatSystem.js";
import {hasLineOfSight} from "../../frontend/src/engine/systems/InteractionSystem.js";
const answer=task=>task.type==="wires"?task.left.map(pin=>task.right.findIndex(target=>target.key===pin.key)):task.answer;
test("wire matching, prerequisites, discovery quizzes and shared progress",()=>{
 const room=rm.createRoom({hostSocketId:"host",hostNickname:"Host",maxPlayers:4});
 try{
  rm.startRoom(room.id,"host");
  assert.equal(rm.serializeRoom(room).taskProgress.ai.total,14);
  const terminal=AI_ACTIVITIES.find(t=>t.id==="terminal-ai-1");
  assert.equal(rm.completeTask(room.id,"ai",terminal.id,terminal.answer),null);
  for(const task of AI_ACTIVITIES){
   const correct=answer(task);
   assert(validateAIAnswer(task,correct));
   const wrong=task.type==="wires"?[0,0,0,0]:(task.answer+1)%3;
   assert.equal(rm.completeTask(room.id,"ai",task.id,wrong),null);
   const first=rm.completeTask(room.id,"ai",task.id,correct);
   assert(first);
   assert.equal(rm.completeTask(room.id,"ai",task.id,correct).completed,first.completed);
  }
  assert(room.unlockedAreas.has("office"));
  assert.equal(rm.serializeRoom(room).solvedTasks.ai.length,14);
  for(const t of AREAS.office.buildFurniture().interactables) rm.completeTask(room.id,"office",t.id);
  assert(room.unlockedAreas.has("park"));
 }finally{rm.leaveRoom("host");}
});
function reachable(area,unlocked){
 const f=area.buildFurniture();
 const locked=(area.interiorDoors||[]).filter(d=>d.requires&&!unlocked.includes(d.requires));
 const collision=new CollisionSystem([...area.buildWalls(),...locked,...f.blocking,area.exitGate]);
 const queue=[area.spawn],seen=new Set();
 for(let i=0;i<queue.length;i++){
  const p=queue[i];
  for(const [dx,dy] of [[12,0],[-12,0],[0,12],[0,-12]]){
   const x=p.x+dx,y=p.y+dy,key=x+","+y;
   if(x<16||y<16||x>area.WORLD_WIDTH-16||y>area.WORLD_HEIGHT-16||seen.has(key)||collision._collidesAny(x,y,16))continue;
   seen.add(key);queue.push({x,y});
  }
 }
 return {queue,collision,f,walls:[...area.buildWalls(),...locked]};
}
test("locked labs cannot be entered; panels and discoveries are accessible; open labs are reachable",()=>{
 const area=AREAS.ai,closed=reachable(area,[]),open=reachable(area,["wire-ai-lab-1","wire-ai-lab-2"]);
 assert(closed.f.blocking.filter(f=>f.type==="ai-desk").every(f=>f.w<100));
 assert(area.buildWalls().filter(w=>w.interior).length>=16);
 for(const t of closed.f.interactables){
  const canReach=result=>result.queue.some(p=>Math.hypot(p.x-t.x-t.w/2,p.y-t.y-t.h/2)<=t.interactRadius&&hasLineOfSight(p,t,result.walls));
  if(t.requires)assert.equal(canReach(closed),false,t.id+" should be locked");
  else assert(canReach(closed),t.id+" must be reachable");
  assert(canReach(open),t.id+" must be reachable after wiring");
 }
 for(const seat of buildSeats(open.f.blocking,"ai")) assert(findStandingPosition(seat,open.collision),"Seat has no safe exit: "+seat.id);
});
test("seat claims are exclusive, movement stays frozen, standing uses clear floor",()=>{
 const room=rm.createRoom({hostSocketId:"seat-host",maxPlayers:4});
 rm.joinRoom(room.id,{socketId:"seat-guest",nickname:"Guest"});
 try{
  rm.startRoom(room.id,"seat-host");
  const seat=buildSeats(AREAS.ai.buildFurniture().blocking,"ai").find(s=>s.furniture.type==="ai-sofa");
  rm.updatePlayerState("seat-host",{x:seat.x,y:seat.furniture.y+seat.furniture.h+28});
  rm.updatePlayerState("seat-guest",{x:seat.x,y:seat.furniture.y+seat.furniture.h+28});
  assert.equal(rm.setSeat("seat-host",seat.id).ok,true);
  assert.equal(rm.setSeat("seat-guest",seat.id).ok,false);
  rm.updatePlayerState("seat-host",{x:2000,y:1600,area:"office",moving:true});
  const host=room.players.get("seat-host");
  assert.equal(host.x,seat.x);assert.equal(host.area,"ai");assert.equal(host.moving,false);
  const result=rm.setSeat("seat-host",null);
  assert.equal(result.ok,true);assert.equal(result.player.seated,false);
  assert.notEqual(result.player.y,seat.y);
  assert.equal(rm.setSeat("seat-guest",seat.id).ok,true);
 }finally{rm.leaveRoom("seat-host");rm.leaveRoom("seat-guest");}
});
test("seating is available in Office and Arcade too",()=>{
 for(const key of ["office","park"])assert(buildSeats(AREAS[key].buildFurniture().blocking,key).length>0);
});
test("camera follows travel and stays inside world",async()=>{
 const {Camera}=await import("../../frontend/src/engine/core/Camera.js");
 for(const [w,h] of [[1280,800],[1920,1080],[3440,1440],[800,1200]]){
  const c=new Camera(2880,1800);c.x=720;c.y=825;c.updateZoom(w,h);c.clamp(w,h);
  const before=c.x;
  for(let i=0;i<90;i++)c.follow(2280,825,1/60);
  c.clamp(w,h);
  if(w/c.zoom<2880-.001)assert(c.x>before);
  for(const [x,y] of [[16,16],[2860,1780]]) {
   c.x=x;c.y=y;c.clamp(w,h);
   assert(c.x-w/(2*c.zoom)>=-.001&&c.y-h/(2*c.zoom)>=-.001);
   assert(c.x+w/(2*c.zoom)<=2880.001&&c.y+h/(2*c.zoom)<=1800.001);
  }
 }
});

import {areaDoors,linkId} from "../../frontend/src/engine/systems/DoorSystem.js";
test("individual energy, capped rewards, retries and elimination",()=>{
 const room=rm.createRoom({hostSocketId:"power-host",maxPlayers:4});rm.joinRoom(room.id,{socketId:"power-guest"});rm.startRoom(room.id,"power-host");
 try{
 const task=AI_ACTIVITIES.find(t=>t.id==="discovery-ai-book"),wrong=(task.answer+1)%task.options.length;
 const submit=(id,answer,attemptId)=>rm.submitAttempt(id,{area:"ai",taskId:task.id,answer,attemptId});
 assert.equal(submit("power-host",wrong,"fail-1").player.energy,75);
 assert.equal(submit("power-host",wrong,"fail-1").player.energy,75);
 assert.equal(room.players.get("power-guest").energy,100);
 assert.equal(submit("power-host",task.answer,"correct").player.energy,85);
 assert.equal(submit("power-host",task.answer,"repeat").player.energy,95);
 assert.equal(submit("power-guest",task.answer,"guest").player.energy,100);
 for(let i=0;i<4;i++)submit("power-host",wrong,"loss-"+i);
 const player=room.players.get("power-host");assert.equal(player.energy,0);assert.equal(player.eliminated,true);
 assert.equal(submit("power-host",task.answer,"after-loss").ok,false);
 const x=player.x;rm.updatePlayerState("power-host",{x:x+500,energy:100,eliminated:false});assert.equal(player.x,x);assert.equal(player.energy,0);
 assert.equal(rm.setSeat("power-host","fake").ok,false);
 }finally{rm.leaveRoom("power-host");rm.leaveRoom("power-guest");}
});
test("button doors require wiring, share state, stay occupied and close when empty",()=>{
 const room=rm.createRoom({hostSocketId:"door-host"});rm.startRoom(room.id,"door-host");
 try{
 const d=areaDoors(AREAS.ai,"ai").find(d=>d.requires==="wire-ai-lab-1");
 rm.updatePlayerState("door-host",{x:d.x+72,y:d.y+70});
 assert.equal(rm.requestDoor("door-host",{area:"ai",id:d.id}).ok,false);
 const wire=AI_ACTIVITIES.find(t=>t.id===d.requires);rm.completeTask(room.id,"ai",wire.id,answer(wire));
 assert.equal(rm.requestDoor("door-host",{area:"ai",id:d.id}).ok,true);
 const now=Date.now()+5000;rm.updatePlayerState("door-host",{x:500,y:500});assert.equal(rm.tickDoors(now).length,0);
 rm.updatePlayerState("door-host",{x:1400,y:900});assert.equal(rm.tickDoors(now).length,1);assert.equal(room.doors[d.id].open,false);
 const officeDoors=areaDoors(AREAS.office,"office");assert.equal(officeDoors.filter(d=>d.roomBounds).length,4);
 assert(officeDoors.some(d=>d.id===linkId("office","ai")));
 assert(!AREAS.office.buildWalls().some(w=>w.x===0&&w.y<=550&&w.y+w.h>=550&&w.w>0));
 }finally{rm.leaveRoom("door-host");}
});
