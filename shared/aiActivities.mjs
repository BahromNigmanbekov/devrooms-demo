import { AI_QUESTIONS } from "./aiQuestions.mjs";
export const AI_ACTIVITIES = [
  {
    id: "wire-ai-lab-1", type: "wires", theme: "ai", title: "1-laboratoriya: quvvatni ulang",
    prompt: "Chapdagi simni tanlang, keyin o'ngdagi bir xil belgi va rangli kontaktni bosing. To'rtta simni ulang — laboratoriya eshigi ochiladi.",
    left: [{key:"red",label:"Qizil",symbol:"●",color:"#f47c83"},{key:"blue",label:"Ko'k",symbol:"◆",color:"#76bdff"},{key:"green",label:"Yashil",symbol:"▲",color:"#85e3ab"},{key:"yellow",label:"Sariq",symbol:"★",color:"#f3d782"}],
    right: [{key:"green",label:"Yashil",symbol:"▲",color:"#85e3ab"},{key:"red",label:"Qizil",symbol:"●",color:"#f47c83"},{key:"yellow",label:"Sariq",symbol:"★",color:"#f3d782"},{key:"blue",label:"Ko'k",symbol:"◆",color:"#76bdff"}],
    explanation: "Quvvat tiklandi! 1-laboratoriya eshigi butun jamoa uchun ochildi."
  },
  {
    id: "wire-ai-lab-2", type: "wires", theme: "ai", title: "2-laboratoriya: tarmoqni ulang",
    prompt: "Chapdagi simlarni o'ngdagi mos belgili kontaktlarga ulang. Rang va belgi ikkalasi ham yordam beradi.",
    left: [{key:"blue",label:"Ko'k",symbol:"◆",color:"#76bdff"},{key:"yellow",label:"Sariq",symbol:"★",color:"#f3d782"},{key:"red",label:"Qizil",symbol:"●",color:"#f47c83"},{key:"green",label:"Yashil",symbol:"▲",color:"#85e3ab"}],
    right: [{key:"red",label:"Qizil",symbol:"●",color:"#f47c83"},{key:"green",label:"Yashil",symbol:"▲",color:"#85e3ab"},{key:"blue",label:"Ko'k",symbol:"◆",color:"#76bdff"},{key:"yellow",label:"Sariq",symbol:"★",color:"#f3d782"}],
    explanation: "Tarmoq ishlayapti! 2-laboratoriya eshigi butun jamoa uchun ochildi."
  },
  ...AI_QUESTIONS.map((task,i)=>({...task, requires:i<4?"wire-ai-lab-1":"wire-ai-lab-2"})),
  {
    id:"discovery-ai-book", type:"quiz", theme:"ai", title:"Kitob ichidagi sir",
    prompt:"Kitob orasidan kartochka topdingiz: yangi narsani o'rganishda qaysi usul foydali?",
    options:["Faqat javobni ko'chirish","Misolni tushunib, o'zingiz sinab ko'rish","Hech qachon savol bermaslik"],
    answer:1, explanation:"O'qish, tushunish va amalda sinash bilimni mustahkamlaydi."
  },
  {
    id:"discovery-ai-poster", type:"quiz", theme:"ai", title:"Posterdagi ishora",
    prompt:"Posterda: 'Aniq savol — foydali javob'. AI ga topshiriq berayotganda nimani aytish yaxshi?",
    options:["Mavzu va kerakli natijani","Faqat 'nimadir' so'zini","Faqat kompyuter rangini"],
    answer:0, explanation:"Aniq maqsad va misol AI ga nima kerakligini tushunishga yordam beradi."
  },
  {
    id:"discovery-ai-crate", type:"quiz", theme:"ai", title:"Ma'lumotlar qutisi",
    prompt:"Qutida shaxsiy ma'lumot bor. Uni boshqalarga yuborishdan oldin nima qilasiz?",
    options:["Hammasini darhol yuboraman","Parollarni ham qo'shaman","Maxfiy ma'lumotni olib tashlayman"],
    answer:2, explanation:"Shaxsiy ma'lumotni asrash uchun faqat kerakli, maxfiy bo'lmagan qismini ulashing."
  },
  {
    id:"discovery-ai-hologram", type:"quiz", theme:"ai", title:"Hologramma savoli",
    prompt:"Hologramma '2 + 2 = 5' deb aytdi. Siz nima qilasiz?",
    options:["Darhol ishonaman","Tekshiraman: to'g'ri javob 4","Endi hisoblamayman"],
    answer:1, explanation:"AI javobini ham tekshiring. 2 + 2 = 4."
  }
];
export const AI_TASKS_BY_ID = Object.fromEntries(AI_ACTIVITIES.map(task=>[task.id,task]));
export function validateAIAnswer(task,answer) {
  if(!task) return false;
  if(task.type==="quiz") return Number.isInteger(answer)&&answer===task.answer;
  if(task.type!=="wires"||!Array.isArray(answer)||answer.length!==task.left.length) return false;
  return new Set(answer).size===answer.length && task.left.every((pin,i)=>
    Number.isInteger(answer[i]) && task.right[answer[i]]?.key===pin.key
  );
}
