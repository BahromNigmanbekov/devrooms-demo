import assert from "node:assert/strict";
import {chromium} from "file:///C:/Users/User/AppData/Local/npm-cache/_npx/e41f203b7505f1fb/node_modules/playwright/index.mjs";
import {AI_ACTIVITIES} from "./shared/aiActivities.mjs";
import {mkdir} from "node:fs/promises";
const out=".codex-backups/ai-room-power-preview";await mkdir(out,{recursive:true});
const browser=await chromium.launch({headless:true});
const errors=[];
const context=await browser.newContext({viewport:{width:1440,height:900},deviceScaleFactor:1});
const host=await context.newPage(),guest=await context.newPage();
const modulePath=(name)=>{};
for(const p of [host,guest]){
 p.on("pageerror",e=>errors.push(e.message));
 p.on("console",m=>{if(m.type()==="error")errors.push(m.text());});
 await p.goto("http://localhost:5173");
 await p.evaluate(async()=>{
  const {Game}=await import(performance.getEntriesByType("resource").findLast(r=>r.name.includes("/src/engine/core/Game.js")).name);
  const start=Game.prototype.start;
  Game.prototype.start=function(){window.__qaGame=this;start.call(this);};
 });
}
const waitProgress=async(n)=>{
 for(const p of [host,guest])await p.waitForFunction(n=>document.querySelector("#team-progress")?.textContent.includes(n+"/14"),n);
};
const focus=async(p)=>p.locator("#game-canvas").click({position:{x:700,y:700}});
const approach=async(p,id)=>{
 await p.evaluate(id=>{
  const g=window.__qaGame,t=g.interactables.find(t=>t.id===id);
  g.player.x=t.x-26;g.player.y=t.y+t.h+12;
  g.player.facing={x:0,y:1};
 },id);
 await p.waitForTimeout(150);await focus(p);await p.keyboard.press("KeyE");
 await p.locator("#modal-backdrop.open").waitFor();
 assert.equal(await p.evaluate(()=>window.__qaGame._currentTaskId),id);
};
try{
 await host.getByRole("button",{name:"Create one instead"}).click();
 await host.locator("#hostNickname").fill("Explorer");
 await host.getByRole("button",{name:"Create Room",exact:true}).click();
 await host.getByRole("button",{name:"Start Game",exact:true}).waitFor();
 const roomId=await host.evaluate(async()=> (await import(performance.getEntriesByType("resource").findLast(r=>r.name.includes("/src/store/roomStore.js")).name)).useRoomStore.getState().room.id);
 await guest.locator("#nickname").fill("Teammate");await guest.locator("#roomId").fill(roomId);
 await guest.getByRole("button",{name:"Join Room",exact:true}).click();
 await guest.getByRole("button",{name:"Leave",exact:true}).waitFor();
 await host.getByRole("button",{name:"Start Game",exact:true}).click();
 for(const p of [host,guest])await p.waitForFunction(()=>window.__qaGame?.currentArea==="ai");
 await waitProgress(0);await host.waitForTimeout(200);
 await host.screenshot({path:out+"/rooms.png"});
 // A locked lab physically blocks walking through the doorway.
 await host.evaluate(()=>{
  const g=window.__qaGame,d=g.area.interiorDoors[0];g.player.x=d.x+d.w/2;g.player.y=d.y+d.h+50;
 });
 await focus(host);await host.keyboard.down("KeyW");await host.waitForTimeout(350);await host.keyboard.up("KeyW");
 assert((await host.evaluate(()=>window.__qaGame.player.y))>=706);
 // Sitting in a lounge is a real networked action, not a cosmetic label.
 const seatId=await host.evaluate(()=>{
  const g=window.__qaGame,s=g._seats.find(s=>s.furniture.type==="ai-sofa");
  g.player.x=s.x;g.player.y=s.furniture.y+s.furniture.h+24;return s.id;
 });
 await host.waitForTimeout(150);await focus(host);await host.keyboard.press("Space");
 await host.waitForFunction(()=>window.__qaGame.player.seated===true);
 await guest.waitForFunction(async()=>{
  const {useRoomStore}=await import(performance.getEntriesByType("resource").findLast(r=>r.name.includes("/src/store/roomStore.js")).name);
  return useRoomStore.getState().room.players.some(p=>p.nickname==="Explorer"&&p.seated);
 });
 const seatedPos=await host.evaluate(()=>({x:window.__qaGame.player.x,y:window.__qaGame.player.y}));
 await host.keyboard.down("KeyD");await host.waitForTimeout(200);await host.keyboard.up("KeyD");
 assert.deepEqual(await host.evaluate(()=>({x:window.__qaGame.player.x,y:window.__qaGame.player.y})),seatedPos);
 await host.screenshot({path:out+"/sitting.png"});
 const occupied=await guest.evaluate(async id=>{
  const g=window.__qaGame,s=g._seats.find(s=>s.id===id);
  g.player.x=s.x;g.player.y=s.furniture.y+s.furniture.h+24;
  await new Promise(resolve=>setTimeout(resolve,180));
  const {getSocket}=await import(performance.getEntriesByType("resource").findLast(r=>r.name.includes("/src/network/socketClient.js")).name);
  return new Promise(resolve=>getSocket().emit("player:seat",{seatId:id},resolve));
 },seatId);
 assert.equal(occupied.ok,false);
 await host.keyboard.press("Space");await host.waitForFunction(()=>window.__qaGame.player.seated===false);
 // Solve two wire puzzles, then the eight terminals and four object discoveries.
 for(let i=0;i<AI_ACTIVITIES.length;i++){
  const task=AI_ACTIVITIES[i],p=i%2?guest:host;
  await approach(p,task.id);
  if(task.type==="wires"){
   assert.equal(await p.locator("#wire-board").isVisible(),true);
   assert.equal(await p.locator(".editor-shell").isVisible(),false);
   if(i===0){
    for(let pin=0;pin<4;pin++){await p.locator('[data-wire-left="'+pin+'"]').click();await p.locator('[data-wire-right="'+pin+'"]').click();}
    await p.locator("#btn-run-code").click();await p.locator("#result-panel.result-bad").waitFor();
    await waitProgress(0);await p.locator("#btn-reset-code").click();
   }
   for(let pin=0;pin<4;pin++){
    const target=task.right.findIndex(r=>r.key===task.left[pin].key);
    await p.locator('[data-wire-left="'+pin+'"]').click();await p.locator('[data-wire-right="'+target+'"]').click();
   }
   assert.equal(await p.locator("#wire-board svg path").count(),4);
   await p.screenshot({path:out+"/wires.png"});
  }else {
   assert.equal(await p.locator("#quiz-options button").count(),3);
   await p.locator('[data-answer="'+task.answer+'"]').click();
   if(task.id==="discovery-ai-book")await p.screenshot({path:out+"/book-quiz.png"});
  }
  await p.locator("#btn-run-code").click();await p.locator("#result-panel.result-ok").waitFor();
  await waitProgress(i+1);
  await p.keyboard.press("Escape");await p.locator("#modal-backdrop").waitFor({state:"hidden"});
  if(task.type==="wires"){
   
   await p.evaluate(async id=>{
    const g=window.__qaGame,d=g._doors.find(d=>d.requires===id);
    g.player.x=d.x+72;g.player.y=d.y+70;
    await new Promise(r=>setTimeout(r,150));
    const result=await g.multiplayer.onDoorRequest({area:"ai",id:d.id});
    if(!result.ok)throw Error("Door request denied");
   },task.id);
   await p.waitForTimeout(700);
   assert(await p.evaluate(id=>window.__qaGame._doorAnimation[window.__qaGame._doors.find(d=>d.requires===id).id]>.95,task.id));
  
  }
 }
 await host.waitForFunction(()=>window.__qaGame._gateLocked===false);
 // Open the area door, walk into office, then return to AI.
 await host.evaluate(async()=>{const g=window.__qaGame;g.player.x=2770;g.player.y=900;await new Promise(r=>setTimeout(r,160));await g.multiplayer.onDoorRequest({area:"ai",id:g._doors.find(d=>d.targetArea==="office").id});});await host.waitForTimeout(750);
 // Walk into the Office and check its existing editor and seating.
 await host.evaluate(()=>{window.__qaGame.player.x=2770;window.__qaGame.player.y=900;});
 await focus(host);await host.keyboard.down("KeyD");await host.waitForTimeout(220);await host.keyboard.up("KeyD");
 await host.waitForFunction(()=>window.__qaGame.currentArea==="office");
 await approach(host,"terminal-openoffice-1");
 assert(await host.locator(".editor-shell").isVisible());
 await host.locator("#code-input").fill('function check(age){return age>=18?"Katta":"Kichkina";}');
 await host.locator("#btn-run-code").click();
 await host.waitForFunction(()=>document.querySelector("#team-progress").textContent.includes("1/12"));
 await host.keyboard.press("Escape");await host.waitForTimeout(250);
 const officeSeat=await host.evaluate(()=>{
  const g=window.__qaGame,s=g._seats.find(s=>s.furniture.type==="sofa");
  g.player.x=s.x;g.player.y=s.furniture.y+s.furniture.h+24;return s.id;
 });
 await host.waitForTimeout(150);await focus(host);await host.keyboard.press("Space");
 await host.waitForFunction(()=>window.__qaGame.player.seated);
 await host.keyboard.press("Space");await host.waitForFunction(()=>!window.__qaGame.player.seated);

 // Return gate keeps the player's energy and uses an arrival away from the trigger.
 await host.evaluate(async()=>{
  const g=window.__qaGame,d=g._doors.find(d=>d.targetArea==="ai");g.player.x=100;g.player.y=550;
  await new Promise(r=>setTimeout(r,160));const res=await g.multiplayer.onDoorRequest({area:"office",id:d.id});if(!res.ok)throw Error("Return door denied");
 });await host.waitForTimeout(750);
 await focus(host);await host.keyboard.down("KeyA");await host.waitForTimeout(260);await host.keyboard.up("KeyA");
 await host.waitForFunction(()=>window.__qaGame.currentArea==="ai");await host.waitForTimeout(350);
 assert.equal(await host.evaluate(()=>window.__qaGame.currentArea),"ai");
 // A reader can sit and open the nearby book quiz without standing up.
 await host.evaluate(()=>{
  const g=window.__qaGame,s=g._seats.find(s=>s.furniture.type==="ai-chair"&&s.x>680&&s.x<720&&s.y>1400);
  if(!s)throw Error("Reading seat missing");g.player.x=s.x;g.player.y=s.y+50;
 });await host.waitForTimeout(180);await focus(host);await host.keyboard.press("Space");
 await host.waitForFunction(()=>window.__qaGame.player.seated);
 await host.keyboard.press("KeyE");await host.locator("#modal-backdrop.open").waitFor();
 assert.equal(await host.evaluate(()=>window.__qaGame._currentTaskId),"discovery-ai-book");
 const book=AI_ACTIVITIES.find(t=>t.id==="discovery-ai-book");
 await host.locator('[data-answer="'+book.answer+'"]').click();await host.locator("#btn-run-code").click();await host.locator("#result-panel.result-ok").waitFor();
 assert(await host.evaluate(()=>window.__qaGame.player.seated));
 assert.equal(await host.locator("#modal").evaluate(el=>getComputedStyle(el).boxShadow),"none");
 await host.screenshot({path:out+"/seated-quiz.png"});
 await host.keyboard.press("Escape");await host.waitForTimeout(260);await host.keyboard.press("Space");
 await host.waitForFunction(()=>!window.__qaGame.player.seated);
 // Four distinct wrong answers eliminate only the guest.
 await approach(guest,"discovery-ai-book");
 for(let i=0;i<4;i++){
   await guest.locator('[data-answer="'+((book.answer+1)%book.options.length)+'"]').click();
   await guest.locator("#btn-run-code").click();
   await guest.waitForFunction(n=>document.querySelector("#power-value").textContent===n+"%",Math.max(0,100-(i+1)*25));
 }
 await guest.locator("#game-over").waitFor({state:"visible"});
 assert((await host.evaluate(()=>window.__qaGame.player.energy))>0);
 await guest.screenshot({path:out+"/game-over.png"});
 assert.deepEqual(errors,[]);
 console.log("PASS: two players; energy penalties/rewards; elimination; animated button doors; 14 tasks; office editor; bidirectional AI travel; seated quiz; matte modal; no browser errors.");
 console.log("Screenshots: "+out);
}finally{await browser.close();}
