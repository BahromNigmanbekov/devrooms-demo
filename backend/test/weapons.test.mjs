import test from 'node:test';
import assert from 'node:assert/strict';
import {EQUIPMENT,sanitizeEquipment} from '../../shared/equipment.mjs';
import {createTrainingTargets,useWeapon} from '../src/rooms/weaponSystem.js';
import {roomManager} from '../src/rooms/roomManager.js';
function fixture(weapon='light-azure'){
 const player={id:'host',area:'ai',x:1000,y:900,facing:{x:1,y:0},equipment:{weapon},energy:50};
 const ally={id:'ally',area:'ai',x:1020,y:920,energy:90,equipment:{weapon:'none'}};
 const room={id:'test',started:true,players:new Map([['host',player],['ally',ally]]),trainingTargets:createTrainingTargets()};
 return {room,player,ally};
}
test('every category has 30 distinct items; unknown slots cannot be equipped',()=>{
 for(const items of Object.values(EQUIPMENT)){assert.equal(items.length,30);assert.equal(new Set(items.map(i=>i.id)).size,30)}
 assert.deepEqual(sanitizeEquipment({head:'unknown',back:'unknown',weapon:'unknown'}),{head:'none',back:'none',weapon:'none'});
 for(const [slot,items] of Object.entries(EQUIPMENT))for(const item of items)assert.equal(sanitizeEquipment({[slot]:item.id})[slot],item.id);
});
test('melee uses range, facing, health, and server cooldown; kills award practice points',()=>{
 const {room,player}=fixture();
 assert.equal(useWeapon(room,player,[],10000).targets[0].hp,60);
 assert.equal(useWeapon(room,player,[],10001).error,'COOLDOWN');
 useWeapon(room,player,[],11000);const killed=useWeapon(room,player,[],12000);
 assert.equal(killed.targets[0].hp,0);assert.equal(player.practiceScore,10);
 player.facing={x:-1,y:0};assert.equal(useWeapon(room,player,[],13000).effect.hits.length,0);
 player.facing={x:1,y:0};const revived=useWeapon(room,player,[],21000);assert.equal(revived.targets[0].hp,60);
});
test('rifle cannot hit targets through walls and beam stops at the wall',()=>{
 const {room,player}=fixture('gun-pulse');
 const result=useWeapon(room,player,[{x:1040,y:850,w:12,h:100}],10000);
 assert.equal(result.effect.hits.length,0);assert.ok(result.effect.range<50);assert.equal(result.targets[0].hp,100);
 const open=useWeapon(room,player,[],11000);assert.equal(open.targets[0].hp,82);assert.equal(open.targets[1].hp,100);
});
test('healing affects live nearby teammates, respects walls, and caps energy',()=>{
 const {room,player,ally}=fixture('staff-healer');
 useWeapon(room,player,[],10000);assert.equal(player.energy,65);assert.equal(ally.energy,100);
 ally.energy=40;useWeapon(room,player,[{x:1008,y:905,w:5,h:50}],21000);assert.equal(ally.energy,40);
});
test('shield and scan have timed effects; eliminated/seated players cannot use weapons',()=>{
 const {room,player,ally}=fixture('staff-shield');
 useWeapon(room,player,[],10000);assert.equal(ally.shieldUntil,16000);
 player.equipment.weapon='staff-scanner';useWeapon(room,player,[],25000);assert.equal(player.scanUntil,31000);
 player.seated=true;assert.equal(useWeapon(room,player,[],50000).error,'UNAVAILABLE');
 player.seated=false;player.eliminated=true;assert.equal(useWeapon(room,player,[],50000).error,'UNAVAILABLE');
});
test('all 30 weapons execute their declared action',()=>{
 for(const item of EQUIPMENT.weapon){const {room,player}=fixture(item.id);const r=useWeapon(room,player,[],10000);assert.equal(r.ok,true,item.id);assert.equal(r.effect.type,item.type);assert.equal(r.readyAt,10000+item.cooldown)}
});
test('server accepts catalog gear at create/join and sanitizes changed gear',()=>{
 const room=roomManager.createRoom({hostSocketId:'gear-host',hostNickname:'Host',equipment:{head:'pharaoh',back:'octopus',weapon:'staff-prism'}});
 const joined=roomManager.joinRoom(room.id,{socketId:'gear-guest',nickname:'Guest',equipment:{head:'wizard',back:'wings',weapon:'gun-sniper'}});
 assert.equal(joined.room.players.get('gear-guest').equipment.weapon,'gun-sniper');
 assert.equal(room.players.get('gear-host').equipment.back,'octopus');
 roomManager.updatePlayerState('gear-host',{equipment:{head:'not-real',back:'garden',weapon:'light-twin'},shieldUntil:Infinity,energy:10000});
 assert.deepEqual(room.players.get('gear-host').equipment,{head:'none',back:'garden',weapon:'light-twin'});
 assert.equal(room.players.get('gear-host').shieldUntil,undefined);assert.equal(room.players.get('gear-host').energy,100);
 roomManager.leaveRoom('gear-guest');roomManager.leaveRoom('gear-host');
});
test('a shield absorbs one failed puzzle attempt, then normal penalties resume',()=>{
 const room=roomManager.createRoom({hostSocketId:'shield-host',hostNickname:'Host',equipment:{weapon:'staff-shield'}});
 roomManager.startRoom(room.id,'shield-host');
 const result=roomManager.useWeapon('shield-host');assert.equal(result.ok,true);
 const first=roomManager.submitAttempt('shield-host',{area:'ai',taskId:'wire-ai-lab-1',attemptId:'shielded',answer:[]});
 assert.equal(first.allPass,false);assert.equal(first.player.energy,100);assert.equal(first.player.shieldUntil,0);
 const second=roomManager.submitAttempt('shield-host',{area:'ai',taskId:'wire-ai-lab-1',attemptId:'unshielded',answer:[]});
 assert.equal(second.player.energy,75);roomManager.leaveRoom('shield-host');
});
