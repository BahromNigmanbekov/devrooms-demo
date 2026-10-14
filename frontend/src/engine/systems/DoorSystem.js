import { AREAS } from "../../maps/areas.js";
export const linkId=(a,b)=>"link:"+[a,b].sort().join("-");
export function areaDoors(area,key) {
 const doors=(area.interiorDoors||[]).map(d=>({...d,id:key+":"+d.id}));
 for(const [gate,trigger] of [[area.exitGate,area.exitTrigger],[area.returnGate,area.returnTrigger]]) if(gate) doors.push({...gate,id:linkId(key,gate.targetArea),trigger});
 return doors;
}
export function doorDistance(p,d) {
 return Math.hypot(p.x-Math.max(d.x,Math.min(p.x,d.x+d.w)),p.y-Math.max(d.y,Math.min(p.y,d.y+d.h)));
}
export function doorAllowed(d,solved,unlocked) {
 return (!d.requires||solved.includes(d.requires))&&(!d.targetArea||(AREAS[d.targetArea]&&unlocked.includes(d.targetArea)));
}
export function doorObstacle(d) {
 const rise=d.w>d.h?36:0;
 return {...d,y:d.y-rise,h:d.h+rise};
}
export function drawDoor(ctx,d,progress,allowed) {
 ctx.save();ctx.shadowBlur=0;
 const horizontal=d.w>d.h,len=horizontal?d.w:d.h,half=len/2;
 // Horizontal wall faces rise 36 pixels above their floor footprint.
 // The door uses that same face height; collision still uses the map footprint.
 const faceX=d.x,faceY=d.y-(horizontal?36:0);
 const faceW=d.w,faceH=d.h+(horizontal?36:0);
 // Side jambs frame the door pockets; the opening has no crossbar.
 for(const x of [faceX-12,faceX+faceW]) {
 ctx.fillStyle="#172b32";ctx.fillRect(x,faceY-6,12,faceH+12);
 ctx.strokeStyle="#738b8b";ctx.lineWidth=2;ctx.strokeRect(x+2,faceY-4,8,faceH+8);
 ctx.fillStyle="#b79b70";ctx.fillRect(x+5,faceY+1,3,faceH-2);
 }
 // Reveal panels only inside the doorway; the walls conceal the rest.
 if(progress<1) {
 ctx.save();ctx.beginPath();
 ctx.rect(faceX-(horizontal?0:4),faceY,faceW+(horizontal?0:4),faceH);
 ctx.clip();
 for(let i=0;i<2;i++) {
 const offset=i*half+(i?1:-1)*half*progress;
 const x=faceX+(horizontal?offset:0),y=faceY+(horizontal?0:offset);
 const w=horizontal?half:faceW,h=horizontal?faceH:half;
 ctx.fillStyle="#35474e";ctx.fillRect(x,y,w,h);
 ctx.fillStyle="#607f87";ctx.fillRect(x+4,y+4,w-8,h-8);
 ctx.strokeStyle="#a3adb0";ctx.lineWidth=2;ctx.strokeRect(x,y,w,h);
 // Each LED belongs to its moving panel.
 ctx.fillStyle=allowed?"#79e2c6":"#b6a06e";
 if(horizontal)ctx.fillRect(x,y+h-4,w,4);
 else ctx.fillRect(x-4,y,4,h);
 }
 ctx.restore();
 }
 const bx=d.x+(horizontal?d.w+12:-26),by=d.y+(horizontal?-6:d.h+12);
 ctx.fillStyle="#202e33";ctx.fillRect(bx,by,20,20);
 ctx.fillStyle=allowed?"#8aaa9a":"#ae7962";ctx.fillRect(bx+5,by+5,10,10);
 ctx.restore();
}
