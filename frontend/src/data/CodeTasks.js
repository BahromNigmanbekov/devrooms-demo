/**
 * Each terminal in the office gives the player a tiny if/else coding
 * exercise. The player writes a real `check(...)` function in the editor
 * modal; running it executes the function against a few hidden test cases
 * and reports pass/fail — like a mini LeetCode/VS Code experience.
 */

export const DEFAULT_TASK = {
  title: "Yosh tekshirish",
  prompt:
    "check(age) funksiyasini yozing: agar age 18 dan katta yoki teng bo'lsa \"Katta\" so'zini, aks holda \"Kichkina\" so'zini qaytaring.",
  starterCode: `function check(age) {\n  // shu yerga if / else yozing\n\n}\n`,
  tests: [
    { input: 5, expected: "Kichkina" },
    { input: 17, expected: "Kichkina" },
    { input: 18, expected: "Katta" },
    { input: 42, expected: "Katta" },
  ],
};

export const TASKS_BY_ID = {
  "terminal-openoffice-1": {
    title: "Yosh tekshirish",
    prompt:
      "check(age) funksiyasini yozing: agar age 18 dan katta yoki teng bo'lsa \"Katta\" so'zini, aks holda \"Kichkina\" so'zini qaytaring.",
    starterCode: `function check(age) {\n  // shu yerga if / else yozing\n\n}\n`,
    tests: [
      { input: 5, expected: "Kichkina" },
      { input: 17, expected: "Kichkina" },
      { input: 18, expected: "Katta" },
      { input: 42, expected: "Katta" },
    ],
  },
  "terminal-openoffice-2": {
    title: "Musbat yoki manfiy",
    prompt:
      "check(n) funksiyasini yozing: n 0 dan katta bo'lsa \"Musbat\", n 0 ga teng bo'lsa \"Nol\", aks holda \"Manfiy\" so'zini qaytaring.",
    starterCode: `function check(n) {\n  // shu yerga if / else yozing\n\n}\n`,
    tests: [
      { input: 8, expected: "Musbat" },
      { input: -3, expected: "Manfiy" },
      { input: 0, expected: "Nol" },
      { input: -1, expected: "Manfiy" },
    ],
  },
  "terminal-openoffice-3": {
    title: "Parolni tekshirish",
    prompt:
      "check(length) funksiyasini yozing: parol uzunligi (length) 8 dan katta yoki teng bo'lsa \"Kuchli\", aks holda \"Zaif\" so'zini qaytaring.",
    starterCode: `function check(length) {\n  // shu yerga if / else yozing\n\n}\n`,
    tests: [
      { input: 4, expected: "Zaif" },
      { input: 8, expected: "Kuchli" },
      { input: 12, expected: "Kuchli" },
      { input: 7, expected: "Zaif" },
    ],
  },
  "terminal-openoffice-4": {
    title: "Uch karrali son",
    prompt:
      "check(n) funksiyasini yozing: n soni 3 ga qoldiqsiz bo'linsa \"Karrali\", aks holda \"Karrali emas\" so'zini qaytaring.",
    starterCode: `function check(n) {\n  // shu yerga if / else yozing\n\n}\n`,
    tests: [
      { input: 9, expected: "Karrali" },
      { input: 10, expected: "Karrali emas" },
      { input: 0, expected: "Karrali" },
      { input: 14, expected: "Karrali emas" },
    ],
  },
  "terminal-openoffice-5": {
    title: "Harfni tekshirish",
    prompt:
      "check(letter) funksiyasini yozing: letter \"A\", \"E\", \"I\", \"O\" yoki \"U\" bo'lsa \"Unli\", aks holda \"Undosh\" so'zini qaytaring.",
    starterCode: `function check(letter) {\n  // shu yerga if / else yozing\n\n}\n`,
    tests: [
      { input: "A", expected: "Unli" },
      { input: "B", expected: "Undosh" },
      { input: "O", expected: "Unli" },
      { input: "K", expected: "Undosh" },
    ],
  },
  "terminal-openoffice-6": {
    title: "Soatni tekshirish",
    prompt:
      "check(hour) funksiyasini yozing: hour 12 dan kichik bo'lsa \"Ertalab\", 12 dan katta yoki teng va 18 dan kichik bo'lsa \"Kunduzi\", aks holda \"Kechqurun\" so'zini qaytaring.",
    starterCode: `function check(hour) {\n  // shu yerga if / else yozing\n\n}\n`,
    tests: [
      { input: 9, expected: "Ertalab" },
      { input: 15, expected: "Kunduzi" },
      { input: 20, expected: "Kechqurun" },
      { input: 12, expected: "Kunduzi" },
    ],
  },
  "terminal-server-control": {
    title: "Juft yoki toq",
    prompt:
      "check(n) funksiyasini yozing: n juft son bo'lsa \"Juft\", aks holda \"Toq\" so'zini qaytaring.",
    starterCode: `function check(n) {\n  // shu yerga if / else yozing\n\n}\n`,
    tests: [
      { input: 4, expected: "Juft" },
      { input: 7, expected: "Toq" },
      { input: 0, expected: "Juft" },
      { input: 15, expected: "Toq" },
    ],
  },
  "terminal-meeting-screen": {
    title: "Baho tekshirish",
    prompt:
      "check(ball) funksiyasini yozing: ball 60 dan katta yoki teng bo'lsa \"O'tdi\", aks holda \"Yiqildi\" so'zini qaytaring.",
    starterCode: `function check(ball) {\n  // shu yerga if / else yozing\n\n}\n`,
    tests: [
      { input: 45, expected: "Yiqildi" },
      { input: 60, expected: "O'tdi" },
      { input: 99, expected: "O'tdi" },
      { input: 59, expected: "Yiqildi" },
    ],
  },
  "terminal-break-kiosk": {
    title: "Harorat tekshirish",
    prompt:
      "check(temp) funksiyasini yozing: temp 30 dan katta bo'lsa \"Issiq\", aks holda \"Salqin\" so'zini qaytaring.",
    starterCode: `function check(temp) {\n  // shu yerga if / else yozing\n\n}\n`,
    tests: [
      { input: 35, expected: "Issiq" },
      { input: 20, expected: "Salqin" },
      { input: 31, expected: "Issiq" },
      { input: 30, expected: "Salqin" },
    ],
  },
  "terminal-server-2": {
    title: "Diapazon tekshirish",
    prompt:
      "check(n) funksiyasini yozing: n 10 dan 20 gacha (ikkalasi ham kiradi) bo'lsa \"Diapazonda\", aks holda \"Tashqarida\" so'zini qaytaring.",
    starterCode: `function check(n) {\n  // shu yerga if / else yozing\n\n}\n`,
    tests: [
      { input: 15, expected: "Diapazonda" },
      { input: 10, expected: "Diapazonda" },
      { input: 20, expected: "Diapazonda" },
      { input: 21, expected: "Tashqarida" },
    ],
  },
  "terminal-meeting-2": {
    title: "Eng katta son",
    prompt:
      "check(pair) funksiyasini yozing: pair — [a, b] ko'rinishidagi massiv. Ikkalasidan kattasini qaytaring.",
    starterCode: `function check(pair) {\n  const [a, b] = pair;\n  // shu yerga if / else yozing\n\n}\n`,
    tests: [
      { input: [4, 9], expected: 9 },
      { input: [12, 3], expected: 12 },
      { input: [7, 7], expected: 7 },
      { input: [-2, 5], expected: 5 },
    ],
  },
  "terminal-break-2": {
    title: "Bo'sh matn tekshirish",
    prompt:
      "check(text) funksiyasini yozing: text bo'sh qator (\"\") bo'lsa \"Bo'sh\", aks holda \"To'ldirilgan\" so'zini qaytaring.",
    starterCode: `function check(text) {\n  // shu yerga if / else yozing\n\n}\n`,
    tests: [
      { input: "", expected: "Bo'sh" },
      { input: "salom", expected: "To'ldirilgan" },
      { input: " ", expected: "To'ldirilgan" },
      { input: "a", expected: "To'ldirilgan" },
    ],
  },
};

export function getTaskForId(id) {
  return TASKS_BY_ID[id] || DEFAULT_TASK;
}
