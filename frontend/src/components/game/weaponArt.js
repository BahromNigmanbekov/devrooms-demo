import {getWeapon} from '../../../../shared/equipment.mjs';
export function drawWeapon(ctx,w,h,equipment={},action,aim){
 const item=getWeapon(equipment.weapon);if(!item)return;
 ctx.save();ctx.scale(w,h);ctx.translate(.47,.17);ctx.lineJoin='round';ctx.lineCap='round';
 const age=action?Date.now()-action.at:Infinity;
 if(age<380&&item.type==='melee')ctx.rotate(-1.3+Math.max(0,age/380)*2.6);
 const p=(d,fill,stroke='#202737',width=.025)=>{const a=new Path2D(d);ctx.fillStyle=fill;ctx.strokeStyle=stroke;ctx.lineWidth=width;ctx.fill(a);if(stroke)ctx.stroke(a)};
 const l=(d,color,width=.03)=>{ctx.strokeStyle=color;ctx.lineWidth=width;ctx.stroke(new Path2D(d))};
 const c=item.color;
 const metal=(light='#b4bec9',dark='#303a48')=>{const g=ctx.createLinearGradient(0,-.27,0,.18);g.addColorStop(0,light);g.addColorStop(.28,'#7d8c9c');g.addColorStop(.5,dark);g.addColorStop(.83,'#526070');g.addColorStop(1,'#202935');return g};
 const wood=()=>{const g=ctx.createLinearGradient(-.2,-.1,.2,.2);g.addColorStop(0,'#a78158');g.addColorStop(.5,'#674932');g.addColorStop(1,'#3d302a');return g};
 const angle=aim?Math.atan2(aim.facing.y,aim.facing.x*aim.mirror):0;
 if(aim&&item.type==='melee')ctx.rotate(angle+Math.PI/2);
 if(item.shape==='lightblade'||item.shape==='doubleblade'){
  p('M-.064 -.12L-.08 -.06V.23L-.045 .28H.045L.08 .23V-.06L.064 -.12Z',metal());
  p('M-.075 -.14H.075V-.06H-.075Z',metal('#dae3e6','#596876'));
  for(let i=0;i<4;i++)l(`M-.05 ${.01+i*.05}H.05`,'#202b38',.025);
  l('M-.028 -.03V.20','#dbe5e8',.013);p('M.03 -.015H.075V.025H.03Z',c,null);
  ctx.shadowColor=c;ctx.shadowBlur=w*.25;l('M0 -.17V-1.01',c,.095);l('M0 -.17V-1.01','#f7ffff',.032);
  ctx.shadowBlur=w*.06;l('M0 -.18V-.99','#ffffff',.012);
  if(item.shape==='doubleblade'){l('M0 .26V.84',c,.11);l('M0 .26V.84','#f1ffff',.035)}
 }else if(['rifle','sniper','scatter'].includes(item.shape)){
  ctx.rotate(aim?angle:-.16);
  const recoil=age<160?Math.sin(age/160*Math.PI)*.065:0;ctx.translate(-recoil,0);
  const sniper=item.shape==='sniper',shotgun=item.shape==='scatter',barrel=sniper?1.04:shotgun?.76:.87;
  // Adjustable stock, receiver, barrel, ventilated handguard and magazine.
  p('M-.15 -.11L-.32 -.14L-.34 -.19H-.43L-.46 .08H-.35L-.29 .015H-.15Z',metal('#7b8998','#28323d'));
  l('M-.43 -.14L-.45 .045','#a8b1ba',.025);p('M-.32 -.10L-.18 -.075V-.025H-.34Z','#101d28',null);
  p(`M.37 -.13H${barrel}V-.065H.37Z`,metal('#c1c7cb','#424e5c'));
  p(`M${barrel-.05} -.15h.10v.12h-.10Z`,metal('#9faab7','#293441'));l(`M${barrel+.035} -.13V-.05`,'#141f29',.018);
  p('M-.16 -.18L-.09 -.215H.34L.42 -.15V-.015L.29 .035H-.14Z',metal('#9aa5ac','#29333d'));
  p('M.33 -.17H.62L.68 -.13L.64 -.015H.34Z',shotgun?wood():metal('#5b6875','#26313e'));
  for(let i=0;i<5;i++)l(`M${.37+i*.05} -.12V-.05`,'#111e2b',.018);
  p('M.08 .012L.22 .01L.24 .20L.34 .30L.21 .35L.11 .22Z',item.id==='gun-burst'?wood():metal('#687787','#222d39'));
  for(let i=0;i<3;i++)l(`M${.14+i*.03} .08L${.18+i*.035} .24`,'#182532',.012);
  p('M-.11 -.005H-.01L-.08 .23H-.19Z','#3b414b');for(let i=0;i<4;i++)l(`M-.15 ${.05+i*.04}h.07`,'#626b74',.014);
  l('M-.015 .02Q.11 .02 .1 .11Q.04 .16 -.06 .10','#7b8793',.02);l('M.025 .015V.07','#c0c8ca',.015);
  p('M-.04 -.155H.21V-.065H-.04Z','#17232f');l('M-.025 -.14H.19','#bac5cb',.015);l('M.03 -.1H.11','#596b7c',.015);
  l('M-.08 -.215H.56','#172632',.04);for(let i=0;i<8;i++)l(`M${-.06+i*.075} -.235V-.20`,'#8995a0',.012);
  for(const [x,y] of [[-.10,-.10],[.27,-.13],[.32,-.04]]){l(`M${x-.01} ${y}h.02`,'#d0d2cb',.014)}
  l('M.38 -.025H.54',c,.018);
  if(sniper){p('M.03 -.31H.47V-.235H.03Z',metal());p('M.0 -.34H.12V-.225H0Z','#4b5c6b');p('M.43 -.35H.54V-.22H.43Z','#334854');l('M.52 -.32V-.25','#95d9d7',.024);l('M.18 -.31V-.39','#8b9aa6',.04)}
  else{p('M.00 -.32H.14L.19 -.27V-.215H0Z',metal('#8b999f','#334351'));p('M.04 -.29H.12V-.24H.04Z','#82d5db',null)}
  if(shotgun){l('M.48 .025H.78','#63717d',.045);p('M.37 -.03H.61V.075H.37Z',wood());for(let i=0;i<4;i++)l(`M${.40+i*.05} -.015V.055`,'#3d302c',.014)}
  if(item.id==='gun-rail'){l('M.61 -.18H1.01M.61 .02H1.01','#8e9da8',.035);l('M.68 -.085H1.02',c,.02)}
  if(item.id==='gun-plasma'){p('M.2 -.30Q.33 -.46 .46 -.30V-.22H.2Z',metal());l('M.25 -.3H.41',c,.04)}
  if(item.id==='gun-repeater'){p('M.12 .05Q-.02 .36 .28 .39Q.53 .34 .40 .07Z',metal());l('M.17 .17Q.08 .31 .31 .32',c,.015)}
  if(item.id==='gun-frost')for(let i=0;i<3;i++)l(`M${.37+i*.07} -.20V-.16`,'#8ed9e4',.025);
  if(age<95){ctx.shadowColor=c;ctx.shadowBlur=w*.2;p(`M${barrel+.06} -.10l.12 -.07 -.03 .07 .15 .02 -.15 .03 .03 .06 -.12 -.06Z`,'#ffe9b1',null)}
 }else if(['staff','healstaff','shieldstaff'].includes(item.shape)){
  l('M0 .4V-.83',metal('#beb7a3','#443d42'),.075);l('M-.018 .4V-.7','#e2d3a1',.013);
  for(let i=0;i<6;i++)l(`M-.037 ${.05+i*.045}h.074`,'#392b36',.025);
  if(item.shape==='healstaff'){p('M0 -.63L-.26 -.84Q-.3 -1.1 -.08 -1.08L0 -.98L.08 -1.08Q.3 -1.1 .26 -.84Z',c);l('M-.12 -.9H.12M0 -1.02V-.78','#f4ffee',.05)}
  else if(item.shape==='shieldstaff')p('M0 -1.15L.25 -1.04L.20 -.76L0 -.61L-.20 -.76L-.25 -1.04Z',c,'#d7f4ff');
  else{p('M0 -1.2L.18 -.94L0 -.67L-.18 -.94Z',c,'#a8b6cb');p('M0 -1.2L.18 -.94L0 -.91Z','#e7f2ff88',null);p('M0 -.91L.18 -.94L0 -.67Z','#30467388',null);l('M0 -1.12V-.76','#ffffffa0',.016);l('M-.2 -1.02Q-.2 -.71 0 -.67Q.2 -.71 .2 -1.02','#c6b481',.035);}
 }else if(item.shape==='axe'){
  l('M0 .36V-.88','#ba986c',.065);p('M-.05 -.87Q.32 -1.05 .36 -.63Q.19 -.74 .0 -.60Z',c,'#d5e4eb');
 }else if(item.shape==='hammer'){
  l('M0 .34V-.65','#a98666',.075);p('M-.3 -.88H.3L.36 -.78V-.56L.27 -.48H-.27L-.36 -.56V-.78Z',c,'#d9d8ed');l('M-.23 -.75H.23','#fff2d2',.04);
 }else if(item.shape==='spear'){
  l('M0 .45V-.83','#9fa8ab',.055);p('M0 -1.22L.15 -.88L0 -.7L-.15 -.88Z',c,'#e4f8fa');
 }else{
  const katana=item.shape==='katana',double=item.shape==='daggers';
  const steel=ctx.createLinearGradient(-.09,0,.1,0);steel.addColorStop(0,'#52677c');steel.addColorStop(.4,'#dbe4e6');steel.addColorStop(.5,'#f3f5ef');steel.addColorStop(.56,'#8498aa');steel.addColorStop(1,'#c0ced5');
  p(katana?'M-.04 -.12Q.02 -.60 .14 -1.1Q.20 -.83 .05 -.12Z':'M-.07 -.13L-.08 -.82L0 -1L.08 -.82L.07 -.13Z',steel,'#e1e7e7',.011);
  l(katana?'M.01 -.2Q.06 -.7 .14 -1.03':'M0 -.2V-.91','#728fa0',.012);
  p('M-.22 -.13Q0 -.05 .22 -.13L.20 -.07Q0 .02 -.20 -.07Z',metal('#d2c49e','#7e6442'));
  l('M0 -.04V.25','#46303b',.085);for(let i=0;i<5;i++)l(`M-.032 ${i*.048}l.064 .025`,'#b19c7d',.016);
  p('M-.05 .23H.05L.07 .3L0 .34L-.07 .3Z',metal('#d6c79e','#89754b'));l('M-.02 .28H.02',c,.025);
  if(double){ctx.translate(-.15,.1);ctx.rotate(-.6);p('M-.42 -.12L-.44 -.65L-.36 -.8L-.28 -.65L-.3 -.12Z',c);l('M-.52 -.12H-.19','#dec48e',.04);l('M-.36 -.06V.15','#614958',.06)}
 }
 ctx.restore();
}
