import { initialPool, POOL_POCKETS, simulatePoolShot } from "../../../../shared/poolPhysics.mjs";
import { toggleLights, validateArcadeAnswer } from "../../../../shared/arcadeActivities.mjs";
export class ArcadeBoard {
 constructor(root,onChange) {
  this.root=root;root.tabIndex=-1;this.onChange=onChange;this.timers=[];
  this.click=e=>{if(this.root.inert)return;if(e.target.closest("button[data-pool-shoot]")){this.shootPool();return;}const b=e.target.closest("button[data-play]");if(b)this.play(Number(b.dataset.play));};
  this.key=e=>{if(!this.active||this.root.inert||!this.root.closest(".open")||this.task.kind!=="maze")return;
   const d={ArrowUp:0,ArrowRight:1,ArrowDown:2,ArrowLeft:3}[e.code];if(d!==undefined){e.preventDefault();this.play(d);}
  };
  root.addEventListener("click",this.click);window.addEventListener("keydown",this.key);
 }
 stop(){this.active=false;this.timers.forEach(clearTimeout);this.timers=[];cancelAnimationFrame(this.poolRaf);this.poolRaf=null;this.poolAnimating=false;}
 open(task){
  this.stop();this.active=true;this.task=task;this.answer=[];this.position=task.start;this.lights=task.initial?[...task.initial]:[];
  this.pool=initialPool();this.angle=0;this.power=70;this.poolAnimating=false;
  this.matched=new Set();this.flipped=[];this.revealing=false;this.highlight=-1;this.message="";
  if(task.kind==="memory"){
   this.revealing=true;this.message="Signalni eslab qoling...";
   task.sequence.forEach((value,i)=>{
    this.timers.push(setTimeout(()=>{if(!this.active)return;this.highlight=value;this.draw();},i*800+200));
    this.timers.push(setTimeout(()=>{if(!this.active)return;this.highlight=-1;this.draw();},i*800+700));
   });
   this.timers.push(setTimeout(()=>{if(!this.active)return;this.revealing=false;this.message="Endi sizning navbatingiz.";this.draw();},task.sequence.length*800+200));
  }
  this.draw();
 }
 getAnswer(){return [...this.answer];}
 button(parent,text,index,classes=""){
  const b=document.createElement("button");b.type="button";b.dataset.play=index;b.className="arcade-key "+classes;b.textContent=text;parent.append(b);return b;
 }
 draw(){
  if(!this.active)return;
  if(this.task.kind==="billiards"){this.drawPool();return;}
  const focused=document.activeElement?.dataset.play;
  this.root.replaceChildren();
  const screen=document.createElement("div");screen.className="arcade-game-screen";
  const t=this.task,grid=document.createElement("div");grid.className="arcade-play-grid "+t.kind;
  if(t.kind==="memory"){
   ["1 · ▲","2 · ◆","3 · ●","4 · ★"].forEach((label,i)=>{
    const b=this.button(grid,label,i,this.highlight===i?"lit":"");
    b.disabled=this.revealing||this.answer.length>=t.sequence.length;
   });
  }else if(t.kind==="lights"){
   this.lights.forEach((on,i)=>{const b=this.button(grid,on?"●":"○",i,on?"lit":"");b.setAttribute("aria-label","Katak "+(i+1)+(on?" yoniq":" o'chiq"));});
  }else if(t.kind==="maze"){
   for(let i=0;i<t.size*t.size;i++){
    const cell=document.createElement("div");cell.className="maze-cell"+(t.walls.includes(i)?" maze-wall":"");
    cell.textContent=i===this.position?"◉":i===t.goal?"⚑":"";grid.append(cell);
   }
  }else{
   t.cards.forEach((value,i)=>{
    const shown=this.flipped.includes(i)||this.matched.has(i);
    const b=this.button(grid,shown?value:"?",i,this.matched.has(i)?"matched":"");
    b.disabled=this.matched.has(i)||this.flipped.length===2;b.setAttribute("aria-label","Kartochka "+(i+1)+(shown?": "+value:""));
   });
  }
  screen.append(grid);this.root.append(screen);
  if(t.kind==="maze"){
   const controls=document.createElement("div");controls.className="maze-controls";
   ["↑","→","↓","←"].forEach((v,i)=>this.button(controls,v,i));this.root.append(controls);
  }
  const status=document.createElement("p");status.className="arcade-game-status";status.setAttribute("role","status");
  const complete=validateArcadeAnswer(t,this.answer);
  status.textContent=complete?"Tayyor! Natijani tasdiqlang.":this.message||(t.kind==="pairs"?this.matched.size/2+" / 6 juft":t.kind==="lights"?this.lights.filter(Boolean).length+" chiroq qoldi":this.answer.length+" harakat");
  if(t.kind==="memory"&&!this.revealing)status.textContent=complete?"Tayyor! Natijani tasdiqlang.":"Kiritildi: "+this.answer.length+" / "+t.sequence.length;
  this.root.append(status);
  this.onChange(this.answer.length>0&&!this.revealing);
  if(focused!==undefined)this.root.querySelector('[data-play="'+focused+'"]')?.focus({preventScroll:true});
 }
 play(index){
  if(!this.active||this.revealing)return;const t=this.task;
  if(t.kind==="memory"){if(this.answer.length>=t.sequence.length)return;this.answer.push(index);}
  else if(t.kind==="lights"){this.lights=toggleLights(this.lights,index);this.answer.push(index);}
  else if(t.kind==="maze"){
   const [dr,dc]=[[-1,0],[0,1],[1,0],[0,-1]][index],r=Math.floor(this.position/t.size)+dr,c=this.position%t.size+dc,next=r*t.size+c;
   if(r<0||c<0||r>=t.size||c>=t.size||t.walls.includes(next)){this.message="Bu yo'l yopiq. Boshqa yo'lni sinang.";this.draw();return;}
   this.message="";this.position=next;this.answer.push(index);
  }else{
   if(this.matched.has(index)||this.flipped.includes(index)||this.flipped.length===2)return;
   this.flipped.push(index);
   if(this.flipped.length===2){
    const [a,b]=this.flipped;
    if(t.cards[a]===t.cards[b]){this.matched.add(a);this.matched.add(b);this.answer.push(a,b);this.flipped=[];}
    else this.timers.push(setTimeout(()=>{if(!this.active)return;this.flipped=[];this.draw();},800));
   }
  }
  this.draw();
 }

