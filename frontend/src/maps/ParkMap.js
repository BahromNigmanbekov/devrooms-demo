import { COLORS as OFFICE_COLORS } from "./OfficeMap.js";
import { ARCADE_TASKS_BY_ID } from "../../../shared/arcadeActivities.mjs";
export const WORLD_WIDTH=2600,WORLD_HEIGHT=1700;
export const COLORS={...OFFICE_COLORS,
  // Dark pink/purple/magenta/violet, per the retro-arcade redesign — a
  // premium, colorful checkerboard, not the earlier near-black flashlight
  // floor. Fully readable under this area's own (now much softer) ambient
  // darkness, no flashlight required.
  floorA: "#5c2a5e",
  floorB: "#3f1c48",
  wall: "#4a3a5c",
  wallTop: "#6c5488",
  doorFrame: "#ff4fd8", // neon magenta frame — distinct from the office's gold and reads as "mall," not "rusty gate"
  columnBody: "#7a4fd6",
  columnTop: "#a97cff",
  benchWood: "#5c4630",
  benchLeg: "#2c2419",
  fence: "#c9457a",
  neonPink: "#ff5fc7",
  neonCyan: "#4fe0ff",
  neonYellow: "#ffe14f",
  arcadeBody: "#3a2f52",
  arcadeScreenOff: "#241c36",
  clawMachineBody: "#2f4a5c",
  clawMachineGlass: "rgba(180,230,255,0.18)",
  vendingBody: "#37324a",
  vendingGlow: "#4fe0ff",
  ticketBody: "#5c3a52",
  counter: "#8a5fd6",
  counterTop: "#b18fff",
  oldComputerBody: "#454a3f",
  monitor: "#182a1c",
  monitorGlowOff: "#2c4530",
  monitorGlowOn: "#4fe07a",
  posterFrame: "#1a1420",
  posterBody: "#7a3fa0",
  posterAccent: "#ffe14f",
  // Stylized "neon plant" — teal leaves instead of natural green, so it
  // reads as part of this room's palette rather than an office plant.
  plantPot: "#3a1a42",
  plantLeafDark: "#0f6e5e",
  plantLeaf: "#4fe0c8",
};
export const SPAWN={x:220,y:650};
export const NEXT_AREA_GATE=null;
export const RETURN_GATE={x:0,y:580,w:36,h:140,targetArea:"office"};
export const RETURN_GATE_TRIGGER={x:36,y:580,w:50,h:140};
export const ROOMS=[
 {id:"retro",label:"RETRO ZAL",x:420,y:120,w:660,h:400,side:"bottom",at:280,requires:"arcade-lock-retro"},
 {id:"puzzle",label:"MANTIQ ZALI",x:1500,y:180,w:900,h:480,side:"left",at:240,requires:"arcade-lock-puzzle"},
 {id:"sports",label:"ROBOT ARENA",x:300,y:1000,w:1000,h:520,side:"top",at:520,requires:"arcade-lock-sports"},
 {id:"prize",label:"SOVRINLAR ZALI",x:1720,y:1050,w:680,h:430,side:"left",at:170,requires:"arcade-lock-prize"}
];
export const INTERIOR_DOORS=ROOMS.map(r=>({id:r.id,x:r.side==="left"?r.x:r.x+r.at,y:r.side==="top"?r.y:r.side==="bottom"?r.y+r.h-24:r.y+r.at,w:r.side==="left"?24:144,h:r.side==="left"?144:24,requires:r.requires,roomBounds:r}));
export function buildWalls() {
 const walls=[{x:0,y:0,w:2600,h:96,side:"top"},{x:0,y:1664,w:2600,h:36,side:"bottom"},{x:2564,y:0,w:36,h:1700,side:"right"},{x:0,y:0,w:36,h:580,side:"left"},{x:0,y:720,w:36,h:980,side:"left"}];
 for(const r of ROOMS){
  for(const side of ["top","bottom","left","right"]){
   const horizontal=side==="top"||side==="bottom",x=side==="right"?r.x+r.w-24:r.x,y=side==="bottom"?r.y+r.h-24:r.y,len=horizontal?r.w:r.h;
   const push=(offset,length)=>walls.push({x:x+(horizontal?offset:0),y:y+(horizontal?0:offset),w:horizontal?length:24,h:horizontal?24:length,side,interior:true});
   if(side===r.side){push(0,r.at);push(r.at+144,len-r.at-144);}else push(0,len);
  }
 }return walls;
}
export function buildDoorFrames(){return [];}
export function buildFurniture() {
 const blocking=[],interactables=[],decor=[];
 const prop=(type,x,y,w,h,extra={})=>blocking.push({type,x,y,w,h,...extra});
 const activity=(id,x,y,w,h,type="gameCabinet")=>{
 const task=ARCADE_TASKS_BY_ID[id];prop(type,x,y,w,h,{kind:task.kind,label:task.title.split(":")[0],taskId:id});
 interactables.push({id,type:"arcadeActivity",x,y:y+h-16,w,h:16,interactRadius:95,requires:task.requires,label:task.title});
 };
 const panels=[[930,570],[1380,520],[1050,900],[1600,1310]];
 ROOMS.forEach((r,i)=>{
  activity(r.requires,...panels[i],58,46,"puzzleConsole");
  decor.push({type:"areaLabel",x:r.x+r.w/2,y:r.y+r.h-45,label:r.label});
  decor.push({type:"rug",x:r.x+55,y:r.y+65,w:r.w-110,h:r.h-130});
  decor.push({type:"whiteboard",x:r.x+(r.id==="puzzle"||r.id==="prize"?140:230),y:r.y+38,w:150,h:54});
  prop("plant",r.x+45,r.y+45,34,34);
  prop("plant",r.x+r.w-80,r.y+r.h-70,34,34);
 });
 activity("terminal-park-1",540,240,60,82);activity("terminal-park-2",780,240,60,82);
 prop("chair",548,355,36,36);prop("prizeShelf",900,180,100,38);
 prop("shelf",480,170,160,36);prop("sofa",870,370,120,52);prop("table",620,405,90,44);
 activity("terminal-park-3",1650,330,64,78);activity("terminal-park-4",2030,420,80,64,"gameTable");
 prop("shelf",1820,240,180,38);prop("toolCart",2200,300,90,60);prop("chair",2050,515,36,36);
 prop("chair",1670,435,36,36);prop("prizeShelf",2140,540,130,45);
 activity("terminal-park-5",440,1150,76,88);activity("terminal-park-6",870,1190,150,86,"gameTable");
 prop("toolCart",1140,1260,86,58);
 activity("arcade-billiards",620,1300,155,85,"poolTable");prop("bench",1030,1390,130,28);prop("prizeShelf",1030,1070,160,42);
 prop("sofa",400,1380,140,54);prop("shelf",340,1060,180,36);
 activity("terminal-park-7",1850,1160,68,84);activity("terminal-park-8",2130,1280,100,72,"gameTable");
 prop("prizeShelf",2040,1110,230,48);prop("snackCounter",1840,1370,150,52);prop("chair",2160,1380,36,36);
 prop("toolCart",2280,1380,66,54);
 // Welcome lounge, snacks, lockers and workshop details occupy different corners.
 prop("snackCounter",100,250,150,60);prop("watercooler",285,270,42,64);
 prop("sofa",100,390,140,56);prop("table",130,485,80,45);prop("plant",285,430,36,36);
 prop("prizeShelf",1140,130,210,45);prop("toolCart",1170,330,90,56);
 prop("sofa",1160,780,140,56);prop("table",1190,860,80,42);prop("plant",1350,790,34,34);
 prop("snackCounter",1860,790,180,58);prop("watercooler",2090,790,40,64);
 prop("sofa",2180,800,145,56);prop("plant",2420,840,36,36);
 for(const x of [140,1540,2460])for(const y of [100,1550])prop("plant",x,y,36,36);
 for(const [x,y] of [[90,820],[1400,940],[1480,1460],[2250,1550]]){prop("bench",x,y,110,28);decor.push({type:"clock",x:x+30,y:y-52,w:30,h:30});}
 decor.push({type:"whiteboard",x:90,y:100,w:210,h:80},{type:"window",x:2400,y:80,w:100,h:60},{type:"window",x:2000,y:1550,w:170,h:50});

 prop("jukebox",1230,440,64,84);prop("gumball",325,380,38,50);
 prop("dartboard",1160,1150,56,56);prop("trophyCase",910,1425,80,36);
 prop("plant",940,1280,32,32);prop("plant",800,1420,32,32);
 prop("jukebox",2260,410,58,76);prop("gumball",1570,545,36,48);
 prop("dartboard",2220,1190,48,48);
 prop("trophyCase",110,1090,100,44);prop("trophyCase",2250,950,120,40);
 decor.push({type:"poster",x:980,y:305,w:50,h:70,label:"GAME ON"},
  {type:"poster",x:1930,y:250,w:50,h:60,label:"THINK"},
  {type:"poster",x:360,y:1220,w:48,h:70,label:"PLAY"},
  {type:"poster",x:2320,y:1260,w:48,h:68,label:"WIN"});

 return {blocking,interactables,decor};
}
