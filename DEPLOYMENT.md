# Vercel frontend + Render backend

Kompyuter o'chirilganida ham o'yin hosting serverlarida ishlaydi.
Render pullik compute tarifi bo'sh turganda uxlamaydi. Hostingda texnik
uzilishlar yoki restartlar bo'lishi mumkin; mutlaq uzluksizlik kafolati emas.

## 1. Repository

GitHub repositoryga frontend, backend, shared va render.yaml ni yuklang.
Backend frontend/src va shared modullarini import qiladi: uchala papka kerak.
node_modules, dist va .env fayllarini yuklamang.

## 2. Render backend

Render dashboardda New > Blueprint orqali repositoryni ulang.
render.yaml bitta pullik backend instance yaratishga tayyorlangan.
Tarif narxini deploydan oldin tekshiring.
CLIENT_ORIGIN ga Vercel saytining aniq originini kiriting:
https://your-game.vercel.app (oxirida / yo'q).
Vercel domeni hali bo'lmasa, frontendni avval yarating va keyin sozlang.

Qo'lda Web Service yaratilsa:

- Root Directory: bo'sh (repository root).
- Build Command: npm ci --prefix backend
- Start Command: npm start --prefix backend
- Health Check Path: /health
- Environment: NODE_ENV=production, CLIENT_ORIGIN=Vercel origin.
- Compute: paid; instances: 1.

PORT ni Render o'zi beradi. Backend URL + /health ochilganda ok:true
qaytishi kerak. Masalan: https://office-game-backend.onrender.com/health.

## 3. Vercel frontend

Repositoryni import qiling:

- Framework: Vite.
- Root Directory: bo'sh (repository root).
- Install Command: npm ci --prefix frontend
- Build Command: npm run build --prefix frontend
- Output Directory: frontend/dist.
- Environment Variable: VITE_SERVER_URL=Render backend HTTPS URL.

Repository rootdagi vercel.json build sozlamalarini beradi.
Shu tarzda frontend import qiladigan shared fayllari ham buildga kiradi.
URL namunasi: https://office-game-backend.onrender.com (oxirida / yo'q).
Environment o'zgarsa frontendni Redeploy qiling: Vite qiymatni buildga yozadi.
Vercel domeni o'zgarsa Render CLIENT_ORIGIN ni ham yangilang.
Preview domenlari uchun ham alohida mos backend sozlamasi kerak.

## 4. Tekshirish

Vercel saytini ikki brauzerda oching, xona yarating, ikkinchi brauzerdan
qo'shiling va o'yinni boshlang. Harakat hamda umumiy progress sinxronligini
tekshiring. Keyin kompyuterni o'chirib boshqa qurilmadan saytga kiring.

## Xonalar va restart

Hozir xona holati backend RAM xotirasida turadi. Deploy yoki restart faol
xonalarni yo'qotadi; o'yinchilar yangi xona yaratishi kerak.
Shuning uchun hozir faqat bitta backend instance ishlating.
Restartdan keyin davom ettirish uchun doimiy saqlash, barqaror player ID,
qayta ulanish va xona holatini tiklash mexanizmlari kerak.

Render Free 15 daqiqa faollik bo'lmasa uxlaydi; doim tayyor backend talabi
uchun paid compute tanlang.
