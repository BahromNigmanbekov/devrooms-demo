import { ROOMS, EXIT_GATE } from "../../maps/AIMap.js";

// A dedicated pixel-art pass. World/collision positions stay in the existing engine.
// Every solid prop and robot is sorted by its ground footprint, so tall art can overlap naturally.
export class AIRoomRenderer {
  constructor(ctx) { this.ctx = ctx; }
  rect(x, y, w, h, color) {
    this.ctx.fillStyle = color;
    this.ctx.fillRect(Math.round(x / 3) * 3, Math.round(y / 3) * 3, w, h);
  }
  text(value, x, y, color = "#c4f9e6", size = 16, align = "left") {
    const c = this.ctx;
    c.fillStyle = color;
    c.font = `bold ${size}px "Courier New", monospace`;
    c.textAlign = align;
    c.textBaseline = "middle";
    c.fillText(value, Math.round(x), Math.round(y));
  }
  glow() {} // Matte room lighting: no bloom.
  drawStatic(width,height) {
    if(!this.staticCanvas) {
      this.staticCanvas=document.createElement("canvas");
      this.staticCanvas.width=width;this.staticCanvas.height=height;
      const original=this.ctx;this.ctx=this.staticCanvas.getContext("2d");
      this.floor(width,height);this.walls(width,height);
      this.sign(width/2-267,18,534,78,"ChatGPT","EXPLORE / CONNECT / LEARN");
      this.sign(54,30,264,57,"THINK / ASK / LEARN","");
      this.sign(width-330,30,276,57,"HELLO, HUMAN!","");
      for(const room of ROOMS){
        this.rect(room.x+48,room.y+66,room.w-96,room.h-114,"rgba(7,25,33,.15)");
        this.text(room.label,room.x+room.w/2,room.y+room.h-105,"#86b9b0",18,"center");
        this.rect(room.x+60,room.y+room.h-60,room.w-120,3,"#365f60");
      }
      this.rect(552,750,336,144,"#14353b");
      this.rect(555,753,330,3,"#4a8279");this.rect(555,891,330,3,"#4a8279");
      this.text("XONANI KASHF ETING",720,765,"#a0e9cd",18,"center");
      this.text("SIM / KITOB / TAJRIBA",720,867,"#7fbbb2",13,"center");
      for(let x=1296;x<width-90;x+=96){
        this.rect(x,897,27,3,"#467f79");this.rect(x,912,27,3,"#234f51");
      }
      this.text("OFIS >>>",width-330,894,"#94dabf",18,"center");
      this.ctx=original;
    }
    this.ctx.imageSmoothingEnabled=false;this.ctx.drawImage(this.staticCanvas,0,0);
  }
  floor(w,h) {
    this.rect(0,0,w,h,"#11252c");
    for (let y=126;y<h-36;y+=48) for(let x=36;x<w-36;x+=48) {
      const n=(x/48+y/48)|0;
      const color=n%2 ? "#20474a" : "#1a3b40";
      this.rect(x,y,48,48,color);
      this.rect(x,y,48,3,n%2 ? "#285154" : "#24464b");
      this.rect(x+45,y,3,48,"#153237");
      const seed=(x*17+y*31)%97;
      this.rect(x+9+(seed%9)*3,y+12,3,3,n%2 ? "#2b5050" : "#24464a");
      if(seed%3===0) this.rect(x+12,y+33,15,3,"#17393d");
    }
    this.glow(w/2,210,420,"#40e8c4",0.11);
    for (let x=360; x<w-120; x+=630) {
      this.glow(x+81,540,240,"#348f86",0.07);
      this.glow(x+81,1164,240,"#348f86",0.07);
    }
  }
  bricks(x,y,w,h) {
    this.rect(x,y,w,h,"#101f2a");
    for(let row=0;row<Math.ceil(h/18);row++) {
      for(let col=-1;col<Math.ceil(w/48)+1;col++) {
        const bx=x+col*48+(row%2)*24;
        const left=Math.max(x,bx), right=Math.min(x+w,bx+45);
        if(right<=left) continue;
        this.rect(left,y+row*18,right-left,15,["#253d46","#29424b","#213942"][(row+col+6)%3]);
        this.rect(left,y+row*18,right-left,3,"#334c55");
        if((row+col)%4===0) this.rect(left+6,y+row*18+9,9,3,"#1b303a");
      }
    }
  }
  walls(w,h) {
    this.bricks(0,0,w,126);
    this.rect(0,120,w,6,"#0a1923");
    this.rect(36,126,w-72,6,"#3b6262");
    this.rect(36,132,w-72,18,"#102d33");
    this.bricks(0,126,36,h-126);
    this.rect(30,126,6,h-126,"#486669");
    const gateBottom = EXIT_GATE.y + EXIT_GATE.h;
    this.bricks(w-36,126,36,EXIT_GATE.y-126);
    this.bricks(w-36,gateBottom,36,h-gateBottom);
    this.rect(w-36,126,6,EXIT_GATE.y-126,"#486669");
    this.rect(w-36,gateBottom,6,h-gateBottom,"#486669");
    this.rect(36,h-36,w-72,36,"#162a34");
    this.rect(36,h-36,w-72,6,"#4e696c");
    this.rect(0,0,w,6,"#527077");
    this.rect(0,6,w,3,"#20353f");
  }
  sign(x,y,w,h,title,subtitle) {
    this.rect(x-3,y-3,w+6,h+6,"#101820");
    this.rect(x,y,w,h,"#355358");
    this.rect(x+3,y+3,w-6,h-6,"#11282e");
    this.glow(x+w/2,y+h/2,w*.55,"#72f4ce",.14);
    this.text(title,x+w/2,y+(subtitle?28:h/2),"#9bffe1",subtitle?36:16,"center");
    if(subtitle) this.text(subtitle,x+w/2,y+60,"#6ab8b2",14,"center");
    this.rect(x+9,y+h-6,w-18,3,"#4bc9b1");
  }
  shadow(x,y,w,h) {
    this.rect(x+6,y+h-3,w,12,"rgba(3,12,20,0.38)");
    this.rect(x+12,y+h+9,w-12,6,"rgba(3,12,20,0.18)");
  }
  desk(f,active,solved) {
    const {x,y,w,h}=f;
    this.shadow(x,y,w,h);
    this.rect(x+12,y+51,12,48,"#162c32"); this.rect(x+w-24,y+51,12,48,"#162c32");
    this.rect(x,y,w,h,"#152b33");
    this.rect(x,y,w,54,f.finish==="wood"?"#705742":"#436268");
    this.rect(x+3,y+3,w-6,45,f.finish==="wood"?"#9a7c59":"#638084");
    this.rect(x+6,y+6,w-12,3,"#88a3a3");
    for(let i=0;i<4;i++) this.rect(x+9,y+15+i*6,w-18,3,"rgba(36,69,73,0.15)");
    this.rect(x+3,y+51,w-6,9,"#304e56");
    this.rect(x+6,y+63,w-12,3,"#609591");
    // CRT silhouette, bezel, screen, scan lines and stand.
    this.rect(x+63,y+15,36,9,"#253a47");
    this.rect(x+69,y-3,24,18,"#37515f");
    this.rect(x+36,y-66,90,66,"#101e2c");
    this.rect(x+39,y-69,84,63,"#687d89");
    this.rect(x+42,y-66,78,54,"#91a3a9");
    this.rect(x+45,y-63,72,48,"#263d4b");
    const on=active||solved;
    this.rect(x+48,y-60,66,42,on ? (solved?"#16504b":"#175971") : "#16343f");
    if(on) {
      this.glow(x+81,y-33,78,solved?"#66f5bc":"#6dcfff",.16);
      this.rect(x+54,y-54,33,3,"#a5fff0");
      this.rect(x+54,y-45,48,3,"#4fd4bc");
      this.rect(x+54,y-36,36,3,"#43a99f");
      this.text(solved?"OK":"AI",x+81,y-24,solved?"#b0ffe2":"#c6f5ff",16,"center");
    } else {
      this.text("AI",x+81,y-36,"#3b747c",16,"center");
    }
    for(let i=0;i<6;i++) this.rect(x+48,y-60+i*6,66,1,"rgba(7,22,33,0.2)");
    this.rect(x+102,y-6,9,3,solved?"#6bffba":"#62b8c0");
    // Keyboard.
    this.rect(x+36,y+27,84,21,"#233e4c");
    this.rect(x+39,y+27,78,15,"#77959a");
    for(let r=0;r<2;r++) for(let k=0;k<11;k++) this.rect(x+42+k*6,y+30+r*6,3,3,"#c2d5cd");
    this.rect(x+60,y+42,36,3,"#c2d5cd");
    this.rect(x+129,y+27,12,18,"#aac8c1");
    this.rect(x+132,y+27,3,6,"#568d8a");
    this.rect(x+6,y+51,24,15,solved?"#20745a":"#273f4c");
    this.text(String(f.number).padStart(2,"0"),x+18,y+59,solved?"#b0ffd9":"#a0bfbd",12,"center");
    if(active) { this.rect(x-3,y-3,3,72,"#72f4ce"); this.rect(x,y+69,w,3,"#72f4ce"); }
  }
  chair(f) {
    const {x,y}=f;
    this.shadow(x,y,42,36);
    this.rect(x+18,y+24,6,21,"#152530");
    this.rect(x+3,y+42,36,6,"#1b2c3a");
    this.rect(x,y,42,30,"#152b3a");
    this.rect(x+3,y,36,24,"#486278");
    this.rect(x+6,y+3,30,6,"#68879c");
    this.rect(x+3,y+27,36,9,"#294758");
    this.rect(x-6,y+9,6,18,"#233748");
    this.rect(x+42,y+9,6,18,"#233748");
  }
  plant(f) {
    const {x,y}=f;
    this.shadow(x,y,42,36);
    this.rect(x+6,y,30,36,"#56473d"); this.rect(x+3,y,36,9,"#947263");
    this.rect(x+9,y+9,6,21,"#ad8970");
    this.rect(x+18,y-48,6,57,"#288b64");
    [[-3,-24,12,30],[9,-48,9,36],[27,-39,12,27],[33,-21,12,18],[0,-9,18,15],[18,-63,9,30]].forEach(([dx,dy,w,h],i)=>{
      this.rect(x+dx,y+dy,w,h,i%2?"#449b68":"#246b53");
      this.rect(x+dx,y+dy,3,h,"#66bd7a");
    });
  }
  server(f) {
    const {x,y,w,h}=f;
    this.shadow(x,y,w,h);
    this.rect(x,y-69,w,h+69,"#101f2b");
    this.rect(x+3,y-66,w-6,h+60,"#3d535f");
    this.rect(x+9,y-60,w-18,h+45,"#182d39");
    for(let i=0;i<6;i++){
      this.rect(x+12,y-54+i*24,w-24,18,"#294452");
      this.rect(x+18,y-48+i*24,18,3,"#527282");
      this.rect(x+w-24,y-48+i*24,6,6,i%2?"#57e4b3":"#5dbff0");
    }
    this.text("GPT",x+w/2,y+h-3,"#99c7c3",12,"center");
  }
  shelf(f) {
    const {x,y,w,h}=f;
    this.shadow(x,y,w,h);
    this.rect(x,y-45,w,h+45,"#182e39");
    this.rect(x+3,y-42,w-6,9,"#71878a");
    this.rect(x+6,y-33,w-12,60,"#304b53");
    const colors=["#69ad99","#577b99","#b99a6a","#97799c","#71a5ac"];
    for(let i=0;i<Math.floor((w-24)/18);i++) {
      const height=24+(i%3)*6;
      this.rect(x+12+i*18,y+21-height,12,height,colors[i%colors.length]);
      this.rect(x+15+i*18,y+24-height,3,height-6,"rgba(224,241,219,.18)");
      this.rect(x+12+i*18,y+9,12,3,"#30434a");
    }
    this.rect(x+3,y+24,w-6,9,"#71878a");
    this.rect(x+6,y+36,w-12,9,"#253b43");
  }
  sofa(f) {
    const {x,y,w,h}=f; this.shadow(x,y,w,h);
    this.rect(x+9,y+h-3,9,12,"#132633"); this.rect(x+w-18,y+h-3,9,12,"#132633");
    this.rect(x,y-24,w,h+24,"#142f42");
    this.rect(x+6,y-21,w-12,36,"#405f7a");
    this.rect(x+9,y-18,w-18,6,"#6b87a0");
    this.rect(x+9,y+15,w-18,36,"#557694");
    this.rect(x+w/2-3,y+15,6,36,"#2e5068");
    this.rect(x-6,y,15,60,"#2d4c65"); this.rect(x+w-9,y,15,60,"#2d4c65");
    this.rect(x+9,y+54,w-18,9,"#263f53");
  }
  scaledProp(f,method,...args) {
    const s=f.scale||1,c=this.ctx;
    c.save();c.translate(f.x,f.y);c.scale(s,s);
    this[method]({...f,x:0,y:0,w:f.w/s,h:f.h/s},...args);c.restore();
  }
  interiorWall(w) {
    if(w.w>w.h) {
      this.rect(w.x+6,w.y+w.h,w.w,12,"rgba(0,12,18,.25)");
      this.bricks(w.x,w.y-36,w.w,w.h+36);
      this.rect(w.x,w.side==="bottom"?w.y-36:w.y+w.h-6,w.w,6,"#132d34");
    } else {
      this.bricks(w.x,w.y-36,w.w,w.h+36);
      this.rect(w.side==="right"?w.x:w.x+w.w-6,w.y-36,6,w.h+36,"#152c35");
    }
  }
  interiorTrim(w) {
    const color="#678b86";
    if(w.side==="bottom")this.rect(w.x,w.y+w.h-6,w.w,6,color);
    else if(w.side==="top")this.rect(w.x,w.y-36,w.w,6,color);
    else this.rect(w.side==="right"?w.x+w.w-6:w.x,w.y-36,6,w.h+36,color);
  }
  interiorDoor(door,locked) {
    const {x,y,w,h}=door;
    this.rect(x,y,w,h,locked?"#3e4b54":"#244c46");
    this.rect(x,y,w,3,locked?"#e4b075":"#86f1c3");
    if(locked) {
      this.rect(x,y-30,w,30,"#253b44");
      for(let i=0;i<w;i+=18)this.rect(x+i+3,y-27,9,24,"#61716e");
      this.text("SIMLARNI ULANG",x+w/2,y-48,"#dfb781",12,"center");
    } else this.text("OCHIQ",x+w/2,y+12,"#98e6c3",12,"center");
  }
  marker(f,active,solved) {
    const x=f.x+f.w/2,y=f.y-27;
    this.rect(x-9,y-9,18,18,solved?"#1b5948":"#224652");
    this.text(solved?"✓":"?",x,y,solved?"#8df1c0":active?"#f7e9ab":"#9ddbc6",15,"center");
  }
  accessory(f,solved) {
    const {x,y,w,h}=f;
    this.shadow(x,y,w,h);
    if(f.type==="ai-wire-panel"){
      this.rect(x,y-18,w,h+18,"#152a34");this.rect(x+3,y-15,w-6,h+12,"#526b70");
      this.rect(x+9,y-9,w-18,h,"#1a3740");
      ["#f47c83","#76bdff","#85e3ab","#f3d782"].forEach((col,i)=>{
        this.rect(x+12,y+i*9,12,3,col);this.rect(x+33,y+i*9,6,3,col);
      });
      this.rect(x+12,y+39,30,6,solved?"#75f1b4":"#c29461");
    } else if(f.type==="ai-book") {
      this.rect(x,y,w,h,"#393040");this.rect(x+3,y-6,w-6,h,"#5d8191");
      this.rect(x+9,y,w-18,h-12,"#d3cfac");this.rect(x+w/2-3,y,3,h-12,"#647171");
      this.rect(x+12,y+6,9,3,"#748d82");this.rect(x+30,y+6,9,3,"#748d82");
    } else if(f.type==="ai-poster") {
      this.rect(x,y-12,w,h+12,"#2b4853");this.rect(x+6,y-6,w-12,h,"#b5c8b3");
      this.text("ASK",x+w/2,y+9,"#23464c",12,"center");
      this.text("THINK",x+w/2,y+27,"#23464c",12,"center");
      this.text("CHECK",x+w/2,y+45,"#23464c",12,"center");
    } else if(f.type==="ai-crate"){
      this.rect(x,y-18,w,h+18,"#4b423a");this.rect(x+3,y-15,w-6,15,"#9a8060");
      this.rect(x+6,y,w-12,h-6,"#756247");
      this.rect(x+w/2-3,y-15,6,h+12,"#3c5556");this.text("DATA",x+w/2,y+18,"#ddd2a3",12,"center");
    } else if(f.type==="ai-hologram"){
      this.rect(x,y+24,w,30,"#294452");this.rect(x+6,y+21,w-12,6,"#73d9c2");
      this.glow(x+w/2,y,78,"#79edce",.18);
      for(let i=0;i<6;i++)this.rect(x+9,y-33+i*9,w-18,3,"#57bdad");
      this.text("AI",x+w/2,y-12,"#b6ffe8",15,"center");
    } else if(f.type==="ai-coffee"){
      this.rect(x+6,y+6,w-12,h,"#26434b");this.rect(x,y,w,h-12,"#647d78");
      this.rect(x+12,y+9,15,15,"#d4d7bb");this.rect(x+15,y+9,9,6,"#67473c");
      this.rect(x+39,y+9,24,15,"#758eab");this.rect(x+42,y+12,18,3,"#c9d6c0");
    } else if(f.type==="ai-toolrack"){
      this.rect(x,y-42,w,h+42,"#394952");this.rect(x+6,y-36,w-12,h+30,"#66736d");
      for(let i=0;i<6;i++){this.rect(x+18+i*36,y-24,6,42,"#b5b49a");this.rect(x+12+i*36,y-24,18,9,i%2?"#8e6d4b":"#536c7e");}
    } else if(f.type==="ai-locker"){
      this.rect(x,y-78,w,h+78,"#384b52");
      for(let i=0;i<4;i++){this.rect(x+6+i*58,y-72,52,h+66,"#79837b");this.rect(x+42+i*58,y-18,6,18,"#273f43");for(let j=0;j<3;j++)this.rect(x+18+i*58,y-60+j*9,24,3,"#4a5b60");}
    } else if(f.type==="ai-console"){
      this.rect(x,y-30,w,h+30,"#384858");this.rect(x+9,y-24,w-18,42,"#758895");this.rect(x+15,y-18,w-30,30,"#263f4b");
      for(let i=0;i<4;i++){this.rect(x+18+i*27,y-12,18,3,"#98ad9b");this.rect(x+18+i*27,y+24,12,12,i%2?"#9c8465":"#708c9e");}
    } else if(f.type==="ai-reading-table"){
      this.rect(x+9,y+12,9,h,"#423c35");this.rect(x+w-18,y+12,9,h,"#423c35");
      this.rect(x,y,w,h-6,"#a08460");this.rect(x+6,y+6,w-12,h-18,"#b89c71");
    } else if(f.type==="ai-bin"){
      this.rect(x+3,y,w-6,h,"#375559");this.rect(x,y,w,6,"#7a9790");
      for(let i=0;i<3;i++)this.rect(x+6+i*9,y+9,3,h-15,"#253e46");
    }
  }
  gate(gate,locked,progress) {
    const {x,y,h}=gate;
    this.rect(x-12,y-12,48,h+24,"#101f2c");
    this.rect(x-9,y-9,42,6,"#688884"); this.rect(x-9,y+h+3,42,6,"#688884");
    this.rect(x-6,y,6,h,locked?"#bc8e67":"#72f4ce");
    this.rect(x,y,30,h,"#0c2730");
    for(let i=0;i<5;i++) this.rect(x+3,y+12+i*27,24,3,locked?"#554941":"#4acaaa");
    this.sign(x-141,y-66,153,42,locked ? `${progress.completed}/${progress.total} VAZIFA` : "OFIS OCHILDI","");
    if(!locked) this.glow(x-12,y+h/2,120,"#5de6c0",.2);
    this.text(">",x-36,y+h/2,locked?"#957d6c":"#8dffe0",30,"center");
  }
  render(area,props,players,activeId,solvedIds,gateLocked,progress,drawPlayer,interiorWalls=[],doors=[],lockedDoors=[],drawDoorPanel=null) {
    const c=this.ctx; c.save(); c.imageSmoothingEnabled=false;
    this.drawStatic(area.WORLD_WIDTH,area.WORLD_HEIGHT);
    const solved=new Set(solvedIds);
    this.gate(area.exitGate,gateLocked,progress);
    const entries=[
      ...props.map(f=>({y:f.y+f.h,draw:()=>{
        if(f.type==="ai-desk")this.scaledProp(f,"desk",activeId===f.taskId,solved.has(f.taskId));
        else if(f.type==="ai-chair")this.scaledProp(f,"chair");
        else if(f.type==="ai-plant")this.plant(f);
        else if(f.type==="ai-server")this.server(f);
        else if(f.type==="ai-sofa")this.sofa(f);
        else if(f.type==="ai-shelf")this.shelf(f);
        else this.accessory(f,solved.has(f.taskId));
        if(f.taskId && f.type!=="ai-desk") this.marker(f,activeId===f.taskId,solved.has(f.taskId));
      }})),
      ...interiorWalls.map(w=>({y:w.y+w.h,draw:()=>this.interiorWall(w)})),
      ...doors.map(door=>({y:door.y+door.h,draw:()=>drawDoorPanel ? drawDoorPanel(door) : this.interiorDoor(door,lockedDoors.some(d=>d.id===door.id))})),
      ...players.map(p=>({y:p.y+(p.seated?60:12),draw:()=>{
        c.save(); c.imageSmoothingEnabled=true; drawPlayer(p); c.restore();
      }}))
    ].sort((a,b)=>a.y-b.y);
    entries.forEach(entry=>entry.draw());
    // Finish all outer edges together so adjacent wall faces cannot erase corners.
    interiorWalls.forEach(w=>this.interiorTrim(w));
    c.restore();
  }
}
