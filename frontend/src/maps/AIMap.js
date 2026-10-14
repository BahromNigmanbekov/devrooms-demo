import { COLORS as OFFICE_COLORS } from "./OfficeMap.js";
import { AI_QUESTIONS } from "../../../shared/aiQuestions.mjs";
export const WORLD_WIDTH=2880, WORLD_HEIGHT=1800;
export const COLORS={...OFFICE_COLORS,floorA:"#183b3d",floorB:"#20494b",wall:"#183035",wallTop:"#527275",doorFrame:"#72f4ce",monitorGlowOn:"#72f4ce"};
export const SPAWN={x:720,y:825};
export const EXIT_GATE={x:2844,y:825,w:36,h:150,targetArea:"office"};
export const EXIT_GATE_TRIGGER={x:2790,y:837,w:54,h:126};
export const ROOMS=[
  {id:"lab-1",x:240,y:180,w:960,h:510,doorSide:"bottom",doorX:648,label:"QUVVAT LABORATORIYASI",requires:"wire-ai-lab-1"},
  {id:"lab-2",x:1668,y:180,w:972,h:510,doorSide:"bottom",doorX:2076,label:"TARMOQ LABORATORIYASI",requires:"wire-ai-lab-2"},
  {id:"library",x:240,y:1050,w:960,h:540,doorSide:"top",doorX:648,label:"BILIM KUTUBXONASI"},
  {id:"workshop",x:1668,y:1050,w:972,h:540,doorSide:"top",doorX:2076,label:"TAJRIBA USTAXONASI"}
];
export const INTERIOR_DOORS=ROOMS.map(r=>({
  id:r.id,x:r.doorX,y:r.doorSide==='top'?r.y:r.y+r.h-24,w:144,h:24,requires:r.requires,label:r.label,roomBounds:r
}));
export function buildWalls() {
  const walls=[
    {x:0,y:0,w:WORLD_WIDTH,h:126},{x:0,y:0,w:36,h:WORLD_HEIGHT},
    {x:0,y:1764,w:WORLD_WIDTH,h:36},{x:2844,y:0,w:36,h:825},{x:2844,y:975,w:36,h:825}
  ];
  for(const r of ROOMS) {
    const dy=r.doorSide==="top"?r.y:r.y+r.h-24;
    const solidY=r.doorSide==="top"?r.y+r.h-24:r.y;
    walls.push(
      {x:r.x,y:solidY,w:r.w,h:24,interior:true,side:r.doorSide==='top'?'bottom':'top'},
      {x:r.x,y:dy,w:r.doorX-r.x,h:24,interior:true,side:r.doorSide},
      {x:r.doorX+144,y:dy,w:r.x+r.w-r.doorX-144,h:24,interior:true,side:r.doorSide},
      {x:r.x,y:r.y,w:24,h:r.h,interior:true,side:'left'},
      {x:r.x+r.w-24,y:r.y,w:24,h:r.h,interior:true,side:'right'}
    );
  }
  return walls;
}
export function buildDoorFrames(){return [];}
export function buildFurniture() {
  const blocking=[],interactables=[],decor=[];
  AI_QUESTIONS.forEach((task,i)=>{
    const lab=i<4?ROOMS[0]:ROOMS[1],index=i%4;
    const x=i<4?lab.x+180+(index%2)*420:lab.x+168+index*174,y=i<4?lab.y+156+Math.floor(index/2)*192:lab.y+282;
    blocking.push({type:"ai-desk",x,y,w:97.2,h:43.2,scale:.6,finish:i<4?'wood':'metal',taskId:task.id,number:i+1});
    blocking.push({type:"ai-chair",x:x+30,y:y+63,w:31.5,h:27,scale:.75});
    if(i<4)blocking.push({type:'ai-plant',x:x+144,y:y+12,w:42,h:36});
    interactables.push({type:"computer",id:task.id,x:x+24,y:y+30,w:48,h:18,interactRadius:76,requires:lab.requires,label:task.title});
  });
  for(const [index,r] of ROOMS.slice(0,2).entries()){
    const x=r.doorX+180,y=744;
    blocking.push({type:"ai-wire-panel",x,y,w:54,h:54,taskId:"wire-ai-lab-"+(index+1)});
    interactables.push({type:"activity",id:"wire-ai-lab-"+(index+1),x,y,w:54,h:54,interactRadius:88,label:"Simlarni ulash"});
    blocking.push({type:"ai-server",x:r.x+54,y:r.y+108,w:72,h:120});
    blocking.push({type:index===0?"ai-shelf":"ai-toolrack",x:r.x+360,y:r.y+84,w:240,h:48});
  }
  const objects=[
    {type:"ai-book",x:666,y:1380,w:48,h:30,id:"discovery-ai-book",label:"Kitobni tekshirish"},
    {type:"ai-poster",x:1020,y:1140,w:54,h:60,id:"discovery-ai-poster",label:"Posterni o'qish"},
    {type:"ai-crate",x:1848,y:1224,w:54,h:48,id:"discovery-ai-crate",label:"Qutini ochish"},
    {type:"ai-hologram",x:2448,y:1320,w:54,h:54,id:"discovery-ai-hologram",label:"Hologramma bilan suhbat"}
  ];
  for(const item of objects){
    blocking.push({...item,taskId:item.id});
    interactables.push({...item,type:"activity",interactRadius:item.type==="ai-book"?125:82});
  }
  for(const r of ROOMS.slice(2)){
    blocking.push(
      {type:r.id==="library"?"ai-shelf":"ai-toolrack",x:r.x+108,y:r.y+72,w:240,h:48},
      {type:r.id==="library"?"ai-shelf":"ai-locker",x:r.x+612,y:r.y+72,w:240,h:48},
      {type:"ai-sofa",x:r.x+108,y:r.y+354,w:144,h:72},
      {type:r.id==="library"?"ai-sofa":"ai-console",x:r.x+612,y:r.y+354,w:144,h:72},
      {type:r.id==="library"?"ai-reading-table":"ai-coffee",x:r.x+408,y:r.y+270,w:84,h:48},
      {type:"ai-plant",x:r.x+816,y:r.y+420,w:42,h:36}
    );
    for(let i=0;i<2;i++)blocking.push({type:"ai-chair",x:r.id==='library'&&i===0?r.x+440:r.x+336+i*216,y:r.id==='library'&&i===0?r.y+372:r.y+438,w:31.5,h:27,scale:.75});
  }
  for(const x of [84,2724]){
    for(const y of [270,510,1200,1470]) blocking.push({type:"ai-server",x,y,w:72,h:120});
    blocking.push({type:"ai-bin",x:x+12,y:954,w:36,h:42});
  }
  for(const x of [360,990,1620,2250]){
    blocking.push({type:"ai-sofa",x,y:1656,w:144,h:72});
    blocking.push({type:"ai-plant",x:x+204,y:1680,w:42,h:36});
  }
  blocking.push({type:"ai-coffee",x:1356,y:1206,w:84,h:48},{type:"ai-sofa",x:1326,y:1362,w:144,h:72});
  return {blocking,interactables,decor};
}
