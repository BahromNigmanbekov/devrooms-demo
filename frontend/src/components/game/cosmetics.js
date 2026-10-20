import {drawEquipmentArt} from './equipmentArt.js';

// Draw in the robot's own coordinates so accessories follow its scale,
// mirrored side view, and silhouette in every room and portrait.
export function drawCosmetics(ctx,w,h,equipment={},view='front',layer='front') {
 drawEquipmentArt(ctx,w,h,equipment,view,layer);
 ctx.save();ctx.scale(w,h);ctx.lineJoin='round';ctx.lineCap='round';
 const gradient=(top,bottom)=>{const g=ctx.createLinearGradient(-.4,-.8,.4,.4);g.addColorStop(0,top);g.addColorStop(1,bottom);return g;};
 const shape=(path,fill,stroke='#182032',width=.028)=>{ctx.fillStyle=fill;ctx.strokeStyle=stroke;ctx.lineWidth=width;const p=new Path2D(path);ctx.fill(p);if(stroke)ctx.stroke(p);};
 const line=(path,color,width=.02)=>{ctx.strokeStyle=color;ctx.lineWidth=width;ctx.stroke(new Path2D(path));};
 const ellipse=(x,y,rx,ry,fill,stroke)=>{ctx.beginPath();ctx.ellipse(x,y,rx,ry,0,0,Math.PI*2);ctx.fillStyle=fill;ctx.fill();if(stroke){ctx.lineWidth=.025;ctx.strokeStyle=stroke;ctx.stroke();}};
 const tank=x=>{shape(`M${x-.085} -.23 Q${x-.085} -.36 ${x} -.36 Q${x+.085} -.36 ${x+.085} -.23 L${x+.085} .32 Q${x+.085} .42 ${x} .42 Q${x-.085} .42 ${x-.085} .32Z`,gradient('#f2f4e5','#64778a'));line(`M${x-.07} -.14h.14M${x-.07} .23h.14`,'#3c536b',.045);line(`M${x-.035} -.24v.40`,'#ffffff99',.024);ellipse(x,.35,.036,.025,'#52cddd');};
 if(equipment.back==='astronaut'&&layer==='behind'){
  if(view==='side'){
   shape('M-.28 -.32Q-.70 -.39 -.72 -.12L-.72 .29Q-.65 .48 -.27 .35Z',gradient('#f0eadd','#788695'));
   tank(-.65);
  }else{tank(-.55);tank(.55);}
 }
 if(layer==='behind'){ctx.restore();return;}
 if(equipment.back==='astronaut'){
  if(view==='back'){
   shape('M-.30 -.34Q0 -.44 .30 -.34Q.40 -.30 .40 -.18L.38 .30Q.34 .44 0 .44Q-.34 .44 -.38 .30L-.40 -.18Q-.40 -.30 -.30 -.34Z',gradient('#fff9e9','#8495a4'));
   shape('M-.26 -.25Q0 -.32 .26 -.25L.25 .22Q0 .30 -.25 .22Z',gradient('#41596e','#25344e'));
   shape('M-.16 -.17h.32v.15h-.32Z','#56dae2','#8ef6ee',.012);
   line('M-.18 .08h.36M-.18 .14h.36','#768c9f',.027);
   shape('M-.10 .32h.20v.05h-.20Z','#e9a743',null);
   line('M-.33 -.22V.22','#ffffff80');
  }else if(view==='front'){
   // Harness follows the sides of the body, leaving the central eye free.
   line('M-.36 -.26Q-.46 0 -.36 .28M.36 -.26Q.46 0 .36 .28','#273340',.055);
   line('M-.36 -.26Q-.46 0 -.36 .28M.36 -.26Q.46 0 .36 .28','#bac8c9',.022);
  }
 }
 const side=view==='side';
 if(equipment.head==='cowboy'){
  ctx.save();if(side)ctx.scale(.78,1);
  // A pinched leather crown and curled brim, rather than stacked rectangles.
  shape('M-.37 -.52L-.32 -.88Q-.31 -1.02 -.17 -.94Q0 -.82 .17 -.94Q.31 -1.02 .32 -.88L.37 -.52Z',gradient('#dca862','#754023'),'#4a2b22');
  shape('M-.35 -.64Q0 -.55 .35 -.64L.37 -.52Q0 -.41 -.37 -.52Z','#63352a','#412423',.018);
  line('M-.25 -.86Q-.18 -.93 -.11 -.83M.14 -.84Q.21 -.94 .26 -.85','#edc38a',.022);
  shape('M-.70 -.62Q-.59 -.44 -.30 -.49Q0 -.43 .30 -.49Q.59 -.44 .70 -.62Q.78 -.32 .37 -.34Q0 -.25 -.37 -.34Q-.78 -.32 -.70 -.62Z',gradient('#f0c47a','#a56532'),'#4e2c24');
  line('M-.63 -.48Q-.51 -.35 -.29 -.39Q0 -.32 .29 -.39Q.51 -.35 .63 -.48','#ffe0a3',.025);
  if(view!=='back'){
   shape('M-.07 -.60h.14v.10h-.14Z','#d5a64e','#633b29',.015);
   shape('M-.032 -.578h.064v.053h-.064Z','#533229',null);
  }
  ctx.restore();
 }else if(equipment.head==='ranger'){
  ctx.save();if(side)ctx.scale(.73,1);
  shape('M-.49 -.24Q-.56 -.63 -.28 -.76Q0 -.89 .28 -.76Q.56 -.63 .49 -.24L.37 -.16L.31 -.40Q0 -.51 -.31 -.40L-.37 -.16Z',gradient('#f4f2ea','#8b9eac'),'#293547');
  shape('M-.43 -.43Q0 -.61 .43 -.43L.37 -.31Q0 -.44 -.37 -.31Z','#162435','#374658',.016);
  line('M-.28 -.43Q0 -.51 .28 -.43','#79e6f4',.025);
  shape('M-.48 -.26L-.37 -.23L-.34 .17L-.44 .25L-.55 .11Z',gradient('#edf2ee','#758593'));
  shape('M.48 -.26L.37 -.23L.34 .17L.44 .25L.55 .11Z',gradient('#edf2ee','#758593'));
  line('M-.46 -.05l.03 .14M.46 -.05l-.03 .14','#253a4c',.028);
  line('M-.27 -.66Q0 -.77 .26 -.65','#fff9e8',.028);
  if(view==='back'){
   shape('M-.35 -.38Q0 -.53 .35 -.38L.37 -.14Q0 -.03 -.37 -.14Z',gradient('#b4c3c9','#6c8296'));
   line('M-.23 -.28h.46M-.22 -.20h.44','#33495d',.022);
  }
  ctx.restore();
 }else if(equipment.head==='pilot'){
  ctx.save();if(side)ctx.scale(.75,1);
  shape('M-.49 -.26Q-.56 -.70 -.20 -.76Q0 -.82 .20 -.76Q.56 -.70 .49 -.26L.33 -.25Q.31 -.47 0 -.47Q-.31 -.47 -.33 -.25Z',gradient('#f9bc53','#9e4c24'),'#482c28');
  line('M-.11 -.75Q-.17 -.60 -.14 -.47M.11 -.75Q.17 -.60 .14 -.47','#f8e7ae',.046);
  shape('M-.50 -.39Q0 -.57 .50 -.39L.47 -.27Q0 -.43 -.47 -.27Z','#593a31','#2b2731',.025);
  if(view!=='back'){
   ellipse(-.20,-.39,.17,.13,'#d7c7a0','#45372c');ellipse(.20,-.39,.17,.13,'#d7c7a0','#45372c');
   ellipse(-.20,-.39,.12,.085,gradient('#72e5e9','#163c59'));ellipse(.20,-.39,.12,.085,gradient('#72e5e9','#163c59'));
   line('M-.27 -.42l.06 -.03M.13 -.42l.06 -.03','#c2ffff',.022);
  }
  ellipse(-.44,-.12,.10,.15,gradient('#d4944b','#66432e'),'#302a30');ellipse(.44,-.12,.10,.15,gradient('#d4944b','#66432e'),'#302a30');
  if(view==='side')line('M.46 -.02Q.58 .09 .28 .20','#313843',.027);
  ctx.restore();
 }
 ctx.restore();
}
