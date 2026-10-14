import { initialPool,simulatePoolShot } from "../../shared/poolPhysics.mjs";
import test from "node:test";
import assert from "node:assert/strict";
import { ARCADE_ACTIVITIES,validateArcadeAnswer,toggleLights } from "../../shared/arcadeActivities.mjs";
import { roomManager as rm } from "../src/rooms/roomManager.js";
import { AREAS } from "../../frontend/src/maps/areas.js";
import { AI_ACTIVITIES } from "../../shared/aiActivities.mjs";
import { CollisionSystem } from "../../frontend/src/engine/systems/CollisionSystem.js";
import { hasLineOfSight } from "../../frontend/src/engine/systems/InteractionSystem.js";
import { doorObstacle } from "../../frontend/src/engine/systems/DoorSystem.js";
import { buildSeats,findStandingPosition } from "../../frontend/src/engine/systems/SeatSystem.js";
export function solve(task){
 if(task.kind==="billiards")return [272];
 if(task.kind==="memory")return task.sequence;
 if(task.kind==="pairs"){const ids=[];for(const key of new Set(task.cards))task.cards.forEach((v,i)=>{if(v===key)ids.push(i);});return ids;}
 if(task.kind==="lights"){for(let mask=1;mask<512;mask++){const answer=Array.from({length:9},(_,i)=>i).filter(i=>mask&(1<<i));if(!answer.reduce(toggleLights,task.initial).some(Boolean))return answer;}}
 if(task.kind==="maze"){const queue=[[task.start,[]]],seen=new Set([task.start]);for(const [pos,path] of queue){if(pos===task.goal)return path;const r=Math.floor(pos/5),c=pos%5;for(const [d,[dr,dc]] of [[-1,0],[0,1],[1,0],[0,-1]].entries()){const nr=r+dr,nc=c+dc,n=nr*5+nc;if(nr<0||nc<0||nr>=5||nc>=5||task.walls.includes(n)||seen.has(n))continue;seen.add(n);queue.push([n,[...path,d]]);}}}
 throw Error("Unsolvable "+task.id);
}
test("all arcade games have valid solutions and reject wrong answers",()=>{
 assert.equal(ARCADE_ACTIVITIES.length,13);assert.equal(new Set(ARCADE_ACTIVITIES.map(t=>t.kind)).size,5);
 for(const task of ARCADE_ACTIVITIES){assert(validateArcadeAnswer(task,solve(task)),task.id);assert(!validateArcadeAnswer(task,[-1]));assert(!validateArcadeAnswer(task,[]));}
});
test("arcade preserves original pink palette and four distinct enclosed rooms; every activity reachable",()=>{
 const area=AREAS.park;assert.equal(area.COLORS.floorA,"#5c2a5e");assert.equal(area.COLORS.floorB,"#3f1c48");assert.notEqual(area.COLORS.floorA,AREAS.office.COLORS.floorA);assert.equal(area.interiorDoors.length,4);
 const furniture=area.buildFurniture();assert(new Set(furniture.blocking.map(f=>f.type)).size>=10);
 for(const closed of [true,false]){
 const doors=closed?area.interiorDoors.map(doorObstacle):[],walls=[...area.buildWalls(),...doors],collision=new CollisionSystem([...walls,...furniture.blocking]);
 const queue=[area.spawn],seen=new Set();for(let i=0;i<queue.length;i++){const p=queue[i];for(const [dx,dy] of [[12,0],[-12,0],[0,12],[0,-12]]){const x=p.x+dx,y=p.y+dy,key=x+","+y;if(x<16||y<16||x>area.WORLD_WIDTH-16||y>area.WORLD_HEIGHT-16||seen.has(key)||collision._collidesAny(x,y,16))continue;seen.add(key);queue.push({x,y});}}
 for(const t of furniture.interactables){const reachable=queue.some(p=>Math.hypot(p.x-t.x-t.w/2,p.y-t.y-t.h/2)<=t.interactRadius&&hasLineOfSight(p,t,walls));assert.equal(reachable,!closed||!t.requires,t.id+" reachable state");}
 if(!closed)for(const seat of buildSeats(furniture.blocking,"park"))assert(findStandingPosition(seat,collision),seat.id);
 }
});
test("arcade grading is authoritative, gates have prerequisites, health and team progress work",()=>{
 const room=rm.createRoom({hostSocketId:"arcade-host"});rm.startRoom(room.id,"arcade-host");
 try{
 for(const t of AI_ACTIVITIES)rm.completeTask(room.id,"ai",t.id,t.type==="wires"?t.left.map(p=>t.right.findIndex(r=>r.key===p.key)):t.answer);
 for(const t of AREAS.office.buildFurniture().interactables)rm.completeTask(room.id,"office",t.id);
 rm.updatePlayerState("arcade-host",{area:"park"});
 const first=ARCADE_ACTIVITIES[0],submit=(task,answer,id)=>rm.submitAttempt("arcade-host",{area:"park",taskId:task.id,answer,passed:true,attemptId:id});
 assert.equal(submit(ARCADE_ACTIVITIES[4],solve(ARCADE_ACTIVITIES[4]),"locked").ok,false);
 assert.equal(submit(first,[-1],"bad").player.energy,75);
 assert.equal(submit(first,solve(first),"good").player.energy,85);
 for(const task of ARCADE_ACTIVITIES)assert(submit(task,solve(task),task.id).allPass);
 assert.equal(rm.serializeRoom(room).taskProgress.park.completed,13);
 assert.equal(room.players.get("arcade-host").energy,100);
 }finally{rm.leaveRoom("arcade-host");}
});

test("billiard shots collide, rebound, pocket balls and replay deterministically",()=>{
 const initial=initialPool(),straight=simulatePoolShot(initial,70,true);
 assert(straight.frames.length>0);assert(straight.balls[1].x!==initial[1].x,"cue transfers momentum");
 assert.deepEqual(initial,initialPool(),"initial state stays unchanged");
 assert(straight.balls.every(b=>b.pocketed||(b.x>=21&&b.x<=419&&b.y>=21&&b.y<=219)));
 const shot=272,win=simulatePoolShot(initial,shot,true);
 assert.equal(win.pocketed,1);assert.deepEqual(simulatePoolShot(initial,shot).balls,win.balls);
 const task=ARCADE_ACTIVITIES.find(t=>t.kind==="billiards");
 assert(validateArcadeAnswer(task,[shot]));assert(!validateArcadeAnswer(task,[70]));
 for(const answer of [[0],[36360],[1.5],[Infinity],Array(13).fill(shot)])assert(!validateArcadeAnswer(task,answer));
 const scratch=simulatePoolShot(initialPool(),157*101+100);
 assert(scratch.scratch);assert(!scratch.balls[0].pocketed,"scratched cue returns to table");
});
