// Shared by the quiz UI and server: answers are validated before team progress changes.
export const AI_QUESTIONS = [
  {
    id: "terminal-ai-1", type: "quiz", theme: "ai", title: "AI bilan tanishuv",
    prompt: "AI (sun'iy intellekt) nima?",
    options: ["Faqat kompyuter o'yini", "Vazifalarni bajarishga yordam beradigan kompyuter tizimi", "Internet kabeli"],
    answer: 1, explanation: "AI — matn, rasm va boshqa ma'lumotlar bilan ishlashga yordam beradigan kompyuter tizimi."
  },
  {
    id: "terminal-ai-2", type: "quiz", theme: "ai", title: "ChatGPT nima qiladi?",
    prompt: "ChatGPT bilan qaysi ishni bajarish mumkin?",
    options: ["Savol berish va matn yozishda yordam olish", "Telefon batareyasini zaryadlash", "Stolni ko'tarish"],
    answer: 0, explanation: "ChatGPT savollarga javob berish, tushuntirish va matn yozishda yordam beradi."
  },
  {
    id: "terminal-ai-3", type: "quiz", theme: "ai", title: "Aniq savol",
    prompt: "Qaysi so'rov tushunarliroq?",
    options: ["Nimadir yoz", "Biror narsa", "Menga o'zbek tilida bahor haqida 3 gap yoz"],
    answer: 2, explanation: "Til, mavzu va uzunlikni aniq aytish foydali javob olishga yordam beradi."
  },
  {
    id: "terminal-ai-4", type: "quiz", theme: "ai", title: "Javobni tekshirish",
    prompt: "AI bergan muhim ma'lumot bilan nima qilish kerak?",
    options: ["Har doim tekshirmasdan ishonish", "Ishonchli manbadan tekshirish", "Faqat rangiga qarash"],
    answer: 1, explanation: "AI ham xato qilishi mumkin. Muhim ma'lumotni ishonchli manbadan tekshiring."
  },
  {
    id: "terminal-ai-5", type: "quiz", theme: "ai", title: "Shaxsiy ma'lumot",
    prompt: "Chatga qaysi ma'lumotni yubormaslik kerak?",
    options: ["Sevimli rang", "Umumiy matematika savoli", "Parol yoki SMS tasdiqlash kodi"],
    answer: 2, explanation: "Parol va tasdiqlash kodlari maxfiy. Ularni boshqalarga yubormang."
  },
  {
    id: "terminal-ai-6", type: "quiz", theme: "ai", title: "Prompt",
    prompt: "AI bilan suhbatda 'prompt' nima?",
    options: ["AI ga yozilgan savol yoki ko'rsatma", "Kompyuterning ekrani", "Robotning oyog'i"],
    answer: 0, explanation: "Prompt — AI ga nima qilish kerakligini bildiradigan savol yoki ko'rsatma."
  },
  {
    id: "terminal-ai-7", type: "quiz", theme: "ai", title: "Yaxshiroq tushuntirish",
    prompt: "Javob qiyin bo'lsa, qanday so'rash mumkin?",
    options: ["Endi hech narsa so'ramaslik", "Oddiyroq qilib, bir misol bilan tushuntir", "Faqat uzunroq yoz"],
    answer: 1, explanation: "Oddiy tushuntirish va misol so'rash mavzuni tushunishni osonlashtiradi."
  },
  {
    id: "terminal-ai-8", type: "quiz", theme: "ai", title: "AI yordamchi",
    prompt: "AI yordamidan qanday foydalanish foydali?",
    options: ["O'zimiz o'ylashni butunlay to'xtatish", "Har qanday javobni ko'r-ko'rona ko'chirish", "Yordam olish, tushunish va o'zimiz tekshirish"],
    answer: 2, explanation: "AI yordamchi. O'rganish, o'ylash va yakuniy tekshirish sizning qo'lingizda."
  }
];
export const AI_TASKS_BY_ID = Object.fromEntries(AI_QUESTIONS.map(task => [task.id, task]));
