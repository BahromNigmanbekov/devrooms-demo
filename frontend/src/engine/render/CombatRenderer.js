export function drawCombat(ctx,room,area,player,interactables=[]){
 const now=Date.now();ctx.save();
 for(const t of room.trainingTargets||[]){
  if(t.area!==area)continue;
  const respawning=!t.hp&&now<t.respawnAt,hp=(!t.hp&&!respawning)?t.maxHp:t.hp;
  ctx.save();ctx.translate(t.x,t.y);ctx.globalAlpha=respawning?.35:1;
  ctx.fillStyle='#10262e88';ctx.beginPath();ctx.ellipse(0,22,25,9,0,0,Math.PI*2);ctx.fill();
  ctx.translate(0,Math.sin(now/500+t.x)*3);
  ctx.fillStyle='#4b6378';ctx.strokeStyle='#96abbc';ctx.lineWidth=2;ctx.beginPath();ctx.roundRect(-23,-21,46,39,12);ctx.fill();ctx.stroke();
  ctx.fillStyle='#182932';ctx.beginPath();ctx.arc(0,-2,12,0,Math.PI*2);ctx.fill();ctx.strokeStyle='#f3ae67';ctx.lineWidth=4;ctx.beginPath();ctx.arc(0,-2,7,0,Math.PI*2);ctx.stroke();
  ctx.fillStyle='#273b48';ctx.fillRect(-30,-7,7,16);ctx.fillRect(23,-7,7,16);
  ctx.fillStyle='#10202b';ctx.fillRect(-25,-35,50,5);ctx.fillStyle='#e2ad65';ctx.fillRect(-25,-35,50*hp/t.maxHp,5);
  ctx.textAlign='center';ctx.font='12px Arcade, monospace';ctx.fillStyle='#dccaa5';ctx.fillText(respawning?'QAYTISH '+Math.ceil((t.respawnAt-now)/1000)+'s':'MASHQ DRONI',0,-43);ctx.restore();
 }
 for(const p of room.players||[])if(p.area===area&&p.shieldUntil>now){ctx.strokeStyle='#86c5ff88';ctx.lineWidth=2;ctx.beginPath();ctx.arc(p.id===player.id?player.x:p.x,p.id===player.id?player.y:p.y,36,0,Math.PI*2);ctx.stroke()}
 const me=room.players?.find(p=>p.id===player.id);
 if(me?.scanUntil>now)for(const obj of interactables){if(Math.hypot(obj.x-player.x,obj.y-player.y)>(me.scanRange||440))continue;ctx.strokeStyle='#c7a2ff';ctx.shadowColor='#ba81ff';ctx.shadowBlur=14;ctx.lineWidth=2;ctx.strokeRect(obj.x-8,obj.y-8,obj.w+16,obj.h+16);ctx.shadowBlur=0;}
 for(const effect of room.combatEffects||[]){
  const age=now-effect.at;if(effect.area!==area||age>700||age<0)continue;
  const progress=age/700;ctx.save();ctx.translate(effect.x,effect.y);ctx.globalAlpha=1-progress;ctx.strokeStyle=effect.color;ctx.fillStyle=effect.color;ctx.shadowColor=effect.color;ctx.shadowBlur=12;ctx.lineWidth=3;
  if(effect.type==='ranged'){
   if(age<300){ctx.beginPath();ctx.moveTo(effect.dx*22,effect.dy*22);ctx.lineTo(effect.dx*effect.range,effect.dy*effect.range);ctx.stroke();ctx.strokeStyle='#eefaff';ctx.lineWidth=1;ctx.stroke();}
  }else if(effect.type==='melee'){
   const angle=Math.atan2(effect.dy,effect.dx);ctx.lineWidth=6*(1-progress);ctx.beginPath();ctx.arc(0,0,Math.min(effect.range,100),angle-1.15,angle+1.15);ctx.stroke();
  }else{ctx.beginPath();ctx.arc(0,0,effect.range*Math.min(1,progress*1.5),0,Math.PI*2);ctx.stroke();if(effect.type==='heal'){ctx.font='bold 24px monospace';ctx.textAlign='center';ctx.fillText('+15',0,-30-progress*30)}}
  ctx.restore();
  for(const hit of effect.hits||[]){ctx.save();ctx.globalAlpha=1-progress;ctx.font='bold 16px monospace';ctx.textAlign='center';ctx.fillStyle=hit.destroyed?'#ffdd73':'#fcb7a0';ctx.fillText(hit.destroyed?'+10':'−'+hit.damage,hit.x,hit.y-40-progress*35);ctx.restore();}
 }
 ctx.restore();
}
