/**
 * Park terminals ask for a CSS rule instead of a JS function: the player
 * writes a `.box { ... }` block and Run checks specific declarations
 * (border color, background color, whether it's a square) rather than
 * calling a function — see engine/systems/CodeChecker.js's runCssTask.
 */

const starter = `.box {\n  /* shu yerga CSS yozing */\n\n}\n`;

export const PARK_TASKS_BY_ID = {
  "terminal-park-1": {
    type: "css",
    theme: "park",
    title: "Qizil chegarali kvadrat",
    prompt: '.box uchun CSS yozing: border rangi qizil (red), background rangi qora (black), va u kvadrat bo\'lsin (width === height).',
    starterCode: starter,
    checks: [
      { property: "border-color", expected: "red", label: "border rangi" },
      { property: "background-color", expected: "black", label: "background rangi" },
      { property: "square", expected: true, label: "kvadrat shakl" },
    ],
  },
  "terminal-park-2": {
    type: "css",
    theme: "park",
    title: "Ko'k fon",
    prompt: ".box uchun CSS yozing: background rangi ko'k (blue) bo'lsin va u kvadrat bo'lsin.",
    starterCode: starter,
    checks: [
      { property: "background-color", expected: "blue", label: "background rangi" },
      { property: "square", expected: true, label: "kvadrat shakl" },
    ],
  },
  "terminal-park-3": {
    type: "css",
    theme: "park",
    title: "Chegarasi bor element",
    prompt: ".box uchun CSS yozing: chegara (border) qo'shing (masalan: border: 2px solid white;) va background rangi qora bo'lsin.",
    starterCode: starter,
    checks: [
      { property: "has-border", expected: true, label: "border mavjud" },
      { property: "background-color", expected: "black", label: "background rangi" },
    ],
  },
  "terminal-park-4": {
    type: "css",
    theme: "park",
    title: "Sariq kvadrat",
    prompt: ".box uchun CSS yozing: background rangi sariq (yellow), u kvadrat bo'lsin.",
    starterCode: starter,
    checks: [
      { property: "background-color", expected: "yellow", label: "background rangi" },
      { property: "square", expected: true, label: "kvadrat shakl" },
    ],
  },
  "terminal-park-5": {
    type: "css",
    theme: "park",
    title: "Yashil chegara, oq fon",
    prompt: ".box uchun CSS yozing: border rangi yashil (green), background rangi oq (white).",
    starterCode: starter,
    checks: [
      { property: "border-color", expected: "green", label: "border rangi" },
      { property: "background-color", expected: "white", label: "background rangi" },
    ],
  },
  "terminal-park-6": {
    type: "css",
    theme: "park",
    title: "To'q sariq kvadrat",
    prompt: ".box uchun CSS yozing: background rangi to'q sariq (orange) bo'lsin va u kvadrat bo'lsin (width va height teng bo'lsin).",
    starterCode: starter,
    checks: [
      { property: "background-color", expected: "orange", label: "background rangi" },
      { property: "square", expected: true, label: "kvadrat shakl" },
    ],
  },
  "terminal-park-7": {
    type: "css",
    theme: "park",
    title: "Binafsha chegara",
    prompt: ".box uchun CSS yozing: border rangi binafsha (purple) bo'lsin va chegara albatta mavjud bo'lsin.",
    starterCode: starter,
    checks: [
      { property: "border-color", expected: "purple", label: "border rangi" },
      { property: "has-border", expected: true, label: "border mavjud" },
    ],
  },
  "terminal-park-8": {
    type: "css",
    theme: "park",
    title: "Kulrang kvadrat quti",
    prompt: ".box uchun CSS yozing: background rangi kulrang (gray) bo'lsin, u kvadrat bo'lsin.",
    starterCode: starter,
    checks: [
      { property: "background-color", expected: "gray", label: "background rangi" },
      { property: "square", expected: true, label: "kvadrat shakl" },
    ],
  },
  "terminal-park-9": {
    type: "css",
    theme: "park",
    title: "Pushti fon, qora chegara",
    prompt: ".box uchun CSS yozing: background rangi pushti (pink), border rangi qora (black) bo'lsin.",
    starterCode: starter,
    checks: [
      { property: "background-color", expected: "pink", label: "background rangi" },
      { property: "border-color", expected: "black", label: "border rangi" },
    ],
  },
  "terminal-park-10": {
    type: "css",
    theme: "park",
    title: "Ko'k chegarali kvadrat",
    prompt: ".box uchun CSS yozing: border rangi ko'k (blue), va u kvadrat bo'lsin.",
    starterCode: starter,
    checks: [
      { property: "border-color", expected: "blue", label: "border rangi" },
      { property: "square", expected: true, label: "kvadrat shakl" },
    ],
  },
  "terminal-park-11": {
    type: "css",
    theme: "park",
    title: "Qora quti, oq chegara",
    prompt: ".box uchun CSS yozing: background rangi qora (black), border rangi oq (white) bo'lsin.",
    starterCode: starter,
    checks: [
      { property: "background-color", expected: "black", label: "background rangi" },
      { property: "border-color", expected: "white", label: "border rangi" },
    ],
  },
  "terminal-park-12": {
    type: "css",
    theme: "park",
    title: "Yakuniy terminal — to'liq quti",
    prompt: ".box uchun CSS yozing: border rangi qizil (red), background rangi yashil (green), va u kvadrat bo'lsin.",
    starterCode: starter,
    checks: [
      { property: "border-color", expected: "red", label: "border rangi" },
      { property: "background-color", expected: "green", label: "background rangi" },
      { property: "square", expected: true, label: "kvadrat shakl" },
    ],
  },
};

export function getParkTaskForId(id) {
  return PARK_TASKS_BY_ID[id] || PARK_TASKS_BY_ID["terminal-park-1"];
}
