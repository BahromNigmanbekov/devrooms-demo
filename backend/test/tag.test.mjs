import test from 'node:test';
import assert from 'node:assert/strict';
import {startTag,stopTag,tickTag} from '../src/rooms/tagSystem.js';
import {roomManager} from '../src/rooms/roomManager.js';
import {presentPlayer} from '../../shared/playerPresentation.mjs';
import {EQUIPMENT_BY_ID} from '../../shared/equipment.mjs';
const fixture=()=>({started:true,hostId:'a',players:new Map([
 ['a',{id:'a',nickname:'Ali',color:'#5b8cff',area:'ai',x:300,y:300,equipment:{head:'cowboy',back:'wings',weapon:'gun-pulse'}}],
 ['b',{id:'b',nickname:'Bob',color:'#7ee0c3',area:'ai',x:330,y:300,equipment:{head:'pilot',back:'radio',weapon:'katana'}}],
])});
test('only host can start/stop; at least two live players are required',()=>{
 const room=fixture();assert.equal(startTag(room,'b').error,'NOT_HOST');
 assert.equal(startTag({...room,started:false},'a').error,'NOT_STARTED');
 room.players.get('b').eliminated=true;assert.equal(startTag(room,'a').error,'NEED_PLAYERS');room.players.get('b').eliminated=false;
 assert.equal(startTag(room,'a',1000,()=>1).tag.hunterId,'b');assert.equal(startTag(room,'a').error,'ALREADY_ACTIVE');
 assert.equal(stopTag(room,'b').error,'NOT_HOST');assert.equal(stopTag(room,'a').ok,true);
});
test('contact transfers hunter in every area without overwriting identity or gear',()=>{
 for(const area of ['ai','office','park']){
  const room=fixture();for(const p of room.players.values())p.area=area;
  const identity=()=>[...room.players.values()].map(({id,nickname,color,equipment})=>({id,nickname,color,equipment}));const before=JSON.stringify(identity());startTag(room,'a',1000,()=>0);
  assert.equal(presentPlayer(room.players.get('a'),room.tag).nickname,'Ovchi');
  assert.equal(tickTag(room,()=>[],4100),true);assert.equal(room.tag.hunterId,'b');
  assert.equal(presentPlayer(room.players.get('a'),room.tag).nickname,'Ali');
  assert.deepEqual(presentPlayer(room.players.get('a'),room.tag).equipment,{head:'cowboy',back:'wings',weapon:'gun-pulse'});
  assert.equal(JSON.stringify(identity()),before);assert.equal(presentPlayer(room.players.get('b'),room.tag).nickname,'Ovchi');
 }
 assert.equal(EQUIPMENT_BY_ID.head.hunter,undefined);
});
test('grace, short immunity, separate areas and walls prevent unwanted transfers',()=>{
 const room=fixture();startTag(room,'a',1000,()=>0);
 assert.equal(tickTag(room,()=>[],2000),false);
 room.players.get('b').area='office';assert.equal(tickTag(room,()=>[],4100),false);room.players.get('b').area='ai';
 assert.equal(tickTag(room,()=>[{x:313,y:280,w:5,h:40}],4100),false);
 assert.equal(tickTag(room,()=>[],4100),true);assert.equal(tickTag(room,()=>[],5700),false);
 assert.equal(tickTag(room,()=>[],7200),true);assert.equal(room.tag.hunterId,'a');
});
test('hunter disconnect reassigns a live hunter; one remaining player ends tag',()=>{
 const room=fixture();room.players.set('c',{id:'c',area:'park',x:0,y:0});startTag(room,'a',1000,()=>0);room.players.delete('a');
 assert.equal(tickTag(room,()=>[],5000,()=>1),true);assert.equal(room.tag.hunterId,'c');
 room.players.delete('b');assert.equal(tickTag(room,()=>[],6000),true);assert.equal(room.tag.active,false);assert.equal(room.tag.hunterId,null);
});
test('starting tag releases seated players',()=>{
 const room=fixture();room.players.get('a').seated=true;room.players.get('a').seatId='chair';
 startTag(room,'a',1000,()=>0);assert.equal(room.players.get('a').seated,false);assert.equal(room.players.get('a').seatId,null);
});
test('all rooms open temporarily; stopping restores progression and chosen equipment',()=>{
 const room=roomManager.createRoom({hostSocketId:'tag-host',hostNickname:'Original',equipment:{head:'wizard',back:'rocket',weapon:'light-gold'}});
 roomManager.joinRoom(room.id,{socketId:'tag-guest',nickname:'Guest'});roomManager.startRoom(room.id,'tag-host');
 assert.equal(roomManager.setTag('tag-guest',true).error,'NOT_HOST');assert.equal(roomManager.setTag('tag-host',true).ok,true);
 assert.deepEqual(roomManager.serializeRoom(room).unlockedAreas.sort(),['ai','office','park']);assert.ok(Object.values(room.doors).every(d=>d.open));
 roomManager.updatePlayerState('tag-host',{area:'park',isHunter:true,nickname:'Original'});
 assert.equal(room.players.get('tag-host').area,'park');assert.equal(room.players.get('tag-host').isHunter,undefined);
 roomManager.setTag('tag-host',false);const p=room.players.get('tag-host');assert.equal(p.area,'ai');assert.equal(p.relocationId,1);
 assert.deepEqual(roomManager.serializeRoom(room).unlockedAreas,['ai']);assert.equal(p.nickname,'Original');assert.deepEqual(p.equipment,{head:'wizard',back:'rocket',weapon:'light-gold'});
 roomManager.leaveRoom('tag-guest');roomManager.leaveRoom('tag-host');
});
test('host departure promotes the next admin and replaces a departing hunter',()=>{
 const room=roomManager.createRoom({hostSocketId:'leaving-admin',hostNickname:'Host'});
 roomManager.joinRoom(room.id,{socketId:'next-admin',nickname:'Next'});roomManager.joinRoom(room.id,{socketId:'third-runner',nickname:'Third'});
 roomManager.startRoom(room.id,'leaving-admin');roomManager.setTag('leaving-admin',true);room.tag.hunterId='leaving-admin';roomManager.leaveRoom('leaving-admin');roomManager.tickTag();
 assert.equal(room.hostId,'next-admin');assert.ok(room.players.has(room.tag.hunterId));assert.equal(roomManager.setTag('next-admin',false).ok,true);
 roomManager.leaveRoom('third-runner');roomManager.leaveRoom('next-admin');
});
