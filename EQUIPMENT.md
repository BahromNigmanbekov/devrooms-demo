# Inventory va aslahalar

Inventory bosh menyuda, lobbida va o‘yin ichida ochiladi. Bosh kiyimlar,
ryukzaklar, aslahalar va ranglar bo‘limlarida 30 tadan variant bor.
Jihozlar bepul, tanlov brauzerda saqlanadi va xonadagi boshqa o‘yinchilarga
ham ko‘rinadi. Bir paytda bitta bosh kiyim, bitta orqa jihoz va bitta
aslaha taqiladi. `Original`, `No backpack`, `Unarmed` ularni yechadi.

## Foydalanish

Aslahani tanlang, WASD yoki strelkalar bilan kerakli tomonga qarang,
so‘ng **Q**, **ISHLATISH** yoki sichqonchaning chap tugmasini bosing.
Sichqonchani sahna ustida yuritish nishonni boshqaradi; chap tugmani bosib
turish qurolning kutish vaqtiga qarab takroriy otadi. Sichqoncha koordinatalari
kamera va masshtab orqali o‘yin dunyosidagi yo‘nalishga aylantiriladi. Q tugmasini ushlab
turish qurolning qayta ishlatish oralig‘iga qarab takroriy harakat qiladi.
Modal ochiq bo‘lsa, o‘tirgan yoki quvvati tugagan robot aslaha ishlatmaydi.
Qayta ishlatishgacha qolgan vaqt panelda ko‘rsatiladi; aslaha almashtirish
kutish vaqtini bekor qilmaydi.

| Aslaha | Vazifasi |
| --- | --- |
| Nur qilichlari, oddiy qilichlar, bolta, bolg‘a, nayza | Qarab turgan yo‘nalishda yaqin zarba |
| Avtomatlar va blasterlar | Masofali energiya o‘qi; devor va yopiq eshikdan o‘tmaydi |
| Sun / Moon / Storm skipetrlari | Atrofdagi dronlarga energiya to‘lqini |
| Life / Rose skipetrlari | Yaqindagi tirik jamoa a’zolariga +15 quvvat, maksimum 100 |
| Aegis skipetri | 6 soniya ichidagi birinchi xato topshiriq jarimasini yutadigan himoya |
| Oracle / Prism skipetrlari | Yaqindagi topshiriq obyektlarini 6 soniya yoritadi |

AI laboratoriyasining sharqiy markaziy yo‘lagida uchta mashq droni bor.
Har birining quvvati 100; yengilgan dron 8 soniyada qaytadi va o‘yinchiga
10 mashq ochkosi beradi. Bu ochkolar topshiriqlar bajarilishini almashtirmaydi.
Zarbalar dronlarga ta’sir qiladi; jamoa a’zolari yordamchi skipetrlardan
foydalanadi. Qurol kuchi, masofasi va kutish vaqti turiga qarab farq qiladi.

Katalog `shared/equipment.mjs` faylida. Server jihoz IDlarini, zarba
masofasini, yo‘nalishni, to‘siqlarni va qayta ishlatish vaqtini tekshiradi.
Server tekshiruvlari: `cd backend` va `npm test`.

## Quvlashmachoq

O‘yin boshlanganidan so‘ng xona admini o‘ngdagi **QUVLASHMACHOQ → BOSHLASH**
tugmasini bosadi. Kamida ikkita quvvati bor robot kerak. Server tasodifiy
Ovchi tanlaydi va 3 soniya tayyorlanish vaqti beradi. AI Lab, Ofis, Arcade
va ularning ichki eshiklari vaqtincha ochiladi; topshiriqlar holati saqlanadi.

Ovchining ko‘rinishida maxsus zirh, plash va yorqin belgi paydo bo‘ladi,
ismi esa **Ovchi** bo‘ladi. Bu rol inventory buyumi emas. Bir hududdagi
boshqa robotga tegilganda rol o‘sha robotga o‘tadi. Server masofa va devorlarni
tekshiradi. Yangi Ovchiga 1,5 soniya tayyorlanish, oldingi Ovchiga 3 soniya
qayta tutib olinmaslik vaqti beriladi. Asl nickname, rang va tanlangan
jihozlar almashtirilmaydi: rol ketishi bilan ular ko‘rinishga qaytadi.

Admin **TO‘XTATISH** orqali rejimni tugatadi. Topshiriqlar asosida ochilgan
xonalar qayta amal qiladi; hali ochilmagan hududda qolgan robot AI Labga
qaytariladi. Ovchi chiqib ketsa, server yangi Ovchi tanlaydi. Ikkitadan kam
o‘yinchi qolsa, rejim tugaydi. Admin chiqsa, keyingi o‘yinchi admin bo‘ladi.
