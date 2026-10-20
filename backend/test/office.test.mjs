import test from 'node:test';
import assert from 'node:assert/strict';
import * as Office from '../../frontend/src/maps/OfficeMap.js';
import {CollisionSystem} from '../../frontend/src/engine/systems/CollisionSystem.js';
import {hasLineOfSight} from '../../frontend/src/engine/systems/InteractionSystem.js';
import {HTML_ACTIVITIES,HTML_TASKS_BY_ID,validateHTMLAnswer} from '../../shared/htmlActivities.mjs';
import {runTask} from '../../frontend/src/engine/systems/CodeChecker.js';
import {roomManager} from '../src/rooms/roomManager.js';
test('all 16 office terminals have unique four-option HTML quizzes',()=>{
 const stations=Office.buildFurniture().interactables;
 assert.equal(stations.length,16);assert.deepEqual(stations.map(s=>s.id).sort(),Object.keys(HTML_TASKS_BY_ID).sort());
 for(const task of HTML_ACTIVITIES){assert.equal(task.type,'quiz');assert.equal(task.options.length,4);assert.equal(new Set(task.options).size,4);assert.ok(task.explanation);assert.equal(runTask(task,task.answer).allPass,true);assert.equal(validateHTMLAnswer(task,String(task.answer)),false);assert.equal(runTask(task,(task.answer+1)%4).allPass,false);}
});
test('expanded office has reachable stations, hallway, return and exit gates',()=>{
 assert.equal(Office.WORLD_WIDTH,2880);assert.equal(Office.WORLD_HEIGHT,1760);
 const {blocking,interactables}=Office.buildFurniture(),walls=Office.buildWalls(),collision=new CollisionSystem([...walls,...blocking]);
 const queue=[Office.SPAWN],seen=new Set([Office.SPAWN.x+','+Office.SPAWN.y]);
 for(let i=0;i<queue.length;i++){const p=queue[i];for(const [dx,dy] of [[20,0],[-20,0],[0,20],[0,-20]]){const x=p.x+dx,y=p.y+dy,key=x+','+y;if(x<20||y<20||x>Office.WORLD_WIDTH-20||y>Office.WORLD_HEIGHT-20||seen.has(key)||collision._collidesAny(x,y,16))continue;seen.add(key);queue.push({x,y});}}
 for(const terminal of interactables)assert.ok(queue.some(p=>Math.hypot(p.x-terminal.x-terminal.w/2,p.y-terminal.y-terminal.h/2)<terminal.interactRadius&&hasLineOfSight(p,terminal,walls)),terminal.id+' must be reachable');
 assert.ok(seen.has('80,880'));assert.ok(seen.has('2800,880'));assert.equal(Office.RETURN_GATE.y,Office.EXIT_GATE.y);assert.equal(Office.RETURN_GATE.h,Office.DOOR_SIZE);
});
test('office answers are checked on the server and completing all quizzes opens Arcade',()=>{
 const room=roomManager.createRoom({hostSocketId:'html-host',hostNickname:'HTML'});roomManager.startRoom(room.id,'html-host');room.unlockedAreas.add('office');roomManager.updatePlayerState('html-host',{area:'office'});
 const first=HTML_ACTIVITIES[0];
 const wrong=roomManager.submitAttempt('html-host',{area:'office',taskId:first.id,answer:(first.answer+1)%4,passed:true,attemptId:'wrong-html'});
 assert.equal(wrong.allPass,false);assert.equal(wrong.player.energy,75);assert.equal(room.areaProgress.office.size,0);
 assert.equal(roomManager.completeTask(room.id,'office',first.id,99),null);
 for(const task of HTML_ACTIVITIES){const result=roomManager.submitAttempt('html-host',{area:'office',taskId:task.id,answer:task.answer,attemptId:task.id});assert.equal(result.allPass,true);}
 assert.equal(room.areaProgress.office.size,16);assert.ok(room.unlockedAreas.has('park'));assert.equal(roomManager.serializeRoom(room).taskProgress.office.total,16);roomManager.leaveRoom('html-host');
});
