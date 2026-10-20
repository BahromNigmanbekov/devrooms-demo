// This role appearance is deliberately absent from the equipment catalog.
export function drawHunter(ctx,w,h,layer,view='front'){
 ctx.save();ctx.scale(w*(view==='side'?.75:1),h);ctx.lineJoin='round';
 const shape=(d,fill,stroke='#241c24')=>{ctx.fillStyle=fill;ctx.strokeStyle=stroke;ctx.lineWidth=.03;const p=new Path2D(d);ctx.fill(p);ctx.stroke(p)};
 const g=ctx.createLinearGradient(-.5,-.7,.5,.5);g.addColorStop(0,'#596174');g.addColorStop(.45,'#293447');g.addColorStop(1,'#111b2d');
 if(layer==='behind'){
  shape('M-.4 -.28Q-.61 .12 -.69 .76L-.27 .62L0 .82L.27 .62L.69 .76Q.61 .12 .4 -.28Z','#7f2936');
  ctx.strokeStyle='#d96b4c';ctx.lineWidth=.025;ctx.stroke(new Path2D('M-.37 -.12L-.44 .54M.37 -.12L.44 .54'));
 }else{
  shape('M-.52 -.20Q-.59 -.70 -.23 -.83L0 -.93L.23 -.83Q.59 -.70 .52 -.20L.36 -.23Q0 -.57 -.36 -.23Z',g);
  shape('M-.46 -.45L-.18 -.52L0 -.45L.18 -.52L.46 -.45L.37 -.32Q0 -.40 -.37 -.32Z','#ffbf65','#7c483a');
  shape('M-.5 -.19L-.36 -.23L-.31 .22L-.44 .32L-.58 .13Z',g);
  shape('M.5 -.19L.36 -.23L.31 .22L.44 .32L.58 .13Z',g);
  shape('M-.18 -.77L0 -.9L.18 -.77L0 -.57Z','#e59250');
  ctx.fillStyle='#ffd99c';for(const s of [-1,1])ctx.fillRect(s*.43-.025,-.04,.05,.16);
  ctx.strokeStyle='#ffad58';ctx.lineWidth=.025;ctx.beginPath();ctx.ellipse(0,.64,.65,.18,0,0,Math.PI*2);ctx.stroke();
 }
 ctx.restore();
}
