import { validatePoolAnswer } from "./poolPhysics.mjs";
const memory=(id,title,sequence,requires)=>({id,type:"arcade",theme:"office",kind:"memory",title,sequence,requires,prompt:"Chiroqlar ketma-ketligini eslab qoling, keyin shu tartibda tugmalarni bosing.",explanation:"Ketma-ketlik to'g'ri tiklandi!"});
const maze=(id,title,requires)=>({id,type:"arcade",theme:"office",kind:"maze",title,requires,size:5,walls:id==="terminal-park-5"?[5,7,8,11,13,16,18,21]:id==="terminal-park-8"?[1,6,8,13,16,18,21]:[1,3,6,8,16,18,21],start:0,goal:24,prompt:"Robotni yo'laklar bo'ylab bayroqqa olib boring. Yo'nalish tugmalari yoki klaviatura strelkalaridan foydalaning.",explanation:"Robot manzilga yetdi!"});
export function toggleLights(state,index) {
 const next=[...state],row=Math.floor(index/3),col=index%3;
 for(const [dr,dc] of [[0,0],[-1,0],[1,0],[0,-1],[0,1]]) {
 const r=row+dr,c=col+dc;if(r>=0&&r<3&&c>=0&&c<3)next[r*3+c]=!next[r*3+c];
 }return next;
}
const lights=(id,title,seed,requires)=>({id,type:"arcade",theme:"office",kind:"lights",title,requires,initial:seed.reduce(toggleLights,Array(9).fill(false)),prompt:"Energiya panelini tinchlantiring: barcha yongan kataklarni o'chiring. Tugma o'zi va yonidagi kataklarni almashtiradi.",explanation:"Energiya paneli muvozanatga keldi!"});
const pairs=(id,title,cards,requires)=>({id,type:"arcade",theme:"office",kind:"pairs",title,requires,cards,prompt:"Kartochkalarni ochib, bir xil belgilar juftligini toping. Oltita juftni yig'ing.",explanation:"Barcha juftlar topildi!"});
export const ARCADE_ACTIVITIES=[
 memory("arcade-lock-retro","Retro zal: signal kodini tiklang",[0,2,1,3]),
 lights("arcade-lock-puzzle","Mantiq zali: energiyani muvozanatlang",[0,4,8]),
 maze("arcade-lock-sports","O'yin zali: yetkazib beruvchi robotni olib boring"),
 pairs("arcade-lock-prize","Sovrinlar zali: kalit juftlarini toping",["A","C","B","F","D","E","C","A","E","D","F","B"]),
 memory("terminal-park-1","Ritm ustasi",[1,3,0,2,1],"arcade-lock-retro"),
 memory("terminal-park-2","Kosmik signal",[2,0,3,1,2,3],"arcade-lock-retro"),
 lights("terminal-park-3","Yulduzlarni o'chirish",[1,3,5],"arcade-lock-puzzle"),
 pairs("terminal-park-4","Yashirin belgilar",["E","A","F","B","D","C","B","F","C","E","A","D"],"arcade-lock-puzzle"),
 maze("terminal-park-5","Robot poygasi","arcade-lock-sports"),
 lights("terminal-park-6","Nishonlar ustasi",[0,2,6,8],"arcade-lock-sports"),
 pairs("terminal-park-7","Sovrin ovchisi",["B","D","A","E","C","F","D","C","E","B","F","A"],"arcade-lock-prize"),
 maze("terminal-park-8","Xazina yo'li","arcade-lock-prize"),
 {id:"arcade-billiards",type:"arcade",theme:"office",kind:"billiards",title:"Bilyard: aniq zarba",requires:"arcade-lock-sports",goal:1,
  prompt:"Oq shar bilan rangli sharlarni cho'ntakka tushiring. Stolga bosib nishon oling, zarba kuchini tanlang. 12 zarba ichida kamida 1 shar tushiring; xohlasangiz uchalasini ham yig'ing.",
  explanation:"Aniq zarba! Bilyard vazifasi bajarildi."}
];
export const ARCADE_TASKS_BY_ID=Object.fromEntries(ARCADE_ACTIVITIES.map(t=>[t.id,t]));
export function validateArcadeAnswer(task,answer) {
 if(!Array.isArray(answer)||answer.length>200||!answer.every(Number.isInteger))return false;
 if(task.kind==="billiards")return validatePoolAnswer(task,answer);
 if(task.kind==="memory")return answer.length===task.sequence.length&&answer.every((v,i)=>v===task.sequence[i]);
 if(task.kind==="lights")return answer.length>0&&answer.every(v=>v>=0&&v<9)&&!answer.reduce(toggleLights,task.initial).some(Boolean);
 if(task.kind==="pairs")return answer.length===task.cards.length&&new Set(answer).size===task.cards.length&&answer.every(v=>v>=0&&v<task.cards.length)&&answer.every((v,i)=>i%2||task.cards[v]===task.cards[answer[i+1]]);
 if(task.kind==="maze") {
 let pos=task.start;
 for(const d of answer){if(d<0||d>3)return false;const r=Math.floor(pos/task.size),c=pos%task.size,[dr,dc]=[[-1,0],[0,1],[1,0],[0,-1]][d],nr=r+dr,nc=c+dc,next=nr*task.size+nc;
 if(nr<0||nc<0||nr>=task.size||nc>=task.size||task.walls.includes(next))return false;pos=next;}
 return pos===task.goal;
 }return false;
}
