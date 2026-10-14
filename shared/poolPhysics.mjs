export const POOL_POCKETS=[[16,16],[220,16],[424,16],[16,224],[220,224],[424,224]];
export const initialPool=()=>[
 {id:0,x:90,y:120,vx:0,vy:0,pocketed:false},
 {id:1,x:310,y:120,vx:0,vy:0,pocketed:false},
 {id:2,x:335,y:85,vx:0,vy:0,pocketed:false},
 {id:3,x:335,y:155,vx:0,vy:0,pocketed:false}
];
export function simulatePoolShot(balls,encoded,collectFrames=false) {
 const angle=Math.floor(encoded/101),power=encoded%101;
 if(!Number.isInteger(encoded)||angle<0||angle>359||power<10||power>100)throw Error("Invalid shot");
 const state=balls.map(b=>({...b,vx:0,vy:0})),cue=state[0],rad=angle*Math.PI/180,frames=[];
 cue.vx=Math.cos(rad)*power*7;cue.vy=Math.sin(rad)*power*7;
 let scratch=false;
 for(let tick=0;tick<1100;tick++){
  for(const b of state){
   if(b.pocketed)continue;
   b.x+=b.vx/60;b.y+=b.vy/60;
   if(POOL_POCKETS.some(([x,y])=>Math.hypot(b.x-x,b.y-y)<14)){b.pocketed=true;b.vx=0;b.vy=0;if(b.id===0)scratch=true;continue;}
   if(b.x<22){b.x=22;b.vx=Math.abs(b.vx)*.88;}if(b.x>418){b.x=418;b.vx=-Math.abs(b.vx)*.88;}
   if(b.y<22){b.y=22;b.vy=Math.abs(b.vy)*.88;}if(b.y>218){b.y=218;b.vy=-Math.abs(b.vy)*.88;}
   b.vx*=.985;b.vy*=.985;
  }
  for(let i=0;i<state.length;i++)for(let j=i+1;j<state.length;j++){
   const a=state[i],b=state[j];if(a.pocketed||b.pocketed)continue;
   const dx=b.x-a.x,dy=b.y-a.y,dist=Math.hypot(dx,dy);if(dist>=12||dist===0)continue;
   const nx=dx/dist,ny=dy/dist,impulse=(a.vx-b.vx)*nx+(a.vy-b.vy)*ny;
   if(impulse>0){a.vx-=impulse*nx;a.vy-=impulse*ny;b.vx+=impulse*nx;b.vy+=impulse*ny;}
   const overlap=(12-dist)/2+.01;a.x-=nx*overlap;a.y-=ny*overlap;b.x+=nx*overlap;b.y+=ny*overlap;
  }
  if(collectFrames&&tick%4===0)frames.push(state.map(b=>({...b})));
  if(state.every(b=>b.pocketed||Math.hypot(b.vx,b.vy)<2))break;
 }
 if(scratch){const spot=[[90,120],[70,70],[70,170],[170,120]].find(([x,y])=>state.slice(1).every(b=>b.pocketed||Math.hypot(b.x-x,b.y-y)>16));cue.x=spot?.[0]??50;cue.y=spot?.[1]??120;cue.pocketed=false;}
 state.forEach(b=>{b.vx=0;b.vy=0;});
 return {balls:state,frames,scratch,pocketed:state.slice(1).filter(b=>b.pocketed).length};
}
export function validatePoolAnswer(task,shots) {
 if(!Array.isArray(shots)||shots.length===0||shots.length>12)return false;
 let state=initialPool();
 try{for(const shot of shots)state=simulatePoolShot(state,shot).balls;}catch{return false;}
 return state.slice(1).filter(b=>b.pocketed).length>=task.goal;
}