 drawPool(){
  this.root.replaceChildren();
  const wrap=document.createElement("div");wrap.className="pool-game-screen";
  this.poolCanvas=document.createElement("canvas");this.poolCanvas.width=440;this.poolCanvas.height=240;this.poolCanvas.className="pool-canvas";this.poolCanvas.setAttribute("aria-label","Bilyard: stol ustiga bosib nishon oling");wrap.append(this.poolCanvas);this.root.append(wrap);
  this.poolCanvas.addEventListener("pointerdown",e=>{
   if(this.poolAnimating||this.root.inert)return;const r=this.poolCanvas.getBoundingClientRect(),b=this.pool[0];
   this.angle=Math.round((Math.atan2((e.clientY-r.top)*240/r.height-b.y,(e.clientX-r.left)*440/r.width-b.x)*180/Math.PI+360)%360)%360;
   this.angleInput.value=this.angle;this.angleInput.dispatchEvent(new Event("input"));
  });
  const controls=document.createElement("div");controls.className="pool-controls";
  const range=(text,min,max,value,set)=>{
   const label=document.createElement("label");
   const caption=document.createElement("span"),unit=text==="Zarba kuchi"?"%":"deg";caption.textContent=text+": "+value+unit;label.append(caption);
   const input=document.createElement("input");input.type="range";input.min=min;input.max=max;input.step=1;input.value=value;input.setAttribute("aria-label",text);input.disabled=this.poolAnimating;
   input.addEventListener("input",()=>{set(Number(input.value));caption.textContent=text+": "+input.value+unit;this.paintPool();});label.append(input);controls.append(label);return input;
  };
  this.angleInput=range("Nishon burchagi",0,359,this.angle,v=>this.angle=v);
  range("Zarba kuchi",10,100,this.power,v=>this.power=v);
  const shoot=document.createElement("button");shoot.type="button";shoot.className="arcade-key pool-shoot";shoot.dataset.poolShoot="true";shoot.textContent=this.poolAnimating?"To'plar harakatda...":"Zarba berish";shoot.disabled=this.poolAnimating||this.answer.length>=12;controls.append(shoot);this.root.append(controls);
  const status=document.createElement("p");status.className="arcade-game-status";
  const count=this.pool.slice(1).filter(b=>b.pocketed).length;
  status.textContent="Tushirilgan to'plar: "+count+"/3 · Zarba: "+this.answer.length+"/12"+(count>=this.task.goal?" · Natijani tasdiqlashingiz mumkin.":"");
  this.root.append(status);this.paintPool();this.onChange(this.answer.length>0&&!this.poolAnimating);
 }
 paintPool(state=this.pool){
  const c=this.poolCanvas?.getContext("2d");if(!c)return;
  c.fillStyle="#73513f";c.fillRect(0,0,440,240);c.fillStyle="#286458";c.fillRect(12,12,416,216);
  c.strokeStyle="#76a387";c.lineWidth=2;c.strokeRect(22,22,396,196);
  for(const [x,y] of POOL_POCKETS){c.fillStyle="#0d1921";c.beginPath();c.arc(x,y,14,0,Math.PI*2);c.fill();}
  if(!this.poolAnimating){
   const b=state[0],r=this.angle*Math.PI/180;c.save();c.setLineDash([4,5]);c.strokeStyle="#dddfbbaa";c.beginPath();c.moveTo(b.x,b.y);c.lineTo(b.x+Math.cos(r)*100,b.y+Math.sin(r)*100);c.stroke();c.restore();
   c.strokeStyle="#d2b382";c.lineWidth=4;c.beginPath();c.moveTo(b.x-Math.cos(r)*18,b.y-Math.sin(r)*18);c.lineTo(b.x-Math.cos(r)*75,b.y-Math.sin(r)*75);c.stroke();
  }
  for(const b of state){if(b.pocketed)continue;c.fillStyle=["#f3ecd3","#e379a4","#e0bd65","#79b8e0"][b.id];c.beginPath();c.arc(b.x,b.y,6,0,Math.PI*2);c.fill();c.fillStyle="#fff9";c.beginPath();c.arc(b.x-2,b.y-2,1.5,0,Math.PI*2);c.fill();}
 }
 shootPool(){
  if(!this.active||this.root.inert||this.poolAnimating||this.answer.length>=12)return;
  const encoded=this.angle*101+this.power,result=simulatePoolShot(this.pool,encoded,true);this.answer.push(encoded);this.poolAnimating=true;this.drawPool();
  let frame=0;
  const animate=()=>{
   if(!this.active)return;
   if(frame<result.frames.length){this.paintPool(result.frames[frame++]);this.poolRaf=requestAnimationFrame(animate);}
   else{this.pool=result.balls;this.poolAnimating=false;this.poolRaf=null;this.drawPool();}
  };
  this.poolRaf=requestAnimationFrame(animate);
 }

 destroy(){this.stop();this.root.removeEventListener("click",this.click);window.removeEventListener("keydown",this.key);}
}
