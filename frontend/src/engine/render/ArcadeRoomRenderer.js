import { AIRoomRenderer } from "./AIRoomRenderer.js";
import { ROOMS } from "../../maps/ParkMap.js";
const tint={"#101f2a":"#211326","#253d46":"#4a3352","#29424b":"#513959","#213942":"#432d4d","#334c55":"#67496f","#1b303a":"#302039","#678b86":"#a17ea9","#132d34":"#26172e","#152c35":"#291a34","#71878a":"#ac8aae","#142f42":"#2c2041","#405f7a":"#574373","#557694":"#70558b","#6b87a0":"#9b80b0"};
export class ArcadeRoomRenderer extends AIRoomRenderer {
 rect(x,y,w,h,color){super.rect(x,y,w,h,tint[color]||color);}
 background(area,decor){
  if(!this.backgroundCanvas){
   this.backgroundCanvas=document.createElement("canvas");this.backgroundCanvas.width=area.WORLD_WIDTH;this.backgroundCanvas.height=area.WORLD_HEIGHT;
   const old=this.ctx;this.ctx=this.backgroundCanvas.getContext("2d");
   this.rect(0,0,area.WORLD_WIDTH,area.WORLD_HEIGHT,"#24132c");
   for(let y=0;y<area.WORLD_HEIGHT;y+=48)for(let x=0;x<area.WORLD_WIDTH;x+=48){
    const alt=(x/48+y/48)%2;this.rect(x,y,48,48,alt?"#5c2a5e":"#3f1c48");
    this.rect(x,y,48,3,alt?"#713a73":"#54295d");this.rect(x+45,y,3,48,"#32163b");
    if((x/48+y/48)%3===0)this.rect(x+12,y+30,12,3,"#47214f");
   }
   for(const r of ROOMS){this.rect(r.x+45,r.y+65,r.w-90,r.h-110,"rgba(24,9,33,.16)");this.text(r.label,r.x+r.w/2,r.y+r.h-43,"#dfbadb",15,"center");}
   for(const d of decor){
    if(d.type==="whiteboard"){this.rect(d.x,d.y,d.w,d.h,"#795a80");this.rect(d.x+4,d.y+4,d.w-8,d.h-8,"#35213e");this.text("PLAY / EXPLORE",d.x+d.w/2,d.y+d.h/2,"#dab9d2",12,"center");}
    if(d.type==="window"){this.rect(d.x,d.y,d.w,d.h,"#5a4368");this.rect(d.x+6,d.y+6,d.w-12,d.h-12,"#463e70");this.rect(d.x+d.w/2-3,d.y,6,d.h,"#8b76a1");}
    if(d.type==="poster"){this.rect(d.x,d.y,d.w,d.h,"#76556f");this.rect(d.x+3,d.y+3,d.w-6,d.h-6,"#34233e");this.text(d.label,d.x+d.w/2,d.y+d.h/2,"#e4b6ce",10,"center");}
    if(d.type==="clock"){this.rect(d.x,d.y,d.w,d.h,"#9b83a1");this.rect(d.x+3,d.y+3,d.w-6,d.h-6,"#36233e");this.rect(d.x+d.w/2,d.y+6,3,d.h/2,"#d4c3bc");}
   }
   this.ctx=old;
  }
  this.ctx.drawImage(this.backgroundCanvas,0,0);
 }
 prop(f,active,solved){
  const {x,y,w,h}=f;
  if(f.type==="plant"){this.scaledProp({...f,scale:w/42},"plant");return;}
  if(f.type==="chair"){this.scaledProp({...f,scale:w/42},"chair");return;}
  if(f.type==="sofa"){this.scaledProp({...f,scale:w/144},"sofa");return;}
  if(f.type==="shelf"){this.shelf(f);return;}
  this.shadow(x,y,w,h);
  if(["gameCabinet","gameTable","puzzleConsole"].includes(f.type)){
   const tall=f.type==="gameCabinet",top=y-(tall?30:12);
   this.rect(x,top,w,h+y-top,"#231b32");this.rect(x+3,top+3,w-6,h+y-top-6,solved?"#5a4772":"#514061");
   this.rect(x+6,top+7,w-12,(tall?h*.58:h*.6),"#181c30");
   this.rect(x+9,top+10,w-18,(tall?h*.5:h*.47),active?"#3e5a76":"#29354d");


   const sx=x+10,sy=top+11,sw=w-20,sh=tall?h*.49:h*.44;
   if(f.kind==="memory"){
    const cell=Math.min(sw/2,sh/2)-3;
    for(let i=0;i<4;i++)this.rect(sx+(i%2)*(cell+3),sy+Math.floor(i/2)*(cell+3),cell,cell,["#cb759b","#719abf","#c4a869","#7daf95"][i]);
   }else if(f.kind==="maze"){
    const size=Math.min(sw,sh)/5;
    for(let i=0;i<25;i++)if([1,5,8,11,13,16,18].includes(i))this.rect(sx+i%5*size,sy+Math.floor(i/5)*size,size-1,size-1,"#74829b");
    this.rect(sx,sy,4,4,"#ead8a8");this.rect(sx+size*4,sy+size*4,4,4,"#e58bb8");
   }else if(f.kind==="pairs"){
    const cell=Math.min(sw/4,sh/2)-2;
    for(let i=0;i<8;i++){this.rect(sx+i%4*(cell+2),sy+Math.floor(i/4)*(cell+2),cell,cell,i%3===0?"#d8b57b":"#847498");}
   }else if(f.kind==="lights"){
    const cell=Math.min(sw,sh)/3-2;
    for(let i=0;i<9;i++)this.rect(sx+i%3*(cell+2),sy+Math.floor(i/3)*(cell+2),cell,cell,i%2?"#37485d":"#bfa575");
   }

   this.rect(x+6,y+h-28,w-12,16,"#90719a");
   for(let i=0;i<3;i++)this.rect(x+12+i*(w-24)/3,y+h-22,5,5,["#eb86aa","#87c9ce","#d8b773"][i]);
   this.rect(x+6,y+h-8,w-12,3,"#af82b7");
   if(tall){this.rect(x+w/2-5,y+h-4,10,3,"#231b32");this.rect(x+10,y+h-26,4,9,"#261f31");}
   this.rect(x+6,top-4,w-12,6,f.kind==="memory"?"#ae6e97":f.kind==="maze"?"#7592b4":f.kind==="lights"?"#b69b70":"#8e80b0");
   if(solved)this.text("✓",x+w-8,top-7,"#a8deba",14,"center");
  }else if(f.type==="poolTable"){
   this.rect(x,y,w,h,"#33213d");this.rect(x+3,y+3,w-6,h-6,"#997052");this.rect(x+9,y+9,w-18,h-18,"#31695d");this.rect(x+12,y+12,w-24,3,"#70a18e");
   for(const [px,py] of [[12,12],[w/2,10],[w-12,12],[12,h-12],[w/2,h-10],[w-12,h-12]])this.rect(x+px-4,y+py-4,8,8,"#14282a");
   [[30,30,"#ebe3c7"],[w*.65,h*.5,"#e785a1"],[w*.7,h*.3,"#dabd65"],[w*.7,h*.7,"#6caee1"]].forEach(([bx,by,col])=>this.rect(x+bx,y+by,6,6,col));
   this.rect(x+15,y+h-18,w*.4,3,"#c6a977");
  }else if(f.type==="prizeShelf"){
   this.rect(x,y-30,w,h+30,"#322238");this.rect(x+3,y-27,w-6,h+24,"#927093");
   for(let i=0;i<Math.floor(w/26);i++){const col=["#df85af","#77b7c6","#c8b16c","#a68ad4"][i%4];this.rect(x+8+i*26,y-18,16,25,col);this.rect(x+11+i*26,y-24,10,9,col);this.rect(x+11+i*26,y-15,3,3,"#252032");}
   this.rect(x+3,y+15,w-6,6,"#ad87a4");
  }else if(f.type==="table"||f.type==="snackCounter"){
   this.rect(x+9,y+h-6,9,18,"#342235");this.rect(x+w-18,y+h-6,9,18,"#342235");this.rect(x,y,w,h,"#816047");this.rect(x+3,y+3,w-6,h-9,"#bc946a");
   for(let i=0;i<(f.type==="table"?1:3);i++){this.rect(x+12+i*28,y+9,15,18,"#ded1b2");this.rect(x+15+i*28,y+9,9,6,"#645043");}
  }else if(f.type==="bench"){this.rect(x,y,w,h,"#58364e");this.rect(x+3,y+3,w-6,h-6,"#ad7189");for(let i=0;i<3;i++)this.rect(x+6,y+6+i*6,w-12,3,"#7b4b64");
  }else if(f.type==="toolCart"){this.rect(x,y-12,w,h+12,"#343049");this.rect(x+3,y-9,w-6,h+6,"#77809c");for(let i=0;i<3;i++)this.rect(x+9,y+6+i*12,w-18,6,"#343b58");
  }else if(f.type==="watercooler"){this.rect(x+3,y+15,w-6,h-15,"#9389a1");this.rect(x+6,y-12,w-12,36,"#729ec0");this.rect(x+12,y+27,6,6,"#cddbd8");

  }else if(f.type==="jukebox"){
   this.rect(x,y-18,w,h+18,"#2a2039");this.rect(x+3,y-15,w-6,h+12,"#935b85");
   this.rect(x+9,y-9,w-18,27,"#3a3154");this.rect(x+12,y-6,w-24,3,"#bea385");
   this.rect(x+9,y+24,w-18,h-36,"#292b42");
   for(let i=0;i<5;i++)this.rect(x+12+i*(w-24)/5,y+27,3,h-43,"#776281");
   this.rect(x+12,y+7,w-24,6,"#9cb8c2");
  }else if(f.type==="gumball"){
   this.rect(x+3,y-9,w-6,30,"#60839b");this.rect(x+6,y-6,w-12,24,"#a3bcc1");
   for(let i=0;i<6;i++)this.rect(x+8+i%3*7,y-3+Math.floor(i/3)*8,5,5,["#cb759b","#719abf","#c4a869"][i%3]);
   this.rect(x+6,y+21,w-12,h-21,"#955e7d");this.rect(x+w/2-3,y+27,6,9,"#323047");
  }else if(f.type==="dartboard"){
   this.rect(x,y-24,w,h+24,"#53465e");this.rect(x+6,y-18,w-12,h+12,"#9d8a80");
   this.rect(x+12,y-12,w-24,h,"#5c7380");this.rect(x+18,y-6,w-36,h-12,"#be8a92");
   this.rect(x+w/2-3,y+h/2-12,6,6,"#e8d9b2");
  }else if(f.type==="trophyCase"){
   this.rect(x,y-27,w,h+27,"#38283c");this.rect(x+3,y-24,w-6,h+21,"#836b7e");
   for(let i=0;i<Math.floor(w/30);i++){this.rect(x+10+i*30,y-15,15,12,"#cbb071");this.rect(x+16+i*30,y-3,3,12,"#b79364");this.rect(x+10+i*30,y+9,15,6,"#d8c090");}
  }else{this.rect(x,y,w,h,"#765778");}
  if(f.taskId&&active)this.rect(x,y+h+3,w,3,"#ed97ce");
 }
 renderArcade(area,props,players,activeId,solvedIds,drawPlayer,walls,doors,drawDoor,decor){
  const c=this.ctx;c.save();c.imageSmoothingEnabled=false;
  this.background(area,decor);
  const solved=new Set(solvedIds);
  const entries=[...props.map(f=>({y:f.y+f.h,draw:()=>this.prop(f,activeId===f.taskId,solved.has(f.taskId))})),
   ...walls.map(w=>({y:w.y+w.h,draw:()=>this.interiorWall(w)})),
   ...doors.map(d=>({y:d.y+d.h,draw:()=>drawDoor(d)})),
   ...players.map(p=>({y:p.y+(p.seated?60:12),draw:()=>{c.save();c.imageSmoothingEnabled=true;drawPlayer(p);c.restore();}}))
  ].sort((a,b)=>a.y-b.y);
  entries.forEach(e=>e.draw());walls.forEach(w=>this.interiorTrim(w));
  this.rect(1110,15,300,51,"#23182f");this.rect(1113,18,294,3,"#ae7ca8");
  this.text("PIXEL ARCADE",1260,37,"#ecadd7",23,"center");
  c.restore();
 }
}
